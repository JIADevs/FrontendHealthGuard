import { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import {
  Pill,
  CalendarDays,
  Clock,
  FileText,
  Activity,
  Pencil,
  Trash2,
} from "lucide-react-native";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Spinner,
  ConfirmModal,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useMedicationByIdQuery,
  useUpdateMedicationCycleMutation,
  useDeleteMedicationCycleMutation,
} from "@helu/api/hooks";
import { isApiError, type MedicationCycle } from "@helu/api";
import { DetailHeader } from "../components/DetailHeader";
import { DetailFooter } from "../components/DetailFooter";
import type { FooterAction } from "../components/DetailFooter";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isCycleActive(cycle: MedicationCycle): boolean {
  if (!cycle.endDate) return true;
  return new Date(cycle.endDate) >= new Date();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const DOSE_UNIT_LABELS: Record<string, string> = {
  TABLET: "tableta(s)",
  ML:     "ml",
  DROPS:  "gotas",
  GRAMS:  "gramos",
  MG:     "mg",
  UNITS:  "unidad(es)",
};

function formatFrequency(freq: number, unit: string): string {
  const labels: Record<string, [string, string]> = {
    HOUR:  ["hora",    "horas"],
    DAY:   ["día",     "días"],
    WEEK:  ["semana",  "semanas"],
    MONTH: ["mes",     "meses"],
    YEAR:  ["año",     "años"],
  };
  const [s, p] = labels[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return `cada ${freq} ${freq === 1 ? s : p}`;
}

function formatDose(
  doseAmount: number | null | undefined,
  doseUnit: string | null | undefined,
): string {
  const unitLabel = doseUnit ? (DOSE_UNIT_LABELS[doseUnit] ?? doseUnit.toLowerCase()) : "";
  if (doseAmount != null && unitLabel) return `${doseAmount} ${unitLabel}`;
  if (doseAmount != null) return String(doseAmount);
  return unitLabel;
}

// ─── Info grid (2×2) ─────────────────────────────────────────────────────────

function InfoGrid({
  cycle,
  t,
  styles,
}: {
  cycle: MedicationCycle;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
}) {
  const startTimeStr = cycle.firstIntakeTime
    ? new Date(cycle.firstIntakeTime).toLocaleTimeString("es-CO", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <View style={[styles.infoGrid, { backgroundColor: t.surface.bgCard, borderColor: t.border.light }]}>
      {/* Row 1: Dose | Frequency */}
      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <View style={[styles.gridCellIcon, { backgroundColor: t.accent.medBg }]}>
            <Pill size={14} color={t.accent.medFg} />
          </View>
          <Text style={[styles.gridCellLabel, { color: t.text.muted }]}>Dosis</Text>
          <Text style={[styles.gridCellValue, { color: t.text.primary }]} numberOfLines={2}>
            {formatDose(cycle.doseAmount, cycle.doseUnit) || cycle.dosage}
          </Text>
        </View>

        <View style={[styles.gridVDivider, { backgroundColor: t.border.light }]} />

        <View style={styles.gridCell}>
          <View style={[styles.gridCellIcon, { backgroundColor: t.brand.tint }]}>
            <Activity size={14} color={t.brand.fg} />
          </View>
          <Text style={[styles.gridCellLabel, { color: t.text.muted }]}>Frecuencia</Text>
          <Text style={[styles.gridCellValue, { color: t.text.primary }]} numberOfLines={2}>
            {formatFrequency(cycle.frequency, cycle.frequencyUnit)}
          </Text>
        </View>
      </View>

      <View style={[styles.gridHDivider, { backgroundColor: t.border.light }]} />

      {/* Row 2: Start | End */}
      <View style={styles.gridRow}>
        <View style={styles.gridCell}>
          <View style={[styles.gridCellIcon, { backgroundColor: t.accent.calBg }]}>
            <CalendarDays size={14} color={t.accent.calFg} />
          </View>
          <Text style={[styles.gridCellLabel, { color: t.text.muted }]}>Inicio</Text>
          <Text style={[styles.gridCellValue, { color: t.text.primary }]}>
            {formatDate(cycle.startDate)}
          </Text>
          {startTimeStr ? (
            <Text style={[styles.gridCellSub, { color: t.text.secondary }]}>
              {startTimeStr}
            </Text>
          ) : null}
        </View>

        <View style={[styles.gridVDivider, { backgroundColor: t.border.light }]} />

        <View style={styles.gridCell}>
          <View style={[styles.gridCellIcon, { backgroundColor: t.accent.calBg }]}>
            <CalendarDays size={14} color={t.accent.calFg} />
          </View>
          <Text style={[styles.gridCellLabel, { color: t.text.muted }]}>Fin</Text>
          <Text style={[styles.gridCellValue, { color: t.text.primary }]}>
            {cycle.endDate ? formatDate(cycle.endDate) : "En curso"}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Detail cell ──────────────────────────────────────────────────────────────

function DetailCell({
  label,
  value,
  icon,
}: {
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon: any;
  value: string;
}) {
  const t = useAppTheme();
  return (
    <View style={[cellStyles.cell, { backgroundColor: t.surface.bgCard }]}>
      <Text style={[cellStyles.label, { color: t.text.secondary }]}>{label}</Text>
      <View style={cellStyles.row}>
        <View style={cellStyles.iconWrap}>{icon}</View>
        <Text style={[cellStyles.value, { color: t.text.primary }]} numberOfLines={4}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const cellStyles = StyleSheet.create({
  cell:     { borderRadius: radii.lg, padding: spacing[3], gap: spacing[2] },
  label:    { fontSize: fontSize.xs, fontWeight: fontWeight.medium },
  row:      { flexDirection: "row", alignItems: "center", gap: spacing[2] },
  iconWrap: { width: 20, alignItems: "center" },
  value:    { fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1 },
});

// ─── Screen ──────────────────────────────────────────────────────────────────

export function CycleDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cycleId, medicationId, medicationName } = route.params as {
    cycleId: string;
    medicationId: string;
    medicationName: string;
  };

  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [showFinalize, setShowFinalize] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const { data: med, isLoading } = useMedicationByIdQuery(medicationId);
  const updateMut = useUpdateMedicationCycleMutation();
  const deleteMut = useDeleteMedicationCycleMutation();

  const cycle = med?.cycles.find((c: MedicationCycle) => c.id === cycleId);
  const active = cycle ? isCycleActive(cycle) : false;

  function handleFinalize() {
    const today = new Date().toISOString().slice(0, 10);
    updateMut.mutate(
      { id: cycleId, cycle: { endDate: today } },
      {
        onSuccess: () => {
          setShowFinalize(false);
          Toast.show({ type: "success", text1: "Ciclo finalizado" });
        },
        onError: (err) => {
          setShowFinalize(false);
          Toast.show({
            type: "error",
            text1: "Error al finalizar",
            text2: isApiError(err) ? err.message : "Intenta de nuevo",
          });
        },
      },
    );
  }

  function handleDelete() {
    deleteMut.mutate(cycleId, {
      onSuccess: () => {
        setShowDelete(false);
        Toast.show({ type: "success", text1: "Ciclo eliminado" });
        navigation.goBack();
      },
      onError: (err) => {
        setShowDelete(false);
        Toast.show({
          type: "error",
          text1: "Error al eliminar",
          text2: isApiError(err) ? err.message : "Intenta de nuevo",
        });
      },
    });
  }

  if (isLoading || !cycle) {
    return (
      <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <DetailHeader />
        <View style={styles.centered}>
          {isLoading
            ? <Spinner size="lg" />
            : <Text style={{ color: t.text.secondary }}>Ciclo no encontrado.</Text>}
        </View>
      </SafeAreaView>
    );
  }

  const footerActions: FooterAction[] = [
    {
      label: "Editar",
      variant: "outline",
      icon: <Pencil size={18} color={t.text.primary} />,
      onPress: () =>
        (navigation as any).navigate("MedicationForm", {
          cycleId,
          medicationId,
          medicationName,
        }),
    },
    ...(active
      ? [{
          label: "Finalizar",
          variant: "outline" as const,
          icon: <CalendarDays size={18} color={t.status.warningFg ?? t.text.primary} />,
          onPress: () => setShowFinalize(true),
        }]
      : []),
    {
      label: "Eliminar ciclo",
      variant: "destructive" as const,
      onPress: () => setShowDelete(true),
    },
  ];

  const hasOptionalDetails =
    !!cycle.concentration ||
    (!!cycle.nextIntakeTime && active) ||
    !!cycle.reason ||
    !!cycle.notes;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <DetailHeader
        actions={[
          {
            icon: Pencil,
            label: "Editar",
            onPress: () =>
              (navigation as any).navigate("MedicationForm", {
                cycleId,
                medicationId,
                medicationName,
              }),
          },
          {
            icon: Trash2,
            label: "Eliminar",
            onPress: () => setShowDelete(true),
            destructive: true,
          },
        ]}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Hero: name + status badge only */}
        <View style={[styles.heroCard, { backgroundColor: t.brand.solid }]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIcon, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Pill size={28} color={colors.white} />
            </View>
            <Text style={styles.heroMedName} numberOfLines={2}>{medicationName}</Text>
          </View>
          <View style={styles.heroBadgeRow}>
            <View style={[
              styles.heroBadge,
              { backgroundColor: active ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.18)" },
            ]}>
              <View style={[
                styles.heroBadgeDot,
                { backgroundColor: active ? "#4ade80" : "rgba(255,255,255,0.55)" },
              ]} />
              <Text style={styles.heroBadgeText}>{active ? "Activo" : "Finalizado"}</Text>
            </View>
          </View>
        </View>

        {/* Info grid 2×2: dose | frequency / start | end */}
        <InfoGrid cycle={cycle} t={t} styles={styles} />

        {/* Optional details */}
        {hasOptionalDetails && (
          <>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Detalles</Text>

            {/* Concentration + next intake: 2-column row */}
            {(cycle.concentration || (cycle.nextIntakeTime && active)) && (
              <View style={styles.detailRow}>
                {cycle.concentration ? (
                  <View style={styles.detailHalf}>
                    <DetailCell
                      label="Concentración"
                      value={cycle.concentration}
                      icon={<Pill size={18} color={t.text.secondary} />}
                    />
                  </View>
                ) : null}
                {cycle.nextIntakeTime && active ? (
                  <View style={styles.detailHalf}>
                    <DetailCell
                      label="Próxima toma"
                      value={new Date(cycle.nextIntakeTime).toLocaleString("es-CO", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      icon={<Clock size={18} color={t.text.secondary} />}
                    />
                  </View>
                ) : null}
              </View>
            )}

            {/* Reason and notes: full width */}
            {cycle.reason ? (
              <DetailCell
                label="Razón / indicación"
                value={cycle.reason}
                icon={<FileText size={18} color={t.text.secondary} />}
              />
            ) : null}
            {cycle.notes ? (
              <DetailCell
                label="Notas"
                value={cycle.notes}
                icon={<FileText size={18} color={t.text.secondary} />}
              />
            ) : null}
          </>
        )}

      </ScrollView>

      <DetailFooter actions={footerActions} />

      {showFinalize && (
        <ConfirmModal
          title="Finalizar ciclo"
          message="Se marcará hoy como fecha de fin. Esta acción se puede revertir editando el ciclo."
          confirmLabel="Finalizar"
          loading={updateMut.isPending}
          onConfirm={handleFinalize}
          onCancel={() => setShowFinalize(false)}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title="Eliminar ciclo"
          message={`¿Eliminar este ciclo de ${medicationName}? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          loading={deleteMut.isPending}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    centered:  { flex: 1, justifyContent: "center", alignItems: "center" },
    scroll:    { flex: 1 },
    content:   { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },

    // Hero (slimmed down — no dose/frequency text)
    heroCard:      { borderRadius: radii.xl, padding: spacing[4], gap: spacing[3] },
    heroTop:       { flexDirection: "row", alignItems: "center", gap: spacing[3] },
    heroIcon:      {
      width: 52, height: 52, borderRadius: 26,
      justifyContent: "center", alignItems: "center", flexShrink: 0,
    },
    heroMedName:   { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.white, lineHeight: 26 },
    heroBadgeRow:  { flexDirection: "row", gap: spacing[2] },
    heroBadge:     {
      flexDirection: "row", alignItems: "center", gap: spacing[1],
      paddingHorizontal: spacing[2], paddingVertical: 4, borderRadius: radii.full,
    },
    heroBadgeDot:  { width: 6, height: 6, borderRadius: 3 },
    heroBadgeText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold, color: colors.white },

    // Info grid 2×2
    infoGrid:      { borderRadius: radii.lg, borderWidth: 1, overflow: "hidden" },
    gridRow:       { flexDirection: "row" },
    gridCell:      { flex: 1, padding: spacing[3], gap: 4 },
    gridCellIcon:  {
      width: 28, height: 28, borderRadius: radii.md,
      alignItems: "center", justifyContent: "center",
      marginBottom: spacing[1],
    },
    gridCellLabel: { fontSize: fontSize.xs },
    gridCellValue: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, lineHeight: 18 },
    gridCellSub:   { fontSize: fontSize.xs, lineHeight: 16 },
    gridVDivider:  { width: 1 },
    gridHDivider:  { height: 1 },

    // Optional details
    sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.bold },
    detailRow:    { flexDirection: "row", gap: spacing[2] },
    detailHalf:   { flex: 1 },
  });
}
