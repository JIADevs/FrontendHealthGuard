import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { useDocumentListActions } from "../hooks/useDocumentListActions";
import { useShareFlow } from "../components/share";
import { Documents } from "../components/documents/Documents";

/** Route only: the Documentos tab lives in `components/documents/Documents` (rule 4.7). */
export function DocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const actions = useDocumentListActions();
  const shareFlow = useShareFlow(navigation);

  return (
    <Documents
      onOpen={actions.handleView}
      onEdit={actions.handleEdit}
      onShare={(doc) => shareFlow.openConfigureDocument(doc, "Documentos")}
      onDelete={(doc) => actions.handleDelete(doc)}
      onScan={() => navigation.navigate("Scanner", { suggestMission: true })}
      onUpload={() => navigation.navigate("DocumentUpload", { initialKind: "FILE", suggestMission: true })}
    />
  );
}
