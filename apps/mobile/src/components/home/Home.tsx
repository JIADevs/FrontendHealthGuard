import { useState } from "react";
import { ScrollView, StatusBar, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMissionsOverviewQuery, type Document } from "@helu/api";
import {
  PullRefreshIndicator,
  Skeleton,
  SkeletonGroup,
  contentEntering,
  nativeFont,
  resolveCycleForDay,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
} from "@helu/ui";
import type { AgendaEvent } from "@helu/ui";
import { notify } from "../../lib/notify";
import { DailyCheckInForm, MedicationIntakeModal } from "../agenda";
import { useTakeDose } from "../agenda/useTakeDose";
import { eventSlotIso } from "../agenda/doseRowState";
import { HomeHeader } from "./HomeHeader";
import { HomeGreeting, homeBlockLayout } from "./HomeGreeting";
import { HomeCard } from "./HomeCard";
import { SeeAllLink } from "./SeeAllLink";
import { TodayMedsCard } from "./TodayMedsCard";
import { StreakCard } from "./StreakCard";
import { QuickActions } from "./QuickActions";
import { UpcomingAppointmentsCard } from "./UpcomingAppointmentsCard";
import { RecentDocumentsCard } from "./RecentDocumentsCard";
import { SetupChecklist, type SetupStepKey } from "./SetupChecklist";
import { useHomeData } from "./useHomeData";
import { LoadError } from "../states/LoadError";
import { HomeMissionCard } from "../missions/HomeMissionCard";

type MedicationEvent = Extract<AgendaEvent, { type: "medication" }>;

/** Todo lo que Inicio abre. La pantalla lo llena con React Navigation (regla 4.7). */
export interface HomeNavigation {
  notifications: () => void;
  appointments: () => void;
  openAppointment: (id: string) => void;
  documents: () => void;
  openDocument: (doc: Document) => void;
  upload: () => void;
  scan: () => void;
  share: () => void;
  newMedication: () => void;
  newAppointment: () => void;
  /** Opens the mission on its next step (bloque 4, «Continuar la misión»). */
  openMission: (missionId: string, stepKey: string) => void;
}

/**
 * Inicio v2 (inicio-agenda.md · Inicio, mockups «Inicio», «primer uso», «todo al día»).
 * Orden fijo: saludo → medicamentos de hoy (o la lista de primer uso) → racha
 * → misión activa → acciones rápidas → próximas citas → documentos recientes. Sin misión en curso,
 * el bloque 4 no se muestra.
 */
export function Home({ nav }: { nav: HomeNavigation }) {
  const t = useAppTheme();
  const insets = useSafeAreaInsets();
  const data = useHomeData();
  const missionOverview = useMissionsOverviewQuery();
  const nextMissionStep = missionOverview.data?.nextStep ?? null;
  const takeDose = useTakeDose();
  const [doseSheet, setDoseSheet] = useState<MedicationEvent | null>(null);
  const [checkInOpen, setCheckInOpen] = useState(false);

  // Primer uso: hasta saber si va la lista «Empieza en 4 pasos» solo hay un esqueleto, en el primer
  // lugar; las listas que el primer uso oculta no muestran esqueleto para luego desaparecer.
  const medsSkeleton = useSkeletonVisible(data.loading.meds || !data.setupKnown);
  const streakSkeleton = useSkeletonVisible(data.loading.streak);
  const hideEmptyLists = !data.setupKnown || data.showSetup;
  const apptsSkeleton = useSkeletonVisible(data.loading.appointments && data.setupKnown);
  const docsSkeleton = useSkeletonVisible(data.loading.documents && data.setupKnown);

  // Solo el gesto de tirar muestra la píldora; las recargas en segundo plano no (§6c).
  const pull = usePullRefresh(() => Promise.all([data.refetch(), missionOverview.refetch()]), data.updatedAt);

  const take = (event: MedicationEvent) => {
    const cycle = resolveCycleForDay(event.data, event.dayKey);
    if (!cycle) {
      notify({ tone: "error", message: "No encontramos el ciclo de esta toma" });
      return;
    }
    takeDose.take(cycle.id, eventSlotIso(event));
  };

  const onSetupStep = (step: SetupStepKey) => {
    if (step === "medication") nav.newMedication();
    else if (step === "appointment") nav.newAppointment();
    else nav.upload();
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.surface.bg }}>
      <StatusBar barStyle={t.mode === "dark" ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing[2], paddingHorizontal: spacing[4], paddingBottom: spacing[6], gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={pull.refreshControl}
        onScroll={pull.onScroll}
        scrollEventThrottle={16}
      >
        <HomeHeader unread={data.unread} onNotifications={nav.notifications} />
        {data.failed ? (
          <Animated.View entering={contentEntering}>
            <LoadError title="No se pudo cargar tu día" onRetry={() => void data.refetch()} retrying={data.retrying} />
          </Animated.View>
        ) : (
          <>
            <HomeGreeting {...data.greeting} />

            {data.showSetup ? (
              <Animated.View entering={contentEntering} layout={homeBlockLayout}>
                <SetupChecklist state={data.setupState} onStep={onSetupStep} onHide={data.hideSetup} />
              </Animated.View>
            ) : null}

            {medsSkeleton && !data.showSetup ? (
              <MedsSkeleton />
            ) : medsSkeleton || (data.showSetup && data.todayMeds.length === 0) ? null : (
              <Animated.View entering={contentEntering} layout={homeBlockLayout}>
                <TodayMedsCard
                  events={data.todayMeds}
                  takenCount={data.takenCount}
                  takingCycleId={takeDose.takingCycleId ?? null}
                  takingScheduledTime={takeDose.takingScheduledTime ?? null}
                  onOpenDose={setDoseSheet}
                  onTake={take}
                />
              </Animated.View>
            )}

            {streakSkeleton ? (
              <StreakSkeleton />
            ) : (
              <Animated.View entering={contentEntering} layout={homeBlockLayout}>
                <StreakCard
                  current={data.streak.current}
                  longest={data.streak.longest}
                  week={data.week}
                  doneToday={data.doneToday}
                  confirmedToday={data.streak.confirmedToday}
                  onCheckIn={() => setCheckInOpen(true)}
                  celebrateKey={data.celebrateKey}
                />
              </Animated.View>
            )}

            {nextMissionStep ? (
              <Animated.View entering={contentEntering} layout={homeBlockLayout}>
                <HomeMissionCard step={nextMissionStep} onContinue={() => nav.openMission(nextMissionStep.missionId, nextMissionStep.stepKey)} />
              </Animated.View>
            ) : null}

            <Animated.View layout={homeBlockLayout}>
              <QuickActions onUpload={nav.upload} onScan={nav.scan} onShare={nav.share} />
            </Animated.View>

            {apptsSkeleton ? (
              <ListSkeleton title="Próximas citas" seeAll="Ver todas" label="Cargando próximas citas" />
            ) : hideEmptyLists && data.upcomingAppointments.length === 0 ? null : (
              <Animated.View entering={contentEntering} layout={homeBlockLayout}>
                <UpcomingAppointmentsCard appointments={data.upcomingAppointments} onOpen={nav.openAppointment} onSeeAll={nav.appointments} />
              </Animated.View>
            )}

            {docsSkeleton ? (
              <ListSkeleton title="Documentos recientes" seeAll="Ver todos" label="Cargando documentos recientes" />
            ) : hideEmptyLists && data.recentDocuments.length === 0 ? null : (
              <Animated.View entering={contentEntering} layout={homeBlockLayout}>
                <RecentDocumentsCard documents={data.recentDocuments} onOpen={nav.openDocument} onSeeAll={nav.documents} />
              </Animated.View>
            )}
          </>
        )}
      </ScrollView>
      <PullRefreshIndicator state={pull} top={insets.top} />

      {doseSheet ? <MedicationIntakeModal event={doseSheet} onClose={() => setDoseSheet(null)} /> : null}
      {checkInOpen ? <DailyCheckInForm onClose={() => setCheckInOpen(false)} /> : null}
    </View>
  );
}

