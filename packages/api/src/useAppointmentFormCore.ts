/**
 * useAppointmentFormCore — lógica de formulario de citas, agnóstica de plataforma.
 *
 * Cubre creación y edición. La plataforma inyecta `adapters` para
 * notificaciones (toasts/sileo) y cierre de modal.
 */

import { useState } from "react";
import {
  useCreateAppointmentMutation,
  useUpdateAppointmentMutation,
} from "./hooks";
import { isApiError } from "./errors";
import type { Appointment, ReminderConfig } from "./schemas";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppointmentFormState {
  name: string;
  /** ISO date string "YYYY-MM-DD" */
  date: string;
  /** Time string "HH:mm" */
  time: string;
  modality: "PRESENCIAL" | "VIRTUAL" | "DOMICILIARIA";
  location: string;
  videoCallLink: string;
  specialty: string;
  service: string;
  consultationType: string;
  duration: string;
  doctorId: string;
  doctor: string;
  clinic: string;
  type: "APPOINTMENT" | "EXAM";
  status: string;
  examType: string;
  cost: string;
  notes: string;
  customReminder: string;
  treatmentTags: string[];
  treatmentIds: string[];
  preDocumentIds: string[];
  postDocumentIds: string[];
  preBackpackIds: string[];
  postBackpackIds: string[];
  reminderConfig: ReminderConfig | null;
  /** Inline validation / API error — display directly in the form UI. */
  error: string | null;
  saving: boolean;
  isEdit: boolean;
}

export interface AppointmentFormActions {
  setName: (v: string) => void;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setModality: (v: "PRESENCIAL" | "VIRTUAL" | "DOMICILIARIA") => void;
  setLocation: (v: string) => void;
  setVideoCallLink: (v: string) => void;
  setSpecialty: (v: string) => void;
  setService: (v: string) => void;
  setConsultationType: (v: string) => void;
  setDuration: (v: string) => void;
  setDoctorId: (v: string) => void;
  setDoctor: (v: string) => void;
  setClinic: (v: string) => void;
  setType: (v: "APPOINTMENT" | "EXAM") => void;
  setStatus: (v: string) => void;
  setExamType: (v: string) => void;
  setCost: (v: string) => void;
  setNotes: (v: string) => void;
  setCustomReminder: (v: string) => void;
  setTreatmentTags: (v: string[]) => void;
  setTreatmentIds: (v: string[]) => void;
  setPreDocumentIds: (v: string[]) => void;
  setPostDocumentIds: (v: string[]) => void;
  setPreBackpackIds: (v: string[]) => void;
  setPostBackpackIds: (v: string[]) => void;
  setReminderConfig: (v: ReminderConfig | null) => void;
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

