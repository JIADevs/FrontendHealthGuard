import { eventHourFraction, eventKey, type AgendaEvent } from "./mapCalendarApiToEvents";

export const CALENDAR_HOUR_HEIGHT = 52;

export const EVENT_BLOCK_MIN_HEIGHT = {
    compact: 28,
    full: 38,
} as const;

export interface DayEventLayout {
    event: AgendaEvent;
    key: string;
    top: number;
    lane: number;
    laneCount: number;
    leftFraction: number;
    widthFraction: number;
}

interface TimedEvent {
    event: AgendaEvent;
    top: number;
    bottom: number;
    lane: number;
    laneCount: number;
}

function overlaps(a: TimedEvent, b: TimedEvent): boolean {
    return a.top < b.bottom && b.top < a.bottom;
}

/**
 * Assigns horizontal lanes so overlapping events sit side-by-side (Google Calendar style).
 */
export function layoutDayEvents(
    events: AgendaEvent[],
    hourHeight: number = CALENDAR_HOUR_HEIGHT,
    compact = false,
): DayEventLayout[] {
    if (events.length === 0) return [];

    const minHeight = compact ? EVENT_BLOCK_MIN_HEIGHT.compact : EVENT_BLOCK_MIN_HEIGHT.full;

    const timed: TimedEvent[] = events
        .map((event) => {
            const top = eventHourFraction(event) * hourHeight;
            return {
                event,
                top,
                bottom: top + minHeight,
                lane: 0,
                laneCount: 1,
            };
        })
        .sort((a, b) => a.top - b.top || a.event.sortKey - b.event.sortKey);

    const laneEnds: number[] = [];

    for (const item of timed) {
        let lane = 0;
        while (lane < laneEnds.length && laneEnds[lane] > item.top) {
            lane += 1;
        }
        laneEnds[lane] = item.bottom;
        item.lane = lane;
    }

    for (const item of timed) {
        const cluster = timed.filter((other) => overlaps(item, other));
        item.laneCount = Math.max(...cluster.map((entry) => entry.lane + 1));
    }

    return timed.map((item, index) => ({
        event: item.event,
        key: eventKey(item.event, index),
        top: item.top,
        lane: item.lane,
        laneCount: item.laneCount,
        leftFraction: item.lane / item.laneCount,
        widthFraction: 1 / item.laneCount,
    }));
}
