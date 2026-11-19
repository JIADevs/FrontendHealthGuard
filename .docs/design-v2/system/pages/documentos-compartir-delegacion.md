# Override · Documentos, Mochilas, Compartir y Delegación

> Manda sobre `MASTER.md` en estos módulos, que son los de mayor sensibilidad de datos.

## Documentos
- Acento **sky** (`#0369A1` sobre `#F0F9FF`). El verde ya no identifica documentos.
- Tipo de documento: ícono + texto (Orden, Resultado, Autorización, Fórmula, Imagen, Portal), todos con el tinte sky del módulo. **v2:** ya no se colorea según el módulo relacionado: el verde de autorización chocaba con «completado», el violeta de resultado con IA y el esmeralda de portal con bienestar.
- La IA se marca con un chip violeta con destello «IA» o con el aviso «La IA lo clasificó como…». Siempre se puede editar y nunca guarda sin que el usuario confirme. **v2:** en la lista, el chip «IA · sin revisar» solo aparece en documentos que el usuario aún no revisó (v2.1: debajo del título, para no cortarlo); el banner grande de IA se usa solo en el estado vacío.
- **v2.1 · Filtros rápidos:** solo «Todos», «Órdenes» y «Resultados»; el resto de categorías, etiquetas y fechas está en la hoja de filtros. Las etiquetas de tratamiento van en chip gris.
- Vista previa grande con contador de páginas. **v2:** «Compartir» es el botón primario; «A mochila» y «Editar» son secundarios; «Eliminar documento» va al final como enlace rojo y se deshace con un toast de 5 s, sin modal.
- **v2 · Subir:** una columna, límite visible («PDF o imagen, hasta 10 MB»), estado de subida con porcentaje y «la IA está leyendo», y barra fija «Guardar documento». Editar muestra los mismos campos que subir.
- **v2 · Escáner:** la miniatura abre «Revisar páginas» (volver a tomar, quitar, reordenar). Si no hay permiso de cámara: «Necesitamos tu cámara» con «Abrir ajustes» y «Subir un archivo en su lugar».
- **v2 · Resultado de examen virtual:** hoja en una columna; la URL va primero y el título se completa con el nombre del portal.
- Portales de resultados: nunca pedir ni guardar contraseñas. Lo dice un hint visible.

## Mochilas
- Acento **teal** (`#0F766E` sobre `#F0FDFA`). Las temporales llevan el chip ámbar «Temporal · vence en n días».
- **v2:** en el detalle, «Editar» va en la cabecera y «Eliminar mochila» al final como enlace rojo. Quitar un documento: × con área de 44 px y etiqueta, y toast con «Deshacer». Crear y agregar documentos usan barra fija («Crear mochila con 2 documentos»).

## Compartir
- Antes de generar el enlace se ven **expiración** (1 h, 24 h, 7 d, 30 d) y **permisos** (ver siempre; descargar desactivado por defecto).
- Enlace listo: QR grande sobre blanco (incluso en modo oscuro), URL con «Copiar», chips de vencimiento y permisos, y «Revocar enlace» en rojo.
- Historial con estados por texto y color: Activo (verde), Expirado (gris), Revocado (rojo).
- **v2:** el flujo nombra sus pasos («Paso 1 de 3»: elegir → configurar → enlace listo) y no mete otras tarjetas entre la selección y «Continuar». «Ver documentos» es fijo (chip «Incluido»), no un interruptor. «Revocar enlace» va como enlace rojo separado de Compartir y Copiar.
- **v2:** en el detalle de un compartido, «Mostrar QR» es la acción primaria. El historial tiene «Nuevo» en la cabecera y el segmentado Todos / Activos / Inactivos.
- La vista pública (`/share/doc`) va sin barra lateral, con logo, «{Nombre} compartió contigo» y el chip «Enlace seguro · vence en 24 h». Sin mascota grande. **v2:** se diseña primero para móvil (quien la abre suele escanear el QR) y tiene el estado «Este enlace ya no está disponible» para enlaces vencidos o revocados, sin datos del paciente.

## Delegación (modo gestión)
- Cada dependiente tiene un **color de contexto** (selector existente `ContextColorPicker`).
- Cuando el cuidador opera como otra persona, el **banner de modo gestión** va fijo arriba en todas las pantallas: color del dependiente, avatar, «Gestionando a {nombre}» y «Volver a mi cuenta». Contraste del texto blanco verificado ≥ 4,5:1 sobre el color elegido; si no llega, se usa texto oscuro.
- Las solicitudes pendientes van con «Aceptar» (éxito) y «Rechazar» (secundario). Revocar pide confirmación roja con la consecuencia explicada.
- La mascota no aparece en el banner ni en confirmaciones de revocación.
- **v2:** en modo gestión, el header no muestra la racha ni el nivel de la cuenta propia. En «Quién gestiona mi cuenta», cada cuidador tiene «Quitar acceso» visible. «Gestionar» usa el mismo estilo para todos los dependientes, y las tarjetas de «Invitar» usan indicador de radio.
