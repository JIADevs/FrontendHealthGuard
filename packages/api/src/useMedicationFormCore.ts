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
} from "./reactQueryHooks";
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
  const [firstIntakeTime, setFirstIntakeTime] = useState(() => {
    const raw = initial?.firstIntakeTime;
    if (!raw) return "08:00";
    // Backend returns full datetime "2026-04-02T08:00:00" — extract HH:MM
    const timePart = raw.includes("T") ? raw.split("T")[1]! : raw;
    return timePart.slice(0, 5);
  });
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
      firstIntakeTime: `${startDate}T${firstIntakeTime}:00`,
      indications: indications || undefined,
      reminderOffsets: [60, 30, 15, 5],
    };

    if (isEdit) {
      updateMut.mutate(
        { id: initial!.id, med: payload },
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => {
          if (isApiError(err) && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
            const details = Object.entries(err.fieldErrors).map(([f, m]) => `${f}: ${m}`).join(" | ");
            setError(`Error de validación: ${details}`);
          } else {
            setError(isApiError(err) ? err.message : "Error actualizando el medicamento.");
          }
        },
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
        onError: (err) => {
          if (isApiError(err) && err.fieldErrors && Object.keys(err.fieldErrors).length > 0) {
            const details = Object.entries(err.fieldErrors).map(([f, m]) => `${f}: ${m}`).join(" | ");
            setError(`Error de validación: ${details}`);
          } else {
            setError(isApiError(err) ? err.message : "Error guardando el medicamento.");
          }
        },
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
