import type { QueryClient } from "@tanstack/react-query";

/** Query keys for backpack cache invalidation (keep in sync with `QK` in hooks.ts). */
export const backpackQueryKeys = {
    backpacksRoot: ["backpacks"] as const,
    backpack: (id: string) => ["backpack", id] as const,
    backpackDocsPrefix: (id: string) => ["backpack-docs", id] as const,
    backpackDocIds: (id: string) => ["backpack-doc-ids", id] as const,
    backpackDocsInfinite: (id: string, search = "", limit = 20) =>
        ["backpack-docs-infinite", id, search, limit] as const,
    documentsCatalogInfinite: (search = "", limit = 20) =>
        ["documents-catalog-infinite", search, limit] as const,
};

/** Invalidate all TanStack Query caches affected by backpack membership or counts. */
export function invalidateBackpackQueries(qc: QueryClient, backpackId: string): void {
    void qc.invalidateQueries({ queryKey: backpackQueryKeys.backpacksRoot });
    void qc.invalidateQueries({ queryKey: backpackQueryKeys.backpack(backpackId) });
    void qc.invalidateQueries({
        queryKey: backpackQueryKeys.backpackDocsPrefix(backpackId),
        exact: false,
    });
    void qc.invalidateQueries({ queryKey: backpackQueryKeys.backpackDocIds(backpackId) });
    void qc.invalidateQueries({
        queryKey: ["backpack-docs-infinite", backpackId],
        exact: false,
    });
}
