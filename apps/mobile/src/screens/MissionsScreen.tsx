import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Missions } from "../components/missions";

/** Screen: wires navigation. The list lives in `components/missions/Missions`. */
export function MissionsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <Missions
      onOpen={(id, openStep) => navigation.navigate("MissionDetail", { id, openStep, backTitle: "Misiones" })}
      onCreate={() => navigation.navigate("MissionNew")}
      onBack={() => navigation.goBack()}
    />
  );
}
