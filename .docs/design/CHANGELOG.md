# CHANGELOG · Diseño v2

Cambios de la v2 respecto a la v1 (2026-11-17). Hasta la sección 13 la v2 vivía en `.docs/design-v2/` y la v1 en `.docs/design/`, así que en esas secciones `../design/` quiere decir «la v1». Desde la sección 14 la v2 es la versión vigente y está en `.docs/design/`; la v1 queda en el historial de git (`a79a55b`). Origen de la v2: auditoría UX del 2026-11-18 contra un checklist de 132 ítems (leyes UX, formularios, navegación, feedback, estados vacíos, errores, móvil, accesibilidad, tipografía, copy y confianza). El número de cada fila es el ítem del checklist.

Las pantallas cambiadas llevan una nota que empieza por **«v2 ·»** en el lienzo de mockups.

## 1. Sistema (kit y MASTER)

| Cambio | Ítems | Dónde |
|---|---|---|
| Áreas táctiles de 44 px visibles: botones `sm`, chips de opción, segmentado, botones de ícono (38 → 44) y enlaces | 113, 108 | `mockups/kit.css`; `MASTER.md` §6–7; `formularios.md` §9 |
| Chip de opción seleccionado con ✓ (no solo color) | 117 | `kit.css`; `MASTER.md` §7 |
| `#94A3B8` fuera de textos e íconos funcionales (pestaña inactiva, mostrar contraseña, «⋯», limpiar, días, horas, insignias bloqueadas) → `#64748B` | 112 | `kit.js`; módulos 1, 2, 4, 6, 7; `MASTER.md` §4.1 |
| Otros contrastes: días de la racha (`#CBA88A` → `#C2410C` / `#6B7280`), día seleccionado del calendario (`#DBEAFE` → blanco), eyebrows esmeralda (`#059669` → `#047857`) | 112 | Módulos 1 y 2 |
| Tipografía: metadatos 12 → 13 px, subtítulos 13 → 14 px, pestañas 11 → 12 px | 118 | `kit.css`; `MASTER.md` §5 |
| Barra de acción inferior fija (`phone({bar})`) para formularios y flujos de pasos | 11, 12, 107 | `kit.js`, `kit.css`; `MASTER.md` §7; `formularios.md` §5 |
| Header sin racha ni nivel repetidos (`mtop()` solo con la campana) | 25, 42, 36 | `kit.js` |
| Toast con acción («Deshacer»), 4 s / 5 s con acción | 92, 93 | `kit.js`; `MASTER.md` §7 |
| Diálogo de confirmación: primero la opción segura con nombre propio («Mantener cita») | 14, 86 | `m7`; `MASTER.md` §7 y §11 |
| Destructivos como enlace rojo al final, nunca junto a guardar/editar ni en la barra inferior | 14 | `kit.js` (`redLink`); `MASTER.md` §7; `formularios.md` §5 |
| Una sola acción primaria por pantalla (con orden de prioridad) | 1, 2, 4, 21, 24 | `MASTER.md` §2 |
| Un color, un significado; progreso siempre verde; leyenda junto a puntos de color | 68, 117 | `MASTER.md` §4.3 |
| Glosario: Reprogramar, Correo, Iniciar sesión, Configuración, Cancelar cita ≠ Eliminar cita; progreso en positivo | 19, 123, 125 | `MASTER.md` §11 |
| Helpers nuevos: `radio`, `moreRow`, `xbtn`, `kebab`, `redLink`, leyendas | — | `kit.js` |

## 2. Pantallas

### Acceso e Inicio (módulos 1 y 2)

| Cambio | Ítems |
|---|---|
| **Nuevas:** Recuperar contraseña, Revisa tu correo, Nueva contraseña (el enlace «¿Olvidaste tu contraseña?» no llevaba a nada) | 53, 102 |
| **Nueva:** Bienvenida después del registro, con 3 primeros pasos y «Explorar por mi cuenta» | 26, 52, 74, 75, 76 |
| Botón «Entrar» → «Iniciar sesión»; sin el placeholder repetido «Mínimo 8 caracteres» | 19, 125, 126 |
| Inicio: «Tomar» es la única acción primaria y sube al bloque 2; check-in y misión pasan a secundarios | 1, 4, 15, 21, 107 |
| **Nuevas:** Inicio · primer uso (lista «Configura Helu · 1 de 4», arranca con la cuenta hecha) e Inicio · todo al día | 27, 30, 48, 101 |
| Chip «IA · revisar» solo en el documento sin revisar | 25 |

### Agenda (módulo 3)

| Cambio | Ítems |
|---|---|
| Calendario: leyenda de colores, tipo de evento en texto, flechas de 44 px, un solo botón destacado en la lista | 117, 113, 21, 66 |
| Registrar toma: «Sí, la tomé» guarda en un toque; **nueva** hoja «No la tomé» con los motivos | 5, 8, 15 |
| Citas: orden cronológico, chips de atributo en gris | 45, 59, 68 |
| Nueva cita: «Fecha y hora» primero, opcionales en «Más detalles», nombre automático, barra «Guardar cita»; **nueva** variante desplegada | 3, 12, 28, 54 |
| Detalle de cita: sin «Completada» en una cita futura, «Cómo llegar», «+ Agregar documento», «Cancelar cita» como enlace rojo; **nueva** variante «¿Pudiste asistir?» | 14, 86, 98, 106 |
| Nuevo profesional → hoja, teléfono con +57 | 12, 39, 57 |
| Nuevo medicamento: título igual a la hoja de agregar, unidad deducida, frecuencia con chips, resumen calculado, barra fija | 43, 44, 91, 125 |
| Medicamentos: «Activos» / «Finalizados», progreso en verde; detalle con «Tomar» | 41, 68, 1 |
| Detalle de ciclo: «Editar» en la cabecera, «Finalizar ciclo» solo al final | 14 |
| Bienestar: caras sobre cada barra, leyenda y etiqueta del resumen | 117 |
| Agregar a agenda: botón cerrar y check-in primero | 45, 110 |
| Meta semanal: «Llevas 12 de 14 esta semana» | 123 |
| Tareas: barra «Guardar tarea», «Reprogramar», copy de resultado | 12, 125, 123 |

