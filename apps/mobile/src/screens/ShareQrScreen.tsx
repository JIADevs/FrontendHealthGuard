import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { ShareReady } from "../components/share/ShareReady";

/** Route only: «Enlace listo» / «Código QR» lives in `components/share/ShareReady` (rule 4.7). */
export function ShareQrScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = useRoute().params as RootStackParamList["ShareQr"];
  // After «Generar enlace», leaving closes the whole flow (steps 1–3, or 2–3) at once.
  const close = () =>
    params.mode === "created" ? navigation.pop(params.fromStepOne ? 3 : 2) : navigation.goBack();
  return <ShareReady {...params} onClose={close} />;
}
