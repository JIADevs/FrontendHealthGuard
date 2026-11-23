import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { Activity, CalendarDays, FileText, Heart, Pencil, Pill, Trash2 } from "lucide-react-native";
import type {
  Treatment,
  TreatmentAppointmentRef,
  TreatmentDetail as TreatmentDetailData,
  TreatmentDocumentRef,
  TreatmentMedicationCycleRef,
  TreatmentPage,
} from "@helu/api";
import { useDeleteTreatmentMutation, useTreatmentByIdQuery } from "@helu/api/hooks";
import {
  Button,
  ConfirmModal,
  DangerLink,
  IconButton,
  PullRefreshIndicator,
  Skeleton,
  SkeletonGroup,
  appointmentStatusLabel,
  contentEntering,
  nativeFont,
  spacing,
  useAppTheme,
  usePullRefresh,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonHeaderAction } from "../SkeletonPieces";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { TreatmentCheckIns } from "./TreatmentCheckIns";
import { TreatmentRow, TreatmentSection } from "./TreatmentSection";
import { TreatmentStarterCard } from "./TreatmentStarterCard";
import { TreatmentSummaryCard, TreatmentSummarySkeleton } from "./TreatmentSummaryCard";
import { dayFromDate, dayFromTimestamp, hasNothingLinked, isToday, metaLine, shortDay } from "./treatmentFormat";

export interface TreatmentDetailProps {
  id: string;
  /** Back, «Volver a Tratamientos» (not found) and after deleting it */
  onBack: () => void;
  onEdit: () => void;
  /** «+ Agregar» and the «recién creado» card: each create form opens with this treatment selected */
  onAddMedication: () => void;
  onAddAppointment: () => void;
  onAddDocument: () => void;
  onOpenCycle: (cycle: TreatmentMedicationCycleRef) => void;
  onOpenAppointment: (appointment: TreatmentAppointmentRef) => void;
  onOpenDocument: (document: TreatmentDocumentRef) => void;
}

/**
 * Mockup «Detalle de tratamiento» (m3): «Tratamiento» with «Editar»; the summary card; Medicamentos,
 * Citas y chequeos and Documentos with «+ Agregar»; Check-ins and Síntomas when there are any; and
 * «Eliminar tratamiento» apart at the end (it asks first and waits for the server: there is no undo).
 * With nothing linked it is m9 «Tratamiento · recién creado».
 */
