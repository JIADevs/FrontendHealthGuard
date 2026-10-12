# Spec: mobile — Dependientes Screen & Invite Flow

**Change:** dependientes  
**Domain:** mobile (`apps/mobile`)  
**Phase:** spec  
**Date:** 2026-06-23

---

## Requirements

### RF-M-D1 — DependientesScreen sections

`DependientesScreen` MUST render three sections:
1. **"Personas que gestiono"** — list of `DependentDelegation` where `status === "ACTIVE"`.
2. **"Quién gestiona mi cuenta"** — list of `ManagerDelegation` where `status === "ACTIVE"`.
3. **"Solicitudes pendientes"** — delegations where `status === "PENDING"` (both directions).

Sections with no items MUST show an empty-state message. The screen MUST call `useFocusEffect` to refetch both `useManagedUsersQuery` and `useManagersQuery` on every focus.

#### Scenario: Empty state when no delegations exist

- GIVEN the user has no active delegations or pending requests
- WHEN `DependientesScreen` mounts
- THEN all three sections show their respective empty-state copy and no list rows are rendered

#### Scenario: Pending requests appear in dedicated section

- GIVEN the user has one incoming `PENDING` delegation
- WHEN `DependientesScreen` receives focus
- THEN the pending section shows that delegation with accept and reject actions visible

### RF-M-D2 — Accept and reject actions

The user MUST be able to accept or reject a `PENDING` invitation from within `DependientesScreen`.  
Tapping accept MUST call `useRespondDelegationMutation` with `action="accept"`; tapping reject MUST call it with `action="reject"`.  
On success, the invitation row MUST disappear from "Solicitudes pendientes" after invalidation.

#### Scenario: Accept moves invitation to active section

- GIVEN a `PENDING` delegation is visible in the pending section
- WHEN the user taps "Aceptar"
- THEN the row disappears from pending and the delegation appears in the corresponding active section after refetch

#### Scenario: Reject removes invitation

- GIVEN a `PENDING` delegation is visible
- WHEN the user taps "Rechazar"
- THEN the row disappears and is no longer present in any section

### RF-M-D3 — Revoke action

The user MUST be able to revoke an `ACTIVE` delegation from `DependientesScreen`.  
Tapping revoke MUST call `useRevokeDelegationMutation`. On success, the row MUST be removed from the active section after invalidation.

#### Scenario: Revoke removes active delegation

- GIVEN an active delegation row is displayed
- WHEN the user confirms revocation
- THEN `DELETE /users/me/delegations/{id}` is called and the row disappears from the list

### RF-M-D4 — Single Invitar button + DelegationInviteModeSheet

`DependientesScreen` MUST show a single "Invitar" button. Tapping it MUST open `DelegationInviteModeSheet`, which presents two options:
- **"Invitar dependiente"** → `relationship: "I_WANT_TO_MANAGE_THEM"`
- **"Invitar cuidador"** → `relationship: "THEY_WILL_MANAGE_ME"`

After selecting a mode, the app MUST navigate to `DependientesInviteScreen` with the mode pre-filled.

#### Scenario: Mode sheet opens from Invitar button

- GIVEN the user is on `DependientesScreen`
- WHEN they tap "Invitar"
- THEN `DelegationInviteModeSheet` slides up from the bottom with both options visible

#### Scenario: Choosing a mode navigates to invite screen

- GIVEN `DelegationInviteModeSheet` is open
- WHEN the user selects "Invitar dependiente"
- THEN the app navigates to `DependientesInviteScreen` with `relationship` pre-set to `"I_WANT_TO_MANAGE_THEM"`

### RF-M-D5 — DependientesInviteScreen email form

`DependientesInviteScreen` MUST collect the invitee's email address. On submit it MUST call `useCreateDelegationMutation` with `{ email, relationship, permissions: "FULL_ACCESS" }`. A loading indicator MUST be shown during the pending mutation state. On success, the screen MUST navigate back to `DependientesScreen`.

#### Scenario: Successful invite navigates back

- GIVEN the user enters a valid email and taps "Enviar"
- WHEN the backend responds 201
- THEN the user is returned to `DependientesScreen` and the new pending row is visible after refetch

#### Scenario: Invalid email shows validation error

- GIVEN the user enters a malformed email
- WHEN they attempt to submit
- THEN a field-level error is shown and no API call is made

### RF-M-D6 — Badge in MoreScreen for pending invitations

`MoreScreen` MUST display a numeric badge on the "Dependientes" menu item when there are `PENDING` delegations awaiting the user's response.  
The badge count MUST update on screen focus via refetch. The badge MUST disappear when no pending delegations remain.

#### Scenario: Badge appears with pending invitations

- GIVEN the user has one incoming pending delegation
- WHEN they navigate to MoreScreen
- THEN the "Dependientes" item shows a badge with count `1`

#### Scenario: Badge disappears after responding

- GIVEN the badge shows count `1`
- WHEN the user accepts or rejects the invitation and returns to MoreScreen
- THEN the badge is no longer visible

### RF-M-D7 — Component placement

All reusable UI components (delegation cards, `DelegationInviteModeSheet`, color picker) MUST live in `apps/mobile/src/components/dependientes/` and be exported via `index.ts`. Screens MUST only compose these components — no layout logic in screen files.
