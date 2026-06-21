import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { spacing, fontSize, fontWeight } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";

interface DaySelectorProps {
    monthLabel: string;
    onPrevious: () => void;
    onNext: () => void;
    onGoToday: () => void;
}

export function DaySelector({ monthLabel, onPrevious, onNext, onGoToday }: DaySelectorProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    return (
        <View style={styles.container}>
            <View style={styles.navRow}>
                <TouchableOpacity onPress={onPrevious} accessibilityLabel="Semana anterior">
                    <ChevronLeft size={22} color={t.text.primary} />
                </TouchableOpacity>

                <Text style={styles.monthLabel}>{capitalize(monthLabel)}</Text>

                <TouchableOpacity onPress={onNext} accessibilityLabel="Semana siguiente">
                    <ChevronRight size={22} color={t.text.primary} />
                </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={onGoToday} style={styles.todayRow}>
                <Text style={styles.todayBtn}>Hoy</Text>
            </TouchableOpacity>
        </View>
    );
}

function capitalize(value: string): string {
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        container: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderBottomWidth: 1,
            borderBottomColor: t.border.medium,
            backgroundColor: t.surface.bgCard,
            gap: spacing[1],
        },
        navRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        monthLabel: {
            fontSize: fontSize.base,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
        },
        todayRow: {
            alignSelf: "center",
        },
        todayBtn: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.brand.fg,
        },
    });
}
