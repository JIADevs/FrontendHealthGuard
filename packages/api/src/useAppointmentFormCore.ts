/**
 * useAppointmentFormCore — lógica de formulario de citas, agnóstica de plataforma.
 *
 * Cubre creación y edición. La plataforma inyecta `adapters` para
 * notificaciones (toasts/sileo) y cierre de modal.
 *
 * Uso:
 *   Crear:  useAppointmentFormCore({ adapters, afterSave: onClose })
 *   Editar: useAppointmentFormCore({ initial: appt, adapters, afterSave: onClose })
 */

import { useState } from "react";
import {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
} from "./hooks";
import { isApiError } from "./errors";
import type { Appointment } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentFormState {
  specialty: string;
  doctor: string;
  location: string;
  date: string;
  time: string;
  type: "APPOINTMENT" | "EXAM";
  examType: string;
  /** Inline validation / API error — display directly in the form UI. */
  error: string | null;
  saving: boolean;
  isEdit: boolean;
}

export interface AppointmentFormActions {
  setSpecialty: (v: string) => void;
  setDoctor: (v: string) => void;
  setLocation: (v: string) => void;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setType: (v: "APPOINTMENT" | "EXAM") => void;
  setExamType: (v: string) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface AppointmentFormAdapters {
  /** Called on successful create or update (e.g. show toast). */
  onSaveSuccess: () => void;
  /** Called after success, typically to close the modal/screen. */
  afterSave: () => void;
}

// ─── Core hook ────────────────────────────────────────────────────────────────

export function useAppointmentFormCore({
  initial,
  adapters,
}: {
  initial?: Appointment | null;
  adapters: AppointmentFormAdapters;
}): AppointmentFormState & AppointmentFormActions {
  const isEdit = !!initial;

  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [doctor, setDoctor] = useState(initial?.doctor ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().split("T")[0]!,
  );
  const [time, setTime] = useState(initial?.time?.slice(0, 5) ?? "09:00");
  const [type, setType] = useState<"APPOINTMENT" | "EXAM">(
    initial?.type ?? "APPOINTMENT",
  );
  const [examType, setExamType] = useState(initial?.examType ?? "");
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateAppointmentMutation();
  const updateMut = useUpdateAppointmentMutation();
  const saving = createMut.isPending || updateMut.isPending;

  function handleSave() {
    if (!specialty.trim() || !doctor.trim() || !location.trim() || !date || !time) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    setError(null);

    const payload = {
      specialty,
      doctor,
      location,
      date,
      time,
      type,
      status: initial?.status ?? "PENDING",
      examType: type === "EXAM" ? examType : undefined,
      tags: [] as string[],
      reminderOffsets: [] as number[],
    };

    if (isEdit) {
      updateMut.mutate(
        { id: initial!.id, appt: payload },
        {
          onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
          onError: (err) => setError(isApiError(err) ? err.message : "Error actualizando la cita."),
        },
      );
    } else {
      createMut.mutate(payload, {
        onSuccess: () => { adapters.onSaveSuccess(); adapters.afterSave(); },
        onError: (err) => setError(isApiError(err) ? err.message : "Error guardando la cita."),
      });
    }
  }

  return {
    specialty, doctor, location, date, time, type, examType,
    error, saving, isEdit,
    setSpecialty, setDoctor, setLocation, setDate, setTime, setType, setExamType,
    clearError: () => setError(null),
    handleSave,
  };
}
