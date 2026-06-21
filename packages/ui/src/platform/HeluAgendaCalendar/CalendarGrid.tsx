import { useCallback, useEffect, useMemo, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from "react-native";
import { spacing, fontSize, fontWeight, radii } from "../../tokens/tokens";
import { useAppTheme } from "../../tokens/ThemeProvider";
import type { ThemeContextValue } from "../../tokens/ThemeProvider";
import { eventHourFraction, type AgendaEvent } from "./mapCalendarApiToEvents";
import { addLocalDays, formatDayShort, localDateKeyFromISO } from "./calendarDateUtils";
import { DAY_COLUMN_WIDTH } from "./calendarConstants";
import { EventBlock } from "./EventBlock";

const HOUR_HEIGHT = 52;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface CalendarGridProps {
    events: AgendaEvent[];
    dates: string[];
    selectedDate: string;
    initialScrollDate: string;
    onSelectDate: (date: string) => void;
    onHorizontalScroll: (firstVisibleIndex: number) => void;
    scrollTarget: string | null;
    onScrollTargetHandled: () => void;
}

export function CalendarGrid({
    events,
    dates,
    selectedDate,
    initialScrollDate,
    onSelectDate,
    onHorizontalScroll,
    scrollTarget,
    onScrollTargetHandled,
}: CalendarGridProps) {
    const t = useAppTheme();
    const styles = useMemo(() => makeStyles(t), [t]);
    const horizontalRef = useRef<ScrollView>(null);
    const initialOffsetRef = useRef(
        Math.max(0, dates.indexOf(initialScrollDate)) * DAY_COLUMN_WIDTH,
    );
    const scrollXRef = useRef(initialOffsetRef.current);
    const prevFirstDateRef = useRef(dates[0]);
    const edgeDetectionEnabledRef = useRef(false);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, AgendaEvent[]>();
        for (const date of dates) map.set(date, []);
        for (const event of events) {
            const key =
                event.type === "checkin"
                    ? localDateKeyFromISO(event.data.recordedAt)
                    : (event.data.date?.slice(0, 10) ?? "");
            if (map.has(key)) map.get(key)!.push(event);
        }
        return map;
    }, [events, dates]);

    const scrollToDate = useCallback(
        (dateKey: string, animated = true) => {
            const index = dates.indexOf(dateKey);
            if (index < 0) return;
            const x = index * DAY_COLUMN_WIDTH;
            scrollXRef.current = x;
            horizontalRef.current?.scrollTo({ x, animated });
        },
        [dates],
    );

    useEffect(() => {
        if (!scrollTarget) return;
        scrollToDate(scrollTarget, true);
        onScrollTargetHandled();
    }, [scrollTarget, scrollToDate, onScrollTargetHandled]);

    useEffect(() => {
        const prevFirst = prevFirstDateRef.current;
        const newFirst = dates[0];
        if (newFirst < prevFirst) {
            let added = 0;
            let cursor = newFirst;
            while (cursor < prevFirst) {
                added += 1;
                cursor = addLocalDays(cursor, 1);
            }
            const nextX = scrollXRef.current + added * DAY_COLUMN_WIDTH;
            scrollXRef.current = nextX;
            horizontalRef.current?.scrollTo({ x: nextX, animated: false });
        }
        prevFirstDateRef.current = newFirst;
    }, [dates]);

    const handleScrollBeginDrag = useCallback(() => {
        edgeDetectionEnabledRef.current = true;
    }, []);

    const handleHorizontalScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetX = event.nativeEvent.contentOffset.x;
            scrollXRef.current = offsetX;
            if (!edgeDetectionEnabledRef.current) return;
            const firstVisibleIndex = Math.floor(offsetX / DAY_COLUMN_WIDTH);
            onHorizontalScroll(firstVisibleIndex);
        },
        [onHorizontalScroll],
    );

    const handleMomentumEnd = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (!edgeDetectionEnabledRef.current) return;
            const offsetX = event.nativeEvent.contentOffset.x;
            const index = Math.round(offsetX / DAY_COLUMN_WIDTH);
            const clamped = Math.max(0, Math.min(index, dates.length - 1));
            onSelectDate(dates[clamped]);
        },
        [dates, onSelectDate],
    );

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

                <ScrollView
                    ref={horizontalRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentOffset={{ x: initialOffsetRef.current, y: 0 }}
                    onScrollBeginDrag={handleScrollBeginDrag}
                    onScroll={handleHorizontalScroll}
                    scrollEventThrottle={16}
                    onMomentumScrollEnd={handleMomentumEnd}
                    decelerationRate="fast"
                    snapToInterval={DAY_COLUMN_WIDTH}
                    snapToAlignment="start"
                >
                    {dates.map((date) => {
                        const { weekday, day, isToday } = formatDayShort(date);
                        const isSelected = date === selectedDate;

                        return (
                            <View key={date} style={styles.dayColumn}>
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
                        );
                    })}
                </ScrollView>
            </View>
        </ScrollView>
    );
}

function makeStyles(t: ThemeContextValue) {
    return StyleSheet.create({
        scrollContent: {
            paddingBottom: spacing[12] + 56,
        },
        gridRow: {
            flexDirection: "row",
            paddingLeft: spacing[3],
            paddingTop: spacing[2],
        },
        timeColumn: {
            width: 44,
        },
        timeHeaderSpacer: {
            height: 56,
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
        dayColumn: {
            width: DAY_COLUMN_WIDTH,
            paddingHorizontal: spacing[1],
        },
        dayHeader: {
            height: 56,
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
            fontSize: fontSize.xs,
            fontWeight: fontWeight.medium,
            color: t.text.secondary,
            textTransform: "capitalize",
        },
        dayNumber: {
            fontSize: fontSize.lg,
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
            left: spacing[1],
            right: spacing[1],
        },
    });
}