  const [name, setName] = useState(initial?.name ?? "");
  const [date, setDate] = useState(
    initial?.date ?? new Date().toISOString().split("T")[0]!,
  );
  const [time, setTime] = useState(initial?.time?.slice(0, 5) ?? "09:00");
  const [modality, setModality] = useState<"PRESENCIAL" | "VIRTUAL" | "DOMICILIARIA">(
    initial?.modality ?? "PRESENCIAL",
  );
  const [location, setLocation] = useState(initial?.location ?? "");
  const [videoCallLink, setVideoCallLink] = useState(initial?.videoCallLink ?? "");
  const [specialty, setSpecialty] = useState(initial?.specialty ?? "");
  const [service, setService] = useState(initial?.service ?? "");
  const [consultationType, setConsultationType] = useState(initial?.consultationType ?? "");
  const [duration, setDuration] = useState(initial?.duration?.toString() ?? "");
  const [doctorId, setDoctorId] = useState(initial?.doctorId ?? "");
  const [doctor, setDoctor] = useState(initial?.doctor ?? "");
  const [clinic, setClinic] = useState(initial?.clinic ?? "");
  const [type, setType] = useState<"APPOINTMENT" | "EXAM">(
    initial?.type ?? "APPOINTMENT",
  );
  const [status, setStatus] = useState(initial?.status ?? "PROGRAMADA");
  const [examType, setExamType] = useState(initial?.examType ?? "");
  const [cost, setCost] = useState(initial?.cost?.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [customReminder, setCustomReminder] = useState(initial?.customReminder ?? "");
  const [treatmentTags, setTreatmentTags] = useState<string[]>(initial?.treatmentTags ?? []);
  const initialTreatmentIds = initial?.treatmentIds?.length
    ? initial.treatmentIds
    : (initial?.treatmentId ? [initial.treatmentId] : []);
  const [treatmentIds, setTreatmentIds] = useState<string[]>(initialTreatmentIds);
  const [preDocumentIds, setPreDocumentIds] = useState<string[]>(initial?.preDocumentIds ?? []);
  const [postDocumentIds, setPostDocumentIds] = useState<string[]>(initial?.postDocumentIds ?? []);
  const [preBackpackIds, setPreBackpackIds] = useState<string[]>(initial?.preBackpackIds ?? []);
  const [postBackpackIds, setPostBackpackIds] = useState<string[]>(initial?.postBackpackIds ?? []);
  const [reminderConfig, setReminderConfig] = useState<ReminderConfig | null>(
    initial?.reminderConfig ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateAppointmentMutation();
  const updateMut = useUpdateAppointmentMutation();
  const saving = createMut.isPending || updateMut.isPending;

  function handleSave() {
    if (!date || !time) {
      setError("Fecha y hora son obligatorios.");
      return;
    }

    if (modality === "PRESENCIAL" && !location.trim()) {
      setError("El lugar es obligatorio para citas presenciales.");
      return;
    }

    if (modality === "VIRTUAL" && !videoCallLink.trim()) {
      setError("El link de videollamada es obligatorio para citas virtuales.");
      return;
    }

    setError(null);

    const payload = {
      name: name.trim() || undefined,
      date,
      time,
      modality,
      location: location.trim() || undefined,
      videoCallLink: videoCallLink.trim() || undefined,
      specialty: specialty.trim() || undefined,
      service: service.trim() || undefined,
      consultationType: consultationType.trim() || undefined,
      duration: duration.trim() ? parseInt(duration) : undefined,
      doctorId: doctorId.trim() || undefined,
      doctor: doctor.trim() || undefined,
      clinic: clinic.trim() || undefined,
      type,
      status,
      examType: type === "EXAM" ? examType : undefined,
      cost: cost.trim() ? parseFloat(cost) : undefined,
      notes: notes.trim() || undefined,
      customReminder: customReminder.trim() || undefined,
      reminderConfig: reminderConfig?.enabled ? reminderConfig : null,
      tags: [] as string[],
      treatmentTags,
      reminderOffsets: [] as number[],
      treatmentIds: treatmentIds.map((id) => id.trim()).filter(Boolean),
      preDocumentIds,
      postDocumentIds,
      preBackpackIds,
      postBackpackIds,
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
    name, date, time, modality, location, videoCallLink,
    specialty, service, consultationType, duration, doctorId, doctor, clinic,
    type, status, examType, cost, notes, customReminder, treatmentTags,
    treatmentIds, preDocumentIds, postDocumentIds, preBackpackIds, postBackpackIds,
    reminderConfig,
    error, saving, isEdit,
    setName, setDate, setTime, setModality, setLocation, setVideoCallLink,
    setSpecialty, setService, setConsultationType, setDuration, setDoctorId, setDoctor, setClinic,
    setType, setStatus, setExamType, setCost, setNotes, setCustomReminder, setTreatmentTags,
    setTreatmentIds, setPreDocumentIds, setPostDocumentIds, setPreBackpackIds, setPostBackpackIds,
    setReminderConfig,
    clearError: () => setError(null),
    handleSave,
  };
}
