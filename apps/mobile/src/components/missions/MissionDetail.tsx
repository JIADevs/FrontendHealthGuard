import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { MoreHorizontal, Route, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  missionQK,
  useCancelMissionMutation,
  useLinkMissionDocumentMutation,
  usePauseMissionMutation,
  useResumeMissionMutation,
  useUnlinkMissionDocumentMutation,
  useCompleteMissionStepMutation,
  useMissionQuery,
  useSkipMissionStepMutation,
  useUserProgressQuery,
  type Mission,
  type MissionStep,
} from "@helu/api";
import {
  Chip,
  ConfirmModal,
  IconButton,
  motionEasing,
  PullRefreshIndicator,
  Skeleton,
  SkeletonGroup,
  contentEntering,
  nativeFont,
  spacing,
  useAppTheme,
  usePullRefresh,
  useReducedMotion,
  useSkeletonVisible,
} from "@helu/ui";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { MissionEditSheet } from "./MissionEditSheet";
import { MissionOptionsSheet, type MissionOption } from "./MissionOptionsSheet";
import { useRecentlySaved } from "../../lib/recentlySaved";
import type { ShareTarget } from "../share/ShareSetup";
import { MissionAttachSheet, type AttachMode } from "./MissionAttachSheet";
import { MissionDocumentsCard } from "./MissionDocumentsCard";
import { MissionShareSheet } from "./MissionShareSheet";
import { useMissionDocuments, type MissionDocumentView } from "./missionDocuments";
import { ScreenHeader } from "../ScreenHeader";
import { LoadError } from "../states/LoadError";
import { useIsOnline } from "../states/OfflineBanner";
import { MissionStepSheet } from "./MissionStepSheet";
import { StepTaskSheet } from "./StepTaskSheet";
import { MissionLink } from "./MissionLink";
import { MissionTimeline } from "./MissionTimeline";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { Flame } from "../home/Flame";
import { documentOriginPhrase, missionGoal, missionTypeLabel, missionTypeTone, nextActionLabel, originPhrase } from "./missionCopy";

export interface MissionDetailProps {
  missionId: string;
  /** Open this step's sheet on arrival (from «Tu próximo paso» or a push). */
  openStep?: string;
  onSchedule: (mission: Mission) => void;
  /** «Agregarlo a tus medicamentos»: the medication form, linked to this mission. */
  onAddMedication: (mission: Mission) => void;
  /** A session in «Tus sesiones» opens its appointment. */
  onOpenAppointment: (appointmentId: string) => void;
  /** «Adjuntar documento»: open the picker, the scanner or the upload form (RF-61). */
  onAttach: (mode: AttachMode, missionId: string, stepKey?: string) => void;
  /** «Crear enlace y QR»: continue in Compartir, step 2 (RF-63). */
  onShare: (target: ShareTarget) => void;
  onOpenDocument: (documentId: string, title: string) => void;
  /** «Ver historial» from the «⋯» menu. */
  onOpenHistory: (missionId: string) => void;
  /** The server closed the mission (DU-17): the celebration takes over (RF-50). */
  onCompleted: (mission: Mission) => void;
  /** «Surgió de…»: the mission this one came from (RF-55). */
  onOpenMission: (missionId: string) => void;
  onBack?: () => void;
}

/** Toast after a saved step. A receipt that is not complete keeps the step: say what was kept (RF-37). */
function stepToast(key: string, data: Record<string, unknown> | undefined, next: Mission) {
  if (key === "receipt" && data?.status === "partial") {
    return { message: "Guardamos lo que falta", description: "Tu misión sigue activa hasta que recibas todo." };
  }
  if (key === "receipt" && data?.status === "not_yet") return { message: "Listo, te esperamos" };
  if (key === "sessions_count" && data?.total == null) return { message: "Listo, puedes registrarlo después" };
  return { message: `¡Listo! Sigue: ${nextActionLabel(next.nextAction)}` };
}

