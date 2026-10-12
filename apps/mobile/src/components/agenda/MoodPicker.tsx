import { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { spacing, fontSize, fontWeight, radii, useAppTheme } from "@helu/ui";
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
                const { label, emoji, circleBg } = MOOD_CONFIG[mood];
                const isSelected = value === mood;
                return (
                    <TouchableOpacity
                        key={mood}
                        style={styles.option}
                        onPress={() => onChange(mood)}
                        accessibilityRole="radio"
                        accessibilityLabel={isSelected ? `${label}, seleccionado` : `${label}, no seleccionado`}
                        accessibilityState={{ selected: isSelected }}
                    >
                        <View
                            style={[
                                styles.emojiCircle,
                                { backgroundColor: circleBg },
                                isSelected && styles.emojiCircleSelected,
                            ]}
                        >
                            <Text style={styles.emoji}>{emoji}</Text>
                        </View>
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
            justifyContent: "space-between",
            gap: spacing[3],
        },
        option: {
            alignItems: "center",
            gap: spacing[1],
            minWidth: 56,
        },
        emojiCircle: {
            width: 44,
            height: 44,
            borderRadius: radii.full,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 2,
            borderColor: "transparent",
        },
        emojiCircleSelected: {
            borderColor: t.brand.fg,
        },
        emoji: {
            fontSize: fontSize.xl,
        },
        label: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
            color: t.text.secondary,
            textAlign: "center",
        },
        labelSelected: {
            color: t.brand.fg,
            fontWeight: fontWeight.semibold,
        },
    });
}
