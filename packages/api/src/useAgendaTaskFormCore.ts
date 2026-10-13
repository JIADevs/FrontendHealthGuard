/**
 * Platform-agnostic create/edit form core for Agenda Tasks (Tareas).
 */

import { useState } from "react";
import {
  useCreateAgendaTaskMutation,
  useUpdateAgendaTaskMutation,
} from "./reactQueryHooks";
import { isApiError } from "./errors";
import type { AgendaTask } from "./schemas";

const DEFAULT_REMINDER_OFFSETS = [15];

export interface AgendaTaskFormState {
  title: string;
  description: string;
  /** ISO date "YYYY-MM-DD" */
  date: string;
  /** "HH:mm" */
  time: string;
  reminderOffsets: number[];
  documentIds: string[];
  backpackIds: string[];
  error: string | null;
  saving: boolean;
  isEdit: boolean;
}

export interface AgendaTaskFormActions {
  setTitle: (v: string) => void;
  setDescription: (v: string) => void;
  setDate: (v: string) => void;
  setTime: (v: string) => void;
  setDocumentIds: (v: string[]) => void;
  setBackpackIds: (v: string[]) => void;
  toggleReminderOffset: (minutes: number) => void;
  clearError: () => void;
  handleSave: () => void;
}

export interface AgendaTaskFormAdapters {
  onSaveSuccess: () => void;
  afterSave: () => void;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function splitAgendaTaskStartAt(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return { date: "", time: "" };
  }
  return {
    date: `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`,
    time: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
  };
}

/** Naive wall-clock datetime for the API (America/Bogota when device is local CO). */
export function buildAgendaTaskStartAt(date: string, time: string): string {
  const normalized = time.length === 5 ? `${time}:00` : time;
  return `${date}T${normalized}`;
}

export function useAgendaTaskFormCore({
  initial,
  adapters,
}: {
  initial?: AgendaTask | null;
  adapters: AgendaTaskFormAdapters;
}): AgendaTaskFormState & AgendaTaskFormActions {
  const isEdit = !!initial;
  const split = initial ? splitAgendaTaskStartAt(initial.startAt) : { date: "", time: "" };

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(split.date);
  const [time, setTime] = useState(split.time);
  const [reminderOffsets, setReminderOffsets] = useState<number[]>(
    initial?.reminderOffsets?.length ? [...initial.reminderOffsets] : [...DEFAULT_REMINDER_OFFSETS],
  );
  const [documentIds, setDocumentIds] = useState<string[]>(initial?.documentIds ?? []);
  const [backpackIds, setBackpackIds] = useState<string[]>(initial?.backpackIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const createMut = useCreateAgendaTaskMutation();
  const updateMut = useUpdateAgendaTaskMutation();
  const saving = createMut.isPending || updateMut.isPending;

  function toggleReminderOffset(minutes: number) {
    setReminderOffsets((prev) => {
      if (prev.includes(minutes)) {
        const next = prev.filter((m) => m !== minutes);
        return next.length === 0 ? [...DEFAULT_REMINDER_OFFSETS] : next;
      }
      return [...prev, minutes].sort((a, b) => a - b);
    });
  }

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("El título es obligatorio.");
      return;
    }
    if (!date || !time) {
      setError("Fecha y hora son obligatorios.");
      return;
    }
    if (reminderOffsets.length === 0) {
      setError("Debés elegir al menos un aviso.");
      return;
    }

    setError(null);
    const desc = description.trim() || null;

    if (isEdit) {
      updateMut.mutate(
        {
          id: initial!.id,
          task: {
            title: trimmed,
            description: desc,
            reminderOffsets,
            documentIds,
            backpackIds,
          },
        },
        {
          onSuccess: () => {
            adapters.onSaveSuccess();
            adapters.afterSave();
          },
          onError: (err) =>
            setError(isApiError(err) ? err.message : "Error actualizando la tarea."),
        },
      );
      return;
    }

    createMut.mutate(
      {
        title: trimmed,
        description: desc,
        startAt: buildAgendaTaskStartAt(date, time),
        reminderOffsets,
        documentIds,
        backpackIds,
      },
      {
        onSuccess: () => {
          adapters.onSaveSuccess();
          adapters.afterSave();
        },
        onError: (err) =>
          setError(isApiError(err) ? err.message : "Error guardando la tarea."),
      },
    );
  }

  return {
    title,
    description,
    date,
    time,
    reminderOffsets,
    documentIds,
    backpackIds,
    error,
    saving,
    isEdit,
    setTitle,
    setDescription,
    setDate,
    setTime,
    setDocumentIds,
    setBackpackIds,
    toggleReminderOffset,
    clearError: () => setError(null),
    handleSave,
  };
}
