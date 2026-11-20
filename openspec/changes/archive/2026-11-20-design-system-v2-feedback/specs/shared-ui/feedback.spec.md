# Spec: shared-ui — Feedback components v2

**Change:** design-system-v2-feedback
**Domain:** shared-ui (`packages/ui/src`), `apps/mobile`, `apps/web`
**Phase:** spec
**Date:** 2026-11-20
**Source:** `.docs/design/system/MASTER.md` §7, `.docs/design/system/componentes.md`, `.docs/design/system/pages/web.md` §2

## Requirements

### RF-UI-F1 — notify()

Each app MUST expose `notify({ message, description?, tone?, action? })` with the same signature on web (`apps/web/src/lib/notify.ts`, over `sileo`) and mobile (`apps/mobile/src/lib/notify.ts`, over `react-native-toast-message`). Toasts MUST show at the top, below the safe area on mobile. They MUST last 4 s, or 5 s when they carry an action. Title, description and action text MUST be ≥ 4.5:1 against the toast surface.

#### Scenario: Recoverable delete
- GIVEN the user deletes something that can be restored
- WHEN the app calls `notify({ message: "Documento eliminado", action: { label: "Deshacer", onPress } })`
- THEN a toast with a «Deshacer» button shows for 5 s, and pressing it runs `onPress` and closes the toast

#### Scenario: Existing calls
- GIVEN the existing direct calls to `Toast.show` and `sileo`
- WHEN the change is applied
- THEN they keep working and render with the v2 styling

### RF-UI-F2 — ConfirmModal

`ConfirmModal` SHOULD only be used for irreversible actions or ones that affect another person. Its title SHOULD be a question and `message` SHOULD state the consequence. The safe option (`keepLabel`, default «Cancelar») MUST come before the action, and the action MUST use the exact verb. With an `icon`, it MUST render a round `IconTile` and theme colors in light and dark mode.

#### Scenario: Cancel an appointment
- GIVEN `<ConfirmModal keepLabel="Mantener cita" confirmLabel="Cancelar cita" confirmVariant="danger" />`
- WHEN it opens
- THEN «Mantener cita» comes first and «Cancelar cita» uses the `danger` variant

#### Scenario: App wrappers
- GIVEN mobile `ConfirmDialog` and web `ConfirmModal`
- WHEN they render
- THEN they draw the shared `@helu/ui` component with their current props

### RF-UI-F3 — BottomActionBar

`BottomActionBar` MUST take `primary: { label, onPress, loading?, loadingLabel?, disabled?, variant? }` and an optional ghost `secondary`. It MUST NOT carry destructive actions. On native it MUST sit at the bottom with the bottom safe-area inset, a top border and the card surface, and `BOTTOM_ACTION_BAR_HEIGHT` MUST be exported so scroll views can leave room for it. On web it MUST be a sticky page footer with the same props.

#### Scenario: Content not covered
- GIVEN a full-screen form with a `BottomActionBar`
- WHEN its scroll view adds `BOTTOM_ACTION_BAR_HEIGHT` plus the bottom inset as padding
- THEN the last field can scroll above the bar and the bar sits above the home indicator
