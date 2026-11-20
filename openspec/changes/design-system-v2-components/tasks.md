# Tasks: Design system v2 — base visual components (Phase 0.2a)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900–1200 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | Single PR with one commit per component |
| Delivery strategy | single-pr |

Decision needed before apply: No
400-line budget risk: High (each commit is self-contained and reviewable on its own)

### Work-Unit Commit Map

| Commit | Scope |
|--------|-------|
| 1 | `feat(ui): add v2 variants, sizes, edge and icon support to Button` |
| 2 | `feat(ui): add IconTile and IconButton` |
| 3 | `feat(ui): add v2 roles to Typography` |
| 4 | `feat(ui): add tones and option chips to Chip` |
| 5 | `feat(ui): restyle Card with v2 radius, edge, variants and tones` |
| 6 | `feat(ui): add ListRow and DangerLink` |
| 7 | `fix(ui,mobile,web): use 700 status shades for text and icons` |
| 8 | `feat(web): add a dev-only /dev/ui page to preview components` |
| 9 | `docs: update componentes.md status, ADR 0002 and architecture docs` |

---

## Phase 1: Button — MASTER §6–7, componentes.md

- [ ] 1.1 `Button.types.ts`: `ButtonVariant` adds `success` and `streak`; new props `icon?: ReactNode`, `iconPosition?: 'start' | 'end'`, `loadingLabel?: string`, `accessibilityLabel?: string`.
- [ ] 1.2 Colors from the theme: primary → `brand.solid` / `brand.edge`; success → `status.successSolid` / `successEdge`; streak → `motivation.streakSolid` / `streakEdge`; danger → `status.dangerSolid` / `dangerEdge`; secondary → surface with border; ghost → transparent with `brand.text`.
- [ ] 1.3 Sizes: `sm` min height 44, `md` 48 (default), `lg` 52. Radius `radii.input` (14), `sm` 10. Nunito 800 label (`nativeFont('heading', 800)` / `fontFamily.heading`).
- [ ] 1.4 Edge: web `box-shadow: 0 3px 0 <edge>`, pressed `translateY(3px)` with no shadow. Native: the edge is drawn inside the min height, and pressing moves the fill down 3 px; the outer height never changes.
- [ ] 1.5 Loading: spinner plus `loadingLabel` (or the label), button disabled; disabled state at 50% opacity with no edge.
- [ ] 1.6 Check that the 82 existing uses compile without changes.

## Phase 2: IconTile and IconButton

- [ ] 2.1 `primitives/IconTile`: square tile of 40 (`md`) or 52 (`lg`), radius 13, background and foreground from a `tone` (module accent, status or `neutral`).
- [ ] 2.2 `primitives/IconButton`: 44 × 44 circle, `tone: 'neutral' | 'tint'`, required `accessibilityLabel`, optional `badge` (dot or number), `onPress`.

## Phase 3: Typography

- [ ] 3.1 New variants: `display` (Nunito 900, 30), `eyebrow` (Nunito 900, 11, uppercase, 0.08em), `data` (Inter 600, 14), `meta` (Inter 400, 13, `text.secondary`).
- [ ] 3.2 New color `brand` (`brand.text`).

## Phase 4: Chip

- [ ] 4.1 `ChipTone`: `neutral | success | warning | danger | info | ai | streak | document | backpack | medication | appointment | wellbeing | mission | treatment`; `icon?: ReactNode`.
- [ ] 4.2 `variant: 'tag' | 'option'`. `option` is 44 px tall, with a border, and shows ✓ and the selected state with the brand tint, not only color.
- [ ] 4.3 `color` (`default`, `green`, `amber`) keeps working, mapped to `tone`.
- [ ] 4.4 Neutral tone text uses `text.onMuted` (≥ 4.5:1).

## Phase 5: Card

- [ ] 5.1 Radius `radii.card` (18), 1 px border plus a 3 px bottom edge in the border color, padding 16 (`compact` 12).
- [ ] 5.2 `variant?: 'default' | 'compact' | 'selected'` (`selected` uses a `brand.solid` border) and `tone?: 'streak' | 'ai' | 'success'` (tinted background and border).
- [ ] 5.3 Existing props and layout unchanged.

## Phase 6: ListRow and DangerLink

- [ ] 6.1 `composed/ListRow`: `icon`, `tone` (IconTile), `title`, `meta`, `trailing` (chip, button or chevron), `onPress` (the whole row is pressable), up to 2 lines for title and meta.
- [ ] 6.2 `primitives/DangerLink`: red text and icon (`status.errorFg`), 44 px tall, centered, `onPress`, `accessibilityRole="button"`.

## Phase 7: Status colors as text

- [ ] 7.1 Replace `palette.status.{error,success,warning}[500]` used as `color` (text or icon on a light background) with the 700 shade or `theme.status.*Fg`. Fills, borders and graphics stay.
- [ ] 7.2 Grep gate: no `color: palette.status.*[500]` / `color={palette.status.*[500]}` left in `apps/` and `packages/ui/src`.

## Phase 8: Preview and checks

- [ ] 8.1 `apps/web/src/app/dev/ui/page.tsx`: every component and variant, light and dark. Returns 404 in production (`process.env.NODE_ENV`).
- [ ] 8.2 Visual check on web (`/dev/ui`) and in the iOS simulator on screens that use Button and Chip.
- [ ] 8.3 Measure: every control ≥ 44 px; white text on primary, success, streak and danger fills ≥ 4.5:1.
- [ ] 8.4 No new type errors against `dev`; `check:tokens` OK.

## Phase 9: Docs

- [ ] 9.1 `componentes.md`: mark Button, IconButton, IconTile, Typography, Chip, Card, ListRow and DangerLink as built.
- [ ] 9.2 ADR 0002 and `architecture/design-system.md`.
