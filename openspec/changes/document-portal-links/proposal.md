# Proposal: Document Portal Links + Description

## Intent

Many exam results arrive as a hospital portal URL plus login credentials, not a file. Helu only stores uploaded files, so those results live outside the app. Separately, `description` exists end-to-end (column, Pydantic, Zod) but no UI ever sets it — dead plumbing.

## Scope

### In Scope — backend + mobile + shared packages

- New document kind `LINK`: portal URL, username, password; no file.
- `LINK` documents keep classification, tags, backpacks, search, pagination, sharing.
- Optional `description` on create and edit for both kinds (frontend wiring only).
- Create: one screen with a type toggle — "Archivo" vs "Resultado de examen virtual".
- Detail: open-portal action, credentials with reveal/hide and copy.
- Kind conversion after creation: FILE ↔ LINK allowed. Inactive-side data is **retained** (portal credentials survive FILE mode; file blob metadata survives LINK mode) and ignored until kind flips back.

### Out of Scope

- `apps/web` UI — shared layer prepared, tagged `[web-deferred]`.
- AI classify for links (file-only); links classify manually.
- Backend `description` changes (already supported).

## Capabilities

### New Capabilities

- `shared-api/document-portal-links`: Zod contract for `kind` and portal fields; file-less create path and `description` state in `useDocumentFormCore`.
- `mobile/document-portal-links`: create toggle and link form; detail portal and credential rendering.

### Modified Capabilities

- None — no existing spec covers documents.

## Approach

Exploration Approach 1: explicit `kind` (`FILE`|`LINK`) discriminator plus nullable portal columns, encryption handled backend-side (see mirror). No parallel document resource. Frontend branches on `kind`: skip upload and classify on create, skip `getSignedUrl` on detail, open the portal via `Linking.openURL`.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `packages/api/src/schemas.ts` | Modified | `kind` and portal fields |
| `packages/api/src/useDocumentFormCore.ts` | Modified | `description` state; file-less create |
| `apps/mobile/src/components/documents/` | New/Modified | Toggle, link form, credential block |
| `apps/mobile/src/hooks/useDocumentDetail.ts` | Modified | Skip signed-url for `LINK` |
| `apps/mobile/src/screens/Document{Upload,Edit}Screen.tsx` | Modified | Wire description and link variant |
| `packages/ui/src/utils/documentTypes.ts` | Modified | `kind` check independent of `DocFormat` |
| `apps/web/**` | Deferred | Not in this slice |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Credential leak via public share | Med | Anonymous public share returns URL + username only; password omitted |
| Detail 403s by calling `/files/url` for links | High | Branch on `kind`; cover in specs |
| Password rendered or logged accidentally | Med | Masked by default; never logged |
| Design follows nonexistent `packages/features` | Med | Real pattern: `packages/api` `use*Core` + `components/documents/` |

## Rollback Plan

Revert the frontend branch. New columns are nullable and `kind` defaults to `FILE`, so file documents are unaffected and a reverted frontend ignores link fields.

## Dependencies

- Backend `document-portal-links` (encryption, `kind` column, migration) lands first.

## Success Criteria

- [ ] User creates a `LINK` document without a file, classifying manually.
- [ ] Detail opens the portal and reveals/hides the password.
- [ ] Description saves and displays for both kinds.
- [ ] `LINK` documents behave like files in list, search, backpacks.
- [ ] Create and edit show loading plus success/error notification.
- [ ] No credential appears in logs.

## Locked decisions (resolved open questions)

1. Anonymous public share: **omit password** — expose URL + username only.
2. `LINK` credentials: **URL required**; username and password **optional** (URL-only portal entry is valid).
3. Kind conversion: **allowed** after creation (FILE ↔ LINK). **Retention rule**: converting does **not** wipe the inactive side — `LINK → FILE` keeps portal URL/username/password stored but unused while `kind=FILE`; `FILE → LINK` keeps `file_url`/`format`/`file_size_bytes` stored but unused while `kind=LINK`. Active view/API behavior follows `kind` only. Overwriting fields of the newly active kind (new upload or new portal URL) updates those fields; clearing inactive-side data is a separate explicit delete (out of scope unless product asks).
