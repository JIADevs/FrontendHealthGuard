# Tasks: Design system v2 — foundation (tokens and fonts)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 500–700 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR / work-unit commits |
| Delivery strategy | single-pr |
| Chain strategy | none |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: none
400-line budget risk: Medium (most lines are token tables; the per-file edits are 1–3 lines each)

### Work-Unit Commit Map

| Commit | Scope | Files |
|--------|-------|-------|
| 1 | `feat(ui): add v2 scales, accents, motivation, radii and font tokens` | `tokens.ts` |
| 2 | `feat(ui): derive light and dark themes from v2 semantic tokens` | `semantic.ts`, `theme.ts`, `index.ts`, `web.ts` |
| 3 | `feat(ui): emit v2 CSS variables and keep v1 aliases` | `cssVariables.ts` |
| 4 | `refactor(ui,mobile): move check-ins to the wellbeing accent` | `EventBlock.tsx`, `MonthGridView.tsx`, mobile check-in uses |
| 5 | `fix(ui,mobile,web): replace brand-500 fills and text with v2 brand tokens` | `packages/ui` primitives/forms, mobile files, web CSS |
| 6 | `feat(mobile,web): load Nunito and Inter` | `App.tsx`, `package.json`, `layout.tsx`, `Typography.native.tsx` |
| 7 | `chore: replace hard-coded colors and leftover voseo; add token check` | 4 mobile screens, 2 copy strings, `packages/ui/scripts/` |
| 8 | `docs: mark v2 tokens and fonts as implemented` | ADR 0002, `architecture/design-system.md` |

---

## Phase 1: Tokens (`tokens.ts`) — RF-UI-T3, T4, T6

- [x] 1.1 Add the `teal` scale (50, 100, 200, 300, 500, 600, 700) and the missing steps used by v2: `green[800]`, `orange[200,300,400,800]`, `error[700]` and the 300/400 dark-mode shades of sky, emerald, amber, violet and pink.
- [x] 1.2 `palette.accent`: `document: colors.sky`, `backpack: colors.teal`, `notification: colors.primary`; add `wellbeing: colors.emerald`, `mission: colors.primary`, `treatment: colors.violet`.
- [x] 1.3 Add `palette.motivation = { streak: colors.orange, level: colors.amber, progress: colors.green }`.
- [x] 1.4 `radii`: add `input: 14`, `card: 18`, `modal: 24`, `sheet: 28` (existing keys unchanged).
- [x] 1.5 `fontWeight.black = '900'`; `fontFamily.body` / `heading` (with `--font-inter` / `--font-nunito`); `nativeFontFamily.body` / `heading` maps; `nativeFont(role, weight)`.

## Phase 2: Semantic tokens and theme — RF-UI-T1, T2, T5

- [x] 2.1 Create `tokens/semantic.ts` with `semanticLight` and `semanticDark`, copied from the semantic layer of `.docs/design/system/tokens.css` (scale references where they exist).
- [x] 2.2 Rebuild `lightTheme` / `darkTheme` from `semantic.ts`, keeping every v1 key (see the mapping in `design.md`).
- [x] 2.3 Extend `AppTheme`: `brand.edge/focus/text`, `surface.muted`, `text.onMuted/onSolid`, `status.info*` / `successSolid/Edge` / `dangerSolid/Edge`, `accent.wellbeing*` / `mission*` / `treatment*`, `motivation`.
- [x] 2.4 Export `semanticLight`, `semanticDark` and `nativeFont` from `src/index.ts` **and** `src/web.ts`.
- [x] 2.5 `pnpm exec tsc --noEmit -p apps/mobile`: no new errors against `dev` (`dev` already has 85 pre-existing errors).

## Phase 3: CSS variables — RF-UI-T7

- [x] 3.1 Emit the `--color-*` variables from `semanticLight` in `:root` and from `semanticDark` in the dark blocks.
- [x] 3.2 Emit `--font-heading`, `--font-body` (and keep `--font-sans` as body), plus `--radius-input/card/modal/sheet`.
- [x] 3.3 Recompute the v1 semantic aliases from the new theme (`--text-*`, `--bg*`, `--border*`, `--accent-*`, `--brand-header*`). Keep `--brand-50…900` as the raw scale.

## Phase 4: Check-ins to wellbeing — RF-UI-T3 (check-in scenario)

- [x] 4.1 `HeluAgendaCalendar/EventBlock.tsx` and `MonthGridView.tsx`: check-in colors → `accent.wellbeingBg/Fg`.
- [x] 4.2 `NotificationsScreen` (CHECKIN), `TreatmentDetailScreen` (HeartPulse), `dependientes/colorTokens.ts` (`emerald` id) → wellbeing / `colors.emerald`.
- [x] 4.3 `MedicationCard` intake button → `status.successSolid`.
- [x] 4.4 Grep: no `accent.notification` / `notifBg` / `notifFg` left for check-in meaning.

