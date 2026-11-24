import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from "react-native-reanimated";
import { Star } from "lucide-react-native";
import { IconTile, motionEasing, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import type { UserLevel } from "@helu/api";

/** Points inside the current level, as «Llevas 26 de 30» (Motivación §4, copy in positive). */
export function levelProgress(points: number, level: UserLevel) {
  const span = Math.max((level.nextMinPoints ?? level.minPoints + 30) - level.minPoints, 1);
  const done = Math.min(Math.max(points - level.minPoints, 0), span);
  return { done, span, ratio: done / span };
}

/**
 * «Nivel 4 · Constancia» with its bar (mockup m6 «Perfil», DU-35, RF-91). The name comes from the
 * API (`levels` table, DU-6): never written in the app. Points never appear as a loose number:
 * only as progress inside the level (MASTER §8). The bar grows once on mount; still with reduced motion.
 */
export function LevelCard({ points, level, managedName }: { points: number; level: UserLevel; managedName?: string | null }) {
  const t = useAppTheme();
  const { done, span, ratio } = levelProgress(points, level);
  const sub = managedName ? "Suman sus check-in, tomas, pasos y misiones" : "Suman tus check-in, tomas, pasos y misiones";
  return (
    <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      <View style={styles.row}>
        <IconTile tone="warning" icon={<Star size={22} strokeWidth={2.2} color={t.motivation.level} fill={t.motivation.level} />} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: t.text.primary }]} accessibilityRole="header">
            Nivel {level.number} · {level.name}
          </Text>
          <Text style={[styles.sub, { color: t.text.secondary }]}>{sub}</Text>
        </View>
      </View>
      <LevelBar ratio={ratio} />
      <Text style={[styles.sub, { color: t.text.secondary }]}>
        {managedName ? "Lleva" : "Llevas"} {done} de {span} acciones de cuidado para el nivel {level.number + 1}
      </Text>
    </View>
  );
}

export function LevelBar({ ratio }: { ratio: number }) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const grow = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (!reduced) grow.value = withTiming(1, { duration: 600, easing: motionEasing.out });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const animated = useAnimatedStyle(() => ({ transform: [{ scaleX: grow.value }] }));
  return (
    <View
      style={[styles.track, { backgroundColor: t.mode === "dark" ? t.motivation.track : t.status.warningBg }]}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(ratio * 100) }}
    >
      {/* Never starts empty, like the mission bar (misiones.md v2 · Progreso). */}
      <Animated.View
        style={[styles.fill, { width: `${Math.max(ratio, 0.04) * 100}%`, backgroundColor: t.motivation.level, transformOrigin: "left" }, animated]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, borderWidth: 1, borderBottomWidth: 4, padding: spacing[4], gap: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 15, fontFamily: nativeFont("heading", 800) },
  sub: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
});
