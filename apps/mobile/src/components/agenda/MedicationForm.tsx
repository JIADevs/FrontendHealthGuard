import { useEffect, useMemo, useRef, useState, type ComponentRef, type MutableRefObject } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Check, Pill, X } from "lucide-react-native";
import {
  BOTTOM_ACTION_BAR_HEIGHT,
  BottomActionBar,
  ChoiceChips,
  ConfirmModal,
  DatePicker,
  DiscardChangesDialog,
  FieldError,
  Skeleton,
  SkeletonGroup,
  TextField,
  TimePicker,
  formatClock,
  formatShortDay,
  nativeFont,
  radii,
  spacing,
  useAppTheme,
  useSkeletonVisible,
  type ThemeContextValue,
} from "@helu/ui";
import {
  useMedicationByIdQuery,
  useMedicationCycleEditCore,
  useMedicationFormCore,
  useMedicationsQuery,
  useTreatmentsQuery,
} from "@helu/api/hooks";
import type { DoseUnit, FrequencyUnit, Medication, MedicationCycle, PharmaceuticalForm } from "@helu/api";
import { ScreenHeader } from "../ScreenHeader";
import { SkeletonChips, SkeletonField } from "../SkeletonPieces";
import { SelectField } from "../SelectField";
import { notify } from "../../lib/notify";
import { haptics } from "../../lib/haptics";
import { FormCard, FormLabel, MoreDetailsToggle } from "./FormCard";
import { FORM_UNIT, FREQ_UNITS, doseSummary, parseAmount } from "./medicationFormat";
import type { SubscribeBeforeLeave } from "./AppointmentForm";

// ─── Catalogues (mockup «Nuevo medicamento») ─────────────────────────────────

/** The seven forms of the mockup. `PASTE` and `POWDER` only show up when a cycle already uses them. */
const FORMS: PharmaceuticalForm[] = ["TABLET", "CAPSULE", "SYRUP", "DROPS", "INJECTION", "CREAM", "SPRAY"];

const FORM_LABEL: Record<PharmaceuticalForm, string> = {
  TABLET: "Tableta",
  CAPSULE: "Cápsula",
  SYRUP: "Jarabe",
  DROPS: "Gotas",
  INJECTION: "Inyección",
  CREAM: "Crema",
  SPRAY: "Spray",
  PASTE: "Pasta",
  POWDER: "Polvo",
};

const NO_TREATMENT = "Sin tratamiento";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function normalizeName(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();
}

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i]![j] =
        a[i - 1] === b[j - 1] ? dp[i - 1]![j - 1]! : 1 + Math.min(dp[i - 1]![j]!, dp[i]![j - 1]!, dp[i - 1]![j - 1]!);
  return dp[a.length]![b.length]!;
}

/** An existing medication whose name is a near miss of the typed one («Metformna» → «Metformina»). */
function findFuzzySuggestion(typed: string, meds: Medication[]): Medication | null {
  const norm = normalizeName(typed);
  if (!norm) return null;
  let best: { med: Medication; dist: number } | null = null;
  for (const med of meds) {
    const other = normalizeName(med.name);
    if (norm === other) return null;
    const dist = levenshtein(norm, other);
    const threshold = Math.max(2, Math.floor(Math.max(norm.length, other.length) * 0.25));
    if (dist <= threshold && (!best || dist < best.dist)) best = { med, dist };
  }
  return best?.med ?? null;
}

type FieldKey = "name" | "form" | "dose" | "frequency" | "startDate" | "time" | "endDate";
type FieldErrors = Partial<Record<FieldKey, string>>;
/** Order of the fields on screen: the first one with an error gets the scroll and the focus. */
const FIELD_ORDER: FieldKey[] = ["name", "form", "dose", "frequency", "startDate", "time", "endDate"];

interface Values {
  isCreate: boolean;
  name: string;
  pharmaceuticalForm: PharmaceuticalForm | "";
  doseAmount: string;
  frequency: string;
  startDate: string;
  firstIntakeTime: string;
  endDate: string;
}

