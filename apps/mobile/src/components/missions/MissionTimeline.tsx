import { useEffect, useRef, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  LinearTransition,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Check, ChevronRight, FilePlus, FileText, Heart, Minus, Pause } from "lucide-react-native";
import type { Mission, MissionStep } from "@helu/api";
import { PressableScale, motion, motionEasing, nativeFont, spacing, useAppTheme, useReducedMotion } from "@helu/ui";
import { sessionMessage, sessionsTitle, shortDate, stepHint, stepTitle } from "./missionCopy";

const DONE = new Set(["completed", "skipped"]);

/**
 * Línea de tiempo v2.16 (`misiones.md`, MASTER §7): riel de 3 px con 6 px de aire, 26 px entre pasos.
 * El paso actual es una tarjeta tocable («Toca para continuar» + ›) con su nodo centrado; la línea de
 * tiempo no lleva botones. Los pasos hechos también se tocan y abren su resumen.
 */
export function MissionTimeline({
  mission,
  onOpenStep,
  confirmedKey,
  onResume,
}: {
  mission: Mission;
  onOpenStep: (step: MissionStep) => void;
  /**
   * The step the server just confirmed (movimiento §6 «Paso de misión completado»): its node pulses,
   * the rail draws to the next step (700 ms) and the next node unlocks with a short bounce. The
   * motivational motion waits for the server even though the timeline moved on tap (§8).
   */
  confirmedKey?: string | null;
  /** A paused mission shows its current step as «Toca para reanudar» (mockup «Misión pausada», RF-12). */
  onResume?: () => void;
}) {
  const t = useAppTheme();
  const steps = mission.steps.filter((s) => s.applies);
  const paused = mission.status === "paused";
  // A paused mission has no next action from the API: its current step is the first one not done.
  const currentKey =
    mission.status === "active"
      ? mission.nextAction?.stepKey
      : paused
        ? mission.nextAction?.stepKey ?? steps.find((s) => !DONE.has(s.status))?.key
        : undefined;
  const ok = t.status.successGraphic;
  const line = t.border.default;
  const total = steps.length;

  return (
    <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      {steps.map((step, i) => {
        const last = i === total - 1;
        const done = DONE.has(step.status);
        const current = step.key === currentKey;
        const nextIsCurrent = !last && steps[i + 1].key === currentKey;
        const below = done ? ok : line;

        if (current) {
          return (
            <Animated.View key={step.key} layout={LinearTransition.duration(motion.base)}>
              {/* 20 px of rail above and below the card, except at the ends of the timeline, so the
                  first or last card sits on the card padding without a gap. */}
              {i > 0 ? <Connector color={ok} draw={steps[i - 1].key === confirmedKey} /> : null}
              <View style={styles.row}>
                <View style={[styles.rail, { gap: 6 }]}>
                  <View style={[styles.seg, { backgroundColor: i > 0 ? ok : "transparent" }]} />
                  {/* 40 px node with a 5 px halo (kit: box-shadow 0 0 0 5px brand-tint), centered on the card. */}
                  <CurrentNode
                    paused={paused}
                    unlocked={i > 0 && steps[i - 1].key === confirmedKey}
                    icon={
                      paused ? (
                        <Pause size={19} strokeWidth={2.4} color={t.text.onSolid} />
                      ) : step.key === "sessions" ? (
                        <Heart size={19} strokeWidth={2.2} color={t.text.onSolid} />
                      ) : (
                        <FileText size={19} strokeWidth={2.2} color={t.text.onSolid} />
                      )
                    }
                  />
                  <View style={[styles.seg, { backgroundColor: last ? "transparent" : line }]} />
                </View>
                {/* PressableScale styles its inner view: this wrapper takes the row's remaining width. */}
                <View style={{ flex: 1 }}>
                <PressableScale
                  onPress={() => (paused ? onResume?.() : onOpenStep(step))}
                  accessibilityRole="button"
                  accessibilityLabel={
                    paused
                      ? `Misión pausada en el paso ${i + 1} de ${total}: ${stepTitle(mission, step.key)}. Toca para reanudar`
                      : `Paso ${i + 1} de ${total}, ahora: ${stepTitle(mission, step.key)}. Toca para continuar`
                  }
                  style={[
                    styles.currentCard,
                    paused
                      ? { backgroundColor: t.surface.muted, borderColor: t.border.default }
                      : { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder },
                  ]}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.eyebrow, { color: paused ? t.text.secondary : t.brand.text }]}>
                      {paused ? "MISIÓN PAUSADA" : `PASO ${i + 1} DE ${total} · AHORA`}
                    </Text>
                    <Text style={[styles.currentTitle, { color: t.text.primary }]}>
                      {step.key === "sessions" ? sessionsTitle(mission.sessions) : stepTitle(mission, step.key)}
                    </Text>
                    {/* The sessions cycle says where it stands: «Tu quinta sesión es el jueves» (RF-43). */}
                    <Text style={[styles.meta, { color: paused ? t.text.secondary : t.brand.text }]}>
                      {paused
                        ? "Toca para reanudar"
                        : step.key === "sessions"
                          ? sessionMessage(mission.sessions)
                          : pendingDetail(step) ?? "Toca para continuar"}
                    </Text>
                  </View>
                  <ChevronRight size={20} strokeWidth={2.6} color={paused ? t.text.muted : t.brand.solid} />
                </PressableScale>
                </View>
              </View>
              {last ? null : <Connector color={line} />}
            </Animated.View>
          );
        }

        const sub = step.status === "skipped"
          ? "No aplica"
          : done
            ? doneDetail(step, mission) ??
              `Completado${step.completedAt ? ` · ${shortDate(step.completedAt)}` : ""}${step.completedBy?.name && step.completedBy.id !== mission.userId ? ` · ${step.completedBy.name}` : ""}`
            : pendingDetail(step) ?? finalHint(step, mission) ?? stepHint(mission, step.key) ?? "";

        return (
          <Animated.View key={step.key} layout={LinearTransition.duration(motion.base)} style={styles.row}>
            <View style={[styles.rail, { gap: 6 }]}>
              <Node status={step.status} pulse={step.key === confirmedKey} />
              {last ? null : (
                <Rail draw={step.key === confirmedKey} color={below} minHeight={nextIsCurrent ? 6 : 28} />
              )}
            </View>
            <Pressable
              disabled={!done}
              onPress={() => onOpenStep(step)}
              accessibilityRole={done ? "button" : "text"}
              style={{ flex: 1, paddingTop: 4, paddingBottom: last ? 4 : nextIsCurrent ? 6 : 26, gap: 3 }}
            >
              <Text style={[styles.title, { color: done ? t.text.primary : t.text.muted, fontFamily: nativeFont("body", done ? 600 : 500) }]}>
                {stepTitle(mission, step.key)}
              </Text>
              {sub ? (
                <Text style={[styles.meta, { color: step.status === "completed" ? t.status.successFg : t.text.muted }]}>{sub}</Text>
              ) : null}
            </Pressable>
          </Animated.View>
        );
      })}
    </View>
  );
}

