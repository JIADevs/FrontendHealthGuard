# Design system

Fuente: `packages/ui/src/tokens/` + capas de componentes.

## Capas de componentes

| Capa | Path | Ejemplos |
|------|------|----------|
| Tokens | `tokens/` | palette, surface, spacing, theme |
| Primitives | `primitives/` | Button, Typography, Chip, Spinner, EmptyState |
| Forms | `forms/` | TextField, Select, DatePicker, SearchField |
| Containers | `containers/` | Modal, Card |
| Composed | `composed/` | ConfirmModal |
| Platform | `platform/HeluAgendaCalendar/` | Calendario (native) |

Regla: un componente nuevo entra en la capa más baja posible. Si necesita datos del API, suele ser platform/composed o quedar en la app.

## Tokens

Archivo principal: `tokens.ts` (+ `theme.ts`, `cssVariables.ts`).

| Grupo | Uso |
|-------|-----|
| `colors` | Escalas crudas (`primary`, `gray`, … 50–900) |
| `palette` | Semántica de 3 niveles: `brand`, `status.*`, `accent.*`, `neutral`, `surface` |
| `surface` / `text` / `border` | Layout |
| `radii`, `spacing`, `fontSize`, `fontWeight`, `fontFamily`, `nativeFontFamily` | Escalas |
| `shadows`, `overlay`, `toastBg` | Elevación |

Los componentes deben preferir `palette.*` sobre `colors.*` crudos.

Temas: `lightTheme` / `darkTheme`. Web inyecta `--brand-*`, `--bg`, `--text-primary`, etc. vía `generateCssVariables()`.

## Estado objetivo

Este documento describe el código actual. El diseño objetivo (rediseño B, versión 2: tokens nuevos, Nunito + Inter, canto en botones y tarjetas, formularios, movimiento, misiones y reglas web) vive en [`.docs/design/`](../design/README.md). La decisión y la tabla de diferencias código ↔ objetivo están en el [ADR 0002](./adr/0002-adopt-design-system-b.md). Diferencias principales hoy:

- `lightTheme.brand.solid` usa `brand[500]` (3,68:1 con texto blanco); el objetivo es `brand[600]`.
- `palette.accent.document` es green y `backpack` es orange; el objetivo es sky y teal.
- `fontFamily` solo declara Inter (y mobile no la carga); el objetivo agrega Nunito para títulos y botones.

## Lectura siguiente

- [packages/ui.md](./packages/ui.md)
- Skill: `design-system`, `component-creation`
