import { useCallback, useEffect, useMemo, useState } from "react";
import { useCalendarEventsQuery } from "@helu/api/reactQueryHooks";
import {
    addLocalDays,
    buildThreeDayDates,
    buildWeekDates,
    formatMonthYear,
    formatWeekLabel,
    todayLocalDateKey,
} from "./calendarDateUtils";
import { INITIAL_FUTURE_DAYS, INITIAL_PAST_DAYS, VIEW_MODE_NAV_STEP } from "./calendarConstants";
import {
    filterEventsForDates,
    mapCalendarApiToEvents,
    type AgendaEvent,
} from "./mapCalendarApiToEvents";

export type CalendarViewMode = keyof typeof VIEW_MODE_NAV_STEP;

function dayFetchRange(anchor: string): { start: string; end: string } {
    return {
        start: addLocalDays(anchor, -INITIAL_PAST_DAYS),
        end: addLocalDays(anchor, INITIAL_FUTURE_DAYS),
    };
}

/** Keep the cached range when the date fits; only expand outward — never shrink. */
function expandRangeToCoverDate(
    date: string,
    rangeStart: string,
    rangeEnd: string,
): { start: string; end: string } {
    if (date >= rangeStart && date <= rangeEnd) {
        return { start: rangeStart, end: rangeEnd };
    }
    const ideal = dayFetchRange(date);
    return {
        start: date < rangeStart ? ideal.start : rangeStart,
        end: date > rangeEnd ? ideal.end : rangeEnd,
    };
}

function visibleWindow(viewMode: CalendarViewMode, selectedDate: string) {
    switch (viewMode) {
        case "day":
            return { dates: [selectedDate], start: selectedDate, end: selectedDate };
        case "threeDay": {
            const dates = buildThreeDayDates(selectedDate);
            return { dates, start: dates[0], end: dates[dates.length - 1] };
        }
        case "week": {
            const dates = buildWeekDates(selectedDate);
            return { dates, start: dates[0], end: dates[dates.length - 1] };
        }
    }
}

/** Reuse the day-mode cache when a fixed window already fits inside it. */
function resolveFetchRange(
    viewMode: CalendarViewMode,
    rangeStart: string,
    rangeEnd: string,
    windowStart: string,
    windowEnd: string,
): { start: string; end: string } {
    if (viewMode === "day") {
        return { start: rangeStart, end: rangeEnd };
    }
    if (windowStart >= rangeStart && windowEnd <= rangeEnd) {
        return { start: rangeStart, end: rangeEnd };
    }
    return {
        start: windowStart < rangeStart ? windowStart : rangeStart,
        end: windowEnd > rangeEnd ? windowEnd : rangeEnd,
    };
}

export function useHeluAgendaCalendar(initialDate?: string) {
    const anchor = initialDate ?? todayLocalDateKey();
    const [selectedDate, setSelectedDate] = useState(anchor);
    const [viewMode, setViewModeState] = useState<CalendarViewMode>("day");
    const initialDayRange = dayFetchRange(anchor);
    const [rangeStart, setRangeStart] = useState(initialDayRange.start);
    const [rangeEnd, setRangeEnd] = useState(initialDayRange.end);

    const { dates: gridDates, start: windowStart, end: windowEnd } = useMemo(
        () => visibleWindow(viewMode, selectedDate),
        [viewMode, selectedDate],
    );

    const fetchRange = useMemo(
        () => resolveFetchRange(viewMode, rangeStart, rangeEnd, windowStart, windowEnd),
        [viewMode, rangeStart, rangeEnd, windowStart, windowEnd],
    );

    const calendarQuery = useCalendarEventsQuery(fetchRange.start, fetchRange.end);

    useEffect(() => {
        if (viewMode === "day") {
            const next = expandRangeToCoverDate(selectedDate, rangeStart, rangeEnd);
            if (next.start === rangeStart && next.end === rangeEnd) return;
            setRangeStart(next.start);
            setRangeEnd(next.end);
            return;
        }
        if (windowStart >= rangeStart && windowEnd <= rangeEnd) return;
        setRangeStart(windowStart < rangeStart ? windowStart : rangeStart);
        setRangeEnd(windowEnd > rangeEnd ? windowEnd : rangeEnd);
    }, [viewMode, selectedDate, windowStart, windowEnd, rangeStart, rangeEnd]);

    const events: AgendaEvent[] = useMemo(() => {
        if (!calendarQuery.data) return [];
        const mapped = mapCalendarApiToEvents(calendarQuery.data);
        return filterEventsForDates(mapped, gridDates);
    }, [calendarQuery.data, gridDates]);

    const headerLabel = useMemo(() => {
        if (viewMode === "day") return formatMonthYear(selectedDate);
        return formatWeekLabel(gridDates);
    }, [gridDates, selectedDate, viewMode]);

    const navStep = VIEW_MODE_NAV_STEP[viewMode];

    const setViewMode = useCallback(
        (mode: CalendarViewMode) => {
            setViewModeState(mode);
            if (mode !== "day") return;
            const next = expandRangeToCoverDate(selectedDate, rangeStart, rangeEnd);
            if (next.start !== rangeStart) setRangeStart(next.start);
            if (next.end !== rangeEnd) setRangeEnd(next.end);
        },
        [rangeEnd, rangeStart, selectedDate],
    );

    const goToToday = useCallback(() => {
        setSelectedDate(todayLocalDateKey());
    }, []);

    const goPrevious = useCallback(() => {
        setSelectedDate((prev) => addLocalDays(prev, -navStep));
    }, [navStep]);

    const goNext = useCallback(() => {
        setSelectedDate((prev) => addLocalDays(prev, navStep));
    }, [navStep]);

    const selectDate = useCallback(
        (date: string) => {
            setSelectedDate(date);
            if (viewMode === "week") {
                setViewModeState("day");
                const next = expandRangeToCoverDate(date, rangeStart, rangeEnd);
                if (next.start !== rangeStart) setRangeStart(next.start);
                if (next.end !== rangeEnd) setRangeEnd(next.end);
            }
        },
        [rangeEnd, rangeStart, viewMode],
    );

    return {
        selectedDate,
        viewMode,
        gridDates,
        events,
        headerLabel,
        isLoading: calendarQuery.isLoading,
        isError: calendarQuery.isError,
        refetch: calendarQuery.refetch,
        setViewMode,
        selectDate,
        goToToday,
        goPrevious,
        goNext,
    };
}
