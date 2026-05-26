import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { colors, radii, fontSize, fontWeight, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { useMemo } from "react";

interface DocumentsFilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function DocumentsFilterChip({ label, selected, onPress }: DocumentsFilterChipProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <TouchableOpacity
      style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Filtrar por ${label}`}
    >
      <Text style={[styles.text, selected ? styles.textSelected : styles.textIdle]}>{label}</Text>
    </TouchableOpacity>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
    },
    chipSelected: {
      backgroundColor: t.brand.solid,
      borderColor: t.brand.solid,
    },
    chipIdle: {
      backgroundColor: t.surface.bgCard,
      borderColor: t.border.default,
    },
    text: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
    },
    textSelected: {
      color: colors.white,
    },
    textIdle: {
      color: t.text.primary,
    },
  });
}
