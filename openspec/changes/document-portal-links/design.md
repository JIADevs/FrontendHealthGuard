# Design: Document Portal Links + Description

> Canonical cross-repo design. Backend mirror: `BackendHealthGuard/openspec/changes/document-portal-links/design.md`.

## Technical Approach

Single-table extension (exploration Approach 1). `documents` gains an explicit `kind` (`FILE` | `LINK`) discriminator plus nullable `portal_url` / `portal_username` / `portal_password_encrypted`; `file_url`, `format`, `file_size_bytes` become nullable. The password is encrypted at rest with Fernet and decrypted on read for the owner. No parallel resource, no new endpoint namespace — `LINK` rows keep classification, tags, backpacks, search, pagination and sharing for free.

Frontend branches on `kind` at three points: create (skip upload + AI classify), detail (skip `getSignedUrl`, render portal card), edit (skip signed-url prefetch, echo the inactive side back). `description` is pure UI wiring — the field already exists end-to-end.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Kind signal | Explicit `kind` column | Sniff `http(s)://` prefix on `file_url` | Indexable, filterable, no magic strings; sniffing already caused the 403 class of bug |
| Password storage | Fernet in `app/core/encryption.py`, key from `settings` | Reuse `bcrypt` from `core/security.py` | bcrypt is one-way; the user must read the password back |
| Kind conversion | `PUT /documents/{id}` with inactive-side **coalesce guard** in `update_with_owner` | New `PATCH` endpoint | PUT already exists and is the only write path the frontend uses; a new verb adds contract surface for one field |
| Case mapping | Pure snake_case Pydantic, camelCase Zod | `Field(alias="portalUrl")` | The Axios client already snakelizes requests and camelizes responses (`packages/api/src/client.ts`); adding aliases would double-convert |
| Create entry point | Type toggle inside `DocumentUploadScreen` | Third option in `DocumentsAddSheet` | Locked product decision: one screen, one toggle ("Archivo" / "Resultado de examen virtual") |
| Link progress UI | Reuse `uploading` flag, leave `uploadProgress` null | New `creatingLink` state | Existing spinners and disabled states keep working with zero screen changes |

## Data Flow

Create (LINK):

    Toggle(LINK) ─→ DocumentPortalForm ─→ handleCreateLink()
                                              │  no upload, no classify
                                              ↓
                                     POST /documents/ {kind:"LINK", portalUrl, ...}
                                              ↓
                                     encrypt password ─→ documents row
                                              ↓
                        invalidate ["documents"] ─→ success toast ─→ goBack()

Detail (LINK): `useDocumentDetail` sets `isLink` → `signedUrlQuery.enabled = false` → screen renders `DocumentDetailPortalCard` (open portal via `Linking.openURL`, masked password with reveal/hide + copy) instead of `DocumentDetailPreview` + `DocumentDetailOpenExternal`.

## File Changes

### `packages/api` (shared contract)

| File | Action | Description |
|---|---|---|
| `src/schemas.ts` | Modify | `DocumentKindSchema = z.enum(["FILE","LINK"])`. `DocumentSchema`: add `kind` (default `"FILE"`), `portalUrl` / `portalUsername` / `portalPassword` nullable-optional; **make `fileUrl` and `format` nullable-optional** (breaking for unguarded readers). `DocumentCreateSchema`: same fields, `fileUrl`/`format` optional, `superRefine` — `LINK` requires `portalUrl`, `FILE` requires `fileUrl` + `format` |
| `src/useDocumentFormCore.ts` | Modify | Add `description` + `setDescription` to state/actions and pass it to `createDocument`. Add `handleCreateLink({ portalUrl, portalUsername, portalPassword, docDate, treatmentId })`: no `adapters.upload`, no `adapters.classify`; reuses the same backpack attach, query invalidation, `onUploadSuccess` / `onError` / `onUploadComplete` path as `handleUpload` |
| `src/endpoints.ts` | None | `createDocument` / `updateDocument` already take `DocumentCreate`; the widened schema flows through |

### `packages/ui`

| File | Action | Description |
|---|---|---|
| `src/utils/documentTypes.ts` | Modify | Add `isLinkDocument(kind?: string \| null)`. `DocFormat` stays file-only — a link has no format; do not add a `"link"` member to `DocFormat` |

### `apps/mobile`

