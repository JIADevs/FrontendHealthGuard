# Auditoría web · grupo A (v2.8)

- Fecha: 2026-11-20.
- Checklist: [`checklist-ux.md`](./checklist-ux.md) (ítems 1–132 y W1–W7).
- Estado: **corregido en v2.8.1** (2026-11-20). Qué cambió en cada hallazgo: sección «Estado de los arreglos» al final y [`CHANGELOG.md`](../CHANGELOG.md) §13.

## Alcance y método

**Grupo A:** las 24 pantallas web de la v2 que corresponden a algo que ya existe en `apps/web`. Quedan fuera las pantallas web de funciones que la web todavía no tiene (Calendario, Bienestar, Check-in, Detalle de ciclo, Nuevo profesional, Dependientes, Modo gestión, Notificaciones y Misiones).

| Módulo | Pantallas |
|---|---|
| Acceso e Inicio | Inicio de sesión, Registro, Inicio |
| Agenda | Citas, Medicamentos, Nueva cita, Nuevo medicamento |
| Tratamientos | Tratamientos, Nuevo tratamiento |
| Documentos | Documentos, Detalle de documento, Subir documento, Editar documento |
| Mochilas y Compartir | Mochilas, Nueva mochila, Compartir, Configurar enlace, Enlace listo · QR, Vista pública del documento |
| Cuenta | Perfil, Configuración |
| Estados | Documentos · vacío, Documento eliminado · deshacer, Sin conexión |

**Método:**

1. Medición en el navegador sobre el DOM de los mockups: tamaño de controles, contraste de cada texto contra su fondo, desbordes, botones primarios por vista, chips de color y campos sin etiqueta.
2. Las mismas pantallas forzadas a 1280 × 800 y 1024 × 768 (el lienzo solo las dibuja a 1440 × 900).
3. Lectura de la estructura de cada pantalla (cabecera, paneles, modales, campos, acciones) y comparación con su par móvil v2.
4. No hubo revisión visual con capturas. Lo que solo se puede juzgar mirando o usando la pantalla va en «Manual».

## Resumen

- **18 hallazgos: 4 altos, 11 medios y 3 bajos.**
- **Patrón principal:** la web no recibió los cambios de la auditoría móvil. Seis pantallas contradicen a su par móvil v2: Inicio, Nueva cita, Detalle de cita, Detalle de mochila, Subir / Editar documento y Perfil.
- **Hay problemas de sistema, no de una pantalla:** dos primarios en las páginas de lista + detalle, cabecera que cambia, modales más altos que una laptop, barra lateral de 11 filas.
- **Hay problemas del kit que también afectan a móvil:** contraste de chips grises y del segmentado, y el buscador de 43 px.
- **Sin hallazgos propios** (solo los de sistema): Vista pública del documento, Sin conexión, Documento eliminado · deshacer, Nueva mochila, Configurar enlace, Configuración.

## Hallazgos

Evidencia: archivo de `mockups/` y línea donde se define la pantalla.

### Alta

| ID | Pantalla | Ítem | Qué falla | Evidencia | Arreglo |
|---|---|---|---|---|---|
| W-01 | Kit (web y móvil) | 112 | El texto de los chips grises (12,5 px) mide **4,41:1** y las opciones inactivas del segmentado (13 px) **4,30:1**. Ninguno llega a 4,5:1, y aparecen en casi todas las listas | `kit.css:88` (`.c-gray`) y `.seg`; medido en Citas («Presencial» 4,41, «Medicamentos» 4,30), Tratamientos, Documentos, Mochilas, Configuración | Oscurecer el texto de esos dos componentes hasta ≥ 4,5:1 y volver a medir en claro y oscuro |
| W-02 | Lista + detalle: Citas, Detalle de documento, Mochilas, Compartir | 1, 4, 21, 25 | Dos botones primarios a la vez: «Nuevo …» en la cabecera y la acción del panel de detalle («Compartir», «Mostrar QR»). En Citas, «Nueva cita» compite además con «Marcar como completada» en verde | `m2-agenda.js:47`, `m4-documentos.js:29`, `m5-mochilas-compartir.js:14`, `:33` | Regla web: en lista + detalle, «Nuevo …» va como secundario con «+»; la única primaria es la acción principal del detalle |
| W-03 | Inicio | 1, 4, 15, 24 · MASTER §2 | La primaria es «Subir documento» (junto a «Escanear»), aunque el saludo dice que lo siguiente es la Metformina. «Tomar» queda en verde dentro de una tarjeta: hay dos botones destacados. En móvil v2, «Tomar» es la única acción destacada | `m1-acceso-inicio.js:55` | Sacar «Subir documento» y «Escanear» de la cabecera de Inicio y dejar «Tomar» como única acción destacada, igual que en móvil |
| W-04 | Modales de formulario | W3, 11, 12 | Contando el margen superior, los modales miden de 681 a 782 px de alto (Nuevo medicamento: 758 + 24). En una laptop de 1366 × 768, con la barra del navegador, el alto visible ronda 650–700 px (estimado): el botón «Guardar» queda debajo del borde | Medido en Nuevo medicamento (`m2:54`), Nueva cita (`m2:50`), Editar documento (`m4:31`), Nueva mochila (`m5:17`), Enlace listo (`m5:35`) | Regla web: alto máximo del modal = alto visible − 48 px; el cuerpo hace scroll y el pie con las acciones queda siempre visible |

