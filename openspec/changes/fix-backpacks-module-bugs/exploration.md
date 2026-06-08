# Exploration: Mochilas — inventario de bugs

**Change**: `fix-backpacks-module-bugs`  
**Scope**: mobile-first + backend API (`apps/mobile`, `packages/api`, BackendHealthGuard). Web UI deferred.  
**UI rule**: construir o extender componentes reutilizables en `apps/mobile/src/components/backpacks/`; las screens solo componen.  
**Canonical repo**: FrontendHealthGuard (this folder)

## Current State

El módulo de mochilas en mobile cubre listado, detalle, crear con documentos, agregar documentos, compartir y eliminar mochila. La lógica compartida vive en `@helu/api` (`hooks.ts`, `useBackpackDetailCore.ts`). Web tiene bugs adicionales (fuera de scope inicial).

## Bug Inventory

### In scope — mobile + shared packages

| ID | Severidad | Bug | Área |
|----|-----------|-----|------|
| B01 | P0 | No se pueden quitar documentos de una mochila (mobile) | `BackpackDetailDocumentItem`, `useBackpackDetailCore` |
| B05 | P1 | Contador en listado no se actualiza tras agregar doc | `useAddDocToBackpackMutation` — falta invalidar `["backpacks"]` |
| B06 | P1 | Crear mochila con docs no actualiza contador en listado | `useBackpackCreateWithDocs` — add directo sin invalidación |
| B07 | P1 | Docs agregados siguen visibles en picker | Query `backpack-doc-ids` no invalidada |
| B08 | P1 | Badge contador en detalle vs lista desincronizados | Dos queries distintas |
| B09 | P1 | Títulos duplicados: header nav + "Agregar a: …" | `RootNavigator` + `BackpackAddDocumentsScreen` |
| B10 | P2 | Sin búsqueda al crear mochila con documentos | `docSearch` no conectado en `BackpackEditScreen` |
| B11 | P2 | Detalle muestra máx. 20 documentos | `useBackpackDocumentsQuery` limit 20, sin paginación |
| B12 | P2 | Agregar docs: catálogo limitado a 20 | `BackpackAddDocumentsScreen` |
| B13 | P2 | Tamaño total incorrecto si >20 docs | `sumDocumentsBytes` sobre primera página |

### Deferred — web

| ID | Bug | Notas |
|----|-----|-------|
| B02 | Web detalle no muestra documentos | Reutilizar `useBackpackDocumentsQuery` + fix schema cuando se retome web |
| B14 | Web modal agregar limitado a 100 | [web-deferred] |
| B18 | AddDocsModal mutation ad-hoc | [web-deferred] |

### In scope — backend API

| ID | Severidad | Bug | Área |
|----|-----------|-----|------|
| B15 | P2 | Re-agregar doc silencioso (200 no-op) | `backpacks.py`, `crud_backpack.add_document` |
| B16 | P2 | PUT backpack sin `document_count` | `backpacks.update_backpack` |

### Deferred — share público

| ID | Bug | Repo |
|----|-----|------|
| B03 | URL `/share/backpack` sin página | web + backend |
| B04 | Sin endpoint consume token mochila | BackendHealthGuard |

## Affected Areas (mobile-first)

- `packages/api/src/hooks.ts` — invalidación mutations (B05–B07)
- `packages/api/src/useBackpackDetailCore.ts` — remove ya existe; conectar UI (B01)
- `apps/mobile/src/screens/BackpackDetailScreen.tsx`
- `apps/mobile/src/screens/BackpackAddDocumentsScreen.tsx`
- `apps/mobile/src/screens/BackpackEditScreen.tsx`
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/components/backpacks/BackpackDetailDocumentItem.tsx`
- `apps/mobile/src/hooks/useBackpackCreateWithDocs.ts`
- `BackendHealthGuard/app/api/api_v1/endpoints/backpacks.py` — B15, B16
- `BackendHealthGuard/app/crud/crud_backpack.py` — B15
- `BackendHealthGuard/tests/api/test_backpacks.py`

## Modular / reusable strategy

### Capas

| Capa | Ubicación | Responsabilidad |
|------|-----------|-----------------|
| Datos / mutations | `packages/api` | hooks, `*Core`, invalidación de cache |
| Componentes del módulo | `apps/mobile/src/components/backpacks/` | UI reutilizable del dominio mochilas |
| Primitivos cross-feature | `packages/ui` | Button, Modal, Typography — no lógica de mochilas |
| Screens | `apps/mobile/src/screens/Backpack*.tsx` | navegación, queries, composición — **sin UI inline nueva** |

### Reglas para este change

1. **packages/api first** — centralizar invalidaciones en `useAddDocToBackpackMutation`, `useRemoveDocFromBackpackMutation`, y helper post-create-with-docs.
2. **Componentes de módulo** — cada fix de UI debe vivir en `components/backpacks/` (nuevo componente o extensión de uno existente) y exportarse por `index.ts`. Ejemplos esperados:
   - B01 → acción "quitar" en `BackpackDetailDocumentItem` (prop `onRemove`) o subcomponente `BackpackDocumentRemoveAction`
   - B09 → header unificado en `BackpackAddDocumentsHeader` (solo subtítulo contextual; título en navigator)
   - B11–B12 → `BackpackDocumentPickerList` / paginación reutilizable entre agregar y crear mochila
3. **useBackpackDetailCore** — `removeDocument` ya es cross-platform; el componente expone la acción, la screen pasa el callback.
4. **Paginación** — hook compartido en `packages/api` o hook local del módulo; lista en componente reutilizable.
5. **Web después** — los mismos hooks + contratos de props de componentes de módulo documentan el camino; implementación web [web-deferred].
6. **No tocar apps/web** hasta slice explícito.

## Approaches

1. **Slice A (MVP mobile)** — B01, B05, B07, B09  
   Effort: Low

2. **Slice B (mobile polish)** — B06, B08, B10, B11–B13  
   Effort: Medium

3. **Slice C (web + share)** — B02–B04  
   Effort: Medium–High, change `backpack-public-share`

## Recommendation

Implementar **Slice A + B + backend B15/B16** en este change. Backend primero (contrato), luego `packages/api`, luego `components/backpacks/`. Dejar share público (B03–B04) como change aparte.

## Risks

- Sin tests frontend; verificación manual + pytest backend si se toca API.
- Paginación requiere decisión UX (load more vs infinite scroll).

## Ready for Proposal

**Yes** — `/sdd-propose fix-backpacks-module-bugs` con scope mobile-first documentado.
