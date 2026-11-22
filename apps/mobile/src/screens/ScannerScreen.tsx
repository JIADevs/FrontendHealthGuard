import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Scanner } from "../components/documents/Scanner";

/** Route only: the scanner lives in `components/documents/Scanner` (rule 4.7). */
export function ScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = useRoute<RouteProp<RootStackParamList, "Scanner">>().params;
  const backpack = { backpackId: params?.backpackId, backpackName: params?.backpackName };

  return (
    <Scanner
      onClose={() => navigation.goBack()}
      onContinue={(file) => navigation.replace("DocumentUpload", { ...backpack, scannedFile: file })}
      onUploadInstead={() => navigation.replace("DocumentUpload", backpack)}
    />
  );
}
