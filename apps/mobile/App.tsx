import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider, onlineManager } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { NavigationContainer } from "@react-navigation/native";
import { HeluToast } from "./src/components/ToastConfig";
import { useProgressToasts } from "./src/components/motivation/useProgressToasts";
import { DocumentSuggestionHost } from "./src/components/missions/DocumentSuggestionHost";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { useAuthStore, useNotifStore, useUiStore } from "@helu/stores";
import { useEffect } from "react";
import { useFonts } from "expo-font";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_500Medium } from "@expo-google-fonts/inter/500Medium";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Nunito_700Bold } from "@expo-google-fonts/nunito/700Bold";
import { Nunito_800ExtraBold } from "@expo-google-fonts/nunito/800ExtraBold";
import { Nunito_900Black } from "@expo-google-fonts/nunito/900Black";
import { View, ActivityIndicator } from "react-native";
import { usePushNotifications } from "./src/hooks/usePushNotifications";
import { setApiAuthProviders, isApiError } from "@helu/api";
import { useNotificationsQuery } from "@helu/api/hooks";
import { ThemeProvider, palette } from "@helu/ui";

setApiAuthProviders({
  getToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  getPatientContext: () => useAuthStore.getState().activePatientId,
  // A token refresh only swaps the tokens. `setAuth` is for login/signup: it clears the whole query
  // cache and the patient context, so calling it here wiped every cached screen (and left
  // management mode) each time the access token expired.
  setAuth: (token, refreshToken) => useAuthStore.setState({ token, refreshToken }),
  clearAuth: () => useAuthStore.getState().logout(),
});

// TanStack Query learns about connectivity from NetInfo: queries refetch when the phone is back
// online, and the «Sin conexión» banner reads the same state.
onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      // Try once even offline, so a screen without cached data shows «Error al cargar» instead of a
      // skeleton that waits for the network; retries only while online.
      networkMode: "offlineFirst",
      retry: (count, error) => {
        if (!onlineManager.isOnline()) return false;
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return count < 2;
      },
    },
    mutations: {
      // Same as before NetInfo: a save offline fails and says so; nothing is queued.
      networkMode: "always",
      onError: (error) => {
        if (isApiError(error)) {
          console.error(`[API Error] ${error.code}: ${error.message}`);
        }
      },
    },
  },
});

/** Query roots whose cached data depends on X-Patient-Context (not delegation lists). */
const PATIENT_SCOPED_QUERY_ROOTS = [
  "me",
  "documents",
  "document",
  "document-types",
  "tag-categories",
  "backpacks",
  "backpack",
  "backpack-docs",
  "backpack-doc-ids",
  "doctors",
  "appointments",
  "appointment",
  "treatments",
  "treatment",
  "medications",
  "notifications",
  "calendar",
  "document-shares-active",
  "shares",
] as const;

useAuthStore.getState().setQueryCacheCleaner((mode = "full") => {
  void queryClient.cancelQueries();
  if (mode === "full") {
    queryClient.clear();
    return;
  }
  for (const root of PATIENT_SCOPED_QUERY_ROOTS) {
    queryClient.removeQueries({ queryKey: [root] });
  }
});

function AppContent({
  token,
  isHydrated,
}: {
  token: string | null;
  isHydrated: boolean;
}) {
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);

  usePushNotifications(token, queryClient, isHydrated);
  useProgressToasts(!!token && isHydrated);

  const { data: notifData } = useNotificationsQuery(1, 50, !!token);
  useEffect(() => {
    if (!token || !notifData) return;
    const unread = notifData.items.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [token, notifData, setUnreadCount]);

  return (
    // Swipe actions on list cards (SwipeRow, #127) need the gesture handler root.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <RootNavigator />
        </NavigationContainer>
        {/* «¿Te acompañamos con esto?» after saving an order or an authorization (Misiones RF-68). */}
        {token ? <DocumentSuggestionHost /> : null}
        <HeluToast />
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function App() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const themePreference = useUiStore((s) => s.theme);
  // v2 (MASTER §5): Nunito para títulos y botones, Inter para el cuerpo. Cada peso es una
  // familia distinta en React Native; los nombres coinciden con `nativeFontFamily` de @helu/ui.
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });

  useEffect(() => {
    if (!useAuthStore.getState().isHydrated) {
      useAuthStore.getState().setHydrated();
    }
  }, []);

  useEffect(() => {
    // Si las fuentes no cargan, la app sigue con la fuente del sistema en vez de bloquearse.
    if (fontError) console.warn("[fonts] No se pudieron cargar Nunito/Inter:", fontError);
  }, [fontError]);

  if (!isHydrated || (!fontsLoaded && !fontError)) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.brand[600]} />
      </View>
    );
  }

  return (
    <ThemeProvider preference={themePreference}>
      <QueryClientProvider client={queryClient}>
        <AppContent token={token} isHydrated={isHydrated} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
