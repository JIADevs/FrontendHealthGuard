import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuthStore } from "@healthguard/stores";
import { TabNavigator } from "./TabNavigator";
import { LoginScreen } from "../screens/LoginScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { DocumentUploadScreen } from "../screens/DocumentUploadScreen";
import { DocumentDetailScreen } from "../screens/DocumentDetailScreen";

export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
  Scanner: undefined;
  DocumentUpload: undefined;
  DocumentDetail: { id: string; title?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreen}
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="DocumentUpload"
            component={DocumentUploadScreen}
            options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="DocumentDetail"
            component={DocumentDetailScreen}
            options={{ headerShown: true, title: "Documento" }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
