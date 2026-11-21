import { useNavigation } from "@react-navigation/native";
import { DoctorForm } from "../components/agenda/DoctorForm";

/** Screen: wires navigation only. The form lives in `components/agenda/DoctorForm`. */
export function DoctorFormScreen() {
  const navigation = useNavigation();
  return <DoctorForm onClose={() => navigation.goBack()} />;
}
