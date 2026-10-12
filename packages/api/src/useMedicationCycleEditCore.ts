/**
 * useMedicationCycleEditCore — lógica para editar un ciclo existente.
 *
 * Editable: pharmaceuticalForm, concentration, doseAmount, doseUnit,
 *           frequency, frequencyUnit, price, reason, notes, endDate, reminderOffsets.
 * No editable: startDate, firstIntakeTime (quedan fijos desde la creación).
 */

import { useState } from "react";
import { useUpdateMedicationCycleMutation } from "./reactQueryHooks";
import { isApiError } from "./errors";
import type { MedicationCycle, PharmaceuticalForm, DoseUnit, FrequencyUnit } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReminderMode = "none" | "at_time" | "before";

export interface CycleEditFormState {
  pharmaceuticalForm: PharmaceuticalForm | "";
  concentration: string;
  doseAmount: string;
  doseUnit: DoseUnit | "";
  dosage: string;
  frequency: string;
  frequencyUnit: FrequencyUnit;
  price: string;
  reason: string;
  notes: string;
  endDate: string;
  reminderMode: ReminderMode;
  reminderOffsets: number[];
  treatmentIds: string[];
  error: string | null;
  saving: boolean;
}

export interface CycleEditFormActions {
  setPharmaceuticalForm: (v: PharmaceuticalForm | "") => void;
  setConcentration: (v: string) => void;
  setDoseAmount: (v: string) => void;
  setDoseUnit: (v: DoseUnit | "") => void;
  setFrequency: (v: string) => void;
  setFrequencyUnit: (v: FrequencyUnit) => void;
  setPrice: (v: string) => void;
  setReason: (v: string) => void;
  setNotes: (v: string) => void;
  setEndDate: (v: string) => void;
  setReminderMode: (v: ReminderMode) => void;
  toggleReminderOffset: (minutes: number) => void;
  setTreatmentIds: (v: string[]) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface CycleEditFormAdapters {
  onSaveSuccess: () => void;
  afterSave: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildDosageString(doseAmount: string, doseUnit: DoseUnit | "", concentration: string): string {
  const parts: string[] = [];
  if (doseAmount) parts.push(doseAmount);
  if (doseUnit) parts.push(doseUnit.toLowerCase());
  if (concentration) parts.push(concentration);
  return parts.join(" ").trim() || "—";
}

function inferReminderMode(offsets: number[]): ReminderMode {
  if (!offsets.length) return "none";
  if (offsets.length === 1 && offsets[0] === 0) return "at_time";
  return "before";
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useMedicationCycleEditCore({
  cycle,
  adapters,
}: {
  cycle: MedicationCycle;
  adapters: CycleEditFormAdapters;
}): CycleEditFormState & CycleEditFormActions {
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState<PharmaceuticalForm | "">(
    (cycle.pharmaceuticalForm as PharmaceuticalForm | null) ?? ""
  );
  const [concentration, setConcentration] = useState(cycle.concentration ?? "");
  const [doseAmount, setDoseAmount] = useState(cycle.doseAmount?.toString() ?? "");
  const [doseUnit, setDoseUnit] = useState<DoseUnit | "">((cycle.doseUnit as DoseUnit | null) ?? "");
  const [frequency, setFrequency] = useState(cycle.frequency.toString());
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>(
    (cycle.frequencyUnit as FrequencyUnit) ?? "HOUR"
  );
  const [price, setPrice] = useState(cycle.price?.toString() ?? "");
  const [reason, setReason] = useState(cycle.reason ?? "");
  const [notes, setNotes] = useState(cycle.notes ?? "");
  const [endDate, setEndDate] = useState(cycle.endDate ? cycle.endDate.slice(0, 10) : "");
  const [reminderMode, setReminderMode] = useState<ReminderMode>(
    inferReminderMode(cycle.reminderOffsets)
  );
  const [reminderOffsets, setReminderOffsets] = useState<number[]>(
    cycle.reminderOffsets.filter((o) => o > 0)
  );
  const [treatmentIds, setTreatmentIds] = useState<string[]>(cycle.treatmentIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const updateMut = useUpdateMedicationCycleMutation();
  const saving = updateMut.isPending;

  function toggleReminderOffset(minutes: number) {
    setReminderOffsets((prev) =>
      prev.includes(minutes) ? prev.filter((m) => m !== minutes) : [...prev, minutes]
    );
  }

  function handleSave() {
    if (!frequency) {
      setError("La frecuencia es obligatoria.");
      return;
    }
    const freqNum = Number.parseInt(frequency, 10);
    if (Number.isNaN(freqNum) || freqNum < 1) {
      setError("La frecuencia debe ser un número mayor a 0.");
      return;
    }
    setError(null);

    let resolvedOffsets: number[];
    if (reminderMode === "none") resolvedOffsets = [];
    else if (reminderMode === "at_time") resolvedOffsets = [0];
    else resolvedOffsets = reminderOffsets;

    const builtDosage = buildDosageString(doseAmount, doseUnit, concentration);

    updateMut.mutate(
      {
        id: cycle.id,
        cycle: {
          dosage: builtDosage === "—" ? cycle.dosage : builtDosage,
          frequency: freqNum,
          frequencyUnit,
          pharmaceuticalForm: pharmaceuticalForm || null,
          concentration: concentration.trim() || null,
          doseAmount: doseAmount ? Number.parseFloat(doseAmount) : null,
          doseUnit: doseUnit || null,
          price: price ? Number.parseFloat(price) : null,
          reason: reason.trim() || null,
          notes: notes.trim() || null,
          endDate: endDate || null,
          reminderOffsets: resolvedOffsets,
          treatmentIds,
        },
      },
      {
        onSuccess: () => {
          adapters.onSaveSuccess();
          adapters.afterSave();
        },
        onError: (err: unknown) => {
          setError(isApiError(err) ? err.message : "Error al guardar el ciclo.");
        },
      },
    );
  }

  const dosage = buildDosageString(doseAmount, doseUnit, concentration);

  return {
    pharmaceuticalForm, concentration, doseAmount, doseUnit, dosage,
    frequency, frequencyUnit, price, reason, notes, endDate,
    reminderMode, reminderOffsets, treatmentIds,
    error, saving,
    setPharmaceuticalForm, setConcentration, setDoseAmount, setDoseUnit,
    setFrequency, setFrequencyUnit, setPrice, setReason, setNotes, setEndDate,
    setReminderMode, toggleReminderOffset, setTreatmentIds,
    clearError: () => setError(null),
    handleSave,
  };
}