### Misiones y tratamientos (módulo 4)

| Cambio | Ítems |
|---|---|
| «PASO n DE N · AHORA» junto a la acción; barra que no arranca vacía | 26, 27, 29 |
| Primer uso con «Explorar por mi cuenta» | 76 |
| Nueva misión: IA como primera opción, radio en tarjetas, barra «Crear misión» | 15, 54, 117 |
| Celebración: «Volver al inicio»; seguimiento posterior ya no tapa la celebración | 51, 52, 82 |
| Terapia: «Llevas 3 de 10 sesiones», «SESIÓN 4 DE 10» | 123, 29 |
| Tratamientos: sin chip «Activo» redundante; nuevo tratamiento → hoja sin «Estado»; «+ Agregar» con texto; síntomas sin rojo | 42, 5, 18, 113, 68 |

### Documentos (módulo 5)

| Cambio | Ítems |
|---|---|
| Tipos de documento con tinte único (sky) + ícono y texto | 68 |
| Sin banner azul de IA sobre la lista | 23, 42 |
| «⋯» de 44 px con etiqueta | 113 |
| **Nuevas:** Escáner · revisar páginas y Escáner · sin permiso de cámara | 53, 89, 93, 97 |
| Escáner: textos de 13 px, sin enlace duplicado | 118, 42 |
| Subir documento: una columna, límite visible, barra «Guardar documento»; **nueva** Subir documento · subiendo (70 %) | 35, 77, 95, 106 |
| Resultado de examen virtual → hoja en una columna | 12, 77 |
| Detalle: «Compartir» primario, «Eliminar documento» al final con «Deshacer» | 1, 14, 86, 93 |
| Editar documento: los mismos campos que al subir, barra «Guardar cambios» | 12, 24, 55 |
| Filtros: mismo control para categorías y etiquetas, botón cerrar, set de categorías único | 66, 61 |

### Mochilas y Compartir (módulos 6 y 7)

| Cambio | Ítems |
|---|---|
| Detalle de mochila: «Editar» en la cabecera, «Eliminar mochila» al final, × de 44 px, tinte teal | 14, 113, 61 |
| Nueva mochila, Agregar documentos y Editar mochila con barra fija | 12, 24 |
| Lista de mochilas sin la selección heredada de web | 25, 70 |
| Compartir: «Paso n de 3», sin tarjeta de enlaces activos en el paso 1, «Ver documentos» fijo, «Revocar enlace» separado | 26, 5, 67, 14 |
| Compartidos: «Nuevo», segmentado Todos / Activos / Inactivos | 1, 55 |
| Detalle de compartido: «Mostrar QR» primario, «Extender plazo», revocar al final | 36, 2, 43 |
| **Nuevas:** Vista pública (móvil) y Vista pública · enlace vencido | 107, 53, 102 |

### Dependientes y Cuenta (módulos 8 y 9)

| Cambio | Ítems |
|---|---|
| «Gestionar» con un solo estilo; «Quitar acceso» visible para cuidadores | 66, 55, 110 |
| Invitar: radio, «Correo del cuidador», botón cerrar | 117, 125 |
| Modo gestión: sin la racha de la cuenta propia en el header | 36 |
| Más: grupos con título, «Configuración», sin «Próximamente» | 41, 42, 125 |
| **Nuevas:** Ayuda y contacto, Mi plan (precio, próximo cobro, cancelar suscripción) | 129, 130, 132 |
| Perfil: datos primero, insignias al final, 8 grupos sanguíneos + «No sé», una columna, barra fija | 55, 12, 42, 77 |
| Notificaciones: hora legible, agrupadas por día, vacío con acción | 112, 41, 98 |
| Configuración: singular, «misión» (no «proceso»), aviso de guardado, sección Cuenta con «Eliminar mi cuenta» | 125, 92, 130 |

### Estados (módulo 10)

| Cambio | Ítems |
|---|---|
| «¿Eliminar cita?» → «¿Cancelar la cita?» con «Mantener cita» | 86, 125 |
| «¿Eliminar documento?» → toast «Documento eliminado» con «Deshacer» (móvil y web) | 86, 93 |
| Confirmaciones con título en pregunta y opción segura nombrada; «Finalizar ciclo» sin naranja | 86, 68 |
| **Nuevas:** ¿Eliminar tu cuenta?, Borrador recuperado, No se pudo guardar | 130, 49, 50, 53, 105 |
| Formulario con errores: barra fija y resumen subrayado | 12, 104 |
| Sin conexión (móvil): «Reintentar» | 53 |

## 3. Decisiones pendientes (no resueltas en v2)

