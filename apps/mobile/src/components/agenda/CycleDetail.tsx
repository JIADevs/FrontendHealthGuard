import { Fragment, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Edit, Trash2, X } from "lucide-react-native";
import {
  Chip,
  ConfirmModal,
  DangerLink,
  IconButton,
  IconTile,
  NOT_TAKEN_REASON_LABELS_ES,
  Skeleton,
  SkeletonGroup,
  Button,
  contentEntering,
  formatClock,
  formatShortDay,
  fontSize,
  nativeFont,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import {
  useDeleteMedicationCycleMutation,
  useMedicationByIdQuery,
  useTreatmentsQuery,
  useUpdateMedicationCycleMutation,
} from "@helu/api/hooks";
import type { MedicationCycle, MedicationIntake } from "@helu/api";
import { ScreenHeader } from "../ScreenHeader";
import { ProgressRing } from "../home/ProgressRing";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { cycleDoseAmount, cycleFrequencyText, reminderText } from "./medicationFormat";
import { doseStateForCycle } from "./doseRowState";
import {
  CYCLE_STATUS_CHIP,
  cycleDayProgress,
  cycleStatus,
  formatCycleEnd,
  formatCycleRange,
  formatNextDose,
  isCycleActive,
} from "./medicationCycles";

export interface CycleDetailProps {
  cycleId: string;
  medicationId: string;
  medicationName: string;
  /** Opens the cycle in the medication form */
  onEdit: () => void;
  /** Leaves the detail (back, or after the cycle is deleted) */
  onBack: () => void;
}

function localTodayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** «Hoy 7:02 a. m.», «Ayer 7:10 p. m.», «Dom 1 nov 7:05 p. m.» */
function formatIntakeWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = new Date(d);
  day.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - day.getTime()) / 86_400_000);
  const label = diff === 0 ? "Hoy" : diff === 1 ? "Ayer" : formatShortDay(d);
  return `${label} ${formatClock(d)}`;
}

/**
 * Mockup «Detalle de ciclo» (v2): «Ciclo» header with the medication and «Editar»; a card with the
 * green ring (day / total), the status chip, the dates and the next dose; the cycle data as a list;
 * «Historial de tomas»; and, alone at the end, «Finalizar ciclo» (or «Eliminar ciclo» once it ended)
 * as a red link that asks first, with the safe option first.
 */
