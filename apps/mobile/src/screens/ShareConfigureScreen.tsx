import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { ShareSetup } from "../components/share/ShareSetup";

/** Route only: «Compartir · paso 2» lives in `components/share/ShareSetup` (rule 4.7). */
export function ShareConfigureScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { target, fromStepOne = false } = useRoute().params as RootStackParamList["ShareConfigure"];
  return (
    <ShareSetup
      target={target}
      fromStepOne={fromStepOne}
      onCreated={(result) =>
        navigation.navigate("ShareQr", {
          shareUrl: result.shareUrl,
          title: result.title,
          resourceType: result.resourceType,
          expiresAt: result.expiresAt,
          documentCount: result.documentCount,
          mode: "created",
          fromStepOne,
        })
      }
    />
  );
}
