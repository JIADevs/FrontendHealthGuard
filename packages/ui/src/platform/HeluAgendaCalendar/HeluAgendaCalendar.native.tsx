import { View, Text, StyleSheet } from "react-native";
import { Spinner } from "../../primitives/Spinner/Spinner.native";
import { fontSize } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import { DaySelector } from "./DaySelector";
import { CalendarGrid } from "./CalendarGrid";
import { AgendaCalendarFAB } from "./AgendaCalendarFAB";
import { useHeluAgendaCalendar } from "./useHeluAgendaCalendar";

export interface HeluAgendaCalendarProps {
    onNewAppointment: () => void;
    initialDate?: string;
}

export function HeluAgendaCalendar({ onNewAppointment, initialDate }: HeluAgendaCalendarProps) {
    const calendar = useHeluAgendaCalendar(initialDate);
    const t = useAppTheme();

    return (
        <View style={styles.root}>
            <DaySelector
                headerLabel={calendar.headerLabel}
                viewMode={calendar.viewMode}
                onViewModeChange={calendar.setViewMode}
                onPrevious={calendar.goPrevious}
                onNext={calendar.goNext}
                onGoToday={calendar.goToToday}
            />

            {calendar.isLoading ? (
                <View style={styles.center}>
                    <Spinner size="lg" />
                </View>
            ) : calendar.isError ? (
                <View style={styles.center}>
                    <Text style={[styles.errorText, { color: t.status.errorFg }]}>
                        No se pudieron cargar los eventos del calendario.
                    </Text>
                </View>
            ) : (
                <CalendarGrid
                    viewMode={calendar.viewMode}
                    events={calendar.events}
                    dates={calendar.gridDates}
                    selectedDate={calendar.selectedDate}
                    initialScrollDate={calendar.initialScrollDate}
                    onSelectDate={calendar.selectDate}
                    onHorizontalScroll={calendar.handleHorizontalScroll}
                    scrollTarget={calendar.scrollTarget}
                    onScrollTargetHandled={calendar.clearScrollTarget}
                />
            )}

            <AgendaCalendarFAB onPress={onNewAppointment} />
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 24,
    },
    errorText: {
        fontSize: fontSize.sm,
        textAlign: "center",
    },
});
