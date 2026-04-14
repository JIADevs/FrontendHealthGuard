import { useMedicationFormCore } from "@helu/api/hooks";
import Toast from "react-native-toast-message";
import type { Medication } from "@helu/api";

export function useMedicationForm({
  initial,
  onClose,
}: {
  initial?: Medication | null;
  onClose: () => void;
}) {
  return useMedicationFormCore({
    initial,
    adapters: {
      onSaveSuccess: () =>
        Toast.show({
          type: "success",
          text1: initial ? "Medicamento actualizado" : "Medicamento registrado",
        }),
      afterSave: onClose,
    },
  });
}
