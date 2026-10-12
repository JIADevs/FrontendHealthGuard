# Exploration: Refactor módulo Compartir

## Current State

El módulo de compartir está **fragmentado** entre documentos y mochilas, sin UX unificada ni historial consolidado.

| Área | Hoy | Gap vs mockups |
|------|-----|----------------|
| Mobile historial | `ShareDocumentsScreen`: panel colapsable de enlaces activos **solo documentos** | Falta lista dedicada con filtros Todos/Activos/Expirados; sin mochilas |
| Mobile compartir doc | `ShareDocumentModal`: canales WhatsApp/correo/enlace | Falta flujo Configurar → QR con expiración |
| Mobile compartir mochila | Inline en `BackpackDetailScreen` (QR + copiar) | Mismo flujo unificado ausente |
| Tipo recurso | No se distingue mochila vs documento en listados | Mockup: icono mochila vs documento en cada fila |
| Descarga | `GET /documents/shared/signed-url` + botón "Abrir archivo" en web pública | Usuario exige **solo vista**, sin descarga |
| Backend listado | `GET /documents/shares/active` | Sin mochilas, sin expirados, sin endpoint unificado |
| Backend revoke | `DELETE /documents/shares/{link_id}` | Sin revoke mochila |
| Expiración | Fija 7 días en backend | Mockup: 1h / 24h / 7d / Nunca |
| Actividad | No hay view_count ni extend | Mockup: visualizaciones, último acceso, extender 24h |

**Archivos clave**

- `apps/mobile/src/screens/ShareDocumentsScreen.tsx` — pantalla monolítica (~600 LOC)
- `apps/mobile/src/hooks/useDocumentShareModal.ts` — share desde detalle documento
- `apps/mobile/src/components/backpacks/BackpackDetailShareRow.tsx` — share mochila ad hoc
- `packages/api/src/endpoints.ts` — `shareDocument`, `getActiveDocumentShares`, `shareBackpack`
- `BackendHealthGuard/.../documents.py` — share/revoke/list/consume/signed-url
- `BackendHealthGuard/.../backpacks.py` — solo `POST …/share` (sin list/revoke/consume)

## Affected Areas

- `apps/mobile/src/components/share/` — **nuevo** módulo de componentes
- `apps/mobile/src/screens/Share*.tsx` — reemplazar/refactorizar pantallas
- `packages/api/src/` — hooks/schemas unificados de shares
- `BackendHealthGuard/app/api/.../shares.py` — router unificado (nuevo)
- `BackendHealthGuard/app/schemas/share.py` — contratos comunes
- `apps/web/src/app/share/doc/page.tsx` — quitar affordances de descarga [web-deferred UI]

## Approaches

1. **Router `/shares` unificado (recomendado)**
   - Pros: un listado, un revoke, `resource_type` explícito; escala a stats/extend
   - Cons: migración de endpoints legacy; pytest nuevo
   - Effort: Medium–High

2. **Duplicar endpoints mochila paralelos a documento**
   - Pros: menos breaking change
   - Cons: cliente mergea dos listas; duplicación CRUD
   - Effort: Medium

3. **Solo UI mobile sobre API actual**
   - Pros: rápido
   - Cons: historial sin mochilas ni expirados; no cumple requisitos
   - Effort: Low — **descartado**

## Recommendation

**Approach 1**: backend `/shares` unificado + `packages/api` + `components/share/` + pantallas según mockups. Mantener endpoints legacy como wrappers deprecados una release. Vista pública view-only vía signed URL con `Content-Disposition: inline` y sin botón descarga en cliente.

**MVP funcional del change**

- Historial unificado con badge/icono **Documento** vs **Mochila**
- Flujo Compartir: configuración (expiración; permiso Ver siempre; **sin toggle Descargar**)
- Pantalla QR + detalle compartido + revocar
- Filtros Activos/Expirados/Todos

**Deferido**

- PIN 4 dígitos
- Destinatario nombrado ("Con Dr. Rivera") — mostrar "Enlace público" hasta módulo médicos
- Web app compartir/historial [web-deferred]
- Página pública `/share/backpack` (change `backpack-public-share` existente)

## Risks

- Signed URLs aún permiten descarga directa si el usuario conoce la URL → mitigar con inline + CSP en preview embebido
- Breaking change en `getActiveDocumentShares` → wrapper temporal en `packages/api`
- Pantallas nuevas + navegación aumentan diff → PRs encadenados

## Ready for Proposal

**Yes** — crear change `refactor-share-module` en FrontendHealthGuard + BackendHealthGuard.