| Tema | Por qué queda abierto |
|---|---|
| **Misiones en la barra de pestañas** | Es la función protagonista y en móvil vive en «Más». Cambiar las 5 pestañas es una decisión de producto (ítems 15 y 46). |
| **Valores de «Mi plan»** | MASTER define freemium con Wompi, pero no hay precio, nombre de plan ni política de reembolso. La pantalla usa marcadores `{…}`. |
| **Canal de soporte** | «Ayuda y contacto» usa `soporte@helu.app` como ejemplo. Hay que confirmar el canal real. |
| **Cuerpo de texto 15 vs 16 px** | El checklist pide 16 px; MASTER fija 15 (mínimo 14). La v2 sube metadatos y subtítulos pero deja el cuerpo en 15 (ítem 118). |
| **Chips de 44 vs 48 px** | `formularios.md` pedía 48 px en chips; la v2 los deja en 44 (el mínimo del checklist) para que no pesen tanto. Campos siguen en 48. |
| **Tipo preseleccionado en Nueva misión** | Sigue «Realizar un examen». Falta el dato de cuál es el tipo más común (ítem 6). |
| **Modo oscuro** | Los tokens existen, pero no hay mockups en oscuro (MASTER §12). |
| **Web** | No se auditó. Solo cambió lo que hereda del kit o comparte función con móvil (orden de citas, chips, toast de borrado, sin estado en «Nuevo tratamiento»). Hace falta una pasada propia. **v2.8–2.8.1:** el grupo A (pantallas que ya existen en el código) está auditado y corregido (secciones 12 y 13); falta el grupo C (Calendario, Bienestar, Misiones, Dependientes, Notificaciones). |
| **Vistas previas del sistema** | `preview.html` y `formularios.html` no se actualizaron y muestran tamaños de v1 (`movimiento.html` se actualizó en v2.5.1). |
| **Diferencias con el código** | El código permite archivos de 25 MB; los diseños dicen 10 MB. Hay que alinear uno de los dos. |
| **`tokens.css` editado a mano** | El generador de `tokens.css` (`generate-tokens.cjs`, de la skill design-system) no está en este equipo. Se regeneró `tokens.json` con `build-tokens.py` y se editaron a mano solo las 3 líneas de tamaño. Al regenerar con la skill, el resultado debería ser idéntico. |

## 4. v2.1 · Ajustes después de revisar la v2

Segunda pasada sobre los mockups v2, medida en el navegador (desbordes, botones aplastados, áreas de menos de 44 px, cantidad de tonos y chips de color por pantalla).

| Cambio | Ítems | Dónde |
|---|---|---|
| **Desviaciones corregidas:** segmentado de 40 → 44 px; el check-in de Inicio usa la variante secundaria del sistema (antes era una variante naranja inventada); etiquetas de insignias, días de la racha y leyendas a 13 px | 113, 66, 118 | `kit.css`, `m1`, `m6` |
| **Tokens de tamaño:** `button.height-sm` 44, `chip.height-option` 44, `icon-button.size` 44 | 113 | `build-tokens.py`, `tokens.json`, `tokens.css` |
| **250 colores escritos a mano → variables** de `tokens.css` (`var(--color-…)`) en todo lo que la v2 agregó o cambió. Quedan 11 valores heredados de v1 que no tienen token (`#E6EFFF` fondo de acceso, `#DB2777` puntos de citas, `#E9EEF5` esqueleto, entre otros): hay que agregarlos a `build-tokens.py` o reemplazarlos | — | Kit y los 7 módulos |
| **Botones que no entraban con su texto** («Programar» quedaba en 39 px, «Ya los tengo» en 52 px): ahora se apilan, principal + fantasma | 11, 82, 84 | Pasos de misión, terapia |
| **Una sola acción primaria:** sin «Guardar» en la cabecera cuando hay barra inferior (12 formularios); en Misiones solo el primer «Continuar»; «Invitar», «Nueva», «Reintentar» y «Volver a mi cuenta» pasan a secundario | 1, 2, 4, 25 | `m2`–`m7` |
| **Menos color:** menú «Más», notificaciones, secciones y filas de tratamiento, filas de información de la cita, acciones rápidas, primer uso y bienvenida en gris o en un solo azul; chips de fecha, atributo, etiqueta de tratamiento, tipo de misión y pasos en gris | 21, 23, 25, 68 | `m1`–`m6` |
| **Menos densidad:** Inicio sin la tarjeta de nivel; filtros rápidos de documentos 7 → 3; textos acortados para que nada se corte; títulos de fila en hasta 2 líneas en vez de «…» | 9, 42, 126 | `kit.js` (`row`), `m1`, `m2`, `m4`, `m5`, `m6` |
| Chip de IA de los documentos debajo del título («IA · sin revisar») | 25, 40 | `m4` |

**Medición final v2.1:** 0 desbordes, 0 botones aplastados, 0 controles de menos de 44 px y ninguna pantalla móvil con 4 o más chips de color. Seis pantallas conservan 4 o más tonos de ícono, siempre en el objeto principal de cada fila (la regla «color con medida»): los selectores «Agregar a agenda», «Agregar documento», «Nueva misión» y «Completar tarea», donde el color identifica la opción, más Inicio y Detalle de cita, que muestran a la vez medicamentos, citas, documentos y mochilas.

## 5. v2.2 · Cumplimiento del estándar de formularios

Revisión de la v2.1 regla por regla contra `system/pages/formularios.md` y `MASTER.md`. Qué campos son obligatorios se tomó de los schemas de `packages/api/src/schemas.ts`: en `UserUpdateSchema` todo es opcional; en `DocumentCreateSchema` solo el título es obligatorio.

