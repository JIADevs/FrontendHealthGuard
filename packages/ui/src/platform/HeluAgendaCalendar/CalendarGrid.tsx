import { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { spacing, fontSize, fontWeight } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import { eventHourFraction, type AgendaEvent } from "./mapCalendarApiToEvents";
import { EventBlock } from "./EventBlock";

const HOUR_HEIGHT = 52;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface CalendarGridProps {
    events: AgendaEvent[];
    dates: string[];
}

export function CalendarGrid({ events, dates }: CalendarGridProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, AgendaEvent[]>();
        for (const date of dates) map.set(date, []);
        for (const event of events) {
            const key =
                event.type === "checkin"
                    ? event.data.recordedAt.slice(0, 10)
                    : event.data.date?.slice(0, 10) ?? "";
            if (map.has(key)) map.get(key)!.push(event);
        }
        return map;
    }, [events, dates]);

    return (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>
            <View style={styles.gridRow}>
                <View style={styles.timeColumn}>
                    {HOURS.map((hour) => (
                        <View key={hour} style={styles.hourCell}>
                            <Text style={styles.hourLabel}>
                                {`${String(hour).padStart(2, "0")}:00`}
                            </Text>
                        </View>
                    ))}
                </View>

                {dates.map((date) => (
                    <View key={date} style={styles.dayColumn}>
                        <Text style={styles.dayHeader}>{formatDayHeader(date)}</Text>
                        <View style={styles.lanes}>
                            {HOURS.map((hour) => (
                                <View key={hour} style={styles.hourLane} />
                            ))}
                            {(eventsByDate.get(date) ?? []).map((event, idx) => {
                                const top = eventHourFraction(event) * HOUR_HEIGHT;
                                return (
                                    <View
                                        key={`${event.type}-${idx}`}
                                        style={[styles.eventPosition, { top }]}
                                    >
                                        <EventBlock event={event} />
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

function formatDayHeader(isoDate: string): string {
    const d = new Date(`${isoDate}T12:00:00`);
    return d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        scrollContent: {
            paddingBottom: spacing[12] + 56,
        },
        gridRow: {
            flexDirection: "row",
            paddingHorizontal: spacing[3],
            paddingTop: spacing[2],
        },
        timeColumn: {
            width: 44,
            paddingTop: spacing[6],
        },
        hourCell: {
            height: HOUR_HEIGHT,
            justifyContent: "flex-start",
        },
        hourLabel: {
            fontSize: fontSize.xs,
            color: t.text.secondary,
        },
        dayColumn: {
            flex: 1,
            minWidth: 120,
            marginLeft: spacing[2],
        },
        dayHeader: {
            fontSize: fontSize.sm,
            fontWeight: fontWeight.semibold,
            color: t.text.primary,
            marginBottom: spacing[2],
            textAlign: "center",
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
            left: spacing[1],
            right: spacing[1],
        },
    });
}
