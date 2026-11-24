import { useCallback, useEffect, useState } from "react";
import { useMedicationsQuery, useTreatmentsQuery, type MedicationFilters } from "@helu/api/hooks";
import { useDebounceSearch } from "@helu/ui";

export type { MedicationFilters };

const EMPTY_MEDICATION_FILTERS: MedicationFilters = {};
const PAGE_SIZE = 10;

export function hasActiveMedicationFilters(filters: MedicationFilters): boolean {
  return Object.values(filters).some((v) => !!v);
}

export function useMedicationsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<MedicationFilters>(EMPTY_MEDICATION_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const debouncedSearch = useDebounceSearch(search);

  const meds = useMedicationsQuery(debouncedSearch, page, PAGE_SIZE, appliedFilters);
  const treatmentsQuery = useTreatmentsQuery(1, 100);

  const hasActiveFilter = hasActiveMedicationFilters(appliedFilters);

  const openFilterSheet = useCallback(() => setFilterSheetVisible(true), []);
  const closeFilterSheet = useCallback(() => setFilterSheetVisible(false), []);

  /** The sheet keeps its own draft; nothing applies until «Aplicar filtros». */
  const applyFilters = useCallback((next: MedicationFilters) => {
    setAppliedFilters(next);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => applyFilters(EMPTY_MEDICATION_FILTERS), [applyFilters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return {
    page,
    setPage,
    search,
    setSearch,
    items: meds.data?.items ?? [],
    totalPages: meds.data?.totalPages ?? 1,
    isLoading: meds.isLoading,
    isError: meds.isError && !meds.data,
    isRefetching: meds.isRefetching,
    refetch: meds.refetch,
    updatedAt: meds.dataUpdatedAt || undefined,
    treatments: treatmentsQuery.data?.items ?? [],
    filters: appliedFilters,
    clearFilters,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasActiveFilter,
  };
}
