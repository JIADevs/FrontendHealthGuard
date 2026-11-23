import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { BackpackAddDocuments } from "../components/backpacks/BackpackAddDocuments";

/** Route only: «Agregar documentos» lives in `components/backpacks/BackpackAddDocuments` (rule 4.7). */
export function BackpackAddDocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = (useRoute().params ?? {}) as { id: string };

  return (
    <BackpackAddDocuments
      id={id}
      onClose={() => navigation.goBack()}
      onUpload={() => navigation.navigate("DocumentUpload", { initialKind: "FILE" })}
      onScan={() => navigation.navigate("Scanner")}
    />
  );
}