export function CycleDetail({ cycleId, medicationId, medicationName, onEdit, onBack }: CycleDetailProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const { data: med, isLoading } = useMedicationByIdQuery(medicationId);
  const showSkeleton = useSkeletonVisible(isLoading);
  const treatments = useTreatmentsQuery(1, 100).data?.items ?? [];
  const updateMut = useUpdateMedicationCycleMutation();
  const deleteMut = useDeleteMedicationCycleMutation();
  const [confirm, setConfirm] = useState<"finish" | "delete" | null>(null);

  const cycle = med?.cycles.find((c: MedicationCycle) => c.id === cycleId);

  if (showSkeleton) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Ciclo" subtitle={medicationName} />
        <SkeletonGroup label="Cargando el ciclo" style={styles.content}>
          <View style={[styles.card, styles.summaryRow]}>
            <Skeleton width={76} height={76} radius={38} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton width={72} height={24} radius={12} />
              <Skeleton width="60%" height={16} />
              <Skeleton width="50%" height={13} />
            </View>
          </View>
          <View style={styles.card}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} height={14} />
            ))}
          </View>
        </SkeletonGroup>
      </SafeAreaView>
    );
  }

  if (!cycle) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <ScreenHeader title="Ciclo" subtitle={medicationName} />
        <View style={styles.centered}>
          <Text style={styles.h3}>No encontramos este ciclo</Text>
          <Text style={[styles.sub, styles.center]}>Puede que lo hayan eliminado.</Text>
          <Button variant="secondary" onPress={onBack}>
            Volver al medicamento
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const active = isCycleActive(cycle);
  const status = cycleStatus(cycle);
  const progress = cycleDayProgress(cycle);
  const next = active ? formatNextDose(cycle.nextIntakeTime) : "";
  // A dose whose time already passed is overdue, not «next» (same wording as the list and the detail).
  const nextLabel = doseStateForCycle(cycle).kind === "pending" ? "Toma pendiente" : "Próxima toma";
  const treatmentNames = treatments.filter((tr) => cycle.treatmentIds?.includes(tr.id)).map((tr) => tr.name);

  const rows: { label: string; value: string }[] = [
    { label: "Dosis", value: cycleDoseAmount(cycle) },
    { label: "Frecuencia", value: cycleFrequencyText(cycle) },
    ...(cycle.concentration ? [{ label: "Concentración", value: cycle.concentration }] : []),
    ...(cycle.reason ? [{ label: "Razón / indicación", value: cycle.reason }] : []),
    ...(treatmentNames.length ? [{ label: "Tratamiento", value: treatmentNames.join(", ") }] : []),
    { label: "Recordatorio", value: reminderText(cycle.reminderOffsets) },
    ...(cycle.price != null ? [{ label: "Precio", value: `$ ${Number(cycle.price).toLocaleString("es-CO")}` }] : []),
  ];

  const intakes = [...(cycle.intakes ?? [])].sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime));

  const finish = () =>
    updateMut.mutate(
      { id: cycleId, cycle: { endDate: localTodayKey() } },
      {
        onSuccess: () => {
          setConfirm(null);
          haptics.success();
          notify({ message: "Ciclo finalizado", description: medicationName });
        },
        onError: () => {
          setConfirm(null);
          notify({
            tone: "error",
            message: "No se pudo finalizar el ciclo",
            description: "Revisa tu conexión e intenta de nuevo.",
            action: { label: "Reintentar", onPress: finish },
          });
        },
      },
    );

  const remove = () =>
    deleteMut.mutate(cycleId, {
      onSuccess: () => {
        setConfirm(null);
        notify({ message: "Ciclo eliminado", description: medicationName });
        onBack();
      },
      onError: () => {
        setConfirm(null);
        notify({
          tone: "error",
          message: "No se pudo eliminar el ciclo",
          description: "Revisa tu conexión e intenta de nuevo.",
          action: { label: "Reintentar", onPress: remove },
        });
      },
    });

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <ScreenHeader
        title="Ciclo"
        subtitle={medicationName}
        right={<IconButton icon={<Edit size={17} color={t.text.onMuted} />} accessibilityLabel="Editar ciclo" onPress={onEdit} />}
      />

      <Animated.ScrollView entering={contentEntering} contentContainerStyle={styles.content}>
        <View style={[styles.card, styles.summaryRow]}>
          <ProgressRing size={76} progress={progress.ratio ?? (active ? 0 : 1)}>
            <Text style={styles.ringText}>{progress.total != null ? `${progress.day}/${progress.total}` : `Día ${progress.day}`}</Text>
          </ProgressRing>
          <View style={styles.summaryCopy}>
            <Chip label={CYCLE_STATUS_CHIP[status].label} tone={CYCLE_STATUS_CHIP[status].tone} />
            <Text style={styles.h3}>{formatCycleRange(cycle)}</Text>
            <Text style={styles.sub}>{active ? (next ? `${nextLabel}: ${next}` : "Sin tomas pendientes") : formatCycleEnd(cycle)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {rows.map((row, i) => (
            <Fragment key={row.label}>
              {i > 0 ? <View style={styles.divider} /> : null}
              <View style={styles.dataRow}>
                <Text style={styles.dataLabel}>{row.label}</Text>
                <Text style={styles.dataValue}>{row.value}</Text>
              </View>
            </Fragment>
          ))}
          {cycle.notes ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.dataLabel}>Notas</Text>
              <Text style={styles.sub}>{cycle.notes}</Text>
            </>
          ) : null}
        </View>

        <Text style={styles.h3} accessibilityRole="header">
          Historial de tomas
        </Text>
        <View style={styles.card}>
          {intakes.length === 0 ? (
            <Text style={styles.sub}>Aún no hay tomas registradas.</Text>
          ) : (
            intakes.map((intake) => <IntakeRow key={intake.id} intake={intake} />)
          )}
        </View>

        <View style={styles.dangerZone}>
          {status === "active" ? (
            <DangerLink label="Finalizar ciclo" icon={<X size={16} color={t.status.errorFg} />} onPress={() => setConfirm("finish")} />
          ) : (
            <DangerLink label="Eliminar ciclo" icon={<Trash2 size={16} color={t.status.errorFg} />} onPress={() => setConfirm("delete")} />
          )}
        </View>
      </Animated.ScrollView>

      {confirm === "finish" ? (
        <ConfirmModal
          title="¿Finalizar ciclo?"
          message="El ciclo termina hoy y dejamos de recordarte las tomas. Seguirás viéndolo en «Anteriores»."
          keepLabel="Mantener ciclo"
          confirmLabel="Finalizar ciclo"
          confirmVariant="danger"
          loading={updateMut.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={finish}
        />
      ) : null}
      {confirm === "delete" ? (
        <ConfirmModal
          title="¿Eliminar ciclo?"
          message="Se borran el ciclo y su historial de tomas. No se puede deshacer."
          keepLabel="Mantener ciclo"
          confirmLabel="Eliminar ciclo"
          confirmVariant="danger"
          loading={deleteMut.isPending}
          onCancel={() => setConfirm(null)}
          onConfirm={remove}
        />
      ) : null}
    </SafeAreaView>
  );
}

function IntakeRow({ intake }: { intake: MedicationIntake }) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const taken = intake.status === "TAKEN";
  const reason = intake.notTakenReason ? NOT_TAKEN_REASON_LABELS_ES[intake.notTakenReason] : null;
  return (
    <View style={styles.intakeRow}>
      <IconTile
        tone={taken ? "success" : "danger"}
        round
        icon={
          taken ? (
            <Check size={18} strokeWidth={3} color={t.status.successFg} />
          ) : (
            <X size={18} strokeWidth={3} color={t.status.errorFg} />
          )
        }
      />
      <View style={styles.summaryCopy}>
        <Text style={styles.rowTitle}>{formatIntakeWhen((taken && intake.takenAt) || intake.scheduledTime)}</Text>
        <Text style={styles.meta}>{taken ? "Tomada" : reason ? `No tomada · ${reason}` : "No tomada"}</Text>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing[3], padding: spacing[6] },
    card: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
      borderRadius: 18,
      borderWidth: 1,
      borderBottomWidth: 4,
      padding: spacing[4],
      gap: spacing[3],
    },
    summaryRow: { flexDirection: "row", alignItems: "center", gap: spacing[4] },
    summaryCopy: { flex: 1, minWidth: 0, gap: 4, alignItems: "flex-start" },
    ringText: { fontSize: 16, fontFamily: nativeFont("heading", 900), color: t.text.primary },
    h3: { fontSize: fontSize.md, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    sub: { fontSize: 14, lineHeight: 21, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    center: { textAlign: "center" },
    divider: { height: 1, backgroundColor: t.border.default },
    dataRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing[3] },
    dataLabel: { fontSize: 14, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    dataValue: { flexShrink: 1, textAlign: "right", fontSize: 15, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    intakeRow: { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    rowTitle: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("body", 600), color: t.text.primary },
    meta: { fontSize: fontSize.sm, lineHeight: 18, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    dangerZone: { alignItems: "center", paddingTop: spacing[2] },
  });
}
