import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  spacing,
  radii,
  fontSize,
  fontWeight,
  palette,
  formatFileSize,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface BackpackDetailBadgesProps {
  documentCount: number;
  totalBytes: number;
}

export function BackpackDetailBadges({ documentCount, totalBytes }: BackpackDetailBadgesProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const docLabel =
    documentCount === 1 ? "1 documento" : `${documentCount} documentos`;

  return (
    <View style={styles.row}>
      <View style={styles.docBadge}>
        <Text style={styles.docBadgeText}>{docLabel}</Text>
      </View>
      <View style={styles.sizeBadge}>
        <Text style={styles.sizeBadgeText}>{formatFileSize(totalBytes)}</Text>
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
      marginTop: spacing[1],
    },
    docBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
      backgroundColor: palette.accent.backpack[50],
    },
    docBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: palette.accent.backpack[700],
    },
    sizeBadge: {
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
      borderRadius: radii.full,
      backgroundColor: t.brand.tint,
    },
    sizeBadgeText: {
      fontSize: fontSize.xs,
      fontWeight: fontWeight.semibold,
      color: t.brand.tintText,
    },
  });
}
