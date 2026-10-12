import { useDoctorFormCore } from "@helu/api/hooks";
import Toast from "react-native-toast-message";
import type { Doctor } from "@helu/api";

export function useDoctorForm({
  initial,
  onClose,
}: {
  initial?: Doctor | null;
  onClose: () => void;
}) {
  return useDoctorFormCore({
    initial,
    adapters: {
      onSaveSuccess: () =>
        Toast.show({
          type: "success",
          text1: initial ? "Doctor actualizado" : "Doctor agregado",
        }),
      afterSave: onClose,
    },
  });
}