# Diseño — Helu · v2 (propuesta)

Versión 2 del sistema de diseño y los mockups del **rediseño B («Equilibrada»)**, con los cambios de la **auditoría UX del 2026-11-18** (132 ítems sobre las 49 pantallas móviles principales y los estados globales). Es una **propuesta**: la versión vigente sigue en [`../design/`](../design/README.md), que no se tocó. Qué cambió y por qué: [`CHANGELOG.md`](./CHANGELOG.md).

Cuando el equipo la apruebe, se reemplaza `../design/` por esta carpeta (o se fusionan) y se actualiza el ADR 0002.

## Contenido

| Carpeta / archivo | Qué es | Estado en v2 |
|---|---|---|
| [`CHANGELOG.md`](./CHANGELOG.md) | Cada cambio, la pantalla y el ítem de la auditoría que lo motivó, y las decisiones pendientes | Nuevo |
| [`system/MASTER.md`](./system/MASTER.md) | Sistema de diseño global | Actualizado (v2.0) |
| [`system/pages/`](./system/pages/) | Reglas por módulo que mandan sobre MASTER | Actualizadas: inicio y agenda, formularios, documentos y compartir, misiones, movimiento |
| [`system/componentes.md`](./system/componentes.md) | Catálogo de componentes | Actualizado + sección «v2» al final |
| [`system/tokens.json`](./system/tokens.json) · [`tokens.css`](./system/tokens.css) · [`build-tokens.py`](./system/build-tokens.py) | Tokens en tres capas, claro y oscuro | v2.1: `button.height-sm` 36 → 44 px; nuevos `chip.height-option` e `icon-button.size` (44 px). `tokens.json` regenerado con `build-tokens.py`; en `tokens.css` se editaron a mano esas 3 líneas porque el generador (`generate-tokens.cjs` de la skill design-system) no está en este equipo |
| [`system/preview.html`](./system/preview.html) · [`formularios.html`](./system/formularios.html) · [`movimiento.html`](./system/movimiento.html) | Vistas previas interactivas | **Sin actualizar:** todavía muestran tamaños de v1 (botón `sm`, chips, botones de ícono) |
| [`mockups/`](./mockups/README.md) | Lienzo HTML con todas las pantallas en móvil y web | Actualizado: kit + los 7 módulos; 19 pantallas móviles nuevas |

El prototipo descartado (`archive/`) no se copió: sigue en `../design/archive/`.

## Cómo verla

```bash
python3 -m http.server 5181 --directory .docs/design-v2
```

- Mockups: `http://localhost:5181/mockups/index.html` (o `?m=agenda` para un módulo).
- Las notas grises bajo cada pantalla que empiezan por **«v2 ·»** explican qué cambió.
- Para comparar con la versión vigente, servir `.docs/design` en el puerto 5180 y abrir las dos lado a lado.

## Reglas de mantenimiento

Las mismas de [`../design/README.md`](../design/README.md#reglas-de-mantenimiento). Mientras la v2 sea una propuesta, los cambios de diseño nuevos se hacen aquí y se anotan en el CHANGELOG.
