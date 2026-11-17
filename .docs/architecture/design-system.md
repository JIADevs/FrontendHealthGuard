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

## Lectura siguiente

- [packages/ui.md](./packages/ui.md)
- Skill: `design-system`, `component-creation`
