import { useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    useWindowDimensions,
} from "react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import type { AgendaEvent } from "./mapCalendarApiToEvents";
import { formatDayShort, localDateKeyFromISO } from "./calendarDateUtils";
import type { CalendarViewMode } from "./useHeluAgendaCalendar";
import { EventBlock } from "./EventBlock";
import { CALENDAR_HOUR_HEIGHT, layoutDayEvents } from "./eventDayLayout";

const HOUR_HEIGHT = CALENDAR_HOUR_HEIGHT;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const TIME_COLUMN_WIDTH = 44;
const GRID_HORIZONTAL_PADDING = spacing[3];

interface CalendarGridProps {
    viewMode: CalendarViewMode;
    events: AgendaEvent[];
    dates: string[];
    selectedDate: string;
    onSelectDate: (date: string) => void;
    onMedicationPress?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
    onAppointmentPress?: (event: Extract<AgendaEvent, { type: "appointment" | "exam" }>) => void;
    onCheckInPress?: (event: Extract<AgendaEvent, { type: "checkin" }>) => void;
}

export function CalendarGrid({
    viewMode,
    events,
    dates,
    selectedDate,
    onSelectDate,
    onMedicationPress,
    onAppointmentPress,
    onCheckInPress,
}: CalendarGridProps) {
    const t = useAppTheme();
    const { width: screenWidth } = useWindowDimensions();
    const isCompact = viewMode !== "day";
    const columnWidth =
        (screenWidth - TIME_COLUMN_WIDTH - GRID_HORIZONTAL_PADDING * 2) / dates.length;
    const styles = useMemo(
        () => makeStyles(t, columnWidth, isCompact),
        [t, columnWidth, isCompact],
    );

    const eventsByDate = useMemo(() => {
        const map = new Map<string, AgendaEvent[]>();
        for (const date of dates) map.set(date, []);
        for (const event of events) {
            const key =
                event.type === "checkin"
                    ? localDateKeyFromISO(event.data.recordedAt)
                    : event.type === "medication"
                      ? event.dayKey
                      : (event.data.date?.slice(0, 10) ?? "");
            if (map.has(key)) map.get(key)!.push(event);
        }
        return map;
    }, [events, dates]);

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
            <View style={styles.gridRow}>
                <View style={styles.timeColumn}>
                    <View style={styles.timeHeaderSpacer} />
                    {HOURS.map((hour) => (
                        <View key={hour} style={styles.hourCell}>
                            <Text style={styles.hourLabel}>
                                {`${String(hour).padStart(2, "0")}:00`}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.columnsRow}>
                    {dates.map((date) => (
                        <DayColumn
                            key={date}
                            date={date}
                            selectedDate={selectedDate}
                            events={eventsByDate.get(date) ?? []}
                            compact={isCompact}
                            styles={styles}
                            onSelectDate={onSelectDate}
                            onMedicationPress={onMedicationPress}
                            onAppointmentPress={onAppointmentPress}
                            onCheckInPress={onCheckInPress}
                        />
                    ))}
                </View>
            </View>
        </ScrollView>
    );
}

interface DayColumnProps {
    date: string;
    selectedDate: string;
    events: AgendaEvent[];
    compact: boolean;
    styles: ReturnType<typeof makeStyles>;
    onSelectDate: (date: string) => void;
    onMedicationPress?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
    onAppointmentPress?: (event: Extract<AgendaEvent, { type: "appointment" | "exam" }>) => void;
    onCheckInPress?: (event: Extract<AgendaEvent, { type: "checkin" }>) => void;
}

function DayColumn({
    date,
    selectedDate,
    events,
    compact,
    styles,
    onSelectDate,
    onMedicationPress,
    onAppointmentPress,
    onCheckInPress,
}: DayColumnProps) {
    const { weekday, day, isToday } = formatDayShort(date);
    const isSelected = date === selectedDate;

    const eventLayouts = useMemo(
        () => layoutDayEvents(events, HOUR_HEIGHT, compact),
        [events, compact],
    );

    return (
        <View style={styles.dayColumn}>
            <TouchableOpacity
                style={[
                    styles.dayHeader,
                    isSelected && styles.dayHeaderSelected,
                    isToday && !isSelected && styles.dayHeaderToday,
                ]}
                onPress={() => onSelectDate(date)}
                accessibilityLabel={`${weekday} ${day}`}
            >
                <Text
                    style={[
                        styles.weekdayLabel,
                        isSelected && styles.dayHeaderTextOnBrand,
                        isToday && !isSelected && styles.dayHeaderTextToday,
                    ]}
                >
                    {weekday}
                </Text>
                <Text
                    style={[
                        styles.dayNumber,
                        isSelected && styles.dayHeaderTextOnBrand,
                        isToday && !isSelected && styles.dayHeaderTextToday,
                    ]}
                >
                    {day}
                </Text>
            </TouchableOpacity>

            <View style={styles.lanes}>
                {HOURS.map((hour) => (
                    <View key={hour} style={styles.hourLane} />
                ))}
                {eventLayouts.map((layout) => (
                    <View
                        key={layout.key}
                        style={[
                            styles.eventPosition,
                            {
                                top: layout.top,
                                left: `${layout.leftFraction * 100}%`,
                                width: `${layout.widthFraction * 100}%`,
                            },
                        ]}
                    >
                        <EventBlock
                            event={layout.event}
                            compact={compact}
                            onPress={eventPressHandler(layout.event, {
                                onMedicationPress,
                                onAppointmentPress,
                                onCheckInPress,
                            })}
                        />
                    </View>
                ))}
            </View>
        </View>
    );
}

function eventPressHandler(
    event: AgendaEvent,
    handlers: {
        onMedicationPress?: (event: Extract<AgendaEvent, { type: "medication" }>) => void;
        onAppointmentPress?: (event: Extract<AgendaEvent, { type: "appointment" | "exam" }>) => void;
        onCheckInPress?: (event: Extract<AgendaEvent, { type: "checkin" }>) => void;
    },
): (() => void) | undefined {
    if (event.type === "medication" && handlers.onMedicationPress) {
        return () => handlers.onMedicationPress!(event);
    }
    if ((event.type === "appointment" || event.type === "exam") && handlers.onAppointmentPress) {
        return () => handlers.onAppointmentPress!(event);
    }
    if (event.type === "checkin" && handlers.onCheckInPress) {
        return () => handlers.onCheckInPress!(event);
    }
    return undefined;
}

function makeStyles(t: ThemeContextValue, columnWidth: number, isCompact: boolean) {
    return StyleSheet.create({
        scrollContent: {
            paddingBottom: spacing[12] + 56,
        },
        gridRow: {
            flexDirection: "row",
            paddingLeft: GRID_HORIZONTAL_PADDING,
            paddingTop: spacing[2],
        },
        timeColumn: {
            width: TIME_COLUMN_WIDTH,
        },
        timeHeaderSpacer: {
            height: isCompact ? 48 : 56,
            marginBottom: spacing[2],
        },
        hourCell: {
            height: HOUR_HEIGHT,
            justifyContent: "flex-start",
        },
        hourLabel: {
            fontSize: fontSize.xs,
            color: t.text.secondary,
        },
        columnsRow: {
            flex: 1,
            flexDirection: "row",
        },
        dayColumn: {
            width: columnWidth,
            paddingHorizontal: isCompact ? 1 : spacing[1],
        },
        dayHeader: {
            height: isCompact ? 48 : 56,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: spacing[2],
            borderRadius: radii.md,
        },
        dayHeaderSelected: {
            backgroundColor: t.brand.fg,
        },
        dayHeaderToday: {
            borderWidth: 1,
            borderColor: t.brand.fg,
        },
        weekdayLabel: {
            fontSize: isCompact ? 10 : fontSize.xs,
            fontWeight: fontWeight.medium,
            color: t.text.secondary,
            textTransform: "capitalize",
        },
        dayNumber: {
            fontSize: isCompact ? fontSize.sm : fontSize.lg,
            fontWeight: fontWeight.bold,
            color: t.text.primary,
        },
        dayHeaderTextOnBrand: {
            color: t.surface.bgCard,
        },
        dayHeaderTextToday: {
            color: t.brand.fg,
        },
        lanes: {
            position: "relative",
            height: HOUR_HEIGHT * 24,
            borderLeftWidth: 1,
            borderColor: t.border.light,
        },
        hourLane: {
            height: HOUR_HEIGHT,
            borderBottomWidth: 1,
            borderColor: t.border.light,
        },
        eventPosition: {
            position: "absolute",
            paddingHorizontal: 1,
        },
    });
}
