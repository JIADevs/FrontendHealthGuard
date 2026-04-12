import { sileo } from "sileo";
import {
  useBackpackDetailCore,
  type BackpackDetailState,
  type BackpackDetailActions,
} from "@helu/api/hooks";

export type { BackpackDetailState, BackpackDetailActions };

export function useBackpackDetail(backpackId: string): BackpackDetailState & BackpackDetailActions {
  return useBackpackDetailCore(backpackId, {
    onRemoveSuccess: (_title) => sileo.success({ title: "Documento quitado de la mochila" }),
    onRemoveError: (title, message) => sileo.error({ title, description: message }),
    onShareSuccess: () => sileo.success({ title: "Enlace generado" }),
    onShareError: (title, message) => sileo.error({ title, description: message }),
  });
}
