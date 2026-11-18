# Helu · Catálogo de componentes UI/UX

> Componentes que hay que construir o adaptar en `@helu/ui` para implementar los mockups B ([`../mockups/`](../mockups/README.md)). Cada componente sigue `MASTER.md` y, si es de formulario, `pages/formularios.md`. Vista previa de formularios: [`formularios.html`](./formularios.html).
>
> **Estado:**
> - **Extender** = ya existe en `packages/ui/src` y hay que adaptarlo.
> - **Nuevo** = no existe.
> - **App** = va en `apps/*/components/{módulo}` porque solo lo usa un módulo (regla de `.docs/architecture/design-system.md`).
>
> **Prioridad:**
> - **P1** = lo necesitan Inicio, Agenda y Misiones (lo primero que se construye).
> - **P2** = Documentos, Mochilas y Compartir.
> - **P3** = resto.

## Resumen

| Capa | Extender | Nuevos | Total |
|---|---|---|---|
| Tokens y tema | 3 | 1 | 4 |
| Primitives | 4 | 9 | 13 |
| Forms | 7 | 13 | 20 |
| Containers | 2 | 3 | 5 |
| Composed | 1 | 11 | 12 |
| App (módulo) | — | 8 | 8 |

---

## 0. Tokens y tema

| Pieza | Estado | Cambio | Prioridad |
|---|---|---|---|
| `tokens.ts` | Extender | Escala `teal`; `fontFamily.heading` (Nunito); radios 14/18/28; `palette.accent` reasignado; `palette.motivation` | P1 |
| `theme.ts` | Extender | `brand.solid` = 600, `brand.edge`, `status.successSolid` (700), `motivation.*`, `feature.*` claro y oscuro | P1 |
| `cssVariables.ts` | Extender | Emitir las variables de `tokens.css` | P1 |
| Fuentes | Nuevo | Cargar Nunito 700/800/900 + Inter 400–600 (`expo-font`, `next/font`) | P1 |

## 1. Primitives (`packages/ui/src/primitives`)

| Componente | Estado | Qué es / variantes | Props clave | Dónde aparece | Prioridad |
|---|---|---|---|---|---|
| **Button** | Extender | Variantes: `primary`, `secondary`, `success`, `streak`, `danger`, `ghost`; tamaños `sm`, `md`. Canto inferior de 3 px, presionado sin salto de layout, `loading` con texto en gerundio | `variant`, `size`, `icon`, `iconPosition`, `loading`, `loadingLabel`, `fullWidth` | Todas | P1 |
| **IconButton** | Nuevo | Botón circular de 38 px (área de 44) con borde; tono neutro o tinte | `icon`, `accessibilityLabel` (obligatoria), `badge` | Campana, más, cerrar, filtros, volver | P1 |
| **Typography** | Extender | Roles `display`, `h1`, `h2`, `h3`, `eyebrow`, `body`, `data`, `meta`, `label` (Nunito o Inter según `MASTER.md` §5) | `variant`, `color`, `numberOfLines` | Todas | P1 |
| **Chip** | Extender | Tonos semánticos y de módulo, ícono opcional, `selected` (para filtros) | `tone` (`success`/`warning`/`danger`/`info`/`neutral`/`feature:*`/`streak`), `icon`, `size` | Estados, IA, tipos de documento, racha | P1 |
| **IconTile** | Nuevo | Cuadro de 40 px (52 grande) con tinte del módulo + ícono | `feature`, `icon`, `size` | Filas de lista, encabezados | P1 |
| **Avatar** | Nuevo | Iniciales o foto, con color de contexto | `name`, `color`, `size` | Perfil, dependientes, banner | P2 |
| **ProgressBar** | Nuevo | Barra de 8–10 px, `track` + relleno; animada al cambiar | `value`, `max`, `tone` (`progress`/`level`/`ai`), `accessibilityLabel` | Misión, nivel, ciclo, subida | P1 |
| **ProgressRing** | Nuevo | Anillo de trazo 8 con texto central | `value`, `max`, `size`, `label`, `tone` | Misión «3/8», meta semanal, ciclo | P1 |
| **Medal** | Nuevo | Insignia circular con canto; bloqueada | `icon`, `tone`, `locked`, `size`, `label` | Nivel, perfil, celebración | P2 |
| **Mascot** | Nuevo | SVG con poses `wave`, `point`, `happy`, `joy`, `think`; sin cruz | `pose`, `size`, `decorative` (por defecto oculta para el lector de pantalla) | Saludo, hints, vacíos, celebración | P1 |
| **Skeleton** | Nuevo | Bloques con la forma del contenido | `width`, `height`, `radius` | Carga | P2 |
| **Divider** | Nuevo | Línea de 1 px `border` | — | Detalles, listas | P3 |
| **EmptyState** | Extender | Mascota + título + texto + 1 o 2 acciones | `pose`, `title`, `description`, `primaryAction`, `secondaryAction` | Listas vacías, errores | P2 |