// ─── Esqueletos (§6c, m8 · Inicio) ──────────────────────────────────────────

/**
 * Medicamentos de hoy: título real y el bloque del chip «1 de 2»; filas con las medidas de
 * `MedicationDoseListItem` (12 px arriba y abajo, divisor entre filas) y el bloque de su estado.
 */
function MedsSkeleton() {
  const t = useAppTheme();
  return (
    <HomeCard title="Medicamentos de hoy" right={<Skeleton width={52} height={26} radius={13} />}>
      <SkeletonGroup label="Cargando medicamentos de hoy">
        {[0, 1].map((i) => (
          <View
            key={i}
            style={[
              { flexDirection: "row", alignItems: "center", gap: spacing[3], paddingVertical: spacing[3] },
              i === 0 && { borderBottomWidth: 1, borderBottomColor: t.border.light },
            ]}
          >
            <Skeleton width={40} height={40} radius={13} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="45%" height={14} />
              <Skeleton width="55%" height={12} />
            </View>
            <Skeleton width={84} height={i === 0 ? 44 : 30} radius={i === 0 ? 14 : 15} />
          </View>
        ))}
      </SkeletonGroup>
    </HomeCard>
  );
}

function StreakSkeleton() {
  const t = useAppTheme();
  return (
    <HomeCard>
      <SkeletonGroup label="Cargando tu racha" style={{ gap: spacing[4] }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[4] }}>
          <Skeleton width={56} height={56} radius={18} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="45%" height={24} />
            <Skeleton width="60%" height={12} />
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {/* The week letters are fixed (Monday to Sunday, like the card): real from the start. */}
          {["L", "M", "M", "J", "V", "S", "D"].map((letter, i) => (
            <View key={i} style={{ alignItems: "center", gap: 6 }}>
              <Skeleton width={34} height={34} radius={17} />
              <Text style={{ fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.secondary }}>{letter}</Text>
            </View>
          ))}
        </View>
        <Skeleton height={48} radius={14} />
      </SkeletonGroup>
    </HomeCard>
  );
}

/** Próximas citas / Documentos recientes: título y «Ver todas» reales (no vienen del servidor), filas de `HomeRow`. */
function ListSkeleton({ title, seeAll, label }: { title: string; seeAll: string; label: string }) {
  return (
    <HomeCard title={title} right={<SeeAllLink label={seeAll} onPress={() => undefined} />}>
      <SkeletonGroup label={label} style={{ gap: spacing[3] }}>
        {[0, 1].map((i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 }}>
            <Skeleton width={40} height={40} radius={13} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="65%" height={13} />
              <Skeleton width="45%" height={11} />
            </View>
          </View>
        ))}
      </SkeletonGroup>
    </HomeCard>
  );
}
