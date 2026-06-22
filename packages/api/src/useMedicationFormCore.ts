/**
 * useMedicationFormCore — lógica de formulario de medicamentos, agnóstica de plataforma.
 *
 * Creación: POST /medications/ (nombre) → POST /medications/{id}/cycles (prescripción).
 * Edición:  PATCH /medications/{id} (nombre) — edición de ciclo es futura.
 */

import { useState } from "react";
import {
  useCreateMedicationMutation,
  useCreateMedicationCycleMutation,
  useUpdateMedicationMutation,
} from "./reactQueryHooks";
import { isApiError } from "./errors";
import type { Medication } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicationFormState {
  name: string;
  dosage: string;
  /** String para compatibilidad con inputs de texto; se parsea a int al guardar. */
  frequency: string;
  startDate: string;
  firstIntakeTime: string;
  reason: string;
  error: string | null;
  saving: boolean;
  isEdit: boolean;
}

export interface MedicationFormActions {
  setName: (v: string) => void;
  setDosage: (v: string) => void;
  setFrequency: (v: string) => void;
  setStartDate: (v: string) => void;
  setFirstIntakeTime: (v: string) => void;
  setReason: (v: string) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface MedicationFormAdapters {
  onSaveSuccess: () => void;
  afterSave: () => void;
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
  const [dosage, setDosage] = useState(activeCycle?.dosage ?? "");
  const [frequency, setFrequency] = useState(activeCycle?.frequency?.toString() ?? "8");
  const [startDate, setStartDate] = useState(
    activeCycle?.startDate ?? new Date().toISOString().split("T")[0]!,
  );
  const [firstIntakeTime, setFirstIntakeTime] = useState(() => {
    const raw = activeCycle?.firstIntakeTime;
    if (!raw) return "08:00";
    const timePart = raw.includes("T") ? raw.split("T")[1]! : raw;
    return timePart.slice(0, 5);
  });
  const [reason, setReason] = useState(activeCycle?.reason ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMedMut = useCreateMedicationMutation();
  const createCycleMut = useCreateMedicationCycleMutation();
  const updateMedMut = useUpdateMedicationMutation();

  const saving = createMedMut.isPending || createCycleMut.isPending || updateMedMut.isPending;

  function handleSave() {
    if (!name.trim() || !dosage.trim() || !frequency || !startDate || !firstIntakeTime) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);

    const cyclePayload = {
      dosage,
      frequency: Number.parseInt(frequency, 10),
      reason: reason.trim() || undefined,
      startDate,
      firstIntakeTime: `${startDate}T${firstIntakeTime}:00`,
      reminderOffsets: [60, 30, 15, 5],
    };

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
    } else {
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
  }

  return {
    name, dosage, frequency, startDate, firstIntakeTime, reason,
    error, saving, isEdit,
    setName, setDosage, setFrequency, setStartDate, setFirstIntakeTime, setReason,
    clearError: () => setError(null),
    handleSave,
  };
}
