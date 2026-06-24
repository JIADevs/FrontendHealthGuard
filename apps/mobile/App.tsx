import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { KeyboardAwareToast } from "./src/components/KeyboardAwareToast";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { useAuthStore, useNotifStore, useUiStore } from "@helu/stores";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { usePushNotifications } from "./src/hooks/usePushNotifications";
import { setApiAuthProviders, getNotifications } from "@helu/api";
import { ThemeProvider, colors, palette } from "@helu/ui";

setApiAuthProviders({
  getToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  getPatientContext: () => useAuthStore.getState().activePatientId,
  setAuth: (token, refreshToken) => useAuthStore.getState().setAuth(token, refreshToken),
  clearAuth: () => useAuthStore.getState().logout(),
});

const queryClient = new QueryClient();

useAuthStore.getState().setQueryCacheCleaner(() => {
  queryClient.cancelQueries();
  queryClient.clear();
});

export default function App() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);
  const themePreference = useUiStore((s) => s.theme);

  // Pasa el JWT para que el registro FCM ocurra solo después del login
  usePushNotifications(token);

  useEffect(() => {
    if (!useAuthStore.getState().isHydrated) {
      useAuthStore.getState().setHydrated();
    }
  }, []);

  // Carga el contador de no leídas cuando el usuario se autentica
  useEffect(() => {
    if (!token) return;
    getNotifications({ page: 1, limit: 50 })
      .then((res) => {
        const unread = res.items.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      })
      .catch(() => {});
  }, [token, setUnreadCount]);

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
        <SafeAreaProvider>
          <NavigationContainer ref={navigationRef}>
            <RootNavigator />
          </NavigationContainer>
          <KeyboardAwareToast />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
