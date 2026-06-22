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
import type { Medication } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MedicationFormState {
  name: string;
  dosage: string;
  /** String para compatibilidad con inputs de texto; se parsea a int al guardar. */
  frequency: string;
  startDate: string;
  firstIntakeTime: string;
  endDate: string;
  reason: string;
  notes: string;
  /** ID del medicamento existente seleccionado por búsqueda; null = crear uno nuevo. */
  selectedMedicationId: string | null;
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
  setEndDate: (v: string) => void;
  setReason: (v: string) => void;
  setNotes: (v: string) => void;
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
  const [endDate, setEndDate] = useState(activeCycle?.endDate ?? "");
  const [reason, setReason] = useState(activeCycle?.reason ?? "");
  const [notes, setNotes] = useState(activeCycle?.notes ?? "");
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
      notes: notes.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      firstIntakeTime: `${startDate}T${firstIntakeTime}:00`,
      reminderOffsets: [60, 30, 15, 5],
    };

    if (isEdit) {
      updateMedMut.mutate(
        { id: initial!.id, name } as any,
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => {
            setError(isApiError(err) ? err.message : "Error actualizando el medicamento.");
          },
        },
      );
      return;
    }

    // Si se seleccionó un medicamento existente, solo crear el ciclo
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

    // Crear nuevo medicamento y su primer ciclo
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
    if (!dosage.trim() || !frequency || !startDate || !firstIntakeTime) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);

    const cyclePayload = {
      dosage,
      frequency: Number.parseInt(frequency, 10),
      reason: reason.trim() || undefined,
      notes: notes.trim() || undefined,
      startDate,
      endDate: endDate || undefined,
      firstIntakeTime: `${startDate}T${firstIntakeTime}:00`,
      reminderOffsets: [60, 30, 15, 5],
    };

    createCycleMut.mutate(
      { medicationId, cycle: cyclePayload },
      {
        onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
        onError: (err) => {
          setError(isApiError(err) ? err.message : "Error guardando el ciclo.");
        },
      },
    );
  }

  return {
    name, dosage, frequency, startDate, firstIntakeTime, endDate, reason, notes,
    selectedMedicationId,
    error, saving, isEdit,
    setName, setDosage, setFrequency, setStartDate, setFirstIntakeTime, setEndDate,
    setReason, setNotes,
    selectExistingMedication, clearSelectedMedication,
    clearError: () => setError(null),
    handleSave,
    handleSaveWithExistingMedication,
  };
}