| Desviación corregida | Regla | Dónde |
|---|---|---|
| «Notas» (Nuevo profesional) y «Descripción» (Nuevo tratamiento) volvieron a ser áreas de texto | formularios §4 «Texto largo» | `m2`, `m3` |
| Secciones de Nueva cita con títulos sustantivos: «Fecha y hora», «Profesional», «Modalidad y lugar» (antes «¿Cuándo?», «¿Con quién?», «¿Dónde?») | formularios §5 y §10 | `m2`, `m7`, `inicio-agenda.md` |
| «Formulario con errores» alineado con la Nueva cita reordenada; errores con el nuevo `field({err})` | formularios §2, §6 | `m7` |
| Etiqueta «Cada» → «Frecuencia (cada cuánto)» | formularios §10 | `m2` |
| Todos los placeholders son ejemplos («Ej: …»); lo que antes explicaba el placeholder pasa a una ayuda persistente debajo del campo; los campos de contraseña quedan sin placeholder | formularios §2 | `m1`, `m2`, `m3`, `m4`, `m6` |
| Una sola mascota por pantalla: «Revisa tu correo» y «Check-in de hoy» (este último heredado de v1) | MASTER §9 | `m1` |
| «Vista pública · enlace vencido» sin mascota grande (ícono neutro) | documentos-compartir §Compartir | `m5` |
| «Género» pasa de desplegable a chips (4 opciones) | formularios §4 «no usar un desplegable para menos de 6 opciones» | `m6` |
| Ícono inicial, chevron y lupa de los campos en `--color-text-muted` (antes `#94A3B8`) | formularios §2 | `kit.js` |
| Estado «Precargado por IA» (tinte violeta, borde al 40 %, chip «IA») en Título, Tipo, Fecha y Especialidad de Subir documento | formularios §3 | `kit.js` (`field({ai})`), `kit.css`, `m4` |
| Hojas «Agregar a agenda», «Agregar documento», «Filtros» e «Invitar» con el encabezado de MASTER (ícono circular + eyebrow + título + cerrar) | MASTER §7 «Hoja inferior» | `m2`, `m4`, `m6` |
| «(opcional)» en los campos opcionales de Subir y Editar documento, Resultado de examen virtual y todo Perfil | formularios §2 | `m4`, `m6` |

**Kit:** `field()` acepta `help` (ayuda persistente), `err` (error en línea con ícono y `role="alert"`) y `ai` (precargado por IA); `select()` acepta `ai`.

**Pendiente (backend):** `AppointmentCreateSchema` deja todos los campos opcionales, incluida la fecha, pero el diseño la trata como obligatoria («Elige la fecha de la cita»). Hay que decidir cuál de los dos manda.

## 6. v2.3 · Agenda › Calendario (web)

| Problema | Causa | Arreglo |
|---|---|---|
| Columnas desparejas y el domingo fuera de la tarjeta | `repeat(7,1fr)` + etiquetas sin salto: cada columna crecía según su contenido | `repeat(7,minmax(0,1fr))` |
| Eventos del mes sin fondo y con texto de color poco legible | **Error introducido en v2.1:** el tinte se armaba como `${color}18`, que deja de ser un color válido con `var(--…)`; además, texto de color sobre tinte no llegaba a AA | Cada día muestra hasta 3 íconos por tipo y «+n»; el texto queda en la lista del día |
| El día 3 desbordaba su celda | 3 etiquetas en 96 px | Íconos en una sola fila |
| «Medicina interna» en violeta | Color de IA usado para una cita | Todas las citas usan el token de citas |
| Horas partidas en dos líneas en «Hoy, martes 3» | Columna de hora de 56 px | La hora pasa al metadato de la fila (también en móvil) |
| Sin leyenda en web | — | Leyenda con los mismos íconos, en web y en la tira de móvil |
| «Agregar a agenda» competía con «Tomar» | Dos primarios | «Agregar a agenda» pasa a secundario |
| «12 días» en naranja `#EA580C` en la barra lateral (3,56:1) | Valor de v1 en `kit.js` | `--color-motivation-streak-text` (5,18:1) y el resto de la barra lateral con tokens |

## 7. v2.4 · Barra de pestañas igual al código

La barra de los mockups pasa a ser la de `apps/mobile/src/navigation/TabNavigator.tsx`: Inicio como botón circular elevado al centro (`LayoutDashboard`), íconos `FileText`, `CalendarDays`, `Folder` y `Menu` de 24 px, pestaña activa solo por color, etiquetas Inter 500 de 11 px, esquinas superiores de 20 px y sombra hacia arriba. En modo gestión, el botón central muestra las iniciales del dependiente con su color de contexto (`tabbar(activa, {ini, ring})`, opción `manage` de `phone()`). Arregla además el solapamiento de «Documentos» con «Agenda» de la versión anterior.

**Diferencias que se mantienen respecto al código:** los colores salen de los tokens v2 (`brand.solid` `#2563EB` y `text.muted` `#64748B`), no de `brand[500]` (3,68:1) ni de `gray-400` (2,54:1), que no pasan contraste. Las etiquetas de 11 px quedan por debajo del mínimo de MASTER (13): se dejan así para igualar el código y la decisión queda abierta.

**Ajuste (v2.4.1):** con el texto agrandado (al 130 % o con un tamaño mínimo de fuente en el navegador), «Documentos» medía entre 87 y 97 px en pestañas de 75 px y se encimaba con «Agenda». Ahora cada etiqueta está limitada al ancho de su pestaña y, si no entra, termina en «…»; además, la barra tiene menos margen lateral (pestañas de 77 px). En `index.html`, el parámetro de caché de los archivos del kit y los módulos pasó de `?v=5` a `?v=24`, para que el navegador no mezcle versiones viejas.

**Corrección (v2.4.2):** el recorte con «…» de la v2.4.1 cortaba «Documentos», «Mochilas» e «Inicio» cuando el texto se veía más grande, y MASTER §12 pide aguantar el 130 % sin cortar contenido. La barra pasa a tener tres partes: un grupo izquierdo (Documentos, Agenda), Inicio en una columna central fija de 60 px y un grupo derecho (Mochilas, Más). Cada etiqueta toma el ancho que necesita, sin recorte, e Inicio queda siempre centrado. Medido en las 64 pantallas con barra: a 11 px, con fuente de reemplazo, a 14,3 px (130 %) y a 16 px, ninguna etiqueta se corta ni se encima (separación mínima de 6 px a 16 px). Parámetro de caché: `?v=26`.

