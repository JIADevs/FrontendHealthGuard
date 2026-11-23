import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useShareFlow } from "../components/share";
import { SharedDetail } from "../components/share/SharedDetail";

/** Route only: «Compartido» lives in `components/share/SharedDetail` (rule 4.7). */
export function SharedDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { linkId, resourceType } = useRoute().params as RootStackParamList["SharedDetail"];
  const shareFlow = useShareFlow(navigation);
  return (
    <SharedDetail
      linkId={linkId}
      resourceType={resourceType}
      onClose={() => navigation.goBack()}
      onShowQr={shareFlow.openQr}
      onOpenDocument={(doc) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Compartido" })}
      onShareAgain={(link) =>
        link.resourceType === "backpack"
          ? shareFlow.openConfigureBackpack({ id: link.resourceId, name: link.title, documentCount: link.documentCount })
          : shareFlow.openConfigureDocument({
              id: link.resourceId,
              title: link.title,
              kind: "FILE",
              documentType: null,
              documentDate: null,
              uploadedAt: link.createdAt,
            })
      }
    />
  );
}
