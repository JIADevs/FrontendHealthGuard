import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Welcome } from "../components/auth";
import { useWelcomeStore } from "../lib/welcomeStore";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Target = "MedicationForm" | "AppointmentForm" | "DocumentUpload";

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setPending = useWelcomeStore((s) => s.setPending);

  // Inicio queda debajo: al cerrar el formulario se vuelve a Inicio, no a la Bienvenida.
  const leave = (target?: Target) => {
    navigation.reset({
      index: target ? 1 : 0,
      routes: target ? [{ name: "MainTabs" }, { name: target }] : [{ name: "MainTabs" }],
    });
    setPending(false);
  };

  return (
    <Welcome
      onAddMedication={() => leave("MedicationForm")}
      onAddAppointment={() => leave("AppointmentForm")}
      onUploadDocument={() => leave("DocumentUpload")}
      onExplore={() => leave()}
    />
  );
}
