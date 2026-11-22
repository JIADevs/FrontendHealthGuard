import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentDeleteWithUndo } from "../hooks/useDocumentDeleteWithUndo";
import { useShareFlow } from "../components/share";
import { DocumentDetail } from "../components/documents/DocumentDetail";

/** Route only: the detail lives in `components/documents/DocumentDetail` (rule 4.7). */
export function DocumentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = (useRoute().params ?? {}) as { id: string };
  const deleteDocument = useDocumentDeleteWithUndo();
  const shareFlow = useShareFlow(navigation);

  return (
    <DocumentDetail
      id={id}
      onBack={() => navigation.goBack()}
      onShare={(doc) => shareFlow.openConfigureDocument(doc, "Documento")}
      onEdit={(doc) => navigation.navigate("DocumentEdit", { id: doc.id })}
      onDelete={(doc) => deleteDocument(doc, { onDeleted: () => navigation.goBack() })}
    />
  );
}
