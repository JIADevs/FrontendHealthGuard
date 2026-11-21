import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AgendaTaskForm } from "../components/agenda/AgendaTaskForm";
import type { SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";

/** Screen: reads the route and wires navigation. The form lives in `components/agenda/AgendaTaskForm`. */
export function AgendaTaskFormScreen() {
  const navigation = useNavigation();
  const id = useRoute<RouteProp<RootStackParamList, "AgendaTaskForm">>().params?.id;

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return <AgendaTaskForm id={id} onClose={() => navigation.goBack()} subscribeBeforeLeave={subscribeBeforeLeave} />;
}
