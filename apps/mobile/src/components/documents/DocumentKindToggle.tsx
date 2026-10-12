import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { DocumentKind } from "@helu/api";
import { colors, fontSize, fontWeight, radii, spacing, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";

interface DocumentKindToggleProps {
  kind: DocumentKind;
  onChange: (kind: DocumentKind) => void;
  disabled?: boolean;
}

const OPTIONS: { value: DocumentKind; label: string }[] = [
  { value: "FILE", label: "Archivo" },
  { value: "LINK", label: "Resultado de examen virtual" },
];

export function DocumentKindToggle({ kind, onChange, disabled = false }: DocumentKindToggleProps) {
  const t = useAppTheme();
  const styles = useMemo(() => makeStyles(t), [t]);

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {OPTIONS.map((option) => {
        const selected = kind === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            style={[styles.segment, selected && styles.segmentSelected, disabled && styles.segmentDisabled]}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
          >
            <Text
              style={[styles.segmentText, selected && styles.segmentTextSelected]}
              numberOfLines={2}
            >
              {option.label}
            </Text>
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
      borderWidth: 1,
      borderColor: t.border.medium,
      borderRadius: radii.md,
      overflow: "hidden",
      backgroundColor: t.surface.bg,
    },
    segment: {
      flex: 1,
      paddingVertical: spacing[3],
      paddingHorizontal: spacing[3],
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.surface.bgCard,
    },
    segmentSelected: {
      backgroundColor: t.brand.tint,
    },
    segmentDisabled: {
      opacity: 0.6,
    },
    segmentText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: t.text.secondary,
      textAlign: "center",
    },
    segmentTextSelected: {
      color: t.brand.fg,
      fontWeight: fontWeight.bold,
    },
  });
}