**Causa real y arreglo (v2.4.3):** el encimado de las etiquetas solo aparecía al alejar el lienzo con el zoom del navegador. Los íconos se achican, pero la letra no baja de su tamaño mínimo: con esta configuración, «Documentos» se veía al doble de su tamaño respecto del ícono. Con la letra al doble, cinco etiquetas y el botón central no entran en 390 px con ningún layout. Se agregó un zoom propio del lienzo (botones 25 / 40 / 60 / 100 % y `?z=`), con `transform: scale`, que achica todo por igual; las instrucciones están en `mockups/README.md`. Medido a 100 %, 60 %, 40 % y 25 %: misma proporción entre etiqueta e ícono y ninguna etiqueta encimada. Parámetro de caché: `?v=27`.


## 8. v2.5 · Reglas de movimiento a partir de leyes de UX

Revisión de las leyes de la sección «More laws» de la checklist de UX (más el umbral de Doherty de la parte 1) contra `system/pages/movimiento-interacciones.md`. La vista previa `movimiento.html` se actualizó después, en v2.5.1.

| Ley | Cambio | Dónde |
|---|---|---|
| Umbral de Doherty (31–32) | Las acciones de bajo riesgo (toma, chip, interruptor, check-in, paso de misión) cambian al tocar y se guardan en segundo plano; si fallan, vuelven atrás con fundido y un toast con «Reintentar». Borrar, compartir, revocar, eliminar la cuenta y cambiar de perfil gestionado esperan al servidor. Las animaciones motivacionales esperan siempre al servidor. **Reemplaza** la regla de v1 «El estado se actualiza al confirmar el servidor» | §1b, §6, §8 · MASTER §10 |
| Similaridad (66–68) | Diccionario de movimiento: cada patrón con un único significado. Separa el halo («estás aquí») del destello de la IA («estoy trabajando») | §1b |
| Proximidad (65) | El feedback principal ocurre en el elemento tocado; el toast lo completa. «Acción guardada» resalta además el elemento en su lista | §1b, §6 |
| Región común (69–71) | Se anima el contenedor, no sus partes | §1b, §2 |
| Chunking y Miller (36, 41) | Escalonado por grupo en listas agrupadas. El ícono y el color de la tarjeta se repiten en la cabecera del detalle (con *View Transitions* en web) | §2, §3 |
| Carga cognitiva (42) | Las secuencias encadenadas terminan en ≤ 1,2 s y el toast entra al final | §2, §6 |
| Pico-final (51–53) | La primera lectura de la IA tiene un momento de nivel medio, una vez por cuenta (sin mascota, porque son datos clínicos). Un reintento que funciona transforma el banner de error en éxito | §6, §7 |
| Zeigarnik (49–50) | «Continuar borrador» lleva al último campo editado y lo resalta | §6 |

**Inconsistencias corregidas:** el toast de «Acción guardada» pasa de «3–5 s» a 4 s, como en MASTER. MASTER §10 suma el destello de la IA a los bucles permitidos, como ya decía la spec de movimiento.

**No aplicadas:** Postel (ya cubierta por los umbrales de la hoja), posición serial, Tesler y estética-usabilidad (no cambian el movimiento; animar la mascota en «Bienvenida» rompería la regla de una sola animación con énfasis).

**Pendiente para el equipo:** en el código, solo dos mutaciones son optimistas (`onMutate` con reversión en `packages/api/src/reactQueryHooks.ts`): los colores de contexto, que encajan con la regla, y **revocar una delegación, que según esta regla debería esperar al servidor** porque quita el acceso a otra persona. Registrar una toma, el check-in y los pasos de misión hoy esperan la respuesta y tendrían que pasar a optimistas.

**v2.5.1 · `system/movimiento.html` actualizado**

| Qué | Antes (v1) | Ahora |
|---|---|---|
| Tamaños | Botón `sm` de 36 px, chips de 40 px, botones de ícono de 38 px | 44 px con los tokens `--button-height-sm`, `--chip-height-option` e `--icon-button-size`; interruptor y casilla con área táctil de 44 px |
| Toast | 300 px, 3,2 s | 320 px, 4 s; 5 s si trae «Deshacer» o «Reintentar» |
| Colores | `#CBD5E1`, `#F8FAFC`, `#fff`, confeti y fondo de la celebración en hex | Tokens. Solo quedan en hex la mascota (ilustración, igual que en `kit.js`) y el marco del teléfono |
| Barra de pestañas | Estilo v1 con pastilla de tinte | La de `TabNavigator.tsx`, igual que en los mockups; la pestaña activa solo cambia de color. La spec (§5) se corrigió igual |
| Propiedades animadas | La barra de progreso, el riel y el segmentado animaban `width`, `height` o `left` | Solo `transform` y `opacity` |
| Reglas v2.5 | — | Secciones «Reglas de base», «Diccionario de movimiento» (con prueba de cada patrón) y «Momentos que importan». Demos: toma optimista con «Simular falla del servidor», check-in y paso de misión que esperan al servidor para animar (≤ 1,2 s, toast al final), quitar con colapso y «Deshacer», carga por grupos, reintento que funciona, ícono que viaja de la tarjeta al detalle, cita guardada resaltada en su lista, primera lectura de la IA y borrador recuperado |

