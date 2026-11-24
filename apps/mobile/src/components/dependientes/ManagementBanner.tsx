import { useEffect, useState } from "react";
import { Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import Animated, { SlideInUp, SlideOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@helu/stores";
import { useDelegationContextColorsQuery, useManagedUsersQuery } from "@helu/api/hooks";
import { colors, motion, nativeFont, spacing } from "@helu/ui";
import { initialsOf } from "./PersonCard";
import { resolveDelegationRingColor } from "./colorTokens";

/** How long the notice stays on screen once it has slid in (user decision, 2026-11-23). */
const VISIBLE_MS = 1000;

/**
 * Mockup «Modo gestión» (module 8), as a passing notice: when you start managing someone, a band
 * in their color slides over the top — «Gestionando a Juan Pérez · Todo lo que hagas queda en su
 * cuenta» — and leaves after one second. The lasting cue is the Inicio tab, which shows their
 * initials and color ring. Tap to dismiss early. No mascot here (m9 rule).
 */
export function ManagementBanner() {
  const insets = useSafeAreaInsets();
  const isManaging = useAuthStore((s) => s.isManaging);
  const activePatientId = useAuthStore((s) => s.activePatientId);
  const managed = useManagedUsersQuery().data ?? [];
  const contextColors = useDelegationContextColorsQuery().data ?? {};
  const [shownFor, setShownFor] = useState<string | null>(null);

  // Each switch into someone's account shows the notice once.
  useEffect(() => {
    if (!isManaging || !activePatientId) {
      setShownFor(null);
      return;
    }
    setShownFor(activePatientId);
    const timer = setTimeout(() => setShownFor(null), motion.base + VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [isManaging, activePatientId]);

  if (!shownFor) return null;

  const index = managed.findIndex((d) => (d.dependentUserId ?? d.id) === shownFor);
  const person = index >= 0 ? managed[index] : undefined;
  const name = person?.linkedUserName ?? person?.linkedUserEmail ?? "otra cuenta";
  const color = resolveDelegationRingColor(contextColors, shownFor, Math.max(index, 0));

  return (
    <Animated.View
      entering={SlideInUp.duration(motion.base)}
      exiting={SlideOutUp.duration(motion.base)}
      style={[styles.banner, { backgroundColor: color, paddingTop: insets.top + spacing[2] }]}
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      accessibilityLabel={`Gestionando a ${name}. Todo lo que hagas queda en su cuenta.`}
    >
      {/* White status bar text over the person's color while the notice is up. */}
      <StatusBar barStyle="light-content" />
      <Pressable onPress={() => setShownFor(null)} style={styles.row} accessibilityRole="button" accessibilityHint="Cierra el aviso">
        <View style={styles.avatar}>
          <Text style={styles.initials}>{initialsOf(name)}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={2}>
            Gestionando a {name}
          </Text>
          <Text style={styles.sub} numberOfLines={2}>
            Todo lo que hagas queda en su cuenta
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    elevation: 10,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { color: colors.white, fontSize: 12, fontFamily: nativeFont("heading", 900) },
  copy: { flex: 1, minWidth: 0 },
  title: { color: colors.white, fontSize: 14, fontFamily: nativeFont("heading", 900) },
  sub: { color: colors.white, opacity: 0.9, fontSize: 12, fontFamily: nativeFont("body", 500) },
});
