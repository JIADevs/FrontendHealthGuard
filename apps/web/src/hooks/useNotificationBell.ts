import { useNotificationsQuery, useNotificationsCore } from "@helu/api/hooks";

export function useNotificationBell() {
  const query = useNotificationsQuery(1, 20);
  const notifications = query.data?.items ?? [];

  const core = useNotificationsCore({
    notifications,
    refetch: query.refetch,
  });

  return {
    ...core,
    notifications,
    isLoading: query.isLoading,
  };
}
