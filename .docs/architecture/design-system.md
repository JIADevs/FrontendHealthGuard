# Design system

Fuente: `packages/ui/src/tokens/` + capas de componentes.

## Capas de componentes

| Capa | Path | Ejemplos |
|------|------|----------|
| Tokens | `tokens/` | palette, surface, spacing, theme |
| Primitives | `primitives/` | Button, Typography, Chip, Spinner, EmptyState |
| Forms | `forms/` | TextField, Select, DatePicker, SearchField |
| Containers | `containers/` | Modal, Card, BottomActionBar |
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

Este documento describe el código actual. El diseño objetivo (rediseño B, versión 2) vive en [`.docs/design/`](../design/README.md). La decisión y la tabla de diferencias código ↔ objetivo están en el [ADR 0002](./adr/0002-adopt-design-system-b.md).

- **Tokens y tema (fase 0.1):** valores de la v2 en `tokens/semantic.ts`, copia de `.docs/design/system/tokens.css`; `pnpm --filter @helu/ui check:tokens` verifica que coincidan. `lightTheme` / `darkTheme` conservan las claves de la v1 y suman las de la v2. Web emite las `--color-*` de la v2 con alias de la v1.
- **Fuentes:** Nunito e Inter en las dos apps. En mobile, cada peso es una familia: usar `nativeFont(rol, peso)`, no `fontWeight`.
- **Componentes base (fases 0.2 y 2):** `Button` con canto, `Chip`, `IconTile`, `SegmentedControl`, `ChoiceChips`, `BottomSheet`, `BottomActionBar`, `ConfirmModal`, `DiscardChangesDialog`, `notify` y los helpers de `motion/`.
- **Pantallas móviles (fases 1–14):** migradas. Tratamientos (fase 8, #42) usa `hooks/useTreatmentForm.ts` sobre `useTreatmentFormCore` para la validación de `pages/formularios.md` §6–7. La web sigue en la v1.

### Piezas de la app mobile (no están en `@helu/ui`)

Usan la mascota o datos de la app, así que viven en `apps/mobile/src/components/`:

| Pieza | Dónde | Para qué |
|------|------|------|
| `EmptyHero` | `states/EmptyHero.tsx` | Kit `empty` (m9): mascota de 100 px, título, una línea y hasta dos acciones |
| `LoadError` | `states/LoadError.tsx` | m7 «Error al cargar»: el título completo (para que el verbo concuerde), la causa y «Reintentar» |
| `OfflineBanner` | `states/OfflineBanner.tsx` | m7 «Sin conexión»: banda oscura arriba mientras no hay red; `BelowOfflineBanner` (un `SafeAreaProvider` anidado) baja las pantallas en vez de taparlas |
| `ScreenHeader`, `FormCard`, `MascotHint` | `ScreenHeader.tsx`, `agenda/FormCard.tsx`, `brand/` | Cabecera con «atrás», tarjeta de formulario y consejo de Helu |

La conectividad sale de NetInfo, conectado al `onlineManager` de TanStack Query en `App.tsx`: las consultas se intentan una vez aunque no haya red (así una pantalla sin caché muestra «Error al cargar» en vez de un esqueleto eterno), no reintentan sin red y se refrescan solas al volver.

## Lectura siguiente

- [packages/ui.md](./packages/ui.md)
- Skill: `design-system`, `component-creation`
