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
import { ArrowLeft, Pill } from "lucide-react-native";
import {
  colors,
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
import { useMedicationFormCore } from "@helu/api/hooks";

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MedicationFormScreen() {
  const navigation = require("@react-navigation/native").useNavigation();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const form = useMedicationFormCore({
    adapters: {
      onSaveSuccess: () =>
        Toast.show({ type: "success", text1: "Medicamento registrado" }),
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
        <Typography variant="h3" style={styles.headerTitle}>Nuevo Medicamento</Typography>
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
          {/* Identidad */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: t.accent.medBg }]}>
                <Pill size={16} color={t.accent.medFg} />
              </View>
              <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
                Identificación
              </Text>
            </View>
            <TextField
              label="Nombre del medicamento"
              value={form.name}
              onChange={form.setName}
              placeholder="Ej: Acetaminofén"
            />
          </View>

          {/* Prescripción */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
              Prescripción
            </Text>
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
          </View>

          {/* Fechas */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
              Inicio y primera toma
            </Text>
            <DateTimePicker
              label="Fecha y hora de inicio"
              value={
                form.startDate && form.firstIntakeTime
                  ? `${form.startDate}T${form.firstIntakeTime}`
                  : ""
              }
              onChange={(v) => {
                form.setStartDate(v.slice(0, 10));
                form.setFirstIntakeTime(v.slice(11, 16));
              }}
              required
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
            Registrar
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
      borderColor: t.border.light,
    },
    sectionHeader: { flexDirection: "row", alignItems: "center", gap: spacing[2], marginBottom: spacing[1] },
    sectionIcon:  { width: 28, height: 28, borderRadius: radii.full, alignItems: "center", justifyContent: "center" },
    sectionTitle: { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
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
