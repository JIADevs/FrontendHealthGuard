import { useMemo, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Share2, Pencil, Trash2 } from "lucide-react-native";
import { spacing, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentDetailActionsProps {
  onShare: () => void;
  onEdit: () => void;
  onDelete: () => void;
  shareDisabled?: boolean;
  shareLoading?: boolean;
  deleteLoading?: boolean;
}

export function DocumentDetailActions({
  onShare,
  onEdit,
  onDelete,
  shareDisabled = false,
  shareLoading = false,
  deleteLoading = false,
}: DocumentDetailActionsProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.actionRow}>
      <ActionCell
        icon={<Share2 size={20} color={t.text.secondary} />}
        label="Compartir"
        onPress={onShare}
        disabled={shareDisabled || shareLoading}
        loading={shareLoading}
        styles={styles}
      />
      <View style={styles.divider} />
      <ActionCell
        icon={<Pencil size={20} color={t.text.secondary} />}
        label="Editar"
        onPress={onEdit}
        styles={styles}
      />
      <View style={styles.divider} />
      <ActionCell
        icon={<Trash2 size={20} color={t.status.errorFg} />}
        label="Eliminar"
        labelColor={t.status.errorFg}
        onPress={onDelete}
        disabled={deleteLoading}
        styles={styles}
      />
    </View>
  );
}

function ActionCell({
  icon,
  label,
  labelColor,
  onPress,
  disabled,
  loading,
  styles,
}: {
  icon: ReactNode;
  label: string;
  labelColor?: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  styles: ReturnType<typeof makeStyles>;
}) {
  const t = useAppTheme();

  return (
    <TouchableOpacity
      style={styles.actionCell}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading }}
    >
      {loading ? <ActivityIndicator size="small" color={t.text.secondary} /> : icon}
      <Text style={[styles.actionLabel, labelColor ? { color: labelColor } : null]}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    actionRow: {
      flexDirection: "row",
      alignItems: "stretch",
      borderWidth: 1,
      borderColor: t.border.default,
      borderRadius: radii.lg,
      backgroundColor: t.surface.bgCard,
      overflow: "hidden",
    },
    actionCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      paddingVertical: spacing[4],
    },
    actionLabel: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: t.text.secondary,
    },
    divider: {
      width: 1,
      backgroundColor: t.border.default,
    },
  });
}
