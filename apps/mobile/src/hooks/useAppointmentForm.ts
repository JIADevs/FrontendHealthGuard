import { useAppointmentFormCore } from "@helu/api/hooks";
import { notify } from "../lib/notify";
import { haptics } from "../lib/haptics";
import { useRecentlySaved } from "../lib/recentlySaved";
import type { Appointment } from "@helu/api";

export function useAppointmentForm({
  initial,
  onClose,
}: {
  initial?: Appointment | null;
  onClose: () => void;
}) {
  return useAppointmentFormCore({
    initial,
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
