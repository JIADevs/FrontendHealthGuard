import { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated from "react-native-reanimated";
import { useRoute, useNavigation } from "@react-navigation/native";

import { useMedicationIntakeIntent } from "../hooks/useMedicationIntakeIntent";
import { useDailyCheckInIntent } from "../hooks/useDailyCheckInIntent";
import type { AgendaRouteParams } from "../navigation/RootNavigator";
import { notify } from "../lib/notify";
import { useTakeDose } from "../components/agenda/useTakeDose";

import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  SkeletonGroup,
  SkeletonCard,
  useSkeletonVisible,
  HeluAgendaCalendar,
  SegmentedControl,
  useFadeThrough,
  nativeFont,
  resolveCycleForDay,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

import {
  DailyCheckInForm,
  WellbeingTab,
  AgendaFAB,
  AgendaAddSheet,
  MedicationIntakeModal,
  AppointmentsTab,
  MedicationsTab,
  type AgendaView,
} from "../components/agenda";
import type { AgendaEvent } from "@helu/ui";

// ─── helpers ──────────────────────────────────────────────────────────────────

const AGENDA_TABS: { value: AgendaView; label: string }[] = [
  { value: "calendar", label: "Calendario" },
  { value: "appointments", label: "Citas" },
  { value: "medications", label: "Medicamentos" },
  { value: "wellbeing", label: "Bienestar" },
];

function isAgendaView(value: string | undefined): value is AgendaView {
  return (
    value === "calendar" ||
    value === "appointments" ||
    value === "medications" ||
    value === "wellbeing"
  );
}

// ─── main screen ──────────────────────────────────────────────────────────────

export function AgendaScreen() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const route = useRoute();
  const navigation = useNavigation();
  const params = (route.params ?? {}) as AgendaRouteParams;
  const [view, setView] = useState<AgendaView>("calendar");
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [checkInFormOpen, setCheckInFormOpen] = useState(false);
  const [intentIntakeEvent, setIntentIntakeEvent] = useState<
    Extract<AgendaEvent, { type: "medication" }> | null
  >(null);
  const lastHandledIntentAt = useRef<number | null>(null);

  const intentAt = params.intentAt;
  const intentActive =
    typeof intentAt === "number" && intentAt !== lastHandledIntentAt.current;

  const medicationIntentEnabled =
    intentActive && params.intent === "medication-intake";
  const checkInIntentEnabled =
    intentActive && params.intent === "daily-checkin";

  const medicationIntent = useMedicationIntakeIntent({
    enabled: medicationIntentEnabled,
    medicationId: params.medicationId,
    cycleId: params.cycleId,
    scheduledTime: params.scheduledTime,
    medicationName: params.medicationName,
  });
  const checkInIntent = useDailyCheckInIntent(checkInIntentEnabled);

  useEffect(() => {
    if (isAgendaView(params.initialTab)) {
      setView(params.initialTab);
    }
  }, [params.initialTab]);

  useEffect(() => {
    if (!medicationIntentEnabled || !intentAt) return;

    if (medicationIntent.status === "missing-fields" || medicationIntent.status === "error") {
      lastHandledIntentAt.current = intentAt;
      setView("medications");
      return;
    }
    if (medicationIntent.status === "ready" && medicationIntent.event) {
      lastHandledIntentAt.current = intentAt;
      setView("calendar");
      setIntentIntakeEvent(medicationIntent.event);
    }
  }, [medicationIntentEnabled, medicationIntent, intentAt]);

  useEffect(() => {
    if (!checkInIntentEnabled || !intentAt) return;

    if (checkInIntent.status === "form") {
      lastHandledIntentAt.current = intentAt;
      setView("calendar");
      setCheckInFormOpen(true);
      return;
    }
    if (checkInIntent.status === "already-done" || checkInIntent.status === "error") {
      lastHandledIntentAt.current = intentAt;
      setView("wellbeing");
    }
  }, [checkInIntentEnabled, checkInIntent, intentAt]);

  const tabFade = useFadeThrough(view, { fullView: true });
  const intentLoading =
    (medicationIntentEnabled && medicationIntent.status === "loading") ||
    (checkInIntentEnabled && checkInIntent.status === "loading");

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Mockup «Agenda»: título H1 y las 4 pestañas siempre visibles (control segmentado). */}
      <View style={styles.header}>
        <Text style={styles.title} accessibilityRole="header">Agenda</Text>
        <SegmentedControl
          accessibilityLabel="Vista de la agenda"
          options={AGENDA_TABS}
          value={view}
          onChange={(next) => {
            if (isAgendaView(next)) setView(next);
          }}
        />
      </View>

      {/* Pestañas internas: fade through, sale en 100 ms y entra en 250 ms subiendo 4 px (§3). */}
      <Animated.View style={[styles.tabContent, tabFade.style]}>
      {intentLoading ? (
        // Abriendo desde una notificación: esqueleto de la lista del día mientras se prepara la hoja.
        <SkeletonGroup label="Abriendo la toma" style={styles.skeletonList}>
          <SkeletonCard tile={false} edge action />
          <SkeletonCard tile={false} edge />
          <SkeletonCard tile={false} edge />
        </SkeletonGroup>
      ) : tabFade.shown === "calendar" ? (
        <CalendarTab
          intentIntakeEvent={intentIntakeEvent}
          onIntentIntakeConsumed={() => setIntentIntakeEvent(null)}
        />
      ) : tabFade.shown === "appointments" ? (
        <AppointmentsTab />
      ) : tabFade.shown === "medications" ? (
        <MedicationsTab />
      ) : (
        <WellbeingTab />
      )}
      </Animated.View>

      {view === "calendar" && !intentLoading ? (
        <>
          <AgendaFAB onPress={() => setAddSheetOpen(true)} />

          <AgendaAddSheet
            visible={addSheetOpen}
            onClose={() => setAddSheetOpen(false)}
            onAddAppointment={() => navigation.navigate("AppointmentForm" as never)}
            onAddMedication={() => navigation.navigate("MedicationForm" as never)}
            onAddTask={() => navigation.navigate("AgendaTaskForm" as never)}
            onAddCheckIn={() => setCheckInFormOpen(true)}
          />

          {checkInFormOpen ? (
            <DailyCheckInForm onClose={() => setCheckInFormOpen(false)} />
          ) : null}
        </>
      ) : null}

    </SafeAreaView>
  );
}

