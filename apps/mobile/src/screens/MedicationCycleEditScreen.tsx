import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useRoute, useNavigation } from "@react-navigation/native";
import { ArrowLeft, Pill, CalendarDays, Info } from "lucide-react-native";
import {
  radii,
  spacing,
  fontSize,
  fontWeight,
  useAppTheme,
  Button,
  TextField,
  DateTimePicker,
  Typography,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useMedicationByIdQuery, useMedicationCycleEditCore } from "@helu/api/hooks";
import type { MedicationCycle } from "@helu/api";

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MedicationCycleEditScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { cycleId, medicationId, medicationName } = route.params as {
    cycleId: string;
    medicationId: string;
    medicationName: string;
  };

  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const { data: med, isLoading } = useMedicationByIdQuery(medicationId);
  const cycle = med?.cycles.find((c: MedicationCycle) => c.id === cycleId);

  if (isLoading || !cycle) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <ArrowLeft size={22} color={t.text.primary} />
          </TouchableOpacity>
          <Typography variant="h3" style={styles.headerTitle}>Editar Ciclo</Typography>
          <View style={styles.backBtn} />
        </View>
        <View style={styles.center}>
          <Text style={{ color: t.text.secondary }}>Cargando ciclo…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return <CycleEditForm cycle={cycle} medicationName={medicationName} />;
}

// ─── Inner form (rendered once cycle is loaded) ───────────────────────────────

function CycleEditForm({
  cycle,
  medicationName,
}: {
  cycle: MedicationCycle;
  medicationName: string;
}) {
  const navigation = useNavigation();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const form = useMedicationCycleEditCore({
    cycle,
    adapters: {
      onSaveSuccess: () =>
        Toast.show({ type: "success", text1: "Ciclo actualizado" }),
      afterSave: () => navigation.goBack(),
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>Editar Ciclo</Typography>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Medicamento (solo lectura) */}
          <View style={[styles.section, { backgroundColor: t.accent.medBg }]}>
            <View style={styles.sectionRow}>
              <Pill size={16} color={t.accent.medFg} />
              <View>
                <Text style={[styles.medLabel, { color: t.accent.medFg }]}>Medicamento</Text>
                <Text style={[styles.medName, { color: t.accent.medFg }]}>{medicationName}</Text>
              </View>
            </View>
          </View>

          {/* Fecha de inicio — solo lectura */}
          <View style={[styles.section, { borderColor: t.border.light }]}>
            <View style={styles.sectionRow}>
              <CalendarDays size={15} color={t.text.secondary} />
              <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
                Inicio del ciclo (no editable)
              </Text>
            </View>
            <Text style={[styles.readonlyValue, { color: t.text.muted }]}>
              {new Date(cycle.startDate).toLocaleDateString("es-CO", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
              {" · "}
              {cycle.firstIntakeTime
                ? new Date(cycle.firstIntakeTime).toLocaleTimeString("es-CO", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </Text>
            <View style={styles.infoRow}>
              <Info size={12} color={t.text.muted} />
              <Text style={[styles.infoText, { color: t.text.muted }]}>
                Para cambiar la fecha de inicio, crea un nuevo ciclo.
              </Text>
            </View>
          </View>

          {/* Prescripción */}
          <View style={[styles.section, { borderColor: t.border.light }]}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Prescripción</Text>
            <TextField
              label="Dosis"
              value={form.dosage}
              onChange={form.setDosage}
              placeholder="Ej: 500mg · 1 tableta"
            />
            <TextField
              label="Frecuencia (horas entre tomas)"
              value={form.frequency}
              onChange={form.setFrequency}
              placeholder="Ej: 8"
              keyboardType="number-pad"
            />
            <TextField
              label="Razón / indicación (opcional)"
              value={form.reason}
              onChange={form.setReason}
              placeholder="Ej: Control del dolor"
            />
            <TextField
              label="Notas adicionales (opcional)"
              value={form.notes}
              onChange={form.setNotes}
              placeholder="Ej: Tomar con comida"
              multiline
            />
          </View>

          {/* Fecha de fin */}
          <View style={[styles.section, { borderColor: t.border.light }]}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
              Fin del ciclo
            </Text>
            <DateTimePicker
              label="Fecha de fin (opcional)"
              value={form.endDate ?? ""}
              onChange={(v) => form.setEndDate(v.slice(0, 10))}
            />
          </View>

          {/* Error */}
          {form.error && (
            <View style={[styles.errorBox, { backgroundColor: t.status.errorBg }]}>
              <Text style={[styles.errorText, { color: t.status.errorFg }]}>
                {form.error}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: t.border.medium, backgroundColor: t.surface.bgCard }]}>
          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.footerBtn}
          >
            Cancelar
          </Button>
          <Button
            onPress={form.handleSave}
            disabled={form.saving}
            loading={form.saving}
            style={styles.footerBtn}
          >
            Guardar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:    { flex: 1, backgroundColor: t.surface.bg },
    flex:         { flex: 1 },
    center:       { flex: 1, alignItems: "center", justifyContent: "center" },
    header:       {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    headerTitle:  { flex: 1, textAlign: "center" },
    backBtn:      { width: 40, alignItems: "center" },
    content:      { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    section:      {
      gap: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      borderWidth: 1,
    },
    sectionRow:   { flexDirection: "row", alignItems: "center", gap: spacing[2] },
    sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },

    medLabel:     { fontSize: fontSize.xs, fontWeight: fontWeight.medium, opacity: 0.8 },
    medName:      { fontSize: fontSize.base, fontWeight: fontWeight.bold },

    readonlyValue: { fontSize: fontSize.base, fontWeight: fontWeight.medium },
    infoRow:       { flexDirection: "row", alignItems: "flex-start", gap: spacing[1], marginTop: spacing[1] },
    infoText:      { fontSize: fontSize.xs, flex: 1, lineHeight: 16 },

    errorBox:     { padding: spacing[3], borderRadius: radii.sm },
    errorText:    { fontSize: fontSize.sm },
    footer:       {
      flexDirection: "row",
      gap: spacing[3],
      padding: spacing[4],
      borderTopWidth: 1,
    },
    footerBtn:    { flex: 1 },
  });
}
