import { z } from "zod";

export const ShareExpiresInSchema = z.enum(["1h", "24h", "7d", "never"]);
export type ShareExpiresIn = z.infer<typeof ShareExpiresInSchema>;

export const ShareResourceTypeSchema = z.enum(["document", "backpack"]);
export type ShareResourceType = z.infer<typeof ShareResourceTypeSchema>;

export const ShareStatusFilterSchema = z.enum(["all", "active", "expired"]);
export type ShareStatusFilter = z.infer<typeof ShareStatusFilterSchema>;

export const ShareLinkStatusSchema = z.enum(["active", "expired"]);
export type ShareLinkStatus = z.infer<typeof ShareLinkStatusSchema>;

export const ShareCreateOptionsSchema = z.object({
    expiresIn: ShareExpiresInSchema.default("24h"),
});
export type ShareCreateOptions = z.infer<typeof ShareCreateOptionsSchema>;

export const ShareLinkSchema = z.object({
    linkId: z.string().uuid(),
    resourceType: ShareResourceTypeSchema,
    resourceId: z.string().uuid(),
    title: z.string(),
    documentCount: z.number().nullish(),
    shareUrl: z.string(),
    qrCodeUrl: z.string(),
    expiresAt: z.string().nullish(),
    createdAt: z.string(),
    status: ShareLinkStatusSchema,
    viewCount: z.number().nullish().transform((v) => v ?? 0),
    lastViewedAt: z.string().nullish(),
    canDownload: z
        .union([z.literal(false), z.literal(true), z.undefined()])
        .transform(() => false as const),
});
export type ShareLink = z.infer<typeof ShareLinkSchema>;

export const ShareResultSchema = z.object({
    shareUrl: z.string(),
    qrCodeUrl: z.string(),
    expiresAt: z.string().nullable(),
    existing: z.boolean().optional().default(false),
});
export type ShareResult = z.infer<typeof ShareResultSchema>;

export const SharedSignedUrlSchema = z.object({
    url: z.string(),
    canDownload: z.literal(false),
    contentDisposition: z.string(),
});
export type SharedSignedUrl = z.infer<typeof SharedSignedUrlSchema>;