### Media

| ID | Pantalla | Ítem | Qué falla | Evidencia | Arreglo |
|---|---|---|---|---|---|
| W-05 | Barra lateral (todas) | 9, 17, 45 | 10 destinos más «Cerrar sesión»: 11 filas, frente a 5 pestañas en móvil. Perfil, Configuración y Cerrar sesión ocupan la barra aunque el avatar «AG» ya está arriba a la derecha | `kit.js:126` (`side`) | 5–6 destinos principales; un segundo grupo con título para el resto; Perfil, Configuración y Cerrar sesión en el menú del avatar. Qué entra entre los principales depende de la decisión abierta sobre Misiones |
| W-06 | Cabecera (11 pantallas) | 25, 42, 88 | La cabecera muestra la racha «12» y «Nivel 4» en unas pantallas y el botón principal en otras. La misma página cambia de cabecera al abrir un modal (Citas muestra «Nueva cita»; con el modal abierto, racha y nivel). La racha además ya está en la barra lateral y en Inicio. En móvil v2 se quitó del header | `kit.js:127` (`wtop`); Inicio, Nueva cita, Nuevo medicamento, Nuevo tratamiento, Nueva mochila, Configurar enlace, Enlace listo, Configuración, Documentos · vacío, Documento eliminado, Sin conexión | Cabecera fija por página: título + acción de la página (si tiene) + campana + avatar. La racha solo va en la barra lateral y en Inicio |
| W-07 | Nueva cita | 3, 28, 54 · formularios §2 | Mantiene el orden de v1: empieza por «Nombre de la cita», «Fecha» y «Hora» van en la mitad y los opcionales no dicen «(opcional)». En móvil v2 el orden es Fecha · Hora · Duración · Tipo · Especialidad · Profesional · Nombre (opcional) · Lugar · Clínica (opcional) | `m2-agenda.js:50` | Mismos campos, orden y secciones que la Nueva cita móvil v2 («Fecha y hora», «Profesional», «Modalidad y lugar») |
| W-08 | Detalle de cita (en Citas) | 14, 86, 106 | En una cita futura (jue 5 nov; «hoy» es mar 3) ofrece «Marcar como completada». «Cancelar cita» es un botón rojo junto a «Reprogramar». Faltan «Cómo llegar» y «+ Agregar documento» | `m2-agenda.js:47` | Igual que móvil v2: «¿Pudiste asistir?» solo después de la fecha, «Cancelar cita» como enlace rojo al final, más «Cómo llegar» y «+ Agregar documento» |
| W-09 | Detalle de mochila (en Mochilas) | 14, 66 | «Eliminar mochila» es un botón rojo junto a «Editar». En móvil v2 es un enlace rojo al final | `m5-mochilas-compartir.js:14` | «Editar» en la cabecera del panel y «Eliminar mochila» como enlace rojo al final |
| W-10 | Subir y Editar documento | 55, 61 · formularios §2 | Subir pide 3 campos (Título, Tipo, Tratamiento) y Editar pide 5. Móvil v2 usa los mismos 7 campos en los dos. Ninguno marca «(opcional)», aunque solo el título es obligatorio | `m4-documentos.js:30`, `:31` | Los mismos campos que móvil v2 en Subir y en Editar, con «(opcional)» y el estado «Precargado por IA» |
| W-11 | Formularios en modal y Perfil | 77 | Nueva cita, Nuevo medicamento, Nuevo tratamiento, Subir y Editar documento y Perfil ponen campos lado a lado (medido por la posición de cada campo). **Cumplen `formularios.md` §5**, que permite hasta dos columnas en el modal web, pero chocan con el ítem 77 y con móvil, donde se usa una columna y solo se juntan pares cortos y relacionados (Fecha + Hora, Inicio + Fin). En Subir documento quedan juntos Tipo y Tratamiento, que no son un par | `m2:50`, `:54`, `m3:52`, `m4:30`, `:31`, `m6:29` | Una columna, con pares cortos y relacionados (`web.md` §6) |
| W-12 | Perfil | 12, 45 · anti-patrón v2 | «Guardar cambios» está solo en la cabecera de un formulario de 9 campos. Nivel, racha e insignias van primero; en móvil v2, los datos van primero y las insignias al final | `m6-cuenta.js:29` | Pie fijo con «Guardar cambios» (equivalente web de la barra inferior), datos primero e insignias al final |
| W-13 | Inicio, Tratamientos, Inicio de sesión, Registro, Compartir | W3 | A 1024 px, Inicio se sale del marco (columnas fijas de 400 y 360 px), igual que Tratamientos (134 px), Inicio de sesión y Registro (35 px). En Compartir se recortan «Copiar enlace» y «Extender plazo». A 1280 px no hay desbordes | Medido forzando el ancho del marco | Definir cortes: a menos de 1280 px, Inicio en 2 columnas; a menos de ~1100 px, lista + detalle pasa a lista y detalle en su propia vista; barra lateral plegable a íconos; botones que no entran se apilan (regla v2.1) |
| W-14 | Estados que faltan en web | 34, 86, 89, 94, 97, 100, 104, 105, 95 | La web tiene 3 estados (móvil tiene 24) y ningún esqueleto (móvil tiene 8). Para pantallas que ya funcionan faltan: carga de Inicio, Documentos, Detalle de documento y Mochilas; vacíos de Citas, Medicamentos, Mochilas, Compartidos y Tratamientos; búsqueda sin resultados; formulario con errores dentro de un modal; «¿Descartar los cambios?» al cerrar un modal con Esc o clic afuera; confirmaciones (cancelar cita, revocar acceso, cerrar sesión); «No se pudo guardar»; error de inicio de sesión; Subir documento · subiendo | `m7-estados.js:37–39`; `m8-carga.js` sin pantallas web | Diseñar la versión web de cada uno. La mayoría es el mismo contenido en el modal de 560 px o dentro del panel |
| W-15 | Inicio de sesión | 53 · anti-patrón v2 | «¿Olvidaste tu contraseña?» lleva a un flujo que no está diseñado en web (en móvil son 3 pantallas). Además, el backend no tiene endpoint de recuperación | `m1-acceso-inicio.js:5–9` | Ocultar el enlace hasta que exista el flujo; cuando exista, diseñar la versión web de las 3 pantallas |

