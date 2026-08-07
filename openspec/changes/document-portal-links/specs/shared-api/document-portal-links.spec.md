# Shared-API Document Portal Links Specification

## Purpose

Zod contract and core-hook logic for the `LINK` document kind (portal URL + optional credentials) and the `description` field, shared by every adapter through `packages/api`.

## Requirements

### Requirement: Kind and portal field contract

`DocumentSchema` and `DocumentCreateSchema` MUST expose `kind: "FILE" | "LINK"` (default `"FILE"`) and portal fields `portalUrl`, `portalUsername`, `portalPassword` (all nullable/optional, camelCase, mirroring the backend Pydantic aliases exactly).

#### Scenario: LINK document parses with URL only

- GIVEN a backend response with `kind: "LINK"`, `portalUrl` set, `portalUsername: null`, `portalPassword: null`
- WHEN `DocumentSchema.parse()` runs
- THEN parsing succeeds and file fields (`fileUrl`, `format`) are `null`

#### Scenario: FILE document unaffected

- GIVEN a backend response with `kind: "FILE"` and no portal fields
- WHEN `DocumentSchema.parse()` runs
- THEN parsing succeeds exactly as before this change

### Requirement: Description state in useDocumentFormCore

`useDocumentFormCore` MUST hold a `description` field in its state, with a setter, for both `kind` values, and MUST include it in the payload passed to `createDocument`/`updateDocument`.

#### Scenario: Description saved on FILE create

- GIVEN a user fills the file-upload form and types a description
- WHEN they submit
- THEN `createDocument` receives `description` in the payload

#### Scenario: Description saved on LINK create

- GIVEN a user fills the link form and types a description
- WHEN they submit
- THEN `createDocument` receives `description` in the payload

### Requirement: File-less create path for LINK

When `kind === "LINK"`, `useDocumentFormCore` MUST skip `adapters.upload()` and `adapters.classify()` and MUST require `portalUrl`; `portalUsername` and `portalPassword` MUST be optional.

#### Scenario: Create LINK with URL only

- GIVEN the user selects "Resultado de examen virtual" and enters only a `portalUrl`
- WHEN they submit with a manually chosen document type
- THEN the hook calls `createDocument` with `kind: "LINK"` and no upload/classify call is made

#### Scenario: Create LINK with credentials

- GIVEN the user enters `portalUrl`, `portalUsername`, and `portalPassword`
- WHEN they submit
- THEN `createDocument` receives all three portal fields, still without an upload/classify call

#### Scenario: Missing URL blocks submit

- GIVEN the user selects "Resultado de examen virtual" and leaves `portalUrl` empty
- WHEN they attempt to submit
- THEN validation MUST fail before any API call is made

### Requirement: Kind conversion without client-side wipe

`useDocumentFormCore` MUST allow editing an existing document's `kind` between `FILE` and `LINK`, and MUST NOT clear the inactive side's fields in the update payload unless the user explicitly edits them.

#### Scenario: LINK converted to FILE retains portal fields server-side

- GIVEN an existing `LINK` document is edited and the user switches to "Archivo" and uploads a file
- WHEN they submit the edit
- THEN the payload sets `kind: "FILE"` and the new file fields, and does NOT explicitly null `portalUrl`/`portalUsername`/`portalPassword`

#### Scenario: FILE converted to LINK retains file fields server-side

- GIVEN an existing `FILE` document is edited and the user switches to "Resultado de examen virtual" with a new `portalUrl`
- WHEN they submit the edit
- THEN the payload sets `kind: "LINK"` and the new portal fields, and does NOT explicitly null `fileUrl`/`format`/`fileSizeBytes`
