import { useInfiniteQuery } from "@tanstack/react-query";
import { getBackpackDocuments, getDocuments } from "./endpoints";
import { backpackQueryKeys } from "./backpackQueryUtils";

export const BACKPACK_DOCUMENTS_PAGE_SIZE = 20;

export function useInfiniteBackpackDocuments(
    backpackId: string,
    search = "",
    limit = BACKPACK_DOCUMENTS_PAGE_SIZE,
) {
    return useInfiniteQuery({
        queryKey: backpackQueryKeys.backpackDocsInfinite(backpackId, search, limit),
        queryFn: ({ pageParam = 1 }) =>
            getBackpackDocuments({
                backpackId,
                page: pageParam as number,
                limit,
                searchQuery: search || undefined,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const fetched = allPages.length * limit;
            return fetched < lastPage.total ? allPages.length + 1 : undefined;
        },
        enabled: !!backpackId,
        staleTime: 5_000,
    });
}

export function useInfiniteDocumentsCatalog(
    search = "",
    limit = BACKPACK_DOCUMENTS_PAGE_SIZE,
) {
    return useInfiniteQuery({
        queryKey: backpackQueryKeys.documentsCatalogInfinite(search, limit),
        queryFn: ({ pageParam = 1 }) =>
            getDocuments({
                page: pageParam as number,
                limit,
                searchQuery: search || undefined,
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage, allPages) => {
            const fetched = allPages.length * limit;
            return fetched < lastPage.total ? allPages.length + 1 : undefined;
        },
        staleTime: 5_000,
    });
}
