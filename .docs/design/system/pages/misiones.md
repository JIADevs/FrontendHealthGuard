# Override · Misiones médicas

> Manda sobre `MASTER.md` en las pantallas del módulo Misiones: lista, detalle, hoja de paso, nueva misión y celebración. Producto: `BackendHealthGuard/.docs/features/missions/`.

## Nombre y tipos
- El módulo se llama **Misiones**. Los mockups siguen los pasos del PRD; ejemplo principal: misión «Realizar un examen».
- Tipos visibles: «Asistir a una cita médica», «Conseguir un medicamento», «Realizar un examen», «Terminar una terapia». Cada tipo lleva su ícono y el tinte de su módulo (cita → rosa, medicamento → ámbar, examen → sky, terapia → violeta) en el encabezado. El progreso siempre es verde.
- La terapia es **una** misión con N sesiones, no diez misiones. «Sesiones» es un solo paso de ciclo cuyo mensaje sale de las citas: «Programa tu quinta sesión», «Tu quinta sesión es el jueves», «¿Asististe a tu quinta sesión?», «¿Terminaste tu terapia?». Ordinal en palabra hasta la décima y `#n` desde la 11 («Tu sesión #11 es el jueves»). El progreso se muestra como «Llevas 4 de 10 sesiones» (v2.17).

## Jerarquía
1. Arriba, el **objetivo** en lenguaje humano: «Vamos a conseguir tu medicamento».
2. La **línea de tiempo** completa, con el **paso actual resaltado** (halo azul + tarjeta «PASO n DE N · AHORA», título y «Toca para continuar» con ›). La línea de tiempo **no lleva botones**.
3. Al tocar el paso actual se abre su **hoja**, con todas sus opciones (una acción primaria y como máximo una secundaria). Al tocar un paso completado se abre su resumen con «Editar». Un push abre directamente la hoja del paso (v2.16).

## Estados de paso (de la API: `pending` · `in_progress` · `completed` · `skipped`)
| Estado | Nodo | Texto |
|---|---|---|
| `completed` | Verde con ✓ | «Completado · 28 oct» |
| `in_progress` | Azul de 40 px con halo, **centrado con su tarjeta** | Tarjeta tocable con «PASO n DE N · AHORA», título y «Toca para continuar» + ›. Sin botones: las acciones van en la hoja (v2.16) |
| `pending` | Blanco con borde | Título gris + qué lo habilita |
| `skipped` | Gris con «–» | «No aplica» (no es un error) |

## Reglas
- **Nunca** marcar asistencia o un paso como hecho porque pasó la fecha. Preguntar: «¿Pudiste asistir a tu cita?».
- Los documentos se pueden adjuntar **en cualquier paso**. Mostrar «Adjuntar documento» como acción secundaria permanente.
- Botón «No aplica» o «No necesito documentos» visible cuando el paso es condicional.
- **v2.20 · Pasos optimistas, cierre no** (PRD `DU-6`, RNF-10/11): completar u omitir un paso cambia la línea de tiempo al tocar y se guarda en segundo plano; si falla, vuelve atrás con «No se pudo guardar · Reintentar». El **cierre** de la misión, la celebración, la insignia y el nivel esperan al servidor (botón en estado cargando). Crear, cancelar y compartir también esperan.
- **Celebración:** solo al completar la misión. Mascota «Celebra», confeti de una sola vez en la franja superior (sin tapar texto), resumen de pasos e insignia si aplica. Debe respetar «Celebraciones: apagado».
- **Seguimiento posterior** (pregunta tras el cierre): opcional, en una hoja aparte, sin bloquear el cierre. **v2.22:** la hoja se abre sobre **Inicio** (adonde lleva «Volver al inicio»), sin toast «Misión completada» (la celebración ya lo dijo) y sin mascota en la hoja (Inicio ya tiene la suya). Si se cierra, el usuario queda en Inicio. **v2:** aparece al cerrar la celebración («Volver al inicio»), nunca encima de ella.
- **v2 · Progreso:** la barra nunca arranca vacía (con 0 pasos muestra un mínimo) y el copy va en positivo («Llevas 3 de 10 sesiones»).
- **v2.17 · Nueva misión (MVP):** los cuatro tipos como tarjetas con indicador de radio, el dato mínimo y la barra fija «Crear misión». La vía «Sube la orden y la IA arma la misión» (RF-21) y el tratamiento (RF-26) quedan para después (pantalla «Nueva misión · después»).
- **v2 · Celebración:** el botón principal dice «Volver al inicio».
- **v2.28 · Lista (H2):** arriba, «Tu próximo paso» (tarjeta con tinte azul, chip de cuándo, título del paso, misión y la única acción primaria, que abre la hoja del paso). Debajo, pestañas «En curso · n | Completadas · n». En «En curso», las misiones son filas sin botón (anillo, chip de tipo gris, «Sigue: … · **fecha**», ›), ordenadas por cercanía; las pausadas al final en gris. Las sugerencias se resumen en **una sola fila** al final («Tienes n misiones sugeridas ›»), que abre «Misiones sugeridas» agrupadas por origen. Sin misiones en curso: vacío con mascota, «Iniciar una misión» y la fila de sugerencias.
- **v2.16 · Paso → hoja:** todos los pasos se abren igual, en una hoja (`MissionStepSheet`; en web, modal). En la hoja, las dos acciones se apilan (principal + fantasma). Nunca se repiten en la línea de tiempo las acciones de la hoja.
- **v2.16 · Espaciado de la línea de tiempo:** 26 px entre pasos; conector de 3 px con 6 px de aire alrededor de cada nodo; títulos de paso a 15 px (el actual a 16 px); el nodo actual centrado verticalmente con su tarjeta; «Adjuntar documento» separado de los pasos por una línea.
- **Sugerencias (v2.28):** viven en «Misiones sugeridas», a la que se llega por la fila de «En curso»; cada grupo dice su origen («De tu {origen}»). Tarjeta con tinte azul, el tipo sugerido y de dónde viene, con «Crear misión» (secundario) y «Ahora no». El seguimiento posterior crea sugerencias, no misiones. La sugerencia al subir un documento («¿Quieres crear una misión para este examen?», RF-68) es para después.

## Primer uso
Pantalla «Tu salud, paso a paso. ¿Qué te gustaría hacer primero?» con tres tarjetas de acción: crear tu primera cita, crear tu primer medicamento y subir tu historia clínica. Mascota «Saluda». Ninguna de las tres es obligatoria.

**v2:** la misma propuesta se muestra justo después del registro (pantalla «Bienvenida», módulo 1) y como lista «Configura Helu» en Inicio, no solo dentro de Misiones. Siempre con salida visible: «Explorar por mi cuenta».

**Decidido (PRD `DU-9`, 2026-11-23):** en móvil, Misiones vive dentro de «Más» y se llega desde Inicio («Continuar la misión»). No tiene pestaña propia.

## v2.17 · Pantallas del MVP
- **Encabezado:** chip del tipo con su tinte, conteo de pasos (o «Pausada»), barra verde (gris si está pausada) y «Sigue: …». Si la misión nació de una sugerencia, una fila «Surgió de tu cita de ortopedia ›».
- **Menú «⋯»:** Compartir documentos, Ver historial, Editar, Pausar; «Cancelar misión» como enlace rojo al final. No existe «Eliminar».
- **Paso final de documentos:** «Guardar y terminar» (verde) + «Omitir, no me dieron nada». Sugiere qué guardar según el tipo.
- **Seguimiento de una cita:** chips de opción múltiple + «Crear n sugerencias» / «No, nada más».
- **Sugeridas:** sección propia arriba de «En curso», con su origen. «Crear misión» abre una hoja con el tipo fijo, el dato mínimo y los documentos de origen preseleccionados.
- **Tareas de apoyo:** sección «Recordatorios» dentro de la hoja del paso, con «Crear recordatorio».
- **Modo gestión:** sin banner fijo; la señal permanente es la pestaña Inicio con las iniciales y el anillo de color del dependiente (el aviso «Gestionando a…» aparece 1 s al cambiar de cuenta). Los pasos muestran su autor («Completado por ti»). La celebración del gestor es **la misma pantalla** que la del paciente; solo cambian el texto en tercera persona y «Volver al inicio de Juan» (v2.19).
- **v2.25 · El dependiente se entera:** si el gestor completó su misión, el dependiente ve un toast la próxima vez que abre la app («Carlos completó tu misión «…» · Nueva insignia: …»), una sola vez. Sin celebración completa.