export function TreatmentDetail({
  id,
  onBack,
  onEdit,
  onAddMedication,
  onAddAppointment,
  onAddDocument,
  onOpenCycle,
  onOpenAppointment,
  onOpenDocument,
}: TreatmentDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  // While the delete is on its way the detail query is off and the screen keeps what it showed: the
  // mutation drops this detail from the cache, and fetching it again would only find a 404.
  const [deleting, setDeleting] = useState(false);
  const [kept, setKept] = useState<TreatmentDetailData | null>(null);
  const query = useTreatmentByIdQuery(deleting ? null : id);
  const deleteMut = useDeleteTreatmentMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const pull = usePullRefresh(query.refetch, query.dataUpdatedAt);
  const detail = query.data ?? kept ?? undefined;
  const showSkeleton = useSkeletonVisible(query.isLoading && !kept);

  // The card the user tapped is in the cached list: its name, dates and status draw the summary while
  // the sections load (§6c).
  const queryClient = useQueryClient();
  const cached = useMemo(() => {
    for (const [, data] of queryClient.getQueriesData<TreatmentPage>({ queryKey: ["treatments"] })) {
      const found = data?.items.find((tr) => tr.id === id);
      if (found) return found;
    }
    return undefined;
  }, [queryClient, id]);
  // A summary drawn from the cache is real from the first frame: it does not fade in with the content.
  const [summaryFromCache] = useState(() => query.data === undefined && cached !== undefined);
  // The list cards read this same detail for their chips, so it is usually cached: then the whole
  // screen is real from the first frame and nothing fades in (§6c «con datos en caché»).
  const [openedWithData] = useState(() => query.data !== undefined);
  const summary: Treatment | undefined = detail ?? cached;

  if (!showSkeleton && !detail) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Tratamiento" onBack={onBack} />
        <View style={styles.centered}>
          <Text style={styles.h3} accessibilityRole="header">
            Tratamiento no encontrado
          </Text>
          <Text style={[styles.sub, styles.center]}>Puede que lo hayan eliminado.</Text>
          <Button variant="secondary" onPress={onBack}>
            Volver a Tratamientos
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const nothingLinked = detail ? hasNothingLinked(detail) : false;
  const justCreated = !!detail && nothingLinked && isToday(dayFromTimestamp(detail.createdAt));

  const remove = () => {
    if (!detail) return;
    const name = detail.name;
    setKept(detail);
    setDeleting(true);
    deleteMut.mutate(id, {
      onSuccess: () => {
        setConfirmDelete(false);
        notify({ message: "Tratamiento eliminado", description: name });
        onBack();
      },
      onError: () => {
        setDeleting(false);
        setConfirmDelete(false);
        haptics.error();
        notify({ tone: "error", message: "No se pudo eliminar", description: "Revisa tu conexión e intenta de nuevo." });
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader
        title="Tratamiento"
        onBack={onBack}
        right={
          showSkeleton ? (
            <SkeletonHeaderAction />
          ) : (
            <IconButton icon={<Pencil size={17} color={t.text.onMuted} />} accessibilityLabel="Editar tratamiento" onPress={onEdit} />
          )
        }
      />

      <View style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={pull.refreshControl}
          onScroll={pull.onScroll}
          scrollEventThrottle={16}
        >
          {/* Same place in both states, so the summary from the cache stays put when the sections arrive. */}
          {summary ? (
            <Animated.View entering={summaryFromCache || openedWithData ? undefined : contentEntering}>
              <TreatmentSummaryCard treatment={summary} justCreated={justCreated} />
            </Animated.View>
          ) : null}

          {showSkeleton ? (
            <SkeletonGroup label="Cargando el tratamiento" style={styles.stack}>
              {summary ? null : <TreatmentSummarySkeleton />}
              <SectionSkeleton />
              <SectionSkeleton />
              <SectionSkeleton />
            </SkeletonGroup>
          ) : null}

          {!showSkeleton && detail ? (
            <Animated.View entering={openedWithData ? undefined : contentEntering} style={styles.stack}>
              {nothingLinked ? (
                <TreatmentStarterCard
                  onAddMedication={onAddMedication}
                  onAddAppointment={onAddAppointment}
                  onAddDocument={onAddDocument}
                />
              ) : (
                <>
                  <TreatmentSection title="Medicamentos" icon={Pill} addLabel="Agregar medicamento" onAdd={onAddMedication}>
                    {detail.medicationCycles.map((cycle) => (
                      <TreatmentRow
                        key={cycle.id}
                        icon={Pill}
                        title={cycle.medicationName}
                        meta={cycleMeta(cycle)}
                        onPress={() => onOpenCycle(cycle)}
                      />
                    ))}
                  </TreatmentSection>

                  <TreatmentSection title="Citas y chequeos" icon={CalendarDays} addLabel="Agregar cita" onAdd={onAddAppointment}>
                    {detail.appointments.map((appointment) => (
                      <TreatmentRow
                        key={appointment.id}
                        icon={CalendarDays}
                        title={appointment.name?.trim() || (appointment.type === "EXAM" ? "Examen" : "Cita médica")}
                        meta={appointmentMeta(appointment)}
                        onPress={() => onOpenAppointment(appointment)}
                      />
                    ))}
                  </TreatmentSection>

                  <TreatmentSection title="Documentos" icon={FileText} addLabel="Agregar documento" onAdd={onAddDocument}>
                    {detail.documents.map((document) => (
                      <TreatmentRow
                        key={document.id}
                        icon={FileText}
                        title={document.title}
                        meta={documentMeta(document)}
                        onPress={() => onOpenDocument(document)}
                      />
                    ))}
                  </TreatmentSection>

                  {/* No «Agregar»: the check-in is the daily one, and the app has no screen to log symptoms (decision 7). */}
                  {detail.dailyCheckins.length > 0 ? (
                    <TreatmentSection title="Check-ins" icon={Heart}>
                      <TreatmentCheckIns checkIns={detail.dailyCheckins} />
                    </TreatmentSection>
                  ) : null}

                  {detail.symptoms.length > 0 ? (
                    <TreatmentSection title="Síntomas" icon={Activity}>
                      {detail.symptoms.map((symptom) => {
                        const day = dayFromTimestamp(symptom.recordedAt);
                        return (
                          <TreatmentRow
                            key={symptom.id}
                            icon={Activity}
                            title={symptom.name}
                            meta={metaLine([
                              day ? shortDay(day) : null,
                              symptom.severity != null ? `Intensidad ${symptom.severity} de 10` : null,
                            ])}
                          />
                        );
                      })}
                    </TreatmentSection>
                  ) : null}
                </>
              )}

              <View style={styles.dangerZone}>
                <DangerLink
                  label="Eliminar tratamiento"
                  icon={<Trash2 size={16} color={t.status.errorFg} />}
                  onPress={() => setConfirmDelete(true)}
                />
              </View>
            </Animated.View>
          ) : null}
        </ScrollView>
        <PullRefreshIndicator state={pull} />
      </View>

      {confirmDelete && detail ? (
        <ConfirmModal
          title="¿Eliminar tratamiento?"
          message={`Se borra «${detail.name}». Sus medicamentos, citas y documentos se conservan, pero dejan de estar agrupados. No se puede deshacer.`}
          keepLabel="Mantener tratamiento"
          confirmLabel="Eliminar tratamiento"
          confirmVariant="danger"
          // Both labels are long: one per row, the safe one first and full width.
          icon={<Trash2 size={26} strokeWidth={2.25} color={t.status.errorFg} />}
          iconTone="danger"
          actionsLayout="stacked"
          loading={deleteMut.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      ) : null}
    </SafeAreaView>
  );
}

/** «400 mg · hasta 15 nov» (the API has no frequency for these rows, #35). */
function cycleMeta(cycle: TreatmentMedicationCycleRef): string {
  const end = dayFromDate(cycle.endDate);
  const start = dayFromDate(cycle.startDate);
  return metaLine([cycle.dosage, end ? `hasta ${shortDay(end)}` : start ? `desde ${shortDay(start)}` : null]);
}

/** «12 nov · Programada» (the API has no time, doctor or specialty for these rows, #35). */
function appointmentMeta(appointment: TreatmentAppointmentRef): string {
  const day = dayFromDate(appointment.date);
  return metaLine([day ? shortDay(day) : null, appointment.status ? appointmentStatusLabel(appointment.status) : null]);
}

/** «28 oct»: the document's own date, or the day it was uploaded. */
function documentMeta(document: TreatmentDocumentRef): string {
  const day = dayFromDate(document.documentDate) ?? dayFromTimestamp(document.uploadedAt);
  return day ? shortDay(day) : "";
}

/** A section card while it loads: gray header tile, title, «Agregar» and one row. */
function SectionSkeleton() {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  return (
    <View style={styles.sectionSkeleton}>
      <View style={styles.skeletonHead}>
        <Skeleton width={32} height={32} radius={10} />
        <View style={styles.flex}>
          <Skeleton width={120} height={16} />
        </View>
        <Skeleton width={64} height={14} />
      </View>
      <View style={styles.skeletonRow}>
        <Skeleton width={40} height={40} radius={13} />
        <View style={[styles.flex, { gap: 6 }]}>
          <Skeleton width="65%" height={14} />
          <Skeleton width="40%" height={12} />
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    flex: { flex: 1 },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[10] },
    stack: { gap: spacing[4] },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3], padding: spacing[6] },
    h3: { fontSize: 17, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
    dangerZone: { alignItems: "center", paddingTop: spacing[2] },
    // Kit `.card.tight`, as `TreatmentSection`
    sectionSkeleton: {
      gap: 10,
      padding: 14,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
    },
    skeletonHead: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44 },
    skeletonRow: { flexDirection: "row", alignItems: "center", gap: spacing[3], minHeight: 44, paddingVertical: 2 },
  });
}
