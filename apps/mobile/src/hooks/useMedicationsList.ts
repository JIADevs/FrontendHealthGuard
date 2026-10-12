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
  const [draftFilters, setDraftFilters] = useState<MedicationFilters>(EMPTY_MEDICATION_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const debouncedSearch = useDebounceSearch(search);

  const meds = useMedicationsQuery(debouncedSearch, page, PAGE_SIZE, appliedFilters);
  const treatmentsQuery = useTreatmentsQuery(1, 100);

  const hasActiveFilter = hasActiveMedicationFilters(appliedFilters);

  const openFilterSheet = useCallback(() => {
    setDraftFilters(appliedFilters);
    setFilterSheetVisible(true);
  }, [appliedFilters]);

  const closeFilterSheet = useCallback(() => {
    setFilterSheetVisible(false);
  }, []);

  const applyFilters = useCallback(() => {
    setAppliedFilters(draftFilters);
    setPage(1);
    setFilterSheetVisible(false);
  }, [draftFilters]);

  const clearDraftFilters = useCallback(() => {
    setDraftFilters(EMPTY_MEDICATION_FILTERS);
  }, []);

  useEffect(() => {
    if (filterSheetVisible) {
      setDraftFilters(appliedFilters);
    }
  }, [filterSheetVisible, appliedFilters]);

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
    isRefetching: meds.isRefetching,
    refetch: meds.refetch,
    treatments: treatmentsQuery.data?.items ?? [],
    draftFilters,
    setDraftFilters,
    clearDraftFilters,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasActiveFilter,
  };
}
