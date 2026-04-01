import { useCallback } from "react";
import Toast from "react-native-toast-message";
import {
  useBackpackDetailCore,
  type BackpackDetailState,
  type BackpackDetailActions,
} from "@healthguard/api/hooks";

export type { BackpackDetailState, BackpackDetailActions };

export function useBackpackDetail(backpackId: string): BackpackDetailState & BackpackDetailActions {
  const onRemoveSuccess = useCallback((title: string) => {
    Toast.show({ type: "success", text1: "Documento eliminado", text2: title });
  }, []);

  const onRemoveError = useCallback((title: string, message: string) => {
    Toast.show({ type: "error", text1: title, text2: message });
  }, []);

  const onShareSuccess = useCallback(() => {
    Toast.show({ type: "success", text1: "Link generado", text2: "Listo para compartir" });
  }, []);

  const onShareError = useCallback((title: string, message: string) => {
    Toast.show({ type: "error", text1: title, text2: message });
  }, []);

  return useBackpackDetailCore(backpackId, {
    onRemoveSuccess,
    onRemoveError,
    onShareSuccess,
    onShareError,
  });
}
