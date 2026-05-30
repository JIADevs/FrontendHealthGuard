import { useMemo } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Typography, spacing, radii, fontWeight, timeAgo, useAppTheme, fontSize } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

export interface SharedActivityCardsProps {
  viewCount: number;
  lastViewedAt: string | null;
}

export function SharedActivityCards({ viewCount, lastViewedAt }: SharedActivityCardsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>ACTIVIDAD</Text>
      <View style={styles.row}>
        <View style={styles.card}>
          <Typography variant="h3">{viewCount}</Typography>
          <Typography variant="caption" color="secondary">
            Visualizaciones
          </Typography>
        </View>
        <View style={styles.card}>
          <Typography variant="h3" numberOfLines={1}>
            {lastViewedAt ? timeAgo(lastViewedAt) : "—"}
          </Typography>
          <Typography variant="caption" color="secondary">
            Último acceso
          </Typography>
        </View>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: {
      gap: spacing[2],
    },
    sectionLabel: {
      letterSpacing: 0.6,
      fontWeight: fontWeight.semibold,
      fontSize: fontSize.xs,
      color: t.text.secondary,
    },
    row: {
      flexDirection: "row",
      gap: spacing[3],
    },
    card: {
      flex: 1,
      padding: spacing[4],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
      gap: spacing[1],
    },
  });
}
