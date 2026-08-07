# Tasks: Dependientes — delegation management & patient context switch

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 700–900 |
| 400-line budget risk | High |
| Chained PRs recommended | No (user-mandated single PR) |
| Suggested split | Single PR / work-unit commits |
| Delivery strategy | single-pr (size:exception accepted by user) |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: High

### Work-Unit Commit Map

| Commit | Scope | Files | Includes tests |
|--------|-------|-------|---------------|
| 1 | `feat(api): add delegation schemas, endpoints, and hooks` | `schemas.ts`, `endpoints.ts`, `hooks.ts`, `index.ts` | Unit: schema parse, REVOKED, FULL_ACCESS lock |
| 2 | `feat(stores): add switchPatientContext with cache clear and cold-start reset` | `authStore.ts`, `App.tsx` | Unit: cleaner called on set + null |
| 3 | `feat(mobile): add delegation shared components` | `components/dependientes/*` | — |
| 4 | `feat(mobile): add DependientesScreen and DependientesInviteScreen` | `DependientesScreen.tsx`, `DependientesInviteScreen.tsx` | — |
| 5 | `feat(mobile): wire navigation, MoreScreen badge, and CenterTabIcon` | `RootNavigator.tsx`, `TabNavigator.tsx`, `MoreScreen.tsx` | — |

---

## Phase 1: API Layer — schemas, endpoints, hooks

- [x] 1.1 Add `DelegationStatusSchema = z.enum(["PENDING","ACTIVE","REJECTED","REVOKED"])` to `packages/api/src/schemas.ts` (RF-SA-D1)
- [x] 1.2 Add `DelegationRelationshipSchema`, `DependentDelegationSchema`, `ManagerDelegationSchema` to `packages/api/src/schemas.ts` (RF-SA-D2)
- [x] 1.3 Add `DelegationRequestSchema` with `permissions: z.literal("FULL_ACCESS")` locked to `packages/api/src/schemas.ts` (RF-SA-D3)
- [x] 1.4 Add `DelegationContextColors` type (`Record<string, string>`) to `packages/api/src/schemas.ts`
- [x] 1.5 Add `createDelegation`, `getManagedUsers`, `getManagers`, `respondDelegation(id, action)`, `revokeDelegation(id)` to `packages/api/src/endpoints.ts` (RF-SA-D4) — each validates response with Zod
- [x] 1.6 Add `updateDelegationContextColors(colors)` → `PUT /users/me/preferences/delegation_context_colors` to `packages/api/src/endpoints.ts` (RF-SA-D5)
- [x] 1.7 Add `delegationKeys` factory (`["delegations","managed"]` / `["delegations","managers"]`) to `packages/api/src/hooks.ts`
- [x] 1.8 Add `useManagedUsersQuery()` and `useManagersQuery()` to `packages/api/src/hooks.ts` (RF-SA-D6)
- [x] 1.9 Add `useCreateDelegationMutation()`, `useRespondDelegationMutation()`, `useRevokeDelegationMutation()` with `onSuccess → invalidateQueries(["delegations"])` to `packages/api/src/hooks.ts` (RF-SA-D6)
- [x] 1.10 Add `useUpdateDelegationColorsMutation()` to `packages/api/src/hooks.ts`
- [x] 1.11 Export all new schemas, types, endpoint functions, and hooks from `packages/api/src/index.ts`
- [ ] 1.12 **Unit test:** `DelegationStatusSchema.parse("REVOKED")` succeeds; `parse("EXPIRED")` throws `ZodError` — SKIPPED: no test runner in project
- [ ] 1.13 **Unit test:** `DelegationRequestSchema` rejects body missing `permissions` or with `permissions: "READ_ONLY"` — SKIPPED: no test runner in project

## Phase 2: Store & Bootstrap

