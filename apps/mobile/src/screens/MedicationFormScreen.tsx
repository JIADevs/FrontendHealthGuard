import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { MedicationForm } from "../components/agenda/MedicationForm";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";
import { useCompleteMissionStepMutation } from "@helu/api";

/** Screen: reads the route and wires navigation. The form lives in `components/agenda/MedicationForm`. */
export function MedicationFormScreen() {
  const navigation = useNavigation();
  const params = useRoute<RouteProp<RootStackParamList, "MedicationForm">>().params;
  const completeStep = useCompleteMissionStepMutation();
  const missionId = params?.missionId;

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
      prefillName={params?.prefillName}
      // From a mission: saving the medication is the step, no extra «Listo» (RF-25).
      onSaved={
        missionId
          ? (medicationId) =>
              completeStep.mutate({ missionId, stepKey: "add_to_app", data: { medication_id: medicationId } })
          : undefined
      }
      onClose={() => navigation.goBack()}
      subscribeBeforeLeave={subscribeBeforeLeave}
    />
  );
}