// ─── calendar tab ─────────────────────────────────────────────────────────────

function CalendarTab({
  intentIntakeEvent,
  onIntentIntakeConsumed,
}: {
  intentIntakeEvent: Extract<AgendaEvent, { type: "medication" }> | null;
  onIntentIntakeConsumed: () => void;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const navigation = useNavigation();
  const [intakeEvent, setIntakeEvent] = useState<Extract<AgendaEvent, { type: "medication" }> | null>(null);
  const [checkInEvent, setCheckInEvent] = useState<Extract<AgendaEvent, { type: "checkin" }> | null>(null);
  const takeDose = useTakeDose();

  useEffect(() => {
    if (intentIntakeEvent) {
      setIntakeEvent(intentIntakeEvent);
      onIntentIntakeConsumed();
    }
  }, [intentIntakeEvent, onIntentIntakeConsumed]);

  return (
    <View style={styles.tabContent}>
      <HeluAgendaCalendar
        onMedicationPress={setIntakeEvent}
        onAppointmentPress={(event) =>
          (navigation as { navigate: (name: string, params: { id: string }) => void }).navigate(
            "AppointmentDetail",
            { id: event.data.id },
          )
        }
        onCheckInPress={setCheckInEvent}
        onTaskPress={(event) =>
          (navigation as { navigate: (name: string, params: { id: string }) => void }).navigate(
            "AgendaTaskDetail",
            { id: event.data.id },
          )
        }
        onMedicationTake={(event) => {
          const cycle = resolveCycleForDay(event.data, event.dayKey);
          if (!cycle) {
            notify({ tone: "error", message: "No encontramos el ciclo de esta toma" });
            return;
          }
          takeDose.take(cycle.id);
        }}
        onTaskComplete={(event) =>
          (navigation as { navigate: (name: string, params: { id: string; intent: "complete" }) => void }).navigate(
            "AgendaTaskDetail",
            { id: event.data.id, intent: "complete" },
          )
        }
        takingCycleId={takeDose.takingCycleId}
      />

      {intakeEvent ? (
        <MedicationIntakeModal event={intakeEvent} onClose={() => setIntakeEvent(null)} />
      ) : null}

      {checkInEvent ? (
        <DailyCheckInForm
          onClose={() => setCheckInEvent(null)}
          initialValues={checkInEvent.data}
        />
      ) : null}
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:          { flex: 1, backgroundColor: t.surface.bg },
    // Mockup: cabecera sobre el fondo de pantalla, H1 Nunito 900 26 y el segmentado debajo.
    header:             {
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[3],
      gap: spacing[3],
      backgroundColor: t.surface.bg,
    },
    title:              { fontSize: 26, lineHeight: 30, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    tabContent:         { flex: 1 },
    skeletonList:       { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[3] },
    center:{ flex: 1, alignItems: "center", justifyContent: "center", gap: spacing[3], padding: spacing[6] },
    iconBtn:            { width: 34, height: 34, borderRadius: radii.sm, alignItems: "center", justifyContent: "center", backgroundColor: t.surface.bg },

    fieldLabel:         { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.primary, marginBottom: spacing[2] },
    errorText:          { color: t.status.errorFg, fontSize: fontSize.sm, marginTop: spacing[3], backgroundColor: t.status.errorBg, padding: spacing[3], borderRadius: radii.sm },
    retryText:          { color: t.brand.fg, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, marginTop: spacing[2] },
    typeRow:            { flexDirection: "row", gap: spacing[2] },
    typePill:           { flex: 1, paddingVertical: spacing[2], borderRadius: radii.md, alignItems: "center", backgroundColor: t.surface.bg, borderWidth: 1, borderColor: t.border.medium },
    typePillActive:     { backgroundColor: t.brand.fg, borderColor: t.brand.fg },
    typePillText:       { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: t.text.secondary },
    typePillTextActive: { color: colors.white },
  });
}
