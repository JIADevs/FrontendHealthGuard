# Tasks: Document Portal Links + Description

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–800 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR-B → PR-S → PR-M |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend API, encryption, migration | PR-B | `BackendHealthGuard`; deploy before frontend |
| 2 | Shared Zod + `useDocumentFormCore` | PR-S | `packages/api`, `packages/ui`; base = tracker or `dev` |
| 3 | Mobile UI + guards | PR-M | `apps/mobile`; base = PR-S branch |

---

## Phase 1: Backend [PR-B]

> Mirror: `BackendHealthGuard/openspec/changes/document-portal-links/tasks.md`

- [x] 1.1 Add `CREDENTIAL_ENCRYPTION_KEY` to `app/core/config.py` (urlsafe base64 32-byte Fernet key, default `""`)
- [x] 1.2 Create `app/core/encryption.py` — lazy Fernet singleton; `encrypt_secret` / `decrypt_secret`; `InvalidToken` → `None`, never log secrets
- [x] 1.3 Create `alembic/versions/t9u0v1w2x014_add_document_portal_links.py` (`down_revision = s8t9u0v1w013`): `kind` NOT NULL default `FILE` + index; `portal_url`, `portal_username`, `portal_password_encrypted`; relax `file_url`/`format` nullable
- [x] 1.4 Update `app/models/document.py` — four new columns; `file_url`/`format` → `Mapped[Optional[str]]`
- [x] 1.5 Update `app/schemas/document.py` — `DocumentKind`; portal fields on create/read; `file_url`/`format` optional; `model_validator` cross-field rules; `DocumentSharedOut` omits `portal_password`
- [x] 1.6 Update `app/crud/crud_document.py` — encrypt on write; decrypt on read; inactive-side coalesce in `update_with_owner` (`None` keeps stored, `""` clears password)
- [x] 1.7 Update `app/api/api_v1/endpoints/files.py` — `get_file_url` returns `http(s)://` path before ownership prefix check (LINK passthrough)
- [x] 1.8 Update `app/api/api_v1/endpoints/documents.py` — `consume_shared_document` → `DocumentSharedOut`; `shared_document_signed_url` resolves `portal_url` for LINK, guard `file_url is None`
- [x] 1.9 Create `tests/core/test_encryption.py` — round-trip, `None` passthrough, invalid token tolerance
- [x] 1.10 Extend `tests/api/test_documents.py` — LINK CRUD, FILE↔LINK retention, `/files/url` 200 for external URL, share omits password
- [x] 1.11 Run `pytest tests/core/test_encryption.py tests/api/test_documents.py` — 46 passed (2026-08-07)

---

## Phase 2: Shared contract [PR-S]

- [x] 2.1 Update `packages/api/src/schemas.ts` — `DocumentKindSchema`; nullable `portalUrl`/`portalUsername`/`portalPassword`; **nullable `fileUrl`/`format`**; `DocumentCreateSchema.superRefine` (LINK requires `portalUrl`, FILE requires `fileUrl`+`format`)
- [x] 2.2 Update `packages/api/src/useDocumentFormCore.ts` — `description` state + setter in create/update payloads; `handleCreateLink` (no upload/classify); kind conversion without client-side inactive-side wipe
- [x] 2.3 Update `packages/ui/src/utils/documentTypes.ts` — add `isLinkDocument(kind?)`; do not extend `DocFormat`
- [x] 2.4 Run `pnpm exec tsc --noEmit -p packages/api` — pre-existing errors in `hooks.ts`, `useAppointmentFormCore.ts` only; no errors in PR-S files (2026-08-07)

---

## Phase 3: Mobile UI [PR-M]

- [x] 3.1 Create `DocumentKindToggle.tsx` — "Archivo" / "Resultado de examen virtual"
- [x] 3.2 Create `DocumentPortalForm.tsx` — URL required; username/password optional; reveal/hide on password field
- [x] 3.3 Create `DocumentDescriptionField.tsx` — multiline description for both kinds
- [x] 3.4 Create `DocumentDetailPortalCard.tsx` — "Abrir portal" via `Linking.openURL`; masked credentials with reveal/hide + copy; no password in logs
- [x] 3.5 Export new components from `components/documents/index.ts`
- [x] 3.6 Wire `DocumentDescriptionField` in `DocumentClassificationForm.tsx` under title
- [x] 3.7 Update `useDocumentDetail.ts` — `isLink`; `signedUrlQuery.enabled = !isLink && !!document?.fileUrl` (nullable guard)
- [x] 3.8 Update `DocumentUploadScreen.tsx` — kind state; picker effect gated on FILE; toggle + LINK submit via `handleCreateLink`; mutation feedback (`uploading` spinner + success/error toast)
- [x] 3.9 Update `DocumentEditScreen.tsx` — kind toggle/conversion; prefill portal + description; gate signed-url/classify on `!isLink`; echo inactive side in payload; `saving` spinner + toast
- [x] 3.10 Update `DocumentDetailScreen.tsx` — branch: LINK → `DocumentDetailPortalCard`, else preview + open-external
- [x] 3.11 Run `pnpm exec tsc --noEmit -p apps/mobile` — pre-existing nullable `format` errors elsewhere; no new errors in PR-M files (2026-08-07)

---

## Phase 4: Verification

- [x] 4.1 Backend pytest green (`test_encryption.py`, `test_documents.py`) — 46 passed (2026-08-07)
- [ ] 4.2 Manual: create LINK (URL only) → list → detail → open portal → reveal password → edit description
- [ ] 4.3 Manual: LINK→FILE conversion retains portal columns server-side; FILE→LINK retains file columns
- [ ] 4.4 Manual: FILE detail still fetches signed URL; LINK detail never calls `getSignedUrl`
- [ ] 4.5 Manual: anonymous share shows `portalUrl`/`portalUsername` only — no password
- [ ] 4.6 Manual: create/edit shows loading indicator and success/error notification per `frontend-mutation-feedback`

---

## Apply order

1. Confirm chain strategy (`stacked-to-main`, `feature-branch-chain`, or `size:exception`) — **required** (`ask-on-risk`)
2. Phase 1 → PR-B → deploy backend with `CREDENTIAL_ENCRYPTION_KEY` provisioned
3. Phase 2 → PR-S
4. Phase 3 → PR-M
5. Phase 4 QA on device against migrated API
