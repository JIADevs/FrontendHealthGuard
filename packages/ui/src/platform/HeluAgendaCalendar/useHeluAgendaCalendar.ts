import { useMemo, useState, useCallback } from "react";
import { useCalendarEventsQuery } from "@helu/api/hooks";
import {
    filterEventsForDates,
    mapCalendarApiToEvents,
    type AgendaEvent,
} from "./mapCalendarApiToEvents";

export type ViewRange = 1 | 3 | 7;

function formatDate(d: Date): string {
    return d.toISOString().slice(0, 10);
}

function addDays(isoDate: string, delta: number): string {
    const d = new Date(`${isoDate}T12:00:00`);
    d.setDate(d.getDate() + delta);
    return formatDate(d);
}

function buildVisibleDates(anchor: string, range: ViewRange): string[] {
    if (range === 1) return [anchor];
    const startOffset = range === 3 ? -1 : -3;
    return Array.from({ length: range }, (_, i) => addDays(anchor, startOffset + i));
}

export function useHeluAgendaCalendar(initialDate?: string) {
    const [selectedDate, setSelectedDate] = useState(
        initialDate ?? formatDate(new Date()),
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
        setSelectedDate(formatDate(new Date()));
        setViewRange(1);
    }, []);

    const goPrevious = useCallback(() => {
        setSelectedDate((prev) => addDays(prev, -viewRange));
    }, [viewRange]);

    const goNext = useCallback(() => {
        setSelectedDate((prev) => addDays(prev, viewRange));
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
