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
| Botón primario | `brand.solid = brand[500]` (3,68:1) | `brand[600]` (5,17:1), con canto inferior de 3 px |
| Botones éxito / racha | No existen como variantes | `success` (green-700) y `streak` (orange-700) |
| Documentos | Acento green | Sky |
| Mochilas | Acento orange | Teal (el naranja queda para la racha) |
| Notificaciones / bienestar | Notificación en emerald | Notificación en brand; bienestar en emerald |
| Texto sobre gris | No existe un token propio | `color.text.on-muted` (`#475569`) para chips grises, segmentado y tintes de marca |
| Tipografía | Solo Inter (no cargada en mobile) | Nunito (títulos, botones) + Inter (cuerpo), ambas cargadas |
| Radios | 4–20 | Chip 999 · input 14 · tarjeta 18 · hoja 28 |
| Áreas táctiles | Sin mínimo común; la paginación web mide 32 px (`Pagination.web.tsx:27`) | 44 × 44 px visibles en todo control, en móvil y en web |
| Formularios | Asterisco en obligatorios; validación variable | «(opcional)» en opcionales, una columna (también en web) y el resto de `pages/formularios.md` |
| Motivación | Racha de check-in sin UI dedicada | Tarjeta de racha con pausas, nivel, insignias y misiones, con opción de ocultarlos |
| Misiones | No existen en runtime | Módulo según PRD y `pages/misiones.md` |
| Movimiento | Transiciones nativas de `native-stack` | + fundido en pestañas, hojas con resorte, feedback por acción y esqueletos de carga (`pages/movimiento-interacciones.md`) |
| Acciones optimistas | Solo colores de contexto y revocar delegación (`onMutate` en `reactQueryHooks.ts`) | Toma, check-in y pasos de misión optimistas; revocar delegación espera al servidor |
| Web: navegación | Barra lateral de 8 entradas con Perfil y Configuraciones; se oculta a 768 px; detalles y formularios en modales sin URL | Barra lateral de 5 destinos + «Más», cuenta en el menú del avatar, cortes a 1280 y 1024 px, URL por detalle y formulario (`pages/web.md`) |
| Microcopy | Voseo mezclado | Tuteo |

**Siguiente paso:** Fase 0 (P1): tokens, fuentes y componentes base (Button, IconButton, Chip, Card, Typography, Toast con «Deshacer», BottomActionBar, ConfirmModal, DangerLink). Después vienen las pantallas, empezando por Agenda e Inicio en móvil.
