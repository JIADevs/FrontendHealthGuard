# 0002 — Adoptar el sistema de diseño B («Equilibrada»)

- Estado: aceptada (2026-11-20)
- Fecha: 2026-11-17
- Versión vigente del diseño: v2 (auditoría UX del 2026-11-18 y auditoría web de la v2.8)

## Contexto

La interfaz actual es correcta pero sobria: invita poco a volver cada día, que es justo lo que necesita una app de adherencia (tomas, check-in, misiones). Se exploraron tres direcciones en Figma: A, conservadora; B, equilibrada; y un prototipo gamificado tipo Duolingo. El equipo eligió la **B**.

Al revisar el código y la documentación de producto también aparecieron problemas concretos:
- El color de marca de los botones (`brand[500]`) no pasa contraste AA con texto blanco (3,68:1).
- Hay colores de módulo que chocan: documentos en verde, el mismo color de «completado»; mochilas en naranja, el mismo de la racha.
- La fuente Inter no se carga en mobile.
- Hay voseo mezclado con tuteo.

El PRD de Misiones pide acompañar «sin infantilizar» y evitar «gamificación excesiva o celebraciones exageradas».

Después, una auditoría UX de las pantallas móviles (2026-11-18) y una de la web (v2.8) dieron la **v2**. Las pantallas web también tienen reglas propias: lista + detalle, modales, cabecera, anchos de pantalla y URL.

## Decisión

Adoptar como estado objetivo el sistema de diseño de [`.docs/design/`](../../design/README.md): MASTER, reglas por módulo (incluida la [web](../../design/system/pages/web.md)), tokens de tres capas y catálogo de componentes. También los mockups HTML de `.docs/design/mockups/`.

El código se migra por fases siguiendo [`componentes.md`](../../design/system/componentes.md). La v2 reemplazó a la v1 en esa carpeta el 2026-11-20; la v1 queda en el historial de git (`a79a55b`).

## Consecuencias

**Se gana:**
- Identidad más cálida y motivadora sin perder seriedad clínica.
- Contraste AA verificado.
- Modo oscuro definido por tokens.
- Reglas comunes para formularios, movimiento, estados de carga y la mascota.
- Reglas propias para la web.
- Diseño de Misiones alineado al PRD.

**Se pierde o cuesta:**
- Cambiar tokens existentes afecta a todos los componentes.
- Hay que cargar Nunito.
- Hay que agregar `react-native-reanimated` y `expo-haptics` para el movimiento propuesto.
- En web, cada detalle y cada formulario necesita su URL, lo que obliga a rehacer la navegación de los modales.

**Diferencias entre el código actual y el objetivo** (actualizar esta tabla a medida que se implemente):

| Tema | Código hoy | Objetivo |
|---|---|---|
| Botón primario | **Hecho (Fase 0.1):** relleno `brand[600]` (5,17:1) en claro y oscuro. Falta el canto inferior de 3 px | `brand[600]` (5,17:1), con canto inferior de 3 px |
| Botones éxito / racha | **Hecho (Fase 0.2a):** variantes `success` y `streak`, con canto inferior de 3 px en todos los rellenos | `success` (green-700) y `streak` (orange-700) |
| Documentos | **Hecho (Fase 0.1):** acento sky | Sky |
| Mochilas | **Hecho (Fase 0.1):** acento teal | Teal (el naranja queda para la racha) |
| Notificaciones / bienestar | **Hecho (Fase 0.1):** notificación en brand; los check-ins pasaron a `wellbeing` (emerald) | Notificación en brand; bienestar en emerald |
| Texto sobre gris | **Hecho (Fase 0.1):** `text.onMuted` en el tema y `--color-text-on-muted` en web | `color.text.on-muted` (`#475569`) para chips grises, segmentado y tintes de marca |
| Tipografía | **Hecho (Fase 0.1):** Nunito e Inter cargadas en mobile (`expo-font`) y web (`next/font`); las usa `Typography`. Las pantallas las adoptan al migrar a los componentes nuevos | Nunito (títulos, botones) + Inter (cuerpo), ambas cargadas |
| Radios | 4–20 | Chip 999 · input 14 · tarjeta 18 · hoja 28 |
| Áreas táctiles | Sin mínimo común; la paginación web mide 32 px (`Pagination.web.tsx:27`) | 44 × 44 px visibles en todo control, en móvil y en web |
| Formularios | Asterisco en obligatorios; validación variable | «(opcional)» en opcionales, una columna (también en web) y el resto de `pages/formularios.md` |
| Motivación | Racha de check-in sin UI dedicada | Tarjeta de racha con pausas, nivel, insignias y misiones, con opción de ocultarlos |
| Misiones | No existen en runtime | Módulo según PRD y `pages/misiones.md` |
| Movimiento | **En curso (Fase 1, mobile):** `react-native-reanimated` y `expo-haptics` instalados; tokens `motion` en `tokens.ts` y helpers en `packages/ui/src/motion/` (fade through, toque con escala, rebote, resaltado, esqueletos con un solo brillo). Formularios suben desde abajo; pestañas con fundido de 150 ms; hoja con resorte, cierre de 220 ms y umbral 30 % / 800 px/s; esqueletos en Agenda y citas; «Tomar» → «✓ Tomado» con fade through y háptica. Tratamientos (Fase 8) ya lo usa en lista, detalle, hoja y edición. Falta: web (CSS y View Transitions) y el resto de pantallas al migrarlas | + fundido en pestañas, hojas con resorte, feedback por acción y esqueletos de carga (`pages/movimiento-interacciones.md`) |
| Acciones optimistas | Solo colores de contexto y revocar delegación (`onMutate` en `reactQueryHooks.ts`) | Toma, check-in y pasos de misión optimistas; revocar delegación espera al servidor |
| Web: navegación | Barra lateral de 8 entradas con Perfil y Configuraciones; se oculta a 768 px; detalles y formularios en modales sin URL | Barra lateral de 5 destinos + «Más», cuenta en el menú del avatar, cortes a 1280 y 1024 px, URL por detalle y formulario (`pages/web.md`) |
| Microcopy | Voseo mezclado | Tuteo |

