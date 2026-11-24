import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { More } from "../components/more/More";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function MoreScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <More
      onProfile={() => navigation.navigate("Profile", { backTitle: "Más" })}
      onMissions={() => navigation.navigate("Missions", { backTitle: "Más" })}
      onTreatments={() => navigation.navigate("Treatments", { backTitle: "Más" })}
      onMedications={() =>
        navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "medications" } } as never)
      }
      onShared={() => navigation.navigate("SharedHistory", { backTitle: "Más" })}
      onDependents={() => navigation.navigate("Dependientes", { backTitle: "Más" })}
      onNotifications={() => navigation.navigate("Notifications", { backTitle: "Más" })}
      onSettings={() => navigation.navigate("Settings", { backTitle: "Más" })}
    />
  );
}
