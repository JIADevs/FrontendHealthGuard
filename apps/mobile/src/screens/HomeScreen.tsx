import { useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Home, type HomeNavigation } from "../components/home";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const nav = useMemo<HomeNavigation>(
    () => ({
      notifications: () => navigation.navigate("Notifications", { backTitle: "Inicio" }),
      appointments: () => navigation.navigate("MainTabs", { screen: "Agenda", params: { initialTab: "appointments" } }),
      openAppointment: (id) => navigation.navigate("AppointmentDetail", { id }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      documents: () => navigation.navigate("MainTabs", { screen: "Documents" } as any),
      openDocument: (doc) => navigation.navigate("DocumentDetail", { id: doc.id, title: doc.title, backTitle: "Inicio" }),
      upload: () => navigation.navigate("DocumentUpload", { backTitle: "Inicio" }),
      scan: () => navigation.navigate("Scanner", { backTitle: "Inicio" }),
      share: () => navigation.navigate("SharedHistory", { backTitle: "Inicio" }),
      newMedication: () => navigation.navigate("MedicationForm"),
      newAppointment: () => navigation.navigate("AppointmentForm"),
    }),
    [navigation],
  );
  return <Home nav={nav} />;
}
