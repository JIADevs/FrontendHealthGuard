import { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Text } from "react-native";
import { Backpack as BackpackIcon } from "lucide-react-native";
import type { Backpack } from "@helu/api";
import {
  Typography,
  spacing,
  radii,
  shadows,
  palette,
  formatShortDate,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface BackpackListItemProps {
  backpack: Backpack;
  onPress: () => void;
}

export function BackpackListItem({ backpack, onPress }: BackpackListItemProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  const docLabel =
    backpack.documentCount === 1
      ? "1 documento"
      : `${backpack.documentCount} documentos`;
  const meta = `${docLabel} · ${formatShortDate(backpack.createdAt)}`;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityRole="button"
      accessibilityLabel={`Abrir mochila ${backpack.name}`}
    >
      <View style={styles.iconWrap}>
        <BackpackIcon size={22} color={palette.accent.backpack[600]} strokeWidth={2} />
      </View>

      <View style={styles.content}>
        <Typography variant="body" numberOfLines={1}>
          {backpack.name}
        </Typography>
        <Text style={styles.metaText}>{meta}</Text>
      </View>
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
      marginHorizontal: spacing[5],
      marginBottom: spacing[3],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      ...shadows.sm,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      backgroundColor: palette.accent.backpack[50],
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: spacing[2],
    },
    metaText: {
      fontSize: 12,
      color: t.text.secondary,
    },
  });
}
