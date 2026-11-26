import { useCallback } from "react";
import { CalendarDays, Check, CircleX, Ellipsis, Eye, Pencil, Trash2 } from "lucide-react-native";
import type { Appointment } from "@helu/api";
import { ActionSheet, formatClock, formatShortDay, useAppTheme, type SwipeAction } from "@helu/ui";

/** Same rules as the detail: «Asistí» from the appointment's time on, «Reprogramar» before it. */
export function appointmentState(a: Appointment) {
  const startMs = new Date(`${a.date?.slice(0, 10)}T${a.time?.slice(0, 5) || "00:00"}`).getTime();
  const hasStarted = Number.isFinite(startMs) && startMs <= Date.now();
  const cancelled = a.status === "CANCELADA";
  const answered = a.status === "ASISTI" || a.status === "NO_ASISTI";
  return {
    cancelled,
    answered,
    canReschedule: !hasStarted && !cancelled,
    canAttend: hasStarted && !cancelled && !answered,
  };
}

export const appointmentTitle = (a: Appointment) => a.name || a.specialty || "Cita médica";
export const appointmentDateLabel = (a: Appointment) =>
  [formatShortDay(a.date), a.time ? formatClock(a.time.slice(0, 5)) : ""].filter(Boolean).join(" · ");

export interface AppointmentRowHandlers {
  onOpen: () => void;
  onEdit: () => void;
  onAttended: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

/**
 * Swipe panels of an appointment row, in «Citas» and in the Calendar (MASTER §7, module 14):
 * «Más» + «Reprogramar» (or «Editar» once it started) to the left, «Asistí» to the right.
 */
export function useAppointmentSwipe(a: Appointment, h: Pick<AppointmentRowHandlers, "onEdit" | "onAttended">, onMore: () => void) {
  return useAppointmentSwipeFactory()(a, h, onMore);
}

/** The same, for lists that build the panels inside a callback (the Calendar's day rows). */
export function useAppointmentSwipeFactory() {
  const t = useAppTheme();
  const white = t.text.onSolid;
  return useCallback(
    (a: Appointment, h: Pick<AppointmentRowHandlers, "onEdit" | "onAttended">, onMore: () => void) => appointmentPanels(a, h, onMore, white),
    [white],
  );
}

function appointmentPanels(a: Appointment, h: Pick<AppointmentRowHandlers, "onEdit" | "onAttended">, onMore: () => void, white: string) {
  const WHITE = { size: 22, strokeWidth: 2.2, color: white };
  const { canReschedule, canAttend } = appointmentState(a);
  const endActions: SwipeAction[] = [
    { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: onMore },
    canReschedule
      ? { key: "reschedule", tone: "primary", label: "Reprogramar", icon: <CalendarDays {...WHITE} />, onPress: h.onEdit }
      : { key: "edit", tone: "primary", label: "Editar", icon: <Pencil {...WHITE} />, onPress: h.onEdit },
  ];
  const startAction: SwipeAction | undefined = canAttend
    ? { key: "attended", tone: "positive", label: "Asistí", icon: <Check {...WHITE} strokeWidth={3} />, onPress: h.onAttended }
    : undefined;
  return { endActions, startAction };
}

/** «Más» of an appointment: its actions and, apart, «Cancelar cita» and «Eliminar cita» (#120). */
export function AppointmentActionSheet({ appointment: a, onClose, ...h }: AppointmentRowHandlers & { appointment: Appointment; onClose: () => void }) {
  const { cancelled, answered, canReschedule, canAttend } = appointmentState(a);
  return (
    <ActionSheet
      title={appointmentTitle(a)}
      eyebrow={`Cita · ${appointmentDateLabel(a)}`.toUpperCase()}
      tone="appointment"
      icon={<CalendarDays />}
      onClose={onClose}
      actions={[
        { key: "open", label: "Ver detalle", icon: <Eye />, onPress: h.onOpen },
        ...(canReschedule ? [{ key: "reschedule", label: "Reprogramar", icon: <CalendarDays />, onPress: h.onEdit }] : []),
        ...(canAttend ? [{ key: "attended", label: "Asistí", meta: "Marca la cita como completada", icon: <Check />, onPress: h.onAttended }] : []),
        { key: "edit", label: "Editar", icon: <Pencil />, onPress: h.onEdit },
      ]}
      destructive={[
        // A cancelled or answered appointment stays in the history: only deleting is left.
        ...(!cancelled && !answered
          ? [{ key: "cancel", label: "Cancelar cita", meta: "Queda en tu historial como cancelada", icon: <CircleX />, onPress: h.onCancel }]
          : []),
        { key: "delete", label: "Eliminar cita", meta: "Se borra de tu agenda", icon: <Trash2 />, onPress: h.onDelete },
      ]}
    />
  );
}
