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
import { View, ActivityIndicator } from "react-native";
import { usePushNotifications } from "./src/hooks/usePushNotifications";
import { setApiAuthProviders, isApiError } from "@helu/api";
import { useNotificationsQuery } from "@helu/api/hooks";
import { ThemeProvider, colors, palette } from "@helu/ui";

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

function AppContent({ token }: { token: string | null }) {
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);

  // Pasa el JWT para que el registro FCM ocurra solo después del login
  usePushNotifications(token);

  // Carga el contador de no leídas cuando el usuario se autentica; se
  // mantiene fresco vía invalidación de ["notifications"] (mark-read, push).
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

  useEffect(() => {
    if (!useAuthStore.getState().isHydrated) {
      useAuthStore.getState().setHydrated();
    }
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={palette.brand[500]} />
      </View>
    );
  }

  return (
    <ThemeProvider preference={themePreference}>
      <QueryClientProvider client={queryClient}>
        <AppContent token={token} />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
