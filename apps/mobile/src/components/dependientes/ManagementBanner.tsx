import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeOut, SlideInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "@helu/stores";
import { useDelegationContextColorsQuery, useManagedUsersQuery } from "@helu/api/hooks";
import { colors, motion, nativeFont, spacing } from "@helu/ui";
import { initialsOf } from "./PersonCard";
import { resolveDelegationRingColor } from "./colorTokens";

/**
 * Mockup «Modo gestión» (module 8): while managing someone, a band in their color sits on top of the
 * whole app — «Gestionando a Juan Pérez · Todo lo que hagas queda en su cuenta» and «Volver a mi
 * cuenta». No mascot here (m9 rule). It takes the status bar area, so screens below get no top inset.
 */
export function ManagementBanner({ onExit }: { onExit: () => void }) {
  const insets = useSafeAreaInsets();
  const isManaging = useAuthStore((s) => s.isManaging);
  const activePatientId = useAuthStore((s) => s.activePatientId);
  const managed = useManagedUsersQuery().data ?? [];
  const contextColors = useDelegationContextColorsQuery().data ?? {};
  if (!isManaging || !activePatientId) return null;

  const index = managed.findIndex((d) => (d.dependentUserId ?? d.id) === activePatientId);
  const person = index >= 0 ? managed[index] : undefined;
  const name = person?.linkedUserName ?? person?.linkedUserEmail ?? "otra cuenta";
  const color = resolveDelegationRingColor(contextColors, activePatientId, Math.max(index, 0));

  return (
    <Animated.View
      entering={SlideInUp.duration(motion.base)}
      exiting={FadeOut.duration(motion.fast)}
      style={[styles.banner, { backgroundColor: color, paddingTop: insets.top + spacing[2] }]}
      accessibilityRole="summary"
      accessibilityLabel={`Gestionando a ${name}. Todo lo que hagas queda en su cuenta.`}
    >
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
      <Pressable
        onPress={onExit}
        style={({ pressed }) => [styles.exit, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
        accessibilityLabel="Volver a mi cuenta"
      >
        <Text style={[styles.exitText, { color }]}>Volver a mi cuenta</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2] + 2,
  },
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
  exit: {
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  exitText: { fontSize: 13, fontFamily: nativeFont("heading", 800) },
});
