# Tasks: Refactor módulo Compartir (mobile + API)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 900–1200 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR-B → PR-F1 → PR-F2 |
| Delivery strategy | ask-on-risk |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Feature branch chain

**Tracker branch** (ambos repos): `feature/refactor-share-module` ← desde `dev`  
**Integración final**: tracker → `dev`

| Unit | PR | Head branch | Base (PR target) | Tras merge |
|------|-----|-------------|------------------|------------|
| B | PR-B | `refactor/shares-api` | `feature/refactor-share-module` | → tracker (backend) |
| F1 | PR-F1 | `refactor/shares-shared-api` | `feature/refactor-share-module` | → tracker (frontend) |
| F2 | PR-F2 | `refactor/shares-mobile-ui` | `refactor/shares-shared-api` | → tracker (frontend) |

**Orden**: PR-B → PR-F1 → PR-F2 → QA en tracker → tracker → `dev`.

---

## Phase 1: Backend [PR-B]

> Implementado en `BackendHealthGuard/openspec/changes/refactor-share-module/` — ver `apply-progress.md` allí.

- [x] 1.1 Alembic: `view_count`, `last_viewed_at` en `document_share_links` y `backpack_share_links`
- [x] 1.2 `schemas/share.py`: `ShareLinkOut`, `ShareCreateOptions`, `ShareStatusFilter`
- [x] 1.3 `crud/crud_share.py`: list unified, revoke, extend, increment views
- [x] 1.4 `endpoints/shares.py`: GET `/shares`, DELETE `/shares/{id}`, POST `/shares/{id}/extend`
- [x] 1.5 `documents.py` / `backpacks.py`: accept `expires_in` on POST share; track views on consume
- [x] 1.6 Signed URL: `Content-Disposition: inline`; document policy `can_download=false`
- [x] 1.7 `tests/api/test_shares.py`: list both types, filters, revoke backpack, extend, view-only
- [x] 1.8 Register router; pytest green

---

## Phase 2: Shared API [PR-F1]

- [x] 2.1 Create `packages/api/src/shares/schemas.ts`
- [x] 2.2 Create `packages/api/src/shares/endpoints.ts`
- [x] 2.3 Create `packages/api/src/shares/hooks.ts` + `QK.shares`
- [x] 2.4 Update share document/backpack mutations with `expiresIn`
- [x] 2.5 Deprecate/wrap `getActiveDocumentShares` → unified list
- [x] 2.6 Export from `packages/api`; `tsc -p packages/api`

---

## Phase 3: Mobile components [PR-F2]

- [x] 3.1 `ShareResourceSummaryCard`, `ShareExpirationPicker`, `SharePermissionsSection`
- [x] 3.2 `ShareQrPanel` (QR, URL, copiar, enviar)
- [x] 3.3 `SharedHistoryListItem` (icono tipo, título recurso `variant="body"`, badge estado, tiempo desde creación)
- [x] 3.4 `SharedHistoryFilters`, `SharedActivityCards`, `SharedDetailActions`
- [x] 3.5 `useShareFlow.ts`; export `components/share/index.ts`

---

## Phase 4: Mobile screens + nav [PR-F2]

- [x] 4.1 `ShareConfigureScreen`, `ShareQrScreen`, `SharedHistoryScreen`, `SharedDetailScreen`
- [x] 4.2 `RootNavigator`: rutas + params (`resourceType`, `resourceId`, `linkId`)
- [x] 4.3 `DocumentDetailScreen`: share → navigate Configure (retire channel modal)
- [x] 4.4 `BackpackDetailScreen`: share → Configure flow
- [x] 4.5 Reemplazar tab/ruta `ShareDocuments` → `SharedHistory`; remove monolith screen
- [x] 4.6 Web `/share/doc`: quitar botón Abrir/descarga [web-deferred mini-fix en F2 si trivial]

---

## Phase 4.5: Post-apply UX / contract fixes [PR-F2]

- [x] 4.5.1 `useShareHistoryQuery`: fetch único `status=all` + filtro en cliente (tabs sin refetch)
- [x] 4.5.2 `ShareLinkSchema`: `documentCount`/`viewCount` `.nullish()` (backend envía `null` en documentos)
- [x] 4.5.3 `SharedHistoryScreen`: spinner solo en carga inicial; estado error + reintentar
- [x] 4.5.4 Evitar refetch storm (`refetchOnMount: always` + `useFocusEffect` refetch)
- [x] 4.5.5 `SharedActivityCards`: último acceso con `variant="h3"` igual que visualizaciones
- [x] 4.5.6 `ShareConfigureScreen`: spinner en header "Generar" mientras `isPending`
- [x] 4.5.7 `formatShareStartedAt` en `shareUtils.ts` para filas de historial
- [x] 4.5.8 `SharedDetailScreen`: refresco actividad con `useFocusEffect` + `AppState(active)`
- [x] 4.5.9 `SharedActivityCards`: spinner visible durante refetch (`shares.isFetching`)
- [x] 4.5.10 `SharedDetailActions`: botón "Abrir documento" antes de "Ver QR de nuevo"
- [x] 4.5.11 Web `/share/doc`: redirección directa al documento (sin Helu viewer embebido)

---

## Phase 5: Verification

- [x] 5.1 API: pytest `test_shares.py` green (11 tests, backend container)
- [x] 5.2 Mobile QA: historial muestra doc + mochila con iconos distintos
- [x] 5.3 Mobile QA: config → QR → historial → detalle → revocar
- [x] 5.4 Mobile QA: filtros Activos/Expirados/Todos (client-side, sin spinner por tab)
- [x] 5.5 Mobile QA: receptor no ve acción de descarga (`/share/doc`)
- [ ] 5.6 `tsc --noEmit -p apps/mobile`
- [ ] 5.7 Mobile QA: Generar muestra spinner hasta navegar a QR
- [x] 5.8 PRs encadenados creados y mergeados a tracker
- [ ] 5.9 QA: "Abrir documento" abre URL pública y refresca actividad al volver al detalle

---

## Apply order

1. Tracker `feature/refactor-share-module` en ambos repos
2. Phase 1 → PR-B → tracker backend
3. Phase 2 → PR-F1 → tracker frontend
4. Phases 3–4 + 4.5 → PR-F2 → tracker frontend
5. Phase 5; tracker → `dev`
