# Apply Progress: refactor-share-module (Frontend)

Paired backend change: `BackendHealthGuard/openspec/changes/refactor-share-module/`

## Phase 2 — Shared API — Complete

- [x] `packages/api/src/shares/` (schemas, endpoints, hooks)
- [x] Re-exports en `hooks.ts` / `index.ts`
- [x] `useShareHistoryQuery` + `keepPreviousData`

## Phases 3–4 — Mobile UI — Complete

- [x] Components bajo `apps/mobile/src/components/share/`
- [x] Screens: Configure, QR, History, Detail
- [x] Nav + entry points desde document/backpack detail y tab Compartir
- [x] Eliminado `ShareDocumentsScreen`

## Phase 4.5 — Post-apply fixes — Complete

- [x] Historial: query única + filtro cliente; error UI; sin refetch storm
- [x] Zod: `documentCount` null en enlaces de documento
- [x] List item: título recurso, estado, tiempo desde `createdAt`
- [x] Activity cards: tipografía unificada h3
- [x] Configure: spinner en "Generar"

## Deviations

| Topic | Planned | As-built | Reason |
|-------|---------|----------|--------|
| History fetch | `useSharesQuery(status)` por tab | `useShareHistoryQuery()` + filtro cliente | UX: evitar spinner y peticiones al cambiar filtro |
| List row meta | tipo + enlace público + doc count | título + estado + tiempo creación | Alineado a mockup revisado |
| Schema optional fields | `.optional()` | `.nullish()` + transforms | FastAPI serializa `null`, no `undefined` |
| Focus refetch | `refetchOnMount: always` + focus | removido | Cancelaba fetches → spinner infinito |
| Backpack public link | en scope MVP web | deferred (`/share/backpack` 404) | Sin consume público de mochila aún |

## Verification pending

- [ ] `tsc --noEmit -p apps/mobile`
- [ ] PRs PR-F1, PR-F2 mergeados a tracker
- [ ] Tracker → `dev`
