import { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Backpack, ChevronRight, FileText } from "lucide-react-native";
import type { ShareLink } from "@helu/api";
import { Chip, Typography, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { formatShareStartedAt } from "./shareUtils";

export interface SharedHistoryListItemProps {
  item: ShareLink;
  onPress: () => void;
}

export function SharedHistoryListItem({ item, onPress }: SharedHistoryListItemProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);
  const isBackpack = item.resourceType === "backpack";
  const iconColor = isBackpack ? t.accent.backpackFg : t.accent.docFg;
  const iconBg = isBackpack ? t.accent.backpackBg : t.accent.docBg;
  const statusLabel = item.status === "active" ? "Activo" : "Expirado";
  const statusChipColor = item.status === "active" ? "green" : "default";
  const startedLabel = formatShareStartedAt(item.createdAt);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${statusLabel}, ${startedLabel}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        {isBackpack ? (
          <Backpack size={20} color={iconColor} strokeWidth={2} />
        ) : (
          <FileText size={20} color={iconColor} strokeWidth={2} />
        )}
      </View>
      <View style={styles.body}>
        <Typography variant="body" numberOfLines={1}>
          {item.title}
        </Typography>
        <View style={styles.statusRow}>
          <Chip label={statusLabel} color={statusChipColor} />
          <Typography variant="caption" color="secondary" numberOfLines={1}>
            {startedLabel}
          </Typography>
        </View>
      </View>
      <ChevronRight size={18} color={t.text.secondary} />
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
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radii.md,
      alignItems: "center",
      justifyContent: "center",
    },
    body: {
      flex: 1,
      minWidth: 0,
      justifyContent: "center",
      gap: spacing[2],
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[2],
    },
  });
}
