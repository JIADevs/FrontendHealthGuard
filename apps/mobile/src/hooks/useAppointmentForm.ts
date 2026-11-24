import { useAppointmentFormCore } from "@helu/api/hooks";
import { notify } from "../lib/notify";
import { haptics } from "../lib/haptics";
import { useRecentlySaved } from "../lib/recentlySaved";
import type { Appointment } from "@helu/api";
import type { AppointmentMissionLink } from "@helu/api/hooks";

export function useAppointmentForm({
  initial,
  onClose,
  mission,
}: {
  initial?: Appointment | null;
  onClose: () => void;
  /** New appointment for a mission step («Programar la cita / el examen»). */
  mission?: AppointmentMissionLink;
}) {
  return useAppointmentFormCore({
    initial,
    mission,
    adapters: {
      onSaveSuccess: (savedId) => {
        // §6 «Acción guardada»: resaltado en la lista + toast + háptica ligera.
        useRecentlySaved.getState().markAppointment(savedId);
        haptics.light();
        notify({ message: initial ? "Cita actualizada" : "Cita guardada" });
      },
      afterSave: onClose,
    },
  });
}
