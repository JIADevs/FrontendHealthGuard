import { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { Backpack, FileText } from "lucide-react-native";
import type { ShareResourceType } from "@helu/api";
import { Chip, Typography, palette, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { shareResourceTypeLabel } from "./shareUtils";

export interface ShareResourceSummaryCardProps {
  resourceType: ShareResourceType;
  title: string;
  subtitle?: string;
  tagLabel?: string;
}

export function ShareResourceSummaryCard({
  resourceType,
  title,
  subtitle,
  tagLabel,
}: ShareResourceSummaryCardProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const isBackpack = resourceType === "backpack";
  const iconColor = isBackpack ? palette.accent.backpack[600] : t.accent.docFg;
  const iconBg = isBackpack ? palette.accent.backpack[50] : t.accent.docBg;

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {isBackpack ? (
          <Backpack size={22} color={iconColor} strokeWidth={2} />
        ) : (
          <FileText size={22} color={iconColor} strokeWidth={2} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <View style={styles.titleWrap}>
            <Typography variant="label" numberOfLines={2}>
              {title}
            </Typography>
          </View>
          <Chip label={shareResourceTypeLabel(resourceType)} color={isBackpack ? "amber" : "default"} />
        </View>
        {subtitle ? (
          <Typography variant="caption" color="secondary" numberOfLines={2}>
            {subtitle}
          </Typography>
        ) : null}
        {tagLabel ? (
          <View style={styles.tagRow}>
            <Chip label={tagLabel} color="default" />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    card: {
      flexDirection: "row",
      gap: spacing[3],
      padding: spacing[4],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing[1],
    },
    titleRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: spacing[2],
    },
    titleWrap: {
      flex: 1,
    },
    tagRow: {
      marginTop: spacing[1],
      flexDirection: "row",
    },
  });
}
