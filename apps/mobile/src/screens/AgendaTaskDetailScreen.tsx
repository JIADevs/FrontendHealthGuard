import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { AgendaTaskDetail } from "../components/agenda/AgendaTaskDetail";

/** Screen: reads the route and wires navigation. The detail lives in `components/agenda/AgendaTaskDetail`. */
export function AgendaTaskDetailScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { id, intent } = useRoute<RouteProp<RootStackParamList, "AgendaTaskDetail">>().params;
  return (
    <AgendaTaskDetail
      id={id}
      intent={intent}
      onEdit={() => navigation.navigate("AgendaTaskForm", { id })}
      onBack={() => navigation.goBack()}
    />
  );
}