/** Rail-only gap between the current card and its neighbours. */
function Connector({ color, draw = false }: { color: string; draw?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <Rail draw={draw} color={color} height={20} delay={DRAW_MS / 2} />
      </View>
    </View>
  );
}

/** Node pulse, then the rail draws to the next step, then the next node bounces: ≤ 1,2 s in all. */
const PULSE_MS = 300;
const DRAW_MS = 700;

/**
 * A rail segment. With `draw` it fills from the top in 700 ms (§6 «el riel se dibuja hasta el
 * siguiente»), animating `scaleY` only (§8: transform and opacity).
 */
function Rail({
  draw,
  color,
  minHeight,
  height,
  delay = 0,
}: {
  draw: boolean;
  color: string;
  minHeight?: number;
  height?: number;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  const fill = useSharedValue(1);
  useEffect(() => {
    if (!draw || reduced) return;
    fill.value = 0;
    fill.value = withDelay(
      PULSE_MS / 2 + delay,
      withTiming(1, { duration: DRAW_MS / (height ? 2 : 1), easing: motionEasing.standard }),
    );
  }, [draw, reduced, delay, height, fill]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scaleY: fill.value }] }));
  return (
    <Animated.View
      style={[
        styles.seg,
        height ? { height, flex: 0 } : { minHeight },
        { backgroundColor: color, transformOrigin: "top" },
        animated,
      ]}
    />
  );
}

/**
 * The current node: «Estás aquí» is the halo that pulses (1,8 s loop, §1b), the only loop allowed
 * besides the AI shimmer; still with reduced motion or when paused. When a confirmed step unlocks
 * it, the node comes in with the short bounce of a positive confirmation (`ease-spring`).
 */
