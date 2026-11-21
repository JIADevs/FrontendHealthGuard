import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { useAuthStore } from "@helu/stores";
import { TabNavigator } from "./TabNavigator";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { WelcomeScreen } from "../screens/WelcomeScreen";
import { useWelcomeStore } from "../lib/welcomeStore";
import { ScannerScreen } from "../screens/ScannerScreen";
import { DocumentUploadScreen } from "../screens/DocumentUploadScreen";
import { DocumentDetailScreen } from "../screens/DocumentDetailScreen";
import { DocumentEditScreen } from "../screens/DocumentEditScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { BackpackDetailScreen } from "../screens/BackpackDetailScreen";
import { BackpackEditScreen } from "../screens/BackpackEditScreen";
import { BackpackAddDocumentsScreen } from "../screens/BackpackAddDocumentsScreen";
import { ShareConfigureScreen } from "../screens/ShareConfigureScreen";
import { ShareQrScreen } from "../screens/ShareQrScreen";
import { SharedHistoryScreen } from "../screens/SharedHistoryScreen";
import { SharedDetailScreen } from "../screens/SharedDetailScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

import { AppointmentDetailScreen } from "../screens/AppointmentDetailScreen";
import { AgendaTaskDetailScreen } from "../screens/AgendaTaskDetailScreen";
import { AgendaTaskFormScreen } from "../screens/AgendaTaskFormScreen";
import { AppointmentFormScreen } from "../screens/AppointmentFormScreen";
import { DoctorFormScreen } from "../screens/DoctorFormScreen";
import { MedicationFormScreen } from "../screens/MedicationFormScreen";
import { MedicationDetailScreen } from "../screens/MedicationDetailScreen";
import { CycleDetailScreen } from "../screens/CycleDetailScreen";
import { TreatmentsScreen } from "../screens/TreatmentsScreen";
import { TreatmentDetailScreen } from "../screens/TreatmentDetailScreen";
import { TreatmentFormScreen } from "../screens/TreatmentFormScreen";

import { SettingsScreen } from "../screens/SettingsScreen";
import { DependientesScreen } from "../screens/DependientesScreen";
import { DependientesInviteScreen } from "../screens/DependientesInviteScreen";
import { LINKED_PEOPLE_SCREEN_TITLE } from "../constants/linkedPeople";
import { useAppTheme } from "@helu/ui";
import { withDocumentsTheme, getDocumentsStackScreenOptions } from "../components/documents";
import type { ShareResourceType } from "@helu/api";

/** Shared optional param so any screen can show a contextual back label. */
type WithBackTitle = { backTitle?: string };

/**
 * Params for the Agenda tab, used both for plain tab switches (`initialTab`)
 * and for notification deep links that must open a specific modal inside
 * Agenda (`intent`). `intentAt` is a nonce (`Date.now()`) so a second identical
 * push can reopen the modal even though the params object would otherwise be
 * referentially unchanged.
 */
export interface AgendaRouteParams {
  initialTab?: "calendar" | "appointments" | "medications" | "wellbeing";
  intent?: "medication-intake" | "daily-checkin";
  intentAt?: number;
  cycleId?: string;
  medicationId?: string;
  medicationName?: string;
  scheduledTime?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  Signup: undefined;
  /** Una sola vez, justo después de crear la cuenta (m1 · «Bienvenida»). */
  Welcome: undefined;
  MainTabs: { screen: "Agenda"; params: AgendaRouteParams } | undefined;

  AppointmentDetail: { id: string };
  AgendaTaskDetail: { id: string; intent?: "complete" | "reschedule" };
  AgendaTaskForm: { id?: string } | undefined;
  AppointmentForm: { id?: string } | undefined;
  DoctorForm: undefined;
  MedicationForm: { medicationId?: string; medicationName?: string; cycleId?: string } | undefined;
  MedicationDetail: { id: string };
  CycleDetail: { cycleId: string; medicationId: string; medicationName: string };
  Treatments: WithBackTitle | undefined;
  TreatmentDetail: WithBackTitle & { id: string };
  TreatmentForm: WithBackTitle & { id?: string } | undefined;
  Scanner: WithBackTitle & { backpackId?: string; backpackName?: string } | undefined;
  DocumentUpload:
    | (WithBackTitle & {
        backpackId?: string;
        backpackName?: string;
        /** FILE opens upload UI; LINK opens portal form and never the file picker. */
        initialKind?: "FILE" | "LINK";
      })
    | undefined;
  DocumentDetail: WithBackTitle & { id: string; title?: string } | undefined;
  DocumentEdit: WithBackTitle & { id: string } | undefined;
  Notifications: WithBackTitle | undefined;
  Profile: WithBackTitle | undefined;
  Settings: WithBackTitle | undefined;
  BackpackDetail: WithBackTitle & { id: string };
  BackpackEdit: WithBackTitle & { id?: string } | undefined;
  BackpackAddDocuments: WithBackTitle & { id: string };
  ShareConfigure: WithBackTitle & {
    resourceType: ShareResourceType;
    resourceId: string;
    title: string;
    subtitle?: string;
    documentCount?: number;
  };
  ShareQr: WithBackTitle & {
    shareUrl: string;
    title: string;
    resourceType: ShareResourceType;
    expiresAt: string | null;
    documentCount?: number;
  };
  SharedHistory: WithBackTitle | undefined;
  SharedDetail: WithBackTitle & {
    linkId: string;
    resourceType: ShareResourceType;
  };
  Dependientes: WithBackTitle | undefined;
  DependientesInvite: WithBackTitle & {
    relationship: "I_WANT_TO_MANAGE_THEM" | "THEY_WILL_MANAGE_ME";
  };
};

