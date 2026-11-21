import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AppointmentDetail } from "../components/agenda/AppointmentDetail";

/** Screen: reads the route and wires navigation. The detail lives in `components/agenda/AppointmentDetail`. */
export function AppointmentDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id } = useRoute<RouteProp<RootStackParamList, "AppointmentDetail">>().params;
  return (
    <AppointmentDetail
      id={id}
      onEdit={(appointmentId) => navigation.navigate("AppointmentForm", { id: appointmentId })}
      onAddDocument={() => navigation.navigate("DocumentUpload", { initialKind: "FILE" })}
    />
  );
}
