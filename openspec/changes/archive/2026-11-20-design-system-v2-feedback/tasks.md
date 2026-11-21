# Tasks: Design system v2 — feedback and forms (Phase 0.2b)

### Work-Unit Commit Map

| Commit | Scope |
|--------|-------|
| 1 | `feat(mobile): restyle toasts to v2 and add notify()` |
| 2 | `feat(web): restyle sileo toasts to v2 and add notify()` |
| 3 | `feat(ui): ConfirmModal v2 with safe option first` |
| 4 | `refactor(mobile,web): app confirm dialogs render the shared ConfirmModal` |
| 5 | `feat(ui): add BottomActionBar` |
| 6 | `feat(web): add feedback examples to /dev/ui` |
| 7 | `docs: update componentes.md, ADR 0002 and architecture docs` |

## Phase 1: Toasts

- [x] 1.1 Mobile `ToastConfig`: v2 look (light card, border, elevation 3, 34 px icon tile with the tone tint, Nunito 800 14, action on the right). Position top with a `topOffset` from the safe area; 4 s, or 5 s with an action.
- [x] 1.2 `apps/mobile/src/lib/notify.ts`: `notify({ message, description?, tone: 'success' | 'error' | 'warning' | 'info', action?: { label, onPress } })` over `Toast.show`.
- [x] 1.3 Web `<Toaster>`: top-center, same tones, durations and action button (`button`).
- [x] 1.4 `apps/web/src/lib/notify.ts` with the same signature over `sileo`.
- [x] 1.5 Existing calls (72 mobile, 38 web) unchanged and still working.

## Phase 2: ConfirmModal

- [x] 2.1 `ConfirmModal.types.ts`: add `keepLabel?: string`; keep current props. `consequence` was dropped: `message` already carries it.
- [x] 2.2 Native and web: round IconTile, title as a question, then the consequence; safe option first (secondary), then the action (`danger` or `primary`); stacked when labels do not fit.
- [x] 2.3 `apps/mobile/src/components/ConfirmDialog.tsx` and `apps/web/src/components/ConfirmModal.tsx` render the shared component with their current props (web already re-exported it).

## Phase 3: BottomActionBar

- [x] 3.1 `containers/BottomActionBar`: `primary: { label, onPress, loading?, disabled?, variant? }`, `secondary?`. Native: absolute bottom, safe-area inset, top border, surface background; exports `BOTTOM_ACTION_BAR_HEIGHT`. Web: sticky footer with the same contract.

## Phase 4: Preview and checks

- [x] 4.1 `/dev/ui`: toast with «Deshacer», ConfirmModal, BottomActionBar.
- [ ] 4.2 Simulator and browser check: toast at the top and not covering the header; confirm dialog; bar above the home indicator. Browser done (`/dev/ui`, light and dark). Simulator: app loads; mobile toast, ConfirmDialog and the bar still need a screen that triggers them (no seed appointment; no screen uses the bar until Phase 1).
- [x] 4.3 No new type errors against `dev`.

## Phase 5: Docs

- [x] 5.1 `componentes.md`, ADR 0002, `architecture/design-system.md`.