### Baja

| ID | Pantalla | Ítem | Qué falla | Evidencia | Arreglo |
|---|---|---|---|---|---|
| W-16 | Inicio, Documentos, Documentos · vacío | 5, 20, 42 | Ofrecen «Escanear». En escritorio casi nunca hay una cámara útil y la web del código no tiene escáner | `m1:55`, `m4:28`, `m7:37` | En web, quitar «Escanear» o cambiarlo por «Escanear con el teléfono» (un QR que abre la app) |
| W-17 | Medicamentos | 41, 61 | Mezcla activos y finalizados en la misma lista (chip «Finalizado»). Móvil v2 los separa en «Activos» y «Finalizados» | `m2-agenda.js:48` | Grupos con título «Activos» y «Finalizados», como en móvil. *(Corregido: este arreglo decía «segmentado», pero móvil usa grupos con título, no un segmentado.)* |
| W-18 | Enlace listo · QR, Detalle de documento | 42, 55 | En Enlace listo, el botón «Copiar enlace» y el enlace «Copiar» hacen lo mismo (y «Copiar» mide 40 px de ancho). En Detalle de documento no hay «Eliminar documento»; en web solo existe el toast de borrado | `m5:35`, `m4:29` | Dejar una sola acción de copiar. Agregar «Eliminar documento» como enlace rojo al final del detalle, con «Deshacer» |

Ya registrado en el CHANGELOG (sección 12): el buscador mide 43 px y el token de campo es de 48.

## Manual: lo que no se puede juzgar desde los mockups

| Ítem | Cómo comprobarlo |
|---|---|
| W1, 114 (teclado y foco) | Recorrer cada pantalla solo con Tab, Mayús+Tab, Enter y Esc: orden lógico, foco visible, el foco no sale del modal y vuelve a quien lo abrió |
| W2, 89 (URL y atrás) | En el código, abrir un detalle o un formulario y usar el botón atrás del navegador y recargar. Hoy la web abre detalles y formularios en modales sin URL propia |
| 16, 87 | Hacer clic en el logo desde cada página; revisar que la página actual quede marcada en la barra lateral |
| 80, 84 | En el código: atributos `autocomplete` en acceso y perfil; botón deshabilitado y con texto en gerundio mientras guarda |
| 96 | Probar con la red limitada de las herramientas del navegador («Fast 3G») |
| 112 en imágenes | Contraste del texto sobre el degradado de acceso: el cálculo automático no lee degradados. En principio pasa (blanco sobre azul 600–900) |
| 62 | Prueba con personas: paciente y cuidador, en una laptop |

