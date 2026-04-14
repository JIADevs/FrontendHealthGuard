import { useMedicationFormCore } from "@helu/api/hooks";
import { sileo } from "sileo";
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
        sileo.success({
          title: initial ? "Medicamento actualizado" : "Medicamento registrado",
        }),
      afterSave: onClose,
    },
  });
}
