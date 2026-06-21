import { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronLeft, ChevronRight } from "lucide-react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import type { CalendarViewMode } from "./useHeluAgendaCalendar";

interface DaySelectorProps {
    headerLabel: string;
    viewMode: CalendarViewMode;
    onViewModeChange: (mode: CalendarViewMode) => void;
    onPrevious: () => void;
    onNext: () => void;
    onGoToday: () => void;
}

const VIEW_OPTIONS: { mode: CalendarViewMode; label: string }[] = [
    { mode: "day", label: "Día" },
    { mode: "threeDay", label: "3 días" },
    { mode: "week", label: "Semana" },
];

function navAccessibilityLabel(viewMode: CalendarViewMode, direction: "previous" | "next"): string {
    const unit =
        viewMode === "day" ? "día" : viewMode === "threeDay" ? "3 días" : "semana";
    return direction === "previous" ? `${unit} anterior` : `${unit} siguiente`;
}

export function DaySelector({
    headerLabel,
    viewMode,
    onViewModeChange,
    onPrevious,
    onNext,
    onGoToday,
}: DaySelectorProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    return (
        <View style={styles.container}>
            <View style={styles.navRow}>
                <TouchableOpacity
                    onPress={onPrevious}
                    accessibilityLabel={navAccessibilityLabel(viewMode, "previous")}
                >
                    <ChevronLeft size={22} color={t.text.primary} />
                </TouchableOpacity>

                <Text style={styles.headerLabel}>{capitalize(headerLabel)}</Text>

                <TouchableOpacity
                    onPress={onNext}
                    accessibilityLabel={navAccessibilityLabel(viewMode, "next")}
                >
                    <ChevronRight size={22} color={t.text.primary} />
                </TouchableOpacity>
            </View>

            <View style={styles.controlsRow}>
                <View style={styles.modeRow}>
                    {VIEW_OPTIONS.map(({ mode, label }) => (
                        <TouchableOpacity
                            key={mode}
                            style={[styles.modeChip, viewMode === mode && styles.modeChipActive]}
                            onPress={() => onViewModeChange(mode)}
                            accessibilityLabel={`Vista ${label}`}
                        >
                            <Text
                                style={[
                                    styles.modeText,
                                    viewMode === mode && styles.modeTextActive,
                                ]}
                            >
                                {label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity onPress={onGoToday}>
                    <Text style={styles.todayBtn}>Hoy</Text>
                </TouchableOpacity>
            </View>
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
            gap: spacing[2],
        },
        navRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        headerLabel: {
            flex: 1,
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
            textAlign: "center",
            marginHorizontal: spacing[2],
        },
        controlsRow: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
        },
        modeRow: {
            flexDirection: "row",
            gap: spacing[1],
            flexShrink: 1,
        },
        modeChip: {
            paddingHorizontal: spacing[2],
            paddingVertical: spacing[1],
            borderRadius: radii.full,
            borderWidth: 1,
            borderColor: t.border.medium,
        },
        modeChipActive: {
            backgroundColor: t.brand.fg,
            borderColor: t.brand.fg,
        },
        modeText: {
            fontSize: fontSize.xs,
            fontWeight: fontWeight.semibold,
            color: t.text.secondary,
        },
        modeTextActive: {
            color: t.surface.bgCard,
        },
        todayBtn: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.brand.fg,
        },
    });
}
