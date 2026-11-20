# Spec: shared-ui — Design tokens v2

**Change:** design-system-v2-foundation
**Domain:** shared-ui (`packages/ui/src/tokens`)
**Phase:** spec
**Date:** 2026-11-20
**Source of truth:** `.docs/design/system/tokens.css` (semantic layer, light and dark)

> New domain: `openspec/config.yaml` lists `mobile/`, `shared-api/` and `web/`. Tokens live in `packages/ui` and serve both apps, so they get their own `shared-ui/` folder.

---

## Requirements

### RF-UI-T1 — Semantic theme values match v2

`lightTheme` and `darkTheme` MUST resolve to the same values as the semantic variables in `tokens.css` for:
- brand: solid, edge, tint, tint border, text, focus;
- surfaces: background, surface, muted surface;
- border;
- text: primary, secondary, muted, on muted, on solid;
- status: success, warning, danger, info (background, foreground and the success and danger solid fills);
- feature accents: mission, medication, calendar, document, backpack, AI, treatment, wellbeing, notification;
- motivation: streak, level, progress, track.

#### Scenario: Primary fill passes AA in light mode
- GIVEN the light theme
- WHEN a component renders white text on `theme.brand.solid`
- THEN the fill is `#2563EB` and the contrast ratio is ≥ 4.5:1 (5.17:1)

#### Scenario: Muted text passes AA on white
- GIVEN the light theme
- WHEN `theme.text.muted` is used on `theme.surface.bgCard`
- THEN the color is `#64748B`, not `#9CA3AF`

#### Scenario: Dark brand fill
- GIVEN the dark theme
- WHEN `theme.brand.solid` is read
- THEN it is `#3B82F6` (v2 dark), not `brand[800]`

### RF-UI-T2 — Backward-compatible `AppTheme`

Every key that exists today in `AppTheme` MUST keep its name and type. New keys MAY be added. No consumer may need code changes just to compile.

#### Scenario: Existing consumers compile
- GIVEN the current screens and components that read `theme.accent.docBg`, `theme.brand.tintText` and similar keys
- WHEN the change is applied
- THEN `pnpm exec tsc --noEmit -p apps/mobile` and `pnpm --filter @helu/web build` pass without editing those consumers for type reasons

### RF-UI-T3 — Feature accents reassigned

`palette.accent.document` MUST be the sky scale and `palette.accent.backpack` the teal scale. `palette.accent.notification` MUST be the brand scale. `palette.accent` MUST add `wellbeing` (emerald), `mission` (brand) and `treatment` (violet). Accent foregrounds in the light theme MUST use the 700 shade.

#### Scenario: Document tile uses sky
- GIVEN a component that renders `theme.accent.docBg` / `theme.accent.docFg`
- WHEN it renders in light mode
- THEN the colors are `#F0F9FF` / `#0369A1` (sky), not green

#### Scenario: Backpack tile uses teal
- GIVEN a component that renders `theme.accent.backpackBg` / `theme.accent.backpackFg`
- WHEN it renders in light mode
- THEN the colors are `#F0FDFA` / `#0F766E` (teal), not orange

#### Scenario: Check-ins stay emerald after the split
- GIVEN code that paints check-ins today with the notification accent (`theme.accent.notifBg/notifFg` or `palette.accent.notification`): the calendar legend and events, the CHECKIN notification, treatment detail and the medication card
- WHEN the notification accent becomes the brand scale
- THEN those check-in uses MUST be moved to the new `wellbeing` accent first, so check-ins keep the emerald tint and only real notifications turn blue

### RF-UI-T4 — Motivation palette

`palette.motivation` MUST expose `streak` (orange), `level` (amber) and `progress` (green). The theme MUST expose `motivation.streakBg`, `streakBorder`, `streakText`, `streakSolid`, `streakEdge`, `level`, `levelEdge`, `progress` and `track`.

### RF-UI-T5 — Text on muted surfaces

The theme MUST expose `text.onMuted` (`#475569` light, `#CBD5E1` dark) for text on `surface.muted`, segmented controls and brand tints.

#### Scenario: Gray chip text passes AA
- GIVEN a chip with background `theme.surface.muted`
- WHEN its text uses `theme.text.onMuted`
- THEN the contrast ratio is ≥ 4.5:1

### RF-UI-T6 — Radii and type tokens

`radii` MUST add `input` (14), `card` (18), `modal` (24) and `sheet` (28) without changing existing keys. `fontFamily` MUST add `heading` (Nunito) and `body` (Inter). `fontWeight` MUST add `black` ('900'). `nativeFontFamily` MUST map each role and weight to the loaded family name (for example `body/600 → Inter_600SemiBold`, `heading/900 → Nunito_900Black`).

### RF-UI-T7 — CSS variables for web

`generateCssVariables()` MUST emit:
- the v2 semantic variables (`--color-*`), in light and dark;
- `--font-heading` and `--font-body`;
- the v2 radii (`--radius-input`, `--radius-card`, `--radius-modal`, `--radius-sheet`).

It MUST keep every v1 variable name it emits today, with values derived from the new theme where they are semantic (`--text-*`, `--bg*`, `--border`, `--accent-*`, `--brand-header*`).

#### Scenario: Legacy variable still resolves
- GIVEN a web stylesheet that uses `var(--accent-doc-fg)`
- WHEN the page renders in light mode
- THEN the variable resolves to the v2 document foreground (`#0369A1`)

#### Scenario: Dark block includes v2 variables
- GIVEN `data-theme="dark"` on `<html>`
- WHEN `var(--color-brand-solid)` is read
- THEN it resolves to `#3B82F6`

### RF-UI-T8 — No direct brand-500 for fills or text

Inside `packages/ui/src`, components MUST NOT use `palette.brand[500]` as a fill behind text or as a text color. Focus borders MAY use `brand.focus`. The literal palette scale stays available.

#### Scenario: Primary button fill
- GIVEN `Button` with `variant="primary"` (web or native)
- WHEN it renders
- THEN its background is the v2 brand solid (`#2563EB` in light)
