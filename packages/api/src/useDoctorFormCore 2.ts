/**
 * useDoctorFormCore — lógica de formulario de doctores, agnóstica de plataforma.
 *
 * Cubre creación y edición. La plataforma inyecta `adapters` para
 * notificaciones (toasts/sileo) y cierre de modal.
 */

import { useState } from "react";
import {
  useCreateDoctorMutation,
  useUpdateDoctorMutation,
} from "./hooks";
import { isApiError } from "./errors";
import type { Doctor } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DoctorFormState {
  name: string;
  specialty: string;
  clinic: string;
  phone: string;
  notes: string;
  error: string | null;
  saving: boolean;
  isEdit: boolean;
}

export interface DoctorFormActions {
  setName: (v: string) => void;
  setSpecialty: (v: string) => void;
  setClinic: (v: string) => void;
  setPhone: (v: string) => void;
  setNotes: (v: string) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface DoctorFormAdapters {
  onSaveSuccess: () => void;
  afterSave: () => void;
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useDoctorFormCore({
  initial,
  adapters,
}: {
  initial?: Doctor | null;
  adapters: DoctorFormAdapters;
}): DoctorFormState & DoctorFormActions {
  const isEdit = !!initial;

  const [name, setName] = useState(initial?.name ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [clinic, setClinic] = useState(initial?.clinic ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateDoctorMutation();
  const updateMut = useUpdateDoctorMutation();
  const saving = createMut.isPending || updateMut.isPending;

  function handleSave() {
    if (!name.trim()) {
      setError("El nombre del doctor es obligatorio.");
      return;
    }
    setError(null);

    const payload = {
      name: name.trim(),
      specialty: specialty.trim() || undefined,
      clinic: clinic.trim() || undefined,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (isEdit) {
      updateMut.mutate(
        { id: initial!.id, doctor: payload },
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => setError(isApiError(err) ? err.message : "Error actualizando el doctor."),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
        onError: (err) => setError(isApiError(err) ? err.message : "Error guardando el doctor."),
      });
    }
  }

  return {
    name, specialty, clinic, phone, notes,
    error, saving, isEdit,
    setName, setSpecialty, setClinic, setPhone, setNotes,
    clearError: () => setError(null),
    handleSave,
  };
}
