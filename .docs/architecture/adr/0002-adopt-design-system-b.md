# 0002 — Adoptar el sistema de diseño B («Equilibrada»)

- Estado: propuesta
- Fecha: 2026-11-17

## Contexto

La interfaz actual es correcta pero sobria: invita poco a volver cada día, que es justo lo que necesita una app de adherencia (tomas, check-in, misiones). Se exploraron tres direcciones en Figma: A, conservadora; B, equilibrada; y un prototipo gamificado tipo Duolingo. El equipo eligió la **B**.

Al revisar el código y la documentación de producto también aparecieron problemas concretos:
- El color de marca de los botones (`brand[500]`) no pasa contraste AA con texto blanco (3,68:1).
- Hay colores de módulo que chocan: documentos en verde, el mismo color de «completado»; mochilas en naranja, el mismo de la racha.
- La fuente Inter no se carga en mobile.
- Hay voseo mezclado con tuteo.

El PRD de Misiones pide acompañar «sin infantilizar» y evitar «gamificación excesiva o celebraciones exageradas».

## Decisión

Adoptar como estado objetivo el sistema de diseño de [`.docs/design/`](../../design/README.md) (MASTER, reglas por módulo, tokens de tres capas, catálogo de componentes) y los mockups HTML de `.docs/design/mockups/`. El código se migra por fases siguiendo [`componentes.md`](../../design/system/componentes.md).

## Consecuencias

**Se gana:** identidad más cálida y motivadora sin perder seriedad clínica; contraste AA verificado; modo oscuro definido por tokens; reglas comunes para formularios, movimiento y la mascota; diseño de Misiones alineado al PRD.

**Se pierde o cuesta:**
- Cambiar tokens existentes afecta a todos los componentes.
- Hay que cargar Nunito.
- Hay que agregar `react-native-reanimated` y `expo-haptics` para el movimiento propuesto.

**Diferencias entre el código actual y el objetivo** (actualizar esta tabla a medida que se implemente):

| Tema | Código hoy | Objetivo |
|---|---|---|
| Botón primario | `brand.solid = brand[500]` (3,68:1) | `brand[600]` (5,17:1), con canto inferior de 3 px |
| Botones éxito / racha | No existen como variantes | `success` (green-700) y `streak` (orange-700) |
| Documentos | Acento green | Sky |
| Mochilas | Acento orange | Teal (el naranja queda para la racha) |
| Notificaciones / bienestar | Notificación en emerald | Notificación en brand; bienestar en emerald |
| Tipografía | Solo Inter (no cargada en mobile) | Nunito (títulos, botones) + Inter (cuerpo), ambas cargadas |
| Radios | 4–20 | Chip 999 · input 14 · tarjeta 18 · hoja 28 |
| Formularios | Asterisco en obligatorios; validación variable | «(opcional)» en opcionales; reglas de `pages/formularios.md` |
| Motivación | Racha de check-in sin UI dedicada | Tarjeta de racha con pausas, nivel, insignias y misiones, con opción de ocultarlos |
| Misiones | No existen en runtime | Módulo según PRD y `pages/misiones.md` |
| Movimiento | Transiciones nativas de `native-stack` | + fundido en pestañas, hojas con resorte, feedback por acción (`pages/movimiento-interacciones.md`) |
| Microcopy | Voseo mezclado | Tuteo |

**Pendiente:** implementar por fases (P1: tokens, fuentes, botón, campos, hojas, toast, motivación y misiones). Este ADR pasa a «aceptada» cuando el equipo apruebe el inicio de la fase 1.
