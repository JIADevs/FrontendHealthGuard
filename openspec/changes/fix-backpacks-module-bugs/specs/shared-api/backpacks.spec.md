# Shared API Backpacks Specification

## Purpose

Contrato de datos compartido (`packages/api`) para mochilas: invalidación de cache TanStack Query y paginación reutilizable por mobile (y web futuro).

## Requirements

### Requirement: Unified backpack cache invalidation

After any mutation that changes backpack membership or counts, the client MUST invalidate all related query keys: `backpacks`, `backpack/{id}`, `backpack-docs/{id}`, and `backpack-doc-ids/{id}`.

#### Scenario: After add document

- GIVEN a successful add-document-to-backpack mutation
- WHEN the mutation settles
- THEN list, detail, document list, and existing-id sets for that backpack MUST be marked stale and refetched when observed

#### Scenario: After remove document

- GIVEN a successful remove-document-from-backpack mutation
- WHEN the mutation settles
- THEN the same query families MUST invalidate as on add

#### Scenario: After create with documents

- GIVEN a backpack was created and one or more documents were linked
- WHEN linking completes
- THEN the backpacks list and new backpack detail queries MUST reflect updated counts

### Requirement: Duplicate add error handling

The add mutation MUST surface HTTP 409 from the API to the caller with a user-visible error message.

#### Scenario: 409 conflict

- GIVEN the API returns 409 for duplicate link
- WHEN the mutation fails
- THEN the caller MUST receive an error suitable for toast display
- AND MUST NOT treat the operation as success

### Requirement: Paginated backpack documents query

The shared layer MUST expose a paginated way to fetch all documents for a backpack (page + limit + optional search).

#### Scenario: Fetch second page

- GIVEN a backpack with total documents greater than page size
- WHEN the consumer requests page 2
- THEN items for page 2 MUST be returned distinct from page 1

### Requirement: Paginated document catalog for picker

The shared layer MUST expose paginated fetch of user documents for backpack pickers (add flow and create flow).

#### Scenario: Catalog pagination

- GIVEN the user has more documents than one page
- WHEN the picker requests the next page
- THEN additional documents MUST be available to the UI consumer

### Requirement: Remove document core action

`useBackpackDetailCore` MUST expose `removeDocument` using the shared remove mutation and the unified invalidation rules.

#### Scenario: Remove triggers invalidation

- GIVEN removeDocument succeeds
- WHEN settled
- THEN unified invalidation MUST run per the invalidation requirement
