import { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";
import { ShareChoose } from "../components/share/ShareChoose";

/** Route only: «Compartir · paso 1» lives in `components/share/ShareChoose` (rule 4.7). */
export function ShareChooseScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) =>
      navigation.addListener("beforeRemove", (event) => {
        // Closing the whole flow from «Enlace listo» removes this screen too: only ask when the
        // person is leaving step 1 itself.
        if (!navigation.isFocused()) return;
        handler(() => event.preventDefault());
      }),
    [navigation],
  );
  return (
    <ShareChoose
      onClose={() => navigation.goBack()}
      subscribeBeforeLeave={subscribeBeforeLeave}
      onContinue={(choice) =>
        navigation.navigate("ShareConfigure", {
          fromStepOne: true,
          target:
            choice.kind === "documents"
              ? { kind: "documents", documents: choice.documents }
              : { kind: "backpack", id: choice.backpack.id, name: choice.backpack.name, documentCount: choice.backpack.documentCount ?? 0 },
        })
      }
    />
  );
}
