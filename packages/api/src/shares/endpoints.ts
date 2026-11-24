import { z } from "zod";
import { apiClient } from "../client";
import {
    ShareCreateOptions,
    ShareCreateOptionsSchema,
    ShareLinkSchema,
    ShareResultSchema,
    ShareStatusFilter,
    ShareResourceType,
    SharedBackpackSchema,
    SharedSignedUrlSchema,
} from "./schemas";

export async function listShares(status: ShareStatusFilter = "all") {
    const { data } = await apiClient.get("/shares", { params: { status } });
    const parsed = z.array(ShareLinkSchema).safeParse(data);
    if (!parsed.success) {
        throw new Error(`Respuesta inválida del servidor: ${parsed.error.issues[0]?.message ?? "formato incorrecto"}`);
    }
    return parsed.data;
}

export async function revokeShare(linkId: string, resourceType: ShareResourceType) {
    await apiClient.delete(`/shares/${linkId}`, { params: { resource_type: resourceType } });
}

export async function extendShare(linkId: string, resourceType: ShareResourceType) {
    const { data } = await apiClient.post(`/shares/${linkId}/extend`, null, {
        params: { resource_type: resourceType },
    });
    return ShareLinkSchema.parse(data);
}

export async function shareDocumentWithOptions(documentId: string, options: ShareCreateOptions = ShareCreateOptionsSchema.parse({})) {
    const { data } = await apiClient.post(`/documents/${documentId}/share`, {
        expires_in: options.expiresIn,
    });
    return ShareResultSchema.parse(data);
}

export async function shareBackpackWithOptions(backpackId: string, options: ShareCreateOptions = ShareCreateOptionsSchema.parse({})) {
    const { data } = await apiClient.post(`/backpacks/${backpackId}/share`, {
        expires_in: options.expiresIn,
    });
    return ShareResultSchema.parse(data);
}

export async function getSharedDocumentSignedUrlViewOnly(token: string, expiresInSeconds = 3600) {
    const { data } = await apiClient.get("/documents/shared/signed-url", {
        params: { token, expires_in: expiresInSeconds },
    });
    return SharedSignedUrlSchema.parse(data);
}

/** Public backpack share (no auth; the token is the capability). Expired → 400, revoked → 404. */
export async function consumeSharedBackpack(token: string) {
    const { data } = await apiClient.get("/backpacks/shared/consume", { params: { token } });
    return SharedBackpackSchema.parse(data);
}

/** View-only URL for one document of a shared backpack. */
export async function getSharedBackpackDocumentUrl(token: string, documentId: string, expiresInSeconds = 3600) {
    const { data } = await apiClient.get("/backpacks/shared/signed-url", {
        params: { token, document_id: documentId, expires_in: expiresInSeconds },
    });
    return SharedSignedUrlSchema.parse(data);
}
