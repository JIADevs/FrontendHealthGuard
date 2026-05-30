# Design: Corregir módulo Mochilas (mobile + API)

## Technical Approach

Implementar en 2 PRs encadenados: **(1) backend + `packages/api`**, **(2) componentes mobile + wiring**. Backend fija contrato (409, `document_count`). Cliente centraliza invalidación y paginación con `useInfiniteQuery` (patrón `useNotificationsScreen`). UI nueva solo en `components/backpacks/`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Cache invalidation | `invalidateBackpackQueries(qc, backpackId)` en `packages/api` | Invalidar ad-hoc por mutation | Una fuente; cubre `backpacks`, `backpack`, `backpack-docs`, `backpack-doc-ids` |
| Pagination | `useInfiniteQuery` hooks en `packages/api` | Manual page state en screens | Ya usado en notificaciones; reutilizable por web |
| Duplicate add | API 409 + toast en mutation | Optimistic skip client-side | Servidor es source of truth |
| Add screen title | Nav title only; in-content subtitle | Quitar nav title | Patrón RN estándar; evita duplicado B09 |
| Remove UI | `BackpackDetailDocumentItem` + `Alert` en screen | Swipe inline sin confirm | Consistente con delete mochila |
| Detail bytes/count | Flatten infinite pages + `documentCount` del query `backpack` | Solo primera página | Cumple spec B08/B13 |
| Remove mutation | `useBackpackDetailCore` → `useRemoveDocFromBackpackMutation` | Mutation duplicada en core | DRY + invalidación unificada |

## Data Flow

```
[Mobile Screen]
     │
     ├─ useInfiniteBackpackDocuments ──→ GET /backpacks/{id}/documents?page=
     ├─ useAddDocToBackpackMutation ──→ POST …/documents ──→ invalidateBackpackQueries
     └─ useBackpackDetail.removeDocument ──→ DELETE …/documents/{docId} ──→ invalidate

invalidateBackpackQueries
     ├─ ["backpacks"]
     ├─ ["backpack", id]
     ├─ ["backpack-docs", id]  (prefix)
     └─ ["backpack-doc-ids", id]
```

## File Changes

### BackendHealthGuard

| File | Action | Description |
|------|--------|-------------|
| `app/crud/crud_backpack.py` | Modify | `document_linked()` check; `add_document` raise/signal duplicate |
| `app/api/api_v1/endpoints/backpacks.py` | Modify | 409 on duplicate; `_attach_document_count()` en PUT/GET |
| `tests/api/test_backpacks.py` | Modify | `test_add_duplicate_document_conflict`, `test_update_backpack_document_count` |

### packages/api

| File | Action | Description |
|------|--------|-------------|
| `src/backpackQueryUtils.ts` | Create | `invalidateBackpackQueries`, `QK.backpackDocIds` |
| `src/hooks.ts` | Modify | Mutations usan helper; export infinite hooks |
| `src/useBackpackInfiniteDocuments.ts` | Create | `useInfiniteBackpackDocuments`, `useInfiniteDocumentsCatalog` |
| `src/useBackpackDetailCore.ts` | Modify | Usar `useRemoveDocFromBackpackMutation`; invalidación helper |

### apps/mobile/components/backpacks

| File | Action | Description |
|------|--------|-------------|
| `BackpackDocumentPickerList.tsx` | Create | Lista + load more + add toggle; usado en add y create |
| `BackpackAddDocumentsHeader.tsx` | Create | Subtítulo contextual (nombre mochila) + SearchField |
| `BackpackDetailDocumentItem.tsx` | Modify | Props `onRemove`, `removing`, swipe o botón quitar |
| `BackpackDetailContentSection.tsx` | Modify | Load more footer; pasa remove props |
| `BackpackCreateDocumentPicker.tsx` | Modify | Delega a `BackpackDocumentPickerList` + search |
| `index.ts` | Modify | Export nuevos componentes |

### apps/mobile/screens + nav

| File | Action | Description |
|------|--------|-------------|
| `BackpackAddDocumentsScreen.tsx` | Modify | Header component; infinite catalog; quitar h3 duplicado |
| `BackpackDetailScreen.tsx` | Modify | Infinite docs; confirm remove; wire `removeDocument` |
| `BackpackEditScreen.tsx` | Modify | Conectar `docSearch` al picker |
| `useBackpackCreateWithDocs.ts` | Modify | Tras links, llamar `invalidateBackpackQueries` |
| `RootNavigator.tsx` | Modify | Sin cambio de title (mantener "Agregar documentos") |

## Interfaces / Contracts

```typescript
// packages/api/src/backpackQueryUtils.ts
export function invalidateBackpackQueries(qc: QueryClient, backpackId: string): void;

// QK extension
backpackDocIds: (id: string) => ["backpack-doc-ids", id] as const;
```

```python
# backpacks.py — duplicate response
raise HTTPException(status_code=409, detail="Document already in backpack")
```

```typescript
// BackpackDetailDocumentItem
onRemove?: (doc: Document) => void;
isRemoving?: boolean;
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| API | 409 duplicate, PUT count | pytest `test_backpacks.py` |
| Shared | invalidate keys | Manual / future unit if vitest added |
| Mobile | flows add/remove/count | Manual QA checklist from specs |
| E2E | — | Out of scope |

## Migration / Rollout

No migration required. Deploy backend before or with PR1 client.

## PR Slices (feature-branch-chain)

**Tracker**: `feature/fix-backpacks-module-bugs` (desde `dev`) en cada repo. Solo el tracker mergea a `dev` al cerrar el change.

| PR | Head | Base | Repo |
|----|------|------|------|
| PR-B | `fix/backpacks-api-contract` | tracker | BackendHealthGuard |
| PR-F1 | `fix/backpacks-shared-api` | tracker | FrontendHealthGuard |
| PR-F2 | `fix/backpacks-mobile-ui` | `fix/backpacks-shared-api` | FrontendHealthGuard |

## Open Questions

- [ ] None blocking — load-more UX: botón "Cargar más" al final de lista (mismo patrón que notificaciones)

## Web reuse (deferred)

Web consumirá `invalidateBackpackQueries`, infinite hooks y contratos de props de `BackpackDocumentPickerList` cuando se retome B02.
