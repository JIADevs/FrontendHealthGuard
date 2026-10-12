import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
    extendShare,
    listShares,
    revokeShare,
    shareBackpackWithOptions,
    shareDocumentWithOptions,
} from "./endpoints";
import type { ShareCreateOptions, ShareLink, ShareResourceType, ShareStatusFilter } from "./schemas";

export const shareQK = {
    all: () => ["shares"] as const,
    list: (status: ShareStatusFilter = "all") => ["shares", status] as const,
};

export function invalidateShareQueries(qc: ReturnType<typeof useQueryClient>) {
    qc.invalidateQueries({ queryKey: shareQK.all() });
    qc.invalidateQueries({ queryKey: ["document-shares-active"] });
}

export function useSharesQuery(status: ShareStatusFilter = "all") {
    return useQuery({
        queryKey: shareQK.list(status),
        queryFn: () => listShares(status),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

/** Historial unificado: una sola petición `all` + filtro en cliente (evita spinner al cambiar tabs). */
export function useShareHistoryQuery() {
    return useQuery({
        queryKey: shareQK.list("all"),
        queryFn: () => listShares("all"),
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
}

export function useShareDocumentMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (
            input: string | { documentId: string; expiresIn?: ShareCreateOptions["expiresIn"] },
        ) => {
            if (typeof input === "string") {
                return shareDocumentWithOptions(input, { expiresIn: "24h" });
            }
            return shareDocumentWithOptions(input.documentId, { expiresIn: input.expiresIn ?? "24h" });
        },
        onSettled: () => invalidateShareQueries(qc),
    });
}

export function useShareBackpackMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (
            input: string | { backpackId: string; expiresIn?: ShareCreateOptions["expiresIn"] },
        ) => {
            if (typeof input === "string") {
                return shareBackpackWithOptions(input, { expiresIn: "24h" });
            }
            return shareBackpackWithOptions(input.backpackId, { expiresIn: input.expiresIn ?? "24h" });
        },
        onSettled: () => invalidateShareQueries(qc),
    });
}

export function useRevokeShareMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ linkId, resourceType }: { linkId: string; resourceType: ShareResourceType }) =>
            revokeShare(linkId, resourceType),
        onSuccess: (_, { linkId }) => {
            qc.setQueriesData<ShareLink[]>({ queryKey: shareQK.all() }, (old) =>
                old ? old.filter((row) => row.linkId !== linkId) : old,
            );
            invalidateShareQueries(qc);
        },
    });
}

export function useExtendShareMutation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ linkId, resourceType }: { linkId: string; resourceType: ShareResourceType }) =>
            extendShare(linkId, resourceType),
        onSettled: () => invalidateShareQueries(qc),
    });
}
