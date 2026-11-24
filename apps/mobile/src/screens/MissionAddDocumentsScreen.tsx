import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionAddDocuments } from "../components/missions/MissionAddDocuments";

/** Route only: «Agregar documentos» to a mission lives in `components/missions/MissionAddDocuments`. */
export function MissionAddDocumentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { missionId, stepKey } = useRoute<RouteProp<RootStackParamList, "MissionAddDocuments">>().params;
  return (
    <MissionAddDocuments
      missionId={missionId}
      stepKey={stepKey}
      onClose={() => navigation.goBack()}
      onUpload={() => navigation.navigate("DocumentUpload", { initialKind: "FILE" })}
      onScan={() => navigation.navigate("Scanner")}
    />
  );
}
