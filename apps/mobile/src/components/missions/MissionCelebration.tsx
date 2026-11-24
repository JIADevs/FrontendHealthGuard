import { useEffect, useMemo } from "react";
import { StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Route } from "lucide-react-native";
import { Button, motion, nativeFont, spacing, useAppTheme } from "@helu/ui";
import type { Mission } from "@helu/api";
import { Mascot } from "../brand/Mascot";
import { haptics } from "../../lib/haptics";
import { celebrationSummary } from "./missionCopy";

/** RF-50: ≤ 1,2 s, once. Three hops of the mascot and one fall of the confetti in the top strip. */
const HOP_MS = 200;
const CONFETTI_MS = 1100;
const CONFETTI_STRIP = 150;
const CONFETTI = ["#F59E0B", "#22C55E", "#3B82F6", "#EC4899", "#8B5CF6", "#F97316"];

export interface MissionCelebrationProps {
  mission: Mission;
  /** Managing someone else (DA-13, DU-23): same screen, third person. */
  managedName?: string | null;
  firstName?: string | null;
  onHome: () => void;
  onDocuments: () => void;
}

/**
 * «Celebración» and «Celebración · gestor» (RF-50, DA-13): mascot «Celebra», confetti once in the top
 * strip without covering text, a summary and «Volver al inicio». Points, level and badge arrive with
 * M6 (Motivación); the card shows what the mission did. With reduced motion nothing moves (§ a11y).
 */
export function MissionCelebration({ mission, managedName, firstName, onHome, onDocuments }: MissionCelebrationProps) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const managing = !!managedName;

  useEffect(() => {
    haptics.success();
  }, []);

  const steps = mission.steps.filter((s) => s.applies);
  const done = steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const sessions = mission.sessions?.total ? `${mission.sessions.attended} de ${mission.sessions.total}` : null;
  const title = managing
    ? `¡${managedName} completó su misión!`
    : firstName
      ? `¡Lo lograste, ${firstName}!`
      : "¡Lo lograste!";

  return (
    <LinearGradient colors={[t.status.warningBg, t.surface.bg]} locations={[0, 0.45]} style={{ flex: 1 }}>
      {reduced ? null : <Confetti />}
      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.content} accessibilityLiveRegion="polite">
          <HoppingMascot reduced={reduced} />
          <Text style={[styles.eyebrow, { color: t.status.warningFg }]}>MISIÓN COMPLETADA</Text>
          <Text style={[styles.title, { color: t.text.primary }]} accessibilityRole="header">
            {title}
          </Text>
          <Text style={[styles.summary, { color: t.text.secondary }]}>{celebrationSummary(mission.type, managing)}</Text>
          <Animated.View
            entering={reduced ? undefined : FadeIn.duration(motion.base).delay(motion.slow)}
            style={[styles.stat, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}
          >
            <Route size={20} strokeWidth={2.4} color={t.status.successGraphic} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.statValue, { color: t.text.primary }]}>{sessions ?? `${done} de ${steps.length}`}</Text>
              <Text style={[styles.statLabel, { color: t.text.secondary }]}>{sessions ? "sesiones" : "pasos"}</Text>
            </View>
            <Text style={[styles.statTitle, { color: t.text.secondary }]} numberOfLines={2}>
              {mission.title}
            </Text>
          </Animated.View>
        </View>
        <View style={styles.actions}>
          <Button variant="success" fullWidth onPress={onHome}>
            {managing ? `Volver al inicio de ${managedName}` : "Volver al inicio"}
          </Button>
          <Button variant="ghost" fullWidth onPress={onDocuments}>
            Ver documentos de la misión
          </Button>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/** Three hops, arms up (pose «joy»), ≈ 1,2 s with the settle. Static with reduced motion. */
function HoppingMascot({ reduced }: { reduced: boolean }) {
  const y = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    const hop = () =>
      withSequence(
        withTiming(-18, { duration: HOP_MS, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: HOP_MS - 20, easing: Easing.in(Easing.quad) }),
      );
    y.value = withSequence(hop(), hop(), hop());
  }, [reduced, y]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Mascot pose="joy" size={128} />
    </Animated.View>
  );
}

/** Pieces fall once inside the top strip and fade out before reaching the text. */
function Confetti() {
  const { width } = useWindowDimensions();
  const pieces = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: ((i * 53) % 100) / 100,
        delay: (i % 6) * 60,
        rotate: (i * 47) % 180,
        color: CONFETTI[i % CONFETTI.length],
        w: i % 3 === 0 ? 10 : 7,
      })),
    [],
  );
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { height: CONFETTI_STRIP + 40 }]}>
      {pieces.map((p, i) => (
        <Piece key={i} left={p.x * (width - 16) + 8} {...p} />
      ))}
    </View>
  );
}

function Piece({ left, delay, rotate, color, w }: { left: number; delay: number; rotate: number; color: string; w: number }) {
  const fall = useSharedValue(0);
  useEffect(() => {
    fall.value = withDelay(delay, withTiming(1, { duration: CONFETTI_MS - delay, easing: Easing.out(Easing.cubic) }));
  }, [delay, fall]);
  const style = useAnimatedStyle(() => ({
    opacity: fall.value < 0.7 ? 1 : 1 - (fall.value - 0.7) / 0.3,
    transform: [{ translateY: -20 + fall.value * CONFETTI_STRIP }, { rotate: `${rotate + fall.value * 160}deg` }],
  }));
  return <Animated.View style={[styles.piece, { left, width: w, height: w * 0.55, backgroundColor: color }, style]} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, justifyContent: "space-between" },
  content: { alignItems: "center", gap: spacing[3], paddingHorizontal: spacing[5], paddingTop: spacing[8] },
  eyebrow: { fontSize: 12, letterSpacing: 1.4, fontFamily: nativeFont("heading", 900) },
  title: { fontSize: 28, lineHeight: 34, textAlign: "center", fontFamily: nativeFont("heading", 900) },
  summary: { fontSize: 15, lineHeight: 21, textAlign: "center", maxWidth: 320, fontFamily: nativeFont("body", 400) },
  stat: {
    marginTop: spacing[2],
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
    padding: spacing[4],
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  statValue: { fontSize: 18, fontFamily: nativeFont("heading", 900) },
  statLabel: { fontSize: 13, fontFamily: nativeFont("body", 400) },
  statTitle: { flex: 1.4, fontSize: 13, lineHeight: 18, textAlign: "right", fontFamily: nativeFont("body", 600) },
  actions: { gap: spacing[2], paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  piece: { position: "absolute", top: 0, borderRadius: 2 },
});