function validate(v: Values): FieldErrors {
  const e: FieldErrors = {};
  if (v.isCreate && !v.name.trim()) e.name = "Escribe el nombre del medicamento.";
  if (!v.pharmaceuticalForm) e.form = "Elige la forma farmacéutica.";
  if (!v.doseAmount.trim()) e.dose = "Escribe la dosis por toma.";
  else if (!(parseAmount(v.doseAmount) > 0)) e.dose = "Escribe un número mayor a 0.";
  const every = Number(v.frequency);
  if (!v.frequency.trim()) e.frequency = "Escribe cada cuánto la tomas.";
  else if (!Number.isInteger(every) || every < 1) e.frequency = "Escribe un número entero mayor a 0.";
  if (v.isCreate && !v.startDate) e.startDate = "Elige la fecha de inicio.";
  if (v.isCreate && !v.firstIntakeTime) e.time = "Elige la hora de la primera toma.";
  if (v.endDate && v.startDate && v.endDate < v.startDate) e.endDate = "El fin no puede ser antes del inicio.";
  return e;
}

// ─── Router ──────────────────────────────────────────────────────────────────

export interface MedicationFormProps {
  /** Editing an existing cycle when both ids are set */
  cycleId?: string;
  /** With no `cycleId`: a new cycle for this medication */
  medicationId?: string;
  medicationName?: string;
  /** Leaves the form (after saving, or after confirming «Descartar») */
  onClose: () => void;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}

export function MedicationForm(props: MedicationFormProps) {
  if (props.cycleId && props.medicationId) {
    return <EditGate {...props} cycleId={props.cycleId} medicationId={props.medicationId} />;
  }
  return <CreateForm {...props} />;
}

function EditGate(props: MedicationFormProps & { cycleId: string; medicationId: string }) {
  const t = useAppTheme();
  const { data: med, isLoading } = useMedicationByIdQuery(props.medicationId);
  const cycle = med?.cycles.find((c: MedicationCycle) => c.id === props.cycleId);
  const showSkeleton = useSkeletonVisible(isLoading || !cycle);
  if (showSkeleton || !cycle) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: t.surface.bg }} edges={["top"]}>
        <ScreenHeader title="Editar ciclo" subtitle={props.medicationName} />
        {/* §6c: the same cards and labels as «Editar ciclo»; only the values are blocks. */}
        <SkeletonGroup label="Cargando el ciclo" style={{ flex: 1, overflow: "hidden", padding: spacing[4], gap: spacing[4] }}>
          <FormCard title="Medicamento">
            <SkeletonField label="Nombre" />
            <View style={{ gap: spacing[2] }}>
              <FormLabel>Forma farmacéutica</FormLabel>
              <SkeletonChips widths={[88, 84, 76, 92]} />
            </View>
            <SkeletonField label="Concentración (opcional)" />
          </FormCard>
          <FormCard title="Prescripción">
            <SkeletonField label="Dosis por toma" />
            <View style={{ gap: spacing[2] }}>
              <SkeletonField label="Frecuencia (cada cuánto)" />
              <SkeletonChips widths={[72, 64, 72]} />
            </View>
          </FormCard>
          <FormCard title="Periodo del ciclo">
            <Skeleton height={76} radius={radii.input} />
            <SkeletonField label="Fin (opcional)" />
          </FormCard>
        </SkeletonGroup>
        <BottomActionBar primary={{ label: "Guardar cambios", onPress: () => undefined, disabled: true }} />
      </SafeAreaView>
    );
  }
  return <EditForm {...props} cycle={cycle} medicationName={med?.name ?? props.medicationName ?? ""} />;
}

// ─── Create (new medication or new cycle) ────────────────────────────────────

