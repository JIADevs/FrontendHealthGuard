import { StyleSheet, Text, View } from "react-native";
import { Chip, nativeFont, radii, spacing, useAppTheme } from "@helu/ui";
import type { UserBadge } from "@helu/api";
import { Medal } from "./Medal";
import { badgeCopy } from "./badgeCatalog";

/**
 * «Insignias» (mockup m6 «Perfil», RF-92): the 8 badges in a 4-column grid with «n de 8». Locked
 * ones in gray with a padlock (MASTER §7). Badges are never hidden by «Mostrar racha y nivel».
 */
export function BadgesCard({ badges, earned, total }: { badges: UserBadge[]; earned: number; total: number }) {
  const t = useAppTheme();
  return (
    <View style={[styles.card, { backgroundColor: t.surface.bgCard, borderColor: t.border.default }]}>
      <View style={styles.head}>
        <Text style={[styles.title, { color: t.text.primary }]} accessibilityRole="header">
          Insignias
        </Text>
        <Chip label={`${earned} de ${total}`} tone="neutral" />
      </View>
      <View style={styles.grid}>
        {badges.map((badge) => {
          const copy = badgeCopy(badge.code);
          if (!copy) return null;
          return (
            <View
              key={badge.code}
              style={styles.cell}
              accessible
              accessibilityLabel={`${copy.label}, ${badge.earned ? "ganada" : "bloqueada"}`}
            >
              <Medal code={badge.code} earned={badge.earned} />
              <Text style={[styles.label, { color: badge.earned ? t.text.primary : t.text.muted }]} numberOfLines={2}>
                {copy.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.card, borderWidth: 1, borderBottomWidth: 4, padding: spacing[4], gap: spacing[4] },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 17, fontFamily: nativeFont("heading", 800) },
  grid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14 },
  cell: { width: "25%", alignItems: "center", gap: 6, paddingHorizontal: 3 },
  label: { fontSize: 12, lineHeight: 15, textAlign: "center", fontFamily: nativeFont("heading", 800) },
});
