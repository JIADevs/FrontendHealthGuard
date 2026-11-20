import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { toastConfig } from "./src/components/ToastConfig";
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
  setAuth: (token, refreshToken) => useAuthStore.getState().setAuth(token, refreshToken),
  clearAuth: () => useAuthStore.getState().logout(),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: (count, error) => {
        if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
        return count < 2;
      },
    },
    mutations: {
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

  const { data: notifData } = useNotificationsQuery(1, 50, !!token);
  useEffect(() => {
    if (!token || !notifData) return;
    const unread = notifData.items.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  }, [token, notifData, setUnreadCount]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <RootNavigator />
      </NavigationContainer>
      <Toast config={toastConfig} position="bottom" bottomOffset={90} visibilityTime={3500} />
      <StatusBar style="auto" />
    </SafeAreaProvider>
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
