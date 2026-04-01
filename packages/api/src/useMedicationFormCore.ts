/**
 * useMedicationFormCore — lógica de formulario de medicamentos, agnóstica de plataforma.
 *
 * Cubre creación y edición. La plataforma inyecta `adapters` para
 * notificaciones (toasts/sileo) y navegación/cierre de modal.
 *
 * Uso:
 *   Crear:  useMedicationFormCore({ adapters, afterSave: onClose })
 *   Editar: useMedicationFormCore({ initial: med, adapters, afterSave: onClose })
 */

import { useState } from "react";
import {
  useCreateMedicationMutation,
  useUpdateMedicationMutation,
} from "./hooks";
import { isApiError } from "./errors";
import type { Medication } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicationFormState {
  name: string;
  dosage: string;
  /** Kept as string for text-input compatibility; parsed to int on save. */
  frequency: string;
  startDate: string;
  firstIntakeTime: string;
  indications: string;
  /** Inline validation / API error — display directly in the form UI. */
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
  setIndications: (v: string) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface MedicationFormAdapters {
  /** Called on successful create or update (e.g. show toast). */
  onSaveSuccess: () => void;
  /** Called after success, typically to close the modal/screen. */
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

  const [name, setName] = useState(initial?.name ?? "");
  const [dosage, setDosage] = useState(initial?.dosage ?? "");
  const [frequency, setFrequency] = useState(
    initial?.frequency?.toString() ?? "8",
  );
  const [startDate, setStartDate] = useState(
    initial?.startDate ?? new Date().toISOString().split("T")[0]!,
  );
  const [firstIntakeTime, setFirstIntakeTime] = useState(
    initial?.firstIntakeTime?.slice(0, 5) ?? "08:00",
  );
  const [indications, setIndications] = useState(initial?.indications ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateMedicationMutation();
  const updateMut = useUpdateMedicationMutation();
  const saving = createMut.isPending || updateMut.isPending;

  function handleSave() {
    if (!name.trim() || !dosage.trim() || !frequency || !startDate || !firstIntakeTime) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);

    const payload = {
      name,
      dosage,
      frequency: parseInt(frequency, 10),
      startDate,
      firstIntakeTime,
      indications: indications || undefined,
      reminderOffsets: [60, 30, 15, 5],
    };

    if (isEdit) {
      updateMut.mutate(
        { id: initial!.id, med: payload },
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => setError(isApiError(err) ? err.message : "Error actualizando el medicamento."),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
        onError: (err) => setError(isApiError(err) ? err.message : "Error guardando el medicamento."),
      });
    }
  }

  return {
    name, dosage, frequency, startDate, firstIntakeTime, indications,
    error, saving, isEdit,
    setName, setDosage, setFrequency, setStartDate, setFirstIntakeTime, setIndications,
    clearError: () => setError(null),
    handleSave,
  };
}
