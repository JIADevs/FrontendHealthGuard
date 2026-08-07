# Proposal: Dependientes — gestión de delegaciones y cambio de contexto de paciente

## Intent

El backend de delegación está completo (5 endpoints + swap de identidad vía `X-Patient-Context`), pero el frontend mobile **no tiene UI**: el ítem "Dependientes" en Más es un stub (`showComingSoon`). Un cuidador no puede invitar, aceptar/rechazar, revocar ni gestionar la cuenta de otra persona. Este change entrega el slice mobile-first: capa cliente en `packages/api` + pantallas en `apps/mobile`, con cambio de contexto seguro. Web queda **`[web-deferred]`** reutilizando la capa compartida.

## Scope

### In Scope (MVP mobile)
- **`packages/api`**: schemas Zod, 5 funciones de endpoint, 5 hooks de query/mutation. Invitaciones **siempre `FULL_ACCESS`** (sin selector de permisos).
- **`packages/stores`**: `switchPatientContext` que ejecuta `queryClient.clear()` en cada cambio (incluido "Mi cuenta").
- **`DependientesScreen`** (Más): dos secciones — "Quién gestiona mi cuenta" y "Personas que gestiono" — más sección de solicitudes pendientes.
- **Invitar**: un botón → `DelegationInviteModeSheet` (Invitar dependiente / Invitar cuidador) → `DependientesInviteScreen` con email.
- **Cambio de contexto**: solo desde Dependientes (tap en tarjeta + acción "Mi cuenta" para salir).
- **Tab Inicio**: `CenterTabIcon` muestra iniciales del dependiente + contorno de color cuando `isManaging`; tap siempre abre el dashboard.
- **Color de contorno**: paleta cerrada del design system; picker por paciente; persistir vía `PUT /users/me/preferences/delegation_context_colors`.
- **Badge** de invitaciones `PENDING` en el ítem "Dependientes" de Más; refetch on focus.

### Out of Scope
- Selector READ_ONLY / FULL_ACCESS en UI y enforcement READ_ONLY en backend (R2).
- Push al recibir invitación (R5 — futuro `DELEGATION_INVITE` + FCM).
- Banner global en tabs o modales; indicador de contexto en pantallas stack/modal (R8 aceptado).
- Bottom sheet / atajo de cambio de paciente desde el tab central.
- UI web `[web-deferred]` (R6) — solo se asegura reutilización de `packages/api` + componentes de módulo.

## Capabilities

> Contrato con la fase de specs. No hay specs previos en `openspec/specs/`; todas las capacidades son nuevas.

### New Capabilities
- `delegation-api`: schemas Zod (`status` con 4 estados incl. `REVOKED`), 5 endpoints, 5 hooks; request de invitación fija `FULL_ACCESS`. Dominio `shared-api/`.
- `dependientes-mobile`: `DependientesScreen` (dos secciones + pendientes), botón Invitar + `DelegationInviteModeSheet` + `DependientesInviteScreen`, aceptar/rechazar/revocar, badge en Más. Dominio `mobile/`.
- `patient-context-switch`: `switchPatientContext` con `queryClient.clear()`, `CenterTabIcon` (iniciales + contorno), "Mi cuenta", color por paciente, política de `activePatientId` en cold start. Dominio `mobile/` + `shared-api/`.

### Modified Capabilities
- None (no existen specs previos; el wiring de `MoreScreen` y `TabNavigator` se cubre en las capacidades nuevas).

## Approach

Seguir el layering de `code-conventions` y `feature-module`: schemas + endpoints + hooks en `packages/api`; UI reutilizable en `apps/mobile/src/components/dependientes/` (tarjetas, sheet de modo, color picker); las screens solo componen. El cambio de contexto se **centraliza** en `switchPatientContext` (un único punto que limpia la cache), nunca repetido por pantalla. El header `X-Patient-Context` ya se inyecta desde `authStore.activePatientId` en `packages/api/src/client.ts` — no se toca el transporte.

## Affected Areas

| Área | Impacto | Descripción |
|------|---------|-------------|
| `packages/api/src/schemas.ts` | New | `UserDelegationSchema`, `DependentDelegationSchema`, `ManagerDelegationSchema` (enum 4 estados) |
| `packages/api/src/endpoints.ts` | New | 5 funciones de delegación + `delegation_context_colors` |
| `packages/api/src/hooks.ts` | New | `useManagedUsersQuery`, `useManagersQuery`, `useCreateDelegationMutation`, `useRespondDelegationMutation`, `useRevokeDelegationMutation` |
| `packages/stores/src/authStore.ts` | Modified | `switchPatientContext` + `queryClient.clear()`; política cold start |
| `apps/mobile/src/components/dependientes/` | New | `DelegationInviteModeSheet`, tarjetas, color picker, `index.ts` |
| `apps/mobile/src/screens/Dependientes*.tsx` | New | `DependientesScreen`, `DependientesInviteScreen` |
| `apps/mobile/src/screens/MoreScreen.tsx` | Modified | Conectar "Dependientes" + badge pendientes |
| `apps/mobile/src/navigation/{RootNavigator,TabNavigator}.tsx` | Modified | Rutas nuevas + `CenterTabIcon` |
| `apps/web/.../dependientes` | Deferred | `[web-deferred]` — reutiliza `packages/api` |
| `BackendHealthGuard` | Reference | READ_ONLY enforcement + test `accept` (fuera de este slice) |

