import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendarEventsQuery } from "@helu/api/reactQueryHooks";
import {
    addLocalDays,
    buildLocalDateRange,
    formatMonthYear,
    todayLocalDateKey,
} from "./calendarDateUtils";
import {
    EXTEND_DAYS,
    EXTEND_EDGE_THRESHOLD,
    INITIAL_FUTURE_DAYS,
    INITIAL_PAST_DAYS,
} from "./calendarConstants";
import {
    filterEventsForDates,
    mapCalendarApiToEvents,
    type AgendaEvent,
} from "./mapCalendarApiToEvents";

export function useHeluAgendaCalendar(initialDate?: string) {
    const anchor = initialDate ?? todayLocalDateKey();
    const [selectedDate, setSelectedDate] = useState(anchor);
    const [scrollTarget, setScrollTarget] = useState<string | null>(null);
    const [rangeStart, setRangeStart] = useState(() => addLocalDays(anchor, -INITIAL_PAST_DAYS));
    const [rangeEnd, setRangeEnd] = useState(() => addLocalDays(anchor, INITIAL_FUTURE_DAYS));
    const extendingRef = useRef(false);

    const visibleDates = useMemo(
        () => buildLocalDateRange(rangeStart, rangeEnd),
        [rangeStart, rangeEnd],
    );

    const calendarQuery = useCalendarEventsQuery(rangeStart, rangeEnd);

    const events: AgendaEvent[] = useMemo(() => {
        if (!calendarQuery.data) return [];
        const mapped = mapCalendarApiToEvents(calendarQuery.data);
        return filterEventsForDates(mapped, visibleDates);
    }, [calendarQuery.data, visibleDates]);

    const monthLabel = useMemo(() => formatMonthYear(selectedDate), [selectedDate]);

    const extendForward = useCallback(() => {
        setRangeEnd((prev) => addLocalDays(prev, EXTEND_DAYS));
    }, []);

    const extendBackward = useCallback(() => {
        setRangeStart((prev) => addLocalDays(prev, -EXTEND_DAYS));
    }, []);

    useEffect(() => {
        extendingRef.current = false;
    }, [visibleDates.length]);

    const handleHorizontalScroll = useCallback(
        (firstVisibleIndex: number) => {
            if (extendingRef.current) return;

            const nearEnd = firstVisibleIndex >= visibleDates.length - EXTEND_EDGE_THRESHOLD - 1;
            const nearStart = firstVisibleIndex <= EXTEND_EDGE_THRESHOLD;

            if (!nearEnd && !nearStart) return;

            extendingRef.current = true;
            if (nearEnd) extendForward();
            if (nearStart) extendBackward();
        },
        [extendBackward, extendForward, visibleDates.length],
    );

    const clearScrollTarget = useCallback(() => {
        setScrollTarget(null);
    }, []);

    const goToToday = useCallback(() => {
        const today = todayLocalDateKey();
        setSelectedDate(today);
        if (today < rangeStart || today > rangeEnd) {
            setRangeStart(addLocalDays(today, -INITIAL_PAST_DAYS));
            setRangeEnd(addLocalDays(today, INITIAL_FUTURE_DAYS));
        }
        setScrollTarget(today);
    }, [rangeEnd, rangeStart]);

    const goPreviousWeek = useCallback(() => {
        const next = addLocalDays(selectedDate, -7);
        setSelectedDate(next);
        setScrollTarget(next);
    }, [selectedDate]);

    const goNextWeek = useCallback(() => {
        const next = addLocalDays(selectedDate, 7);
        setSelectedDate(next);
        setScrollTarget(next);
    }, [selectedDate]);

    const selectDate = useCallback((date: string) => {
        setSelectedDate(date);
        setScrollTarget(date);
    }, []);

    return {
        selectedDate,
        visibleDates,
        events,
        monthLabel,
        scrollTarget,
        initialScrollDate: anchor,
        isLoading: calendarQuery.isLoading,
        isError: calendarQuery.isError,
        refetch: calendarQuery.refetch,
        selectDate,
        goToToday,
        goPreviousWeek,
        goNextWeek,
        handleHorizontalScroll,
        clearScrollTarget,
    };
}
