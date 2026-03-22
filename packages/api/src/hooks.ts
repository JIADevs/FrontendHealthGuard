import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { getDocuments, getBackpacks, getBackpackDocuments } from "./endpoints";

export function useDocumentsQuery(search: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["documents", page, search],
    queryFn: () => getDocuments({ page, limit, searchQuery: search || undefined }),
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });
}

export function useBackpacksQuery(search: string, limit = 20) {
  return useQuery({
    queryKey: ["backpacks", search],
    queryFn: () => getBackpacks({ page: 1, limit, searchQuery: search || undefined }),
    staleTime: 5_000,
    placeholderData: keepPreviousData,
  });
}

export function useBackpackDocumentsQuery(
  backpackId: string,
  search: string,
  page = 1,
  limit = 20,
) {
  return useQuery({
    queryKey: ["backpack-docs", backpackId, page, search],
    queryFn: () => getBackpackDocuments({ backpackId, page, limit, searchQuery: search || undefined }),
    enabled: !!backpackId,
    staleTime: 5_000,
  });
}