## Slice Boundaries

### Slice único — Dependientes mobile MVP (entregable ahora)
- **Backend**: ninguno (los 5 endpoints existen). 
- **Success**: invitar/aceptar/rechazar/revocar funcionan; cambio de contexto solo desde Dependientes; **`queryClient.clear()` en cada cambio** (criterio bloqueante R1); indicador en tab Inicio; color persistido; badge de pendientes.

## Open Product Questions

**R7 — Persistencia de `activePatientId` entre reinicios de app — DECIDIDO: Opción B.**

Al rehidratar el auth store (`onRehydrateStorage` o bootstrap en `App.tsx`), forzar `activePatientId: null` e `isManaging: false`. El manager siempre arranca en su cuenta propia; volver a gestionar requiere Más → Dependientes.

## Risks

| Riesgo | Sev. | Mitigación (requisito) |
|--------|------|------------------------|
| R1 — Cache de TanStack al cambiar contexto | **Crítica** | `queryClient.clear()` centralizado en `switchPatientContext`, en cada cambio incl. "Mi cuenta". **Bloqueante en verify.** |
| R2 — READ_ONLY no enforced en backend | Media | UI envía **siempre `FULL_ACCESS`**; sin selector; no prometer "solo lectura" |
| R3 — `REVOKED` fuera del enum | Media | Zod `enum(["PENDING","ACTIVE","REJECTED","REVOKED"])`; UI muestra solo `ACTIVE`/`PENDING`; invalidar tras revoke |
| R5 — Sin push en invitación | Media | Badge en Más + sección pendientes + refetch on focus; push diferido |
| R7 — Persistencia de contexto al reiniciar | Media | Ver Open Product Questions — recomendada Opción B |
| R8 — Sin indicador en stack/modal | Media | Aceptado en MVP; checklist manual en un modal con contexto activo |
| R6 — Web sin UI | Baja | `[web-deferred]`; capa compartida reutilizable |
| R4 — Sin test backend de `accept` | Media | Follow-up backend; no bloquea frontend MVP |

## Rollback Plan

Aditivo: revertir el PR frontend. Schemas/endpoints/hooks nuevos, componentes nuevos y rutas nuevas se eliminan sin migración de datos ni cambio de backend. El único cambio no aislado es `switchPatientContext` en `authStore`; al revertir vuelve a `setPatientContext` previo (sin gestión de UI, comportamiento actual). Preferencia `delegation_context_colors` es opcional — su ausencia usa color por índice.

## Dependencies

- Backend existente: `POST/GET/PATCH/DELETE /users/me/delegations*` y `PUT /users/me/preferences/delegation_context_colors`.
- `queryClient` accesible desde el store (o callback inyectado) para `clear()`.
- `@helu/ui` primitives + patrón de bottom sheet (`AgendaMenuSheet`) + `react-native-toast-message`.
- Design system: paleta cerrada de colores de contorno.

## Success Criteria

- [ ] Invitar (ambos modos), aceptar/rechazar y revocar funcionan end-to-end en mobile.
- [ ] Cambio de contexto **solo** desde Dependientes; "Mi cuenta" sale; el tab Inicio abre el dashboard del contexto activo con iniciales + contorno.
- [ ] **Bloqueante:** propio → paciente A → paciente B → "Mi cuenta" sin datos cacheados del contexto anterior en Documentos/Agenda/Inicio.
- [ ] Cliente nunca envía `READ_ONLY`; Zod parsea respuestas con `REVOKED` sin romper.
- [ ] Badge de `PENDING` visible en Más; desaparece tras responder + refetch.
- [ ] Color de contorno se elige por paciente y persiste vía preferences.
- [ ] Toda UI reutilizable vive en `components/dependientes/`; screens solo componen; capa compartida lista para web `[web-deferred]`.

## Review Workload Forecast

- **Slice único**: `packages/api` (3 archivos) + `authStore` + ~5 componentes de módulo + 2 screens + 2 navegadores ≈ **12–15 archivos**.
- Estimado **> 400 líneas** — riesgo de presupuesto de review.
- **Decision needed before apply: Yes**
- **Chained PRs recommended: Yes** — sugerido: (1) `packages/api` schemas/endpoints/hooks + `switchPatientContext`/`queryClient.clear()`; (2) `DependientesScreen` + invite flow (sheet + screen) + accept/reject/revoke; (3) `CenterTabIcon` + color picker + badge en Más.
- **400-line budget risk: High**
- Estrategia: `ask-on-risk` — proponer el split encadenado antes de aplicar.
