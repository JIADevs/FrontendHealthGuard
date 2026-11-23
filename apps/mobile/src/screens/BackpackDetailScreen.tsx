import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useShareFlow } from "../components/share";
import { BackpackDetail } from "../components/backpacks/BackpackDetail";

/** Route only: «Detalle de mochila» lives in `components/backpacks/BackpackDetail` (rule 4.7). */
export function BackpackDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = (useRoute().params ?? {}) as { id: string };
  const shareFlow = useShareFlow(navigation);

  return (
    <BackpackDetail
      id={id}
      onClose={() => navigation.goBack()}
      onEdit={() => navigation.navigate("BackpackEdit", { id })}
      onAddDocuments={() => navigation.navigate("BackpackAddDocuments", { id })}
      onShare={(bp, documentCount) => shareFlow.openConfigureBackpack({ id: bp.id, name: bp.name, documentCount }, "Mochila")}
      onOpenDocument={(doc) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Mochila" })}
    />
  );
}
