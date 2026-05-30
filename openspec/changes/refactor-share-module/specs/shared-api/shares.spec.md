# Shared API Shares Specification

## Purpose

Contratos y hooks en `packages/api` para el módulo Compartir unificado (documentos + mochilas).

## Requirements

### Requirement: Share link schema

The client MUST model share links with explicit resource type and download policy.

#### Scenario: Parse list response

- GIVEN `GET /shares` returns items with `resource_type`, `resource_id`, `title`, `status`, `can_download`
- WHEN the client parses the response with Zod
- THEN each item MUST validate as `ShareLink`
- AND `canDownload` MUST always normalize to `false`

#### Scenario: Nullable document count

- GIVEN a share link with `resource_type` document
- WHEN the API returns `document_count: null`
- THEN Zod validation MUST succeed (`documentCount` nullish)
- AND the client MUST NOT require a number for document shares

#### Scenario: Backpack metadata

- GIVEN a share link with `resource_type` backpack
- WHEN parsed
- THEN optional `documentCount` MAY be present as a number for detail/QR flows
- AND history list rows MUST NOT depend on displaying document count

### Requirement: List shares query

The client MUST fetch unified share history efficiently for mobile history UI.

#### Scenario: History query (mobile)

- GIVEN `useShareHistoryQuery()`
- WHEN the query resolves
- THEN it MUST call `GET /shares?status=all`
- AND use `placeholderData: keepPreviousData` for stable list during refetch

#### Scenario: Status filter query (legacy/direct)

- GIVEN `useSharesQuery("active")`
- WHEN the query resolves
- THEN it MUST call `GET /shares?status=active`
- AND return both document and backpack links

#### Scenario: Cache invalidation

- GIVEN a successful share, revoke, or extend mutation
- WHEN the mutation completes
- THEN queries with key prefix `shares` MUST be invalidated

#### Scenario: Parse error surfacing

- GIVEN `listShares` receives a payload that fails Zod validation
- WHEN `safeParse` fails
- THEN the function MUST throw an Error with a human-readable message
- AND TanStack Query MUST surface `isError` to the UI

### Requirement: Share creation options

Share mutations MUST send expiration preference to the backend.

#### Scenario: Share document with expiration

- GIVEN `useShareDocumentMutation` with `{ documentId, expiresIn: "24h" }`
- WHEN the mutation runs
- THEN it MUST POST to `/documents/{id}/share` with body `{ expires_in: "24h" }`

#### Scenario: Share backpack with expiration

- GIVEN `useShareBackpackMutation` with `{ backpackId, expiresIn: "7d" }`
- WHEN the mutation runs
- THEN it MUST POST to `/backpacks/{id}/share` with body `{ expires_in: "7d" }`

### Requirement: Revoke and extend mutations

The client MUST support revoke and extend via unified share endpoints.

#### Scenario: Revoke

- GIVEN `useRevokeShareMutation`
- WHEN called with `linkId` and `resourceType`
- THEN it MUST `DELETE /shares/{linkId}?resource_type=...`

#### Scenario: Extend

- GIVEN `useExtendShareMutation`
- WHEN called with `linkId` and `resourceType`
- THEN it MUST `POST /shares/{linkId}/extend?resource_type=...`

### Requirement: Legacy compatibility

Existing consumers of `getActiveDocumentShares` MUST continue working during migration.

#### Scenario: Deprecated wrapper

- GIVEN code still calling `useActiveDocumentSharesQuery`
- WHEN executed after migration
- THEN it MUST continue to work until callers are fully migrated
- AND new mobile history MUST use `useShareHistoryQuery` instead
