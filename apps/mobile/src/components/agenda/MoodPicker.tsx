import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { palette, spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { MoodEnum } from "@helu/api";
import { MOOD_CONFIG, MOOD_ORDER } from "./moodConfig";

interface MoodPickerProps {
    value: MoodEnum | null;
    onChange: (mood: MoodEnum) => void;
}

export function MoodPicker({ value, onChange }: MoodPickerProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    return (
        <View style={styles.row} accessibilityRole="radiogroup">
            {MOOD_ORDER.map((mood) => {
                const { label, emoji } = MOOD_CONFIG[mood];
                const isSelected = value === mood;
                return (
                    <TouchableOpacity
                        key={mood}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => onChange(mood)}
                        accessibilityRole="radio"
                        accessibilityLabel={isSelected ? `${label}, seleccionado` : `${label}, no seleccionado`}
                        accessibilityState={{ selected: isSelected }}
                    >
                        <Text style={styles.emoji}>{emoji}</Text>
                        <Text style={[styles.label, isSelected && styles.labelSelected]}>
                            {label}
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
            flexWrap: "wrap",
            gap: spacing[2],
        },
        chip: {
            flexDirection: "column",
            alignItems: "center",
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: t.border.medium,
            backgroundColor: t.surface.bg,
            minWidth: 60,
        },
        chipSelected: {
            borderColor: t.accent.notifFg,
            backgroundColor: t.accent.notifBg,
        },
        emoji: {
            fontSize: fontSize.xl,
            marginBottom: spacing[1],
        },
        label: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
            color: t.text.secondary,
            textAlign: "center",
        },
        labelSelected: {
            color: t.accent.notifFg,
            fontWeight: fontWeight.semibold,
        },
    });
}
