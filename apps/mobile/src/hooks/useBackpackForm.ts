import { useCallback } from "react";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  useBackpackFormCore,
  type BackpackFormState,
  type BackpackFormActions,
} from "@helu/api/hooks";

export type { BackpackFormState, BackpackFormActions };

type Options = {
  backpackId?: string;
};

export function useBackpackForm({ backpackId }: Options = {}): BackpackFormState & BackpackFormActions {
  const navigation = useNavigation();

  const afterSave = useCallback(() => navigation.goBack(), [navigation]);
  const afterDelete = useCallback(() => navigation.goBack(), [navigation]);

  const onValidationError = useCallback(
    (title: string, message: string) => Alert.alert(title, message),
    [],
  );

  const onSaveSuccess = useCallback((name: string, isEdit: boolean) => {
    Toast.show({
      type: "success",
      text1: isEdit ? "Mochila actualizada" : "Mochila creada",
      text2: name,
    });
  }, []);

  const onSaveError = useCallback((title: string, message: string) => {
    Toast.show({ type: "error", text1: title, text2: message });
    Alert.alert(title, message);
  }, []);

  const onDeleteSuccess = useCallback((name: string) => {
    Toast.show({ type: "success", text1: "Mochila eliminada", text2: name });
  }, []);

  const onDeleteError = useCallback((title: string, message: string) => {
    Toast.show({ type: "error", text1: title, text2: message });
    Alert.alert(title, message);
  }, []);

  return useBackpackFormCore({
    backpackId,
    adapters: {
      onValidationError,
      onSaveSuccess,
      onSaveError,
      onDeleteSuccess,
      onDeleteError,
      afterSave,
      afterDelete,
    },
  });
}
