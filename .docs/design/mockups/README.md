# Mockups HTML — rediseño B · v2

> Versión vigente, con los cambios de la auditoría UX del 2026-11-18 y de la auditoría web (v2.8). Las pantallas cambiadas o nuevas llevan una nota que empieza por «v2 ·» o «v2.8 ·». Detalle en [`../CHANGELOG.md`](../CHANGELOG.md).

Lienzo con todas las pantallas de Helu en móvil (390 × 844) y web (1440 × 900), armado en HTML para poder iterar sin depender de Figma y luego capturarlo.

## Zoom del lienzo

El lienzo es muy grande. Para verlo entero, usa los botones **Zoom 25 % · 40 % · 60 % · 100 %** de la esquina superior derecha, o agrega `&z=0.4` a la URL. **No uses el zoom del navegador (Cmd −):** el navegador no baja la letra de su tamaño mínimo y los textos chicos (por ejemplo, las etiquetas de la barra de pestañas, de 11 px) quedan desproporcionados y se enciman. El zoom del lienzo achica todo por igual. No se activa durante la captura a Figma.

## Estructura

| Archivo | Contenido |
|---|---|
| `index.html` | Lienzo. Carga `../system/tokens.css`, el kit y los módulos |
| `kit.css` | Estilos de las piezas (tarjetas, botones, chips, campos, teléfono, web, hojas, modales). Los colores salen de los tokens |
| `kit.js` | Helpers para armar pantallas (`phone`, `web`, `card`, `row`, `field`, `chip`, `btn`, `mas`, `ring`…) y el registro de módulos (`mod`) |
| `m1-acceso-inicio.js` | 1 · Acceso · 2 · Inicio |
| `m2-agenda.js` | 3 · Agenda, citas, medicamentos y tareas |
| `m3-misiones.js` | 4 · Misiones (pasos del PRD) y tratamientos |
| `m4-documentos.js` | 5 · Documentos |
| `m5-mochilas-compartir.js` | 6 · Mochilas · 7 · Compartir |
| `m6-cuenta.js` | 8 · Dependientes · 9 · Cuenta |
| `m7-estados.js` | 10 · Estados vacíos, validación, confirmaciones y errores |
| `m8-carga.js` | 11 · Estados de carga: esqueletos generados desde las pantallas reales (`skel()`), con las clases `.skel`, `.skt` y `.skb` de `kit.css` |
| `m9-vacios.js` | 12 · Estados vacíos (propuesta): primer uso, ejemplos, plantillas, «sin resultados» útil y «todo al día». Viene de la v1 sin adaptar; pendiente unificarlo con los vacíos del módulo 10 |
| `m10-selectores.js` | 13 · Selectores de formulario (propuesta v2.32): alternativas de tipo y subtipo del documento y de especialidad y profesional de la cita, con las elegidas marcadas |
| `m11-deslizar.js` | 14 · Acciones al deslizar (propuesta, #127): las tarjetas de lista dejan el «⋮»; tres estilos de botones al deslizar, las hojas «Más» de cada tarjeta y cómo se descubre el gesto |

## Ver

```bash
python3 -m http.server 5180 --directory .docs/design
```

- Todo: `http://localhost:5180/mockups/index.html`
- Un módulo o varios: `?m=misiones` · `?m=agenda,docs` (ids: `acceso`, `inicio`, `agenda`, `misiones`, `docs`, `mochilas`, `compartir`, `dependientes`, `cuenta`, `estados`, `carga`, `vacios`, `selectores`, `deslizar`)

## Agregar o cambiar una pantalla

```js
const X = mod('id', 'N · Título', 'Descripción del módulo');
X.m('Nombre móvil', phone(`${mback('Título')}${card('…')}`, { tab: 'agenda' }), 'Nota opcional');
X.w('Nombre web', web({ sel: 'agenda', title: 'Agenda', sub: '…' }, `…`));
```

Helpers nuevos en v2: `radio(on)`, `moreRow(t,s)`, `xbtn()`, `kebab(label)`, `redLink(t,icon)`, `toast(t,tone,icon,acción)` y la opción `bar` de `phone()` para la barra de acción fija.

Helpers web de v2.8 ([`../system/pages/web.md`](../system/pages/web.md)):

- `web()` acepta `act` (la acción de la página, entre el título y la campana) y `cls`. La cabecera ya no muestra racha ni nivel.
- `wnew(t)`: «Nuevo …» como secundario con «+».
- `mfoot(cancelar, acción)`: pie fijo del modal. `msec(título, campos)`: sección de formulario dentro del modal.
- `amenu()`: menú de cuenta del avatar.
- `wvariant(módulo, pantalla, 'w1024' | 'laptop')`: la misma pantalla a 1024 px o en una laptop de 1366 × 768.
- Clases `.sel` (tarjeta abierta en lista + detalle), `.mhd` (encabezado fijo del modal) y `.wfoot` (pie fijo de página).

Reglas: usar las clases y helpers del kit (no colores sueltos), seguir [`../system/MASTER.md`](../system/MASTER.md) y los `pages/` del módulo. Datos de ejemplo: Alejandra Gómez (paciente), Carlos (cuidador), Juan Pérez (dependiente).

## Capturar a Figma

El HTML ya incluye el script de captura de Figma. Con el servidor corriendo, se pide un ID de captura (herramienta `generate_figma_design` del MCP de Figma, que **no** consume el cupo mensual) y se abre `index.html#figmacapture=<id>&…&figmaselector=%23canvas` en un navegador visible. La captura llega como capas sueltas al archivo [Helu App · Rediseño B](https://www.figma.com/design/x05iScnfPkk0r7fiKVfk2n). Para no superar el límite de páginas del plan Starter, se captura sobre la página existente (`nodeId: 0:1`) y luego se borra la versión anterior.

La celebración de misión se anima en el HTML; en Figma queda estática.
