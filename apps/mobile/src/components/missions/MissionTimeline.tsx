import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { LinearTransition, ZoomIn } from "react-native-reanimated";
import { Check, ChevronRight, FilePlus, FileText, Heart, Minus } from "lucide-react-native";
import type { Mission, MissionStep } from "@helu/api";
import { motion, nativeFont, spacing, useAppTheme } from "@helu/ui";
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
}: {
  mission: Mission;
  onOpenStep: (step: MissionStep) => void;
}) {
  const t = useAppTheme();
  const steps = mission.steps.filter((s) => s.applies);
  const currentKey = mission.status === "active" ? mission.nextAction?.stepKey : undefined;
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
              {i > 0 ? <Connector color={ok} /> : null}
              <View style={styles.row}>
                <View style={[styles.rail, { gap: 6 }]}>
                  <View style={[styles.seg, { backgroundColor: i > 0 ? ok : "transparent" }]} />
                  {/* 40 px node with a 5 px halo (kit: box-shadow 0 0 0 5px brand-tint), centered on the card. */}
                  <View style={[styles.halo, { backgroundColor: t.brand.tint }]}>
                    <View style={[styles.nodeCurrent, { backgroundColor: t.brand.solid }]}>
                      {step.key === "sessions" ? (
                        <Heart size={19} strokeWidth={2.2} color={t.text.onSolid} />
                      ) : (
                        <FileText size={19} strokeWidth={2.2} color={t.text.onSolid} />
                      )}
                    </View>
                  </View>
                  <View style={[styles.seg, { backgroundColor: last ? "transparent" : line }]} />
                </View>
                <Pressable
                  onPress={() => onOpenStep(step)}
                  accessibilityRole="button"
                  accessibilityLabel={`Paso ${i + 1} de ${total}, ahora: ${stepTitle(mission, step.key)}. Toca para continuar`}
                  style={({ pressed }) => [
                    styles.currentCard,
                    { backgroundColor: t.brand.tint, borderColor: t.brand.tintBorder, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.eyebrow, { color: t.brand.text }]}>
                      PASO {i + 1} DE {total} · AHORA
                    </Text>
                    <Text style={[styles.currentTitle, { color: t.text.primary }]}>
                      {step.key === "sessions" ? sessionsTitle(mission.sessions) : stepTitle(mission, step.key)}
                    </Text>
                    {/* The sessions cycle says where it stands: «Tu quinta sesión es el jueves» (RF-43). */}
                    <Text style={[styles.meta, { color: t.brand.text }]}>
                      {step.key === "sessions"
                        ? sessionMessage(mission.sessions)
                        : pendingDetail(step) ?? "Toca para continuar"}
                    </Text>
                  </View>
                  <ChevronRight size={20} strokeWidth={2.6} color={t.brand.solid} />
                </Pressable>
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
              <Node status={step.status} last={last} />
              {last ? null : <View style={[styles.seg, { minHeight: nextIsCurrent ? 6 : 28, backgroundColor: below }]} />}
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
function Connector({ color }: { color: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={[styles.seg, { height: 20, flex: 0, backgroundColor: color }]} />
      </View>
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

function Node({ status }: { status: MissionStep["status"]; last: boolean }) {
  const t = useAppTheme();
  if (status === "completed") {
    return (
      <Animated.View entering={ZoomIn.duration(motion.base)} style={[styles.node, { backgroundColor: t.status.successGraphic }]}>
        <Check size={15} strokeWidth={3} color={t.text.onSolid} />
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
  halo: { width: 50, height: 50, borderRadius: 25, margin: -5, alignItems: "center", justifyContent: "center" },
  nodeCurrent: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  currentCard: {
    flex: 1,
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
