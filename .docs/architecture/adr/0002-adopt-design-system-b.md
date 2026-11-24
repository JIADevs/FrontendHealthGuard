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
| Botón primario | **Hecho:** relleno `brand[600]` (5,17:1) en claro y oscuro, con canto inferior de 3 px (kit `Button`) | `brand[600]` (5,17:1), con canto inferior de 3 px |
| Botones éxito / racha | **Hecho (Fase 0.2a):** variantes `success` y `streak`, con canto inferior de 3 px en todos los rellenos | `success` (green-700) y `streak` (orange-700) |
| Documentos | **Hecho (Fase 0.1):** acento sky | Sky |
| Mochilas | **Hecho (Fase 0.1):** acento teal | Teal (el naranja queda para la racha) |
| Notificaciones / bienestar | **Hecho (Fase 0.1):** notificación en brand; los check-ins pasaron a `wellbeing` (emerald) | Notificación en brand; bienestar en emerald |
| Texto sobre gris | **Hecho (Fase 0.1):** `text.onMuted` en el tema y `--color-text-on-muted` en web | `color.text.on-muted` (`#475569`) para chips grises, segmentado y tintes de marca |
| Tipografía | **Hecho (Fase 0.1):** Nunito e Inter cargadas en mobile (`expo-font`) y web (`next/font`); las usa `Typography`. Las pantallas las adoptan al migrar a los componentes nuevos | Nunito (títulos, botones) + Inter (cuerpo), ambas cargadas |
| Radios | **Hecho en mobile (fases 1–14):** chip 999 · input 14 · tarjeta 18 · hoja 28 en el kit y en las pantallas migradas. Web: pendiente | Chip 999 · input 14 · tarjeta 18 · hoja 28 |
| Áreas táctiles | **Mobile:** los controles del kit (botones, chips, filas, muestras de color) miden 44 px o más. Web: la paginación sigue en 32 px (`Pagination.web.tsx:27`) | 44 × 44 px visibles en todo control, en móvil y en web |
| Formularios | **Hecho en mobile:** «(opcional)» en opcionales, una columna, `BottomActionBar` fijo y «¿Descartar los cambios?» al volver con cambios (`DiscardChangesDialog`). Web: pendiente | «(opcional)» en opcionales, una columna (también en web) y el resto de `pages/formularios.md` |
| Motivación | **Parcial:** tarjeta de racha en Inicio con la semana y el récord. Faltan nivel e insignias (esperan gamificación, #65). *2026-11-24:* las «pausas» de racha salen del MVP (el backend no las tiene) | Tarjeta de racha, nivel (nombre configurable que llega de la API) y 8 insignias, con opción de ocultar racha y nivel. Reglas: `BackendHealthGuard/.docs/features/motivation/prd.md` |
| Misiones | No existen en runtime | Módulo según PRD y `pages/misiones.md` |
| Movimiento | **Hecho en mobile (fases 1–14):** `react-native-reanimated` y `expo-haptics`; tokens `motion` y helpers en `packages/ui/src/motion/`; fundido en pestañas, hojas con resorte, esqueletos, feedback por acción y respeto de «Reducir movimiento». Web (CSS y View Transitions): pendiente | + fundido en pestañas, hojas con resorte, feedback por acción y esqueletos de carga (`pages/movimiento-interacciones.md`) |
| Acciones optimistas | **Hecho (fase 1):** toma y check-in optimistas; revocar delegación espera al servidor. Misiones: cuando existan | Toma, check-in y pasos de misión optimistas; revocar delegación espera al servidor |
| Web: navegación | Barra lateral de 8 entradas con Perfil y Configuraciones; se oculta a 768 px; detalles y formularios en modales sin URL | Barra lateral de 5 destinos + «Más», cuenta en el menú del avatar, cortes a 1280 y 1024 px, URL por detalle y formulario (`pages/web.md`) |
| Microcopy | **Hecho:** tuteo (#38). En modo gestión, Inicio y Más hablan de la otra persona («No tiene citas próximas», «Su salud») | Tuteo |
| Estados de carga y error | **Hecho en mobile (fase 14):** esqueletos en cada lista; «Error al cargar» (Helu pensando, causa y «Reintentar») en Inicio, Documentos, Agenda (las cuatro pestañas), Mochilas y Notificaciones; banda «Sin conexión» arriba con NetInfo conectado al `onlineManager` de TanStack Query. Web: pendiente | Mensaje en el lugar del contenido, con la causa y «Reintentar»; nunca una pantalla en blanco ni un «vacío» falso (`pages/movimiento-interacciones.md`, mockup m7) |

**Fase 0.1 (tokens, tema, variables CSS y fuentes):** hecha en el change `design-system-v2-foundation` (issue #35). Los valores viven en `packages/ui/src/tokens/semantic.ts`, copia de `tokens.css`, y `pnpm --filter @helu/ui check:tokens` verifica que coincidan.

**Fase 0.2a (componentes visuales):** hecha en el change `design-system-v2-components`.

**Fase 0.2b (feedback y formularios):** hecha en el change `design-system-v2-feedback`:

- **Toast:** se mantienen `sileo` (web) y `react-native-toast-message` (mobile) con el estilo v2, arriba, 4 s o 5 s con acción. Cada app tiene `notify({ message, description?, tone, action? })` con la misma firma. En web, `globals.css` cambia los colores de estado de `sileo` (500) por 700–800 sobre el toast claro y 400 sobre el oscuro, para pasar AA.
- **ConfirmModal:** opción segura primero con `keepLabel`, `IconTile` redondo y colores del tema. `ConfirmDialog` (mobile) dibuja este componente. La consecuencia va en `message`; no hizo falta una prop `consequence`.
- **BottomActionBar:** nuevo en `@helu/ui`, con `BOTTOM_ACTION_BAR_HEIGHT` y el área segura en mobile; en web es un pie `sticky`.

**Fases 1–14 (pantallas móviles):** hechas en sub-issues de #35, una rama y un PR por fase (las 10–14 apiladas). Tratamientos (fase 8) sigue en #42. Lo que no se pudo hacer y por qué está en cada sub-issue y en el reporte final de #35.

**Siguiente paso:** la web, con las reglas de [`pages/web.md`](../../design/system/pages/web.md), empezando por Inicio y Agenda.
