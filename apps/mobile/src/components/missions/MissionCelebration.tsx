import { useEffect, useMemo, type ReactNode } from "react";
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
import { Route, Star } from "lucide-react-native";
import { Button, motion, nativeFont, spacing, useAppTheme } from "@helu/ui";
import type { Mission, UserProgress } from "@helu/api";
import { Mascot } from "../brand/Mascot";
import { haptics } from "../../lib/haptics";
import { celebrationSummary } from "./missionCopy";
import { Flame } from "../home/Flame";
import { Medal } from "../motivation/Medal";
import { badgeCopy } from "../motivation/badgeCatalog";

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
  /**
   * Fresh progress after the closure (the server already awarded): streak, level and the badges this
   * mission earned. `undefined` while it loads; the steps card shows on its own meanwhile.
   */
  progress?: UserProgress;
  /** «Celebraciones» (cached preference, known before the fresh progress arrives). */
  celebrationsEnabled?: boolean;
}

/**
 * «Celebración» and «Celebración · gestor» (RF-50, DA-13): mascot «Celebra», confetti once in the top
 * strip without covering text, a summary, the steps / streak / level boxes, «Nueva insignia» when this
 * mission earned one (RF-90) and «Volver al inicio». «Mostrar racha y nivel» off leaves the steps and
 * the badge (RF-93). With reduced motion or «Celebraciones» off: no confetti, no hops, only a 150 ms
 * fade (MASTER §10).
 */
export function MissionCelebration({
  mission,
  managedName,
  firstName,
  onHome,
  onDocuments,
  progress,
  celebrationsEnabled = true,
}: MissionCelebrationProps) {
  const t = useAppTheme();
  const reducedMotion = useReducedMotion();
  const reduced = reducedMotion || !celebrationsEnabled;
  const managing = !!managedName;

  useEffect(() => {
    haptics.success();
  }, []);

  const steps = mission.steps.filter((s) => s.applies);
  const done = steps.filter((s) => s.status === "completed" || s.status === "skipped").length;
  const sessions = mission.sessions?.total ? `${mission.sessions.attended} de ${mission.sessions.total}` : null;
  const showProgress = progress?.showProgress ?? false;
  const newBadges = (progress?.badges ?? []).filter((b) => b.earned && b.sourceId === mission.id && badgeCopy(b.code));
  const streakDays = progress?.streak.current ?? 0;
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
          <Animated.View entering={FadeIn.duration(reduced ? motion.fast : motion.base).delay(reduced ? 0 : motion.slow)} style={styles.stats}>
            <StatBox
              icon={<Route size={20} strokeWidth={2.4} color={t.status.successGraphic} />}
              value={sessions ?? `${done} de ${steps.length}`}
              label={sessions ? "sesiones" : "pasos"}
            />
            {showProgress && progress ? (
              <>
                <StatBox icon={<Flame size={22} />} value={String(streakDays)} label={streakDays === 1 ? "día de racha" : "días de racha"} />
                <StatBox
                  icon={<Star size={20} strokeWidth={2.4} color={t.motivation.level} fill={t.motivation.level} />}
                  value={`Nivel ${progress.level.number}`}
                  label={progress.level.name}
                />
              </>
            ) : null}
          </Animated.View>
          {newBadges.map((badge) => {
            const copy = badgeCopy(badge.code)!;
            return (
              <Animated.View
                key={badge.code}
                entering={FadeIn.duration(reduced ? motion.fast : motion.base).delay(reduced ? 0 : motion.slow * 2)}
                accessible
                accessibilityLabel={`Nueva insignia: ${copy.label}. ${managing ? copy.earnedTextOther : copy.earnedText}`}
                style={[styles.badge, { backgroundColor: t.status.warningBg, borderColor: t.motivation.streakBorder }]}
              >
                <Medal code={badge.code} earned />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[styles.badgeEyebrow, { color: t.status.warningFg }]}>
                    {managing ? `NUEVA INSIGNIA PARA ${managedName!.toUpperCase()}` : "NUEVA INSIGNIA"}
                  </Text>
                  <Text style={[styles.badgeTitle, { color: t.text.primary }]}>{copy.label}</Text>
                  <Text style={[styles.statLabel, { color: t.text.secondary }]}>{managing ? copy.earnedTextOther : copy.earnedText}</Text>
                </View>
              </Animated.View>
            );
          })}
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

function StatBox({ icon, value, label }: { icon: ReactNode; value: string; label: string }) {
  const t = useAppTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${value} ${label}`}
      style={[styles.stat, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}
    >
      {icon}
      <Text style={[styles.statValue, { color: t.text.primary }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: t.text.secondary, textAlign: "center" }]} numberOfLines={2}>
        {label}
      </Text>
    </View>
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
  stats: { marginTop: spacing[2], alignSelf: "stretch", flexDirection: "row", gap: 10 },
  stat: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    padding: spacing[3],
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  statValue: { fontSize: 18, fontFamily: nativeFont("heading", 900) },
  statLabel: { fontSize: 13, lineHeight: 17, fontFamily: nativeFont("body", 400) },
  badge: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: spacing[4],
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  badgeEyebrow: { fontSize: 12, letterSpacing: 1.2, fontFamily: nativeFont("heading", 900) },
  badgeTitle: { fontSize: 16, fontFamily: nativeFont("heading", 800) },
  actions: { gap: spacing[2], paddingHorizontal: spacing[5], paddingBottom: spacing[3] },
  piece: { position: "absolute", top: 0, borderRadius: 2 },
});
