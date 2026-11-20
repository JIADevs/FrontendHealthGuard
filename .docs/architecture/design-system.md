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

Este documento describe el código actual. El diseño objetivo (rediseño B, versión 2: tokens nuevos, Nunito + Inter, canto en botones y tarjetas, formularios, movimiento, misiones y reglas web) vive en [`.docs/design/`](../design/README.md). La decisión y la tabla de diferencias código ↔ objetivo están en el [ADR 0002](./adr/0002-adopt-design-system-b.md). Estado (Fase 0.1, issue #35):

- Tokens, tema y variables CSS ya tienen los valores de la v2. Están en `tokens/semantic.ts`, copia de `.docs/design/system/tokens.css`; `pnpm --filter @helu/ui check:tokens` verifica que coincidan.
- `lightTheme` / `darkTheme` conservan las claves de la v1 y suman las de la v2: `brand.edge/focus/text`, `surface.muted`, `text.onMuted/onSolid`, estados `info` y sólidos, acentos `wellbeing` / `mission` / `treatment` y el grupo `motivation`.
- Web emite las `--color-*` de la v2 y mantiene los nombres de la v1 como alias.
- Nunito e Inter se cargan en las dos apps. En mobile, cada peso es una familia: usar `nativeFont(rol, peso)`, no `fontWeight`.
- Falta la Fase 0.2 (componentes base) y que las pantallas adopten los componentes y las fuentes.

## Lectura siguiente

- [packages/ui.md](./packages/ui.md)
- Skill: `design-system`, `component-creation`
