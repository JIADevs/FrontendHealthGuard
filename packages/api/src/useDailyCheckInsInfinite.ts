import { useInfiniteQuery } from "@tanstack/react-query";
import { getDailyCheckIns } from "./endpoints";
import type { DailyCheckIn } from "./schemas";

export const DAILY_CHECKINS_PAGE_SIZE = 15;

export function useInfiniteDailyCheckIns(limit = DAILY_CHECKINS_PAGE_SIZE) {
    return useInfiniteQuery({
        queryKey: ["daily-checkins", "infinite", limit] as const,
        queryFn: ({ pageParam = 1 }) =>
            getDailyCheckIns({ page: pageParam as number, limit }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const fetched = allPages.length * limit;
            return fetched < lastPage.total ? allPages.length + 1 : undefined;
        },
        staleTime: 5_000,
    });
}

export function flattenDailyCheckInPages(
    pages: { items: DailyCheckIn[] }[] | undefined,
): DailyCheckIn[] {
    return pages?.flatMap((p) => p.items) ?? [];
}
