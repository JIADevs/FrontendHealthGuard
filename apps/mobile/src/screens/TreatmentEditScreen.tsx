import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";
import { TreatmentEdit } from "../components/treatments";

/** Route only: «Editar tratamiento» lives in `components/treatments/TreatmentEdit` (rule 4.7). */
export function TreatmentEditScreen() {
  const navigation = useNavigation();
  const { id } = useRoute<RouteProp<RootStackParamList, "TreatmentEdit">>().params;

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return <TreatmentEdit id={id} onClose={() => navigation.goBack()} subscribeBeforeLeave={subscribeBeforeLeave} />;
}
