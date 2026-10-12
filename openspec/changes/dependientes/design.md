# Design: Dependientes — delegation management & patient context switch

## Technical Approach

Mobile-first slice over the existing delegation backend (5 endpoints + `X-Patient-Context` identity swap). Three layers, following the project's ACTUAL structure (not the idealized `packages/features` layout):

1. **`packages/api` (flat files)** — Zod schemas, endpoint functions and TanStack Query hooks added to `schemas.ts`, `endpoints.ts`, `hooks.ts`, exported from `index.ts`. The Axios client already camelizes responses and snakelizes requests, so schemas are camelCase and need no manual mapping. `X-Patient-Context` is already injected from `authStore.activePatientId` — transport is untouched.
2. **`packages/stores`** — `switchPatientContext` centralizes the context change and the mandatory `queryClient.clear()` (R1). Cold-start policy (R7 Option B) lives in `onRehydrateStorage`.
3. **`apps/mobile`** — reusable UI in `src/components/dependientes/` (cards, invite-mode sheet, color picker), screens that only compose, plus `MoreScreen`/`TabNavigator`/`RootNavigator` wiring.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Delegation code location | Flat `packages/api` files (`schemas/endpoints/hooks`) | New `packages/features/dependientes` per skill | Repo has no `packages/features`; api is flat. Follow existing pattern. |
| Cache safety on switch | `queryClient.clear()` inside `switchPatientContext` | `invalidateQueries`; per-screen clearing; `activePatientId` in every query key | `invalidate` shows stale data during refetch (leak). Single choke-point avoids repetition. Query-key scoping is post-MVP defense-in-depth. |
| queryClient access from store | Inject a cache-cleaner callback into the store at bootstrap (mirrors `setApiAuthProviders`) | Export shared `queryClient` from `@helu/api` and import in store | `stores` must not depend on `api` (api wires providers to stores → cycle). Injection is the established pattern. |
| Cold-start context (R7) | Option B: `onRehydrateStorage` forces `activePatientId:null`, `isManaging:false` | Persist + revalidate ACTIVE on boot | Safer; manager always boots into own account. Re-managing costs 2 taps via Más → Dependientes. |
| Permissions in UI | Always send `FULL_ACCESS`; no selector (R2) | READ_ONLY selector | Backend does not enforce READ_ONLY; no false promise. |
| `status` enum | `z.enum(["PENDING","ACTIVE","REJECTED","REVOKED"])` (R3) | 3-state enum | `revoke()` returns `REVOKED`; strict 3-state parse would throw. |
| Context switcher surface | Only `DependientesScreen` + tab indicator | Global banner / tab-bar shortcut / bottom sheet (R8) | Lowest complexity; Home tab keeps dashboard semantics. |

## Data Flow — Patient Context Switch

```
DependientesScreen (tap ManagedPatientCard | "Mi cuenta")
        │
        ▼
authStore.switchPatientContext(patientId | null)
        │  1. set { activePatientId, isManaging }
        │  2. invoke injected clearQueryCache()  ──►  queryClient.clear()
        ▼
Next request → client interceptor reads activePatientId → X-Patient-Context header
        ▼
All domains (Home / Agenda / Documents) refetch under the active patient — no stale cache
```

Bootstrap wiring (App.tsx, next to existing `setApiAuthProviders`):
```
useAuthStore.getState().setQueryCacheCleaner(() => queryClient.clear());
```

## Component Tree (mobile)

```
DependientesScreen
├── PendingRequestsSection        (PENDING where linkedUserEmail === me)
│   └── DelegationRequestCard      → accept / reject
├── ManagersSection  "Quién gestiona mi cuenta"
│   └── ManagerCard                → revoke
├── ManagedSection   "Personas que gestiono"
│   └── ManagedPatientCard         → switch context · open ContextColorPicker · revoke
├── "Mi cuenta" row (only when isManaging)  → switchPatientContext(null)
└── InviteButton → DelegationInviteModeSheet (Modal, AgendaMenuSheet pattern)
                       ├── "Invitar dependiente" (I_WANT_TO_MANAGE_THEM)
                       └── "Invitar cuidador"    (THEY_WILL_MANAGE_ME)
                              → navigate DependientesInvite { relationship }

DependientesInviteScreen   (email field; relationship fixed; FULL_ACCESS)
ContextColorPicker         (closed palette; one tap → persist)
CenterTabIcon (modified)   initials + color outline when isManaging, else LayoutDashboard
```

All shared via `components/dependientes/index.ts`; screens only compose.

## File Changes

