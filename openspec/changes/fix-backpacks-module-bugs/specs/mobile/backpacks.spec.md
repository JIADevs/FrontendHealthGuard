# Mobile Backpacks Specification

## Purpose

Comportamiento del módulo mochilas en la app mobile: listado, detalle, agregar/quitar documentos y crear mochila con documentos. UI MUST vivir en componentes reutilizables de `components/backpacks/`; las screens solo componen.

## Requirements

### Requirement: Remove document from backpack

The mobile app MUST allow the user to remove a document from a backpack without deleting the document from their library.

#### Scenario: Remove with confirmation

- GIVEN the user is on backpack detail with at least one linked document
- WHEN the user triggers remove on a document row and confirms
- THEN the document MUST disappear from the backpack content list
- AND a success notification MUST be shown

#### Scenario: Remove cancelled

- GIVEN a remove confirmation is shown
- WHEN the user cancels
- THEN the document MUST remain in the backpack

### Requirement: Accurate document counts in list

The backpacks list MUST show an up-to-date `documentCount` after add or remove operations without requiring manual pull-to-refresh.

#### Scenario: Count after add from detail flow

- GIVEN a backpack with N documents shown in the list
- WHEN the user adds a document and navigates back to the backpacks list
- THEN the list item MUST show N+1 documents

#### Scenario: Count after remove

- GIVEN a backpack with N documents in the list
- WHEN the user removes one document from detail and returns to the list
- THEN the list item MUST show N-1 documents

### Requirement: Add-documents screen title

The add-documents flow MUST present a single primary title (no duplicate headings).

#### Scenario: Single title visible

- GIVEN the user opens add documents for a named backpack
- WHEN the screen renders
- THEN exactly one primary title MUST be visible (navigation header OR in-content title, not both with redundant labels)

### Requirement: Add-documents picker freshness

Documents already in the backpack MUST NOT remain selectable as addable after a successful add.

#### Scenario: Added doc excluded from picker

- GIVEN the user adds document D to backpack B from the picker
- WHEN the add succeeds
- THEN D MUST NOT appear as available to add again in the same session without leaving the screen

### Requirement: Create backpack with document search

Creating a backpack with initial documents MUST support searching the document catalog.

#### Scenario: Search filters picker on create

- GIVEN the user is on new-backpack form with document picker
- WHEN the user types a search term
- THEN the picker MUST show only documents matching that search

### Requirement: Paginated backpack content

Backpack detail MUST show all linked documents beyond the first page of results.

#### Scenario: Load more documents

- GIVEN a backpack with more than one page of linked documents
- WHEN the user scrolls or taps load more
- THEN additional documents MUST appear in the content list

### Requirement: Paginated catalog in add flow

The add-documents catalog MUST support browsing beyond the first page of user documents.

#### Scenario: Load more in add picker

- GIVEN the user has more documents than one page
- WHEN the user requests more in the add picker
- THEN additional non-linked documents MUST load

### Requirement: Total size badge

The detail header size badge MUST reflect the total file size of all documents in the backpack, not only the first loaded page.

#### Scenario: Size with many documents

- GIVEN a backpack with documents spanning multiple pages
- WHEN detail header renders after all pages are loaded or total is computed
- THEN the displayed size MUST equal the sum of all linked document sizes

### Requirement: Module component structure

New or changed UI for backpacks MUST be implemented as reusable components under `components/backpacks/` and exported via the module index.

#### Scenario: Screen composition only

- GIVEN a bug fix requires new UI in backpack flows
- WHEN implemented
- THEN the UI MUST NOT be inlined in screen files except navigation wiring
