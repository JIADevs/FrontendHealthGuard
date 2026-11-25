import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionSuggestions } from "../components/missions/MissionSuggestions";

/** Route only: «Misiones sugeridas» lives in `components/missions/MissionSuggestions`. */
export function MissionSuggestionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <MissionSuggestions
      onOpenMission={(mission) => navigation.navigate("MissionDetail", { id: mission.id, backTitle: "Sugeridas" })}
      onOpenMissionId={(id) => navigation.navigate("MissionDetail", { id, backTitle: "Sugeridas" })}
      onBack={() => navigation.goBack()}
    />
  );
}