const OFFLINE = { tone: "warning" as const, message: "Sin conexión", description: "Revisa tu conexión y vuelve a intentarlo." };

/**
 * Detalle de misión (mockups «Detalle de misión», «Misión de cita · detalle»): objetivo, progreso y la
 * línea de tiempo v2.16. Los pasos se guardan al tocar y vuelven atrás con «Reintentar» si fallan
 * (DU-6, RNF-10); el paso final espera al servidor porque cierra la misión. Sin red, nada cambia (DU-7).
 */
export function MissionDetail({
  missionId,
  openStep,
  onSchedule,
  onAddMedication,
  onOpenAppointment,
  onAttach,
  onShare,
  onOpenDocument,
  onOpenHistory,
  onCompleted,
  onOpenMission,
  onBack,
}: MissionDetailProps) {
  const t = useAppTheme();
  const progressData = useUserProgressQuery().data;
  // Kit `fchip`: the streak chip of the mission header; hidden with «Mostrar racha y nivel» off (RF-93).
  const streakDays = progressData?.showProgress ? progressData.streak.current : 0;
  const online = useIsOnline();
  const query = useMissionQuery(missionId);
  const complete = useCompleteMissionStepMutation();
  const skip = useSkipMissionStepMutation();
  const showSkeleton = useSkeletonVisible(query.isLoading);
  const qc = useQueryClient();
  // Refresh the whole missions family: the list and «Tu próximo paso» show this mission too.
  const pull = usePullRefresh(() => qc.invalidateQueries({ queryKey: missionQK.all() }), query.dataUpdatedAt || undefined);
  const mission = query.data;
  const [sheetKey, setSheetKey] = useState<string | null>(null);
  const [closingKey, setClosingKey] = useState<string | null>(null);
  const link = useLinkMissionDocumentMutation();
  const unlink = useUnlinkMissionDocumentMutation();
  const documents = useMissionDocuments(mission);
  // A mission born from an order or an authorization (origin «document»): its first document is that one.
  const originDocument =
    mission?.origin === "document"
      ? [...(mission.documents ?? [])].sort((a, b) => (a.addedAt ?? "").localeCompare(b.addedAt ?? ""))[0]
      : undefined;
  /** «Adjuntar documento» sheet; `stepKey` when it came from a step. */
  const [attachFor, setAttachFor] = useState<{ stepKey?: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  /** «Crear recordatorio» from a step (RF-27). */
  const [reminderFor, setReminderFor] = useState<string | null>(null);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const pauseMission = usePauseMissionMutation();
  const resumeMission = useResumeMissionMutation();
  const cancelMission = useCancelMissionMutation();
  /** Step the server just confirmed: the timeline plays «paso completado» for it (movimiento §6). */
  const [confirmedKey, setConfirmedKey] = useState<string | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  /** Node pulse + rail + unlock end at ~1,1 s; the toast comes in after, not at the same time (§2). */
  const afterSequence = (fn: () => void, ms = 750) => {
    timers.current.push(setTimeout(fn, ms));
  };
  const confirmStep = (key: string) => {
    setConfirmedKey(key);
    haptics.success();
    afterSequence(() => setConfirmedKey((k) => (k === key ? null : k)), 1500);
  };
  /**
   * «Cambiar» on an attached document (B2): once a new document lands in that step, the old one leaves
   * it (it stays in Documentos). Expires so a later, unrelated attach never removes it.
   */
  const replacing = useRef<{ stepKey: string; oldId: string; before: string[]; until: number } | null>(null);
  useEffect(() => {
    const r = replacing.current;
    if (!r) return;
    if (Date.now() > r.until) {
      replacing.current = null;
      return;
    }
    const arrived = documents.some((d) => d.stepKey === r.stepKey && !r.before.includes(d.id));
    if (arrived && documents.some((d) => d.id === r.oldId)) {
      replacing.current = null;
      unlink.mutate({ missionId, documentId: r.oldId });
    }
  }, [documents]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Set before leaving to attach: on return, link an upload and reopen the step it came from. */
  const resume = useRef<{ stepKey?: string; reopen: boolean } | null>(null);

  useFocusEffect(
    useCallback(() => {
      const r = resume.current;
      if (!r) return;
      resume.current = null;
      // The picker links what it adds itself; an upload or a scan comes back here to be linked.
      const uploaded = useRecentlySaved.getState().takeUploaded();
      if (uploaded) {
        link.mutate(
          { missionId, documentId: uploaded, stepKey: r.stepKey },
          {
            onSuccess: () => notify({ message: "Documento adjuntado" }),
            onError: () => notify({ tone: "error", message: "No se pudo adjuntar", description: "Está en Documentos: elígelo desde «Adjuntar»." }),
          },
        );
      }
      if (r.reopen && r.stepKey) setSheetKey(r.stepKey);
    }, [missionId]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const startAttach = (mode: AttachMode, stepKey?: string) => {
    if (!online) return notify(OFFLINE);
    resume.current = { stepKey, reopen: !!stepKey && mission?.status === "active" };
    // Drop an upload saved earlier from anywhere else: only one made from here gets linked.
    useRecentlySaved.getState().takeUploaded();
    onAttach(mode, missionId, stepKey);
  };

  const removeDocument = (doc: MissionDocumentView) => {
    if (!online) return notify(OFFLINE);
    unlink.mutate(
      { missionId, documentId: doc.id },
      {
        onSuccess: () =>
          notify({
            message: "Documento quitado de la misión",
            description: "Sigue en Documentos.",
            action: { label: "Deshacer", onPress: () => link.mutate({ missionId, documentId: doc.id, stepKey: doc.stepKey ?? undefined }) },
          }),
        onError: () => notify({ tone: "error", message: "No se pudo quitar", action: { label: "Reintentar", onPress: () => removeDocument(doc) } }),
      },
    );
  };

  // From «Tu próximo paso» or a deep link: open that step once the mission is here.
  useEffect(() => {
    if (openStep && mission && mission.status === "active") setSheetKey(openStep);
  }, [openStep, mission?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const sheetStep = useMemo(() => mission?.steps.find((s) => s.key === sheetKey) ?? null, [mission, sheetKey]);
  const reminderStep = useMemo(() => mission?.steps.find((s) => s.key === reminderFor) ?? null, [mission, reminderFor]);
  const applicable = mission?.steps.filter((s) => s.applies) ?? [];
  const finalKey = applicable[applicable.length - 1]?.key;

  const onFail = (retry: () => void) => {
    haptics.error();
    notify({ tone: "error", message: "No se pudo guardar", action: { label: "Reintentar", onPress: retry } });
  };

  const runComplete = (step: MissionStep, data?: Record<string, unknown>) => {
    if (!mission) return;
    if (!online) return notify(OFFLINE);
    const isFinal = step.key === finalKey;
    if (isFinal) setClosingKey(step.key);
    const vars = { missionId: mission.id, stepKey: step.key, data };
    complete.mutate(vars, {
      onSuccess: (next) => {
        if (next.status === "completed") {
          setSheetKey(null);
          onCompleted(next);
        } else if (!isFinal) {
          const done = next.steps.find((s) => s.key === step.key)?.status === "completed";
          if (done) {
            confirmStep(step.key);
            afterSequence(() => notify(stepToast(step.key, data, next)));
          } else {
            notify(stepToast(step.key, data, next));
          }
        }
      },
      onError: () => onFail(() => runComplete(step, data)),
      onSettled: () => setClosingKey(null),
    });
  };

  const runSkip = (step: MissionStep, reason: NonNullable<MissionStep["skipReason"]>) => {
    if (!mission) return;
    if (!online) return notify(OFFLINE);
    // «Omitir» on the final step closes the mission: it waits for the server (DU-17).
    const isFinal = step.key === finalKey;
    if (isFinal) setClosingKey(step.key);
    skip.mutate(
      { missionId: mission.id, stepKey: step.key, reason },
      {
        onSuccess: (next) => {
          if (next.status === "completed") {
            setSheetKey(null);
            onCompleted(next);
          } else {
            confirmStep(step.key);
            afterSequence(() => notify({ message: `Listo. Sigue: ${nextActionLabel(next.nextAction)}` }));
          }
        },
        onError: () => onFail(() => runSkip(step, reason)),
        onSettled: () => setClosingKey(null),
      },
    );
  };

  const transition = (
    run: typeof pauseMission,
    done: { message: string; description?: string },
  ) => {
    if (!mission) return;
    if (!online) return notify(OFFLINE);
    run.mutate(mission.id, {
      onSuccess: () => {
        haptics.light();
        notify(done);
      },
      onError: () => {
        haptics.error();
        notify({ tone: "error", message: "No se pudo guardar", description: "Revisa tu conexión e intenta de nuevo." });
      },
    });
  };

  const chooseOption = (option: MissionOption) => {
    if (!mission) return;
    if (option === "share") setShareOpen(true);
    else if (option === "history") onOpenHistory(mission.id);
    else if (option === "edit") setEditOpen(true);
    else if (option === "pause") transition(pauseMission, { message: "Misión pausada", description: "La retomas cuando quieras." });
    else if (option === "resume") transition(resumeMission, { message: "Misión reanudada", description: "Sigues donde la dejaste." });
    else if (option === "cancel") setConfirmCancel(true);
  };

  const progress = mission ? mission.progress : null;
  const ratio = progress?.total ? progress.completed / progress.total : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top"]}>
      <ScreenHeader
        title="Misión"
        onBack={onBack}
        right={
          mission ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing[1] }}>
              {streakDays > 0 ? (
                <View accessible accessibilityLabel={`${streakDays} ${streakDays === 1 ? "día" : "días"} de racha`}>
                  <Chip label={String(streakDays)} tone="streak" icon={<Flame size={15} />} />
                </View>
              ) : null}
              <IconButton
                icon={<MoreHorizontal size={20} strokeWidth={2.4} color={t.text.primary} />}
                accessibilityLabel="Opciones de la misión"
                onPress={() => setOptionsOpen(true)}
              />
            </View>
          ) : null
        }
      />
      {showSkeleton ? (
        // §6c «Detalle de misión»: header (type, goal, bar) and 4 steps with their node.
        <SkeletonGroup label="Cargando la misión" style={styles.content}>
          <View style={[styles.head, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
            <View style={styles.headTop}>
              <Skeleton width={150} height={26} radius={999} />
              <View style={{ flex: 1 }} />
              <Skeleton width={90} height={26} radius={999} />
            </View>
            <Skeleton width="70%" height={20} />
            <Skeleton width="45%" height={14} />
            <Skeleton width="100%" height={10} radius={5} />
            <Skeleton width="45%" height={12} />
          </View>
          <View style={[styles.head, { backgroundColor: t.surface.bgCard, borderColor: t.border.default, gap: 26 }]}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{ width: 40, alignItems: "center" }}>
                  <Skeleton width={30} height={30} radius={15} />
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width="70%" height={14} />
                  <Skeleton width="45%" height={12} />
                </View>
              </View>
            ))}
          </View>
        </SkeletonGroup>
      ) : query.isError || !mission ? (
        <View style={styles.content}>
          <LoadError title="No se pudo cargar la misión" onRetry={() => void query.refetch()} retrying={query.isFetching} />
        </View>
      ) : (
        <View style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={pull.refreshControl}
          onScroll={pull.onScroll}
          scrollEventThrottle={16}
        >
          <Animated.View entering={contentEntering} style={[styles.head, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
            <View style={styles.headTop}>
              <Chip
                label={missionTypeLabel[mission.type]}
                tone={missionTypeTone[mission.type]}
                icon={<MissionTypeIcon type={mission.type} size={12} color={t.text.secondary} />}
              />
              <View style={{ flex: 1 }} />
              {mission.status === "paused" ? (
                <Chip label="Pausada" tone="neutral" />
              ) : (
                <Chip
                  label={
                    progress?.unit === "sessions"
                      ? progress.total
                        ? `${progress.completed} de ${progress.total} sesiones`
                        : "Total pendiente"
                      : `${progress?.completed ?? 0} de ${progress?.total ?? 0} pasos`
                  }
                  tone="neutral"
                />
              )}
            </View>
            <Text style={[styles.goal, { color: t.text.primary }]}>
              {mission.status === "completed" ? "¡Misión completada!" : missionGoal[mission.type]}
            </Text>
            <Text style={[styles.sub, { color: t.text.secondary }]}>{mission.title}</Text>
            {/* Therapy without a total has no progress to show (RF-40, mockup «Misión de terapia»). */}
            {progress?.unit === "sessions" && !progress.total ? null : (
            <View style={[styles.track, { backgroundColor: t.motivation.track }]}>
              {/* The bar never starts empty (misiones.md v2 · Progreso). */}
              <ProgressFill ratio={Math.max(ratio, 0.08)} color={mission.status === "paused" ? t.text.muted : t.status.successGraphic} />
            </View>
            )}
            <Text style={[styles.meta, { color: t.text.secondary }]}>
              {mission.status === "completed"
                ? "Cumpliste el objetivo."
                : mission.status === "paused"
                  ? "Pausada. Tu cita y tus documentos siguen igual."
                  : `Sigue: ${nextActionLabel(mission.nextAction)}`}
            </Text>
            {mission.parentMission ? (
              // RF-55 (v2.17 · Encabezado): «Surgió de tu cita de ortopedia ›».
              <MissionLink
                icon={<Route size={14} strokeWidth={2.4} color={t.brand.text} />}
                label={`Surgió de ${originPhrase(mission.parentMission)}`}
                onPress={() => onOpenMission(mission.parentMission!.id)}
              />
            ) : originDocument ? (
              // Mockup 4c «D6»: «Surgió de tu orden médica ›» opens the document (RF-68).
              <MissionLink
                icon={<Route size={14} strokeWidth={2.4} color={t.brand.text} />}
                label={`Surgió de ${documentOriginPhrase(originDocument.stepKey === "authorization" ? "eps_authorization" : "medical_order")}`}
                onPress={() => onOpenDocument(originDocument.id, originDocument.title)}
              />
            ) : null}
          </Animated.View>

          <MissionTimeline
            mission={mission}
            onOpenStep={(s) => setSheetKey(s.key)}
            confirmedKey={confirmedKey}
            onResume={() => transition(resumeMission, { message: "Misión reanudada", description: "Sigues donde la dejaste." })}
          />

          {mission.status === "canceled" ? null : (
            <MissionDocumentsCard
              documents={documents}
              onAttach={() => setAttachFor({})}
              onShare={() => setShareOpen(true)}
              onOpen={(id) => onOpenDocument(id, documents.find((d) => d.id === id)?.title ?? "")}
              onRemove={removeDocument}
            />
          )}
        </ScrollView>
        <PullRefreshIndicator state={pull} />
        </View>
      )}

      {mission && sheetStep ? (
        <MissionStepSheet
          mission={mission}
          step={sheetStep}
          closing={closingKey === sheetStep.key}
          stepDocuments={documents.filter((d) => d.stepKey === sheetStep.key)}
          onClose={() => setSheetKey(null)}
          actions={{
            complete: runComplete,
            skip: runSkip,
            schedule: () => onSchedule(mission),
            addMedication: () => onAddMedication(mission),
            openAppointment: onOpenAppointment,
            attach: (step) => setAttachFor({ stepKey: step.key }),
            addReminder: (step) => setReminderFor(step.key),
            replace: (step, documentId) => {
              replacing.current = {
                stepKey: step.key,
                oldId: documentId,
                before: documents.filter((d) => d.stepKey === step.key).map((d) => d.id),
                until: Date.now() + 5 * 60_000,
              };
              setAttachFor({ stepKey: step.key });
            },
          }}
        />
      ) : null}

      {mission && reminderStep ? (
        <StepTaskSheet
          mission={mission}
          step={reminderStep}
          onClose={() => {
            // Back to the step it came from: the new reminder shows there (mockup «Paso con tarea de apoyo»).
            const key = reminderStep.key;
            setReminderFor(null);
            if (mission.status === "active") setSheetKey(key);
          }}
        />
      ) : null}

      {mission && attachFor ? (
        <MissionAttachSheet
          onClose={() => setAttachFor(null)}
          onChoose={(mode) => {
            const stepKey = attachFor.stepKey;
            setAttachFor(null);
            startAttach(mode, stepKey);
          }}
        />
      ) : null}

      {mission && shareOpen ? (
        <MissionShareSheet
          mission={mission}
          documents={documents}
          onClose={() => setShareOpen(false)}
          onContinue={() => {
            setShareOpen(false);
            if (!online) return notify(OFFLINE);
            onShare({ kind: "mission", missionId: mission.id, name: `${mission.title} · documentos`, documents });
          }}
        />
      ) : null}
      {mission && optionsOpen ? (
        <MissionOptionsSheet
          mission={mission}
          canShare={documents.length > 0}
          onClose={() => setOptionsOpen(false)}
          onChoose={(option) => {
            setOptionsOpen(false);
            chooseOption(option);
          }}
        />
      ) : null}

      {mission && editOpen ? <MissionEditSheet mission={mission} onClose={() => setEditOpen(false)} /> : null}

      {mission && confirmCancel ? (
        // Mockup «¿Cancelar la misión?»: the safe option first, with its own name (MASTER §7, DU-24).
        <ConfirmModal
          title="¿Cancelar la misión?"
          message="Queda en tu historial como cancelada. Tu cita, tus documentos y tus tareas no se borran."
          keepLabel="Mantener misión"
          icon={<X />}
          confirmLabel="Cancelar misión"
          confirmVariant="danger"
          loading={cancelMission.isPending}
          onConfirm={() =>
            cancelMission.mutate(mission.id, {
              onSuccess: () => {
                setConfirmCancel(false);
                haptics.light();
                notify({ message: "Misión cancelada", description: "Queda en tu historial." });
              },
              onError: () => {
                haptics.error();
                notify({ tone: "error", message: "No se pudo cancelar", description: "Revisa tu conexión e intenta de nuevo." });
              },
            })
          }
          onCancel={() => setConfirmCancel(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}

/**
 * Progress fill (movimiento §6c «Anillos y barras»): grows from 0 the first time the screen opens
 * (600 ms, `scaleX` from the left: transform only, §8); later changes do not animate.
 */
function ProgressFill({ ratio, color }: { ratio: number; color: string }) {
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) grow.value = withTiming(1, { duration: 600, easing: motionEasing.out });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));
  return (
    <Animated.View
      style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: color, transformOrigin: "left" }, animated]}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { gap: spacing[3], paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[12] },
  head: { gap: 8, padding: spacing[4], borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  headTop: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  goal: { fontSize: 19, lineHeight: 24, fontFamily: nativeFont("heading", 900) },
  sub: { fontSize: 14, lineHeight: 20, fontFamily: nativeFont("body", 400) },
  track: { height: 10, borderRadius: 5, overflow: "hidden" },
  fill: { height: 10, borderRadius: 5 },
  meta: { fontSize: 13, fontFamily: nativeFont("body", 400) },
});
