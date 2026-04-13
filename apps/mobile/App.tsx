import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  NavigationContainer,
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
} from "@react-navigation/native";
import type { Theme as NavigationTheme } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { toastConfig } from "./src/components/ToastConfig";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { navigationRef } from "./src/navigation/navigationRef";
import { useAuthStore, useNotifStore } from "@healthguard/stores";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { usePushNotifications } from "./src/hooks/usePushNotifications";
import { setApiAuthProviders, getNotifications } from "@healthguard/api";
import { ThemeProvider, colors, useAppTheme } from "@healthguard/ui";

setApiAuthProviders({
  getToken: () => useAuthStore.getState().token,
  getRefreshToken: () => useAuthStore.getState().refreshToken,
  getPatientContext: () => useAuthStore.getState().activePatientId,
  setAuth: (token, refreshToken) => useAuthStore.getState().setAuth(token, refreshToken),
  clearAuth: () => useAuthStore.getState().logout(),
});

const queryClient = new QueryClient();

function ThemedNavigationContainer() {
  const t = useAppTheme();
  const base = t.mode === "dark" ? NavDarkTheme : NavDefaultTheme;
  const navigationTheme: NavigationTheme = {
    ...base,
    dark: t.mode === "dark",
    colors: {
      ...base.colors,
      primary: colors.sky[500],
      background: t.surface.bg,
      card: t.surface.bg,
      text: t.text.primary,
      border: t.border.default,
      notification: colors.primary[500],
    },
  };

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const token = useAuthStore((s) => s.token);
  const setUnreadCount = useNotifStore((s) => s.setUnreadCount);

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
        <ActivityIndicator size="large" color={colors.sky[500]} />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemedNavigationContainer />
          <Toast config={toastConfig} position="bottom" bottomOffset={90} visibilityTime={3500} />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
