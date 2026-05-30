import { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import type { ShareStatusFilter } from "@helu/api";
import { spacing, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

const FILTERS: { value: ShareStatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "active", label: "Activos" },
  { value: "expired", label: "Expirados" },
];

export interface SharedHistoryFiltersProps {
  value: ShareStatusFilter;
  onChange: (value: ShareStatusFilter) => void;
}

export function SharedHistoryFilters({ value, onChange }: SharedHistoryFiltersProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.row}>
      {FILTERS.map((filter) => {
        const selected = filter.value === value;
        return (
          <TouchableOpacity
            key={filter.value}
            style={[styles.chip, selected && styles.chipSelected]}
            onPress={() => onChange(filter.value)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected }}
          >
            <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{filter.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    row: {
      flexDirection: "row",
      gap: spacing[2],
      paddingHorizontal: spacing[5],
      paddingBottom: spacing[3],
    },
    chip: {
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[2],
      borderRadius: radii.full,
      borderWidth: 1,
      borderColor: t.border.medium,
      backgroundColor: t.surface.bgCard,
    },
    chipSelected: {
      borderColor: t.brand.tintBorder,
      backgroundColor: t.brand.solid,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
    },
    chipTextSelected: {
      color: "#fff",
    },
  });
}
