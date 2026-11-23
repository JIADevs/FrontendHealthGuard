import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useShareFlow } from "../components/share";
import { Backpacks } from "../components/backpacks/Backpacks";

/** Route only: the Mochilas tab lives in `components/backpacks/Backpacks` (rule 4.7). */
export function BackpacksScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const shareFlow = useShareFlow(navigation);

  return (
    <Backpacks
      onOpen={(bp) => navigation.navigate("BackpackDetail", { id: bp.id })}
      onEdit={(bp) => navigation.navigate("BackpackEdit", { id: bp.id })}
      onShare={(bp) => shareFlow.openConfigureBackpack(bp, "Mochilas")}
      onCreate={(preset) => navigation.navigate("BackpackEdit", { preset })}
    />
  );
}
