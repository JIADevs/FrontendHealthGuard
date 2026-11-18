# Override · Inicio y Agenda (adherencia)

> Manda sobre `MASTER.md` en Inicio (dashboard), Agenda (calendario, citas, medicamentos, bienestar, tareas) y en las acciones que se abren desde notificaciones.

## Inicio
Orden fijo de bloques (móvil). En web se reparten en 3 columnas.
1. Saludo con mascota «Saluda» y resumen («Tienes 3 cosas para hoy»).
2. Tarjeta de racha (oculta si el usuario apagó «Mostrar racha y nivel»).
3. Misión activa con anillo y botón «Continuar» (o la tarjeta de primer uso).
4. Medicamentos de hoy.
5. Acciones rápidas: subir, escanear y compartir.
6. Próximas citas.
7. Documentos recientes.
8. Nivel e insignias. Va al final porque es secundario.

## Tomas de medicamento
- La toma es la acción de mayor frecuencia, así que se resuelve en **un toque**. «Tomar» (éxito sólido `#15803D`) en la fila, y la hoja «¿Tomaste esta dosis?» al abrir desde un push.
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
- Tira semanal en móvil y mes completo en web. Cada día con un máximo de 3 puntos de color y «+n» si hay más.
- El día seleccionado va en azul sólido; el día de hoy, con borde azul.
