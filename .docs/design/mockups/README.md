# Mockups HTML — rediseño B

Lienzo con todas las pantallas de Helu en móvil (390 × 844) y web (1440 × 900), armado en HTML para poder iterar sin depender de Figma y luego capturarlo.

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

## Ver

```bash
python -m http.server 5180 --directory .docs/design
```

- Todo: `http://localhost:5180/mockups/index.html`
- Un módulo o varios: `?m=misiones` · `?m=agenda,docs` (ids: `acceso`, `inicio`, `agenda`, `misiones`, `docs`, `mochilas`, `compartir`, `dependientes`, `cuenta`, `estados`)

## Agregar o cambiar una pantalla

```js
const X = mod('id', 'N · Título', 'Descripción del módulo');
X.m('Nombre móvil', phone(`${mback('Título')}${card('…')}`, { tab: 'agenda' }), 'Nota opcional');
X.w('Nombre web', web({ sel: 'agenda', title: 'Agenda', sub: '…' }, `…`));
```

Reglas: usar las clases y helpers del kit (no colores sueltos), seguir [`../system/MASTER.md`](../system/MASTER.md) y los `pages/` del módulo. Datos de ejemplo: Alejandra Gómez (paciente), Carlos (cuidador), Juan Pérez (dependiente).

## Capturar a Figma

El HTML ya incluye el script de captura de Figma. Con el servidor corriendo, se pide un ID de captura (herramienta `generate_figma_design` del MCP de Figma, que **no** consume el cupo mensual) y se abre `index.html#figmacapture=<id>&…&figmaselector=%23canvas` en un navegador visible. La captura llega como capas sueltas al archivo [Helu App · Rediseño B](https://www.figma.com/design/x05iScnfPkk0r7fiKVfk2n). Para no superar el límite de páginas del plan Starter, se captura sobre la página existente (`nodeId: 0:1`) y luego se borra la versión anterior.

La celebración de misión se anima en el HTML; en Figma queda estática.