## 2. Forms (`packages/ui/src/forms`) — detalle en `pages/formularios.md`

| Componente | Estado | Qué es | Props clave | Dónde aparece | Prioridad |
|---|---|---|---|---|---|
| **FormField** | Nuevo | Envoltorio común: etiqueta + «(opcional)» + control + ayuda o error + contador. Lo usan todos los controles | `label`, `optional`, `helper`, `error`, `counter`, `children` | Todos los formularios | P1 |
| **TextField** | Extender | Usa `FormField`; agrega `leadingIcon`, `trailing` (acción o unidad), `aiPrefilled`, `readOnly`, estado validado | + `leadingIcon`, `trailing`, `aiPrefilled`, `readOnly`, `helper` | Todos | P1 |
| **PasswordField** | Nuevo | `TextField` + mostrar u ocultar contraseña + autocompletar | `mode: 'login' \| 'new'` | Acceso | P1 |
| **TextArea** | Extender (hoy `multiline`) | 3 líneas que crecen hasta 6, con contador | `maxLength`, `minRows`, `maxRows` | Notas, descripción | P2 |
| **NumberField** | Nuevo | Número con unidad y stepper − / + opcional | `unit`, `min`, `max`, `step`, `stepper` | Dosis, frecuencia, duración | P1 |
| **CurrencyField** | Nuevo | Prefijo «$», separador de miles es-CO | `currency='COP'` | Costo de cita | P3 |
| **Select** | Extender | Hoja con búsqueda en móvil, desplegable en web; opción vacía clara | + `searchable`, `helper`, `leadingIcon` | Especialidad, tratamiento, tipo | P1 |
| **CreatableSelect** | Nuevo | Select + fila «+ Agregar nuevo …» que abre un formulario anidado | `onCreate`, `createLabel` | Profesional de salud | P2 |
| **DatePicker / TimePicker / DateTimePicker** | Extender | Estilo de campo B, formato es-CO, `min` y `max`, ícono | + `minDate`, `helper` | Citas, ciclos, check-in, pasos | P1 |
| **DateRangeField** | Nuevo | «Desde / Hasta» con validación de orden | `start`, `end`, `onChange` | Filtros, periodo | P2 |
| **SegmentedControl** | Nuevo | 2 o 3 opciones excluyentes, `radiogroup` | `options`, `value`, `onChange` | Tipo de consulta, modalidad, tema, estado, pestañas de Agenda | P1 |
| **ChoiceChips** | Nuevo | Chips de opción única o múltiple con borde y canto | `options`, `value`, `multiple`, `onChange`, `icon?` | Forma farmacéutica, recordatorios, síntomas, expiración, motivo de no toma, tipo de sangre | P1 |
| **OptionCard** | Nuevo | Tarjeta de opción con ícono, título, descripción y chip («Recomendado») | `icon`, `feature`, `title`, `description`, `selected` | Nueva misión, invitar, agregar a agenda | P1 |
| **SwitchRow** | Nuevo | Fila con título, descripción e interruptor (`role=switch`) | `title`, `description`, `value`, `onChange`, `icon?` | Permisos, avisar al cuidador, notificaciones, motivación | P1 |
| **Checkbox** | Extender | Casilla de 24 px con radio 8, estilo B | — | Base de `SelectableRow` | P2 |
| **SelectableRow** | Nuevo | Fila de entidad (documento o mochila) con casilla o estado «Ya en la mochila» | `title`, `meta`, `feature`, `checked`, `disabledReason` | Mochilas, compartir | P2 |
| **MoodPicker** | Nuevo (sube de app) | 5 caras con etiqueta, `radiogroup` | `value`, `onChange`, `size` | Check-in | P1 |
| **UploadField** | Nuevo | Zona de carga con estados: vacía, arrastrando (web), subiendo con progreso, IA leyendo, listo (archivo + «Cambiar»), error | `accept`, `maxSizeMB`, `status`, `progress`, `file`, `onPick`, `onScan?` | Subir documento, pasos de misión | P1 |
| **TagEditor** | Extender (hoy en documentos) | Chips con ×, «+ Agregar», sugerencias | `value`, `suggestions`, `onChange` | Documentos | P2 |
| **SearchField** | Extender | Estilo B, botón para limpiar, botón de filtros opcional con contador | + `onClear`, `filterCount`, `onFilterPress` | Listas | P1 |

## 3. Containers (`packages/ui/src/containers`)

