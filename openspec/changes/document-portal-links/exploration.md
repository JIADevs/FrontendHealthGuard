## Exploration: Document Portal Links (link + credentials document variant) & description field for all documents

### Current State

**Data model (BackendHealthGuard).**
`Document` (`app/models/document.py`) is a single table used for every medical record, regardless of file type:
- `title`, `description` (Text, nullable — **already exists**), `file_url` (String, required), `format` (String, required, holds a MIME type like `application/pdf`), `file_size_bytes` (nullable), `document_date`, `uploaded_at`, `treatment_id` FK, plus M2M classification (`type_id` → `DocumentType`, `subtypes`, `specialties`, `custom_tags`).
- There is **no discriminator column** (e.g. `kind`/`source_type`) distinguishing "uploaded file" vs. any other origin. The app infers a coarse `DocFormat` (`"pdf" | "image" | "other"`) purely from the `format` string via `resolveDocFormat()` (`packages/ui/src/utils/documentTypes.ts`).
- `Backpack` (`app/models/backpack.py`) is a folder of `Document`s via the `backpack_has_document` M2M table and **already has its own `description` column** — backpacks and documents are independent concepts that happen to share the "description" field name.

**Description field — already exists, not wired to the UI.**
- Backend: `DocumentBase.description: Optional[str] = None` (`app/schemas/document.py`) is already accepted by `DocumentCreate`/returned by `DocumentInDBBase`, and `crud_document.create_with_owner` / `update_with_owner` already persist it.
- Frontend: `DocumentSchema.description` and `DocumentCreateSchema.description` already exist in `packages/api/src/schemas.ts`.
- **The gap is 100% front-end UI/UX**: `useDocumentFormCore` (`packages/api/src/useDocumentFormCore.ts`) has no `description` field in its state, no setter, and its `createDocument({...})` call never passes `description`. `DocumentUploadScreen`/`DocumentEditScreen` never render a description input. So today a user can never actually type a description for a document, even though the plumbing to store/return it is complete end-to-end.
- Interesting existing hook: `DocumentDetailPreview.tsx` already has a **fallback render path** — when a document is neither an image nor a PDF, it renders `description` as a "report" text block (title + date + body) instead of "no preview available". This was clearly built anticipating non-file documents, but nothing currently produces `description` content to fill it.