## Reglas para `pages/web.md`

**Aprobadas el 2026-11-20** y escritas en [`../system/pages/web.md`](../system/pages/web.md). En la regla 6 se eligió una columna también en web, con pares cortos.

1. **Lista + detalle:** una sola primaria por vista; «Nuevo …» va como secundario (W-02).
2. **Modales:** alto máximo según la ventana y pie fijo con las acciones (W-04). «¿Descartar los cambios?» ya está definido en `formularios.md` §7; lo que falta es su mockup web (W-14).
3. **Cabecera fija por página** y racha solo en la barra lateral y en Inicio (W-06).
4. **Cortes de pantalla:** 1440, 1280 y 1024; qué se pliega en cada uno (W-13).
5. **Cada detalle y cada formulario tiene su URL** (W2).
6. **Columnas en formularios:** mantener lo que dice `formularios.md` §5 (hasta dos columnas en el modal web) o alinear la web con móvil (una columna y solo pares cortos y relacionados) (W-11).

## Estado de los arreglos (v2.8.1)

| ID | Estado | Qué cambió |
|---|---|---|
| W-01 | Corregido | Token nuevo `color.text.on-muted` (`#475569` claro, `#CBD5E1` oscuro) para chips grises y opciones inactivas del segmentado. También arregla móvil: 152 chips y segmentos medidos, ninguno bajo 4,5:1 |
| W-02 | Corregido | «Nuevo …» como secundario con «+» en Citas, Documentos, Mochilas, Compartir y Tratamientos; la tarjeta abierta queda marcada (`.sel`) |
| W-03 | Corregido | Inicio sin «Subir documento», «Escanear» ni la tarjeta de nivel; «Medicamentos de hoy» va primero y «Tomar» es la única acción destacada. Una tarjeta «Acciones rápidas» en gris da acceso a subir, nueva cita y compartir |
| W-04 | Corregido | Modal con alto máximo, encabezado y pie fijos (`.mhd`, `mfoot`). Pantalla nueva «Nuevo medicamento · laptop 1366 × 768» |
| W-05 | Corregido (provisional) | Barra lateral con 5 destinos + grupo «Más»; Perfil, Configuración y Cerrar sesión pasan al menú del avatar (pantalla nueva «Menú de cuenta») |
| W-06 | Corregido | Cabecera = título · acción de la página · campana · avatar, igual en todos los estados; sin racha ni nivel |
| W-07 | Corregido | Nueva cita con los campos, el orden y las secciones de móvil v2, en una columna |
| W-08 | Corregido | Detalle de cita como el de móvil v2: sin «Completada» en una cita futura, «Cómo llegar», «Agregar documento» y «Cancelar cita» como enlace rojo |
| W-09 | Corregido | «Editar» en la cabecera del panel y «Eliminar mochila» como enlace rojo al final |
| W-10 | Corregido | Subir y Editar documento con los mismos 7 campos, «(opcional)» y precargado por IA |
| W-11 | Corregido | Formularios web en una columna; solo quedan juntos Fecha + Hora e Inicio + Fin |
| W-12 | Corregido | Perfil en una columna de 720 px, insignias al final y pie fijo con «Guardar cambios» |
| W-13 | Corregido | Columnas con mínimos y proporciones; acceso con panel que se achica. Pantallas nuevas a 1024 px: Inicio y Documentos |
| W-14 | Corregido | 21 pantallas web nuevas: error de inicio de sesión, recuperación (3), subiendo, vacíos (5), sin resultados, confirmaciones (3), formulario con errores, descartar, no se pudo guardar y esqueletos (4) |
| W-15 | Corregido en diseño | Recuperar contraseña, Revisa tu correo y Nueva contraseña en web. En el código, el enlace se oculta hasta que exista el endpoint |
| W-16 | Corregido | Sin «Escanear» en Inicio, Documentos y Documentos · vacío |
| W-17 | Corregido | Grupos «Activos» y «Finalizados» |
| W-18 | Corregido | Una sola acción de copiar en Enlace listo; «Eliminar documento» al final del detalle |

**Medición final** (en el navegador, sobre las pantallas del grupo A y los estados nuevos):

- 0 textos por debajo de 4,5:1.
- Una sola primaria por vista.
- 0 controles de menos de 44 px.
- 0 desbordes a 1440, 1280 y 1024 px.
- En la variante laptop, el modal hace scroll y el pie queda visible.
- En móvil: ningún desborde horizontal y todos los campos de 44 px o más.

**Quedan fuera del grupo A y sin corregir:** texto secundario sobre tinte azul a 4,44:1 en Misiones y Paso 3 de misión; en Dependientes, las iniciales de los avatares a 3,56–3,77:1 y «Aceptar» y «Enviar invitación» como dos primarias.
