import { useState, useSyncExternalStore, type ReactNode } from "react";
import { StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeOut, LinearTransition } from "react-native-reanimated";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import NetInfo from "@react-native-community/netinfo";
import { onlineManager, useQueryClient } from "@tanstack/react-query";
import { Globe } from "lucide-react-native";
import { Button, colors, motion, nativeFont, spacing } from "@helu/ui";

const subscribe = (onChange: () => void) => onlineManager.subscribe(onChange);
const isOnline = () => onlineManager.isOnline();

/**
 * Mockup m7 «Sin conexión»: a dark band on top while the phone is offline. Screens keep showing
 * what is cached («Mostramos lo último guardado»); when the network comes back, TanStack Query
 * refetches by itself and the band leaves. «Reintentar» checks the connection again right away.
 *
 * It sits above the navigator, in the layout flow, so it pushes the screens down instead of
 * covering their headers; their SafeAreaView then no longer needs the top inset.
 */
export function useIsOnline() {
  return useSyncExternalStore(subscribe, isOnline);
}

/**
 * Screens below the banner. A nested SafeAreaProvider measures its own insets: while the banner
 * covers the status bar its top inset is 0, for `useSafeAreaInsets` and for native SafeAreaViews
 * alike. Always mounted, so going offline never remounts the navigator.
 */
export function BelowOfflineBanner({ children }: { children: ReactNode }) {
  return <SafeAreaProvider style={{ flex: 1 }}>{children}</SafeAreaProvider>;
}

export function OfflineBanner() {
  const online = useIsOnline();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [checking, setChecking] = useState(false);

  if (online) return null;

  const retry = () => {
    setChecking(true);
    void NetInfo.refresh()
      .then((state) => {
        if (state.isConnected === false) return;
        // Back online: say so now instead of waiting for NetInfo's next change event.
        onlineManager.setOnline(true);
        return qc.refetchQueries({ type: "active" });
      })
      .finally(() => setChecking(false));
  };

  return (
    <Animated.View
      entering={FadeIn.duration(motion.base)}
      exiting={FadeOut.duration(motion.base)}
      layout={LinearTransition.duration(motion.base)}
      style={[styles.band, { paddingTop: insets.top + spacing[2] }]}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      {/* White status bar text over the dark band. */}
      <StatusBar barStyle="light-content" />
      <Globe size={18} color={colors.error[300]} />
      <View style={styles.copy}>
        <Text style={styles.title}>Sin conexión a internet</Text>
        <Text style={styles.sub}>Mostramos lo último guardado. Conéctate para guardar cambios.</Text>
      </View>
      <Button variant="secondary" size="sm" onPress={retry} loading={checking} loadingLabel="Revisando…">
        Reintentar
      </Button>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  band: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    backgroundColor: colors.slate[900],
  },
  copy: { flex: 1, minWidth: 0, gap: 2 },
  title: { color: colors.white, fontSize: 14, fontFamily: nativeFont("heading", 800) },
  sub: { color: colors.slate[300], fontSize: 12, lineHeight: 16, fontFamily: nativeFont("body", 400) },
});
