import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "@helu/stores";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { Dependientes } from "../components/dependientes/Dependientes";

/** Route only: «Dependientes» lives in `components/dependientes/Dependientes` (rule 4.7). */
export function DependientesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const switchPatientContext = useAuthStore((s) => s.switchPatientContext);
  return (
    <Dependientes
      onManage={(patientId) => {
        switchPatientContext(patientId);
        navigation.navigate("MainTabs");
      }}
    />
  );
}
