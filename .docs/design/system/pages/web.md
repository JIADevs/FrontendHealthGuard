# Override · Web

> Manda sobre `MASTER.md` en toda pantalla de `apps/web` (escritorio y tablet). En formularios se suma a [`formularios.md`](./formularios.md). Origen: auditoría web v2.8, [`../../audit/web-grupo-a.md`](../../audit/web-grupo-a.md); los códigos W-xx son sus hallazgos y los números, ítems de [`../../audit/checklist-ux.md`](../../audit/checklist-ux.md).
>
> **Versión:** 2.8 · 2026-11-20.

## 1. Páginas de lista + detalle

Aplica a Citas, Documentos, Mochilas, Compartir y Tratamientos, y a toda página nueva que muestre una lista y un panel de detalle (W-02 · ítems 1, 4, 21, 25, 65).

- **«Nuevo …» va siempre como secundario** con ícono «+», en la cabecera y en todos los estados de la página: «Nueva cita», «Subir documento», «Nueva mochila», «Nuevo enlace», «Crear tratamiento».
- **La única acción primaria es la principal del detalle abierto** («Compartir», «Mostrar QR»). Las demás acciones del detalle van como secundario, fantasma o enlace. Las destructivas, como enlace rojo al final del panel (MASTER §7).
- **Sin nada seleccionado, la lista no tiene primaria:** la acción es abrir un ítem.
- **El estado vacío trae su propia primaria** («Subir documento»), porque ahí no hay lista ni detalle.
- **El ítem abierto se marca en la lista** con el estilo de tarjeta seleccionada (MASTER §7).

## 2. Modales

W-04, W-14 · ítems 11, 12, 89, 105, W1, W3.

| Qué | Regla |
|---|---|
| Ancho | 560 px (MASTER §7) |
| Alto | Máximo: alto de la ventana − 48 px (24 px de margen arriba y abajo) |
| Estructura | Encabezado fijo (ícono circular + eyebrow + título + cerrar), cuerpo con scroll y pie fijo con «Cancelar» (secundario) y la acción (primario) a la derecha (`formularios.md` §5). Si queda contenido debajo, el pie lleva un borde superior que lo indica |
| Cuándo | Modal para crear y editar (Nueva cita, Nuevo medicamento, Nuevo tratamiento, Nueva mochila, Subir y Editar documento, Configurar enlace) y para acciones rápidas. **Página propia solo para Perfil y Configuración** |
| Cerrar | Con ×, Esc o clic en el fondo. Si hay cambios sin guardar, primero «¿Descartar los cambios?» (`formularios.md` §7); sin cambios, cierra directo |
| Foco | Entra al primer campo (o al título si no hay campos), no sale del modal mientras está abierto y, al cerrar, vuelve al elemento que lo abrió |
| Errores | Al enviar con errores, el cuerpo del modal hace scroll hasta el primer campo con error y le pasa el foco (`formularios.md` §6) |

Perfil, al ser una página con formulario largo, lleva un pie fijo con «Guardar cambios», que es el equivalente web de la barra de acción inferior (W-12). Configuración guarda solo y lo avisa.

## 3. Cabecera, barra lateral y cuenta

W-05, W-06 · ítems 9, 17, 25, 41, 42, 88.

- **La cabecera es fija por página:** título (H1) y subtítulo · la acción de la página (una como máximo; en lista + detalle es secundaria, ver §1) · campana · avatar.
- **No cambia** al abrir un modal ni al seleccionar un ítem.
- **Sin racha ni nivel en la cabecera.**
  - La racha va solo en la mini tarjeta al pie de la barra lateral (MASTER §7) y en Inicio.
  - El nivel y las insignias van en Perfil.
  - Todo respeta el interruptor «Mostrar racha y nivel» de Configuración.
- **El avatar abre el menú de cuenta:** Perfil, Configuración y Cerrar sesión. Esas tres salen de la barra lateral.
- **La barra lateral solo tiene destinos de la app:** 5 o 6 en el grupo principal y el resto en un segundo grupo con título. La lista final depende de la decisión abierta sobre Misiones (CHANGELOG §3).

## 4. Anchos de pantalla

W-13 · W3.

| Ancho de la ventana | Layout |
|---|---|
| **≥ 1280 px** | Como los mockups: barra lateral de 248 px, lista y detalle lado a lado, Inicio en 3 columnas |
| **1024–1279 px** | Barra lateral igual. Inicio en 2 columnas, con las tarjetas en el orden de prioridad de MASTER §2. En lista + detalle, el detalle se abre en su propia vista (con su URL, §5) |
| **< 1024 px** | La barra lateral pasa a un botón de menú en la cabecera que abre un panel. Contenido en una columna, con la estructura de los mockups móviles |

- Las columnas usan mínimos y proporciones, no anchos fijos en píxeles. Los anchos fijos de Inicio (400 y 360 px) son los que lo hacen salirse del marco a 1024 px.
- Si dos botones no entran lado a lado con su texto completo, se apilan (MASTER §7).
- **Cambio en el código:** la barra lateral hoy se esconde a 768 px (`apps/web/src/app/globals.css:847`); pasa a 1024 px.

## 5. URL y botón atrás

W2 · ítems 36, 89.

- **Cada detalle tiene su URL**, también cuando se ve al lado de la lista. Por ejemplo, `/documents/{id}` muestra la lista con ese documento abierto a 1280 px o más, y solo el detalle por debajo de ese ancho.
- **Abrir un formulario modal agrega una entrada al historial:**
  - «Atrás» lo cierra, pasando por «¿Descartar los cambios?» si hay cambios.
  - Recargar lo vuelve a abrir.
  - La URL se puede compartir.
- La regla define el comportamiento, no la implementación. Si se hace con rutas interceptadas de Next o con un parámetro en la URL se decide en el diseño técnico. Hoy la web abre detalles y formularios en modales con estado local, sin URL propia.

## 6. Columnas en formularios

W-11 · ítem 77.

- **Una columna, igual que en móvil.** Dos campos en una fila solo si son cortos y relacionados: Fecha + Hora, Inicio + Fin, Dosis + Unidad.
- Reemplaza la regla anterior de `formularios.md` §5, que permitía dos columnas dentro del modal web.
- En páginas, el ancho de lectura máximo sigue siendo 720 px.

## 7. Mockups y pendientes

- **Hechos en v2.8.1:**
  - Inicio y Documentos a 1024 px (§4).
  - Nuevo medicamento en una laptop de 1366 × 768, con el modal en su alto máximo (§2).
  - Menú de cuenta (§3).
- **Barra lateral provisional:** Inicio, Misiones, Agenda, Documentos y Mochilas como destinos principales; Tratamientos, Compartir y Dependientes en el grupo «Más». Se revisa cuando se decida dónde va Misiones (CHANGELOG §3).

## Checklist web

- [ ] Una sola primaria por vista; en lista + detalle, «Nuevo …» es secundario.
- [ ] Modales con alto máximo, cuerpo con scroll y pie fijo; Esc y clic afuera piden confirmación si hay cambios.
- [ ] Foco dentro del modal y de vuelta al cerrar.
- [ ] Cabecera igual en todos los estados de la página; sin racha ni nivel; cuenta en el avatar.
- [ ] Sin desbordes a 1440, 1280 y 1024 px; columnas sin anchos fijos.
- [ ] Cada detalle y formulario tiene URL; «atrás» y recargar funcionan sin perder trabajo.
- [ ] Formularios en una columna, salvo pares cortos y relacionados.
