import { useMemo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { spacing, nativeFont, useAppTheme, useConfirmBounce } from "@helu/ui";
import type { ThemeContextValue } from "@helu/ui";
import type { MoodEnum } from "@helu/api";
import { MOOD_CONFIG, MOOD_ORDER } from "./moodConfig";
import { MoodFace } from "./MoodFace";

interface MoodPickerProps {
    value: MoodEnum | null;
    onChange: (mood: MoodEnum) => void;
}

/**
 * Five drawn faces, Muy mal → Excelente, each with its label (mockup «Check-in de hoy»).
 * The chosen one gets the brand tint and border and a short confirm bounce (movimiento §5).
 */
export function MoodPicker({ value, onChange }: MoodPickerProps) {
    return (
        <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="¿Cómo te sientes hoy?">
            {MOOD_ORDER.map((mood) => (
                <MoodOption key={mood} mood={mood} selected={value === mood} onPress={() => onChange(mood)} />
            ))}
        </View>
    );
}

function MoodOption({ mood, selected, onPress }: { mood: MoodEnum; selected: boolean; onPress: () => void }) {
    const t = useAppTheme();
    const themed = useMemo(() => makeThemed(t), [t]);
    const bounce = useConfirmBounce(selected);
    const { label } = MOOD_CONFIG[mood];

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ selected }}
            style={styles.pressable}
        >
            <Animated.View style={[styles.option, selected ? themed.optionSelected : themed.optionIdle, bounce]}>
                <MoodFace mood={mood} size={44} />
                <Text style={[styles.label, { color: selected ? t.brand.text : t.text.secondary }]} numberOfLines={1}>
                    {label}
                </Text>
            </Animated.View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: spacing[1],
    },
    pressable: { flex: 1 },
    option: {
        alignItems: "center",
        gap: spacing[1],
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 2,
    },
    // Mockup: Nunito 800 11
    label: { fontSize: 11, fontFamily: nativeFont("heading", 800) },
});

function makeThemed(t: ThemeContextValue) {
    return StyleSheet.create({
        optionIdle: { borderColor: "transparent" },
        optionSelected: { backgroundColor: t.brand.tint, borderColor: t.brand.solid },
    });
}
