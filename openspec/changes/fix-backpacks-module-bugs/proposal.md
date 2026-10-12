# Proposal: Corregir módulo Mochilas (mobile + API)

## Intent

El módulo de mochilas en mobile tiene bugs de UX, cache y paginación que impiden agregar/quitar documentos de forma confiable y ver contadores correctos. El backend tiene inconsistencias de contrato (add duplicado silencioso, update sin `document_count`) que agravan el comportamiento del cliente. Corregir ambos lados con lógica compartida en `packages/api` y componentes reutilizables en `components/backpacks/`.

## Scope

### In Scope

**Shared (`packages/api`)**
- Invalidación unificada de cache: `backpacks`, `backpack`, `backpack-docs`, `backpack-doc-ids` en add/remove/create-with-docs
- Paginación reutilizable para documentos de mochila y picker de catálogo

**Mobile (`apps/mobile`)**
- B01: quitar documento de mochila (UI en componentes del módulo + `useBackpackDetailCore`)
- B05–B09: contadores stale, picker stale, títulos duplicados
- B10–B13: búsqueda al crear, paginación detalle/picker, bytes totales correctos
- Componentes nuevos/extendidos en `components/backpacks/` (`BackpackAddDocumentsHeader`, `BackpackDocumentPickerList`, acción remove en `BackpackDetailDocumentItem`)

**Backend (`BackendHealthGuard`)**
- B15: `POST …/documents` MUST fallar con 409 si el documento ya está en la mochila (no no-op silencioso)
- B16: `PUT /backpacks/{id}` MUST devolver `document_count` como `GET` y listado
- Tests pytest en `tests/api/test_backpacks.py`

### Out of Scope

- Web UI (`apps/web`): B02, B14, B18 — [web-deferred]
- Share público mochila: B03, B04 — change `backpack-public-share`
- Eliminar archivos duplicados `* 2.ts` — deuda técnica aparte

## Capabilities

### New Capabilities

- `mobile/backpacks`: flujos mobile de listado, detalle, agregar/quitar docs, crear con docs; componentes de módulo reutilizables
- `shared-api/backpacks`: hooks, invalidación cache, paginación compartida
- `api/backpacks`: contrato REST add/update/list con `document_count` consistente y errores explícitos

### Modified Capabilities

- None (no hay specs baseline en `openspec/specs/` aún)

## Approach

1. **Backend primero** — B15/B16 + tests; desbloquea contrato claro para el cliente.
2. **`packages/api`** — helper `invalidateBackpackQueries`, extender mutations, hook paginación.
3. **`components/backpacks/`** — UI modular; screens solo componen.
4. **Entrega en 2 PRs encadenados** si supera ~400 líneas: (1) backend + packages/api, (2) mobile components/screens.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `BackendHealthGuard/app/api/.../backpacks.py` | Modified | 409 on duplicate add; enrich PUT response |
| `BackendHealthGuard/app/crud/crud_backpack.py` | Modified | detect duplicate link; count helper |
| `BackendHealthGuard/tests/api/test_backpacks.py` | Modified | casos 409 + document_count on PUT |
| `packages/api/src/hooks.ts` | Modified | invalidación centralizada |
| `packages/api/src/useBackpackDetailCore.ts` | Modified | alinear con invalidaciones |
| `apps/mobile/src/components/backpacks/*` | Modified/New | picker, header, remove action |
| `apps/mobile/src/screens/Backpack*.tsx` | Modified | wiring only |
| `apps/mobile/src/navigation/RootNavigator.tsx` | Modified | título único B09 |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| 409 rompe cliente que asumía 200 | Med | manejar 409 en mutation con toast claro |
| Paginación UX | Med | "Cargar más" en componente compartido |
| Dual-repo drift | Low | mismo change-name; specs api en backend |

## Rollback Plan

Revertir PRs en orden inverso. Backend: revert commits en `backpacks.py`/`crud_backpack.py`. Frontend: revert hooks + components. Sin migraciones DB.

## Dependencies

- Backend API corriendo para pytest (`docker exec helu_api pytest …`)
- Ninguna migración Alembic requerida

## Success Criteria

- [ ] Mobile: quitar doc, contadores actualizados sin pull-to-refresh manual
- [ ] Mobile: un solo título en agregar docs; picker paginado
- [ ] API: duplicate add → 409; PUT devuelve `document_count` correcto
- [ ] `pytest tests/api/test_backpacks.py` verde
- [ ] `tsc --noEmit -p apps/mobile` sin errores
