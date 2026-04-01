import { useAppointmentFormCore } from "@healthguard/api/hooks";
import { sileo } from "sileo";
import type { Appointment } from "@healthguard/api";

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
      onSaveSuccess: () =>
        sileo.success({
          title: initial ? "Cita actualizada" : "Cita agendada",
        }),
      afterSave: onClose,
    },
  });
}
