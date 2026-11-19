# Helu · Sistema de diseño (MASTER)

> **Fuente global de verdad visual de Helu.** Si existe un archivo en `pages/<pantalla>.md`, sus reglas mandan sobre este para esa pantalla. Los valores exactos están en [`tokens.json`](./tokens.json) (DTCG) y [`tokens.css`](./tokens.css). Vista previa: [`preview.html`](./preview.html).
>
> **Versión:** 2.0 · 2026-11-18 (v1.0 del 2026-11-17 + auditoría UX; cambios en [`../CHANGELOG.md`](../CHANGELOG.md)) · Basado en: código de `FrontendHealthGuard` (`packages/ui/src/tokens`), `.docs/` de frontend y backend (visión, personas, glosario, PRD de Misiones), el rediseño B («Equilibrada») en Figma y los mockups HTML de [`../mockups/`](../mockups/README.md), y la base de datos de la skill ui-ux-pro-max.

---

## 1. Para quién diseñamos

**Negocio:** app de gestión de salud personal (B2C, Colombia, español). Identidad documental, agenda de salud, misiones médicas y cuidado delegado. Modelo freemium con suscripción (Wompi).

**Nicho:** salud personal y adherencia en un sistema con EPS, autorizaciones y prestadores: el paciente carga con trámites. Helu convierte esa burocracia en pasos pequeños.

| Persona | Contexto real | Qué exige al diseño |
|---|---|---|
| **Paciente crónico** (30–65) | Varios especialistas, medicación diaria, PDFs sueltos en WhatsApp. | Encontrar rápido, ver «qué tengo hoy», compartir sin fricción. |
| **Cuidador / gestor** (35–60) | Gestiona a un hijo o adulto mayor; cambia de contexto varias veces al día. | Saber **siempre** en nombre de quién actúa. Cero ambigüedad. |
| **Usuario con adherencia** | Vive de las notificaciones; responde en segundos. | Acciones de un toque, feedback inmediato, rachas que motiven sin castigar. |
| **Usuario web ocasional** | Escritorio, documentos y mochilas. | Paridad en lo crítico, layouts amplios, teclado. |

**Consecuencias de diseño:** público adulto y mayor → texto ≥ 15 px, contraste AA (objetivo AAA en texto clave), objetivos táctiles ≥ 44 px. Contexto de salud → nada infantil, nada que culpe. Uso diario y breve → lo siguiente primero, todo lo demás a un toque.

---

## 2. Principios

1. **Lo siguiente, no todo.** Cada pantalla destaca una acción principal (el próximo paso de la misión, la toma de hoy). El resto se consulta. **Una sola acción primaria por pantalla:** las demás van como secundario, fantasma o enlace. Si hay varias candidatas, gana la más urgente (toma pendiente → check-in → paso de misión).
2. **Acompañar sin infantilizar.** Cercano, claro y profesional. La motivación es un apoyo, no el producto.
3. **Progreso visible y honesto.** Nada se marca como hecho solo porque pasó la fecha; el estado viene del servidor.
4. **Claridad clínica primero.** Datos médicos (dosis, fechas, autorizaciones) siempre legibles, nunca decorados.
5. **Accesible para todas las edades.** Contraste, tamaño, foco visible y movimiento reducido no son opcionales.

---

## 3. Estilo: «Equilibrado»

Mezcla de **Accesible y ético** + **Flat** con una sola concesión de profundidad: un **borde inferior más grueso** en tarjetas y botones que los hace sentir «presionables». Es la propuesta B elegida.

| Sí | No |
|---|---|
| Superficies blancas sobre fondo `#F6F8FC`, borde 1 px + borde inferior 3 px | Sombras 3D gruesas tipo Duolingo, neumorfismo, glassmorphism |
| Esquinas redondeadas (14–18 px) | Esquinas de 4 px «corporativas» o píldoras en todo |
| Color por módulo en íconos y tintes | Fondos saturados en bloques grandes |
| Títulos en Nunito, cuerpo en Inter | Mayúsculas en botones, tipografías infantiles |
| Íconos Lucide de trazo 2 px | Emojis como íconos, íconos rellenos mezclados |

