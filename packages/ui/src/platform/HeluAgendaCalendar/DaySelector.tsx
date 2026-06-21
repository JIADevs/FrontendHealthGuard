import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import type { ViewRange } from "./useHeluAgendaCalendar";

interface DaySelectorProps {
    viewRange: ViewRange;
    visibleDates: string[];
    onViewRangeChange: (range: ViewRange) => void;
    onPrevious: () => void;
    onNext: () => void;
    onSelectDate: (date: string) => void;
    onGoToday: () => void;
}

const RANGE_OPTIONS: ViewRange[] = [1, 3, 7];

export function DaySelector({
    viewRange,
    visibleDates,
    onViewRangeChange,
    onPrevious,
    onNext,
    onSelectDate,
    onGoToday,
}: DaySelectorProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    return (
        <View style={styles.container}>
            <View style={styles.navRow}>
                <TouchableOpacity onPress={onPrevious} accessibilityLabel="Día anterior">
                    <ChevronLeft size={22} color={t.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={onGoToday}>
                    <Text style={styles.todayBtn}>Hoy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onNext} accessibilityLabel="Día siguiente">
                    <ChevronRight size={22} color={t.text.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.rangeRow}>
                {RANGE_OPTIONS.map((range) => (
                    <TouchableOpacity
                        key={range}
                        style={[styles.rangeChip, viewRange === range && styles.rangeChipActive]}
                        onPress={() => onViewRangeChange(range)}
                    >
                        <Text
                            style={[
                                styles.rangeText,
                                viewRange === range && styles.rangeTextActive,
                            ]}
                        >
                            {range}d
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {viewRange > 1 ? (
                <View style={styles.datesRow}>
                    {visibleDates.map((date) => (
                        <TouchableOpacity key={date} onPress={() => onSelectDate(date)}>
                            <Text style={styles.dateChip}>{date.slice(5)}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            ) : null}
        </View>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        container: {
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderBottomWidth: 1,
            borderBottomColor: t.border.medium,
            backgroundColor: t.surface.bgCard,
            gap: spacing[2],
        },
        navRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        todayBtn: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.brand.fg,
        },
        rangeRow: {
            flexDirection: "row",
            gap: spacing[2],
        },
        rangeChip: {
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[1],
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: t.border.medium,
        },
        rangeChipActive: {
            backgroundColor: t.brand.fg,
            borderColor: t.brand.fg,
        },
        rangeText: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: t.text.secondary,
        },
        rangeTextActive: {
            color: t.surface.bgCard,
        },
        datesRow: {
            flexDirection: "row",
            gap: spacing[2],
        },
        dateChip: {
            fontSize: fontSize.xs,
            color: t.text.secondary,
        },
    });
}
