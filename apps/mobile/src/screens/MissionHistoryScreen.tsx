import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionHistory } from "../components/missions/MissionHistory";

/** Route only: «Historial de la misión» lives in `components/missions/MissionHistory`. */
export function MissionHistoryScreen() {
  const navigation = useNavigation();
  const { id } = useRoute<RouteProp<RootStackParamList, "MissionHistory">>().params;
  return <MissionHistory missionId={id} onBack={() => navigation.goBack()} />;
}
