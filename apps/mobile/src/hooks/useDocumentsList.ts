import { useMemo, useState, useCallback, useEffect } from "react";
import { useDocumentsQuery, useTagCategoriesQuery } from "@helu/api/hooks";
import {
  useDebounceSearch,
  inferDocumentCategoryKey,
  DOCUMENT_QUICK_FILTER_KEYS,
} from "@helu/ui";
import type { Document } from "@helu/api";
import type { DocumentCategoryKey } from "@helu/ui";
import { groupDocumentsByDate } from "../components/documents/utils/groupDocumentsByDate";
import {
  EMPTY_DOCUMENT_FILTERS,
  getEffectiveDateRange,
  hasActiveDocumentFilters,
  documentMatchesTagFilters,
  type DocumentListFilters,
  type DocumentCategoryFilter,
  type TagCategoryOption,
} from "../components/documents/utils/documentListFilters";

export type { Document, DocumentListFilters, DocumentCategoryFilter };

const LIST_FETCH_LIMIT = 50;

function documentMatchesCategory(doc: Document, category: DocumentCategoryKey): boolean {
  const key = inferDocumentCategoryKey({
    documentTypeName: doc.documentType?.name,
    specialtyNames: doc.specialties.map((s) => s.name),
    subtypeNames: doc.subtypes.map((s) => s.name),
    format: doc.format,
  });
  return key === category;
}

export function useDocumentsList() {
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<DocumentListFilters>(EMPTY_DOCUMENT_FILTERS);
  const [draftFilters, setDraftFilters] = useState<DocumentListFilters>(EMPTY_DOCUMENT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const debouncedSearch = useDebounceSearch(search);

  const dateRange = useMemo(() => getEffectiveDateRange(appliedFilters), [appliedFilters]);

  const docs = useDocumentsQuery(
    debouncedSearch,
    1,
    LIST_FETCH_LIMIT,
    dateRange.startDate ?? null,
    dateRange.endDate ?? null,
  );

  const tagCatalog = useTagCategoriesQuery();

  const tagCategories = useMemo((): TagCategoryOption[] => {
    const raw = Array.isArray(tagCatalog.data) ? tagCatalog.data : [];
    return raw.map((cat) => ({
      id: cat.id,
      name: cat.name,
      values: (cat.values ?? []).map((v) => ({ id: v.id, value: v.value })),
    }));
  }, [tagCatalog.data]);

  const filteredItems = useMemo(() => {
    let items = docs.data?.items ?? [];

    if (appliedFilters.category) {
      items = items.filter((doc) => documentMatchesCategory(doc, appliedFilters.category!));
    }

    if (appliedFilters.tagFilters.length > 0) {
      items = items.filter((doc) =>
        documentMatchesTagFilters(
          doc.customTags.map((tag) => tag.id),
          appliedFilters.tagFilters,
        ),
      );
    }

    return items;
  }, [docs.data?.items, appliedFilters.category, appliedFilters.tagFilters]);

  const sections = useMemo(() => groupDocumentsByDate(filteredItems), [filteredItems]);

  const hasHiddenSelection =
    appliedFilters.category !== null &&
    !DOCUMENT_QUICK_FILTER_KEYS.includes(appliedFilters.category);

  const hasActiveFilter = hasActiveDocumentFilters(appliedFilters);

  const totalCount = hasActiveFilter
    ? filteredItems.length
    : (docs.data?.total ?? filteredItems.length);

  const openFilterSheet = useCallback(() => {
    setDraftFilters(appliedFilters);
    setFilterSheetVisible(true);
  }, [appliedFilters]);

  const closeFilterSheet = useCallback(() => {
    setFilterSheetVisible(false);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setFilterSheetVisible(false);
  }, [draftFilters]);

  const setCategoryFilter = useCallback((category: DocumentCategoryFilter) => {
    setAppliedFilters((prev) => ({ ...prev, category }));
  }, []);

  useEffect(() => {
    if (filterSheetVisible) {
      setDraftFilters(appliedFilters);
    }
  }, [filterSheetVisible, appliedFilters]);

  return {
    search,
    setSearch,
    debouncedSearch,
    appliedFilters,
    draftFilters,
    setDraftFilters,
    categoryFilter: appliedFilters.category,
    setCategoryFilter,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasHiddenSelection,
    hasActiveFilter,
    tagCategories,
    tagsLoading: tagCatalog.isLoading,
    sections,
    totalCount,
    isLoading: docs.isLoading && !docs.isRefetching,
    isRefetching: docs.isRefetching,
    refetch: docs.refetch,
  };
}
