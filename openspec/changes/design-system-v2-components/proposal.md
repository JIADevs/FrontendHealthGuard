# Proposal: Design system v2 — componentes base visuales (Fase 0.2a)

## Intent

Después de la Fase 0.1, la app tiene los colores y las fuentes de la v2, pero sus componentes siguen siendo los de la v1:
- el botón no tiene canto inferior ni las variantes de éxito y racha;
- no existe un botón de ícono de 44 px;
- los chips no tienen tonos por estado o módulo ni la forma de opción;
- no hay fila de lista ni enlace de peligro.

Además, los colores de estado se usan en tono 500 como texto: hay 46 usos con contraste bajo AA.

Este change construye las **piezas visuales** que van a usar las pantallas de las fases 1 a 3. Es la primera mitad de la Fase 0.2 del issue #35. Toast, ConfirmModal y BottomActionBar van en la 0.2b.

**Plataformas:** `packages/ui` (native y web) y ajustes puntuales de color en `apps/mobile` y `apps/web`. **Backend: sin cambios.**

## Scope

### In Scope

- **Button** (`primitives/Button`), con la API actual compatible:
  - variantes nuevas `success` y `streak`; `danger` pasa a relleno sólido `danger.solid` con texto blanco;
  - alto mínimo de 44 px (`sm`) y 48 px (`md`, por defecto);
  - radio 14 (`sm` 10) y canto inferior de 3 px del tono `edge`; al presionar baja 3 px sin cambiar el alto;
  - etiqueta en Nunito 800;
  - props nuevas `icon`, `iconPosition` y `loadingLabel` (texto en gerundio mientras carga).
- **IconButton** (nuevo, `primitives/IconButton`):
  - círculo de 44 px con tono neutro o tinte;
  - `accessibilityLabel` obligatorio;
  - `badge` opcional.
- **Typography:** roles nuevos `display`, `eyebrow`, `data` y `meta` (MASTER §5) y color `brand`. Las variantes existentes mantienen sus tamaños: cambiarlos afectaría 165 usos y se ajustan al migrar cada pantalla.
- **Chip:**
  - `tone` (`neutral`, `success`, `warning`, `danger`, `info`, `ai`, `streak` y los acentos de módulo) e `icon` opcional;
  - la variante `option`: 44 px, borde y ✓ al estar seleccionado;
  - los `color` actuales (`default`, `green`, `amber`) siguen funcionando.
- **Card:** radio 18 y canto inferior de 3 px, `variant` (`default`, `compact`, `selected`) y `tone` para tintes (`streak`, `ai`, `success`), con el layout actual (título, ícono, acciones, pie).
- **ListRow** (nuevo, `composed/ListRow`): `IconTile` de 40 px con el tinte del módulo, título y metadato con hasta 2 líneas, y acción a la derecha. Incluye **IconTile** (nuevo, `primitives/IconTile`).
- **DangerLink** (nuevo, `primitives/DangerLink`): enlace rojo con ícono, de 44 px de alto, para eliminar o cancelar al final del contenido.
- **Colores de estado como texto:** los usos de `palette.status.{error,success,warning}[500]` como color de texto o de ícono sobre fondo claro pasan al tono 700 o a `theme.status.*Fg`. Los rellenos y los gráficos se quedan como están.
- Exportar todo en `src/index.ts` y `src/web.ts`. Agregar una página de prueba de los componentes en web (`/dev/ui`), solo en desarrollo, para revisarlos a ojo.

### Out of Scope

- **Toast con «Deshacer», ConfirmModal v2 y BottomActionBar:** van en la Fase 0.2b.
- **Migrar pantallas a los componentes nuevos:** es parte de las fases 1 a 3. Las pantallas que ya usan Button, Chip y Card cambian de aspecto solas.
- **Cambiar el tamaño de las variantes actuales de `Typography`.**
- **Formularios v2** (FormField, ChoiceChips, SegmentedControl…): van con las pantallas que los necesitan.

## Risks

| Riesgo | Mitigación |
|---|---|
| Button se usa 82 veces y Card en varias páginas web: el radio y el canto cambian su aspecto | Es el objetivo de la v2. Se revisan en la página `/dev/ui` y en las pantallas principales |
| El canto inferior en React Native cambia el alto o el layout | Se implementa dentro del alto mínimo (el relleno ocupa el alto menos 3 px y el canto los 3 px restantes), así el botón mide lo mismo antes y después de presionarlo |
| La API vieja de Chip (`color`) y la nueva (`tone`) conviven | `color` se traduce internamente a `tone`. Ningún uso actual cambia de código |
| Cambiar los colores de estado de texto toca muchos archivos | Solo los usos como texto o ícono sobre fondo claro; lista cerrada en `tasks.md` |

## Success Criteria

- Cada componente nuevo o extendido existe en native y web, exportado en los dos puntos de entrada.
- Todos los controles miden 44 × 44 px o más; texto blanco sobre `success`, `streak`, `danger` y `primary` ≥ 4,5:1.
- No queda ningún `palette.status.*[500]` usado como color de texto sobre fondo claro.
- Ningún error de tipos nuevo frente a `dev` y `check:tokens` en OK.
