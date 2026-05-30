# Mobile Shares Specification

## Purpose

Flujos mobile del módulo Compartir: configurar enlace, mostrar QR, historial unificado (documentos + mochilas), detalle con revocación. UI MUST vivir en `components/share/`; screens solo componen y navegan.

## Requirements

### Requirement: Resource type in shared history

Each row in the shared history list MUST indicate whether the link points to a **document** or a **backpack (mochila)** via icon (and optional color treatment). The row MUST NOT duplicate type as a text label when the icon already conveys it.

#### Scenario: Document share row

- GIVEN an active share link for a document titled "Ecocardiograma"
- WHEN the user opens the shared history screen
- THEN the row MUST show a document icon distinct from backpacks
- AND the title MUST be "Ecocardiograma" using the same typography as document list titles (`Typography variant="body"`)
- AND the row MUST NOT show document count or "enlace público" copy

#### Scenario: Backpack share row

- GIVEN an active share link for a backpack named "Mochila Neurología"
- WHEN the user opens the shared history screen
- THEN the row MUST show a backpack icon distinct from documents
- AND the title MUST be "Mochila Neurología"

#### Scenario: Status and start time row

- GIVEN a share link created 2 hours ago with status active
- WHEN the row renders
- THEN a status chip MUST show "Activo" or "Expirado" on a line below the title
- AND relative start time from `createdAt` MUST appear beside the chip (e.g. "hace 2h", "ayer", "hace 3 días")

### Requirement: History filters

The shared history screen MUST offer filters for all, active, and expired links.

#### Scenario: Active filter

- GIVEN the user has both active and expired share links loaded in cache
- WHEN the user selects "Activos"
- THEN only links with status active MUST be shown
- AND the UI MUST NOT show a full-screen loading spinner solely because the filter changed

#### Scenario: Expired filter

- GIVEN the user has expired share links
- WHEN the user selects "Expirados"
- THEN only expired links MUST be shown

#### Scenario: Single fetch for filters

- GIVEN the shared history screen mounts
- WHEN data is fetched
- THEN the client MUST request `GET /shares?status=all` once (via `useShareHistoryQuery`)
- AND tab changes MUST filter the cached list client-side

### Requirement: Configure share before generating

The user MUST configure expiration before generating a share link from document or backpack detail.

#### Scenario: Expiration options

- GIVEN the user opens share configuration for a resource
- WHEN the configuration screen renders
- THEN expiration options MUST include 1 hour, 24 hours, 7 days, and Never
- AND one option MUST be pre-selected (default 24 hours)

#### Scenario: Generate link

- GIVEN the user selected an expiration option
- WHEN the user taps "Generar"
- THEN a share link and QR MUST be created
- AND the app MUST navigate to the QR result screen

#### Scenario: Generate loading feedback

- GIVEN the user taps "Generar"
- WHEN the share mutation is in flight
- THEN the header action MUST show a loading spinner
- AND the action MUST be disabled until the mutation settles

### Requirement: No download permission

Shared links MUST NOT offer download to recipients. The owner UI MUST NOT expose a download toggle.

#### Scenario: Permissions section

- GIVEN the share configuration screen
- WHEN the permissions section renders
- THEN "Ver" MUST be shown as always allowed
- AND there MUST NOT be a toggle or option to enable download

#### Scenario: Public viewer

- GIVEN a recipient opens a shared document link
- WHEN the public viewer loads
- THEN the file MUST be previewable in-app or inline
- AND there MUST NOT be a download or save action

### Requirement: QR result actions

After generating a share link, the user MUST be able to copy the link or send it via the system share sheet.

#### Scenario: Copy link

- GIVEN the QR result screen with an active link
- WHEN the user taps "Copiar enlace"
- THEN the URL MUST be copied to the clipboard
- AND a success notification MUST be shown

#### Scenario: Send link

- GIVEN the QR result screen
- WHEN the user taps "Enviar"
- THEN the system share sheet MUST open with the link

### Requirement: Shared detail and revoke

The user MUST view share activity and revoke access from a detail screen.

#### Scenario: View detail

- GIVEN the user taps a row in shared history
- WHEN the detail screen opens
- THEN it MUST show title, resource type, status, expiration, view count, and last access when available

#### Scenario: Activity card typography

- GIVEN the detail screen activity section
- WHEN view count and last access are displayed
- THEN both numeric/time values MUST use the same typography variant (`h3`)
- AND labels "Visualizaciones" and "Último acceso" MUST use caption secondary below each value

#### Scenario: Revoke access

- GIVEN an active share on the detail screen
- WHEN the user confirms "Revocar acceso"
- THEN the link MUST become invalid
- AND the history list MUST reflect the revoked/expired state after refresh

### Requirement: Extend active share

The user MUST extend an active share by 24 hours from the detail screen.

#### Scenario: Extend 24h

- GIVEN an active share expiring in less than 24 hours
- WHEN the user taps "Extender 24h más" and the API succeeds
- THEN the expiration MUST increase by 24 hours
- AND the UI MUST show the updated expiration

### Requirement: History error handling

The shared history screen MUST surface fetch/parse failures instead of an infinite spinner.

#### Scenario: Invalid response

- GIVEN `GET /shares` returns data that fails Zod validation
- WHEN the query errors
- THEN the screen MUST show an error message with a retry action
- AND MUST NOT remain on an initial loading spinner indefinitely

### Requirement: Module component structure

Share UI MUST be implemented as reusable components under `apps/mobile/src/components/share/`.

#### Scenario: Screen composition

- GIVEN any share screen
- WHEN inspecting its implementation
- THEN it MUST import presentational components from `components/share/`
- AND MUST NOT contain inline list row or QR layout duplicated across screens
