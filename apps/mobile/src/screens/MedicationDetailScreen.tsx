import { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
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
  ChevronRight,
  AlertCircle,
} from "lucide-react-native";
import {
  colors,
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Button,
  Typography,
  ConfirmModal,
  Spinner,
  EmptyState,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useMedicationByIdQuery,
  useUpdateMedicationMutation,
  useUpdateMedicationCycleMutation,
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

  // Inline name edit
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [finalizingCycleId, setFinalizingCycleId] = useState<string | null>(null);

  function startEditName() {
    setNameValue(med?.name ?? "");
    setEditingName(true);
  }

  function saveName() {
    if (!nameValue.trim() || !med) return;
    updateMedMut.mutate(
      { id: med.id, name: nameValue.trim() } as any,
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

  const sorted = useMemo(
    () => cyclesByNewest(med?.cycles ?? []),
    [med?.cycles],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>

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
          <View style={styles.nameTitleRow}>
            <Typography variant="h3" style={styles.headerTitle} numberOfLines={1}>
              {med?.name ?? "Medicamento"}
            </Typography>
            <TouchableOpacity onPress={startEditName} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Pencil size={16} color={t.text.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Nuevo ciclo */}
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
          {sorted.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={48} color={t.border.medium} />}
              message="Este medicamento no tiene ciclos registrados."
            />
          ) : (
            sorted.map((cycle) => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                t={t}
                styles={styles}
                onEdit={() =>
                  (navigation as any).navigate("MedicationCycleEdit", {
                    cycleId: cycle.id,
                    medicationId: id,
                    medicationName: med?.name ?? "",
                  })
                }
                onFinalize={() => setFinalizingCycleId(cycle.id)}
              />
            ))
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
    </SafeAreaView>
  );
}

// ─── Cycle card ───────────────────────────────────────────────────────────────

function CycleCard({
  cycle,
  t,
  styles,
  onEdit,
  onFinalize,
}: {
  cycle: MedicationCycle;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
  onEdit: () => void;
  onFinalize: () => void;
}) {
  const active = isCycleActive(cycle);

  return (
    <View style={[styles.cycleCard, { borderColor: t.border.light }]}>
      {/* Encabezado del ciclo */}
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

        <View style={styles.cycleMeta}>
          <CalendarDays size={12} color={t.text.secondary} />
          <Text style={[styles.cycleMetaText, { color: t.text.secondary }]}>
            {formatDate(cycle.startDate)}
            {cycle.endDate ? ` → ${formatDate(cycle.endDate)}` : " → en curso"}
          </Text>
        </View>
      </View>

      {/* Datos principales */}
      <View style={styles.cycleBody}>
        <View style={styles.cycleRow}>
          <Pill size={14} color={t.accent.medFg} />
          <Text style={[styles.cycleMain, { color: t.text.primary }]}>
            {cycle.dosage}
          </Text>
          <Text style={[styles.cycleSub, { color: t.text.secondary }]}>
            · cada {cycle.frequency}h
          </Text>
        </View>

        {cycle.reason ? (
          <Text style={[styles.cycleNote, { color: t.text.secondary }]}>
            {cycle.reason}
          </Text>
        ) : null}

        {cycle.notes ? (
          <Text style={[styles.cycleNote, { color: t.text.muted }]}>
            {cycle.notes}
          </Text>
        ) : null}

        {cycle.nextIntakeTime && active ? (
          <View style={styles.cycleRow}>
            <Clock size={12} color={t.text.secondary} />
            <Text style={[styles.cycleMetaText, { color: t.text.secondary }]}>
              Próxima toma:{" "}
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

      {/* Acciones */}
      <View style={[styles.cycleActions, { borderTopColor: t.border.light }]}>
        <TouchableOpacity style={styles.cycleActionBtn} onPress={onEdit}>
          <Pencil size={14} color={t.text.secondary} />
          <Text style={[styles.cycleActionText, { color: t.text.secondary }]}>Editar</Text>
        </TouchableOpacity>

        {active && (
          <TouchableOpacity
            style={[styles.cycleActionBtn, styles.cycleActionBtnRight]}
            onPress={onFinalize}
          >
            <AlertCircle size={14} color={t.status.warningFg ?? t.text.secondary} />
            <Text style={[styles.cycleActionText, { color: t.status.warningFg ?? t.text.secondary }]}>
              Finalizar
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:      { flex: 1, backgroundColor: t.surface.bg },
    flex:           { flex: 1 },
    center:         { flex: 1, alignItems: "center", justifyContent: "center" },
    header:         {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
      gap: spacing[2],
    },
    backBtn:        { width: 36, alignItems: "center" },
    nameTitleRow:   { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing[2] },
    headerTitle:    { flex: 1 },
    nameEditRow:    {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
    nameInput:      {
      flex: 1,
      fontSize: fontSize.base,
      fontWeight: fontWeight.semibold,
      borderWidth: 1,
      borderRadius: radii.sm,
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      color: t.text.primary,
    },
    addCycleBtn:    {
      width: 36,
      height: 36,
      borderRadius: radii.full,
      backgroundColor: t.accent.medBg,
      alignItems: "center",
      justifyContent: "center",
    },
    content:        { padding: spacing[4], gap: spacing[3], paddingBottom: spacing[8] },

    // Cycle card
    cycleCard:      {
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      overflow: "hidden",
    },
    cycleHeader:    {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingTop: spacing[3],
      paddingBottom: spacing[2],
    },
    statusBadge:    {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      paddingHorizontal: spacing[2],
      paddingVertical: 3,
      borderRadius: radii.full,
    },
    statusDot:      { width: 6, height: 6, borderRadius: 3 },
    statusText:     { fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
    cycleMeta:      { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    cycleMetaText:  { fontSize: fontSize.xs },

    cycleBody:      { paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: spacing[2] },
    cycleRow:       { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    cycleMain:      { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    cycleSub:       { fontSize: fontSize.sm },
    cycleNote:      { fontSize: fontSize.sm, lineHeight: 18 },

    cycleActions:   {
      flexDirection: "row",
      borderTopWidth: 1,
    },
    cycleActionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[1],
      paddingVertical: spacing[3],
    },
    cycleActionBtnRight: {
      borderLeftWidth: 1,
      borderLeftColor: undefined,
    },
    cycleActionText: { fontSize: fontSize.sm },
  });
}