---

## 4. Color

### 4.1 Marca y neutros

| Token semántico | Claro | Oscuro | Uso |
|---|---|---|---|
| `color.brand.solid` | `#2563EB` (blue-600) | `#3B82F6` | Botón primario, FAB, nav activa |
| `color.brand.edge` | `#1E40AF` | `#1D4ED8` | Borde inferior del botón primario |
| `color.brand.tint` | `#EFF6FF` | `rgba(59,130,246,.14)` | Fondos de chips, ítems activos |
| `color.brand.text` | `#1D4ED8` | `#93C5FD` | Texto sobre tinte, enlaces |
| `color.bg` | `#F6F8FC` | `#0C1222` | Fondo de pantalla |
| `color.surface` | `#FFFFFF` | `#1E293B` | Tarjetas, hojas, modales |
| `color.border` | `#E2E8F0` | `#334155` | Bordes y divisores |
| `color.text.primary` | `#0F172A` | `#F8FAFC` | Títulos y datos |
| `color.text.secondary` | `#6B7280` | `#94A3B8` | Subtítulos, metadatos |
| `color.text.muted` | `#64748B` | `#94A3B8` | Placeholders (no usar `#94A3B8` sobre blanco: 2,56:1) |

> **Cambio respecto al código:** hoy `lightTheme.brand.solid = brand[500]` (`#3B82F6`). Texto blanco sobre él da **3,68:1** y no pasa AA. Pasa a `brand[600]`, que da 5,17:1.
>
> **v2:** `#94A3B8` tampoco se usa en íconos funcionales sobre fondo claro (pestaña inactiva, mostrar contraseña, limpiar búsqueda, «⋯»): no llega a 3:1. Usar `#64748B`. Lo mismo para textos de 11–12 px sobre tintes: el día seleccionado del calendario va en blanco, y los días de la racha en `#C2410C` (hechos) y `#6B7280` (futuros).

### 4.2 Estados

| Estado | Fondo | Texto/ícono | Sólido (con texto blanco) |
|---|---|---|---|
| Éxito / completado / tomado | `#F0FDF4` | `#15803D` | `#15803D` (5,02:1), borde `#166534` |
| Advertencia / pendiente | `#FFFBEB` | `#B45309` | — |
| Error / no tomado / eliminar | `#FEF2F2` | `#B91C1C` | `#DC2626` (4,83:1), borde `#991B1B` |
| Información | `#F0F9FF` | `#0369A1` | — |

### 4.3 Acentos por módulo

| Módulo | Escala | Tinte | Ícono/texto | Cambio vs. código |
|---|---|---|---|---|
| Misiones | brand + success | `#EFF6FF` | `#2563EB` | Nuevo |
| Medicamentos | amber | `#FFFBEB` | `#B45309` | Igual |
| Citas / calendario | pink | `#FDF2F8` | `#BE185D` | Igual |
| Documentos | sky | `#F0F9FF` | `#0369A1` | **green → sky.** El verde queda reservado para «completado». |
| Mochilas | teal | `#F0FDFA` | `#0F766E` | **orange → teal.** El naranja queda reservado para la racha. |
| IA | violet | `#F5F3FF` | `#6D28D9` | Igual. Solo en chips y avisos «Clasificado por IA». |
| Bienestar / check-in | emerald | `#ECFDF5` | `#047857` | Antes `notification` |
| Notificaciones | brand | `#EFF6FF` | `#1D4ED8` | Antes emerald |
| Tratamientos | violet | `#F5F3FF` | `#6D28D9` | Nuevo (comparte escala con IA; el ícono diferencia) |

**Regla:** nunca comunicar un estado solo con color. Siempre ícono + texto (por ejemplo ✓ «Tomado», no un punto verde).