Probado en el navegador: sin errores de consola, sin controles de menos de 44 px a 1280 px, toast de 320 px y cada flujo (también con movimiento reducido). A menos de 400 px de ancho, el teléfono de 360 px no entra en la página.

## 9. v2.6 · Errores de formulario sin resumen arriba

Decisión del equipo: al enviar un formulario con errores, **no** se muestra el banner «Revisa N campos». Los errores aparecen solo junto a cada campo, con la causa y cómo corregirlo.

| Qué | Antes | Ahora |
|---|---|---|
| Al enviar con errores | Resumen arriba con enlaces a cada campo; el foco iba al resumen | La pantalla baja hasta el primer campo con error y le pasa el foco |
| Lector de pantalla | Leía el resumen | Lee la etiqueta y el error del campo enfocado, y anuncia «Revisa 2 campos» por una región `aria-live` que no se ve |
| Componente `FormErrorSummary` | Nuevo (P2) | Descartado |

Archivos: `mockups/m7-estados.js` («Formulario con errores»), `system/pages/formularios.md` §6 y checklist, `system/pages/movimiento-interacciones.md` §6, `system/componentes.md` y `system/formularios.html` (se quitó la tarjeta del resumen).

**Por qué funciona sin el resumen:** el foco y el desplazamiento llevan a la persona al primer error, y los demás quedan marcados en rojo con su mensaje. **A vigilar:** en formularios largos, si el segundo error queda muy abajo, la persona lo descubre recién al corregir el primero y volver a enviar.

**Pendiente:** la versión vigente (`../design/`) todavía muestra el resumen en `mockups/m7-estados.js` y en `system/pages/formularios.md`.

## 10. v2.7 · Estados de carga en los mockups

Nuevo módulo **«11 · Estados de carga»** (`mockups/m8-carga.js`, `?m=carga`): esqueletos de Inicio, Agenda · Calendario, Detalle de cita, Documentos, Detalle de documento, Mochilas, Detalle de mochila y Detalle de misión.

- Cada esqueleto se **genera desde la misma pantalla** con `skel()`: queda con exactamente su forma (medido en Inicio: las tarjetas tienen la misma posición y el mismo alto), así que nada se mueve cuando llega el contenido.
- Real desde el primer momento: barra de estado, encabezado, pestañas internas, buscador, filtros, barra inferior, barra de acción, botón flotante, mascota e íconos sueltos. Esqueleto: el texto que viene del servidor (`.skt`, la barra mide lo que el texto) y los bloques de contenido (`.skb`: íconos en cuadro, chips, botones, avatares, barras, anillos, avisos). Las tarjetas se quedan, sin color de acento.
- En la app los bloques llevan el brillo de 1,4 s y el contenido entra con fundido de 150 ms por grupos; en el lienzo quedan quietos.
- Las reglas completas están en `../design/system/pages/movimiento-interacciones.md` §6c. La spec de esta carpeta (`system/pages/movimiento-interacciones.md`) todavía no tiene esa sección.

## 11. v2.7.1 · «Fundido cruzado» definido como *fade through*

En `system/pages/movimiento-interacciones.md` (§2 y §3), y también en `../design/`: cuando cambia el contenido dentro de una pantalla (pestañas internas de Agenda, «Tomar» → «✓ Tomado», banner de error → éxito), el contenido anterior sale en 100 ms y **después** entra el nuevo (150 ms; 250 ms con 4 px de subida si es una vista completa). Nunca hay dos contenidos encimados, y un toque nuevo a mitad de camino deja entrar directo la última opción. Entre pantallas completas de la barra inferior se mantiene el fundido simultáneo del navegador. Las dos `system/movimiento.html` muestran ahora contenido distinto en Calendario, Citas y Bienestar para que se vea el cambio.

## 12. v2.8 · Auditoría web (en curso)

Primera parte de la pasada propia de la web que quedó pendiente en la sección 3.

| Qué | Detalle | Dónde |
|---|---|---|
| Índice del checklist | Los 132 ítems con la misma numeración de esta auditoría, cómo aplica cada uno en escritorio (✓, ≈, —, manual) y 7 ítems propios de escritorio (W1–W7) | `audit/checklist-ux.md` |
| **Decisión: objetivos de 44 px también en web** (ítem 113) | La regla de MASTER §6 rige en web aunque se use con mouse; no se adopta el mínimo de 24 px de WCAG 2.2 AA (2.5.8). Motivos: el público de MASTER §1 (30–65 años y cuidadores de adultos mayores) no cambia en escritorio; la web del código tiene cortes a 600, 760 y 768 px, así que también se usa con el dedo en tablet y teléfono; y, medido en los 36 mockups web, todos los botones (126), botones de ícono (84), segmentados (42) y campos (45) ya miden 44 px o más, así que la decisión no cambia ninguna pantalla | `MASTER.md` §6 y §12; `audit/checklist-ux.md` |
| Informe del grupo A | 24 pantallas web que ya existen en el código: 18 hallazgos (4 altos, 11 medios, 3 bajos), lo que queda para revisar a mano y 6 reglas para un futuro `pages/web.md`. Todavía no se corrigió ningún mockup | `audit/web-grupo-a.md` |
| **Decisión: 6 reglas web** | (1) En lista + detalle, «Nuevo …» va como secundario y la única primaria es la del detalle. (2) Modales con alto máximo, cuerpo con scroll y pie fijo; página propia solo para Perfil y Configuración. (3) Cabecera fija por página, sin racha ni nivel, con el menú de cuenta en el avatar. (4) Tres anchos: ≥ 1280, 1024–1279 y < 1024 px. (5) URL propia para cada detalle y formulario. (6) Una columna también en web, con pares cortos; **reemplaza** las dos columnas en el modal web que permitía `formularios.md` §5 | `system/pages/web.md`; `formularios.md` §5; `MASTER.md` §7 |
| Excepción posible (sin usar) | Solo si la auditoría encuentra una pantalla que necesite densidad (por ejemplo, una tabla): controles secundarios dentro de una fila que ya es clicable, solo con mouse, con 24 px como piso. Se documenta pantalla por pantalla | — |