| File | Action | Description |
|---|---|---|
| `packages/api/src/schemas.ts` | Modify | `DelegationStatusSchema` (4 states), `DelegationRelationshipSchema`, `UserDelegationSchema`, `DependentDelegationSchema`, `ManagerDelegationSchema`, `DelegationCreate`, `DelegationContextColors` |
| `packages/api/src/endpoints.ts` | Modify | `createDelegation`, `getManagedUsers`, `getManagers`, `respondDelegation(id, action)`, `revokeDelegation(id)`, `updateDelegationColors` |
| `packages/api/src/hooks.ts` | Modify | `useManagedUsersQuery`, `useManagersQuery`, `useCreateDelegationMutation`, `useRespondDelegationMutation`, `useRevokeDelegationMutation`, `useUpdateDelegationColorsMutation`; `delegationKeys` |
| `packages/api/src/index.ts` | Modify | Export new schemas/types/hooks |
| `packages/stores/src/authStore.ts` | Modify | `switchPatientContext`, `setQueryCacheCleaner`; `onRehydrateStorage` cold-start reset (R7 B) |
| `apps/mobile/App.tsx` | Modify | Wire `setQueryCacheCleaner(() => queryClient.clear())` |
| `apps/mobile/src/components/dependientes/*` | Create | `DelegationInviteModeSheet`, `DelegationRequestCard`, `ManagerCard`, `ManagedPatientCard`, `ContextColorPicker`, `colorTokens.ts`, `index.ts` |
| `apps/mobile/src/screens/DependientesScreen.tsx` | Create | Sections + pending + invite + switch + "Mi cuenta" |
| `apps/mobile/src/screens/DependientesInviteScreen.tsx` | Create | Email invite form (relationship fixed) |
| `apps/mobile/src/screens/MoreScreen.tsx` | Modify | Wire "Dependientes" nav + PENDING badge; refetch on focus |
| `apps/mobile/src/navigation/RootNavigator.tsx` | Modify | Add `Dependientes`, `DependientesInvite` to `RootStackParamList` + screens |
| `apps/mobile/src/navigation/TabNavigator.tsx` | Modify | `CenterTabIcon` initials + color outline when `isManaging` |
| `apps/web/.../dependientes` | Deferred | `[web-deferred]` — reuses `packages/api` |

## Interfaces / Contracts

```ts
// schemas.ts (camelCase; client transforms transport)
export const DelegationStatusSchema = z.enum(["PENDING","ACTIVE","REJECTED","REVOKED"]);
export const DelegationRelationshipSchema = z.enum(["I_WANT_TO_MANAGE_THEM","THEY_WILL_MANAGE_ME"]);

export const DependentDelegationSchema = z.object({
  id: z.string(), dependentUserId: z.string().nullable(),
  linkedUserEmail: z.string().email(), linkedUserName: z.string().nullable(),
  status: DelegationStatusSchema, permissions: z.string(), createdAt: z.string(),
});
export const ManagerDelegationSchema = DependentDelegationSchema; // mirror; managerUserId side

export type DelegationCreate = { email: string; relationship: z.infer<typeof DelegationRelationshipSchema>; permissions: "FULL_ACCESS" };
```

### Navigation Routes

```ts
Dependientes: WithBackTitle | undefined;
DependientesInvite: WithBackTitle & { relationship: "I_WANT_TO_MANAGE_THEM" | "THEY_WILL_MANAGE_ME" };
```
Both registered with `headerShown: true`, `animation: "slide_from_right"`, `headerBackTitle` "Más".

### Preference Key Schema

`PUT /users/me/preferences/delegation_context_colors` — body is the full map (replace semantics):
```jsonc
{ "<dependentUserId>": "<colorToken>" }   // colorToken ∈ closed design-system palette
```
Read current colors from the existing profile/preferences query; missing entry → default color by list index. Palette constant `DELEGATION_COLOR_TOKENS` in `components/dependientes/colorTokens.ts`.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit | Zod parses `REVOKED`; `DelegationCreate` never emits `READ_ONLY` | schema tests |
| Unit | `switchPatientContext` calls cleaner on set and on `null` | mock cleaner |
| Manual (blocking R1) | own → A → B → "Mi cuenta": no stale data in Home/Agenda/Documents | device walkthrough |
| Manual | PENDING badge appears in Más, clears after respond + refetch | device |
| Manual | tab initials + outline render under context; tap opens dashboard | device |

## Migration / Rollout

No data migration. Additive; rollback = revert PR(s). `switchPatientContext` reverts to prior `setPatientContext`. `delegation_context_colors` absent → index default.

## PR delivery (single PR — user decision)

**One PR**, `size:exception` (~700–900 líneas), **5 work-unit commits** (ver `tasks.md`):

| Commit | Scope |
|--------|--------|
| 1 | `feat(api):` schemas, endpoints, hooks + unit tests |
| 2 | `feat(stores):` `switchPatientContext`, `queryClient.clear()`, cold-start R7 |
| 3 | `feat(mobile):` `components/dependientes/` |
| 4 | `feat(mobile):` `DependientesScreen`, `DependientesInviteScreen` |
| 5 | `feat(mobile):` navigation, `MoreScreen` badge, `CenterTabIcon` |

Implementación en ese orden dentro del mismo branch/PR.

## Open Questions

- [ ] Exact backend field names/shape of `DependentDelegation` / `ManagerDelegation` responses (confirm `linkedUserName`, `dependentUserId` nullability) — verify against `users.py` before coding slice 1.
- [ ] Where preferences are read on the client today (profile payload vs dedicated endpoint) to source current `delegation_context_colors`.
