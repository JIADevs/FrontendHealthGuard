# Spec: mobile — Patient Context Switch

**Change:** dependientes  
**Domain:** mobile (`packages/stores` + `apps/mobile`)  
**Phase:** spec  
**Date:** 2026-06-23

---

## Requirements

### RF-M-CS1 — switchPatientContext with queryClient.clear() [R1 — BLOCKING]

`packages/stores` MUST export `switchPatientContext(patientId: string | null)` as the single authoritative function for changing patient context.  
The function MUST call `queryClient.clear()` on every invocation — including when returning to the manager's own account (`patientId === null`).  
No screen or component SHALL call `setPatientContext` directly for context switching; all context changes MUST go through `switchPatientContext`.

This requirement is **blocking for verify**: if `queryClient.clear()` is not called on every context change, the change cannot be merged.

#### Scenario: Cache cleared when switching to a dependent

- GIVEN the user is viewing their own data (no active context)
- WHEN `switchPatientContext("patient-abc")` is called
- THEN `queryClient.clear()` is called before or immediately after updating `activePatientId` in the store

#### Scenario: Cache cleared when returning to own account

- GIVEN `isManaging === true` (activePatientId is set)
- WHEN `switchPatientContext(null)` is called ("Mi cuenta")
- THEN `queryClient.clear()` is called and `activePatientId` becomes `null` and `isManaging` becomes `false`

#### Scenario: No stale data after patient A → patient B switch

- GIVEN the manager was viewing patient A's Appointments list
- WHEN they switch to patient B via `switchPatientContext("patient-b-id")`
- THEN Appointments, Documents, and Home screens reflect patient B's data with no residual data from patient A

### RF-M-CS2 — Cold-start resets activePatientId (R7 — Option B)

On every cold start, the auth store rehydration MUST force `activePatientId: null` and `isManaging: false`, regardless of any persisted value.  
This MUST be implemented in `onRehydrateStorage` or in the app bootstrap (`App.tsx`) before any navigation renders.  
The manager MUST always start in their own account; re-entering management mode requires navigating to Más → Dependientes.

#### Scenario: App restart clears management context

- GIVEN the user was managing a dependent before closing the app
- WHEN the app cold-starts and the store rehydrates
- THEN `activePatientId === null` and `isManaging === false` in the auth store

#### Scenario: First navigation after restart shows own data

- GIVEN cold-start resets context (RF-M-CS2)
- WHEN the Home tab renders
- THEN it shows the manager's own data (no `X-Patient-Context` header sent)

### RF-M-CS3 — Context switch entry point: Dependientes only

`switchPatientContext` MUST only be invoked from `DependientesScreen`.  
No other screen, tab, or modal SHALL trigger a context switch. The tab bar center button SHALL NOT open a patient selector or trigger a context switch.

#### Scenario: Tap on dependent card triggers context switch

- GIVEN `DependientesScreen` shows an active dependent
- WHEN the user taps the dependent's card
- THEN `switchPatientContext(dependent.dependentUserId)` is called and the user is navigated to the Home tab

#### Scenario: Tap on "Mi cuenta" exits management mode

- GIVEN `isManaging === true`
- WHEN the user taps "Mi cuenta" on `DependientesScreen`
- THEN `switchPatientContext(null)` is called and `isManaging` becomes `false`

### RF-M-CS4 — CenterTabIcon: initials and color ring

When `isManaging === true`, the center tab button MUST display the active dependent's initials and a color ring instead of the default `LayoutDashboard` icon.  
The color ring color MUST come from the manager's `delegation_context_colors` preference for that dependent; if no preference is set, a default color from the closed design-system palette MUST be used.  
Tapping the center tab MUST always navigate to `HomeScreen` (dashboard of the active context) — it MUST NOT open a patient selector or context sheet.

#### Scenario: Center tab shows initials when managing

- GIVEN `activePatientId` is set to a dependent with name "Ana García"
- WHEN the tab bar renders
- THEN the center button shows initials `"AG"` and a colored ring; the `LayoutDashboard` icon is hidden

#### Scenario: Center tab reverts to icon when not managing

- GIVEN `isManaging === false`
- WHEN the tab bar renders
- THEN the center button shows the `LayoutDashboard` icon with no color ring

#### Scenario: Tap center tab navigates to dashboard

- GIVEN `isManaging === true`
- WHEN the user taps the center tab
- THEN the app navigates to `HomeScreen` showing the active dependent's data; no selector is shown

### RF-M-CS5 — Color per dependent: closed palette and persistence

The manager MAY assign a color to each dependent from a closed design-system palette.  
The color picker MUST be accessible from `DependientesScreen` (per-card action).  
On save, the app MUST call `updateDelegationContextColors` (RF-SA-D5) with the full updated map. The color ring in `CenterTabIcon` MUST reflect the saved preference immediately after the update.

#### Scenario: Color selection persists across sessions

- GIVEN the manager assigns color `"teal"` to dependent `"patient-abc"`
- WHEN they close and reopen the app
- THEN the center tab ring still shows `"teal"` for `"patient-abc"` (loaded from preferences)

#### Scenario: Default color used before user picks

- GIVEN the manager has never set a color for a dependent
- WHEN they switch to that dependent's context
- THEN a color from the design-system default palette is used (determined by index), not null/transparent