**Reglas v2:**
- **Un color, un significado.** El verde es solo «completado / éxito»; el violeta, IA y tratamientos; el naranja, la racha; el rojo, error o eliminar. Los atributos (presencial, virtual, programada) van en chip gris o azul.
- **El progreso siempre es verde** (misiones, meta semanal, ciclos, configuración inicial). El color del módulo queda para el ícono.
- **Tipos de documento:** un solo tinte (sky) y se distinguen por ícono y texto (ver `pages/documentos-compartir-delegacion.md`).
- **Puntos de color con leyenda:** el calendario y el gráfico de ánimo llevan su leyenda visible.
- **Color con medida (v2.1):** el color de módulo va solo en el ícono del objeto principal de una fila (un medicamento, una cita, un documento) y en los selectores donde el módulo es la opción («Agregar a agenda»). Menús, metadatos, atributos, encabezados de sección y pasos de configuración usan gris o el azul de marca. Como máximo, un chip de color por tarjeta.

### 4.4 Color de motivación

| Elemento | Color | Nota |
|---|---|---|
| Racha (llama) | `#F97316` / `#FCD34D` | Solo en la llama y la tarjeta de racha |
| Botón de check-in | `#C2410C`, borde `#9A3412` | **No usar `#EA580C`** con texto blanco (3,56:1) |
| Progreso de misión | `#22C55E` en barras y anillos | Elemento gráfico, no texto |
| Nivel e insignias | `#F59E0B`, borde `#B45309` | — |

### 4.5 Modo oscuro

Superficies `#0C1222` (fondo) → `#1E293B` (tarjeta) → `#334155` (borde). Los tintes pasan a `rgba(color, .12–.16)` y los textos de acento suben a la escala 300/400. Los rellenos sólidos de botones se mantienen. Contrastes verificados: texto `#F8FAFC` / tarjeta 13,98:1; secundario `#94A3B8` 5,71:1; azul 400 5,75:1.

---

## 5. Tipografía

| Rol | Familia | Peso | Tamaño / interlineado |
|---|---|---|---|
| Display (celebración, número de racha) | Nunito | 900 | 28–32 / 1,1 |
| Título de pantalla (H1) | Nunito | 900 | 24–26 / 1,15 |
| Título de sección (H2) | Nunito | 900 | 19–20 / 1,2 |
| Título de tarjeta (H3) | Nunito | 800 | 16 / 1,25 |
| Botón, chip, pestaña, etiqueta | Nunito | 800 | 13–15 |
| Eyebrow (PASO 4 · AHORA) | Nunito | 900, `letter-spacing: .08em`, mayúsculas | 11 |
| Cuerpo | Inter | 400–500 | 15 / 1,5 (mín. 14) |
| Dato en fila | Inter | 600 | 14 / 1,3 |
| Subtítulo | Inter | 400 | 14 / 1,5 |
| Metadato | Inter | 400 | 13 / 1,4 (mínimo absoluto; en v1 era 12) |
| Etiqueta de la barra de pestañas | Inter | 500 (Inicio 700) | 11, igual al código (única excepción al mínimo de 13; queda pendiente revisarla con el texto del sistema al 130 %) |

- Nunito aporta calidez y redondez; Inter, legibilidad clínica. Nunca Nunito en párrafos.
- **Mayúsculas solo en eyebrows.** Botones en minúscula, por ejemplo «Hacer check-in de hoy».
- **Cambio respecto al código:** `fontFamily` solo tiene Inter, y en mobile Inter no se está cargando. Hay que agregar `heading: 'Nunito'` y cargar ambas con `expo-font` y `next/font`.

---

## 6. Espacio, forma y elevación

