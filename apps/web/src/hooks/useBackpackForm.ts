import { sileo } from "sileo";
import {
  useBackpackFormCore,
  type BackpackFormState,
  type BackpackFormActions,
} from "@healthguard/api/hooks";

export type { BackpackFormState, BackpackFormActions };

type Options = {
  backpackId?: string;
  onClose: () => void;
};

export function useBackpackForm({ backpackId, onClose }: Options): BackpackFormState & BackpackFormActions {
  return useBackpackFormCore({
    backpackId,
    adapters: {
      onValidationError: (_title, message) => sileo.error({ title: "Nombre requerido", description: message }),
      onSaveSuccess: (name, isEdit) =>
        sileo.success({ title: isEdit ? "Mochila actualizada" : "Mochila creada", description: name }),
      onSaveError: (title, message) => sileo.error({ title, description: message }),
      onDeleteSuccess: (name) => sileo.success({ title: "Mochila eliminada", description: name }),
      onDeleteError: (title, message) => sileo.error({ title, description: message }),
      afterSave: onClose,
      afterDelete: onClose,
    },
  });
}
