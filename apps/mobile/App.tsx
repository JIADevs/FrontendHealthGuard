import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { NavigationContainer } from "@react-navigation/native";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useAuthStore } from "@healthguard/stores";
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { usePushNotifications } from "./src/hooks/usePushNotifications";

const queryClient = new QueryClient();

export default function App() {
  const isHydrated = useAuthStore((s) => s.isHydrated);
  usePushNotifications(); // Registers token internally on mount

  useEffect(() => {
    // Manually hydrate since our storage is falling back to memory in RN
    useAuthStore.setState({ isHydrated: true });
  }, []);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <RootNavigator />
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