**Hallazgos de la medición** (se corrigen dentro de la auditoría):

- El buscador mide 43 px, pero el token de campo (`--input-height`) es de 48: 7 pantallas web y 12 móviles. Es un desvío del kit, no solo de la web.
- El enlace «Copiar» mide 40 px de ancho (web y móvil).
- En el código, la paginación web mide 32 px de alto (`packages/ui/src/primitives/Pagination/Pagination.web.tsx:27`); al implementar pasa a 44.

## 13. v2.8.1 · Mockups web corregidos (grupo A)

Se aplicaron los 18 hallazgos de `audit/web-grupo-a.md` y las 6 reglas de `system/pages/web.md`. El detalle por hallazgo está al final del informe.

| Qué | Dónde |
|---|---|
| Token nuevo `color.text.on-muted` (`#475569` / `#CBD5E1`) para texto sobre `surface-muted`, el segmentado y tintes de marca. `tokens.json` regenerado con `build-tokens.py` (solo cambió ese token); en `tokens.css` se agregaron a mano las 2 líneas | `system/build-tokens.py`, `tokens.json`, `tokens.css`, `MASTER.md` §4.1 |
| Kit: chips grises y segmentado con el token nuevo; buscador a 48 px (`--input-height`); campo con error sin tinte detrás del placeholder (daba 4,39:1); modal con alto máximo; clases `.mfoot`, `.mhd`, `.wfoot`, `.sel`, `.navg`, `.amenu`; tamaños `.w1024` y `.laptop` | `mockups/kit.css` |
| Kit: barra lateral en dos grupos, cabecera con `act`, menú de cuenta y helpers `wnew`, `mfoot`, `msec`, `amenu`, `wvariant` | `mockups/kit.js`, `mockups/README.md` |
| Pantallas web corregidas: Inicio, acceso, Citas, Medicamentos, Nueva cita, Nuevo medicamento, Tratamientos, Nuevo tratamiento, Documentos, Detalle, Subir y Editar documento, Mochilas, Nueva mochila, Compartir, Configurar enlace, Enlace listo, Vista pública, Perfil y Configuración | `m1`–`m6` |
| 25 pantallas web nuevas: error de inicio de sesión, recuperación (3), 2 a 1024 px, 1 en laptop, subiendo, menú de cuenta, vacíos (5), sin resultados, confirmaciones (3), formulario con errores, descartar, no se pudo guardar y esqueletos (4) | `m1`, `m2`, `m4`, `m6`, `m7`, `m8` |
| También en web fuera del grupo A: «Invitar» como secundario (Dependientes) y Nuevo profesional en una columna | `m2`, `m6` |
| Componentes nuevos o extendidos: Modal (web), PageActionBar, AccountMenu, AppSidebar | `system/componentes.md` |
| Parámetro de caché de `index.html`: `?v=29` → `?v=34` | `mockups/index.html` |

**Medición final:** ver «Estado de los arreglos» en el informe. Grupo A sin desvíos medibles; los pendientes de contraste y de una primaria quedan en Misiones y Dependientes (grupo C).

**Efecto en móvil:** el token nuevo, el buscador de 48 px y el campo con error sin tinte también cambian las pantallas móviles. Se midió que ninguna desborda y que chips y segmentos pasan 4,5:1.

**Pendiente:**
- Modo oscuro sin mockups: el valor oscuro de `text.on-muted` (`#CBD5E1`) no se verificó en pantalla.
- El generador `generate-tokens.cjs` sigue sin estar en este equipo; al regenerar con la skill, `tokens.css` debería dar lo mismo.

## 14. v2.9 · La v2 pasa a ser la versión vigente

Decisión del equipo (2026-11-20), después de revisar los mockups web de la v2.8.1. Es el primer paso de la Fase 0.

| Qué | Dónde |
|---|---|
| `.docs/design-v2/` pasa a ser `.docs/design/`. La v1 sale de la carpeta y queda en el historial de git (`a79a55b`). `archive/` se conserva | `.docs/design/` |
| Se trajo de la v1 lo que solo existía allí: la §6c «Estados de carga» de la spec de movimiento, la demo «Estados de carga» de `movimiento.html` y la fila «Esqueleto» de MASTER §7. La §6c suma los esqueletos web de la v2.8 | `system/pages/movimiento-interacciones.md` §6c, `system/movimiento.html#carga`, `MASTER.md` §7 |
| Se restauró el módulo «Estados vacíos (propuesta)» de la v1 (17 pantallas móviles y 3 web), que se había agregado después de crear la v2 (commit `3d3d6bb`) y quedó fuera en el primer reemplazo. Ahora es el módulo 12; funciona con el kit de la v2, sin desbordes ni errores | `mockups/m9-vacios.js`, `mockups/index.html` (`?v=35`), `mockups/README.md` |
| README nuevo: une el de la v1 (contenido, Figma, reglas de mantenimiento) con el de la v2 | `README.md` |
| Rutas y puerto: todo se sirve con `python3 -m http.server 5180 --directory .docs/design` | `README.md`, `mockups/README.md` |
| ADR 0002 pasa a «aceptada» y su tabla de diferencias apunta a la v2 | `../architecture/adr/0002-adopt-design-system-b.md` |
| `AGENTS.md`, `CLAUDE.md` y la skill `design-system` apuntan a la v2 (misma ruta, versión y reglas web) | raíz del repo, `.agents/skills/design-system/SKILL.md` |

