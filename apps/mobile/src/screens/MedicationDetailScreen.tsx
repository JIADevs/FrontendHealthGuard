import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  Pill,
  Plus,
  Pencil,
  Check,
  X,
  Clock,
  CalendarDays,
  CheckCircle,
} from "lucide-react-native";
import {
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  ConfirmModal,
  Spinner,
  EmptyState,
  ActionButton,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useMedicationByIdQuery,
  useUpdateMedicationMutation,
  useUpdateMedicationCycleMutation,
  useDeleteMedicationCycleMutation,
} from "@helu/api/hooks";
import { isApiError, type MedicationCycle } from "@helu/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const DOSE_UNIT_ES: Record<string, string> = {
  TABLET: "tableta(s)",
  ML:     "ml",
  DROPS:  "gotas",
  GRAMS:  "gramos",
  MG:     "mg",
  UNITS:  "unidad(es)",
};

function formatDose(
  amount: number | null | undefined,
  unit: string | null | undefined,
  fallback: string,
): string {
  const label = unit ? (DOSE_UNIT_ES[unit] ?? unit.toLowerCase()) : "";
  if (amount != null && label) return `${amount} ${label}`;
  if (amount != null) return String(amount);
  return fallback;
}

function formatFrequency(freq: number, unit: string): string {
  const labels: Record<string, [string, string]> = {
    HOUR:  ["hora",   "horas"],
    DAY:   ["día",    "días"],
    WEEK:  ["semana", "semanas"],
    MONTH: ["mes",    "meses"],
    YEAR:  ["año",    "años"],
  };
  const [s, p] = labels[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return `Cada ${freq} ${freq === 1 ? s : p}`;
}

function cyclesByNewest(cycles: MedicationCycle[]): MedicationCycle[] {
  return [...cycles].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MedicationDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { id } = route.params as { id: string };
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const { data: med, isLoading } = useMedicationByIdQuery(id);
  const updateMedMut = useUpdateMedicationMutation();
  const updateCycleMut = useUpdateMedicationCycleMutation();
  const deleteCycleMut = useDeleteMedicationCycleMutation();

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [finalizingCycleId, setFinalizingCycleId] = useState<string | null>(null);
  const [deletingCycleId, setDeletingCycleId] = useState<string | null>(null);

  function startEditName() {
    setNameValue(med?.name ?? "");
    setEditingName(true);
  }

  function saveName() {
    if (!nameValue.trim() || !med) return;
    updateMedMut.mutate(
      { id: med.id, name: nameValue.trim() },
      {
        onSuccess: () => {
          setEditingName(false);
          Toast.show({ type: "success", text1: "Nombre actualizado" });
        },
        onError: (err) => {
          Toast.show({
            type: "error",
            text1: "Error al actualizar",
            text2: isApiError(err) ? err.message : "Intenta de nuevo",
          });
        },
      },
    );
  }

  function handleFinalize() {
    if (!finalizingCycleId) return;
    const today = new Date().toISOString().slice(0, 10);
    updateCycleMut.mutate(
      { id: finalizingCycleId, cycle: { endDate: today } },
      {
        onSuccess: () => {
          setFinalizingCycleId(null);
          Toast.show({ type: "success", text1: "Ciclo finalizado" });
        },
        onError: (err) => {
          Toast.show({
            type: "error",
            text1: "Error al finalizar",
            text2: isApiError(err) ? err.message : "Intenta de nuevo",
          });
        },
      },
    );
  }

  function handleDeleteCycle() {
    if (!deletingCycleId) return;
    deleteCycleMut.mutate(deletingCycleId, {
      onSuccess: () => {
        setDeletingCycleId(null);
        Toast.show({ type: "success", text1: "Ciclo eliminado" });
      },
      onError: (err) => {
        Toast.show({
          type: "error",
          text1: "Error al eliminar",
          text2: isApiError(err) ? err.message : "Intenta de nuevo",
        });
      },
    });
  }

  const sorted = useMemo(() => cyclesByNewest(med?.cycles ?? []), [med?.cycles]);
  const activeCycles   = useMemo(() => sorted.filter(isCycleActive), [sorted]);
  const finishedCycles = useMemo(() => sorted.filter((c: MedicationCycle) => !isCycleActive(c)), [sorted]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Compact header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>
        <View style={styles.flex} />
        <TouchableOpacity
          style={styles.addCycleBtn}
          onPress={() =>
            (navigation as any).navigate("MedicationForm", {
              medicationId: id,
              medicationName: med?.name,
            })
          }
        >
          <Plus size={18} color={t.accent.medFg} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <Spinner size="lg" />
        </View>
      ) : (
        <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
          {/* Hero */}
          <View style={[styles.hero, { backgroundColor: t.surface.bgCard, borderColor: t.border.light }]}>
            <View style={[styles.heroIconWrap, { backgroundColor: t.accent.medBg }]}>
              <Pill size={30} color={t.accent.medFg} />
            </View>
            <View style={styles.heroText}>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={[styles.nameInput, { color: t.text.primary, borderColor: t.border.medium }]}
                    value={nameValue}
                    onChangeText={setNameValue}
                    autoFocus
                    returnKeyType="done"
                    onSubmitEditing={saveName}
                  />
                  <TouchableOpacity onPress={saveName} disabled={updateMedMut.isPending}>
                    <Check size={20} color={t.accent.medFg} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditingName(false)}>
                    <X size={20} color={t.text.secondary} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.heroNameRow} onPress={startEditName} activeOpacity={0.7}>
                  <Text style={[styles.heroName, { color: t.text.primary }]} numberOfLines={1}>
                    {med?.name ?? "Medicamento"}
                  </Text>
                  <Pencil size={14} color={t.text.muted} />
                </TouchableOpacity>
              )}
              <Text style={[styles.heroSub, { color: t.text.secondary }]}>
                {activeCycles.length === 0
                  ? "Sin ciclos activos"
                  : `${activeCycles.length} ciclo${activeCycles.length !== 1 ? "s" : ""} activo${activeCycles.length !== 1 ? "s" : ""}`}
              </Text>
            </View>
          </View>

          {/* Cycle list */}
          {sorted.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={48} color={t.border.medium} />}
              message="Este medicamento no tiene ciclos registrados."
            />
          ) : (
            <>
              {activeCycles.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: t.text.muted }]}>ACTIVOS</Text>
                  {activeCycles.map((cycle: MedicationCycle) => (
                    <CycleCard
                      key={cycle.id}
                      cycle={cycle}
                      t={t}
                      styles={styles}
                      onPress={() =>
                        (navigation as any).navigate("CycleDetail", {
                          cycleId: cycle.id,
                          medicationId: id,
                          medicationName: med?.name ?? "",
                        })
                      }
                      onEdit={() =>
                        (navigation as any).navigate("MedicationForm", {
                          cycleId: cycle.id,
                          medicationId: id,
                          medicationName: med?.name ?? "",
                        })
                      }
                      onFinalize={() => setFinalizingCycleId(cycle.id)}
                      onDelete={() => setDeletingCycleId(cycle.id)}
                    />
                  ))}
                </>
              )}

              {finishedCycles.length > 0 && (
                <>
                  <Text style={[styles.sectionLabel, { color: t.text.muted }]}>ANTERIORES</Text>
                  {finishedCycles.map((cycle: MedicationCycle) => (
                    <CycleCard
                      key={cycle.id}
                      cycle={cycle}
                      t={t}
                      styles={styles}
                      onPress={() =>
                        (navigation as any).navigate("CycleDetail", {
                          cycleId: cycle.id,
                          medicationId: id,
                          medicationName: med?.name ?? "",
                        })
                      }
                      onEdit={() =>
                        (navigation as any).navigate("MedicationForm", {
                          cycleId: cycle.id,
                          medicationId: id,
                          medicationName: med?.name ?? "",
                        })
                      }
                      onFinalize={() => setFinalizingCycleId(cycle.id)}
                      onDelete={() => setDeletingCycleId(cycle.id)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </ScrollView>
      )}

      {finalizingCycleId && (
        <ConfirmModal
          title="Finalizar ciclo"
          message="Se marcará hoy como la fecha de fin de este ciclo. Esta acción se puede revertir editando el ciclo."
          confirmLabel="Finalizar"
          loading={updateCycleMut.isPending}
          onConfirm={handleFinalize}
          onCancel={() => setFinalizingCycleId(null)}
        />
      )}

      {deletingCycleId && (
        <ConfirmModal
          title="Eliminar ciclo"
          message="¿Eliminar este ciclo? Esta acción no se puede deshacer."
          confirmLabel="Eliminar"
          loading={deleteCycleMut.isPending}
          onConfirm={handleDeleteCycle}
          onCancel={() => setDeletingCycleId(null)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Cycle card ───────────────────────────────────────────────────────────────

function CycleCard({
  cycle,
  t,
  styles,
  onPress,
  onEdit,
  onFinalize,
  onDelete,
}: {
  key?: string | number;
  cycle: MedicationCycle;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
  onPress: () => void;
  onEdit: () => void;
  onFinalize: () => void;
  onDelete: () => void;
}) {
  const active = isCycleActive(cycle);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[styles.cycleCard, { borderColor: t.border.light }]}
    >
      {/* Accent bar for active cycles */}
      <View
        style={[
          styles.accentBar,
          { backgroundColor: active ? (t.status.successFg ?? t.accent.medFg) : "transparent" },
        ]}
      />

      <View style={styles.cardInner}>
        {/* Header: status badge + action row */}
        <View style={styles.cycleHeader}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: active ? (t.status.successBg ?? t.accent.medBg) : t.surface.bg },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: active ? (t.status.successFg ?? t.accent.medFg) : t.text.muted },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: active ? (t.status.successFg ?? t.accent.medFg) : t.text.muted },
              ]}
            >
              {active ? "Activo" : "Finalizado"}
            </Text>
          </View>

          <View style={styles.actionsRow}>
            <ActionButton action="edit" size="sm" onPress={onEdit} />
            {active && (
              <TouchableOpacity
                style={[styles.finalizeBtn, { backgroundColor: t.status.warningBg ?? "#FFF3CD" }]}
                activeOpacity={0.7}
                onPress={onFinalize}
              >
                <CheckCircle size={14} color={t.status.warningFg ?? "#856404"} strokeWidth={2} />
              </TouchableOpacity>
            )}
            <ActionButton action="delete" size="sm" onPress={onDelete} />
          </View>
        </View>

        {/* Two-column body: dose | dates */}
        <View style={styles.twoCol}>
          {/* Dose */}
          <View style={styles.col}>
            <View style={[styles.colIconBg, { backgroundColor: t.accent.medBg }]}>
              <Pill size={13} color={t.accent.medFg} />
            </View>
            <Text style={[styles.colLabel, { color: t.text.muted }]}>Dosis</Text>
            <Text style={[styles.colValue, { color: t.text.primary }]}>
              {formatDose(cycle.doseAmount, cycle.doseUnit, cycle.dosage)}
            </Text>
            <Text style={[styles.colSub, { color: t.text.secondary }]}>
              {formatFrequency(cycle.frequency, cycle.frequencyUnit)}
            </Text>
          </View>

          <View style={[styles.colDivider, { backgroundColor: t.border.light }]} />

          {/* Dates */}
          <View style={styles.col}>
            <View style={[styles.colIconBg, { backgroundColor: t.accent.calBg }]}>
              <CalendarDays size={13} color={t.accent.calFg} />
            </View>
            <Text style={[styles.colLabel, { color: t.text.muted }]}>Período</Text>
            <Text style={[styles.colValue, { color: t.text.primary }]}>
              {formatDate(cycle.startDate)}
            </Text>
            <Text style={[styles.colSub, { color: t.text.secondary }]}>
              {cycle.endDate ? `hasta ${formatDate(cycle.endDate)}` : "en curso"}
            </Text>
          </View>
        </View>

        {/* Footer: reason, notes, next intake */}
        {(cycle.reason || cycle.notes || (cycle.nextIntakeTime && active)) && (
          <View style={[styles.cardFooter, { borderTopColor: t.border.light }]}>
            {cycle.reason ? (
              <Text style={[styles.footerText, { color: t.text.secondary }]}>{cycle.reason}</Text>
            ) : null}
            {cycle.notes ? (
              <Text style={[styles.footerText, { color: t.text.muted }]}>{cycle.notes}</Text>
            ) : null}
            {cycle.nextIntakeTime && active ? (
              <View style={styles.nextIntakeRow}>
                <Clock size={11} color={t.text.muted} />
                <Text style={[styles.footerText, { color: t.text.muted }]}>
                  {"Próxima toma: "}
                  {new Date(cycle.nextIntakeTime).toLocaleString("es-CO", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    flex:      { flex: 1 },
    center:    { flex: 1, alignItems: "center", justifyContent: "center" },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    backBtn: { width: 36, alignItems: "center" },
    addCycleBtn: {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: t.accent.medBg,
      alignItems: "center",
      justifyContent: "center",
    },

    // Scroll content
    content: { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[8] },

    // Hero card
    hero: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[4],
      padding: spacing[4],
      borderRadius: radii.xl,
      borderWidth: 1,
    },
    heroIconWrap: {
      width: 60,
      height: 60,
      borderRadius: radii.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    heroText:    { flex: 1, gap: spacing[1] },
    heroNameRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    heroName:    { flex: 1, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
    heroSub:     { fontSize: fontSize.sm },
    nameEditRow: { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    nameInput: {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      borderWidth: 1,
      borderRadius: radii.sm,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
    },

    // Section label
    sectionLabel: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.bold,
      letterSpacing: 0.8,
      marginTop: spacing[1],
    },

    // Cycle card
    cycleCard: {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      overflow: "hidden",
      flexDirection: "row",
    },
    accentBar: { width: 4 },
    cardInner: { flex: 1 },

    cycleHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[3],
      paddingTop: spacing[3],
      paddingBottom: spacing[2],
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    statusDot:  { width: 6, height: 6, borderRadius: 3 },
    statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },

    actionsRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    finalizeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },

    // Two-column body
    twoCol: {
      flexDirection: "row",
      paddingHorizontal: spacing[3],
      paddingBottom: spacing[3],
      gap: spacing[3],
    },
    col: { flex: 1, gap: 3 },
    colIconBg: {
      width: 28,
      height: 28,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing[1],
    },
    colLabel: { fontSize: fontSize.xs },
    colValue: { fontSize: fontSize.base, fontWeight: fontWeight.semibold, lineHeight: 20 },
    colSub:   { fontSize: fontSize.xs, lineHeight: 16 },
    colDivider: { width: 1, alignSelf: "stretch", marginVertical: spacing[1] },

    // Card footer
    cardFooter: {
      borderTopWidth: 1,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[2],
      gap: spacing[1],
    },
    footerText:    { fontSize: fontSize.xs, lineHeight: 16 },
    nextIntakeRow: { flexDirection: "row", alignItems: "center", gap: spacing[1] },
  });
}
