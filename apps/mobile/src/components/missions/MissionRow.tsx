import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Pause } from "lucide-react-native";
import type { MissionSummary } from "@helu/api";
import { Chip, nativeFont, spacing, useAppTheme } from "@helu/ui";
import { ProgressRing } from "../home/ProgressRing";
import { MissionTypeIcon } from "./MissionTypeIcon";
import { missionTypeShort, nextLabel, relativeDay, shortDate } from "./missionCopy";

/**
 * Fila de misión de la lista H2 (mockup «Misiones», DU-37): anillo, chip de tipo gris, objetivo y
 * «Sigue: … · fecha». Sin botón: toda la fila abre la misión. Pausadas en gris, completadas con ✓.
 */
export function MissionRow({ mission, onPress }: { mission: MissionSummary; onPress: () => void }) {
  const t = useAppTheme();
  const paused = mission.status === "paused";
  const completed = mission.status === "completed";
  const { completed: done, total } = mission.progress;
  const ratio = total ? done / total : 0;
  const due = mission.nextAction?.dueAt;

  const detail = completed
    ? `Terminada el ${shortDate(mission.completedAt)}`
    : paused
      ? "Pausada · toca para reanudar"
      : `Sigue: ${nextLabel(mission.nextAction?.stepKey)}`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${mission.title}. ${detail}${due && !paused && !completed ? `, ${relativeDay(due)}` : ""}`}
      style={({ pressed }) => [
        styles.card,
        { borderColor: t.border.default, backgroundColor: t.surface.bgCard, opacity: pressed ? 0.85 : 1 },
      ]}
    >
      <ProgressRing size={52} progress={paused ? 0 : ratio}>
        <Text style={[styles.ring, { color: paused ? t.text.muted : t.text.primary }]}>
          {total ? `${done}/${total}` : `${done}`}
        </Text>
      </ProgressRing>
      <View style={styles.copy}>
        <View style={styles.chips}>
          <Chip
            label={missionTypeShort[mission.type]}
            tone="neutral"
            icon={<MissionTypeIcon type={mission.type} size={12} color={t.text.onMuted} />}
          />
          {paused ? <Chip label="Pausada" tone="neutral" icon={<Pause size={12} color={t.text.onMuted} />} /> : null}
        </View>
        <Text style={[styles.title, { color: paused ? t.text.secondary : t.text.primary }]} numberOfLines={2}>
          {mission.title}
        </Text>
        <Text style={[styles.meta, { color: t.text.secondary }]} numberOfLines={2}>
          {detail}
          {due && !paused && !completed ? (
            <Text style={{ color: t.text.primary, fontFamily: nativeFont("body", 700) }}> · {relativeDay(due)}</Text>
          ) : null}
        </Text>
      </View>
      <ChevronRight size={18} strokeWidth={2.4} color={t.text.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 4,
  },
  ring: { fontSize: 14, fontFamily: nativeFont("heading", 900) },
  copy: { flex: 1, gap: 4 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  title: { fontSize: 15, lineHeight: 20, fontFamily: nativeFont("heading", 800) },
  meta: { fontSize: 13, lineHeight: 18, fontFamily: nativeFont("body", 400) },
});
