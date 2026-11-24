import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  missionQK,
  useLinkMissionDocumentMutation,
  useUnlinkMissionDocumentMutation,
  useCompleteMissionStepMutation,
  useMissionQuery,
  useSkipMissionStepMutation,
  type Mission,
  type MissionStep,
} from "@helu/api";
import {
  Chip,
  PullRefreshIndicator,
  Skeleton,
  SkeletonGroup,
  contentEntering,
  nativeFont,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
} from "@helu/ui";
import { notify } from "../../lib/notify";
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
import { MissionTimeline } from "./MissionTimeline";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { missionGoal, missionTypeLabel, missionTypeTone, nextActionLabel } from "./missionCopy";

export interface MissionDetailProps {
  missionId: string;
  /** Open this step's sheet on arrival (from «Tu próximo paso» or a push). */
  openStep?: string;
  onSchedule: (mission: Mission) => void;
  /** A session in «Tus sesiones» opens its appointment. */
  onOpenAppointment: (appointmentId: string) => void;
  /** «Adjuntar documento»: open the picker, the scanner or the upload form (RF-61). */
  onAttach: (mode: AttachMode, missionId: string, stepKey?: string) => void;
  /** «Crear enlace y QR»: continue in Compartir, step 2 (RF-63). */
  onShare: (target: ShareTarget) => void;
  onOpenDocument: (documentId: string, title: string) => void;
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
  onOpenAppointment,
  onAttach,
  onShare,
  onOpenDocument,
  onBack,
}: MissionDetailProps) {
  const t = useAppTheme();
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
  /** «Adjuntar documento» sheet; `stepKey` when it came from a step. */
  const [attachFor, setAttachFor] = useState<{ stepKey?: string } | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
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
  const applicable = mission?.steps.filter((s) => s.applies) ?? [];
  const finalKey = applicable[applicable.length - 1]?.key;

  const onFail = (retry: () => void) =>
    notify({ tone: "error", message: "No se pudo guardar", action: { label: "Reintentar", onPress: retry } });

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
          notify({ message: "¡Misión completada!", description: next.title });
        } else if (!isFinal) {
          notify(stepToast(step.key, data, next));
        }
      },
      onError: () => onFail(() => runComplete(step, data)),
      onSettled: () => setClosingKey(null),
    });
  };

  const runSkip = (step: MissionStep, reason: "not_applicable" | "no_authorization_needed" | "nothing_to_save") => {
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
            notify({ message: "¡Misión completada!", description: next.title });
          } else {
            notify({ message: `Listo. Sigue: ${nextActionLabel(next.nextAction)}` });
          }
        },
        onError: () => onFail(() => runSkip(step, reason)),
        onSettled: () => setClosingKey(null),
      },
    );
  };

  const progress = mission ? mission.progress : null;
  const ratio = progress?.total ? progress.completed / progress.total : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: t.surface.bg }]} edges={["top"]}>
      <ScreenHeader title="Misión" onBack={onBack} />
      {showSkeleton ? (
        <SkeletonGroup label="Cargando la misión" style={styles.content}>
          <Skeleton width="100%" height={150} radius={18} />
          <Skeleton width="100%" height={320} radius={18} />
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
              <Animated.View
                entering={FadeIn}
                style={[
                  styles.fill,
                  {
                    width: `${Math.max(ratio, 0.08) * 100}%`,
                    backgroundColor: mission.status === "paused" ? t.text.muted : t.status.successGraphic,
                  },
                ]}
              />
            </View>
            )}
            <Text style={[styles.meta, { color: t.text.secondary }]}>
              {mission.status === "completed"
                ? "Cumpliste el objetivo."
                : mission.status === "paused"
                  ? "Pausada. Tu cita y tus documentos siguen igual."
                  : `Sigue: ${nextActionLabel(mission.nextAction)}`}
            </Text>
          </Animated.View>

          <MissionTimeline mission={mission} onOpenStep={(s) => setSheetKey(s.key)} />

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
            openAppointment: onOpenAppointment,
            attach: (step) => setAttachFor({ stepKey: step.key }),
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
    </SafeAreaView>
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
