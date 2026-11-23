import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { TreatmentDetail } from "../components/treatments";

/** Route only: the detail lives in `components/treatments/TreatmentDetail` (rule 4.7). */
export function TreatmentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = useRoute<RouteProp<RootStackParamList, "TreatmentDetail">>().params;

  return (
    <TreatmentDetail
      id={id}
      onBack={() => navigation.goBack()}
      onEdit={() => navigation.navigate("TreatmentEdit", { id })}
      onAddMedication={() => navigation.navigate("MedicationForm", { treatmentId: id })}
      onAddAppointment={() => navigation.navigate("AppointmentForm", { treatmentId: id })}
      onAddDocument={() => navigation.navigate("DocumentUpload", { initialKind: "FILE", treatmentId: id, backTitle: "Tratamiento" })}
      onOpenCycle={(cycle) =>
        navigation.navigate("CycleDetail", {
          cycleId: cycle.id,
          medicationId: cycle.medicationId,
          medicationName: cycle.medicationName,
        })
      }
      onOpenAppointment={(appointment) => navigation.navigate("AppointmentDetail", { id: appointment.id })}
      onOpenDocument={(document) =>
        navigation.navigate("DocumentDetail", { id: document.id, title: document.title, backTitle: "Tratamiento" })
      }
    />
  );
}