- [x] 2.1 Add `setQueryCacheCleaner(fn: () => void)` action to `packages/stores/src/authStore.ts`
- [x] 2.2 Add `switchPatientContext(patientId: string | null)` action to `packages/stores/src/authStore.ts` (R1 blocking)
- [x] 2.3 Add `onRehydrateStorage` cold-start reset — forces `activePatientId: null`, `isManaging: false` (R7 Option B)
- [x] 2.4 Wire `setQueryCacheCleaner(() => queryClient.clear())` in `apps/mobile/App.tsx`
- [ ] 2.5 **Unit test:** `switchPatientContext("patient-x")` calls cleaner once — SKIPPED: no test runner
- [ ] 2.6 **Unit test:** `switchPatientContext(null)` calls cleaner and resets — SKIPPED: no test runner

## Phase 3: Shared Components

- [x] 3.1 Create `apps/mobile/src/components/dependientes/colorTokens.ts`
- [x] 3.2 Create `DelegationRequestCard` component (RF-M-D2)
- [x] 3.3 Create `ManagerCard` component (RF-M-D3)
- [x] 3.4 Create `ManagedPatientCard` component (RF-M-CS3, RF-M-CS5)
- [x] 3.5 Create `DelegationInviteModeSheet` component (RF-M-D4)
- [x] 3.6 Create `ContextColorPicker` component (RF-M-CS5)
- [x] 3.7 Create `apps/mobile/src/components/dependientes/index.ts` barrel export (RF-M-D7)

## Phase 4: Screens

- [x] 4.1 Create `DependientesScreen.tsx` with three sections (RF-M-D1)
- [x] 4.2 Wire `useFocusEffect` for refetch on focus (RF-M-D1)
- [x] 4.3 Single "Invitar" button → `DelegationInviteModeSheet` → navigate with relationship param (RF-M-D4)
- [x] 4.4 "Mi cuenta" row (visible when `isManaging`) → `switchPatientContext(null)` (RF-M-CS3)
- [x] 4.5 `ManagedPatientCard` tap: `switchPatientContext(patientId)` + navigate to Home (RF-M-CS3)
- [x] 4.6 Create `DependientesInviteScreen.tsx` with loading indicator (RF-M-D5)
- [x] 4.7 Email validation in `DependientesInviteScreen` — field-level error, no call on invalid (RF-M-D5)

## Phase 5: Navigation & Wiring

- [x] 5.1 Add `Dependientes` and `DependientesInvite` to `RootStackParamList`
- [x] 5.2 Register both screens with `headerShown: true`, `slide_from_right`, `headerBackTitle: "Más"`
- [x] 5.3 Update `MoreScreen` to navigate to `Dependientes`, add PENDING badge query (RF-M-D6)
- [x] 5.4 Numeric badge on "Dependientes" + `useFocusEffect` refetch (RF-M-D6)
- [x] 5.5 `CenterTabIcon`: initials + color ring when `isManaging`; `LayoutDashboard` otherwise (RF-M-CS4)
- [x] 5.6 Center tab tap navigates to `HomeScreen` only (RF-M-CS4)

## Phase 6: Verification

- [ ] 6.1 **Manual:** own → patient A → patient B → "Mi cuenta": Appointments, Documents, Home show correct data at each step; no stale cache (R1 blocking scenario)
- [ ] 6.2 **Manual:** cold-start after managing a dependent — `activePatientId` is null; Home shows own data; no `X-Patient-Context` header sent
- [ ] 6.3 **Manual:** badge in Más shows count of `PENDING` delegations; accepting one decrements it and moves row to active section
- [ ] 6.4 **Manual:** `CenterTabIcon` shows initials + color ring when `isManaging`; reverts to icon after "Mi cuenta"; tap navigates to dashboard
- [ ] 6.5 **Manual:** color picker assigns color to a dependent; ring reflects immediately; persists across cold start (preferences endpoint called)
- [ ] 6.6 **Manual:** invite flow — both modes navigate correctly; 422 surfaces field error; 201 returns to `DependientesScreen` with new pending row
- [ ] 6.7 Run unit tests for schema parsing and `switchPatientContext` cleaner invocation; confirm all pass
