import { useMemo } from "react";
import type { DailyCheckIn } from "@helu/api";
import {
    flattenDailyCheckInPages,
    useInfiniteDailyCheckIns,
} from "@helu/api/hooks";

export interface WellbeingDaySection {
    key: string;
    title: string;
    data: DailyCheckIn[];
}

function localDateKey(iso: string): string {
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function todayLocalDateKey(): string {
    return localDateKey(new Date().toISOString());
}

function yesterdayLocalDateKey(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return localDateKey(d.toISOString());
}

function formatDayHeader(dateKey: string): string {
    if (dateKey === todayLocalDateKey()) return "Hoy";
    if (dateKey === yesterdayLocalDateKey()) return "Ayer";
    const [y, m, day] = dateKey.split("-").map(Number);
    return new Date(y, m - 1, day).toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
}

function capitalizeFirst(text: string): string {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export function groupCheckInsByDay(items: DailyCheckIn[]): WellbeingDaySection[] {
    const order: string[] = [];
    const map = new Map<string, DailyCheckIn[]>();

    for (const item of items) {
        const key = localDateKey(item.recordedAt);
        if (!map.has(key)) {
            map.set(key, []);
            order.push(key);
        }
        map.get(key)!.push(item);
    }

    return order.map((key) => ({
        key,
        title: capitalizeFirst(formatDayHeader(key)),
        data: map.get(key)!,
    }));
}

export function useWellbeingScreen() {
    const query = useInfiniteDailyCheckIns();

    const items = useMemo(
        () => flattenDailyCheckInPages(query.data?.pages),
        [query.data?.pages],
    );

    const sections = useMemo(() => groupCheckInsByDay(items), [items]);

    const total = query.data?.pages[0]?.total ?? items.length;

    return {
        sections,
        items,
        total,
        isLoading: query.isLoading,
        isError: query.isError,
        isRefetching: query.isRefetching && !query.isFetchingNextPage,
        isFetchingNextPage: query.isFetchingNextPage,
        hasNextPage: query.hasNextPage,
        fetchNextPage: query.fetchNextPage,
        refetch: query.refetch,
    };
}
