import { useCallback } from "react";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";
import {
  useProfileFormCore,
  type ProfileFormState,
  type ProfileFormActions,
} from "@helu/api/hooks";

export type { ProfileFormState, ProfileFormActions };

export function useProfileForm(): ProfileFormState & ProfileFormActions {
  const navigation = useNavigation();

  const onSuccess = useCallback(() => {
    Toast.show({ type: "success", text1: "Perfil actualizado" });
    navigation.goBack();
  }, [navigation]);

  const onError = useCallback((title: string, message: string) => {
    Toast.show({ type: "error", text1: title, text2: message });
  }, []);

  return useProfileFormCore({ onSuccess, onError });
}
