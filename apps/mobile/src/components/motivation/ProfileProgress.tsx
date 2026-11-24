import { StyleSheet, Text, View } from "react-native";
import { Route, Star } from "lucide-react-native";
import { Chip, Skeleton, nativeFont, spacing, useAppTheme } from "@helu/ui";
import type { UserProgress } from "@helu/api";
import { Flame } from "../home/Flame";

/** «Nivel 4» chip of the profile card (mockup m6 `profileCard`). Hidden with «Mostrar racha y nivel» off. */
export function LevelChip({ progress }: { progress: UserProgress | undefined }) {
  const t = useAppTheme();
  if (!progress?.showProgress) return null;
  return (
    // The chip aligns itself to the start; the wrapper centers it with the avatar row.
    <View style={{ justifyContent: "center" }}>
      <Chip
        label={`Nivel ${progress.level.number}`}
        tone="warning"
        icon={<Star size={13} strokeWidth={2.4} color={t.motivation.level} fill={t.motivation.level} />}
      />
    </View>
  );
}

/**
 * The three boxes under the profile card: «Racha», «Misiones», «Insignias» (mockup m6). With
 * «Mostrar racha y nivel» off the streak box leaves; missions and badges stay (RF-93).
 */
export function ProfileStats({ progress }: { progress: UserProgress | undefined }) {
  const t = useAppTheme();
  if (!progress) {
    return (
      <View style={styles.row}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} height={74} radius={14} style={{ flex: 1 }} />
        ))}
      </View>
    );
  }
  const days = progress.streak.current;
  const stats = [
    ...(progress.showProgress
      ? [{ key: "streak", icon: <Flame size={18} />, value: days === 1 ? "1 día" : `${days} días`, label: "Racha" }]
      : []),
    {
      key: "missions",
      icon: <Route size={17} strokeWidth={2.4} color={t.status.successGraphic} />,
      value: String(progress.missionsCompleted),
      label: "Misiones",
    },
    {
      key: "badges",
      icon: <Star size={17} strokeWidth={2.4} color={t.motivation.level} fill={t.motivation.level} />,
      value: `${progress.badgesEarned} de ${progress.badgesTotal}`,
      label: "Insignias",
    },
  ];
  return (
    <View style={styles.row}>
      {stats.map((s) => (
        <View
          key={s.key}
          style={[styles.box, { backgroundColor: t.surface.muted }]}
          accessible
          accessibilityLabel={`${s.label}: ${s.value}`}
        >
          {s.icon}
          <Text style={[styles.value, { color: t.text.primary }]}>{s.value}</Text>
          <Text style={[styles.label, { color: t.text.secondary }]}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 10 },
  box: { flex: 1, alignItems: "center", gap: 4, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4 },
  value: { fontSize: 15, fontFamily: nativeFont("heading", 900) },
  label: { fontSize: 13, fontFamily: nativeFont("body", 400) },
});
