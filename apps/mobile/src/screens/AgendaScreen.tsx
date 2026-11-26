import { useMemo } from "react";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import type { TabParamList } from "../navigation/TabNavigator";
import { Agenda } from "../components/agenda/Agenda";
import { AgendaNavigationProvider, type AgendaNavigation } from "../components/agenda/AgendaNavigation";

/** Screen: reads the route and wires navigation. The Agenda lives in `components/agenda/Agenda`. */
export function AgendaScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const params = useRoute<RouteProp<TabParamList, "Agenda">>().params ?? {};

  const nav = useMemo<AgendaNavigation>(
    () => ({
      openAppointment: (id) => navigation.navigate("AppointmentDetail", { id }),
      newAppointment: () => navigation.navigate("AppointmentForm"),
      editAppointment: (id) => navigation.navigate("AppointmentForm", { id }),
      openMedication: (id) => navigation.navigate("MedicationDetail", { id }),
      newMedication: () => navigation.navigate("MedicationForm"),
      editMedicationCycle: (medicationId, medicationName, cycleId) =>
        navigation.navigate("MedicationForm", { medicationId, medicationName, cycleId }),
      newMedicationCycle: (medicationId, medicationName) => navigation.navigate("MedicationForm", { medicationId, medicationName }),
      openMedicationCycle: (medicationId, medicationName, cycleId) =>
        navigation.navigate("CycleDetail", { cycleId, medicationId, medicationName }),
      newTask: () => navigation.navigate("AgendaTaskForm"),
      openTask: (id, intent) => navigation.navigate("AgendaTaskDetail", { id, intent }),
    }),
    [navigation],
  );

  return (
    <AgendaNavigationProvider value={nav}>
      <Agenda params={params} />
    </AgendaNavigationProvider>
  );
}
