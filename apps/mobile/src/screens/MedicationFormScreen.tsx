import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MedicationForm } from "../components/agenda/MedicationForm";

/** Screen: reads the route and wires navigation. The form lives in `components/agenda/MedicationForm`. */
export function MedicationFormScreen() {
  const navigation = useNavigation();
  const params = useRoute<RouteProp<RootStackParamList, "MedicationForm">>().params;
  return (
    <MedicationForm
      cycleId={params?.cycleId}
      medicationId={params?.medicationId}
      medicationName={params?.medicationName}
      onClose={() => navigation.goBack()}
    />
  );
}
