import { useCallback, useState, type ReactNode } from "react";
import { CalendarDays, Check, CheckSquare, Clock, Ellipsis, Eye, Pencil, Pill, X } from "lucide-react-native";
import {
  ActionSheet,
  eventLabel,
  eventTimeLabel,
  isDosePending,
  useAppTheme,
  type AgendaEvent,
  type AgendaEventSwipe,
} from "@helu/ui";
import { useAgendaNavigation } from "./AgendaNavigation";
import { AppointmentActionSheet, useAppointmentSwipeFactory } from "./appointmentSwipe";
import { useAppointmentActions } from "./useAppointmentActions";

type MedEvent = Extract<AgendaEvent, { type: "medication" }>;
type TaskEvent = Extract<AgendaEvent, { type: "task" }>;
type ApptEvent = Extract<AgendaEvent, { type: "appointment" | "exam" }>;

interface Options {
  /** «Tomar» / «Sí, la tomé»: the same dose the row's button registers */
  onTake: (event: MedEvent) => void;
  /** Opens the dose sheet on a step («No la tomé», «Cambiar hora») */
  onIntake: (event: MedEvent, step: "missed" | "time") => void;
}

/**
 * Swipe actions of the Calendar's day rows (module 14, v2.35):
 * - dose pending: «Más» + «No la tomé» · «Tomar»; a registered or future dose does not swipe.
 * - task: «Más» + «Reprogramar» · «Completar» (a done task keeps only «Más»).
 * - appointment: the same panels and «Más» sheet as in «Citas».
 * - check-in: does not swipe (its row is its only action).
 */
export function useCalendarSwipe({ onTake, onIntake }: Options) {
  const t = useAppTheme();
  const nav = useAgendaNavigation();
  const appt = useAppointmentActions();
  const apptSwipe = useAppointmentSwipeFactory();
  const [more, setMore] = useState<AgendaEvent | null>(null);
  const WHITE = { size: 22, strokeWidth: 2.2, color: t.text.onSolid };

  const eventSwipe = useCallback(
    (event: AgendaEvent): AgendaEventSwipe | null => {
      const open = () => setMore(event);
      if (event.type === "medication") {
        if (!isDosePending(event)) return null;
        return {
          endActions: [
            { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: open },
            { key: "missed", tone: "primary", label: "No la tomé", icon: <X {...WHITE} />, onPress: () => onIntake(event, "missed") },
          ],
          startAction: { key: "take", tone: "positive", label: "Tomar", icon: <Check {...WHITE} strokeWidth={3} />, onPress: () => onTake(event) },
          onLongPress: open,
        };
      }
      if (event.type === "task") {
        const done = event.data.status === "completed";
        return {
          endActions: [
            { key: "more", tone: "more", label: "Más", icon: <Ellipsis {...WHITE} />, onPress: open },
            ...(done
              ? []
              : [{ key: "reschedule", tone: "primary" as const, label: "Reprogramar", icon: <CalendarDays {...WHITE} />, onPress: () => nav.openTask(event.data.id, "reschedule") }]),
          ],
          startAction: done
            ? undefined
            : { key: "complete", tone: "positive", label: "Completar", icon: <Check {...WHITE} strokeWidth={3} />, onPress: () => nav.openTask(event.data.id, "complete") },
          onLongPress: open,
        };
      }
      if (event.type === "appointment" || event.type === "exam") {
        return {
          ...apptSwipe(event.data, { onEdit: () => nav.editAppointment(event.data.id), onAttended: () => appt.markAttended(event.data) }, open),
          onLongPress: open,
        };
      }
      return null;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [appt.markAttended, apptSwipe, nav, onIntake, onTake, t.text.onSolid],
  );

  const close = () => setMore(null);
  let sheet: ReactNode = null;
  if (more?.type === "medication") {
    const e = more as MedEvent;
    const pending = isDosePending(e);
    sheet = (
      <ActionSheet
        title={eventLabel(e)}
        eyebrow={`Toma · ${eventTimeLabel(e)}`.toUpperCase()}
        tone="medication"
        icon={<Pill />}
        onClose={close}
        actions={[
          ...(pending
            ? [
                { key: "take", label: "Sí, la tomé", meta: "Se registra a la hora actual", icon: <Check />, onPress: () => onTake(e) },
                { key: "time", label: "La tomé a otra hora", icon: <Clock />, onPress: () => onIntake(e, "time") },
                { key: "missed", label: "No la tomé", meta: "Elige el motivo", icon: <X />, onPress: () => onIntake(e, "missed") },
              ]
            : []),
          { key: "med", label: "Ver medicamento", icon: <Pill />, onPress: () => nav.openMedication(e.data.id) },
        ]}
      />
    );
  } else if (more?.type === "task") {
    const e = more as TaskEvent;
    const done = e.data.status === "completed";
    sheet = (
      <ActionSheet
        title={eventLabel(e)}
        eyebrow={`Tarea · ${eventTimeLabel(e)}`.toUpperCase()}
        tone="mission"
        icon={<CheckSquare />}
        onClose={close}
        actions={[
          { key: "open", label: "Ver detalle", icon: <Eye />, onPress: () => nav.openTask(e.data.id) },
          ...(done
            ? []
            : [
                { key: "complete", label: "Completar tarea", meta: "Con un comentario opcional", icon: <Check />, onPress: () => nav.openTask(e.data.id, "complete") },
                { key: "reschedule", label: "Reprogramar", icon: <CalendarDays />, onPress: () => nav.openTask(e.data.id, "reschedule") },
              ]),
          { key: "edit", label: "Editar", icon: <Pencil />, onPress: () => nav.editTask(e.data.id) },
        ]}
      />
    );
  } else if (more?.type === "appointment" || more?.type === "exam") {
    const a = (more as ApptEvent).data;
    sheet = (
      <AppointmentActionSheet
        appointment={a}
        onClose={close}
        onOpen={() => nav.openAppointment(a.id)}
        onEdit={() => nav.editAppointment(a.id)}
        onAttended={() => appt.markAttended(a)}
        onCancel={() => appt.requestCancel(a)}
        onDelete={() => appt.requestDelete(a)}
      />
    );
  }

  return {
    eventSwipe,
    overlays: (
      <>
        {sheet}
        {appt.dialogs}
      </>
    ),
  };
}