| Componente | Estado | Qué es | Props clave | Prioridad |
|---|---|---|---|---|
| **Card** | Extender | Superficie, radio 18, canto inferior, variantes `default`, `compact`, `selected`, `tint` (racha, IA, éxito) | `variant`, `tone`, `onPress` | P1 |
| **Modal** | Extender | Modal web de 560 px; encabezado con ícono + eyebrow + título; pie con acciones a la derecha | + `icon`, `eyebrow`, `dirty` (confirma al cerrar) | P1 |
| **BottomSheet** | Nuevo | Hoja móvil: asa, encabezado, contenido con scroll, evita el teclado, confirma al descartar | `title`, `eyebrow`, `icon`, `dirty`, `onClose` | P1 |
| **FormSection** | Nuevo | Tarjeta de sección con título H3 y descripción opcional | `title`, `description` | P1 |
| **StickyActionBar** | Nuevo | Barra inferior fija con la acción principal (área segura incluida) | `primary`, `secondary?` | P2 |

## 4. Composed (`packages/ui/src/composed`)

| Componente | Estado | Qué es | Prioridad |
|---|---|---|---|
| **ConfirmModal** | Extender | Ícono circular + pregunta + consecuencia + verbo exacto; variante `danger` | P1 |
| **DiscardChangesDialog** | Nuevo | «¿Descartar los cambios?»: «Seguir editando» / «Descartar» | P1 |
| **FormErrorSummary** | Nuevo | «Revisa 2 campos» con enlaces, recibe el foco tras el envío | P2 |
| **InlineBanner** | Nuevo | Aviso dentro de una pantalla o formulario: `info`, `success`, `warning`, `danger`, `ai`, `offline`, con acción opcional | P1 |
| **Toast** | Nuevo (unificar `sileo` y `react-native-toast-message`) | Ícono en cuadro + texto + acción «Deshacer» opcional; 3–5 s; `aria-live` | P1 |
| **ListRow** | Nuevo | `IconTile` + título + metadato + acción a la derecha (chip, botón o chevron) | P1 |
| **Hint** | Nuevo | Consejo con mascota «Señala» sobre tinte azul | P2 |
| **StreakCard** | Nuevo | Tarjeta de racha: llama, número, semana, botón de check-in, pausas | P1 |
| **MissionTimeline** | Nuevo | Línea de tiempo con estados `pending`, `in_progress`, `completed`, `skipped` y el paso actual desplegado | P1 |
| **MissionSummaryCard** | Nuevo | Anillo + tipo + objetivo + «Sigue: …» + «Continuar» | P1 |
| **LevelCard** | Nuevo | Nivel, barra y medallas (oculto si se desactiva la motivación) | P2 |
| **ContextBanner** | Nuevo | Banner de modo gestión con el color del dependiente | P1 |

## 5. Componentes de app (módulo)

| Componente | Módulo | Qué es | Prioridad |
|---|---|---|---|
| `CheckInSheet` | agenda | `BottomSheet` + `MoodPicker` + `ChoiceChips` (síntomas) + tratamiento + notas | P1 |
| `IntakeSheet` | agenda | «¿Tomaste esta dosis?» Sí / No + hora + motivo (chips) + detalles | P1 |
| `WeekStrip` / `MonthGrid` | agenda | Calendario semanal (móvil) y mensual (web) con puntos por tipo | P1 |
| `MissionStepSheet` | missions | Hoja del paso: plantilla por tipo de paso (carga, fecha y hora, recordatorios, confirmación) | P1 |
| `CelebrationScreen` | missions | Mascota «Celebra», estadísticas, insignia, confeti de una vez | P2 |
| `DocumentPreview` | documents | Vista previa con contador de páginas | P2 |
| `ShareQrCard` | share | QR + enlace + vencimiento + permisos | P2 |
| `ScannerOverlay` | documents | Guía de bordes, contador de páginas y disparador | P3 |

---

## Orden sugerido de construcción

1. **Base:** tokens, fuentes, Button, Typography, IconTile, Chip, Card, `FormField`, TextField.
2. **Formularios P1:** SegmentedControl, ChoiceChips, OptionCard, SwitchRow, NumberField, Select, fecha y hora, UploadField, MoodPicker, BottomSheet, Modal, Toast, InlineBanner, ConfirmModal y DiscardChangesDialog.
3. **Motivación y misiones:** ProgressBar, ProgressRing, Mascot, StreakCard, MissionSummaryCard, MissionTimeline, ContextBanner.
4. **P2 y P3:** el resto.

Cada componente nuevo sigue el patrón del repo: `Nombre.types.ts` + `Nombre.native.tsx` + `Nombre.web.tsx`, exportado en `src/index.ts` **y** `src/web.ts` (ver la skill `component-creation`).
