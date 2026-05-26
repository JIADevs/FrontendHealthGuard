import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Backpack as BackpackIcon } from "lucide-react-native";
import type { Backpack } from "@helu/api";
import {
  Typography,
  spacing,
  radii,
  palette,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { BackpackDetailBadges } from "./BackpackDetailBadges";

interface BackpackDetailHeaderProps {
  backpack: Backpack;
  totalBytes: number;
}

export function BackpackDetailHeader({ backpack, totalBytes }: BackpackDetailHeaderProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <BackpackIcon size={28} color={palette.accent.backpack[600]} strokeWidth={2} />
      </View>

      <View style={styles.textBlock}>
        <Typography variant="h2" numberOfLines={2}>
          {backpack.name}
        </Typography>
        {backpack.description?.trim() ? (
          <Typography variant="bodySm" color="secondary" numberOfLines={2}>
            {backpack.description.trim()}
          </Typography>
        ) : null}
        <BackpackDetailBadges
          documentCount={backpack.documentCount}
          totalBytes={totalBytes}
        />
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing[4],
      padding: spacing[4],
      backgroundColor: t.surface.bgCard,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
    },
    iconWrap: {
      width: 56,
      height: 56,
      borderRadius: radii.lg,
      backgroundColor: palette.accent.backpack[50],
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      flex: 1,
      gap: spacing[2],
    },
  });
}