function CurrentNode({ paused, unlocked, icon }: { paused: boolean; unlocked: boolean; icon: ReactNode }) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const halo = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (reduced || paused) {
      cancelAnimation(halo);
      halo.value = 0;
      return;
    }
    halo.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(halo);
  }, [reduced, paused, halo]);

  const bounced = useRef(false);
  useEffect(() => {
    if (!unlocked || reduced || bounced.current) return;
    bounced.current = true;
    scale.value = withDelay(
      PULSE_MS / 2 + DRAW_MS,
      withSequence(
        withTiming(0.95, { duration: 60, easing: motionEasing.out }),
        withTiming(1.04, { duration: 110, easing: motionEasing.spring }),
        withTiming(1, { duration: 80, easing: motionEasing.out }),
      ),
    );
  }, [unlocked, reduced, scale]);

  const haloStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + halo.value * 0.14 }], opacity: 1 - halo.value * 0.45 }));
  const nodeStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.haloBox}>
      <Animated.View
        style={[styles.halo, { backgroundColor: paused ? t.surface.muted : t.brand.tint }, haloStyle]}
      />
      <Animated.View style={[styles.nodeCurrent, { backgroundColor: paused ? t.text.muted : t.brand.solid }, nodeStyle]}>
        {icon}
      </Animated.View>
    </View>
  );
}

/** What a done step achieved, when it says more than «Completado» (mockups «Misión de terapia»). */
function doneDetail(step: MissionStep, mission: Mission): string | null {
  if (step.key === "sessions_count" && mission.sessions?.total) return `${mission.sessions.total} sesiones`;
  if (step.key === "sessions" && mission.sessions) return `${mission.sessions.attended} sesiones`;
  return null;
}

/** The final documents step names what each type usually keeps (templates v1). */
function finalHint(step: MissionStep, mission: Mission): string | null {
  if (step.key !== "final_documents") return null;
  if (mission.type === "therapy") return "Informe final · opcional";
  if (mission.type === "medication") return "Fórmula o comprobante · opcional";
  return null;
}

/** A step started but not done: a partial receipt keeps what is pending (RF-37). */
function pendingDetail(step: MissionStep): string | null {
  if (step.key === "receipt" && step.status === "in_progress") {
    const note = (step.data as { pendingNote?: string } | null | undefined)?.pendingNote;
    return note ? `Recibiste una parte · te falta: ${note}` : "Recibiste una parte";
  }
  if (step.key === "sessions_count" && step.status === "in_progress") return "Total pendiente";
  return null;
}

/**
 * Done, skipped or pending node. Nothing moves on load (§6c); a node the server just confirmed
 * pulses once (scale 1,2) to start the «paso completado» sequence.
 */
function Node({ status, pulse }: { status: MissionStep["status"]; pulse: boolean }) {
  const t = useAppTheme();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  useEffect(() => {
    if (!pulse || reduced) return;
    scale.value = withSequence(
      withTiming(1.2, { duration: PULSE_MS / 2, easing: motionEasing.out }),
      withTiming(1, { duration: PULSE_MS / 2, easing: motionEasing.standard }),
    );
  }, [pulse, reduced, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  if (status === "completed") {
    return (
      <Animated.View style={[styles.node, { backgroundColor: t.status.successGraphic }, animated]}>
        <Check size={15} strokeWidth={3} color={t.text.onSolid} />
      </Animated.View>
    );
  }
  if (status === "skipped" && pulse) {
    return (
      <Animated.View
        style={[styles.node, { backgroundColor: t.surface.muted, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.border.default }, animated]}
      >
        <Minus size={14} strokeWidth={3} color={t.text.muted} />
      </Animated.View>
    );
  }
  if (status === "skipped") {
    return (
      <View style={[styles.node, { backgroundColor: t.surface.muted, borderWidth: 1.5, borderStyle: "dashed", borderColor: t.border.default }]}>
        <Minus size={14} strokeWidth={3} color={t.text.muted} />
      </View>
    );
  }
  return (
    <View style={[styles.node, { backgroundColor: t.surface.bgCard, borderWidth: 1.5, borderColor: t.border.default }]}>
      <FilePlus size={14} strokeWidth={2.2} color={t.text.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 20, paddingHorizontal: spacing[4], borderRadius: 18, borderWidth: 1, borderBottomWidth: 4 },
  row: { flexDirection: "row", alignItems: "stretch", gap: 14 },
  rail: { width: 40, alignItems: "center" },
  // Square ends: two rows meet edge to edge, and rounded caps would leave a notch at the seam.
  seg: { width: 3, flex: 1 },
  node: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  haloBox: { width: 50, height: 50, margin: -5, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", width: 50, height: 50, borderRadius: 25 },
  nodeCurrent: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  currentCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  eyebrow: { fontSize: 11, letterSpacing: 1, fontFamily: nativeFont("heading", 900) },
  currentTitle: { fontSize: 16, lineHeight: 21, fontFamily: nativeFont("heading", 800) },
  title: { fontSize: 15, lineHeight: 20 },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
});
