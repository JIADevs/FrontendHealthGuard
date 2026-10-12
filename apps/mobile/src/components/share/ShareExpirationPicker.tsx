import { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import type { ShareExpiresIn } from "@helu/api";
import { spacing, radii, fontSize, fontWeight, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import { SHARE_EXPIRATION_OPTIONS } from "./shareUtils";

export interface ShareExpirationPickerProps {
  value: ShareExpiresIn;
  onChange: (value: ShareExpiresIn) => void;
}

export function ShareExpirationPicker({ value, onChange }: ShareExpirationPickerProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>EXPIRACIÓN</Text>
      <View style={styles.row}>
        {SHARE_EXPIRATION_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => onChange(option.value)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityState={{ selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(t: ThemeContextValue) {
  return StyleSheet.create({
    wrap: {
      gap: spacing[2],
    },
    sectionLabel: {
      letterSpacing: 0.6,
      fontWeight: fontWeight.semibold,
      fontSize: fontSize.xs,
      color: t.text.secondary,
    },
    row: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing[2],
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
      backgroundColor: t.brand.tint,
    },
    chipText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.semibold,
      color: t.text.secondary,
    },
    chipTextSelected: {
      color: t.brand.fg,
    },
  });
}