## Phase 5: `brand[500]` by role — RF-UI-T8, RF-M-F3, RF-W-F2

- [x] 5.1 `packages/ui`: `Button` (web, native) primary → solid; `Chip` default → solid; `Pagination.web` active → solid; `Checkbox` (web, native) fill and checked border → solid; `Spinner` primary → solid; `Pagination.native` chevrons → solid; «Confirmar» in date/time pickers → text; `TextField` / `Select` native focus → focus.
- [x] 5.2 `apps/mobile`: `ExpandableFAB`, `DetailFooter`, `DependientesScreen`, `DependientesInviteScreen`, `DelegationRequestCard` fills → solid. `AuthSubmitButton` gradient → flat solid. `authStyles` links → text. `NotificationsScreen` icons → text on tint. `MoreScreen`, `DependientesScreen`, `App.tsx` spinners and icons → solid.
- [x] 5.3 `apps/web/src/**/*.css`: `background*: var(--brand-500)` → `var(--color-brand-solid)`; `color: var(--brand-500)` → `var(--color-brand-text)`.
- [x] 5.4 Grep gate: no `brand[500]` / `--brand-500` used as a fill or text color in `apps/` and `packages/ui/src`.

## Phase 6: Fonts — RF-M-F1, RF-M-F2, RF-W-F1

- [x] 6.1 `npx expo install expo-font @expo-google-fonts/nunito @expo-google-fonts/inter` in `apps/mobile`.
- [x] 6.2 `App.tsx`: `useFonts` (Inter 400/500/600, Nunito 700/800/900); loading view until `isHydrated && (fontsLoaded || fontError)`; log `fontError`.
- [x] 6.3 `Typography.native`: `h1`–`h4` → `nativeFont('heading', …)`; the other variants → `nativeFont('body', …)`.
- [x] 6.4 `apps/web/src/app/layout.tsx`: `next/font/google` Inter (400/500/600, `--font-inter`) and Nunito (700/800/900, `--font-nunito`), `display: 'swap'`, classes on `<html>`.

## Phase 7: Cleanup and checks — RF-M-F4, RF-M-F5, RF-W-F3

- [x] 7.1 Hex literals: `#e53e3e` → `status.errorFg`; `#FFF3CD` / `#856404` → `status.warningBg/Fg`; `#4ade80` → `motivation.progress`.
- [x] 7.2 Copy: «No tenés check-ins registrados.» → «No tienes check-ins registrados.»; «Todavía no tenés mochilas. Creá la primera.» → «Todavía no tienes mochilas. Crea la primera.»
- [x] 7.3 `packages/ui/scripts/check-tokens.mjs`: compare `semantic.ts` with `tokens.css` (light and dark) and list undefined `var(--…)` in `apps/web/src`.
- [x] 7.4 No new type errors against `dev`: mobile 85 → 83 (2 fixed), web 17 → 17. `next build` compiles but stops on pre-existing type errors (`agenda/page.tsx:108` and others that already fail on `dev`).
- [x] 7.5 Visual check: web login and Documentos in light and dark (button 5.17:1, links 6.70:1, Nunito headings); mobile in the iOS simulator (Expo Go SDK 57). The physical phone needs Expo SDK 58 (separate PR).

## Phase 8: Docs

- [x] 8.1 ADR 0002: mark the button, documents, backpacks, notifications/wellbeing, on-muted text and typography rows as implemented.
- [x] 8.2 `.docs/architecture/design-system.md`: update "Diferencias principales hoy".
- [x] 8.3 After merge: archive this change and merge the deltas into `openspec/specs/` (`shared-ui/`, `mobile/`, `web/`).

## Changes during apply

- **Hue-only accent uses → raw scales.** The green chip, the `create` action, the dependent context colors and the dental document type used the document/backpack accent only for its hue. They now use `colors.green/orange/emerald`, so the accent remap does not change them.
- **Dark `brand.solid` → `#2563EB`.** `tokens.css` had `#3B82F6` (3.68:1), against MASTER §4.5. It was fixed in the design sources too (design CHANGELOG v2.9.1).
- **Static `text` / `surface` / `border` in `tokens.ts` aligned with v2.** Web components read them; secondary text was 4.48:1 on the page background.
- **v1 `--text-muted` alias → `text.secondary`.** `dev` never defined it; web uses it for body text, not placeholders.

## Known issues left for later phases

- The web login card is fixed white while its text follows dark mode, so the page is unreadable in dark mode. This already happened on `dev` (Phase 4).
- `palette.status.error[500]` is used 71 times as text or badge background (3.76:1 with white). Status colors get fixed with the components (Phase 0.2).
