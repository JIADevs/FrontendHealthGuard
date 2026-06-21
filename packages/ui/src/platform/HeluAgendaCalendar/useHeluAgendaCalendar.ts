import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useCalendarEventsQuery } from "@helu/api/reactQueryHooks";
import {
    addLocalDays,
    buildLocalDateRange,
    buildWeekDates,
    formatMonthYear,
    formatWeekLabel,
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

export type CalendarViewMode = "day" | "week";

function dayFetchRange(anchor: string): { start: string; end: string } {
    return {
        start: addLocalDays(anchor, -INITIAL_PAST_DAYS),
        end: addLocalDays(anchor, INITIAL_FUTURE_DAYS),
    };
}

/** Reuse the day-mode cache when the week already fits inside it. */
function resolveFetchRange(
    viewMode: CalendarViewMode,
    rangeStart: string,
    rangeEnd: string,
    weekStart: string,
    weekEnd: string,
): { start: string; end: string } {
    if (viewMode === "day") {
        return { start: rangeStart, end: rangeEnd };
    }
    if (weekStart >= rangeStart && weekEnd <= rangeEnd) {
        return { start: rangeStart, end: rangeEnd };
    }
    return {
        start: weekStart < rangeStart ? weekStart : rangeStart,
        end: weekEnd > rangeEnd ? weekEnd : rangeEnd,
    };
}

export function useHeluAgendaCalendar(initialDate?: string) {
    const anchor = initialDate ?? todayLocalDateKey();
    const [selectedDate, setSelectedDate] = useState(anchor);
    const [viewMode, setViewModeState] = useState<CalendarViewMode>("day");
    const [scrollTarget, setScrollTarget] = useState<string | null>(null);
    const initialDayRange = dayFetchRange(anchor);
    const [rangeStart, setRangeStart] = useState(initialDayRange.start);
    const [rangeEnd, setRangeEnd] = useState(initialDayRange.end);
    const extendingRef = useRef(false);

    const weekDates = useMemo(() => buildWeekDates(selectedDate), [selectedDate]);
    const weekStart = weekDates[0];
    const weekEnd = weekDates[weekDates.length - 1];

    const fetchRange = useMemo(
        () => resolveFetchRange(viewMode, rangeStart, rangeEnd, weekStart, weekEnd),
        [viewMode, rangeStart, rangeEnd, weekStart, weekEnd],
    );

    const gridDates = viewMode === "week" ? weekDates : buildLocalDateRange(rangeStart, rangeEnd);

    const calendarQuery = useCalendarEventsQuery(fetchRange.start, fetchRange.end);

    useEffect(() => {
        if (viewMode !== "week") return;
        if (weekStart >= rangeStart && weekEnd <= rangeEnd) return;
        setRangeStart(weekStart < rangeStart ? weekStart : rangeStart);
        setRangeEnd(weekEnd > rangeEnd ? weekEnd : rangeEnd);
    }, [viewMode, weekStart, weekEnd, rangeStart, rangeEnd]);

    const events: AgendaEvent[] = useMemo(() => {
        if (!calendarQuery.data) return [];
        const mapped = mapCalendarApiToEvents(calendarQuery.data);
        return filterEventsForDates(mapped, gridDates);
    }, [calendarQuery.data, gridDates]);

    const headerLabel = useMemo(
        () => (viewMode === "week" ? formatWeekLabel(weekDates) : formatMonthYear(selectedDate)),
        [selectedDate, viewMode, weekDates],
    );

    const extendForward = useCallback(() => {
        setRangeEnd((prev) => addLocalDays(prev, EXTEND_DAYS));
    }, []);

    const extendBackward = useCallback(() => {
        setRangeStart((prev) => addLocalDays(prev, -EXTEND_DAYS));
    }, []);

    useEffect(() => {
        extendingRef.current = false;
    }, [gridDates.length]);

    const handleHorizontalScroll = useCallback(
        (firstVisibleIndex: number) => {
            if (viewMode !== "day" || extendingRef.current) return;

            const nearEnd = firstVisibleIndex >= gridDates.length - EXTEND_EDGE_THRESHOLD - 1;
            const nearStart = firstVisibleIndex <= EXTEND_EDGE_THRESHOLD;

            if (!nearEnd && !nearStart) return;

            extendingRef.current = true;
            if (nearEnd) extendForward();
            if (nearStart) extendBackward();
        },
        [extendBackward, extendForward, gridDates.length, viewMode],
    );

    const clearScrollTarget = useCallback(() => {
        setScrollTarget(null);
    }, []);

    const setViewMode = useCallback(
        (mode: CalendarViewMode) => {
            setViewModeState(mode);
            if (mode === "week") {
                setScrollTarget(null);
                return;
            }
            const { start, end } = dayFetchRange(selectedDate);
            setRangeStart(start);
            setRangeEnd(end);
            setScrollTarget(selectedDate);
        },
        [selectedDate],
    );

    const goToToday = useCallback(() => {
        const today = todayLocalDateKey();
        setSelectedDate(today);
        if (viewMode === "week") {
            setScrollTarget(null);
            return;
        }
        const { start, end } = dayFetchRange(today);
        setRangeStart(start);
        setRangeEnd(end);
        setScrollTarget(today);
    }, [viewMode]);

    const goPrevious = useCallback(() => {
        const next = addLocalDays(selectedDate, -7);
        setSelectedDate(next);
        if (viewMode === "day") {
            setScrollTarget(next);
        }
    }, [selectedDate, viewMode]);

    const goNext = useCallback(() => {
        const next = addLocalDays(selectedDate, 7);
        setSelectedDate(next);
        if (viewMode === "day") {
            setScrollTarget(next);
        }
    }, [selectedDate, viewMode]);

    const selectDate = useCallback(
        (date: string) => {
            setSelectedDate(date);
            if (viewMode === "week") {
                setViewModeState("day");
                const { start, end } = dayFetchRange(date);
                setRangeStart(start);
                setRangeEnd(end);
            }
            setScrollTarget(date);
        },
        [viewMode],
    );

    return {
        selectedDate,
        viewMode,
        gridDates,
        events,
        headerLabel,
        scrollTarget,
        initialScrollDate: anchor,
        isLoading: calendarQuery.isLoading,
        isError: calendarQuery.isError,
        refetch: calendarQuery.refetch,
        setViewMode,
        selectDate,
        goToToday,
        goPrevious,
        goNext,
        handleHorizontalScroll,
        clearScrollTarget,
    };
}
