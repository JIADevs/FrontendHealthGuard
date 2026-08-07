# Mobile Document Portal Links Specification

## Purpose

Mobile UI for creating, viewing, and converting `LINK` documents (portal URL + credentials) and for entering `description` on any document, built on `apps/mobile/src/components/documents/` and the shared core hooks.

## Requirements

### Requirement: Create-screen type toggle

The document create screen MUST offer a toggle between "Archivo" and "Resultado de examen virtual". Selecting "Resultado de examen virtual" MUST render the link form (URL, optional username/password) instead of the file picker and MUST require the user to choose a document type manually (no AI classify step).

#### Scenario: Toggle to link hides upload UI

- GIVEN the user opens the create screen
- WHEN they select "Resultado de examen virtual"
- THEN the file picker/camera options are hidden and the link form is shown, with no classify call triggered

#### Scenario: Toggle back to file restores upload UI

- GIVEN the user has the link form open
- WHEN they switch back to "Archivo"
- THEN the file picker is shown again and any entered portal fields are cleared from the visible (unsubmitted) form

### Requirement: Detail skips signed-URL fetch for LINK

`useDocumentDetail` MUST branch on `kind` and MUST NOT call `getSignedUrl`/`/files/url` when `kind === "LINK"`.

#### Scenario: LINK detail never requests a signed URL

- GIVEN the user opens a `LINK` document's detail screen
- WHEN the screen mounts
- THEN no `getSignedUrl` request fires and the portal action renders directly from `portalUrl`

#### Scenario: FILE detail still requests its signed URL

- GIVEN the user opens a `FILE` document's detail screen
- WHEN the screen mounts
- THEN `getSignedUrl` fires exactly as before this change

### Requirement: Portal action and credential reveal

The detail screen for `kind === "LINK"` MUST render an "Open portal" action that calls `Linking.openURL(portalUrl)`, and MUST render `portalUsername`/`portalPassword` (when present) masked by default with a reveal/hide toggle and a copy action. The password MUST NOT be logged or rendered anywhere else unmasked.

#### Scenario: Open portal action

- GIVEN a `LINK` document detail with a valid `portalUrl`
- WHEN the user taps "Open portal"
- THEN `Linking.openURL` is called with that URL

#### Scenario: Reveal and hide password

- GIVEN a `LINK` document detail with a stored password
- WHEN the user taps the reveal control
- THEN the plaintext password renders; tapping hide masks it again, and no password value appears in any log output

### Requirement: Kind conversion available after creation

The edit screen MUST let the user switch an existing document's `kind` between `FILE` and `LINK`, submitting through the same conversion contract as the shared-api core hook.

#### Scenario: Convert LINK to FILE in edit

- GIVEN an existing `LINK` document opened in edit mode
- WHEN the user switches to "Archivo", uploads a file, and saves
- THEN the document becomes `kind: "FILE"` and subsequent detail views show the file preview instead of the portal action

### Requirement: Mutation feedback on create and edit

Document create and edit submissions (both kinds) MUST show a loading indicator while the request is in flight and MUST show a success or error notification when it completes.

#### Scenario: Successful LINK create shows toast

- GIVEN the user submits a valid link form
- WHEN the create request is in flight
- THEN a loading indicator is visible, and on success a success notification appears

#### Scenario: Failed create shows error

- GIVEN the create request fails (network or validation)
- WHEN the response returns
- THEN the loading indicator clears and an error notification appears
