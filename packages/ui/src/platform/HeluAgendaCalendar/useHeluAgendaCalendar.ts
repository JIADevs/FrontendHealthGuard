import { useCallback, useEffect, useMemo, useState } from "react";
import { useCalendarEventsQuery } from "@helu/api/reactQueryHooks";
import {
    addLocalDays,
    addMonths,
    buildThreeDayDates,
    buildWeekDates,
    endOfMonth,
    formatMonthYear,
    formatWeekLabel,
    startOfMonth,
    todayLocalDateKey,
} from "./calendarDateUtils";
import {
    INITIAL_FUTURE_DAYS,
    INITIAL_PAST_DAYS,
    MONTH_BUFFER_MONTHS,
    THREE_DAY_BUFFER_FUTURE_DAYS,
    THREE_DAY_BUFFER_PAST_DAYS,
    VIEW_MODE_NAV_STEP,
    WEEK_BUFFER_FUTURE_DAYS,
    WEEK_BUFFER_PAST_DAYS,
} from "./calendarConstants";
import {
    filterEventsForDates,
    mapCalendarApiToEvents,
    type AgendaEvent,
} from "./mapCalendarApiToEvents";
import { buildDayActivityMap } from "./dayActivityIndicators";

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

function mergeRanges(
    a: { start: string; end: string },
    b: { start: string; end: string },
): { start: string; end: string } {
    return {
        start: a.start < b.start ? a.start : b.start,
        end: a.end > b.end ? a.end : b.end,
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
        case "month": {
            const start = startOfMonth(selectedDate);
            const end = endOfMonth(selectedDate);
            return { dates: [], start, end };
        }
    }
}

/** Prefetch window for fixed layouts so arrow nav stays inside cache. */
function bufferedFetchRange(
    viewMode: CalendarViewMode,
    selectedDate: string,
): { start: string; end: string } {
    const { start: windowStart, end: windowEnd } = visibleWindow(viewMode, selectedDate);

    switch (viewMode) {
        case "threeDay":
            return {
                start: addLocalDays(windowStart, -THREE_DAY_BUFFER_PAST_DAYS),
                end: addLocalDays(windowEnd, THREE_DAY_BUFFER_FUTURE_DAYS),
            };
        case "week":
            return {
                start: addLocalDays(windowStart, -WEEK_BUFFER_PAST_DAYS),
                end: addLocalDays(windowEnd, WEEK_BUFFER_FUTURE_DAYS),
            };
        case "month":
            return {
                start: startOfMonth(addMonths(selectedDate, -MONTH_BUFFER_MONTHS)),
                end: endOfMonth(addMonths(selectedDate, MONTH_BUFFER_MONTHS)),
            };
        default:
            return { start: windowStart, end: windowEnd };
    }
}

export function useHeluAgendaCalendar(initialDate?: string) {
    const anchor = initialDate ?? todayLocalDateKey();
    const [selectedDate, setSelectedDate] = useState(anchor);
    const [viewMode, setViewModeState] = useState<CalendarViewMode>("day");
    const initialDayRange = dayFetchRange(anchor);
    const [rangeStart, setRangeStart] = useState(initialDayRange.start);
    const [rangeEnd, setRangeEnd] = useState(initialDayRange.end);

    const gridDates = useMemo(() => {
        const window = visibleWindow(viewMode, selectedDate);
        return window.dates;
    }, [viewMode, selectedDate]);

    const fetchRange = useMemo(() => {
        if (viewMode === "day") {
            return { start: rangeStart, end: rangeEnd };
        }
        const buffered = bufferedFetchRange(viewMode, selectedDate);
        return mergeRanges({ start: rangeStart, end: rangeEnd }, buffered);
    }, [viewMode, selectedDate, rangeStart, rangeEnd]);

    const calendarQuery = useCalendarEventsQuery(fetchRange.start, fetchRange.end);

    useEffect(() => {
        if (viewMode === "day") {
            const next = expandRangeToCoverDate(selectedDate, rangeStart, rangeEnd);
            if (next.start === rangeStart && next.end === rangeEnd) return;
            setRangeStart(next.start);
            setRangeEnd(next.end);
            return;
        }

        const buffered = bufferedFetchRange(viewMode, selectedDate);
        const next = mergeRanges({ start: rangeStart, end: rangeEnd }, buffered);
        if (next.start === rangeStart && next.end === rangeEnd) return;
        setRangeStart(next.start);
        setRangeEnd(next.end);
    }, [viewMode, selectedDate, rangeStart, rangeEnd]);

    const dayActivity = useMemo(
        () => buildDayActivityMap(calendarQuery.data ?? []),
        [calendarQuery.data],
    );

    const events: AgendaEvent[] = useMemo(() => {
        if (!calendarQuery.data || viewMode === "month") return [];
        const mapped = mapCalendarApiToEvents(calendarQuery.data);
        return filterEventsForDates(mapped, gridDates);
    }, [calendarQuery.data, gridDates, viewMode]);

    const headerLabel = useMemo(() => {
        if (viewMode === "day" || viewMode === "month") return formatMonthYear(selectedDate);
        return formatWeekLabel(gridDates);
    }, [gridDates, selectedDate, viewMode]);

    const navStep = VIEW_MODE_NAV_STEP[viewMode];

    const applyFixedWindowRange = useCallback(
        (mode: Exclude<CalendarViewMode, "day">, date: string) => {
            const buffered = bufferedFetchRange(mode, date);
            setRangeStart((prev) => (buffered.start < prev ? buffered.start : prev));
            setRangeEnd((prev) => (buffered.end > prev ? buffered.end : prev));
        },
        [],
    );

    const setViewMode = useCallback(
        (mode: CalendarViewMode) => {
            setViewModeState(mode);
            if (mode === "day") {
                const next = expandRangeToCoverDate(selectedDate, rangeStart, rangeEnd);
                if (next.start !== rangeStart) setRangeStart(next.start);
                if (next.end !== rangeEnd) setRangeEnd(next.end);
                return;
            }
            applyFixedWindowRange(mode, selectedDate);
        },
        [applyFixedWindowRange, rangeEnd, rangeStart, selectedDate],
    );

    const goToToday = useCallback(() => {
        setSelectedDate(todayLocalDateKey());
    }, []);

    const goPrevious = useCallback(() => {
        if (viewMode === "month") {
            setSelectedDate((prev) => addMonths(prev, -1));
            return;
        }
        setSelectedDate((prev) => addLocalDays(prev, -navStep));
    }, [navStep, viewMode]);

    const goNext = useCallback(() => {
        if (viewMode === "month") {
            setSelectedDate((prev) => addMonths(prev, 1));
            return;
        }
        setSelectedDate((prev) => addLocalDays(prev, navStep));
    }, [navStep, viewMode]);

    const selectDate = useCallback(
        (date: string) => {
            setSelectedDate(date);
            if (viewMode === "week" || viewMode === "month") {
                setViewModeState("day");
                const next = expandRangeToCoverDate(date, rangeStart, rangeEnd);
                if (next.start !== rangeStart) setRangeStart(next.start);
                if (next.end !== rangeEnd) setRangeEnd(next.end);
            }
        },
        [rangeEnd, rangeStart, viewMode],
    );

    const isInitialLoading = calendarQuery.isLoading && !calendarQuery.data;

    return {
        selectedDate,
        viewMode,
        gridDates,
        events,
        dayActivity,
        headerLabel,
        isLoading: isInitialLoading,
        isError: calendarQuery.isError,
        refetch: calendarQuery.refetch,
        setViewMode,
        selectDate,
        goToToday,
        goPrevious,
        goNext,
    };
}
