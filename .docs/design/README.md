# Diseño — Helu

Sistema de diseño y mockups del **rediseño B («Equilibrada»)**, **versión 2**. Es el **estado objetivo** de la interfaz: el código todavía no lo implementa por completo.

- **Origen de la v2:** auditoría UX del 2026-11-18 sobre las pantallas móviles y auditoría web de la v2.8.
- **Qué cambió y por qué:** [`CHANGELOG.md`](./CHANGELOG.md).
- **Decisión de adoptarlo y lo que falta en el código:** [ADR 0002](../architecture/adr/0002-adopt-design-system-b.md).
- **Cómo está hoy el código:** [architecture/design-system.md](../architecture/design-system.md).

La v1 (2026-11-17) se reemplazó por esta versión el 2026-11-20 y queda en el historial de git (último commit: `a79a55b`).

## Contenido

| Carpeta / archivo | Qué es | Para qué se usa |
|---|---|---|
| [`system/MASTER.md`](./system/MASTER.md) | Sistema de diseño global: personas, principios, estilo, color, tipografía, espacio, componentes, motivación, mascota, movimiento, voz y accesibilidad | Fuente de verdad visual. Se lee antes de diseñar o construir UI |
| [`system/pages/`](./system/pages/) | Reglas que mandan sobre MASTER: [misiones](./system/pages/misiones.md), [inicio y agenda](./system/pages/inicio-agenda.md), [documentos, compartir y delegación](./system/pages/documentos-compartir-delegacion.md), [formularios](./system/pages/formularios.md), [movimiento e interacciones](./system/pages/movimiento-interacciones.md) y [web](./system/pages/web.md) | Reglas específicas de cada módulo y de la web |
| [`system/componentes.md`](./system/componentes.md) | Catálogo de componentes: si existe o es nuevo, capa de `@helu/ui`, props, prioridad y orden de construcción (más la sección «v2») | Plan de implementación |
| [`system/tokens.json`](./system/tokens.json) · [`tokens.css`](./system/tokens.css) · [`build-tokens.py`](./system/build-tokens.py) | Tokens en tres capas (primitivos → semánticos → componente), claro y oscuro | Valores exactos |
| [`system/movimiento.html`](./system/movimiento.html) | Vista previa interactiva del movimiento, con las reglas de v2.5 y los estados de carga | Ver y probar el movimiento |
| [`system/preview.html`](./system/preview.html) · [`formularios.html`](./system/formularios.html) | Vistas previas del sistema y de los formularios | **Sin actualizar:** todavía muestran tamaños de v1 (botón `sm`, chips, botones de ícono) |
| [`mockups/`](./mockups/README.md) | Lienzo HTML con unas 170 pantallas: 112 móviles y 61 web (estados y esqueletos incluidos) | Referencia de pantallas; se captura a Figma |
| [`audit/`](./audit/) | [Índice del checklist UX](./audit/checklist-ux.md) (132 ítems + 7 de escritorio) e [informe de la auditoría web](./audit/web-grupo-a.md) | Auditar pantallas con la misma numeración |
| [`CHANGELOG.md`](./CHANGELOG.md) | Cada cambio de la v2, con la pantalla y el ítem que lo motivó, y las decisiones pendientes | Saber por qué algo es como es |
| [`archive/`](./archive/) | Prototipo gamificado descartado (estilo tipo Duolingo) y scripts de Figma no usados | Solo histórico |

## Cómo verlo

Las páginas cargan `tokens.css` y scripts locales, así que hay que servirlas por HTTP (no abrirlas como `file://`):

```bash
python3 -m http.server 5180 --directory .docs/design
```

- Sistema: `http://localhost:5180/system/preview.html`
- Formularios: `http://localhost:5180/system/formularios.html`
- Movimiento: `http://localhost:5180/system/movimiento.html`
- Mockups: `http://localhost:5180/mockups/index.html`. Para ver un módulo, `?m=agenda`; para ver todo achicado, `&z=0.4`. Usar el zoom del lienzo y no el del navegador (ver [`mockups/README.md`](./mockups/README.md)).
- Las notas grises bajo cada pantalla que empiezan por «v2 ·» o «v2.8 ·» explican qué cambió.

## Figma

- Archivo: [Helu App · Rediseño B](https://www.figma.com/design/x05iScnfPkk0r7fiKVfk2n?node-id=24-2). Es una captura del lienzo de `mockups/` en capas sueltas, sin componentes. **Puede estar atrasada** respecto del lienzo; se vuelve a capturar con el proceso de [`mockups/README.md`](./mockups/README.md#capturar-a-figma).
- Tablero de exploración inicial (propuestas A, B y el estilo gamificado): [Helu App (FigJam)](https://www.figma.com/board/1ZttVpJvPTaLJiHlhikmAm/Helu-App).

## Reglas de mantenimiento

1. **Cambiar el sistema:** editar `system/MASTER.md` o el `pages/*.md` que corresponda y anotar el cambio en el `CHANGELOG.md`.
2. **Cambiar un valor:** editar `build-tokens.py` y regenerar `tokens.json` (`python3 build-tokens.py`) y `tokens.css`.
   - No editar los generados a mano.
   - Excepción mientras el generador `generate-tokens.cjs` no esté en el equipo: las líneas de `tokens.css` que se editen a mano se anotan en el CHANGELOG.
3. **Cambiar pantallas:** editar `mockups/` (el kit usa `../system/tokens.css`), subir el parámetro de caché `?v=` de `mockups/index.html` y volver a capturar a Figma.
4. **Cuando el código implemente una parte:** actualizar [architecture/design-system.md](../architecture/design-system.md) (estado actual) y la tabla de diferencias del ADR 0002.
5. **Producto manda:** si una regla de diseño contradice un PRD de `BackendHealthGuard/.docs/features/`, gana el PRD y se corrige aquí.
