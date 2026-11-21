import { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import {
    buildMonthGrid,
    monthWeekdayLabels,
    type MonthGridCell,
} from "./calendarDateUtils";
import {
    buildDayActivityMap,
    emptyDayActivity,
    type DayActivityIndicators,
} from "./dayActivityIndicators";

interface MonthGridViewProps {
    monthAnchor: string;
    selectedDate: string;
    dayActivity: Map<string, DayActivityIndicators>;
    onSelectDate: (date: string) => void;
}

export function MonthGridView({
    monthAnchor,
    selectedDate,
    dayActivity,
    onSelectDate,
}: MonthGridViewProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const cells = useMemo(() => {
        const grid = buildMonthGrid(monthAnchor);
        return grid.map((cell) =>
            cell.kind === "day"
                ? { ...cell, isSelected: cell.date === selectedDate }
                : cell,
        );
    }, [monthAnchor, selectedDate]);

    const weekdays = monthWeekdayLabels();

    return (
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
        >
            <View style={styles.weekdayRow}>
                {weekdays.map((label) => (
                    <Text key={label} style={styles.weekdayLabel}>
                        {label}
                    </Text>
                ))}
            </View>

            <View style={styles.grid}>
                {cells.map((cell, index) => (
                    <MonthCell
                        key={cell.kind === "day" ? cell.date : `empty-${index}`}
                        cell={cell}
                        activity={
                            cell.kind === "day"
                                ? dayActivity.get(cell.date) ?? emptyDayActivity()
                                : emptyDayActivity()
                        }
                        onSelectDate={onSelectDate}
                        styles={styles}
                        theme={t}
                    />
                ))}
            </View>

        </ScrollView>
    );
}

function MonthCell({
    cell,
    activity,
    onSelectDate,
    styles,
    theme,
}: {
    cell: MonthGridCell;
    activity: DayActivityIndicators;
    onSelectDate: (date: string) => void;
    styles: ReturnType<typeof makeStyles>;
    theme: ThemeContextValue;
}) {
    if (cell.kind === "empty") {
        return <View style={styles.cell} />;
    }

    const { date, dayNumber, isToday, isSelected } = cell;

    return (
        <TouchableOpacity
            style={[
                styles.cell,
                isSelected && styles.cellSelected,
                isToday && !isSelected && styles.cellToday,
            ]}
            onPress={() => onSelectDate(date)}
            accessibilityRole="button"
            accessibilityLabel={`${dayNumber}${isToday ? ", hoy" : ""}${isSelected ? ", seleccionado" : ""}`}
        >
            <Text
                style={[
                    styles.dayNumber,
                    isSelected && styles.dayNumberSelected,
                    isToday && !isSelected && styles.dayNumberToday,
                ]}
            >
                {dayNumber}
            </Text>

            <View style={styles.dotsRow}>
                {activity.hasAppointments ? (
                    <View style={[styles.dot, { backgroundColor: theme.accent.calFg }]} />
                ) : null}
                {activity.hasMedications ? (
                    <View style={[styles.dot, { backgroundColor: theme.accent.medFg }]} />
                ) : null}
                {activity.hasCheckIn ? (
                    <View style={[styles.dot, { backgroundColor: theme.accent.wellbeingFg }]} />
                ) : null}
                {activity.hasTasks ? (
                    <View style={[styles.dot, { backgroundColor: theme.accent.missionFg }]} />
                ) : null}
            </View>
        </TouchableOpacity>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        scroll: {
            flex: 1,
        },
        content: {
            paddingHorizontal: spacing[3],
            paddingBottom: spacing[6],
        },
        weekdayRow: {
            flexDirection: "row",
            marginBottom: spacing[2],
        },
        weekdayLabel: {
            flex: 1,
            textAlign: "center",
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: t.text.secondary,
        },
        grid: {
            flexDirection: "row",
            flexWrap: "wrap",
        },
        cell: {
            width: `${100 / 7}%`,
            aspectRatio: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: spacing[1],
            gap: spacing[1],
        },
        cellSelected: {
            backgroundColor: t.brand.fg,
            borderRadius: radii.md,
        },
        cellToday: {
            borderWidth: 1,
            borderColor: t.brand.fg,
            borderRadius: radii.md,
        },
        dayNumber: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.medium,
            color: t.text.primary,
        },
        dayNumberSelected: {
            color: t.surface.bgCard,
            fontWeight: fontWeight.semibold,
        },
        dayNumberToday: {
            color: t.brand.fg,
            fontWeight: fontWeight.semibold,
        },
        dotsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            minHeight: 6,
        },
        dot: {
            width: 5,
            height: 5,
            borderRadius: radii.full,
        },
        legend: {
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: spacing[4],
            marginTop: spacing[5],
            paddingTop: spacing[4],
            borderTopWidth: 1,
            borderTopColor: t.border.light,
        },
        legendItem: {
            flexDirection: "row",
            alignItems: "center",
            gap: spacing[1],
        },
        legendDot: {
            width: 6,
            height: 6,
            borderRadius: radii.full,
        },
        legendLabel: {
            fontSize: fontSize.xs,
            color: t.text.secondary,
        },
    });
}