**Pendiente:** unificar el módulo 12 con los vacíos del módulo 10 (`m7-estados.js`) y con los vacíos web de la v2.8. En la v1, el módulo de vacíos reemplazaba 7 vacíos de los módulos 9 y 10; en la v2 esos vacíos siguen existiendo, así que hoy hay pantallas repetidas (Citas, Medicamentos, Documentos, Búsqueda, Mochilas y Compartidos).

**Resueltos con este cambio:**
- El pendiente de la v2.6: la v1 todavía mostraba el resumen de errores arriba. Ya no aplica, porque la v1 salió de la carpeta.
- El pendiente de la v2.7: la §6c solo existía en la v1. Ahora está en esta carpeta.

## 15. v2.9.1 · Relleno de marca en modo oscuro

Al implementar los tokens (change `design-system-v2-foundation`, issue #35) apareció una contradicción: la tabla de MASTER §4.1 y `tokens.css` ponían el relleno de marca en oscuro en `#3B82F6`, pero MASTER §4.5 dice que «los rellenos sólidos de botones se mantienen». Con texto blanco, `#3B82F6` da **3,68:1** y no pasa AA, el mismo problema que la v2 corrigió en claro.

| Qué | Antes | Ahora | Dónde |
|---|---|---|---|
| `color.brand.solid` (oscuro) | `#3B82F6` | `#2563EB` (igual que en claro, 5,17:1) | `build-tokens.py`, `tokens.json`, `tokens.css` (1 línea a mano), `MASTER.md` §4.1, `packages/ui/src/tokens/semantic.ts` |

Para íconos y navegación activa en oscuro se usa `brand.focus` (`#60A5FA`): sobre los fondos oscuros pasa 3:1 como gráfico y 4,5:1 como texto.

**Pendiente:** en `tokens.css`, `--button-secondary-fg` usa `--color-brand-solid` como color de texto. En oscuro, sobre `--color-surface`, no llega a 4,5:1 ni con el valor viejo ni con el nuevo. Se resuelve al construir el botón secundario (segunda parte de la Fase 0).

## 16. v2.9.2 · El chip de opción sigue al kit de los mockups

El MASTER decía que todo chip es píldora (radio 999), pero todas las pantallas de `mockups/` dibujan los chips de opción con `.pick`: radio 12, borde de 1,5 px y canto inferior de 3 px. Al comparar la implementación de Agenda (Fase 1) con los mockups, se decidió que manda el kit.

| Cambio | Dónde |
|---|---|
| Chip de opción (seleccionable): radio 12, borde 1,5 px y canto de 3 px; seleccionado en `brand.focus` con ✓. Los chips de etiqueta siguen siendo píldora | `MASTER.md` §6–7; `packages/ui` `Chip` variante `option` |


## 17. v2.10 · Ir a una fecha en el calendario móvil

En móvil la agenda solo tenía la tira semanal: para ver un día de dentro de varias semanas había que avanzar semana por semana. Se compararon dos opciones en el lienzo: una hoja con el mes desde el título y un selector «Semana / Mes» en la pantalla. Se eligió la hoja, porque la grilla del mes en pantalla dejaba poco lugar a la lista del día y el sistema ya decía que la tira es la vista principal en móvil.

| Cambio | Dónde |
|---|---|
| El título del mes («Noviembre 2026 ⌄») abre la hoja «Ir a una fecha»: mes completo con flechas, hasta 3 íconos por tipo por día, leyenda y «Volver a hoy». Tocar un día cierra la hoja y salta a esa semana | `system/pages/inicio-agenda.md` · Calendario; `mockups/m2-agenda.js` «Calendario · ir a una fecha» |
| La semana empieza el domingo en la tira y en la grilla; la grilla siempre tiene 6 filas y muestra atenuados los días del mes anterior y del siguiente | `system/pages/inicio-agenda.md` · Calendario |

## 18. v2.11 · Hoja de toma con los botones juntos

En la hoja «¿Tomaste esta dosis?» la hora quedaba entre «Sí, la tomé» y «No la tomé», y separaba dos respuestas a la misma pregunta. Se compararon dos opciones en el lienzo: botones juntos con la hora debajo, y una fila de dos botones con la hora como dato en una tarjeta. Se eligió la primera, que cambia menos la hoja.

| Cambio | Dónde |
|---|---|
| «Sí, la tomé» y «No la tomé» juntos; «Se registra a las … · Cambiar hora» justo debajo (8 px), antes de la pista | `system/pages/inicio-agenda.md` · Hoja de toma; `mockups/m2-agenda.js` «Registrar toma» |

## 19. v2.12 · Tirar para actualizar con la última actualización

En Inicio, al tirar hacia abajo la pantalla bajaba pero no se veía nada: el spinner nativo quedaba detrás de la barra de estado y la recarga no dejaba rastro si nada cambiaba. Se compararon dos opciones en el lienzo: el spinner nativo con el texto de iOS debajo, y una píldora del kit. Se eligió la píldora, que se ve igual en iOS y Android y confirma la recarga aunque los datos no cambien. Usa el `Spinner` del sistema, sin un spinner nuevo.

| Cambio | Dónde |
|---|---|
| Píldora de tirar para actualizar: tirando (última actualización), actualizando, listo y error. Se aplica a Inicio, Calendario, Citas, Medicamentos, Bienestar y Documentos | `system/pages/movimiento-interacciones.md` §6c; `system/MASTER.md`; `mockups/m1-acceso-inicio.js` «Inicio · actualizar» |
