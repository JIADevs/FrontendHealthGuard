import { useMemo, useState, useEffect } from "react";
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
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Pill, Check, X, Search } from "lucide-react-native";
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
import { useMedicationFormCore, useMedicationsQuery } from "@helu/api/hooks";
import type { Medication } from "@helu/api";

// ─── Screen ───────────────────────────────────────────────────────────────────

export function MedicationFormScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as { medicationId?: string; medicationName?: string } | undefined;

  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: medsPage } = useMedicationsQuery(1, 100);
  const allMeds: Medication[] = medsPage?.items ?? [];

  const form = useMedicationFormCore({
    adapters: {
      onSaveSuccess: () =>
        Toast.show({ type: "success", text1: "Ciclo registrado" }),
      afterSave: () => navigation.goBack(),
    },
  });

  // Pre-seleccionar medicamento si venimos desde MedicationDetailScreen
  useEffect(() => {
    if (params?.medicationId && params?.medicationName) {
      form.selectExistingMedication(params.medicationId, params.medicationName);
    }
    // Solo al montar
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSuggestions = useMemo(() => {
    if (!form.name.trim() || form.selectedMedicationId) return [];
    const q = form.name.toLowerCase();
    return allMeds.filter((m) => m.name.toLowerCase().includes(q));
  }, [form.name, form.selectedMedicationId, allMeds]);

  function handleNameChange(v: string) {
    form.setName(v);
    form.clearSelectedMedication();
    setShowSuggestions(true);
  }

  function handleSelectSuggestion(med: Medication) {
    form.selectExistingMedication(med.id, med.name);
    setShowSuggestions(false);
  }

  const hasSuggestions = showSuggestions && filteredSuggestions.length > 0 && !form.selectedMedicationId;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>Nuevo Ciclo</Typography>
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
          {/* Medicamento */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: t.accent.medBg }]}>
                <Pill size={16} color={t.accent.medFg} />
              </View>
              <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
                Medicamento
              </Text>
            </View>

            {/* Nombre + búsqueda */}
            <View>
              <View style={styles.searchRow}>
                <View style={styles.searchInputWrap}>
                  <TextField
                    label="Nombre del medicamento"
                    value={form.name}
                    onChange={handleNameChange}
                    placeholder="Ej: Acetaminofén"
                    onFocus={() => setShowSuggestions(true)}
                  />
                </View>
                <View style={[styles.searchIcon, { backgroundColor: t.surface.bgCard }]}>
                  <Search size={18} color={t.text.secondary} />
                </View>
              </View>

              {/* Chip de selección */}
              {form.selectedMedicationId && (
                <View style={[styles.selectedChip, { backgroundColor: t.status.successBg ?? t.accent.medBg }]}>
                  <Check size={13} color={t.status.successFg ?? t.accent.medFg} />
                  <Text style={[styles.selectedChipText, { color: t.status.successFg ?? t.accent.medFg }]}>
                    Medicamento existente seleccionado
                  </Text>
                  <TouchableOpacity
                    onPress={() => { form.clearSelectedMedication(); setShowSuggestions(false); }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={13} color={t.status.successFg ?? t.accent.medFg} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Lista de sugerencias */}
              {hasSuggestions && (
                <View style={[styles.suggestions, { backgroundColor: t.surface.bgCard, borderColor: t.border.medium }]}>
                  {filteredSuggestions.slice(0, 5).map((med: Medication) => (
                    <TouchableOpacity
                      key={med.id}
                      style={[styles.suggestionItem, { borderBottomColor: t.border.light }]}
                      onPress={() => handleSelectSuggestion(med)}
                    >
                      <Pill size={14} color={t.accent.medFg} style={styles.suggestionIcon} />
                      <Text style={[styles.suggestionText, { color: t.text.primary }]}>
                        {med.name}
                      </Text>
                      {med.dosage ? (
                        <Text style={[styles.suggestionSub, { color: t.text.secondary }]}>
                          {med.dosage}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
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
            <TextField
              label="Notas adicionales (opcional)"
              value={form.notes}
              onChange={form.setNotes}
              placeholder="Ej: Tomar con comida, ajuste de dosis por tolerancia"
              multiline
            />
          </View>

          {/* Periodo */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>
              Periodo del ciclo
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
    container:        { flex: 1, backgroundColor: t.surface.bg },
    flex:             { flex: 1 },
    header:           {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: t.border.medium,
    },
    headerTitle:      { flex: 1, textAlign: "center" },
    backBtn:          { width: 40, alignItems: "center" },
    content:          { padding: spacing[4], gap: spacing[4], paddingBottom: spacing[8] },
    section:          {
      gap: spacing[3],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      padding: spacing[4],
      borderWidth: 1,
      borderColor: t.border.light,
    },
    sectionHeader:    { flexDirection: "row", alignItems: "center", gap: spacing[2], marginBottom: spacing[1] },
    sectionIcon:      { width: 28, height: 28, borderRadius: radii.full, alignItems: "center", justifyContent: "center" },
    sectionTitle:     { fontSize: fontSize.base, fontWeight: fontWeight.semibold },

    searchRow:        { flexDirection: "row", alignItems: "flex-end", gap: spacing[2] },
    searchInputWrap:  { flex: 1 },
    searchIcon:       {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.border.light,
      marginBottom: 2,
    },

    selectedChip:     {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[1],
      alignSelf: "flex-start",
      paddingHorizontal: spacing[2],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
      marginTop: spacing[1],
    },
    selectedChipText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium },

    suggestions:      {
      borderWidth: 1,
      borderRadius: radii.md,
      marginTop: spacing[1],
      overflow: "hidden",
    },
    suggestionItem:   {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[3],
      borderBottomWidth: 1,
    },
    suggestionIcon:   { flexShrink: 0 },
    suggestionText:   { flex: 1, fontSize: fontSize.sm },
    suggestionSub:    { fontSize: fontSize.xs },

    errorBox:         { padding: spacing[3], borderRadius: radii.sm },
    errorText:        { fontSize: fontSize.sm },
    footer:           {
      flexDirection: "row",
      gap: spacing[3],
      padding: spacing[4],
      borderTopWidth: 1,
    },
    footerBtn:        { flex: 1 },
  });
}
