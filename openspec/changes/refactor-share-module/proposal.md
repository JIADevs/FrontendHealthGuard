# Proposal: Refactor módulo Compartir (mobile + API)

## Intent

Unificar la experiencia de compartir documentos y mochilas según los mockups: flujo Configurar → QR, historial con filtros, detalle con revocación, y distinción clara **Documento vs Mochila** en cada fila. Los enlaces compartidos MUST ser **solo visualización** — sin opción de descarga para el receptor.

## Scope

### In Scope

**Backend**
- Router `/shares`: listado unificado (activos + expirados), revoke, extend expiración
- `resource_type`: `document` | `backpack` en respuestas
- Crear share con `expires_in` configurable (1h, 24h, 7d, nunca)
- Vista pública view-only: signed URL sin affordance de descarga; tracking básico de vistas
- Revoke/list para enlaces de mochila (hoy inexistente)

**Shared (`packages/api`)**
- Schemas Zod `ShareLink`, hooks `useSharesQuery`, mutations share/revoke/extend
- Deprecar wrapper sobre endpoints legacy de documentos

**Mobile (`apps/mobile`)**
- Módulo `components/share/`: filas historial, config expiración, QR, detalle, acciones
- Pantallas: `ShareConfigureScreen`, `ShareQrScreen`, `SharedHistoryScreen`, `SharedDetailScreen`
- Entrada desde detalle documento/mochila y tab Compartir (reemplaza `ShareDocumentsScreen`)
- Historial MUST mostrar tipo recurso (icono + etiqueta Documento/Mochila)
- UI permisos: Ver siempre activo; **no mostrar toggle Descargar**

### Out of Scope

- PIN de protección — change futuro
- Compartir a médico nombrado ("Con Dr. Rivera") — placeholder "Enlace público"
- Web historial/compartir UI — [web-deferred]; solo ajuste view-only en `/share/doc`
- Página pública mochila `/share/backpack` — change `backpack-public-share`

## Capabilities

### New Capabilities

- `mobile/shares`: flujos mobile historial, configurar, QR, detalle, revocar
- `shared-api/shares`: hooks, schemas, invalidación cache shares
- `api/shares`: contrato REST unificado documento + mochila

### Modified Capabilities

- None (sin baseline en `openspec/specs/`)

## Approach

1. **Backend** — router `/shares`, campos comunes, view-only signed URLs, pytest
2. **`packages/api`** — contratos Zod + hooks; migrar consumidores
3. **`components/share/`** — UI modular según mockups
4. **Screens + nav** — wiring; retirar lógica de `ShareDocumentsScreen` monolítica
5. **PRs encadenados**: backend → shared-api → mobile-ui

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `BackendHealthGuard/app/api/.../shares.py` | New | List, revoke, extend, create options |
| `BackendHealthGuard/app/crud/crud_share.py` | New | Queries unificadas doc + backpack links |
| `BackendHealthGuard/app/schemas/share.py` | New | `ShareLinkOut`, `ShareCreateOptions` |
| `packages/api/src/shares/` | New | endpoints, schemas, hooks |
| `apps/mobile/src/components/share/` | New | UI módulo compartir |
| `apps/mobile/src/screens/ShareDocumentsScreen.tsx` | Removed/Replaced | → `SharedHistoryScreen` |
| `apps/mobile/src/hooks/useDocumentShareModal.ts` | Modified | Usar flujo navigate a Configure |
| `apps/mobile/src/navigation/RootNavigator.tsx` | Modified | Rutas share nuevas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Signed URL aún descargable vía navegador | Med | `Content-Disposition: inline`; preview embebido; sin botón Abrir |
| Diff grande mobile | Med | PRs encadenados; componentes antes que screens |
| Breaking API client | Low | Wrappers legacy + misma change-name |

## Rollback Plan

Revert PRs inversos. Sin migración DB obligatoria si columnas nuevas son nullable. Restaurar `ShareDocumentsScreen` desde git.

## Dependencies

- Backend API para pytest
- Ningún change blocker de mochilas (bugs fix puede mergear en paralelo)

## Success Criteria

- [ ] Historial muestra documentos y mochilas con tipo distinguible
- [ ] Flujo compartir coincide con mockups (config → QR → historial → detalle)
- [ ] Receptor no puede descargar archivo compartido (solo vista)
- [ ] Filtros Todos / Activos / Expirados funcionan
- [ ] `pytest tests/api/test_shares.py` verde
- [ ] `tsc --noEmit -p apps/mobile` sin errores
