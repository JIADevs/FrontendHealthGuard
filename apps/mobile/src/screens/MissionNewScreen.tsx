import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MissionNew } from "../components/missions";

/** Screen: wires navigation. Creating replaces the form with the new mission's detail. */
export function MissionNewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const initialType = useRoute<RouteProp<RootStackParamList, "MissionNew">>().params?.initialType;
  return (
    <MissionNew
      initialType={initialType}
      onCreated={(mission) => navigation.replace("MissionDetail", { id: mission.id, backTitle: "Misiones" })}
      onBack={() => navigation.goBack()}
    />
  );
}