**File upload & viewing pipeline.**
- `POST /files/upload` (`app/api/api_v1/endpoints/files.py`) stores bytes via the `StorageService` ABC (Supabase/S3 impl) and returns a `storage_path`, which becomes `Document.file_url`.
- Viewing inside the app always goes through `GET /files/url?path=...` (`get_file_url`), called by the frontend's `getSignedUrl()` and consumed unconditionally by `useDocumentDetail` whenever `document.fileUrl` is truthy. This endpoint **enforces `path.startswith(f"{current_user.id}/")`** and has no handling for external URLs — it would `403` if `file_url` were ever a raw `https://hospital-portal.com/...` link.
- Contrast: the **public share flow** (`shared_document_signed_url` in `documents.py`) already special-cases this — `if path.startswith("http://") or path.startswith("https://"): return {"url": path, ...}`. So the codebase already has precedent for "file_url can be an external URL," but only on the anonymous share path, not on the authenticated in-app viewing path used every day.
- `openDocumentInExternalApp.ts` (mobile) downloads the file bytes from a signed URL and opens them via `IntentLauncher`/`Sharing` — this logic assumes a downloadable binary and is not applicable to a portal link (you don't "download" a login page).

**AI classification.** `POST /documents/classify` reads uploaded file bytes and returns a `ClassificationSuggestion` (type/subtype/specialty/tags). It requires an actual file and cannot run against a link-only document — the new flow needs a manual-classification path that skips this step.

**Backpacks & sharing integrate for free — with a caveat.** Because backpacks reference `Document` by ID, any new `Document` (including a link-type one) automatically works with `POST /backpacks/{id}/documents`. But `POST /documents/{id}/share` generates a public, unauthenticated QR/link to view the document — sharing a document whose payload is itself a **hospital portal URL + password** has materially different risk than sharing a PDF; this needs an explicit product decision (see Risks).

**Credentials / sensitive data storage — no existing pattern.** The only "password" handling in the codebase is `app/core/security.py` (`bcrypt.hashpw`/`checkpw`) for user login — a **one-way hash**, unusable here because the app must later display the plaintext hospital password back to the user so they can log into the portal. There is no `cryptography`/`Fernet`/reversible-encryption utility anywhere in `BackendHealthGuard`. This is a genuinely new capability, not a reuse of an existing pattern.

**Frontend structure — actual repo diverges from the generic skills.** `packages/features/src/*` (described in the `feature-module`/`code-conventions` skills) does **not exist** in `FrontendHealthGuard`. The real, current convention (confirmed via `openspec/config.yaml`) is:
- Shared logic + Zod schemas: `packages/api/src/schemas.ts` and `packages/api/src/use*Core.ts` (platform-agnostic core hooks with an `adapters` injection pattern, e.g. `useDocumentFormCore<TFile>`).
- Feature UI: `apps/mobile/src/components/{module}/` (e.g. `apps/mobile/src/components/documents/`), with screens as thin wrappers under `apps/mobile/src/screens/`.
- Platform adapters: `apps/mobile/src/hooks/useDocumentForm.ts` and `apps/web/src/hooks/useDocumentForm.ts` both wrap the same `useDocumentFormCore`.
- Web is explicitly deferred/mobile-first per `openspec/config.yaml` ("Out of scope (unless explicit): apps/web").
This matters for the design phase: proposal/design/tasks must follow the *actual* repo pattern (`useDocumentFormCore` + `apps/mobile/src/components/documents/`), not the generic `packages/features` structure from the general skills.

**Entry point for creating a document.** `DocumentsAddSheet.tsx` (mobile) currently offers exactly two actions — "Subir documento" (file picker) and "Escanear" (camera) — both funnel into the same `handleUpload()` path in `useDocumentFormCore`, which always requires a `TFile` and always calls `adapters.upload()`. A "Add portal link" entry would need a third sheet option plus a parallel, file-less creation path in the core hook (skip upload + classify, POST straight to `/documents/` with title/description/credentials/type).

**Repo/OpenSpec conventions confirmed.** Both `BackendHealthGuard/openspec/changes/` and `FrontendHealthGuard/openspec/changes/` contain folders with the **same change name** for cross-repo changes (e.g. `refactor-share-module`, `fix-backpacks-module-bugs` exist in both repos). `BackendHealthGuard/openspec/config.yaml` states explicitly: *"Cross-repo SDD: same change-name as frontend; backend owns api/ specs only."* This exploration was written to the frontend path per the task's explicit instruction; the propose phase should mirror a `document-portal-links` folder into `BackendHealthGuard/openspec/changes/` as well, since this change clearly needs backend model/schema/endpoint work (new columns + encryption + migration chained onto the current head `s8t9u0v1w013_add_notification_data.py`).

### Affected Areas

- `BackendHealthGuard/app/models/document.py` — needs a discriminator (e.g. `kind: Literal["FILE","LINK"]`) and encrypted-credential columns (or a related 1:1 table) if the link variant is modeled as an extension of `Document`.
- `BackendHealthGuard/app/schemas/document.py` — `DocumentBase`/`DocumentCreate`/`DocumentUpdate`/response schemas need new optional fields for link/credentials; response schema must never return the raw password unless the current user is the owner requesting it explicitly (need to decide masking behavior).
- `BackendHealthGuard/app/crud/crud_document.py` — `create_with_owner`/`update_with_owner` need to encrypt-on-write and decrypt-on-read (or expose a separate "reveal credentials" path) for the new fields.
- `BackendHealthGuard/app/core/security.py` (or a new `app/core/encryption.py`) — needs a **new reversible encryption utility** (e.g. Fernet with a key from `settings`), since `bcrypt` cannot be reused for retrievable secrets.
- `BackendHealthGuard/app/api/api_v1/endpoints/files.py` (`get_file_url`) — must special-case external `http(s)://` URLs the same way `shared_document_signed_url` already does, or the in-app viewer will `403` on link documents.
- `BackendHealthGuard/alembic/versions/` — new migration chained on `s8t9u0v1w013` (current head) adding the new column(s).
- `FrontendHealthGuard/packages/api/src/schemas.ts` — `DocumentSchema`/`DocumentCreateSchema` need the new fields (mirroring backend aliases exactly, per `backend-contract` skill).
- `FrontendHealthGuard/packages/api/src/useDocumentFormCore.ts` — needs a `description` field in state (wire into existing gap) and a new file-less creation path (or a sibling hook) for link documents that skips `adapters.upload`/`adapters.classify`.
- `FrontendHealthGuard/apps/mobile/src/components/documents/DocumentsAddSheet.tsx` — needs a third option ("Agregar enlace de portal" or similar).
- `FrontendHealthGuard/apps/mobile/src/hooks/useDocumentForm.ts`, `apps/mobile/src/screens/DocumentUploadScreen.tsx`, `DocumentEditScreen.tsx` — need a new form variant/branch for link+credentials, and a `description` input for both variants.
- `FrontendHealthGuard/apps/mobile/src/hooks/useDocumentDetail.ts` + `DocumentDetailPreview.tsx` — the unconditional `getSignedUrl(document.fileUrl)` call must be skipped/branched for link documents; the preview must render an "Open portal" action + masked credentials + reveal/copy affordance instead of image/PDF/text-report.
- `FrontendHealthGuard/apps/mobile/src/utils/openDocumentInExternalApp.ts` — not reusable for links (assumes downloadable bytes); a link document should just open `Linking.openURL(fileUrl or a dedicated field)` in-browser.
- `FrontendHealthGuard/packages/ui/src/utils/documentTypes.ts` (`DocFormat`) — may need a third-ish concept; a link is not a "format" at all, so this likely needs a `kind`/`isLink` check independent of `DocFormat`.
- `FrontendHealthGuard/apps/web/src/hooks/useDocumentForm.ts` — out of scope by default per `openspec/config.yaml` ("mobile-first... Out of scope (unless explicit): apps/web") unless the user explicitly asks for web parity.
- Document sharing (`app/api/api_v1/endpoints/documents.py` share/consume endpoints, `DocumentShareLink`) — product decision needed on whether link-type documents can be shared publicly at all, since the payload is itself a portal URL + password.

### Approaches

1. **Extend `Document` with nullable link/credential columns (single-table)** — add `kind` (`FILE`|`LINK`), `portal_url`, `portal_username`, `portal_password_encrypted` directly on `documents`; keep `file_url`/`format`/`file_size_bytes` nullable for link rows.
   - Pros: Minimal new plumbing — reuses the entire existing Document CRUD, backpacks linkage, tags/classification, list/search/pagination, and sharing endpoints "for free." Single schema/CRUD/endpoint to touch. Fastest to ship.
   - Cons: `documents` table becomes a wide table with fields that are meaningless for the other kind (`file_url` NULL for links, `portal_*` NULL for files) — some sparse-column smell. Every place that reads `document.format`/`document.file_url` unconditionally (list preview, external-open, share) needs a `kind` guard added.
   - Effort: Medium (backend: 1 migration + schema/CRUD tweaks + 1 new encryption util; frontend: schema + 1 new form branch + 1 new detail-preview branch + 1 new sheet option).

2. **Separate `DocumentPortalLink` table, 1:1 or standalone, linked to `Document` via `document_id` FK (or entirely separate from `Document`)** — keep `documents` untouched; add a new table holding `document_id`, `portal_url`, `portal_username`, `portal_password_encrypted`.
   - Pros: Keeps `Document` clean/uniform; encryption-sensitive columns live in an isolated table that's easier to lock down (narrower audit surface, easier to apply column-level access control later). Clear separation of "this document has a portal link" as an optional extension.
   - Cons: Every read path that needs to know "is this a link doc" now requires a join/extra query (`get_multi_by_owner_paginated`, list views, search) unless eagerly loaded with `lazy="selectin"` — more moving parts for what is fundamentally a 1:1 relationship. If NOT linked to `Document` at all (fully standalone resource), it loses backpacks/tags/classification/sharing/search "for free" and would need its own parallel CRUD+endpoints+UI list, doubling the surface area for something that conceptually is still "a document."
   - Effort: Medium-High (extra table + relationship + join-aware queries; frontend needs to merge two response shapes).

3. **Model the link as a `Document` row whose `file_url` stores the portal URL directly (reusing existing `file_url`), with credentials in new dedicated encrypted columns** — a middle ground between 1 and 2: no new `kind` enum, just detect "is a link" by checking if `file_url` looks like an external URL (already partially precedented by `shared_document_signed_url`'s `http(s)://` check) or by the presence of `portal_username`.
   - Pros: Reuses `file_url` semantically consistently with the existing share-flow precedent; no new discriminator column to keep in sync.
   - Cons: Inferring "kind" from a URL prefix is fragile/implicit (magic string sniffing) rather than an explicit, indexable, filterable column — worse for future filtering ("show me only my portal links") and for `format`, which would need a synthetic sentinel value. Not recommended as the sole signal.
   - Effort: Low upfront, but accrues technical debt / ambiguity later.

### Recommendation

**Approach 1** (extend `Document` with an explicit `kind` discriminator + nullable link/credential columns), but borrow the encryption-isolation instinct from Approach 2 by keeping the encrypted credential value in its own column(s) with a dedicated encryption helper — not folded into `description` or any existing free-text field. This keeps the huge existing investment in Document (backpacks, tags/classification, search, pagination, sharing, detail screen) working for link documents with minimal duplication, while an explicit `kind: Literal["FILE","LINK"]` column (rather than URL-sniffing) gives a clean, indexable, future-proof signal for every place that currently assumes "documents have files" (upload flow branching, `/files/url` special-casing, external-open logic, detail preview, and — critically — the sharing decision below).

The `description` field gap is independent and should ship regardless of the link-document decision: it only requires adding a `description` input + state to `useDocumentFormCore`/`DocumentUploadScreen`/`DocumentEditScreen` and passing it through to `createDocument`/`updateDocument` — no backend changes needed at all.

### Risks

- **New capability, not a reuse**: reversible encryption for retrievable credentials does not exist anywhere in the codebase (`bcrypt` is one-way). Introduces a new crypto dependency/pattern (e.g. `cryptography`'s `Fernet`) and a new secret (`settings.SOME_ENCRYPTION_KEY`) that must be provisioned and rotated carefully — get this wrong and it's a real security incident, not just a bug.
- **Sharing a portal link + credentials publicly**: `POST /documents/{id}/share` currently works uniformly for any `Document`; sharing a link-type document via an anonymous QR/token effectively hands out the hospital login to anyone with the link. Needs an explicit product decision (block sharing for `kind=LINK`, or share without exposing the password, or require re-auth) before `sdd-propose`.
- **In-app viewer 403 regression risk**: `useDocumentDetail`'s `signedUrlQuery` currently fires unconditionally whenever `document.fileUrl` is set. If link documents populate `file_url` with the portal URL, this will hit `/files/url` and 403 unless the hook is branched on `kind` — must be caught in design/tasks, not discovered in QA.
- **Never log/display credentials by accident**: any new list/detail/console logging must be audited so `portal_password` never appears in logs, Sentry-equivalent tooling, or unmasked in the UI by default (reveal-on-tap pattern recommended).
- **Frontend structure mismatch with generic skills**: the `feature-module`/`code-conventions` skills describe a `packages/features/src/*` structure that does not exist in this repo. If `sdd-design`/`sdd-tasks` follow the generic skill literally instead of the real `useDocumentFormCore` + `apps/mobile/src/components/documents/` pattern, the plan will not match the codebase and tasks will need rework.
- **Web is explicitly out of scope** per `FrontendHealthGuard/openspec/config.yaml` unless the user says otherwise — confirm this before scoping tasks, since `apps/web` already has its own `useDocumentForm.ts` that would also need the description field and link branch for full parity.
- **Cross-repo SDD convention**: this change needs both a `BackendHealthGuard/openspec/changes/document-portal-links/` and `FrontendHealthGuard/openspec/changes/document-portal-links/` folder per the repo's own documented convention (confirmed via existing `refactor-share-module` / `fix-backpacks-module-bugs` changes present in both repos). Only the frontend exploration was written in this pass per explicit task scope — propose phase should create the backend-side folder too.

### Ready for Proposal

**Yes** — with three product decisions the orchestrator should raise to the user before/at `sdd-propose`:
1. Should sharing (`/documents/{id}/share`) be disabled, restricted, or altered for link-type documents (since the payload is itself a portal credential)?
2. Should the portal password ever be displayed in plaintext in the UI (reveal-on-tap), or only used server-side (e.g., "copy to clipboard" without ever rendering it)?
3. Is `apps/web` in scope for this change, or mobile-only per the repo's default convention?
