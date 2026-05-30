# Design: Refactor módulo Compartir (mobile + API)

## Technical Approach

PRs encadenados: **(1) backend `/shares`**, **(2) `packages/api`**, **(3) mobile UI**. Unificar enlaces de `document_share_links` y `backpack_share_links` en contrato común con `resource_type`. Mobile extrae UI a `components/share/`; screens solo navegan y pasan IDs.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| API surface | Router `/api/v1/shares` | Duplicar en documents/backpacks | Un listado, un revoke; cliente simple |
| Resource typing | `resource_type` + `resource_id` | Dos queries separadas | Requisito UI mochila vs documento |
| Download policy | View-only fijo (`can_download: false`) | Toggle en UI | Requisito explícito del producto |
| Expiration | Request body `expires_in` enum | Solo 7d fijo | Mockup 1h/24h/7d/Nunca |
| Legacy endpoints | Wrappers que delegan a `/shares` | Break immediately | Transición suave web/mobile |
| Share entry | Navigate to `ShareConfigure` | Modal channels | Alineado a mockups |
| History screen | Reemplaza `ShareDocumentsScreen` | Panel colapsable | Mockup pantalla dedicada |
| View tracking | Increment on `consume` | Sin stats MVP | Mockup actividad; mínimo view_count |
| History data loading | `useShareHistoryQuery` + client filter | Per-tab `useSharesQuery(status)` | Evita spinner/refetch al cambiar filtros |
| History refetch | Invalidación post-mutation + pull-to-refresh | `refetchOnMount: always` + focus refetch | Evitó refetch storm / spinner infinito |
| Zod optional/null | `.nullish()` + transforms | `.optional()` | FastAPI JSON usa `null`, no `undefined` |
| PIN | Deferred | Implement now | Complejidad auth pública |

## Data Flow

```
[DocumentDetail / BackpackDetail / Tab Compartir]
        │
        ▼
ShareConfigureScreen ──POST /documents|backpacks/{id}/share + expires_in──► ShareQrScreen
        │
        ▼
SharedHistoryScreen ◄── useShareHistoryQuery → GET /shares?status=all (filtro cliente Activos/Expirados)
        │
        ▼
SharedDetailScreen ── extend / revoke / copy / system share

Public viewer (/share/doc)
        │
        ▼
GET consume + signed-url (inline preview only, no download CTA)
```

## File Changes

### BackendHealthGuard

| File | Action | Description |
|------|--------|-------------|
| `app/api/api_v1/endpoints/shares.py` | Create | GET list, DELETE revoke, POST extend |
| `app/crud/crud_share.py` | Create | Union queries doc + backpack links |
| `app/schemas/share.py` | Create | `ShareLinkOut`, filters, create options |
| `app/models/document.py` | Modify | Optional `view_count`, `last_viewed_at` on share link |
| `app/models/backpack.py` | Modify | Same tracking fields on backpack share link |
| `documents.py` / `backpacks.py` | Modify | Accept `expires_in`; delegate list to shares |
| `tests/api/test_shares.py` | Create | list, revoke, extend, view-only |

### packages/api

| File | Action | Description |
|------|--------|-------------|
| `src/shares/schemas.ts` | Create | Zod `ShareLinkSchema`, enums |
| `src/shares/endpoints.ts` | Create | `listShares`, `revokeShare`, `extendShare` |
| `src/shares/hooks.ts` | Create | queries + mutations + `useShareHistoryQuery` |
| `src/hooks.ts` | Modify | Re-export; deprecate direct document share list |
| `src/index.ts` | Modify | Export shares module |

### apps/mobile/components/share

| File | Action | Description |
|------|--------|-------------|
| `ShareResourceSummaryCard.tsx` | Create | Icono doc/mochila + título + meta |
| `ShareExpirationPicker.tsx` | Create | Chips 1h/24h/7d/Nunca |
| `SharePermissionsSection.tsx` | Create | Ver siempre; sin Descargar |
| `ShareQrPanel.tsx` | Create | QR + URL + copiar/enviar |
| `SharedHistoryListItem.tsx` | Create | Icono tipo, título recurso, badge estado, tiempo desde `createdAt` |
| `SharedHistoryFilters.tsx` | Create | Todos/Activos/Expirados |
| `SharedDetailActions.tsx` | Create | QR, copiar, extender, revocar |
| `SharedActivityCards.tsx` | Create | Visualizaciones, último acceso |
| `useShareFlow.ts` | Create | Hook navegación + mutations |
| `index.ts` | Create | Barrel exports |

