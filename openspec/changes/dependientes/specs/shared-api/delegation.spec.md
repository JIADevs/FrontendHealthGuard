# Spec: shared-api — Delegation API Layer

**Change:** dependientes  
**Domain:** shared-api (`packages/api`)  
**Phase:** spec  
**Date:** 2026-06-23

---

## Requirements

### RF-SA-D1 — DelegationStatus enum

`@helu/api` MUST export `DelegationStatusSchema = z.enum(["PENDING", "ACTIVE", "REJECTED", "REVOKED"])`.  
All four values MUST be present; omitting `REVOKED` would cause a parse failure on revoke responses (R3 mitigation).

#### Scenario: REVOKED parses without error

- GIVEN the backend returns a delegation record with `status: "REVOKED"`
- WHEN `DelegationStatusSchema.parse(data.status)` is called
- THEN parsing succeeds and returns the string `"REVOKED"` with no `ZodError`

### RF-SA-D2 — DependentDelegationSchema and ManagerDelegationSchema

`@helu/api` MUST export:
- `DependentDelegationSchema` — represents a user the manager governs (`id`, `dependentUserId`, `linkedUserEmail`, `status: DelegationStatus`, `permissions`, `createdAt`).
- `ManagerDelegationSchema` — represents a user who governs the current user (same fields, perspective inverted).

#### Scenario: Schema rejects unknown status

- GIVEN the backend returns `status: "EXPIRED"` (not in enum)
- WHEN the schema parses the response
- THEN a `ZodError` is thrown, alerting the team to backend drift

### RF-SA-D3 — DelegationRequestSchema (invite payload)

`@helu/api` MUST export `DelegationRequestSchema` with fields `email: z.string().email()`, `relationship: z.enum(["I_WANT_TO_MANAGE_THEM", "THEY_WILL_MANAGE_ME"])`, and `permissions: z.literal("FULL_ACCESS")`.  
`permissions` MUST be locked to `"FULL_ACCESS"` — the client SHALL NOT send `"READ_ONLY"` under any condition (R2 mitigation).

#### Scenario: Request payload always contains FULL_ACCESS

- GIVEN the user submits an invitation form
- WHEN `createDelegation(payload)` is called
- THEN the HTTP body sent to `POST /users/me/delegations` contains `"permissions": "FULL_ACCESS"`

### RF-SA-D4 — Five delegation endpoint functions

`@helu/api` MUST export:

| Function | Method | Path | Returns |
|---|---|---|---|
| `createDelegation(payload)` | POST | `/users/me/delegations` | `DependentDelegation \| ManagerDelegation` |
| `getManagedUsers()` | GET | `/users/me/delegations/managed` | `DependentDelegation[]` |
| `getManagers()` | GET | `/users/me/delegations/managers` | `ManagerDelegation[]` |
| `respondDelegation(id, action)` | PATCH | `/users/me/delegations/{id}/status?action=accept\|reject` | updated delegation |
| `revokeDelegation(id)` | DELETE | `/users/me/delegations/{id}` | `void` |

Each function MUST validate its response with the corresponding Zod schema.

#### Scenario: revokeDelegation calls DELETE

- GIVEN a delegation with a known `id`
- WHEN `revokeDelegation(id)` is called
- THEN a `DELETE /users/me/delegations/{id}` request is issued and no response body is expected

### RF-SA-D5 — updateDelegationContextColors endpoint

`@helu/api` MUST export `updateDelegationContextColors(colors: Record<string, string>): Promise<void>` calling `PUT /users/me/preferences/delegation_context_colors`.

#### Scenario: Color map is persisted to backend

- GIVEN the manager has selected color `"teal"` for dependent id `"abc-123"`
- WHEN `updateDelegationContextColors({ "abc-123": "teal" })` is called
- THEN a `PUT /users/me/preferences/delegation_context_colors` request is issued with that map

### RF-SA-D6 — Five TanStack Query hooks

`@helu/api` MUST export:

| Hook | Type | Key |
|---|---|---|
| `useManagedUsersQuery()` | `useQuery` | `["delegations", "managed"]` |
| `useManagersQuery()` | `useQuery` | `["delegations", "managers"]` |
| `useCreateDelegationMutation()` | `useMutation` | — |
| `useRespondDelegationMutation()` | `useMutation` | — |
| `useRevokeDelegationMutation()` | `useMutation` | — |

`useCreateDelegationMutation`, `useRespondDelegationMutation`, and `useRevokeDelegationMutation` MUST each call `queryClient.invalidateQueries({ queryKey: ["delegations"] })` in `onSuccess`.

#### Scenario: Respond mutation invalidates delegation queries

- GIVEN `useRespondDelegationMutation` completes with `action=accept`
- WHEN `onSuccess` fires
- THEN `["delegations"]` queries are invalidated and both managed and managers lists refetch on next access

#### Scenario: 422 from createDelegation surfaces fieldErrors

- GIVEN `POST /users/me/delegations` returns HTTP 422
- WHEN the Axios interceptor runs `parseApiError`
- THEN `error.status === 422` and `error.fieldErrors` contains actionable field-level messages

### RF-SA-D7 — No business logic in endpoint functions

Per `api-integration` skill convention, endpoint functions MUST contain only API calls and Zod validation. Business logic belongs in feature hooks or components.
