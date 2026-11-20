# Spec: shared-ui — Base visual components v2

**Change:** design-system-v2-components
**Domain:** shared-ui (`packages/ui/src`)
**Phase:** spec
**Date:** 2026-11-20
**Source:** `.docs/design/system/MASTER.md` §5–7, `.docs/design/system/componentes.md`

## Requirements

### RF-UI-C1 — Button variants and states

`Button` MUST support `primary`, `secondary`, `success`, `streak`, `danger` and `ghost`. Filled variants MUST show white text at ≥ 4.5:1 and a 3 px bottom edge in their edge color. Pressing MUST move the fill down 3 px without changing the button's outer height. `sm` MUST be ≥ 44 px tall and `md` ≥ 48 px. While `loading`, the button MUST be disabled and show a spinner plus `loadingLabel` when one is given.

#### Scenario: Existing call sites keep working
- GIVEN the current `<Button variant="secondary">` uses
- WHEN the change is applied
- THEN they compile unchanged and render with the v2 styling

#### Scenario: Success button contrast
- GIVEN `<Button variant="success">`
- WHEN it renders in light mode
- THEN its fill is `#15803D` with white text (≥ 4.5:1) and a `#166534` edge

### RF-UI-C2 — IconButton

`IconButton` MUST be 44 × 44 px, MUST require `accessibilityLabel` (enforced by the type), and MAY show a `badge`.

### RF-UI-C3 — Typography roles

`Typography` MUST add the `display`, `eyebrow`, `data` and `meta` variants with the font, weight and size from MASTER §5. Existing variants MUST keep their sizes.

### RF-UI-C4 — Chip tones and options

`Chip` MUST accept a `tone` for status, AI, streak and the module accents. Neutral chip text MUST be ≥ 4.5:1. The `option` variant MUST be ≥ 44 px tall and MUST mark the selected state with ✓, not only with color. The existing `color` prop MUST keep working.

### RF-UI-C5 — Card

`Card` MUST use radius 18 and a 3 px bottom edge, and MUST support `variant` (`default`, `compact`, `selected`) and `tone` (`streak`, `ai`, `success`) without changing its current props.

### RF-UI-C6 — ListRow and DangerLink

- `ListRow` MUST render an `IconTile` of 40 px with the module tint, a title and meta of up to 2 lines each, and a trailing slot. When `onPress` is set, the whole row MUST be pressable.
- `DangerLink` MUST be ≥ 44 px tall, red (`status.errorFg`) with an icon, and exposed as a button to assistive technology.

### RF-UI-C7 — Status colors as text

No component or screen MAY use `palette.status.{error,success,warning}[500]` as a text or icon color on a light background. These uses MUST be the 700 shade or `theme.status.*Fg`.

#### Scenario: Error text
- GIVEN an inline error message on a white card
- WHEN it renders
- THEN its color is `#B91C1C` (≥ 4.5:1), not `#EF4444`

### RF-UI-C8 — Exports and preview

Every new component MUST be exported from `src/index.ts` and `src/web.ts`. A development-only page `/dev/ui` in `apps/web` MUST show every component and variant, and MUST NOT be reachable in production.
