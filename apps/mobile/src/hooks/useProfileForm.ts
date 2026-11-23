import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import {
  useProfileFormCore,
  type ProfileFormState,
  type ProfileFormActions,
} from "@helu/api/hooks";
import { notify } from "../lib/notify";

export type { ProfileFormState, ProfileFormActions };

export function useProfileForm(): ProfileFormState & ProfileFormActions {
  const navigation = useNavigation();

  const onSuccess = useCallback(() => {
    notify({ message: "Perfil guardado" });
    navigation.goBack();
  }, [navigation]);

  const onError = useCallback((_title: string, message: string) => {
    notify({ tone: "error", message: "No se pudo guardar tu perfil", description: message });
  }, []);

  return useProfileFormCore({ onSuccess, onError });
}
