import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getDocuments, type Document } from "@helu/api";
import { useDebounceSearch } from "@helu/ui";
import { categoryOf, type DocumentCategory } from "../components/documents/documentCategories";

/** Largest page the API serves; most accounts fit in one. */
const PAGE_SIZE = 100;
const STALE_TIME_MS = 5 * 60 * 1000;

function fold(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function matches(doc: Document, query: string): boolean {
  const haystack = fold([doc.title, doc.description ?? "", ...doc.customTags.map((tag) => tag.value)].join(" "));
  return fold(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
}

/**
 * Documents to pick for a backpack (Nueva mochila, Agregar documentos) and for Compartir, loaded
 * page by page (#70): the list asks for the next page when it reaches the end. Search and category
 * run on the client over what is loaded, so typing never waits on the server; while a filter is on,
 * the remaining pages load in the background so it covers every document.
 */
export function usePickableDocuments() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<DocumentCategory | "all">("all");
  const debouncedSearch = useDebounceSearch(search);
  const query = useInfiniteQuery({
    // Under ["documents"], so every document mutation that invalidates the lists refreshes this too.
    queryKey: ["documents", "pickable", PAGE_SIZE],
    queryFn: ({ pageParam }) => getDocuments({ page: pageParam, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: STALE_TIME_MS,
  });
  const all = useMemo(() => (query.data?.pages.flatMap((p) => p.items) ?? []) as Document[], [query.data]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filtering = debouncedSearch.trim().length > 0 || category !== "all";
  useEffect(() => {
    if (filtering) loadMore();
  }, [filtering, loadMore]);

  const items = useMemo(() => {
    const q = debouncedSearch.trim();
    return all.filter((doc) => (category === "all" || categoryOf(doc) === category) && (!q || matches(doc, q)));
  }, [all, debouncedSearch, category]);

  return {
    search,
    setSearch,
    debouncedSearch,
    category,
    setCategory,
    items,
    /** Every loaded document, filters aside: look selections up here so a search never drops one. */
    loaded: all,
    /** Loaded count, to tell «no documents at all» from «nothing matches». */
    total: all.length,
    isLoading: query.isLoading,
    isError: query.isError && !query.data,
    refetch: query.refetch,
    loadMore,
    isLoadingMore: isFetchingNextPage,
    /** More pages to load: hold «nothing matches» until the filter has seen every document. */
    hasMore: !!hasNextPage,
  };
}
