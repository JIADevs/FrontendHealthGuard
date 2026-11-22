# Override · Inicio y Agenda (adherencia)

> Manda sobre `MASTER.md` en Inicio (dashboard), Agenda (calendario, citas, medicamentos, bienestar, tareas) y en las acciones que se abren desde notificaciones.

## Inicio
Orden fijo de bloques (móvil). En web se reparten en 3 columnas.
1. Saludo con mascota «Saluda» y lo siguiente del día («Tienes 3 cosas para hoy. Lo siguiente: tu Metformina a la 1:00 p. m.»).
2. Medicamentos de hoy. **«Tomar» es la acción primaria de la pantalla** cuando hay una toma pendiente (botón de 48 px, no `sm`).
3. Tarjeta de racha (oculta si el usuario apagó «Mostrar racha y nivel»). Su botón de check-in es secundario.
4. Misión activa con anillo y «Continuar la misión» (secundario).
5. Acciones rápidas: subir, escanear y compartir. *(v2.1: un solo tinte, el azul de marca.)*
6. Próximas citas.
7. Documentos recientes.
8. ~~Nivel e insignias~~ **v2.1:** salen de Inicio para bajar la carga; viven en Perfil y en la tarjeta de «Más».

**v2:**
- El header muestra solo el logo y la campana: la racha y el nivel ya están en sus tarjetas.
- **Primer uso:** mientras falte configurar, el bloque 2 es la lista «Configura Helu · 1 de 4» (crear la cuenta ya cuenta como hecho) con «Ocultar esta lista».
- **Todo al día:** si no queda nada pendiente, el saludo lo celebra («¡Todo al día!») y dice qué sigue mañana.

## Tomas de medicamento
- La toma es la acción de mayor frecuencia, así que se resuelve en **un toque**. «Tomar» (éxito sólido `#15803D`) en la fila, y la hoja «¿Tomaste esta dosis?» al abrir desde un push.
- **v2 · Hoja de toma:** «Sí, la tomé» guarda al instante con la hora actual; «Cambiar hora» es opcional. Los motivos de no toma aparecen solo después de «No la tomé», en un segundo paso.
- Estados de fila: pendiente (botón «Tomar»), tomada («✓ Tomado» en verde), no tomada (chip rojo con el motivo), futura (chip gris «Más tarde»).
- Motivos de no toma: «Se me olvidó», «No lo compré» y «Otro». Nunca se muestran como culpa.
- Meta semanal: anillo verde «12/14» y la frase «Llevas 12 de 14».

## Check-in
- 5 caras: Muy mal, Mal, Regular, Bien, Excelente. Los colores van de rojo a esmeralda, siempre con su etiqueta de texto.
- Al guardar: toast «¡13 días seguidos cuidándote!», la llama crece una vez y el número sube. Nada más.

## Tareas de agenda (feature `agenda-tasks`, recién agregada al código)
- Usan el acento de **misiones/brand** (tinte azul) y el ícono `check-square`. Muestran fecha y estado, con «Completar» y «Reprogramar» como acciones.
- Se ven en el calendario junto a citas (rosa), tomas (ámbar) y check-in (esmeralda). La leyenda de puntos siempre es visible.

## Calendario
- Tira semanal en móvil y mes completo en web. Cada día muestra hasta 3 **íconos por tipo** (pastilla = toma, calendario = cita, corazón = check-in, ruta = misión o tarea) en el color de su módulo, y «+n» si hay más. *(v2.3: antes eran puntos de color; el ícono evita que el tipo dependa solo del color.)* El texto de cada evento vive en la lista del día, no en la celda.
- **Web (v2.3):** grid de 7 columnas iguales (`minmax(0,1fr)`), panel «Hoy» de 340 px, y en la lista del día la hora va dentro del metadato («1:00 p. m. · Toma · 1 tableta»).
- El día seleccionado va en azul sólido con texto blanco; el día de hoy, con borde azul.
- **v2.10 · Ir a una fecha (móvil):** el título del mes («Noviembre 2026 ⌄») abre una hoja con el mes completo: flechas para cambiar de mes, los mismos íconos por tipo de la tira (hasta 3 por día), la leyenda y «Volver a hoy». Tocar un día cierra la hoja y la agenda salta a esa semana con ese día elegido. La tira semanal sigue siendo la vista principal en móvil; no hay vista de mes en la pantalla. Mientras llega el mes, los días se ven sin íconos (no se dice «sin eventos» antes de saberlo).
- **v2:** debajo de la tira va la leyenda (Tomas, Citas, Check-in, Misiones y tareas), y cada evento dice su tipo en texto («Toma · 1 tableta», «Misión · paso 2 de 4»).
- **v2:** en la lista del día solo la acción más urgente usa estilo éxito o primario («Tomar»); las demás («Hacer», «Ver», «Completar») son secundarias.
- **v2.1:** títulos de evento cortos (máximo 2 líneas) y chips de fecha y atributos en gris; en el detalle de una cita, las filas de hora, lugar y recordatorio van en gris.

## Citas (v2)
- Orden cronológico, separadas en «Próximas» y «Anteriores». Los atributos (presencial, virtual) van en chip gris.
- En una cita futura no se ofrece «Marcar como completada». Desde la hora de la cita se pregunta «¿Pudiste asistir?» con «Sí, asistí» y «No pude, reprogramar».
- «Cancelar cita» la marca como cancelada (no la borra), va como enlace rojo al final del detalle y su confirmación ofrece «Mantener cita».
- Formulario: primero «Fecha y hora», luego «Profesional» y «Modalidad y lugar» (títulos sustantivos, `formularios.md` §5); el resto, plegado en «Más detalles (opcional)». El nombre de la cita se completa solo.

## Medicamentos (v2)
- Lista separada en «Activos» y «Finalizados». El progreso del ciclo va en verde.
- El detalle ofrece «Tomar» cuando hay una toma pendiente.
- Formulario: la unidad de la dosis sale de la forma farmacéutica y la frecuencia usa chips (Horas / Días / Semanas), con el resumen calculado debajo («1 tableta cada 12 horas · 2 tomas al día»).

## Bienestar (v2)
- En el gráfico de ánimo cada barra lleva su cara, y hay leyenda con las 5 etiquetas.
