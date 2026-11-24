import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionNew } from "../components/missions";

/** Screen: wires navigation. Creating replaces the form with the new mission's detail. */
export function MissionNewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <MissionNew
      onCreated={(mission) => navigation.replace("MissionDetail", { id: mission.id, backTitle: "Misiones" })}
      onBack={() => navigation.goBack()}
    />
  );
}
