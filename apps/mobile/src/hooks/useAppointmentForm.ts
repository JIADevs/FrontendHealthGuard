import { useAppointmentFormCore } from "@helu/api/hooks";
import Toast from "react-native-toast-message";
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
      onSaveSuccess: () =>
        Toast.show({
          type: "success",
          text1: initial ? "Cita actualizada" : "Cita agendada",
        }),
      afterSave: onClose,
    },
  });
}