function CreateForm({ medicationId, medicationName, onClose, subscribeBeforeLeave }: MedicationFormProps) {
  const leave = useRef<() => void>(() => {});
  const savedName = useRef("");
  const form = useMedicationFormCore({
    adapters: {
      onSaveSuccess: () => {
        haptics.success();
        notify({ message: medicationId ? "Ciclo guardado" : "Medicamento guardado", description: savedName.current });
      },
      afterSave: () => leave.current(),
    },
  });
  savedName.current = form.name.trim();

  // «Nuevo ciclo» starts from an existing medication. The body takes its «¿Descartar los cambios?»
  // baseline on mount, so it mounts again once the name is in: leaving untouched never asks.
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (medicationId && medicationName) {
      form.selectExistingMedication(medicationId, medicationName);
      setPrefilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: medsPage } = useMedicationsQuery("", 1, 100);
  const allMeds: Medication[] = medsPage?.items ?? [];
  const [fuzzy, setFuzzy] = useState<Medication | null>(null);
  const skipFuzzy = useRef(false);

  const save = () => {
    if (form.selectedMedicationId || skipFuzzy.current) return form.handleSave();
    const suggestion = findFuzzySuggestion(form.name, allMeds);
    if (suggestion) return setFuzzy(suggestion);
    form.handleSave();
  };

  return (
    <>
      <MedicationFormBody
        key={prefilled ? "prefilled" : "blank"}
        mode={medicationId ? "cycle" : "create"}
        form={form}
        medicationName={medicationName}
        allMeds={allMeds}
        onValidSave={save}
        onClose={onClose}
        leaveRef={leave}
        subscribeBeforeLeave={subscribeBeforeLeave}
      />
      {fuzzy ? (
        <ConfirmModal
          title="¿Quisiste decir…?"
          message={`Ya tienes «${fuzzy.name}», parecido a «${form.name.trim()}». ¿Quieres usarlo?`}
          confirmLabel={`Usar «${fuzzy.name}»`}
          keepLabel="Crear nuevo"
          onConfirm={() => {
            form.selectExistingMedication(fuzzy.id, fuzzy.name);
            setFuzzy(null);
          }}
          onCancel={() => {
            setFuzzy(null);
            skipFuzzy.current = true;
            form.handleSave();
          }}
        />
      ) : null}
    </>
  );
}

// ─── Edit an existing cycle ──────────────────────────────────────────────────

function EditForm({
  cycle,
  medicationName,
  onClose,
  subscribeBeforeLeave,
}: MedicationFormProps & { cycle: MedicationCycle; medicationName: string }) {
  const leave = useRef<() => void>(() => {});
  const form = useMedicationCycleEditCore({
    cycle,
    adapters: {
      onSaveSuccess: () => {
        haptics.success();
        notify({ message: "Ciclo actualizado", description: medicationName });
      },
      afterSave: () => leave.current(),
    },
  });
  return (
    <MedicationFormBody
      mode="edit"
      form={{ ...form, name: medicationName, startDate: cycle.startDate.slice(0, 10), firstIntakeTime: "", selectedMedicationId: null }}
      medicationName={medicationName}
      cycle={cycle}
      allMeds={[]}
      onValidSave={form.handleSave}
      onClose={onClose}
      leaveRef={leave}
      subscribeBeforeLeave={subscribeBeforeLeave}
    />
  );
}

// ─── Shared body ─────────────────────────────────────────────────────────────

type ReminderMode = "none" | "at_time" | "before";

/** What the body needs from either form core. */
interface FormSlice {
  name: string;
  pharmaceuticalForm: PharmaceuticalForm | "";
  concentration: string;
  doseAmount: string;
  frequency: string;
  frequencyUnit: FrequencyUnit;
  startDate: string;
  firstIntakeTime: string;
  endDate: string;
  reason: string;
  notes: string;
  price: string;
  reminderMode: ReminderMode;
  reminderOffsets: number[];
  treatmentIds: string[];
  selectedMedicationId: string | null;
  error: string | null;
  saving: boolean;
  setName?: (v: string) => void;
  setPharmaceuticalForm: (v: PharmaceuticalForm | "") => void;
  setConcentration: (v: string) => void;
  setDoseAmount: (v: string) => void;
  setDoseUnit: (v: DoseUnit | "") => void;
  setFrequency: (v: string) => void;
  setFrequencyUnit: (v: FrequencyUnit) => void;
  setStartDate?: (v: string) => void;
  setFirstIntakeTime?: (v: string) => void;
  setEndDate: (v: string) => void;
  setReason: (v: string) => void;
  setNotes: (v: string) => void;
  setPrice: (v: string) => void;
  setReminderMode: (v: ReminderMode) => void;
  setReminderOffsets: (v: number[]) => void;
  setTreatmentIds: (v: string[]) => void;
  selectExistingMedication?: (id: string, name: string) => void;
  clearSelectedMedication?: () => void;
  clearError: () => void;
}

