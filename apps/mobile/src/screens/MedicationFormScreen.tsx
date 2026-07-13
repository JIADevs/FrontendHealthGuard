import { useMemo, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import { ArrowLeft, Pill, Check, X, Search, Bell, Info, CalendarDays, Plus, Activity } from "lucide-react-native";
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
  ConfirmModal,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import {
  useMedicationFormCore,
  useMedicationsQuery,
  useMedicationByIdQuery,
  useMedicationCycleEditCore,
  useTreatmentsQuery,
} from "@helu/api/hooks";
import type { Medication, MedicationCycle, PharmaceuticalForm, DoseUnit, FrequencyUnit, Treatment } from "@helu/api";

type ReminderMode = "none" | "at_time" | "before";

// ─── Catalogues ───────────────────────────────────────────────────────────────

const PHARMA_FORM_LABELS: Record<PharmaceuticalForm, string> = {
  TABLET:    "Tableta",
  CAPSULE:   "Cápsula",
  CREAM:     "Crema",
  PASTE:     "Pasta",
  SYRUP:     "Jarabe",
  DROPS:     "Gotas",
  INJECTION: "Inyección",
  POWDER:    "Polvo",
  SPRAY:     "Spray",
};

const DOSE_UNIT_LABELS: Record<DoseUnit, string> = {
  TABLET: "Tableta(s)",
  ML:     "ml",
  DROPS:  "Gotas",
  GRAMS:  "Gramos",
  MG:     "mg",
  UNITS:  "Unidades",
};

const FREQUENCY_UNIT_LABELS: Record<FrequencyUnit, string> = {
  HOUR:  "Hora(s)",
  DAY:   "Día(s)",
  WEEK:  "Semana(s)",
  MONTH: "Mes(es)",
  YEAR:  "Año(s)",
};

const REMINDER_PRESET_MINUTES = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hora", value: 60 },
  { label: "2 horas", value: 120 },
];

// ─── Fuzzy name matching ──────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i]![j] = a[i - 1] === b[j - 1]
        ? dp[i - 1]![j - 1]!
        : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
  return dp[m]![n]!;
}

