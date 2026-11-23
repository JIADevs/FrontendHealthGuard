import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MedicationForm } from "../components/agenda/MedicationForm";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";

/** Screen: reads the route and wires navigation. The form lives in `components/agenda/MedicationForm`. */
export function MedicationFormScreen() {
  const navigation = useNavigation();
  const params = useRoute<RouteProp<RootStackParamList, "MedicationForm">>().params;

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return (
    <MedicationForm
      cycleId={params?.cycleId}
      medicationId={params?.medicationId}
      medicationName={params?.medicationName}
      treatmentId={params?.treatmentId}
      onClose={() => navigation.goBack()}
      subscribeBeforeLeave={subscribeBeforeLeave}
    />
  );
}
