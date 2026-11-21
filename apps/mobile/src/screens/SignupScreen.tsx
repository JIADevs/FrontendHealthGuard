import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Signup } from "../components/auth";
import { useWelcomeStore } from "../lib/welcomeStore";
import type { RootStackParamList } from "../navigation/RootNavigator";

export function SignupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const setWelcomePending = useWelcomeStore((s) => s.setPending);
  return <Signup onLogin={() => navigation.navigate("Auth")} onSignedUp={() => setWelcomePending(true)} />;
}
