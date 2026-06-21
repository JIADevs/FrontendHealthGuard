import { useMemo, useState, useCallback } from "react";
import { useCalendarEventsQuery } from "@helu/api/reactQueryHooks";
import {
    addLocalDays,
    todayLocalDateKey,
} from "./calendarDateUtils";
import {
    filterEventsForDates,
    mapCalendarApiToEvents,
    type AgendaEvent,
} from "./mapCalendarApiToEvents";

export type ViewRange = 1 | 3 | 7;

function buildVisibleDates(anchor: string, range: ViewRange): string[] {
    if (range === 1) return [anchor];
    const startOffset = range === 3 ? -1 : -3;
    return Array.from({ length: range }, (_, i) => addLocalDays(anchor, startOffset + i));
}

export function useHeluAgendaCalendar(initialDate?: string) {
    const [selectedDate, setSelectedDate] = useState(
        initialDate ?? todayLocalDateKey(),
    );
    const [viewRange, setViewRange] = useState<ViewRange>(1);

    const visibleDates = useMemo(
        () => buildVisibleDates(selectedDate, viewRange),
        [selectedDate, viewRange],
    );

    const windowStart = visibleDates[0];
    const windowEnd = visibleDates[visibleDates.length - 1];

    const calendarQuery = useCalendarEventsQuery(windowStart, windowEnd);

    const events: AgendaEvent[] = useMemo(() => {
        if (!calendarQuery.data) return [];
        const mapped = mapCalendarApiToEvents(calendarQuery.data);
        return filterEventsForDates(mapped, visibleDates);
    }, [calendarQuery.data, visibleDates]);

    const goToToday = useCallback(() => {
        setSelectedDate(todayLocalDateKey());
        setViewRange(1);
    }, []);

    const goPrevious = useCallback(() => {
        setSelectedDate((prev) => addLocalDays(prev, -viewRange));
    }, [viewRange]);

    const goNext = useCallback(() => {
        setSelectedDate((prev) => addLocalDays(prev, viewRange));
    }, [viewRange]);

    const selectDate = useCallback((date: string) => {
        setSelectedDate(date);
        setViewRange(1);
    }, []);

    return {
        selectedDate,
        viewRange,
        visibleDates,
        events,
        isLoading: calendarQuery.isLoading,
        isError: calendarQuery.isError,
        refetch: calendarQuery.refetch,
        setSelectedDate,
        setViewRange,
        selectDate,
        goToToday,
        goPrevious,
        goNext,
    };
}
