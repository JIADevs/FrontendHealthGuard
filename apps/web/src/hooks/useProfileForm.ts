import { sileo } from "sileo";
import {
  useProfileFormCore,
  type ProfileFormState,
  type ProfileFormActions,
} from "@healthguard/api/hooks";

export type { ProfileFormState, ProfileFormActions };

export function useProfileForm(): ProfileFormState & ProfileFormActions {
  return useProfileFormCore({
    onSuccess: () => sileo.success({ title: "Perfil actualizado" }),
    onError: (title, message) => sileo.error({ title, description: message }),
  });
}
