# Diseño — Helu

Sistema de diseño y mockups del **rediseño B («Equilibrada»)**. Es el **estado objetivo** de la interfaz: el código todavía no lo implementa por completo. La decisión de adoptarlo y lo que falta para llegar están en el [ADR 0002](../architecture/adr/0002-adopt-design-system-b.md). Cómo está hoy el código: [architecture/design-system.md](../architecture/design-system.md).

## Contenido

| Carpeta / archivo | Qué es | Para qué se usa |
|---|---|---|
| [`system/MASTER.md`](./system/MASTER.md) | Sistema de diseño global: personas, principios, estilo, color, tipografía, espacio, componentes, motivación, mascota, movimiento, voz y accesibilidad | Fuente de verdad visual. Se lee antes de diseñar o construir UI |
| [`system/pages/`](./system/pages/) | Reglas por módulo que mandan sobre MASTER: [misiones](./system/pages/misiones.md), [inicio y agenda](./system/pages/inicio-agenda.md), [documentos, compartir y delegación](./system/pages/documentos-compartir-delegacion.md), [formularios](./system/pages/formularios.md), [movimiento e interacciones](./system/pages/movimiento-interacciones.md) | Reglas específicas de cada pantalla |
| [`system/componentes.md`](./system/componentes.md) | Catálogo de 62 componentes: existe o nuevo, capa de `@helu/ui`, props, prioridad y orden de construcción | Plan de implementación |
| [`system/tokens.json`](./system/tokens.json) · [`tokens.css`](./system/tokens.css) | Tokens en tres capas (primitivos → semánticos → componente), claro y oscuro | Valores exactos. Se regeneran con [`build-tokens.py`](./system/build-tokens.py) |
| [`system/preview.html`](./system/preview.html) · [`formularios.html`](./system/formularios.html) · [`movimiento.html`](./system/movimiento.html) | Vistas previas interactivas del sistema, de los formularios y del movimiento | Ver y probar el sistema |
| [`mockups/`](./mockups/README.md) | Lienzo HTML con las ~120 pantallas de la app en móvil y web | Referencia de pantallas; se captura a Figma |
| [`archive/`](./archive/) | Prototipo gamificado anterior (estilo tipo Duolingo, descartado) y scripts de Figma no usados | Solo histórico |

## Cómo ver las vistas previas

Las páginas cargan `tokens.css` y scripts locales, así que hay que servirlas por HTTP (no abrirlas como `file://`):

```bash
python -m http.server 5180 --directory .docs/design
```

Luego abrir:
- Sistema: `http://localhost:5180/system/preview.html`
- Formularios: `http://localhost:5180/system/formularios.html`
- Movimiento: `http://localhost:5180/system/movimiento.html`
- Mockups: `http://localhost:5180/mockups/index.html` (o `?m=misiones` para ver un módulo)

## Figma

- Archivo: [Helu App · Rediseño B](https://www.figma.com/design/x05iScnfPkk0r7fiKVfk2n?node-id=24-2) (versión vigente: marco 24:2). Es una captura del lienzo de `mockups/` en capas sueltas, sin componentes.
- Tablero de exploración inicial (propuestas A, B y el estilo gamificado): [Helu App (FigJam)](https://www.figma.com/board/1ZttVpJvPTaLJiHlhikmAm/Helu-App).

## Reglas de mantenimiento

1. **Cambiar el sistema:** editar `system/MASTER.md` o el `pages/*.md` que corresponda. Si cambia un valor, editar `build-tokens.py` y regenerar `tokens.json` y `tokens.css`. No editar los generados a mano.
2. **Cambiar pantallas:** editar `mockups/` (el kit usa `../system/tokens.css`) y volver a capturar a Figma.
3. **Cuando el código implemente una parte:** actualizar [architecture/design-system.md](../architecture/design-system.md) (estado actual) y la tabla de diferencias del ADR 0002.
4. **Producto manda:** si una regla de diseño contradice un PRD de `BackendHealthGuard/.docs/features/`, gana el PRD y se corrige aquí.