function normalizeName(s: string): string {
  return s.toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findFuzzySuggestion(typed: string, meds: Medication[]): Medication | null {
  const norm = normalizeName(typed);
  if (!norm) return null;
  let best: { med: Medication; dist: number } | null = null;
  for (const med of meds) {
    const normMed = normalizeName(med.name);
    if (norm === normMed) return null;
    const dist = levenshtein(norm, normMed);
    const threshold = Math.max(2, Math.floor(Math.max(norm.length, normMed.length) * 0.25));
    if (dist <= threshold && (!best || dist < best.dist)) {
      best = { med, dist };
    }
  }
  return best?.med ?? null;
}

// ─── ChipRow ─────────────────────────────────────────────────────────────────

function ChipRow<T extends string>({
  options,
  labels,
  value,
  onChange,
  t,
  styles,
}: {
  options: readonly T[];
  labels: Record<T, string>;
  value: T | "";
  onChange: (v: T | "") => void;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const selected = value === opt;
        return (
          <TouchableOpacity
            key={opt}
            style={[
              styles.chip,
              { borderColor: selected ? t.accent.medFg : t.border.medium },
              selected && { backgroundColor: t.accent.medBg },
            ]}
            onPress={() => onChange(selected ? "" : opt)}
          >
            <Text
              style={[
                styles.chipText,
                { color: selected ? t.accent.medFg : t.text.secondary },
              ]}
            >
              {labels[opt]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── ChipTag ─────────────────────────────────────────────────────────────────

function ChipTag({ label, onRemove, t }: { label: string; onRemove: () => void; t: ThemeContextValue }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: t.brand.tint, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 }}>
      <Text style={{ fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: t.brand.fg }}>{label}</Text>
      <TouchableOpacity onPress={onRemove} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
        <X size={12} color={t.brand.fg} />
      </TouchableOpacity>
    </View>
  );
}

// ─── PickerModal ──────────────────────────────────────────────────────────────

function PickerModal({
  visible, onClose, title, items, selected, onToggle,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  items: { id: string; label: string; sub?: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const t = useAppTheme();
  const [search, setSearch] = useState("");

  useEffect(() => { if (!visible) setSearch(""); }, [visible]);

  const filtered = search.trim()
    ? items.filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={pickerStyles.overlay} onPress={onClose}>
        <Pressable style={[pickerStyles.sheet, { backgroundColor: t.surface.bgCard }]} onPress={() => {}}>
          <View style={pickerStyles.header}>
            <Text style={[pickerStyles.title, { color: t.text.primary }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={22} color={t.text.primary} />
            </TouchableOpacity>
          </View>
          <View style={[pickerStyles.divider, { backgroundColor: t.border.light }]} />
          <View style={[pickerStyles.searchRow, { borderColor: t.border.medium }]}>
            <Search size={16} color={t.text.secondary} />
            <TextInput
              style={[pickerStyles.searchInput, { color: t.text.primary }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar..."
              placeholderTextColor={t.text.muted}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <X size={16} color={t.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={pickerStyles.scroll} contentContainerStyle={{ gap: spacing[2], paddingBottom: spacing[2] }}>
            {filtered.length === 0 && (
              <Text style={{ color: t.text.secondary, textAlign: "center", paddingVertical: spacing[4] }}>
                No hay tratamientos disponibles
              </Text>
            )}
            {filtered.map((item) => {
              const isSelected = selected.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[pickerStyles.itemRow, { borderColor: t.border.light, backgroundColor: isSelected ? t.brand.tint : t.surface.bg }]}
                  onPress={() => onToggle(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[pickerStyles.itemLabel, { color: t.text.primary }]} numberOfLines={1}>{item.label}</Text>
                    {item.sub && <Text style={[pickerStyles.itemSub, { color: t.text.secondary }]}>{item.sub}</Text>}
                  </View>
                  <View style={[pickerStyles.toggleBtn, { backgroundColor: isSelected ? t.brand.fg : t.border.medium }]}>
                    {isSelected ? <X size={18} color="#fff" /> : <Plus size={18} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={[pickerStyles.closeBtn, { backgroundColor: t.brand.solid }]} onPress={onClose}>
            <Text style={{ color: "#fff", fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>Cerrar</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  sheet:      { borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl, padding: spacing[4], maxHeight: "80%", gap: spacing[3] },
  header:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title:      { fontSize: fontSize.lg, fontWeight: fontWeight.semibold },
  divider:    { height: 1 },
  searchRow:  { flexDirection: "row", alignItems: "center", gap: spacing[2], borderWidth: 1, borderRadius: radii.md, paddingHorizontal: spacing[3], paddingVertical: spacing[2] },
  searchInput:{ flex: 1, fontSize: fontSize.sm },
  scroll:     { flexGrow: 0, maxHeight: 360 },
  itemRow:    { flexDirection: "row", alignItems: "center", gap: spacing[3], padding: spacing[3], borderRadius: radii.md, borderWidth: 1 },
  itemLabel:  { fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  itemSub:    { fontSize: fontSize.xs, marginTop: 2 },
  toggleBtn:  { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  closeBtn:   { borderRadius: radii.md, padding: spacing[3], alignItems: "center" },
});

// ─── TreatmentsSection ───────────────────────────────────────────────────────

function TreatmentsSection({
  treatmentIds,
  setTreatmentIds,
  t,
  styles,
}: {
  treatmentIds: string[];
  setTreatmentIds: (v: string[]) => void;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const { data: treatmentsPage } = useTreatmentsQuery(1, 100);
  const treatmentItems = (treatmentsPage?.items ?? []).map((tr: Treatment) => ({
    id: tr.id,
    label: tr.name,
    sub: tr.status === "ACTIVE" ? "Activo" : tr.status === "COMPLETED" ? "Completado" : "Inactivo",
  }));

  function labelForId(id: string) {
    return treatmentItems.find((i: { id: string }) => i.id === id)?.label ?? id.slice(0, 8);
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: t.brand.tint }]}>
          <Activity size={16} color={t.brand.fg} />
        </View>
        <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Tratamientos</Text>
      </View>

      {treatmentIds.length > 0 && (
        <View style={styles.chipRow}>
          {treatmentIds.map((id) => (
            <View key={id}>
              <ChipTag
                label={labelForId(id)}
                onRemove={() => setTreatmentIds(treatmentIds.filter((x) => x !== id))}
                t={t}
              />
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setShowPicker(true)}>
        <Plus size={16} color={t.brand.fg} />
        <Text style={[styles.addButtonText, { color: t.brand.fg }]}>Agregar tratamiento</Text>
      </TouchableOpacity>

      <PickerModal
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        title="Tratamientos"
        items={treatmentItems}
        selected={treatmentIds}
        onToggle={(id) =>
          setTreatmentIds(
            treatmentIds.includes(id)
              ? treatmentIds.filter((x) => x !== id)
              : [...treatmentIds, id],
          )
        }
      />
    </View>
  );
}

// ─── Screen router ────────────────────────────────────────────────────────────

export function MedicationFormScreen() {
  const route = useRoute();
  const params = route.params as {
    cycleId?: string;
    medicationId?: string;
    medicationName?: string;
  } | undefined;

  if (params?.cycleId && params?.medicationId) {
    return (
      <EditGate
        cycleId={params.cycleId}
        medicationId={params.medicationId}
        medicationName={params.medicationName ?? ""}
      />
    );
  }

  return (
    <CreateFlow
      medicationId={params?.medicationId}
      medicationName={params?.medicationName}
    />
  );
}

// ─── Edit gate (fetches cycle, then renders form) ─────────────────────────────

function EditGate({
  cycleId,
  medicationId,
  medicationName,
}: {
  cycleId: string;
  medicationId: string;
  medicationName: string;
}) {
  const navigation = useNavigation();
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

  return <EditFlow cycle={cycle} medicationName={medicationName} />;
}

// ─── Create flow ──────────────────────────────────────────────────────────────

function CreateFlow({
  medicationId,
  medicationName: initialMedName,
}: {
  medicationId?: string;
  medicationName?: string;
}) {
  const navigation = useNavigation();
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fuzzySuggestion, setFuzzySuggestion] = useState<Medication | null>(null);
  const skipFuzzyRef = useRef(false);

  const { data: medsPage } = useMedicationsQuery(1, 100);
  const allMeds: Medication[] = medsPage?.items ?? [];

  const form = useMedicationFormCore({
    adapters: {
      onSaveSuccess: () => Toast.show({ type: "success", text1: "Ciclo registrado" }),
      afterSave: () => navigation.goBack(),
    },
  });

  useEffect(() => {
    if (medicationId && initialMedName) {
      form.selectExistingMedication(medicationId, initialMedName);
    }
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

  function handlePressSave() {
    if (form.selectedMedicationId || skipFuzzyRef.current) {
      form.handleSave();
      return;
    }
    const suggestion = findFuzzySuggestion(form.name, allMeds);
    if (suggestion) {
      setFuzzySuggestion(suggestion);
      return;
    }
    form.handleSave();
  }

  function handleAcceptSuggestion() {
    if (!fuzzySuggestion) return;
    form.selectExistingMedication(fuzzySuggestion.id, fuzzySuggestion.name);
    setFuzzySuggestion(null);
  }

  function handleRejectSuggestion() {
    setFuzzySuggestion(null);
    skipFuzzyRef.current = true;
    form.handleSave();
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>Nuevo Ciclo</Typography>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Medicamento ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: t.accent.medBg }]}>
                <Pill size={16} color={t.accent.medFg} />
              </View>
              <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Medicamento</Text>
            </View>

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

              {hasSuggestions && (
                <View style={[styles.suggestions, { backgroundColor: t.surface.bgCard, borderColor: t.border.medium }]}>
                  {filteredSuggestions.slice(0, 5).map((med: Medication) => (
                    <TouchableOpacity
                      key={med.id}
                      style={[styles.suggestionItem, { borderBottomColor: t.border.light }]}
                      onPress={() => handleSelectSuggestion(med)}
                    >
                      <Pill size={14} color={t.accent.medFg} style={styles.suggestionIcon} />
                      <Text style={[styles.suggestionText, { color: t.text.primary }]}>{med.name}</Text>
                      {med.dosage ? (
                        <Text style={[styles.suggestionSub, { color: t.text.secondary }]}>{med.dosage}</Text>
                      ) : null}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: t.text.secondary }]}>Forma farmacéutica</Text>
              <ChipRow
                options={["TABLET", "CAPSULE", "CREAM", "PASTE", "SYRUP", "DROPS", "INJECTION", "POWDER", "SPRAY"] as const}
                labels={PHARMA_FORM_LABELS}
                value={form.pharmaceuticalForm}
                onChange={form.setPharmaceuticalForm}
                t={t} styles={styles}
              />
            </View>
          </View>

          <PrescriptionSection form={form} t={t} styles={styles} />

          {/* ── Periodo ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Periodo del ciclo</Text>
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

          <RemindersSection form={form} t={t} styles={styles} />

          <TreatmentsSection
            treatmentIds={form.treatmentIds}
            setTreatmentIds={form.setTreatmentIds}
            t={t}
            styles={styles}
          />

          {form.error && (
            <View style={[styles.errorBox, { backgroundColor: t.status.errorBg }]}>
              <Text style={[styles.errorText, { color: t.status.errorFg }]}>{form.error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: t.border.medium, backgroundColor: t.surface.bgCard }]}>
          <Button variant="secondary" onPress={() => navigation.goBack()} style={styles.footerBtn}>
            Cancelar
          </Button>
          <Button onPress={handlePressSave} disabled={form.saving} loading={form.saving} style={styles.footerBtn}>
            Registrar
          </Button>
        </View>
      </KeyboardAvoidingView>

      {fuzzySuggestion && (
        <ConfirmModal
          title="¿Quisiste decir...?"
          message={`Encontramos "${fuzzySuggestion.name}", similar a "${form.name}". ¿Deseas usar este medicamento existente?`}
          confirmLabel={`Usar "${fuzzySuggestion.name}"`}
          cancelLabel="Crear nuevo"
          onConfirm={handleAcceptSuggestion}
          onCancel={handleRejectSuggestion}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Edit flow ────────────────────────────────────────────────────────────────

function EditFlow({
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
      onSaveSuccess: () => Toast.show({ type: "success", text1: "Ciclo actualizado" }),
      afterSave: () => navigation.goBack(),
    },
  });

  const startDateLabel = new Date(cycle.startDate).toLocaleDateString("es-CO", {
    day: "2-digit", month: "long", year: "numeric",
  });
  const startTimeLabel = cycle.firstIntakeTime
    ? new Date(cycle.firstIntakeTime).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={t.text.primary} />
        </TouchableOpacity>
        <Typography variant="h3" style={styles.headerTitle}>Editar Ciclo</Typography>
        <View style={styles.backBtn} />
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* ── Medicamento (read-only) ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, { backgroundColor: t.accent.medBg }]}>
                <Pill size={16} color={t.accent.medFg} />
              </View>
              <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Medicamento</Text>
            </View>
            <View style={[styles.readonlyBox, { backgroundColor: t.accent.medBg }]}>
              <Text style={[styles.readonlyLabel, { color: t.accent.medFg }]}>Nombre</Text>
              <Text style={[styles.readonlyValue, { color: t.accent.medFg }]}>{medicationName}</Text>
            </View>
            <View>
              <Text style={[styles.fieldLabel, { color: t.text.secondary }]}>Forma farmacéutica</Text>
              <ChipRow
                options={["TABLET", "CAPSULE", "CREAM", "PASTE", "SYRUP", "DROPS", "INJECTION", "POWDER", "SPRAY"] as const}
                labels={PHARMA_FORM_LABELS}
                value={form.pharmaceuticalForm}
                onChange={form.setPharmaceuticalForm}
                t={t} styles={styles}
              />
            </View>
          </View>

          <PrescriptionSection form={form} t={t} styles={styles} />

          {/* ── Periodo ── */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Periodo del ciclo</Text>

            <View style={[styles.readonlyBox, { backgroundColor: t.surface.bg }]}>
              <View style={styles.readonlyRow}>
                <CalendarDays size={14} color={t.text.muted} />
                <Text style={[styles.readonlyLabel, { color: t.text.muted }]}>
                  Inicio del ciclo (no editable)
                </Text>
              </View>
              <Text style={[styles.readonlyValue, { color: t.text.primary }]}>
                {startDateLabel}{startTimeLabel ? ` · ${startTimeLabel}` : ""}
              </Text>
              <View style={styles.infoRow}>
                <Info size={12} color={t.text.muted} />
                <Text style={[styles.infoText, { color: t.text.muted }]}>
                  Para cambiar la fecha de inicio, crea un nuevo ciclo.
                </Text>
              </View>
            </View>

            <DateTimePicker
              label="Fecha de fin (opcional)"
              value={form.endDate ?? ""}
              onChange={(v) => form.setEndDate(v.slice(0, 10))}
            />
          </View>

          <RemindersSection form={form} t={t} styles={styles} />

          <TreatmentsSection
            treatmentIds={form.treatmentIds}
            setTreatmentIds={form.setTreatmentIds}
            t={t}
            styles={styles}
          />

          {form.error && (
            <View style={[styles.errorBox, { backgroundColor: t.status.errorBg }]}>
              <Text style={[styles.errorText, { color: t.status.errorFg }]}>{form.error}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: t.border.medium, backgroundColor: t.surface.bgCard }]}>
          <Button variant="secondary" onPress={() => navigation.goBack()} style={styles.footerBtn}>
            Cancelar
          </Button>
          <Button onPress={form.handleSave} disabled={form.saving} loading={form.saving} style={styles.footerBtn}>
            Guardar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Shared sections ──────────────────────────────────────────────────────────

type SharedFormSlice = {
  concentration: string;
  setConcentration: (v: string) => void;
  doseAmount: string;
  setDoseAmount: (v: string) => void;
  doseUnit: DoseUnit | "";
  setDoseUnit: (v: DoseUnit | "") => void;
  frequency: string;
  setFrequency: (v: string) => void;
  frequencyUnit: FrequencyUnit;
  setFrequencyUnit: (v: FrequencyUnit) => void;
  price: string;
  setPrice: (v: string) => void;
  reason: string;
  setReason: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  reminderMode: ReminderMode;
  setReminderMode: (v: ReminderMode) => void;
  reminderOffsets: number[];
  toggleReminderOffset: (minutes: number) => void;
};

function PrescriptionSection({
  form,
  t,
  styles,
}: {
  form: SharedFormSlice;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Prescripción</Text>

      <TextField
        label="Concentración (opcional)"
        value={form.concentration}
        onChange={form.setConcentration}
        placeholder="Ej: 500mg, 10mg/5ml"
      />

      <View>
        <Text style={[styles.fieldLabel, { color: t.text.secondary }]}>Dosis por toma</Text>
        <View style={styles.rowGap}>
          <View style={styles.dosageAmountWrap}>
            <TextField
              label="Cantidad"
              value={form.doseAmount}
              onChange={form.setDoseAmount}
              placeholder="Ej: 1, 2.5"
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <ChipRow
          options={["TABLET", "ML", "DROPS", "GRAMS", "MG", "UNITS"] as const}
          labels={DOSE_UNIT_LABELS}
          value={form.doseUnit}
          onChange={form.setDoseUnit}
          t={t} styles={styles}
        />
      </View>

      <View>
        <Text style={[styles.fieldLabel, { color: t.text.secondary }]}>Frecuencia</Text>
        <View style={styles.rowGap}>
          <View style={styles.dosageAmountWrap}>
            <TextField
              label="Cada cuánto"
              value={form.frequency}
              onChange={form.setFrequency}
              placeholder="Ej: 8"
              keyboardType="number-pad"
            />
          </View>
        </View>
        <ChipRow
          options={["HOUR", "DAY", "WEEK", "MONTH", "YEAR"] as const}
          labels={FREQUENCY_UNIT_LABELS}
          value={form.frequencyUnit}
          onChange={(v) => { if (v) form.setFrequencyUnit(v as FrequencyUnit); }}
          t={t} styles={styles}
        />
      </View>

      <TextField
        label="Precio (opcional)"
        value={form.price}
        onChange={form.setPrice}
        placeholder="Ej: 25000"
        keyboardType="decimal-pad"
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
  );
}

function RemindersSection({
  form,
  t,
  styles,
}: {
  form: SharedFormSlice;
  t: ThemeContextValue;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIcon, { backgroundColor: t.accent.medBg }]}>
          <Bell size={16} color={t.accent.medFg} />
        </View>
        <Text style={[styles.sectionTitle, { color: t.text.primary }]}>Recordatorios</Text>
      </View>

      <View style={styles.reminderModeRow}>
        {(["none", "at_time", "before"] as ReminderMode[]).map((mode) => {
          const label =
            mode === "none"    ? "Sin recordatorio" :
            mode === "at_time" ? "Al momento de la toma" :
            "Antes de la toma";
          const selected = form.reminderMode === mode;
          return (
            <TouchableOpacity
              key={mode}
              style={[
                styles.reminderModeBtn,
                { borderColor: selected ? t.accent.medFg : t.border.medium },
                selected && { backgroundColor: t.accent.medBg },
              ]}
              onPress={() => form.setReminderMode(mode)}
            >
              <Text
                style={[
                  styles.reminderModeBtnText,
                  { color: selected ? t.accent.medFg : t.text.secondary },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {form.reminderMode === "before" && (
        <View>
          <Text style={[styles.fieldLabel, { color: t.text.secondary }]}>¿Con cuánta anticipación?</Text>
          <View style={styles.chipRow}>
            {REMINDER_PRESET_MINUTES.map(({ label, value }) => {
              const selected = form.reminderOffsets.includes(value);
              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.chip,
                    { borderColor: selected ? t.accent.medFg : t.border.medium },
                    selected && { backgroundColor: t.accent.medBg },
                  ]}
                  onPress={() => form.toggleReminderOffset(value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? t.accent.medFg : t.text.secondary },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container:        { flex: 1, backgroundColor: t.surface.bg },
    flex:             { flex: 1 },
    center:           { flex: 1, alignItems: "center", justifyContent: "center" },
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
    fieldLabel:       { fontSize: fontSize.sm, marginBottom: spacing[2] },

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

    suggestions:      { borderWidth: 1, borderRadius: radii.md, marginTop: spacing[1], overflow: "hidden" },
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

    chipRow:          { flexDirection: "row", flexWrap: "wrap", gap: spacing[2] },
    chip:             { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radii.full, borderWidth: 1 },
    chipText:         { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

    rowGap:           { flexDirection: "row", gap: spacing[2], marginBottom: spacing[2] },
    dosageAmountWrap: { flex: 1 },

    readonlyBox:      {
      borderRadius: radii.md,
      padding: spacing[3],
      gap: spacing[1],
      borderWidth: 1,
      borderColor: t.border.light,
    },
    readonlyRow:      { flexDirection: "row", alignItems: "center", gap: spacing[1] },
    readonlyLabel:    { fontSize: fontSize.xs, fontWeight: fontWeight.medium, opacity: 0.8 },
    readonlyValue:    { fontSize: fontSize.base, fontWeight: fontWeight.semibold },
    infoRow:          { flexDirection: "row", alignItems: "flex-start", gap: spacing[1], marginTop: spacing[1] },
    infoText:         { fontSize: fontSize.xs, flex: 1, lineHeight: 16 },

    reminderModeRow:  { gap: spacing[2] },
    reminderModeBtn:  { paddingHorizontal: spacing[3], paddingVertical: spacing[2], borderRadius: radii.md, borderWidth: 1 },
    reminderModeBtnText: { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

    addButton:        { flexDirection: "row", alignItems: "center", gap: spacing[2], paddingVertical: spacing[2] },
    addButtonText:    { fontSize: fontSize.sm, fontWeight: fontWeight.medium },

    errorBox:         { padding: spacing[3], borderRadius: radii.sm },
    errorText:        { fontSize: fontSize.sm },
    footer:           { flexDirection: "row", gap: spacing[3], padding: spacing[4], borderTopWidth: 1 },
    footerBtn:        { flex: 1 },
  });
}
