/**
 * useMedicationCycleEditCore — lógica para editar un ciclo existente.
 *
 * Editable: dosage, frequency, reason, notes, endDate, reminderOffsets.
 * No editable: startDate, firstIntakeTime (quedan fijos desde la creación).
 */

import { useState } from "react";
import { useUpdateMedicationCycleMutation } from "./reactQueryHooks";
import { isApiError } from "./errors";
import type { MedicationCycle } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CycleEditFormState {
  dosage: string;
  frequency: string;
  reason: string;
  notes: string;
  endDate: string;
  error: string | null;
  saving: boolean;
}

export interface CycleEditFormActions {
  setDosage: (v: string) => void;
  setFrequency: (v: string) => void;
  setReason: (v: string) => void;
  setNotes: (v: string) => void;
  setEndDate: (v: string) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface CycleEditFormAdapters {
  onSaveSuccess: () => void;
  afterSave: () => void;
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useMedicationCycleEditCore({
  cycle,
  adapters,
}: {
  cycle: MedicationCycle;
  adapters: CycleEditFormAdapters;
}): CycleEditFormState & CycleEditFormActions {
  const [dosage, setDosage] = useState(cycle.dosage);
  const [frequency, setFrequency] = useState(cycle.frequency.toString());
  const [reason, setReason] = useState(cycle.reason ?? "");
  const [notes, setNotes] = useState(cycle.notes ?? "");
  const [endDate, setEndDate] = useState(
    cycle.endDate ? cycle.endDate.slice(0, 10) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const updateMut = useUpdateMedicationCycleMutation();
  const saving = updateMut.isPending;

  function handleSave() {
    if (!dosage.trim() || !frequency) {
      setError("Dosis y frecuencia son obligatorias.");
      return;
    }
    const freqNum = Number.parseInt(frequency, 10);
    if (Number.isNaN(freqNum) || freqNum < 1) {
      setError("La frecuencia debe ser un número mayor a 0.");
      return;
    }
    setError(null);

    updateMut.mutate(
      {
        id: cycle.id,
        cycle: {
          dosage: dosage.trim(),
          frequency: freqNum,
          reason: reason.trim() || null,
          notes: notes.trim() || null,
          endDate: endDate || null,
        },
      },
      {
        onSuccess: () => {
          adapters.onSaveSuccess();
          adapters.afterSave();
        },
        onError: (err) => {
          setError(isApiError(err) ? err.message : "Error al guardar el ciclo.");
        },
      },
    );
  }

  return {
    dosage, frequency, reason, notes, endDate,
    error, saving,
    setDosage, setFrequency, setReason, setNotes, setEndDate,
    clearError: () => setError(null),
    handleSave,
  };
}
