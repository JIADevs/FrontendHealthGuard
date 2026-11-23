import { useCallback, useEffect, useState } from "react";
import {
  useAppointmentsQuery,
  useAppointmentOptionsQuery,
  useDoctorsQuery,
  useTreatmentsQuery,
  type AppointmentFilters,
} from "@helu/api/hooks";
import { useDebounceSearch } from "@helu/ui";

export type { AppointmentFilters };

const EMPTY_APPOINTMENT_FILTERS: AppointmentFilters = {};
const PAGE_SIZE = 10;

export function hasActiveAppointmentFilters(filters: AppointmentFilters): boolean {
  return Object.values(filters).some((v) => !!v);
}

export function useAppointmentsList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<AppointmentFilters>(EMPTY_APPOINTMENT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);

  const debouncedSearch = useDebounceSearch(search);

  const appts = useAppointmentsQuery(debouncedSearch, page, PAGE_SIZE, undefined, undefined, appliedFilters);
  const doctorsQuery = useDoctorsQuery("", 1, 100);
  const treatmentsQuery = useTreatmentsQuery(1, 100);
  const optionsQuery = useAppointmentOptionsQuery();

  const hasActiveFilter = hasActiveAppointmentFilters(appliedFilters);

  const openFilterSheet = useCallback(() => setFilterSheetVisible(true), []);
  const closeFilterSheet = useCallback(() => setFilterSheetVisible(false), []);

  /** The sheet keeps its own draft; nothing applies until «Aplicar filtros». */
  const applyFilters = useCallback((next: AppointmentFilters) => {
    setAppliedFilters(next);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => applyFilters(EMPTY_APPOINTMENT_FILTERS), [applyFilters]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  return {
    page,
    setPage,
    search,
    setSearch,
    appts,
    doctors: doctorsQuery.data?.items ?? [],
    treatments: treatmentsQuery.data?.items ?? [],
    specialties: optionsQuery.data?.specialties ?? [],
    filters: appliedFilters,
    clearFilters,
    filterSheetVisible,
    openFilterSheet,
    closeFilterSheet,
    applyFilters,
    hasActiveFilter,
  };
}
