import { View, StyleSheet } from "react-native";
import { Spinner } from "../../primitives/Spinner/Spinner.native";
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

    return (
        <View style={styles.root}>
            <DaySelector
                viewRange={calendar.viewRange}
                visibleDates={calendar.visibleDates}
                onViewRangeChange={calendar.setViewRange}
                onPrevious={calendar.goPrevious}
                onNext={calendar.goNext}
                onSelectDate={calendar.selectDate}
                onGoToday={calendar.goToToday}
            />

            {calendar.isLoading ? (
                <View style={styles.center}>
                    <Spinner size="lg" />
                </View>
            ) : (
                <CalendarGrid events={calendar.events} dates={calendar.visibleDates} />
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
    },
});
