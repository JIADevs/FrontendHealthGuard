import { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Pencil } from "lucide-react-native";
import { Button, spacing, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface BackpackDetailShareRowProps {
  onShare: () => void;
  onEdit: () => void;
  shareLoading?: boolean;
  shareDisabled?: boolean;
}

export function BackpackDetailShareRow({
  onShare,
  onEdit,
  shareLoading = false,
  shareDisabled = false,
}: BackpackDetailShareRowProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.row}>
      <View style={styles.shareWrap}>
        <Button
          fullWidth
          onPress={onShare}
          disabled={shareDisabled}
          loading={shareLoading}
          accessibilityLabel="Compartir mochila"
        >
          Compartir mochila
        </Button>
      </View>
      <TouchableOpacity
        style={styles.editBtn}
        onPress={onEdit}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Editar mochila"
      >
        <Pencil size={20} color={t.text.secondary} strokeWidth={2.25} />
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing[3],
    },
    shareWrap: {
      flex: 1,
    },
    editBtn: {
      width: 48,
      height: 48,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.default,
      backgroundColor: t.surface.bgCard,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
