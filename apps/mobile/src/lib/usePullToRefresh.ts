import { useCallback, useState } from "react";

/**
 * Pull to refresh that shows the spinner only for the pull gesture (movimiento-interacciones.md §6c).
 * Background refetches (after saving, on focus) keep the list in place: binding `refreshing` to
 * `isRefetching` opened the empty refresh gap above the list and hid the item just added.
 */
export function usePullToRefresh(refetch: () => Promise<unknown>) {
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refetch().finally(() => setRefreshing(false));
  }, [refetch]);
  return { refreshing, onRefresh };
}
