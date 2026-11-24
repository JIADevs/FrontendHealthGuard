import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar, View } from "react-native";
import { useAuthStore } from "@helu/stores";
import { ManagementBanner } from "../components/dependientes/ManagementBanner";
import { BelowOfflineBanner, OfflineBanner } from "../components/states/OfflineBanner";
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
import { ShareChooseScreen } from "../screens/ShareChooseScreen";
import { ShareConfigureScreen } from "../screens/ShareConfigureScreen";
import { ShareQrScreen } from "../screens/ShareQrScreen";
import { SharedHistoryScreen } from "../screens/SharedHistoryScreen";
import { SharedDetailScreen } from "../screens/SharedDetailScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

import { AppointmentDetailScreen } from "../screens/AppointmentDetailScreen";
import { AgendaTaskDetailScreen } from "../screens/AgendaTaskDetailScreen";
import { AgendaTaskFormScreen } from "../screens/AgendaTaskFormScreen";
import { AppointmentFormScreen } from "../screens/AppointmentFormScreen";
import { MedicationFormScreen } from "../screens/MedicationFormScreen";
import { MedicationDetailScreen } from "../screens/MedicationDetailScreen";
import { CycleDetailScreen } from "../screens/CycleDetailScreen";
import { TreatmentsScreen } from "../screens/TreatmentsScreen";
import { TreatmentDetailScreen } from "../screens/TreatmentDetailScreen";
import { TreatmentFormScreen } from "../screens/TreatmentFormScreen";
import { MissionsScreen } from "../screens/MissionsScreen";
import { MissionDetailScreen } from "../screens/MissionDetailScreen";
import { MissionNewScreen } from "../screens/MissionNewScreen";

import { SettingsScreen } from "../screens/SettingsScreen";
import { DependientesScreen } from "../screens/DependientesScreen";
import { useAppTheme } from "@helu/ui";
import { withDocumentsTheme, getDocumentsStackScreenOptions } from "../components/documents";
import type { MissionType, ShareResourceType } from "@helu/api";
import type { ShareTarget } from "../components/share/ShareSetup";

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
  /** `missionId`: the appointment (or exam) is created linked to that mission (step «Programar»). */
  AppointmentForm:
    | {
        id?: string;
        missionId?: string;
        missionType?: MissionType;
        /** What the mission already knows, to prefill the new appointment. */
        missionSpecialty?: string;
        missionExamName?: string;
      }
    | undefined;
  MedicationForm: { medicationId?: string; medicationName?: string; cycleId?: string } | undefined;
  MedicationDetail: { id: string };
  CycleDetail: { cycleId: string; medicationId: string; medicationName: string };
  Treatments: WithBackTitle | undefined;
  TreatmentDetail: WithBackTitle & { id: string };
  TreatmentForm: WithBackTitle & { id?: string } | undefined;
  Missions: WithBackTitle | undefined;
  /** `openStep`: open that step's sheet on arrival (from «Tu próximo paso»). */
  MissionDetail: WithBackTitle & { id: string; openStep?: string };
  /** `initialType`: preselected type, e.g. «Necesito conseguirlo» from the first medication (RF-36). */
  MissionNew: (WithBackTitle & { initialType?: MissionType }) | undefined;
  Scanner: WithBackTitle & { backpackId?: string; backpackName?: string } | undefined;
  DocumentUpload:
    | (WithBackTitle & {
        backpackId?: string;
        backpackName?: string;
        /** FILE opens upload UI; LINK opens portal form and never the file picker. */
        initialKind?: "FILE" | "LINK";
        /** Pages from the scanner, already joined into one image or PDF. */
        scannedFile?: { uri: string; name: string; mimeType: string; size?: number };
      })
    | undefined;
  DocumentDetail: WithBackTitle & { id: string; title?: string } | undefined;
  DocumentEdit: WithBackTitle & { id: string } | undefined;
  Notifications: WithBackTitle | undefined;
  Profile: WithBackTitle | undefined;
  Settings: WithBackTitle | undefined;
  BackpackDetail: WithBackTitle & { id: string };
  BackpackEdit: WithBackTitle & { id?: string; preset?: { name: string; description: string } } | undefined;
  BackpackAddDocuments: WithBackTitle & { id: string };
  /** Compartir, paso 1 de 3. */
  ShareChoose: WithBackTitle | undefined;
  /** Compartir, paso 2 (from step 1, or straight from a document or backpack). */
  ShareConfigure: WithBackTitle & { target: ShareTarget; fromStepOne?: boolean };
  /** Compartir, paso 3 (`created`) or «Mostrar QR» of a link (`view`). */
  ShareQr: WithBackTitle & {
    shareUrl: string;
    title: string;
    resourceType: ShareResourceType;
    expiresAt: string | null;
    documentCount: number;
    mode: "created" | "view";
    fromStepOne?: boolean;
  };
  SharedHistory: WithBackTitle | undefined;
  SharedDetail: WithBackTitle & {
    linkId: string;
    resourceType: ShareResourceType;
  };
  Dependientes: WithBackTitle | undefined;
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
const ShareChooseScreenLight = withDocumentsTheme(ShareChooseScreen);
const ShareConfigureScreenLight = withDocumentsTheme(ShareConfigureScreen);
const ShareQrScreenLight = withDocumentsTheme(ShareQrScreen);
const SharedHistoryScreenLight = withDocumentsTheme(SharedHistoryScreen);
const SharedDetailScreenLight = withDocumentsTheme(SharedDetailScreen);

