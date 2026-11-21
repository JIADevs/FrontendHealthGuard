import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MedicationDetail } from "../components/agenda/MedicationDetail";

/** Screen: reads the route and wires navigation. The detail lives in `components/agenda/MedicationDetail`. */
export function MedicationDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = useRoute<RouteProp<RootStackParamList, "MedicationDetail">>().params;
  return (
    <MedicationDetail
      id={id}
      onBack={() => navigation.goBack()}
      onAddCycle={(medicationName) => navigation.navigate("MedicationForm", { medicationId: id, medicationName })}
      onOpenCycle={(cycleId, medicationName) =>
        navigation.navigate("CycleDetail", { cycleId, medicationId: id, medicationName })
      }
    />
  );
}
