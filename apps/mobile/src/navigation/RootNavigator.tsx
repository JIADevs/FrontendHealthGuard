import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { useAuthStore } from "@helu/stores";
import { TabNavigator } from "./TabNavigator";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { ScannerScreen } from "../screens/ScannerScreen";
import { DocumentUploadScreen } from "../screens/DocumentUploadScreen";
import { DocumentDetailScreen } from "../screens/DocumentDetailScreen";
import { DocumentEditScreen } from "../screens/DocumentEditScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { BackpackDetailScreen } from "../screens/BackpackDetailScreen";
import { BackpackEditScreen } from "../screens/BackpackEditScreen";
import { BackpackAddDocumentsScreen } from "../screens/BackpackAddDocumentsScreen";
import { ShareDocumentsScreen } from "../screens/ShareDocumentsScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { useAppTheme } from "@helu/ui";
import {
  withDocumentsTheme,
  documentsStackScreenOptions,
} from "../components/documents";

export type RootStackParamList = {
  Auth: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Scanner: { backpackId?: string; backpackName?: string } | undefined;
  DocumentUpload: { backpackId?: string; backpackName?: string } | undefined;
  DocumentDetail: { id: string; title?: string } | undefined;
  DocumentEdit: { id: string } | undefined;
  Notifications: undefined;
  Profile: undefined;
  BackpackDetail: { id: string };
  BackpackEdit: { id?: string } | undefined;
  BackpackAddDocuments: { id: string };
  ShareDocuments: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const ScannerScreenLight = withDocumentsTheme(ScannerScreen);
const DocumentUploadScreenLight = withDocumentsTheme(DocumentUploadScreen);
const DocumentDetailScreenLight = withDocumentsTheme(DocumentDetailScreen);
const DocumentEditScreenLight = withDocumentsTheme(DocumentEditScreen);
const ShareDocumentsScreenLight = withDocumentsTheme(ShareDocumentsScreen);

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const t = useAppTheme();

  return (
    <>
      <StatusBar barStyle={t.mode === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: t.surface.bgCard },
        headerTintColor: t.brand.fg,
        headerTitleStyle: { color: t.text.primary },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: t.surface.bg },
      }}
    >
      {token ? (
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreenLight}
            options={{
              ...documentsStackScreenOptions,
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="DocumentUpload"
            component={DocumentUploadScreenLight}
            options={{
              ...documentsStackScreenOptions,
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="DocumentDetail"
            component={DocumentDetailScreenLight}
            options={{ ...documentsStackScreenOptions, headerShown: true, title: "Documento" }}
          />
          <Stack.Screen
            name="DocumentEdit"
            component={DocumentEditScreenLight}
            options={{ ...documentsStackScreenOptions, headerShown: true, title: "Editar documento" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: true, title: "Notificaciones", animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="BackpackDetail"
            component={BackpackDetailScreen}
            options={{ headerShown: true, title: "Mochila" }}
          />
          <Stack.Screen
            name="BackpackEdit"
            component={BackpackEditScreen}
            options={{ headerShown: true, title: "Mochila" }}
          />
          <Stack.Screen
            name="BackpackAddDocuments"
            component={BackpackAddDocumentsScreen}
            options={{ headerShown: true, title: "Agregar documentos" }}
          />
          <Stack.Screen
            name="ShareDocuments"
            component={ShareDocumentsScreenLight}
            options={{
              ...documentsStackScreenOptions,
              headerShown: true,
              title: "Compartir Documentos",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: true, title: "Mi Perfil", animation: "slide_from_right" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={LoginScreen} />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: true, title: "Crear Cuenta" }}
          />
        </>
      )}
    </Stack.Navigator>
    </>
  );
}
