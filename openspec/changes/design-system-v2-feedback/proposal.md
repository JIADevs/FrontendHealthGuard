# Proposal: Design system v2 — feedback y formularios (Fase 0.2b)

## Intent

Cierra la Fase 0 del issue #35 con los tres componentes que faltan para que las pantallas puedan seguir las reglas v2 de feedback y formularios:

- **Toast con «Deshacer»** (MASTER §7). Borrar algo recuperable (un documento, sacarlo de una mochila) se confirma con un toast que trae «Deshacer», no con un modal. Dura 4 s, o 5 s si tiene acción, y aparece arriba.
- **ConfirmModal v2.** Solo para lo irreversible o lo que afecta a otra persona. El título es una pregunta con su consecuencia, la opción segura va primero y con nombre propio («Mantener cita»), y después la acción con el verbo exacto.
- **BottomActionBar.** La barra fija abajo de los formularios y flujos de pasos en mobile, con una acción principal de ancho completo, respetando el área segura.

**Plataformas:** `packages/ui`, `apps/mobile` y `apps/web`. **Backend: sin cambios.**

## Hoy

| Pieza | Mobile | Web |
|---|---|---|
| Toast | `react-native-toast-message` con `ToastConfig` propio, fondo oscuro, abajo; 72 llamadas; ya soporta `actionLabel`/`onAction` | `sileo` (`<Toaster position="top-right">`), 38 llamadas; soporta `button`, `duration`, `icon` y `fill` |
| Confirmación | `ConfirmDialog` (app) | `ConfirmModal` (app) y `ConfirmModal` de `@helu/ui`; 24 archivos lo usan entre las dos apps |
| Barra de acción | `DetailFooter` (5 pantallas), sin área segura uniforme | No aplica (modales con pie, `web.md` §2) |

## Decisión clave: toast

**Opción elegida:** mantener las dos librerías y darles el estilo de la v2. Cada app suma una función común `notify({ message, description?, tone, action? })`, con la misma forma en web y mobile, que ponen el tono y la duración correctos.

- Las 110 llamadas actuales siguen funcionando y toman el estilo nuevo solas, porque el cambio está en `ToastConfig` (mobile) y en la configuración de `Toaster` (web).
- El «Deshacer» usa lo que ya traen las librerías: `action` en mobile y `button` en web.

**Descartado:** escribir un toast propio en `@helu/ui` y migrar las 110 llamadas. Da más control, pero mucho más riesgo y diff para el mismo resultado visible.

## Scope

### In Scope

- **Toast:**
  - **Mobile:** `ToastConfig` con el estilo v2: arriba, 320 px, tarjeta clara con borde y sombra de elevación 3, ícono en un cuadro con el tinte del tono, texto en Nunito 800 14 y acción a la derecha. Dura 4 s, o 5 s con acción.
  - **Web:** `Toaster` arriba al centro, con los mismos tonos, la duración y el botón de acción.
  - **`notify()` en cada app:** `apps/mobile/src/lib/notify.ts` y `apps/web/src/lib/notify.ts`.
- **ConfirmModal (`@helu/ui`, native y web):**
  - props nuevas `keepLabel` (la opción segura, por defecto «Cancelar») y `consequence`;
  - la opción segura va primero y el botón de acción usa la variante `danger` (Fase 0.2a);
  - pasa a usar `IconTile` redondo.
  - `ConfirmDialog` (mobile) y `ConfirmModal` (web) de cada app pasan a usar este componente, sin cambiar sus props.
- **BottomActionBar (`@helu/ui`, nuevo):**
  - barra fija abajo con borde superior y área segura;
  - una acción principal de ancho completo y opcionalmente una secundaria (fantasma) arriba;
  - expone su alto, para que el scroll deje espacio abajo y el contenido no quede tapado.
  - En web, el mismo componente sirve como pie fijo de página (`web.md` §2).
- **`/dev/ui`** con un ejemplo de cada uno: un toast con «Deshacer», el diálogo de confirmación y la barra.

### Out of Scope

- Cambiar los flujos de borrado (que dejen de abrir un modal y pasen a toast con «Deshacer»). Va con cada pantalla en las fases 1 a 3, y depende de la decisión de borrado diferido o soft delete del backend que figura en el issue #35.
- Migrar las 5 pantallas con `DetailFooter` a BottomActionBar: Fase 1.
- `DiscardChangesDialog` y `BottomSheet`: van con los formularios de la Fase 1.

## Risks

| Riesgo | Mitigación |
|---|---|
| El toast pasa de abajo a arriba en mobile; en algunas pantallas puede tapar la cabecera | MASTER §7 lo pide arriba. Se ajusta el `topOffset` según el área segura y se revisa en el simulador |
| El estilo de `sileo` tiene límites | Se usa lo que expone (`fill`, `icon`, `styles`). Si algo no se puede, se documenta y se resuelve en la Fase 4 |
| Cambiar `ConfirmDialog` y `ConfirmModal` afecta 24 archivos | Sus props no cambian; solo cambia lo que dibujan adentro |

## Success Criteria

- Un toast con «Deshacer» funciona en web y mobile y dura 5 s; sin acción, 4 s.
- En ConfirmModal la opción segura va primero y la acción usa `danger` (≥ 4,5:1).
- BottomActionBar respeta el área segura y el contenido no queda tapado.
- Ningún error de tipos nuevo frente a `dev`.
