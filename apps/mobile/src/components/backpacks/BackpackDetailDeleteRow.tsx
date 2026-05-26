import { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { Trash2 } from "lucide-react-native";
import {
  spacing,
  radii,
  fontSize,
  fontWeight,
  useAppTheme,
} from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface BackpackDetailDeleteRowProps {
  onPress: () => void;
  loading?: boolean;
}

export function BackpackDetailDeleteRow({ onPress, loading = false }: BackpackDetailDeleteRowProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="Eliminar mochila"
    >
      <Trash2 size={20} color={t.status.errorFg} strokeWidth={2.25} />
      <Text style={styles.label}>Eliminar mochila</Text>
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing[2],
      paddingVertical: spacing[4],
      marginTop: spacing[2],
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: t.border.light,
      backgroundColor: t.surface.bgCard,
      opacity: 1,
    },
    label: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.status.errorFg,
    },
  });
}
