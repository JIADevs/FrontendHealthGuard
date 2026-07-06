/**
 * useMedicationFormCore — lógica de formulario de ciclos de medicamento, agnóstica de plataforma.
 *
 * Creación nueva: POST /medications/ (nombre) → POST /medications/{id}/cycles (ciclo).
 * Ciclo sobre existente: POST /medications/{existingId}/cycles directamente.
 * Edición: PATCH /medications/{id} (nombre) — edición de ciclo es futura.
 */

import { useState } from "react";
import {
  useCreateMedicationMutation,
  useCreateMedicationCycleMutation,
  useUpdateMedicationMutation,
} from "./reactQueryHooks";
import { isApiError } from "./errors";
import type { Medication, PharmaceuticalForm, DoseUnit, FrequencyUnit } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Modo de recordatorio para el ciclo */
export type ReminderMode = "none" | "at_time" | "before";

export interface MedicationFormState {
  name: string;
  pharmaceuticalForm: PharmaceuticalForm | "";
  concentration: string;
  doseAmount: string;
  doseUnit: DoseUnit | "";
  /** Texto libre de dosis — se auto-construye; se mantiene por compat con la API */
  dosage: string;
  /** Valor numérico de la frecuencia */
  frequency: string;
  /** Unidad de la frecuencia */
  frequencyUnit: FrequencyUnit;
  startDate: string;
  firstIntakeTime: string;
  endDate: string;
  reason: string;
  notes: string;
  price: string;
  /** Cómo se recuerda la toma */
  reminderMode: ReminderMode;
  /** Offsets en minutos cuando reminderMode === "before" */
  reminderOffsets: number[];
  /** IDs de tratamientos asociados al ciclo */
  treatmentIds: string[];
  /** ID del medicamento existente seleccionado por búsqueda; null = crear uno nuevo. */
  selectedMedicationId: string | null;
  error: string | null;
  saving: boolean;
  isEdit: boolean;
}

export interface MedicationFormActions {
  setName: (v: string) => void;
  setPharmaceuticalForm: (v: PharmaceuticalForm | "") => void;
  setConcentration: (v: string) => void;
  setDoseAmount: (v: string) => void;
  setDoseUnit: (v: DoseUnit | "") => void;
  setFrequency: (v: string) => void;
  setFrequencyUnit: (v: FrequencyUnit) => void;
  setStartDate: (v: string) => void;
  setFirstIntakeTime: (v: string) => void;
  setEndDate: (v: string) => void;
  setReason: (v: string) => void;
  setNotes: (v: string) => void;
  setPrice: (v: string) => void;
  setReminderMode: (v: ReminderMode) => void;
  toggleReminderOffset: (minutes: number) => void;
  setTreatmentIds: (v: string[]) => void;
  /** Selecciona un medicamento existente; rellena nombre e impide crear uno nuevo. */
  selectExistingMedication: (id: string, name: string) => void;
  /** Limpia la selección de medicamento existente (al editar el nombre manualmente). */
  clearSelectedMedication: () => void;
  clearError: () => void;
  handleSave: () => void;
  handleSaveWithExistingMedication: (medicationId: string) => void;
}