| Token | Valor |
|---|---|
| Espaciado (ritmo 4/8) | 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 |
| Padding de pantalla | móvil 16 · web 32 |
| Gap entre tarjetas | 16 (móvil) · 20 (web) |
| Radios | chip 999 · input 14 · botón 14 (sm 10) · tarjeta 18 · hoja 28 · modal 24 · teléfono 44 |
| Elevación 1 (tarjeta) | borde 1 px `color.border` + «canto» inferior de 3 px (`box-shadow: 0 3px 0 color.border`, no `border-bottom`, para no cambiar el alto) |
| Elevación 2 (botón) | canto inferior de 3 px del tono «edge» (`box-shadow: 0 3px 0 edge`). Al presionar: `translateY(3px)` y el canto pasa a 0. El alto no cambia, así que no hay salto de layout |
| Elevación 3 (toast, menú) | sombra `0 14px 30px -12px rgba(15,23,42,.35)` |
| Objetivo táctil | ≥ 44 × 44 px **visibles** en todo control: botones (`sm` incluido), chips de opción, segmentados, botones de ícono (44 px) y enlaces. Separación mínima de 8 px |
| Íconos | Lucide, trazo 2 (2,4 activo), 16 · 18 · 20 · 22 · 24 |

---

## 7. Componentes clave

> Catálogo completo de lo que hay que construir, con su estado y prioridad: [`componentes.md`](./componentes.md). Reglas de formularios: [`pages/formularios.md`](./pages/formularios.md).

| Componente | Especificación |
|---|---|
| **Botón** | Variantes: primario, secundario (blanco con borde), éxito, racha, peligro y fantasma. Alto mín. 48 (sm 44). Si dos botones no entran lado a lado con su texto completo, se apilan: la acción principal arriba, de ancho completo, y la secundaria debajo como fantasma (v2.1). Estados: hover +7 % de brillo; presionado baja 3 px sin cambiar el alto; deshabilitado al 50 % sin borde inferior; cargando con spinner y texto («Guardando…»); foco con anillo de 3 px `#3B82F6` a 2 px de distancia. **Destructivos** (eliminar, revocar, cancelar cita, finalizar ciclo): nunca en la barra inferior ni junto a guardar o editar; van como enlace rojo con ícono al final del contenido. |
| **Tarjeta** | Superficie, radio 18, padding 16 (compacta 12), elevación 1. Seleccionada: borde `brand.solid`. |
| **Fila de lista** | Ícono en cuadro de 40 px (radio 13, tinte del módulo) + título 14/600 + metadato 13 + acción a la derecha. Título y metadato ocupan hasta 2 líneas antes de cortarse (v2.1). |
| **Chip** | Píldora con tinte y texto 700 del tono, Nunito 800 12,5, ícono opcional de 12 px. Los chips **de opción** (seleccionables) miden 44 px de alto y el seleccionado lleva ✓. |
| **Campo** | Etiqueta visible siempre (Nunito 800 13), caja `#F8FAFC` con borde 1,5 px y radio 14, mín. 48 de alto. En foco, borde azul y fondo blanco. Error bajo el campo en rojo con ícono. |
| **Pestañas segmentadas** | Contenedor `#EEF2F7`; la activa es blanca con texto `brand.text`. |
| **Barra de pestañas (móvil)** | Igual a `apps/mobile/src/navigation/TabNavigator.tsx` (v2.4): Documentos (`FileText`), Agenda (`CalendarDays`), **Inicio al centro** (botón circular de 52 px elevado 20 px, ícono `LayoutDashboard` blanco; sólido `brand.solid` si está activo y `text.muted` si no), Mochilas (`Folder`) y Más (`Menu`). Íconos de 24 px; la pestaña activa solo cambia de color a `brand.solid`, sin pastilla. Etiquetas Inter 500 de 11 px (Inicio en 700). Barra de 60 px + área segura, esquinas superiores de 20 px, sombra hacia arriba y sin borde. En modo gestión, el botón central muestra las iniciales del dependiente con un anillo de 3 px de su color de contexto. |
| **Barra de acción inferior** (v2) | Fija abajo en formularios de pantalla completa y en flujos de pasos. Un botón primario de ancho completo con verbo + objeto («Guardar cita», «Continuar con 2 documentos»). Respeta el área segura; el contenido no queda oculto debajo. |
| **Diálogo de confirmación** (v2) | Solo para lo irreversible o lo que afecta a otra persona (revocar, eliminar cuenta, cancelar cita). Título en pregunta + consecuencia. Primero la opción segura con nombre propio («Mantener cita»), después la acción con el verbo exacto. |
| **Leyenda** (v2) | Fila de puntos o caras con su etiqueta. Obligatoria junto al calendario y al gráfico de ánimo. |
| **Barra lateral (web)** | Blanca, 248 px. Activa: `brand.tint` + texto 900. Mini tarjeta de racha al pie. |
| **Hoja inferior / modal** | Hoja: radio 28 arriba, asa, encabezado con ícono circular + eyebrow + título + cerrar. Modal web de 560 px. Fondo `rgba(15,23,42,.5)`. |
| **Toast** | Arriba, 320 px, ícono en cuadro, Nunito 800 14. Visible 4 s; con «Deshacer», 5 s. Sin acciones destructivas dentro. **v2:** borrar algo recuperable (documento, quitar de una mochila) se confirma con este toast y «Deshacer», no con un modal. |
| **Anillo de progreso** | Trazo de 8 px, `#E2E8F0` de fondo, texto «3/8» en Nunito 900 en el centro. |
| **Línea de tiempo de misión** | Riel de 3 px. Nodo hecho: verde con ✓. Actual: azul de 40 px con halo de 5 px y tarjeta desplegada. Pendiente: blanco con borde y texto gris. Siempre con texto de estado. |
| **Tarjeta de racha** | Degradado `#FFF7ED → #FFF`, llama de 34 px, número en Nunito 900, semana L–D, botón de check-in y la nota de pausas. |
| **Insignia (medalla)** | Círculo de 28/46 px con borde inferior de 3 px; bloqueada en gris con candado. |
| **Banner de modo gestión** | Color del dependiente, avatar, «Gestionando a {nombre}» y botón «Volver a mi cuenta». Fijo arriba en todas las pantallas. |
| **Estado vacío** | Mascota de 110 px + título H2 + una frase + una o dos acciones. |
| **Esqueleto** | Bloques `#E9EEF5` con la forma del contenido; nunca un spinner de pantalla completa. |