function snapshot(f: FormSlice): string {
  return JSON.stringify([
    f.name, f.pharmaceuticalForm, f.concentration, f.doseAmount, f.frequency, f.frequencyUnit,
    f.startDate, f.firstIntakeTime, f.endDate, f.reason, f.notes, f.price, f.reminderMode,
    f.reminderOffsets, f.treatmentIds, f.selectedMedicationId,
  ]);
}

function valuesOf(f: FormSlice, isCreate: boolean): Values {
  return {
    isCreate,
    name: f.name,
    pharmaceuticalForm: f.pharmaceuticalForm,
    doseAmount: f.doseAmount,
    frequency: f.frequency,
    startDate: f.startDate,
    firstIntakeTime: f.firstIntakeTime,
    endDate: f.endDate,
  };
}

function MedicationFormBody({
  mode,
  form,
  medicationName,
  cycle,
  allMeds,
  onValidSave,
  onClose,
  leaveRef,
  subscribeBeforeLeave,
}: {
  mode: "create" | "cycle" | "edit";
  form: FormSlice;
  medicationName?: string;
  cycle?: MedicationCycle;
  allMeds: Medication[];
  onValidSave: () => void;
  onClose: () => void;
  leaveRef: MutableRefObject<() => void>;
  subscribeBeforeLeave: SubscribeBeforeLeave;
}) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const isCreate = mode !== "edit";

  // ── Leaving: «¿Descartar los cambios?» on a dirty back (formularios.md §7) ──
  const allowLeave = useRef(false);
  const [askDiscard, setAskDiscard] = useState(false);
  const baseline = useRef<string | null>(null);
  if (baseline.current === null) baseline.current = snapshot(form);
  const dirty = snapshot(form) !== baseline.current;
  leaveRef.current = () => {
    allowLeave.current = true;
    onClose();
  };
  useEffect(
    () =>
      subscribeBeforeLeave((prevent) => {
        if (!dirty || allowLeave.current) return;
        prevent();
        setAskDiscard(true);
      }),
    [subscribeBeforeLeave, dirty],
  );

  // ── Errors under each field after the first save attempt (formularios.md §6) ──
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(valuesOf(form, isCreate)) : {};

  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const sectionY = useRef({ medication: 0, prescription: 0, period: 0 });
  const nameRef = useRef<ComponentRef<typeof TextInput>>(null);
  const doseRef = useRef<ComponentRef<typeof TextInput>>(null);
  const frequencyRef = useRef<ComponentRef<typeof TextInput>>(null);

  const handleSave = () => {
    setSubmitted(true);
    const found = validate(valuesOf(form, isCreate));
    const keys = FIELD_ORDER.filter((k) => found[k]);
    if (keys.length === 0) return onValidSave();

    const first = keys[0]!;
    const section =
      first === "name" || first === "form" ? "medication" : first === "dose" || first === "frequency" ? "prescription" : "period";
    haptics.warning();
    scrollRef.current?.scrollTo({ y: Math.max(0, sectionY.current[section] - spacing[4]), animated: true });
    // Only text inputs take the focus; for chips and pickers the scroll is enough.
    const input = first === "name" ? nameRef : first === "dose" ? doseRef : first === "frequency" ? frequencyRef : null;
    if (input) setTimeout(() => input.current?.focus(), 300);
    AccessibilityInfo.announceForAccessibility(keys.length === 1 ? "Revisa 1 campo" : `Revisa ${keys.length} campos`);
  };

  // ── «No se pudo guardar»: the server error goes to a toast with «Reintentar» ──
  useEffect(() => {
    if (!form.error) return;
    haptics.error();
    notify({
      tone: "error",
      message: "No se pudo guardar",
      description: "Revisa tu conexión e intenta de nuevo.",
      action: { label: "Reintentar", onPress: handleSave },
    });
    form.clearError();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.error]);

  // ── Name suggestions (new medication only) ──
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = useMemo(() => {
    if (mode !== "create" || !form.name.trim() || form.selectedMedicationId) return [];
    const q = normalizeName(form.name);
    return allMeds.filter((m) => normalizeName(m.name).includes(q)).slice(0, 5);
  }, [mode, form.name, form.selectedMedicationId, allMeds]);

  // ── Derived values ──
  const unitInfo = form.pharmaceuticalForm ? FORM_UNIT[form.pharmaceuticalForm] : null;
  const summary = doseSummary(form.doseAmount, form.pharmaceuticalForm, form.frequency, form.frequencyUnit);
  const formOptions = (
    form.pharmaceuticalForm && !FORMS.includes(form.pharmaceuticalForm) ? [...FORMS, form.pharmaceuticalForm] : FORMS
  ).map((value) => ({ value, label: FORM_LABEL[value] }));
  const freqOptions = FREQ_UNITS.filter(
    (u) => u.value === "HOUR" || u.value === "DAY" || u.value === "WEEK" || u.value === form.frequencyUnit,
  ).map((u) => ({ value: u.value, label: u.label }));

  const reminderValue =
    form.reminderMode === "none"
      ? "none"
      : form.reminderMode === "at_time" || form.reminderOffsets.length === 0
        ? "0"
        : String(form.reminderOffsets[0]);
  const reminderOptions = [
    { value: "0", label: "Al momento de la toma" },
    { value: "15", label: "15 min antes" },
    ...(reminderValue !== "none" && reminderValue !== "0" && reminderValue !== "15"
      ? [{ value: reminderValue, label: `${reminderValue} min antes` }]
      : []),
    { value: "none", label: "Sin recordatorio" },
  ];

  const treatments = useTreatmentsQuery(1, 100).data?.items ?? [];
  const treatmentName = treatments.find((tr) => tr.id === form.treatmentIds[0])?.name ?? "";

  const [moreOpen, setMoreOpen] = useState(Boolean(form.reason || form.notes || form.price));

  const title = mode === "create" ? "Nuevo medicamento" : mode === "cycle" ? "Nuevo ciclo" : "Editar ciclo";
  const saveLabel = mode === "create" ? "Guardar medicamento" : mode === "cycle" ? "Guardar ciclo" : "Guardar cambios";

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScreenHeader title={title} subtitle={mode === "create" ? undefined : medicationName} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: BOTTOM_ACTION_BAR_HEIGHT + insets.bottom + spacing[8] }]}
        >
          <FormCard title="Medicamento" onLayout={(e) => { sectionY.current.medication = e.nativeEvent.layout.y; }}>
            {mode === "create" ? (
              <View style={styles.group}>
                <TextField
                  label="Nombre"
                  value={form.name}
                  onChange={(v) => {
                    form.setName?.(v);
                    form.clearSelectedMedication?.();
                    setShowSuggestions(true);
                  }}
                  placeholder="Ej: Metformina"
                  leadingIcon={<Pill size={18} color={t.text.secondary} />}
                  autoCapitalize="words"
                  error={errors.name}
                  inputRef={nameRef}
                />
                {form.selectedMedicationId ? (
                  <View style={styles.selected}>
                    <Check size={14} strokeWidth={3} color={t.status.successFg} />
                    <Text style={styles.selectedText}>Usarás tu medicamento guardado</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Crear uno nuevo con este nombre"
                      hitSlop={10}
                      onPress={() => form.clearSelectedMedication?.()}
                    >
                      <X size={14} color={t.status.successFg} />
                    </Pressable>
                  </View>
                ) : null}
                {showSuggestions && suggestions.length > 0 ? (
                  <View style={styles.suggestions}>
                    <Text style={styles.suggestionsTitle}>Ya tienes</Text>
                    {suggestions.map((med) => (
                      <Pressable
                        key={med.id}
                        accessibilityRole="button"
                        onPress={() => {
                          form.selectExistingMedication?.(med.id, med.name);
                          setShowSuggestions(false);
                        }}
                        style={({ pressed }) => [styles.suggestion, pressed && { backgroundColor: t.surface.muted }]}
                      >
                        <Pill size={16} color={t.accent.medFg} />
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {med.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : (
              <TextField
                label="Nombre"
                value={medicationName ?? ""}
                onChange={() => {}}
                disabled
                leadingIcon={<Pill size={18} color={t.text.secondary} />}
              />
            )}

            <View style={styles.group}>
              <FormLabel>Forma farmacéutica</FormLabel>
              <ChoiceChips
                options={formOptions}
                value={form.pharmaceuticalForm || null}
                onChange={(v) => {
                  const next = v as PharmaceuticalForm;
                  form.setPharmaceuticalForm(next);
                  form.setDoseUnit(FORM_UNIT[next].unit);
                }}
              />
              <FieldError message={errors.form} />
            </View>

            <TextField
              label="Concentración (opcional)"
              value={form.concentration}
              onChange={form.setConcentration}
              placeholder="Ej: 850 mg"
              autoCapitalize="none"
            />
          </FormCard>

          <FormCard title="Prescripción" onLayout={(e) => { sectionY.current.prescription = e.nativeEvent.layout.y; }}>
            <TextField
              label="Dosis por toma"
              value={form.doseAmount}
              onChange={(v) => form.setDoseAmount(v.replace(",", "."))}
              placeholder="Ej: 1"
              keyboardType="numbers-and-punctuation"
              unit={unitInfo?.trail}
              helper={unitInfo ? undefined : "La unidad sale de la forma farmacéutica."}
              error={errors.dose}
              inputRef={doseRef}
            />
            <View style={styles.group}>
              <TextField
                label="Frecuencia (cada cuánto)"
                value={form.frequency}
                onChange={form.setFrequency}
                placeholder="Ej: 12"
                keyboardType="number-pad"
                error={errors.frequency}
                inputRef={frequencyRef}
              />
              <ChoiceChips
                options={freqOptions}
                value={form.frequencyUnit}
                onChange={(v) => form.setFrequencyUnit(v as FrequencyUnit)}
              />
            </View>
            {summary ? (
              <Text style={styles.summary} accessibilityLiveRegion="polite">
                {summary}
              </Text>
            ) : null}
          </FormCard>

          <FormCard title="Periodo del ciclo" onLayout={(e) => { sectionY.current.period = e.nativeEvent.layout.y; }}>
            {isCreate ? (
              <>
                <View style={styles.row}>
                  <View style={styles.half}>
                    <DatePicker
                      label="Inicio"
                      value={form.startDate}
                      onChange={(v) => form.setStartDate?.(v)}
                      placeholder="Elige la fecha"
                      error={errors.startDate}
                    />
                  </View>
                  <View style={styles.half}>
                    <DatePicker
                      label="Fin (opcional)"
                      value={form.endDate}
                      onChange={form.setEndDate}
                      placeholder="Ej: 3 dic"
                      error={errors.endDate}
                    />
                  </View>
                </View>
                <TimePicker
                  label="Hora de la primera toma"
                  value={form.firstIntakeTime}
                  onChange={(v) => form.setFirstIntakeTime?.(v)}
                  placeholder="Elige la hora"
                  error={errors.time}
                />
              </>
            ) : (
              <>
                <View style={styles.readonly}>
                  <Text style={styles.readonlyLabel}>Inicio</Text>
                  <Text style={styles.readonlyValue}>
                    {formatShortDay(cycle!.startDate)}
                    {cycle!.firstIntakeTime ? ` · ${formatClock(new Date(cycle!.firstIntakeTime))}` : ""}
                  </Text>
                  <Text style={styles.readonlyHint}>Para cambiar el inicio, crea un ciclo nuevo.</Text>
                </View>
                <DatePicker
                  label="Fin (opcional)"
                  value={form.endDate}
                  onChange={form.setEndDate}
                  placeholder="Ej: 3 dic"
                  error={errors.endDate}
                />
              </>
            )}
          </FormCard>

          <FormCard title="Recordatorios">
            <ChoiceChips
              options={reminderOptions}
              value={reminderValue}
              onChange={(v) => {
                if (v === "none") return form.setReminderMode("none");
                if (v === "0") {
                  form.setReminderMode("at_time");
                  return form.setReminderOffsets([]);
                }
                form.setReminderMode("before");
                form.setReminderOffsets([Number(v)]);
              }}
            />
          </FormCard>

          <FormCard title="Tratamiento">
            <SelectField
              label="Tratamiento (opcional)"
              value={treatmentName}
              placeholder="Agregar tratamiento"
              options={[NO_TREATMENT, ...treatments.map((tr) => tr.name)]}
              onChange={(name) => {
                const match = treatments.find((tr) => tr.name === name);
                form.setTreatmentIds(match ? [match.id] : []);
              }}
            />
          </FormCard>

          <MoreDetailsToggle
            title="Más detalles (opcional)"
            hint="Razón, notas y precio"
            open={moreOpen}
            onToggle={() => {
              const opening = !moreOpen;
              setMoreOpen(opening);
              if (opening) setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
            }}
          />
          {moreOpen ? (
            <FormCard title="Más detalles">
              <TextField
                label="Razón / indicación (opcional)"
                value={form.reason}
                onChange={form.setReason}
                placeholder="Ej: Diabetes tipo 2"
              />
              <TextField
                label="Notas (opcional)"
                value={form.notes}
                onChange={form.setNotes}
                placeholder="Ej: Tomar con comida"
                multiline
                numberOfLines={3}
              />
              <TextField
                label="Precio (opcional)"
                value={form.price}
                onChange={(v) => form.setPrice(v.replace(/[^\d]/g, ""))}
                placeholder="Ej: 25000"
                keyboardType="number-pad"
                leadingIcon={<Text style={styles.currency}>$</Text>}
              />
            </FormCard>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomActionBar
        primary={{ label: saveLabel, onPress: handleSave, loading: form.saving, loadingLabel: "Guardando…", disabled: form.saving }}
      />

      {askDiscard ? (
        <DiscardChangesDialog
          onKeep={() => setAskDiscard(false)}
          onDiscard={() => {
            setAskDiscard(false);
            leaveRef.current();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.surface.bg },
    content: { padding: spacing[4], gap: spacing[4] },
    group: { gap: spacing[2] },
    row: { flexDirection: "row", gap: spacing[2] },
    half: { flex: 1 },
    summary: { fontSize: 14, fontFamily: nativeFont("body", 600), color: t.text.secondary },
    selected: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
      alignSelf: "flex-start",
      paddingHorizontal: spacing[3],
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: t.status.successBg,
    },
    selectedText: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.status.successFg },
    suggestions: {
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.input,
      backgroundColor: t.surface.bgCard,
      paddingVertical: spacing[1],
    },
    suggestionsTitle: {
      fontSize: 11,
      fontFamily: nativeFont("heading", 900),
      letterSpacing: 0.9,
      textTransform: "uppercase",
      color: t.text.secondary,
      paddingHorizontal: spacing[3],
      paddingTop: spacing[2],
    },
    suggestion: { flexDirection: "row", alignItems: "center", gap: spacing[2], minHeight: 44, paddingHorizontal: spacing[3] },
    suggestionText: { flex: 1, fontSize: 15, fontFamily: nativeFont("body", 600), color: t.text.primary },
    readonly: { gap: 2, padding: spacing[3], borderRadius: radii.input, backgroundColor: t.surface.muted },
    readonlyLabel: { fontSize: 13, fontFamily: nativeFont("heading", 800), color: t.text.primary },
    readonlyValue: { fontSize: 15, fontFamily: nativeFont("body", 600), color: t.text.primary },
    readonlyHint: { fontSize: 13, fontFamily: nativeFont("body", 400), color: t.text.secondary },
    currency: { fontSize: 15, fontFamily: nativeFont("body", 600), color: t.text.secondary },
  });
}
