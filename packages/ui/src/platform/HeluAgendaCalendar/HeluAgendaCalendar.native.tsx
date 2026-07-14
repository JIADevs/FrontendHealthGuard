import { View, Text, StyleSheet } from "react-native";
import { Spinner } from "../../primitives/Spinner/Spinner.native";
import { fontSize } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import { DaySelector } from "./DaySelector";
import { CalendarGrid } from "./CalendarGrid";
import { MonthGridView } from "./MonthGridView";
import { useHeluAgendaCalendar } from "./useHeluAgendaCalendar";
import type { AgendaEvent } from "./mapCalendarApiToEvents";

export interface HeluAgendaCalendarProps {
    initialDate?: string;
    onMedicationPress?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
    onAppointmentPress?: (event: Extract<AgendaEvent, { type: "appointment" | "exam" }>) => void;
    onCheckInPress?: (event: Extract<AgendaEvent, { type: "checkin" }>) => void;
}

export function HeluAgendaCalendar({
    initialDate,
    onMedicationPress,
    onAppointmentPress,
    onCheckInPress,
}: HeluAgendaCalendarProps) {
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
            ) : calendar.viewMode === "month" ? (
                <MonthGridView
                    monthAnchor={calendar.selectedDate}
                    selectedDate={calendar.selectedDate}
                    dayActivity={calendar.dayActivity}
                    onSelectDate={calendar.selectDate}
                />
            ) : (
                <CalendarGrid
                    viewMode={calendar.viewMode}
                    events={calendar.events}
                    dates={calendar.gridDates}
                    selectedDate={calendar.selectedDate}
                    onSelectDate={calendar.selectDate}
                    onMedicationPress={onMedicationPress}
                    onAppointmentPress={onAppointmentPress}
                    onCheckInPress={onCheckInPress}
                />
            )}
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