---

## 8. Motivación (gamificación con medida)

**Sí:**
- Racha de check-in diario, con **2 pausas** para que un día malo no la rompa.
- Progreso de misiones (pasos y anillo).
- Nivel por tareas de cuidado (30 por nivel).
- Insignias por hitos reales: primer proceso, racha de 7 y de 30.
- Meta semanal de tomas a tiempo.

**No:**
- Vidas, castigos ni «perdiste tu racha».
- Rankings entre personas.
- Puntos canjeables.
- Sonidos por defecto.
- Celebrar algo que el servidor no confirmó.

**Reglas:**
- La celebración grande (confeti) solo aparece al completar una misión. Lo demás se celebra con un toast.
- Nada motivacional tapa datos clínicos.
- En Configuración se puede **ocultar la racha y el nivel**, y apagar las celebraciones.
- Copy en positivo: «Llevas 12 de 14», nunca «Te faltan 2, ¡no falles!».

---

## 9. Mascota

Personaje en forma de cápsula azul con degradado (`#60A5FA → #2563EB`), barriga blanca **lisa (sin cruz)**, mejillas rosadas y brazos azul `#1D4ED8`.

| Pose | Cuándo |
|---|---|
| Saluda | Inicio, bienvenida, primer uso |
| Señala | Consejos (hint), paso actual de la misión |
| Feliz | Estados vacíos, confirmaciones tranquilas |
| Celebra | Misión completada (**con animación de celebración**: 3 saltos, brazos arriba y destellos, ≈ 1,2 s, una vez; ver `pages/movimiento-interacciones.md` §6b) · subir de nivel (estática) |
| Pensativa | Errores, sin resultados, «no encontrado» |