| File | Action | Description |
|---|---|---|
| `src/components/documents/DocumentKindToggle.tsx` | Create | Two-segment control, "Archivo" / "Resultado de examen virtual" |
| `src/components/documents/DocumentPortalForm.tsx` | Create | URL (required), username, password (optional), password field with reveal/hide |
| `src/components/documents/DocumentDescriptionField.tsx` | Create | Multiline description input, used by both kinds |
| `src/components/documents/DocumentDetailPortalCard.tsx` | Create | "Abrir portal" action + credential rows with reveal/hide and copy-to-clipboard |
| `src/components/documents/index.ts` | Modify | Export the four new components |
| `src/components/DocumentClassificationForm.tsx` | Modify | Render `DocumentDescriptionField` under the title field |
| `src/hooks/useDocumentDetail.ts` | Modify | Derive `isLink`; `signedUrlQuery.enabled = !isLink && !!document?.fileUrl` |
| `src/screens/DocumentUploadScreen.tsx` | Modify | `kind` state; auto-open picker effect gated on `kind === "FILE"`; toggle rendered in the empty-picker and LINK states; LINK submit calls `handleCreateLink` |
| `src/screens/DocumentEditScreen.tsx` | Modify | Toggle for conversion; prefill portal fields and description; gate `signedUrlQuery` and `resolveClassifyFileSource` on `!isLink`; payload echoes the inactive side back |
| `src/screens/DocumentDetailScreen.tsx` | Modify | Branch: `isLink` → `DocumentDetailPortalCard`, else current preview + open-external |
| `src/utils/openDocumentInExternalApp.ts` | None | Not reachable for links; the portal card uses `Linking.openURL` directly |

### `apps/web` — `[web-deferred]`

Only one non-deferred guard: `src/app/share/doc/page.tsx` must tolerate `fileUrl === null` (skip the signed-url call for `kind === "LINK"`). Full web parity — toggle, portal form, portal detail — is deferred and will reuse `useDocumentFormCore` plus the mobile module components as reference.

## Interfaces / Contracts

```ts
// packages/api/src/schemas.ts
export const DocumentKindSchema = z.enum(["FILE", "LINK"]);

// added to DocumentSchema and DocumentCreateSchema
kind: DocumentKindSchema.default("FILE"),
portalUrl: z.string().url().nullable().optional(),
portalUsername: z.string().nullable().optional(),
portalPassword: z.string().nullable().optional(),
```

`DocumentCreateSchema.superRefine`: `kind === "LINK"` → `portalUrl` required; `kind === "FILE"` → `fileUrl` and `format` required.

**Retention contract (both sides).** `PUT /documents/{id}` is a full replace for the *active* side only. The inactive side is never nulled: the edit screen echoes the stored values back, and `update_with_owner` coalesces any `None` inactive-side field to its stored value. Sending `portalPassword: ""` is the explicit clear signal.

## Mutation Feedback

Per `frontend-mutation-feedback`: link create reuses `uploading` (spinner on the confirm button) and the existing success/error toasts. Edit save reuses `saving` plus its existing toasts. Description-only edits follow the same path. No success toast is added for query refetches or invalidations.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Contract | Zod parse of a `LINK` document (null `fileUrl`) and a `FILE` document | Type-check via `pnpm exec tsc --noEmit -p apps/mobile` |
| Manual | Create link → list → detail → open portal → reveal password → edit → convert to FILE → confirm credentials survive | Device walkthrough against the migrated backend |
| Backend | Link CRUD, conversion retention, `/files/url` external branch, share omits password | pytest — see backend design |

## Migration / Rollout

Backend migration lands first (`s8t9u0v1w013` → new head). New columns are nullable and `kind` backfills to `FILE`, so the current mobile build keeps working untouched. Frontend ships after the API is deployed.

## Delivery Note (`ask-on-risk`)

Estimated changed lines ≈ **700–800**, over the 400-line review budget. Recommended chain of three autonomous slices:

1. **Backend** — model, encryption util, schemas, CRUD, migration, endpoints, pytest.
2. **Shared contract** — `packages/api` schemas + `useDocumentFormCore` + `packages/ui` helper.
3. **Mobile UI** — the four module components + upload/edit/detail screens.

`Decision needed before apply: Yes` — orchestrator must confirm chained PRs before `sdd-apply`.

## Open Questions

- [ ] Which environments already have a Fernet key provisioned? Deploy blocks without `CREDENTIAL_ENCRYPTION_KEY`.
- [ ] Should `LINK` documents be excluded from the `imaging`/`laboratory` category inference that reads `format`? Currently they fall through to `default`, which is acceptable.
