import { useCallback } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AppointmentForm, type SubscribeBeforeLeave } from "../components/agenda/AppointmentForm";

/** Screen: reads the route and wires navigation. The form lives in `components/agenda/AppointmentForm`. */
export function AppointmentFormScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const id = useRoute<RouteProp<RootStackParamList, "AppointmentForm">>().params?.id;

  // Adapts `beforeRemove` so the form can ask «¿Descartar los cambios?» before leaving (formularios.md §7).
  const subscribeBeforeLeave = useCallback<SubscribeBeforeLeave>(
    (handler) => navigation.addListener("beforeRemove", (event) => handler(() => event.preventDefault())),
    [navigation],
  );

  return (
    <AppointmentForm
      id={id}
      onClose={() => navigation.goBack()}
      subscribeBeforeLeave={subscribeBeforeLeave}
    />
  );
}