/**
 * Formularios (crear o editar): tarea temporal que se cierra hacia abajo, 350 ms
 * (movimiento-interacciones.md §3). Los detalles siguen entrando desde la derecha.
 */
const FORM_SCREEN_OPTIONS = {
  headerShown: false,
  animation: "slide_from_bottom",
  gestureDirection: "vertical",
  animationDuration: 350,
} as const;

const Stack = createNativeStackNavigator<RootStackParamList>();

const ScannerScreenLight = withDocumentsTheme(ScannerScreen);
const DocumentUploadScreenLight = withDocumentsTheme(DocumentUploadScreen);
const DocumentDetailScreenLight = withDocumentsTheme(DocumentDetailScreen);
const DocumentEditScreenLight = withDocumentsTheme(DocumentEditScreen);
const ShareConfigureScreenLight = withDocumentsTheme(ShareConfigureScreen);
const ShareQrScreenLight = withDocumentsTheme(ShareQrScreen);
const SharedHistoryScreenLight = withDocumentsTheme(SharedHistoryScreen);
const SharedDetailScreenLight = withDocumentsTheme(SharedDetailScreen);

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const welcomePending = useWelcomeStore((s) => s.pending);
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
          {/* Primera en la lista para que sea la pantalla inicial al entrar después del registro. */}
          {welcomePending ? <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: "fade", animationDuration: 250 }} /> : null}
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen
            name="Scanner"
            component={ScannerScreenLight}
            options={{
              ...getDocumentsStackScreenOptions(t),
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="DocumentUpload"
            component={DocumentUploadScreenLight}
            options={{
              ...getDocumentsStackScreenOptions(t),
              presentation: "fullScreenModal",
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="DocumentDetail"
            component={DocumentDetailScreenLight}
            options={({ route }) => ({
              ...getDocumentsStackScreenOptions(t),
              headerShown: true,
              title: "Documento",
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Atrás",
            })}
          />
          <Stack.Screen
            name="DocumentEdit"
            component={DocumentEditScreenLight}
            options={({ route }) => ({
              ...getDocumentsStackScreenOptions(t),
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
            options={({ route }) => {
              const params = route.params as { id?: string } | undefined;
              const isCreate = !params?.id;
              return {
                headerShown: true,
                title: isCreate ? "Nueva mochila" : "Editar mochila",
                headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Mochilas",
              };
            }}
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
            name="ShareConfigure"
            component={ShareConfigureScreenLight}
            options={({ route }) => ({
              ...getDocumentsStackScreenOptions(t),
              headerShown: true,
              title: "Compartir",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Atrás",
            })}
          />
          <Stack.Screen
            name="ShareQr"
            component={ShareQrScreenLight}
            options={({ route }) => ({
              ...getDocumentsStackScreenOptions(t),
              headerShown: true,
              title: "Compartir QR",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Compartir",
            })}
          />
          <Stack.Screen
            name="SharedHistory"
            component={SharedHistoryScreenLight}
            options={({ route }) => ({
              ...getDocumentsStackScreenOptions(t),
              headerShown: true,
              title: "Compartidos",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Atrás",
            })}
          />
          <Stack.Screen
            name="SharedDetail"
            component={SharedDetailScreenLight}
            options={({ route }) => ({
              ...getDocumentsStackScreenOptions(t),
              headerShown: true,
              title: "Compartido",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Compartidos",
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
          <Stack.Screen
            name="AppointmentDetail"
            component={AppointmentDetailScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="AgendaTaskDetail"
            component={AgendaTaskDetailScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="AgendaTaskForm"
            component={AgendaTaskFormScreen}
            options={FORM_SCREEN_OPTIONS}
          />
          <Stack.Screen
            name="AppointmentForm"
            component={AppointmentFormScreen}
            options={FORM_SCREEN_OPTIONS}
          />
          <Stack.Screen
            name="DoctorForm"
            component={DoctorFormScreen}
            options={FORM_SCREEN_OPTIONS}
          />
          <Stack.Screen
            name="MedicationForm"
            component={MedicationFormScreen}
            options={FORM_SCREEN_OPTIONS}
          />
          <Stack.Screen
            name="MedicationDetail"
            component={MedicationDetailScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="CycleDetail"
            component={CycleDetailScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Treatments"
            component={TreatmentsScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="TreatmentDetail"
            component={TreatmentDetailScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="TreatmentForm"
            component={TreatmentFormScreen}
            options={FORM_SCREEN_OPTIONS}
          />
          <Stack.Screen
            name="Dependientes"
            component={DependientesScreen}
            options={({ route }) => ({
              headerShown: true,
              title: LINKED_PEOPLE_SCREEN_TITLE,
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? "Más",
            })}
          />
          <Stack.Screen
            name="DependientesInvite"
            component={DependientesInviteScreen}
            options={({ route }) => ({
              headerShown: true,
              title: "Invitar",
              animation: "slide_from_right" as const,
              headerBackTitle: (route.params as WithBackTitle | undefined)?.backTitle ?? LINKED_PEOPLE_SCREEN_TITLE,
            })}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Auth" component={LoginScreen} />
          {/* Inicio de sesión y registro son hermanas: fundido, no «entra desde la derecha» (§1b). */}
          <Stack.Screen
            name="Signup"
            component={SignupScreen}
            options={{ headerShown: false, animation: "fade", animationDuration: 150 }}
          />
        </>
      )}
    </Stack.Navigator>
    </>
  );
}
