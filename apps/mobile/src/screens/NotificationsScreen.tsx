import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Notifications } from "../components/more/Notifications";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function NotificationsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <Notifications onOpenSettings={() => navigation.navigate("Settings", { backTitle: "Notificaciones" })} />;
}
