import { useMemo, useState, useCallback } from "react";
import { useDocumentsQuery, useTagCategoriesQuery } from "@helu/api/hooks";
import { useDebounceSearch } from "@helu/ui";
import type { Document } from "@helu/api";
import { groupDocumentsByDate } from "../components/documents/utils/groupDocumentsByDate";
import {
  EMPTY_DOCUMENT_FILTERS,
  applyClientFilters,
  hasActiveDocumentFilters,
  type DocumentListFilters,
  type TagCategoryOption,
} from "../components/documents/utils/documentListFilters";
import type { DocumentCategory } from "../components/documents/documentCategories";

export type { Document, DocumentListFilters };

/** The API has no category filter, so the list loads one large page and filters on the client. */
const LIST_FETCH_LIMIT = 100;

export function useDocumentsList() {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<DocumentListFilters>(EMPTY_DOCUMENT_FILTERS);
  const debouncedSearch = useDebounceSearch(search);

  const docs = useDocumentsQuery(debouncedSearch, 1, LIST_FETCH_LIMIT, filters.startDate, filters.endDate);
  // Every document, for «Búsqueda sin resultados» (related tags and «¿Quisiste decir…?»). Same key
  // as the unfiltered list, so it is usually already cached.
  const allDocs = useDocumentsQuery("", 1, LIST_FETCH_LIMIT, null, null);
  const tagCatalog = useTagCategoriesQuery();

  const tagCategories = useMemo((): TagCategoryOption[] => {
    const raw = Array.isArray(tagCatalog.data) ? tagCatalog.data : [];
    return raw.map((cat) => ({
      id: cat.id,
      name: cat.name,
      values: (cat.values ?? []).map((v: { id: string; value: string }) => ({ id: v.id, value: v.value })),
    }));
  }, [tagCatalog.data]);

  const valueToCategory = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of tagCategories) for (const v of cat.values) map.set(v.id, cat.id);
    return map;
  }, [tagCategories]);

  const loaded = useMemo(() => docs.data?.items ?? [], [docs.data?.items]);
  const items = useMemo(() => applyClientFilters(loaded, filters, valueToCategory), [loaded, filters, valueToCategory]);
  const sections = useMemo(() => groupDocumentsByDate(items), [items]);

  /** Quick row: one category or «Todos». */
  const quickCategory: DocumentCategory | "all" | null =
    filters.categories.length === 0 ? "all" : filters.categories.length === 1 ? filters.categories[0]! : null;

  const setQuickCategory = useCallback((value: DocumentCategory | "all") => {
    setFilters((prev) => ({ ...prev, categories: value === "all" ? [] : [value] }));
  }, []);

  /** How many loaded documents a draft would show (dates are only known for the applied range). */
  const countFor = useCallback(
    (draft: DocumentListFilters) => applyClientFilters(loaded, draft, valueToCategory).length,
    [loaded, valueToCategory],
  );

  return {
    search,
    setSearch,
    debouncedSearch,
    filters,
    setFilters,
    quickCategory,
    setQuickCategory,
    hasActiveFilter: hasActiveDocumentFilters(filters),
    countFor,
    tagCategories,
    tagsLoading: tagCatalog.isLoading,
    items,
    sections,
    allDocuments: allDocs.data?.items ?? [],
    isLoading: docs.isLoading,
    /** False while typing or while the next search is on its way: no «sin resultados» flash. */
    settled: !docs.isPlaceholderData && search === debouncedSearch,
    refetch: docs.refetch,
    updatedAt: docs.dataUpdatedAt || undefined,
  };
}