### apps/mobile/screens + nav

| File | Action | Description |
|------|--------|-------------|
| `ShareConfigureScreen.tsx` | Create | Config + Generar |
| `ShareQrScreen.tsx` | Create | QR result |
| `SharedHistoryScreen.tsx` | Create | Historial (reemplaza ShareDocuments) |
| `SharedDetailScreen.tsx` | Create | Detalle enlace |
| `ShareDocumentsScreen.tsx` | Remove | Migrar a SharedHistory |
| `useDocumentShareModal.ts` | Modify | Navigate vs modal |
| `BackpackDetailScreen.tsx` | Modify | Share → Configure flow |
| `RootNavigator.tsx` | Modify | Nuevas rutas + params |

## Interfaces / Contracts

```typescript
// packages/api/src/shares/schemas.ts
export const ShareResourceTypeSchema = z.enum(["document", "backpack"]);
export const ShareLinkSchema = z.object({
  linkId: z.string().uuid(),
  resourceType: ShareResourceTypeSchema,
  resourceId: z.string().uuid(),
  title: z.string(),
  documentCount: z.number().nullish(), // null en documentos; número en mochilas
  shareUrl: z.string(),
  qrCodeUrl: z.string(),
  expiresAt: z.string().nullish(),
  createdAt: z.string(),
  status: z.enum(["active", "expired"]),
  viewCount: z.number().nullish().transform((v) => v ?? 0),
  lastViewedAt: z.string().nullish(),
  canDownload: z
    .union([z.literal(false), z.literal(true), z.undefined()])
    .transform(() => false as const),
});

// Historial mobile — una query, filtro local
export function useShareHistoryQuery() {
  return useQuery({
    queryKey: shareQK.list("all"),
    queryFn: () => listShares("all"),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
```

```python
# schemas/share.py
class ShareLinkOut(BaseModel):
    link_id: UUID
    resource_type: Literal["document", "backpack"]
    resource_id: UUID
    title: str
    document_count: int | None = None
    share_url: str
    qr_code_url: str
    expires_at: datetime | None
    status: Literal["active", "expired"]
    view_count: int = 0
    can_download: Literal[False] = False
```

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| API | list/revoke/extend/type filter | pytest `test_shares.py` |
| API | signed-url view-only headers | pytest assert Content-Disposition |
| Shared | Zod parse | tsc |
| Mobile | flows | Manual QA checklist from specs |

## Migration / Rollout

Alembic: add `view_count`, `last_viewed_at` to both share link tables (default 0/null). Deploy backend first. Mobile switches to new screens in same release.

## PR Slices

**Tracker**: `feature/refactor-share-module` (desde `dev`) en cada repo.

| PR | Head | Base | Repo |
|----|------|------|------|
| PR-B | `refactor/shares-api` | tracker | BackendHealthGuard |
| PR-F1 | `refactor/shares-shared-api` | tracker | FrontendHealthGuard |
| PR-F2 | `refactor/shares-mobile-ui` | `refactor/shares-shared-api` | FrontendHealthGuard |

## Open Questions

- [ ] URL corta `helu.app/s/...` — usar URL completa en MVP; acortador deferred
- [ ] Extend: +24h fijo vs respetar duración original — mockup dice +24h

## Post-apply notes (2026-05-30)

Fixes durante QA manual documentados en `apply-progress.md`:

- Historial: spinner infinito por refetch storm y Zod `documentCount: null`
- List item alineado a mockup (título + estado + tiempo; sin enlace público / doc count)
- Detalle: último acceso mismo estilo h3 que visualizaciones
- Configure: spinner en "Generar" (`isPending`)
- Pendiente: página pública `/share/backpack` (deferred en `state.yaml`)

## Web reuse (deferred)

Web reutilizará `packages/api/shares` y `ShareQrPanel` web variant cuando se retome historial web.
