# Override · Misiones médicas

> Manda sobre `MASTER.md` en las pantallas del módulo Misiones: lista, detalle, hoja de paso, nueva misión y celebración. Producto: `BackendHealthGuard/.docs/features/missions/`.

## Nombre y tipos
- El módulo se llama **Misiones**. Los mockups siguen los pasos del PRD; ejemplo principal: misión «Realizar un examen».
- Tipos visibles: «Asistir a una cita médica», «Conseguir un medicamento», «Realizar un examen», «Terminar una terapia». Cada tipo lleva su ícono y el tinte de su módulo (cita → rosa, medicamento → ámbar, examen → sky, terapia → violeta) en el encabezado. El progreso siempre es verde.
- La terapia es **una** misión con N sesiones. Se muestra «Sesión 4 de 10», no diez misiones.

## Jerarquía
1. Arriba, el **objetivo** en lenguaje humano: «Vamos a conseguir tu medicamento».
2. La **tarjeta del paso actual** desplegada, con una acción primaria y como máximo una secundaria.
3. La línea de tiempo completa, debajo y consultable.

## Estados de paso (de la API: `pending` · `in_progress` · `completed` · `skipped`)
| Estado | Nodo | Texto |
|---|---|---|
| `completed` | Verde con ✓ | «Completado · 28 oct» |
| `in_progress` | Azul de 40 px con halo | Tarjeta desplegada con «PASO n · AHORA» |
| `pending` | Blanco con borde | Título gris + qué lo habilita |
| `skipped` | Gris con «–» | «No aplica» (no es un error) |

## Reglas
- **Nunca** marcar asistencia o un paso como hecho porque pasó la fecha. Preguntar: «¿Pudiste asistir a tu cita?».
- Los documentos se pueden adjuntar **en cualquier paso**. Mostrar «Adjuntar documento» como acción secundaria permanente.
- Botón «No aplica» o «No necesito documentos» visible cuando el paso es condicional.
- No reflejar el éxito hasta que lo confirme el servidor. Mientras tanto: botón en estado cargando y la línea de tiempo sin cambios.
- **Celebración:** solo al completar la misión. Mascota «Celebra», confeti de una sola vez en la franja superior (sin tapar texto), resumen de pasos e insignia si aplica. Debe respetar «Celebraciones: apagado».
- **Seguimiento posterior** (pregunta tras el cierre): opcional, en una hoja aparte, sin bloquear el cierre.
- **Sugerencia de nueva misión:** tarjeta con tinte azul («¿Quieres crear una misión para este examen?») con «Crear misión» y «Ahora no».

## Primer uso
Pantalla «Tu salud, paso a paso. ¿Qué te gustaría hacer primero?» con tres tarjetas de acción: crear tu primera cita, crear tu primer medicamento y subir tu historia clínica. Mascota «Saluda». Ninguna de las tres es obligatoria.