**Tamaños:** 30–40 (hint) · 60–80 (saludo) · 100–130 (vacío, celebración, acceso). Una mascota por pantalla, como máximo. Nunca en datos clínicos, confirmaciones de borrado ni en el banner de modo gestión.

---

## 10. Movimiento

> Sistema completo de transiciones e interacciones: [`pages/movimiento-interacciones.md`](./pages/movimiento-interacciones.md) · demo: [`movimiento.html`](./movimiento.html).

| Duración | Uso | Curva |
|---|---|---|
| 150 ms | Presionar botón, cambio de toggle | `ease-out` |
| 250 ms | Chips, pestañas, entrada de toast | `cubic-bezier(0.34, 1.56, 0.64, 1)` (rebote corto, solo confirmaciones) |
| 350 ms (salida 220) | Pantallas, hojas, modales | `cubic-bezier(0.2, 0, 0, 1)` al entrar · `cubic-bezier(0.4, 0, 1, 1)` al salir |
| ≤ 1,2 s | Celebración, llama al sumar racha | Una sola vez, sin bucles |

- Animar solo `transform` y `opacity`.
- Salir más rápido que entrar.
- Con `prefers-reduced-motion` o la opción «Celebraciones» apagada: sin confeti ni rebotes, solo un fundido de 150 ms.
- Animaciones en bucle permitidas: solo el halo del paso actual (pulso suave de 1,8 s) y el destello de «La IA está leyendo…», y se detienen con movimiento reducido.
- **v2.5:** un movimiento, un significado (diccionario en `pages/movimiento-interacciones.md` §1b); el feedback principal ocurre donde se tocó y el toast lo completa; se anima el contenedor, no sus partes.
- **v2.5:** las acciones de bajo riesgo (toma, chip, check-in, paso de misión) cambian al tocar y se guardan en segundo plano; si fallan, vuelven atrás y avisan. Borrar, compartir y lo que sale de la app esperan al servidor. Las celebraciones siempre esperan al servidor.

---

## 11. Voz y tono

- **Tuteo neutro colombiano.** Corregir el voseo que hay en el código («tenés», «creá», «ingresá») → «tienes», «crea», «ingresa».
- Objetivo antes que trámite: «Vamos a conseguir tu medicamento», no «Gestión de autorización».
- Frases cortas, verbos al inicio en los botones: «Guardar cita», «Ya pedí la cita».
- **Glosario:**
  - **Misión**, no «proceso».
  - **Mochila**, no «carpeta».
  - **Paciente / cuidador**, no «cliente».
  - **Toma**, no «intake».
  - **Reprogramar**, no «reagendar».
  - **Correo**, no «email».
  - **Iniciar sesión** en botones y enlaces, no «Entrar».
  - **Configuración**, en singular.
  - **Cancelar cita** (queda en el historial como cancelada) ≠ **Eliminar cita** (se borra).
- **Errores:** qué pasó + qué hacer. «No se pudieron cargar las mochilas. Revisa tu conexión e intenta de nuevo.»
- **Confirmaciones destructivas:** título en pregunta + consecuencia + botón con el verbo exacto («Eliminar», «Revocar acceso»). La opción segura nombra lo que conserva («Mantener cita», «Conservar mi cuenta»), nunca solo «Cancelar» si la acción también empieza por «Cancelar».
- **Progreso en positivo:** «Llevas 12 de 14», «Llevas 3 de 10 sesiones». Nunca «Te faltan…».

---

## 12. Accesibilidad (obligatorio)