export function RootNavigator() {
  const token = useAuthStore((s) => s.token);
  const welcomePending = useWelcomeStore((s) => s.pending);
  const t = useAppTheme();

  return (
    <View style={{ flex: 1, backgroundColor: t.surface.bg }}>
      <StatusBar barStyle={t.mode === 'dark' ? 'light-content' : 'dark-content'} />
      {/* «Sin conexión»: in the flow, above every screen (m7). */}
      {token ? <OfflineBanner /> : null}
      <BelowOfflineBanner>
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
              ...FORM_SCREEN_OPTIONS,
            }}
          />
          <Stack.Screen
            name="DocumentUpload"
            component={DocumentUploadScreenLight}
            options={{ ...getDocumentsStackScreenOptions(t), ...FORM_SCREEN_OPTIONS }}
          />
          <Stack.Screen
            name="DocumentDetail"
            component={DocumentDetailScreenLight}
            options={{ ...getDocumentsStackScreenOptions(t), headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="DocumentEdit"
            component={DocumentEditScreenLight}
            options={{ ...getDocumentsStackScreenOptions(t), headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="BackpackDetail"
            component={BackpackDetailScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen name="BackpackEdit" component={BackpackEditScreen} options={FORM_SCREEN_OPTIONS} />
          <Stack.Screen name="BackpackAddDocuments" component={BackpackAddDocumentsScreen} options={FORM_SCREEN_OPTIONS} />
          <Stack.Screen name="ShareChoose" component={ShareChooseScreenLight} options={FORM_SCREEN_OPTIONS} />
          <Stack.Screen
            name="ShareConfigure"
            component={ShareConfigureScreenLight}
            options={({ route }) =>
              (route.params as { fromStepOne?: boolean } | undefined)?.fromStepOne
                ? { headerShown: false, animation: "slide_from_right" as const }
                : FORM_SCREEN_OPTIONS
            }
          />
          <Stack.Screen name="ShareQr" component={ShareQrScreenLight} options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen name="SharedHistory" component={SharedHistoryScreenLight} options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen name="SharedDetail" component={SharedDetailScreenLight} options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ headerShown: false, animation: "slide_from_right" }}
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
          <Stack.Screen name="Missions" component={MissionsScreen} options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen name="MissionDetail" component={MissionDetailScreen} options={{ headerShown: false, animation: "slide_from_right" }} />
          <Stack.Screen name="MissionNew" component={MissionNewScreen} options={FORM_SCREEN_OPTIONS} />
          <Stack.Screen name="Dependientes" component={DependientesScreen} options={{ headerShown: false, animation: "slide_from_right" }} />
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
      </BelowOfflineBanner>
      {/* «Gestionando a …» slides over everything for a second when you switch accounts. */}
      {token ? <ManagementBanner /> : null}
    </View>
  );
}
