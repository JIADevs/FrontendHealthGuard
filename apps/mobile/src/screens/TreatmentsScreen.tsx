import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Treatments } from "../components/treatments";

/** Route only: the list lives in `components/treatments/Treatments` (rule 4.7). */
export function TreatmentsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <Treatments
      onBack={() => navigation.goBack()}
      onOpen={(treatment) => navigation.navigate("TreatmentDetail", { id: treatment.id, backTitle: "Tratamientos" })}
      onCreate={() => navigation.navigate("TreatmentForm", undefined)}
    />
  );
}
