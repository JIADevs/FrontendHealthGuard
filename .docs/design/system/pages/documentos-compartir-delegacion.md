# Override · Documentos, Mochilas, Compartir y Delegación

> Manda sobre `MASTER.md` en estos módulos, que son los de mayor sensibilidad de datos.

## Documentos
- Acento **sky** (`#0369A1` sobre `#F0F9FF`). El verde ya no identifica documentos.
- Tipo de documento: chip de tipo (Orden, Resultado, Autorización, Fórmula, Imagen, Portal) + ícono. El color del chip sigue al módulo relacionado (fórmula → ámbar, autorización → verde éxito, resultado → violeta) para escanear rápido.
- La IA se marca con un chip violeta con destello «IA» o con el aviso «La IA lo clasificó como…». Siempre se puede editar y nunca guarda sin que el usuario confirme.
- Vista previa grande con contador de páginas. Acciones fijas: Compartir, A mochila, Editar, Eliminar (esta en rojo).
- Portales de resultados: nunca pedir ni guardar contraseñas. Lo dice un hint visible.

## Mochilas
- Acento **teal** (`#0F766E` sobre `#F0FDFA`). Las temporales llevan el chip ámbar «Temporal · vence en n días».

## Compartir
- Antes de generar el enlace se ven **expiración** (1 h, 24 h, 7 d, 30 d) y **permisos** (ver siempre; descargar desactivado por defecto).
- Enlace listo: QR grande sobre blanco (incluso en modo oscuro), URL con «Copiar», chips de vencimiento y permisos, y «Revocar enlace» en rojo.
- Historial con estados por texto y color: Activo (verde), Expirado (gris), Revocado (rojo).
- La vista pública (`/share/doc`) va sin barra lateral, con logo, «{Nombre} compartió contigo» y el chip «Enlace seguro · vence en 24 h». Sin mascota grande.

## Delegación (modo gestión)
- Cada dependiente tiene un **color de contexto** (selector existente `ContextColorPicker`).
- Cuando el cuidador opera como otra persona, el **banner de modo gestión** va fijo arriba en todas las pantallas: color del dependiente, avatar, «Gestionando a {nombre}» y «Volver a mi cuenta». Contraste del texto blanco verificado ≥ 4,5:1 sobre el color elegido; si no llega, se usa texto oscuro.
- Las solicitudes pendientes van con «Aceptar» (éxito) y «Rechazar» (secundario). Revocar pide confirmación roja con la consecuencia explicada.
- La mascota no aparece en el banner ni en confirmaciones de revocación.