**Fase 0.1 (tokens, tema, variables CSS y fuentes):** hecha en el change `design-system-v2-foundation` (issue #35). Los valores viven en `packages/ui/src/tokens/semantic.ts`, copia de `tokens.css`, y `pnpm --filter @helu/ui check:tokens` verifica que coincidan.

**Fase 0.2a (componentes visuales):** hecha en el change `design-system-v2-components`.

**Fase 0.2b (feedback y formularios):** hecha en el change `design-system-v2-feedback`:

- **Toast:** se mantienen `sileo` (web) y `react-native-toast-message` (mobile) con el estilo v2, arriba, 4 s o 5 s con acción. Cada app tiene `notify({ message, description?, tone, action? })` con la misma firma. En web, `globals.css` cambia los colores de estado de `sileo` (500) por 700–800 sobre el toast claro y 400 sobre el oscuro, para pasar AA.
- **ConfirmModal:** opción segura primero con `keepLabel`, `IconTile` redondo y colores del tema. `ConfirmDialog` (mobile) dibuja este componente. La consecuencia va en `message`; no hizo falta una prop `consequence`.
- **BottomActionBar:** nuevo en `@helu/ui`, con `BOTTOM_ACTION_BAR_HEIGHT` y el área segura en mobile; en web es un pie `sticky`.

**Siguiente paso:** las pantallas, empezando por Agenda e Inicio en móvil (Fase 1). Ahí se cambian los borrados recuperables a toast con «Deshacer» y las 5 pantallas con `DetailFooter` a `BottomActionBar`.

**Fase 8 (Tratamientos, móvil, issue #42):**

- Lista, detalle, hoja «Nuevo tratamiento» y pantalla «Editar tratamiento» viven en `apps/mobile/src/components/treatments/`; las pantallas solo leen la ruta. Se borraron `TreatmentFormScreen` y las copias `* 2.tsx` de las tres pantallas.
- Usa componentes v2 que ya existían (`ScreenHeader`, `SearchField`, `SegmentedControl`, `IconTile` con el acento `treatment`, `BottomSheet`, `BottomActionBar`, `ConfirmModal`, `DangerLink`, `DiscardChangesDialog`, esqueletos, `usePullRefresh`, `useHighlight`). No cambia `@helu/ui`.
- `@helu/api`: `invalidateTreatmentQueries()` refresca el detalle cuando se le vincula o se edita algo; `useTreatmentFormCore` envía `null` para vaciar un campo al editar, entrega el id guardado y el error crudo (`onSaveError`) para poner los 422 bajo cada campo.
- Lo que el API no tiene se omite (sin cambios de backend): misiones, especialidad en las tarjetas, frecuencia de los medicamentos, y hora, médico y especialidad de las citas. Los conteos de las tarjetas («Metformina», «3 documentos», «4 citas») salen del detalle de cada tratamiento, porque la lista no los trae. La lista de brechas está en el issue #42.
- «Error al cargar» (m7) en lista, detalle y edición cuando la petición falla por red o servidor; un 4xx sigue siendo «Tratamiento no encontrado».
- «Editar tratamiento» no tiene mockup: pantalla completa desde la derecha con «Estado» segmentado. Pasar a Completado o Inactivo con ciclos abiertos pide confirmación, porque el servidor los finaliza.