export interface MedicationFormAdapters {
  onSaveSuccess: () => void;
  afterSave: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOSE_UNIT_ES: Record<string, string> = {
  TABLET: "tableta(s)",
  ML:     "ml",
  DROPS:  "gotas",
  GRAMS:  "gramos",
  MG:     "mg",
  UNITS:  "unidad(es)",
};

function buildDosageString(doseAmount: string, doseUnit: DoseUnit | "", concentration: string): string {
  const parts: string[] = [];
  if (doseAmount) parts.push(doseAmount);
  if (doseUnit) parts.push(DOSE_UNIT_ES[doseUnit] ?? doseUnit.toLowerCase());
  if (concentration) parts.push(concentration);
  return parts.join(" ").trim() || "—";
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useMedicationFormCore({
  initial,
  adapters,
}: {
  initial?: Medication | null;
  adapters: MedicationFormAdapters;
}): MedicationFormState & MedicationFormActions {
  const isEdit = !!initial;
  const activeCycle = initial?.cycles?.[0];

  const [name, setName] = useState(initial?.name ?? "");
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState<PharmaceuticalForm | "">(
    (activeCycle as any)?.pharmaceuticalForm ?? ""
  );
  const [concentration, setConcentration] = useState((activeCycle as any)?.concentration ?? "");
  const [doseAmount, setDoseAmount] = useState(
    (activeCycle as any)?.doseAmount?.toString() ?? ""
  );
  const [doseUnit, setDoseUnit] = useState<DoseUnit | "">((activeCycle as any)?.doseUnit ?? "");
  const [frequency, setFrequency] = useState(activeCycle?.frequency?.toString() ?? "8");
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>(
    (activeCycle as any)?.frequencyUnit ?? "HOUR"
  );
  const [startDate, setStartDate] = useState(
    activeCycle?.startDate ?? new Date().toISOString().split("T")[0]!,
  );
  const [firstIntakeTime, setFirstIntakeTime] = useState(() => {
    const raw = activeCycle?.firstIntakeTime;
    if (!raw) return "08:00";
    const timePart = raw.includes("T") ? raw.split("T")[1]! : raw;
    return timePart.slice(0, 5);
  });
  const [endDate, setEndDate] = useState(activeCycle?.endDate ?? "");
  const [reason, setReason] = useState(activeCycle?.reason ?? "");
  const [notes, setNotes] = useState(activeCycle?.notes ?? "");
  const [price, setPrice] = useState((activeCycle as any)?.price?.toString() ?? "");
  const [reminderMode, setReminderMode] = useState<ReminderMode>("at_time");
  const [reminderOffsets, setReminderOffsets] = useState<number[]>([30]);
  const [treatmentIds, setTreatmentIds] = useState<string[]>([]);
  const [selectedMedicationId, setSelectedMedicationId] = useState<string | null>(
    isEdit ? initial!.id : null,
  );
  const [error, setError] = useState<string | null>(null);

  const createMedMut = useCreateMedicationMutation();
  const createCycleMut = useCreateMedicationCycleMutation();
  const updateMedMut = useUpdateMedicationMutation();

  const saving = createMedMut.isPending || createCycleMut.isPending || updateMedMut.isPending;

  function selectExistingMedication(id: string, medName: string) {
    setSelectedMedicationId(id);
    setName(medName);
  }

  function clearSelectedMedication() {
    setSelectedMedicationId(null);
  }

  function toggleReminderOffset(minutes: number) {
    setReminderOffsets((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes]
    );
  }

  function buildCyclePayload() {
    const dosage = buildDosageString(doseAmount, doseUnit, concentration);
    let resolvedOffsets: number[];
    if (reminderMode === "none") resolvedOffsets = [];
    else if (reminderMode === "at_time") resolvedOffsets = [0];
    else resolvedOffsets = reminderOffsets;

    return {
      dosage,
      frequency: Number.parseInt(frequency, 10),
      frequencyUnit,
      pharmaceuticalForm: pharmaceuticalForm || undefined,
      concentration: concentration.trim() || undefined,
      doseAmount: doseAmount ? Number.parseFloat(doseAmount) : undefined,
      doseUnit: doseUnit || undefined,
      price: price ? Number.parseFloat(price) : undefined,
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      firstIntakeTime: `${startDate}T${firstIntakeTime}:00`,
      reminderOffsets: resolvedOffsets,
      treatmentIds,
    };
  }

  function handleSave() {
    if (!name.trim() || !frequency || !startDate || !firstIntakeTime) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);

    const cyclePayload = buildCyclePayload();

    if (isEdit) {
      updateMedMut.mutate(
        { id: initial!.id, name },
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => {
            setError(isApiError(err) ? err.message : "Error actualizando el medicamento.");
          },
        },
      );
      return;
    }

    if (selectedMedicationId) {
      createCycleMut.mutate(
        { medicationId: selectedMedicationId, cycle: cyclePayload },
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => {
            setError(isApiError(err) ? err.message : "Error guardando el ciclo.");
          },
        },
      );
      return;
    }

    createMedMut.mutate(name, {
      onSuccess: (med) => {
        createCycleMut.mutate(
          { medicationId: med.id, cycle: cyclePayload },
          {
            onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
            onError: (err) => {
              setError(isApiError(err) ? err.message : "Error guardando el ciclo.");
            },
          },
        );
      },
      onError: (err) => {
        setError(isApiError(err) ? err.message : "Error guardando el medicamento.");
      },
    });
  }

  function handleSaveWithExistingMedication(medicationId: string) {
    if (!frequency || !startDate || !firstIntakeTime) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);

    createCycleMut.mutate(
      { medicationId, cycle: buildCyclePayload() },
      {
        onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
        onError: (err) => {
          setError(isApiError(err) ? err.message : "Error guardando el ciclo.");
        },
      },
    );
  }

  const dosage = buildDosageString(doseAmount, doseUnit, concentration);

  return {
    name, pharmaceuticalForm, concentration, doseAmount, doseUnit, dosage,
    frequency, frequencyUnit, startDate, firstIntakeTime, endDate,
    reason, notes, price, reminderMode, reminderOffsets, treatmentIds,
    selectedMedicationId,
    error, saving, isEdit,
    setName, setPharmaceuticalForm, setConcentration, setDoseAmount, setDoseUnit,
    setFrequency, setFrequencyUnit, setStartDate, setFirstIntakeTime, setEndDate,
    setReason, setNotes, setPrice, setReminderMode, toggleReminderOffset, setTreatmentIds,
    selectExistingMedication, clearSelectedMedication,
    clearError: () => setError(null),
    handleSave,
    handleSaveWithExistingMedication,
  };
}