- [ ] Texto normal ≥ 4,5:1; texto grande y componentes ≥ 3:1. Botón primario 5,17:1; éxito 5,02:1; racha 5,18:1.
- [ ] Objetivos táctiles ≥ 44 px y separados al menos 8 px.
- [ ] Foco visible: anillo de 3 px en web; `accessibilityRole`, `accessibilityLabel` y `accessibilityState` en móvil.
- [ ] Botones de solo ícono con etiqueta accesible: campana, más, cerrar, filtros.
- [ ] El estado nunca va solo por color (línea de tiempo, tomas, enlaces compartidos).
- [ ] Soporta tamaño de texto del sistema (Dynamic Type / escala de fuente de Android) hasta 130 % sin cortar contenido.
- [ ] Respeta las áreas seguras: barra de estado, notch, indicador de inicio. El contenido con scroll no queda oculto bajo la barra de pestañas ni bajo los botones fijos.
- [ ] Probado en teléfono pequeño (375 px), teléfono grande, tablet y web de 1440 px, en claro **y** en oscuro. *(v2: todavía no hay mockups en oscuro.)*
- [ ] `prefers-reduced-motion` respetado.
- [ ] Errores de formulario junto al campo, y anunciados.
- [ ] Modo gestión anunciado al lector de pantalla al cambiar de contexto.

---

## 13. Cómo llevarlo al código (`@helu/ui`)

| Paso | Archivo | Cambio |
|---|---|---|
| 1 | `tokens/tokens.ts` | Agregar la escala `teal`; `fontFamily.heading = 'Nunito'`; `radii` 14 / 18 / 28; `elevation.edge = 3` |
| 2 | `tokens/tokens.ts` → `palette.accent` | `document: sky`, `backpack: teal`, `wellbeing: emerald`, `notification: primary`, `mission: primary`, `treatment: violet`; nuevo `palette.motivation` (streak, level, progress) |
| 3 | `tokens/theme.ts` | `brand.solid: brand[600]`, `brand.edge: brand[800]`; `status.successSolid: green[700]`; `motivation.streakSolid: orange[700]` |
| 4 | `tokens/cssVariables.ts` | Emitir las variables de [`tokens.css`](./tokens.css) (`--color-*`, `--radius-*`, `--font-heading`) |
| 5 | `primitives/Button` | Variantes `success`, `streak`, `danger`, borde inferior y estado presionado |
| 6 | `primitives` nuevos | `ProgressRing`, `Medal`, `Mascot` (SVG con poses), `StreakCard` (composed), `MissionTimeline` (composed) |
| 7 | Apps | Cargar Nunito + Inter; reemplazar el voseo («tenés», «creá», «ingresá», «elegí») por tuteo |

Usar `validate-tokens.cjs` de la skill `design-system` para encontrar hex escritos a mano en `apps/`.

---

## 14. Anti-patrones

- Botones naranja o verde con texto blanco en los tonos 500/600, porque no pasan contraste. Usar 700.
- Gris `#94A3B8` como texto sobre blanco.
- Confeti, sonidos o mascota en pantallas de error, borrado o datos clínicos.
- Más de una acción primaria por tarjeta.
- Degradados morados o rosados «de IA» en bloques grandes; la IA se señala con un chip violeta.
- Ocultar el contexto del paciente cuando un cuidador opera como otra persona.
- Placeholders como única etiqueta de un campo.
- *(v2)* Dos botones primarios en la misma pantalla.
- *(v2)* Guardar solo en la cabecera de un formulario largo.
- *(v2)* «Eliminar» al lado de «Editar» o «Guardar», o en la barra inferior.
- *(v2)* Un modal «no se puede deshacer» para algo que tiene «Deshacer».
- *(v2)* Un enlace o botón que no lleva a ningún lado («¿Olvidaste tu contraseña?» sin flujo, «Próximamente»).
- *(v2.1)* Botones lado a lado que recortan su texto.
- *(v2.1)* Un chip de color por cada atributo; menús o secciones con un color distinto por fila.
- *(v2.1)* Colores escritos a mano en los mockups: se usan las variables de `tokens.css`.
