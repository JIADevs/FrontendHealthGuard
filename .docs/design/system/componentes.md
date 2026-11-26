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

> **Estado en código (2026-11-20, Fase 0.2a, issue #35):** construidos Button, IconButton, IconTile, Typography (roles v2), Chip (tonos y opción), Card (radio, canto, variantes), ListRow y DangerLink. **Fase 0.2b:** Toast v2 con `notify()` en cada app, ConfirmModal con `keepLabel` y BottomActionBar. Vista previa: `apps/web` → `/dev/ui` (solo desarrollo).

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
| **Button** | Extender | Variantes: `primary`, `secondary`, `success`, `streak`, `danger`, `ghost`; tamaños `sm` (44 px de alto, v2) y `md` (48 px). Canto inferior de 3 px, presionado sin salto de layout, `loading` con texto en gerundio | `variant`, `size`, `icon`, `iconPosition`, `loading`, `loadingLabel`, `fullWidth` | Todas | P1 |
| **IconButton** | Nuevo | Botón circular de 44 px con borde (v2: antes 38); tono neutro o tinte | `icon`, `accessibilityLabel` (obligatoria), `badge` | Campana, más, cerrar, filtros, volver | P1 |
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
| **Select** | Extender | Hoja en móvil, desplegable en web; opción vacía clara. **v2.32:** la búsqueda aparece con más de 8 opciones; si las opciones traen ícono, cada fila es ícono gris + nombre + ayuda corta + radio («1B»); título de hoja propio (`sheetTitle`) | + `searchable`, `helper`, `leadingIcon`, `sheetTitle`; opciones `{ value, label, icon?, description? }` | Especialidad, tratamiento, tipo de documento | P1 |
| **CreatableSelect** | Nuevo | Select + fila «+ Agregar nuevo …» que abre un formulario anidado. **v2.32:** esa fila va primera dentro de la hoja (no como enlace suelto en el formulario); las opciones de persona llevan iniciales y un dato («Odontología»), y las relacionadas con lo ya elegido van arriba («3C») | `onCreate`, `createLabel` | Profesional de salud | P2 |
| **DatePicker / TimePicker / DateTimePicker** | Extender | Estilo de campo B, formato es-CO, `min` y `max`, ícono | + `minDate`, `helper` | Citas, ciclos, check-in, pasos | P1 |
| **DateRangeField** | Nuevo | «Desde / Hasta» con validación de orden | `start`, `end`, `onChange` | Filtros, periodo | P2 |
| **SegmentedControl** | Nuevo | 2 o 3 opciones excluyentes, `radiogroup` | `options`, `value`, `onChange` | Tipo de consulta, modalidad, tema, estado, pestañas de Agenda | P1 |
| **ChoiceChips** | Nuevo | Chips de opción única o múltiple con borde y canto. **v2.32:** el ícono de cada chip va en gris y el elegido lo cambia por ✓; en un campo opcional, tocar el elegido lo desmarca; si el dato decide algo después, ayuda persistente debajo («2C») | `options`, `value`, `multiple`, `onChange`, `icon?` | Forma farmacéutica, recordatorios, síntomas, expiración, motivo de no toma, tipo de sangre, subtipo de orden o autorización | P1 |
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
| ~~FormErrorSummary~~ | **Descartado en v2.6** | Los errores van solo en cada campo; el foco pasa al primer campo con error | — |
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
| `SpecialtySheet` | agenda | **v2.32 «3B3»:** hoja de especialidad de la cita con «Repetir una cita» arriba (parejas especialidad + profesional ya usadas, con iniciales y «Con Dra. Ruiz · última el 3 dic»; un toque llena los dos campos) y «Todas las especialidades» con búsqueda abajo | P2 |
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

---

## v2 · Componentes nuevos o cambiados por la auditoría UX

| Componente | Capa | Estado | Qué es | Prioridad |
|---|---|---|---|---|
| **BottomActionBar** | containers | **Hecho (0.2b)** | Barra fija inferior con un botón primario de ancho completo (y opcionalmente uno secundario). Respeta el área segura y reserva espacio en el scroll | P1 |
| **Legend** | primitives | Nuevo | Fila de puntos o caras con etiqueta, para calendario y gráfico de ánimo | P1 |
| **MoreDetailsRow** | forms | Nuevo | Fila plegable «Más detalles (opcional)» que dice qué contiene | P1 |
| **Toast** | containers | **Hecho (0.2b)**: `notify()` sobre `sileo` y `react-native-toast-message` | Acción opcional («Deshacer»); 4 s sin acción y 5 s con acción | P1 |
| **ConfirmModal** | composed | **Hecho (0.2b)** · **Ajustar a v2.33** | Opción segura primero, con etiqueta propia (`keepLabel`: «Mantener cita»); solo para lo irreversible. **v2.33:** en móvil siempre centrado con ícono circular y botones apilados (`MASTER.md` §7); toda confirmación pasa `icon` (salvo `DiscardChangesDialog`) y desaparece el diseño sin ícono basado en `Modal`; nuevo tono `neutral` para lo que no es destructivo ni de aviso («¿Cerrar sesión?») | P1 |
| **SwipeRow** | containers | **Hecho (#127)** con `SwipeRowGroup` | Envuelve una tarjeta de lista en móvil y revela sus acciones al deslizar (paneles como en iOS, `MASTER.md` §7; umbrales, háptica y animación en `pages/movimiento-interacciones.md` §4b). Props: `endActions` («Más» + principal), `startAction` (acción positiva opcional), `onLongPress`, `onHaptic` (la app toca `expo-haptics`; `@helu/ui` no depende de él), `peek` (asomo de la primera vez), y `accessibilityLabel` + `onPress` para que VoiceOver lea la fila como un botón. `SwipeRowGroup` deja una sola abierta y la cierra al hacer scroll (`closeAll`) o al tocar otra fila. En web solo pinta la tarjeta. Acciones por tarjeta: cita = «Reprogramar» · «Asistí» (desde la hora de la cita); medicamento = «Editar» · «Tomar»; documento = «Compartir» · «A mochila»; mochila = «Compartir». Expone las mismas acciones como `accessibilityActions` y abre `onMore` al mantener presionado (500 ms). Reemplaza el «⋮» de `AppointmentCard`, `MedicationCard`, `DocumentRow` y `BackpackCard`. **v2.35:** también las filas del día del Calendario (cita = «Reprogramar» · «Asistí»; toma = «Más tarde» · «Tomar»; tarea = «Reprogramar» · «Completar») y los enlaces activos de Compartidos («Copiar enlace»; en «Más», «Revocar acceso» en rojo). Check-in, paso de misión y enlaces inactivos no se deslizan | P1 |
| **ActionSheet** («Más») | composed | **Hecho (#127)** | Props: `title`, `eyebrow`, `icon`, `tone`, `actions`, `destructive`; `ListRow` gana `destructive`. En web abre un `Modal` pequeño con los mismos grupos. Hoja inferior con todas las acciones de una tarjeta: encabezado del sistema (ícono circular + eyebrow + título + cerrar), lista de `ListRow` y, debajo, las destructivas en su propia tarjeta: `ListRow` con el ícono en cuadro rojo (`tone="danger"`), el texto en `danger.fg`, un subtítulo que dice qué pasa y sin chevrón («Cancelar cita» · «Queda en tu historial como cancelada»; «Eliminar cita» · «Se borra de tu agenda»). Cada una abre su `ConfirmModal`. Mismo encabezado que «Opciones de la misión» | P1 |
| **DangerLink** | primitives | **Hecho (0.2a)** | Enlace rojo con ícono para acciones destructivas al final del contenido | P1 |
| **OptionCard** | forms | Extender | Indicador de radio visible además del borde seleccionado | P2 |
| **ChoiceChips** | forms | Extender | 44 px de alto; el seleccionado lleva ✓ | P1 |
| **SetupChecklist** | composed | Nuevo | Tarjeta «Configura Helu · n de 4» con anillo, pasos y «Ocultar esta lista» | P2 |
| **PageReview** | app (documents) | Nuevo | Revisión de páginas escaneadas: volver a tomar, quitar, reordenar | P2 |
| **PermissionState** | composed | Nuevo | Estado vacío para permisos negados (cámara) con «Abrir ajustes» y una alternativa | P2 |
| **PasswordRecovery** | app (auth) | Nuevo | Pantallas «Recuperar contraseña», «Revisa tu correo» y «Nueva contraseña» | P1 |
| **PublicShareView** (móvil) | app (share) | Nuevo | Vista pública a 390 px y estado «enlace no disponible» | P1 |
| **ListRow** (v2.1) | primitives | Extender | Título y metadato en hasta 2 líneas antes de cortarse | P1 |
| **ButtonStack** (v2.1) | primitives | Nuevo | Acción principal de ancho completo + secundaria fantasma debajo, cuando no entran lado a lado | P2 |
| **Modal** (v2.8, web) | containers | Extender | Alto máximo = alto visible − 48 px; encabezado y pie fijos, solo el cuerpo hace scroll; foco atrapado y devuelto al cerrar (`pages/web.md` §2) | P1 |
| **PageActionBar** (v2.8, web) | containers | **Hecho (0.2b)** como `BottomActionBar.web` | Pie fijo de las páginas con formulario largo (Perfil): equivalente web de `BottomActionBar` | P2 |
| **AccountMenu** (v2.8, web) | composed | Nuevo | Menú del avatar con Perfil, Configuración y Cerrar sesión (`pages/web.md` §3) | P1 |
| **AppSidebar** (v2.8, web) | composed | Extender | 5 destinos principales + grupo «Más» con título; sin cuenta ni «Cerrar sesión» | P1 |
