import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { CycleDetail } from "../components/agenda/CycleDetail";

/** Screen: reads the route and wires navigation. The detail lives in `components/agenda/CycleDetail`. */
export function CycleDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { cycleId, medicationId, medicationName } = useRoute<RouteProp<RootStackParamList, "CycleDetail">>().params;
  return (
    <CycleDetail
      cycleId={cycleId}
      medicationId={medicationId}
      medicationName={medicationName}
      onEdit={() => navigation.navigate("MedicationForm", { cycleId, medicationId, medicationName })}
      onDeleted={() => navigation.goBack()}
    />
  );
}
