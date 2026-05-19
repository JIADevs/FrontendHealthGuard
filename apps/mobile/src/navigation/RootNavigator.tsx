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
import { SettingsScreen } from "../screens/SettingsScreen";
import { useAppTheme, palette } from "@helu/ui";

/** Shared optional param so any screen can show a contextual back label. */
type WithBackTitle = { backTitle?: string };

export type RootStackParamList = {
  Auth: undefined;
  Signup: undefined;
  MainTabs: undefined;
  Scanner: WithBackTitle & { backpackId?: string; backpackName?: string } | undefined;
  DocumentUpload: WithBackTitle & { backpackId?: string; backpackName?: string } | undefined;
  DocumentDetail: WithBackTitle & { id: string; title?: string } | undefined;
  DocumentEdit: WithBackTitle & { id: string } | undefined;
  Notifications: WithBackTitle | undefined;
  Profile: WithBackTitle | undefined;
  Settings: WithBackTitle | undefined;
  BackpackDetail: WithBackTitle & { id: string };
  BackpackEdit: WithBackTitle & { id?: string } | undefined;
  BackpackAddDocuments: WithBackTitle & { id: string };
  ShareDocuments: WithBackTitle | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
            options={({ route }) => ({
              headerShown: true,
              title: "Documento",
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Atrás",
            })}
          />
          <Stack.Screen
            name="DocumentEdit"
            component={DocumentEditScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Editar documento",
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Documento",
            })}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Notificaciones",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Atrás",
            })}
          />
          <Stack.Screen
            name="BackpackDetail"
            component={BackpackDetailScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Mochila",
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Mochilas",
            })}
          />
          <Stack.Screen
            name="BackpackEdit"
            component={BackpackEditScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Mochila",
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Mochila",
            })}
          />
          <Stack.Screen
            name="BackpackAddDocuments"
            component={BackpackAddDocumentsScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Agregar documentos",
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Mochila",
            })}
          />
          <Stack.Screen
            name="ShareDocuments"
            component={ShareDocumentsScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Compartir Documentos",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Atrás",
            })}
          />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Mi Perfil",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Más",
            })}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Configuraciones",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Más",
            })}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={LoginScreen} />
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false }}
          />
        </>
      )}
    </Stack.Navigator>
    </>
  );
}
