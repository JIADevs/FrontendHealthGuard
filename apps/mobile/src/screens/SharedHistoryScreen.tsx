import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useShareFlow } from "../components/share";
import { SharedHistory } from "../components/share/SharedHistory";

/** Route only: «Compartidos» lives in `components/share/SharedHistory` (rule 4.7). */
export function SharedHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const shareFlow = useShareFlow(navigation);
  return <SharedHistory onOpen={(link) => shareFlow.openDetail(link, "Compartidos")} onNew={shareFlow.openChoose} onShowQr={shareFlow.openQr} />;
}
