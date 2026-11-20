# Spec: web — Fonts and v2 colors

**Change:** design-system-v2-foundation
**Domain:** web (`apps/web`)
**Phase:** spec
**Date:** 2026-11-20

> In scope explicitly: web consumes the shared tokens through `generateCssVariables()` and must load the same fonts. Web layout and screen changes stay in Phase 4.

---

## Requirements

### RF-W-F1 — Load fonts with next/font

`apps/web/src/app/layout.tsx` MUST load Nunito (700, 800, 900) and Inter (400, 500, 600) with `next/font/google`, with `display: "swap"`. It MUST expose them so that `--font-heading` resolves to Nunito and `--font-body` / `--font-sans` resolve to Inter, each with a system fallback.

#### Scenario: Body text uses Inter
- GIVEN any page
- WHEN the body text renders
- THEN its computed `font-family` starts with the Inter family that `next/font` generates

#### Scenario: Headings can use Nunito
- GIVEN an element styled with `font-family: var(--font-heading)`
- WHEN it renders
- THEN its computed `font-family` starts with the Nunito family that `next/font` generates

### RF-W-F2 — Primary fills and brand text use v2 variables

Rules in `apps/web/src` that paint a fill behind text with `var(--brand-500)` MUST use `var(--color-brand-solid)`. Rules that use `var(--brand-500)` as a text color MUST use `var(--color-brand-text)`. Borders and focus rings MAY keep their current variables.

#### Scenario: Primary button contrast
- GIVEN a primary button on any web page in light mode
- WHEN it renders
- THEN its background is `#2563EB` and white text on it is ≥ 4.5:1

### RF-W-F3 — No visual breaks from renamed variables

Every `var(--…)` used in `apps/web/src` MUST still resolve to a defined value in light and dark mode after the change.

#### Scenario: Unknown variable check
- GIVEN the list of variables used in `apps/web/src`
- WHEN it is compared with the variables emitted by `generateCssVariables()` and `globals.css`
- THEN no used variable is undefined
