import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Login } from "../components/auth";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return <Login onSignup={() => navigation.navigate("Signup")} />;
}
