import { useMemo, useState } from "react";
import { useBackpacksQuery } from "@helu/api/hooks";
import { useDebounceSearch } from "@helu/ui";
import type { Backpack } from "@helu/api";
import { isBackpackPendingDelete } from "./useBackpackUndo";

const LIST_FETCH_LIMIT = 50;

/** Mochilas: one flat list (mockup), newest first as the API returns it, searched on the server. */
export function useBackpacksList() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounceSearch(search);
  const query = useBackpacksQuery(debouncedSearch, LIST_FETCH_LIMIT);

  const items = useMemo(
    () => ((query.data?.items ?? []) as Backpack[]).filter((bp) => !isBackpackPendingDelete(bp.id)),
    [query.data],
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    items,
    isLoading: query.isLoading,
    /** False while typing or while the next search is on its way: no «sin resultados» flash. */
    settled: search === debouncedSearch && !query.isPlaceholderData,
    isError: query.isError && !query.data,
    refetch: query.refetch,
    updatedAt: query.dataUpdatedAt || undefined,
  };
}
