import { useInfiniteQuery } from "@tanstack/react-query";
import { getNotifications } from "@healthguard/api";
import { useNotificationsCore } from "@healthguard/api/hooks";
import type { Notification } from "@healthguard/api";

const LIMIT = 20;

export function useNotificationsScreen() {
  const query = useInfiniteQuery({
    queryKey: ["notifications"],
    queryFn: ({ pageParam = 1 }) =>
      getNotifications({ page: pageParam as number, limit: LIMIT }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const fetched = allPages.length * LIMIT;
      return fetched < lastPage.total ? allPages.length + 1 : undefined;
    },
  });

  const notifications: Notification[] =
    query.data?.pages.flatMap((p) => p.items) ?? [];

  const core = useNotificationsCore({
    notifications,
    refetch: query.refetch,
  });

  return {
    ...core,
    notifications,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching && !query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    refetch: query.refetch,
  };
}
