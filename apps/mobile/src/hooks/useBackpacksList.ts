import { useMemo, useState, useCallback } from "react";
import { useBackpacksQuery } from "@helu/api/hooks";
import { useDebounceSearch } from "@helu/ui";
import type { Backpack } from "@helu/api";
import { groupBackpacksByDate } from "../components/backpacks/utils/groupBackpacksByDate";

const LIST_FETCH_LIMIT = 50;

export function useBackpacksList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);

  const query = useBackpacksQuery(debouncedSearch, LIST_FETCH_LIMIT);

  const items = useMemo(
    () => (query.data?.items ?? []) as Backpack[],
    [query.data],
  );

  const sections = useMemo(() => groupBackpacksByDate(items), [items]);
  const totalCount = query.data?.total ?? items.length;

  const refetch = useCallback(() => {
    void query.refetch();
  }, [query]);

  return {
    search,
    setSearch,
    debouncedSearch,
    sections,
    totalCount,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch,
    error: query.error,
  };
}
