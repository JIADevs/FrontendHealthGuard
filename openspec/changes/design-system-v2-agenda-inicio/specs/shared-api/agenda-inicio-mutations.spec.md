# Spec: shared-api — Agenda and Inicio mutations

**Change:** design-system-v2-agenda-inicio
**Domain:** shared-api (`packages/api`)
**Phase:** spec
**Date:** 2026-11-20
**Source:** proposal and `design.md` of this change. Issue #35, phase 1.

## Requirements

### RF-API-AI1 — Dose logging is optimistic

`useConfirmIntakeMutation` and `useRecordIntakeMutation` MUST update every TanStack Query cache whose key starts with `medications` or `calendar` inside `onMutate`. The patch MUST insert a `MedicationIntake` on the matching `MedicationCycle`. `onError` MUST restore the snapshot taken before the patch. `onSettled` MUST invalidate the `medications` and `calendar` families.

`confirmIntake` MUST stay the one-tap path and MUST POST `taken_at` at the current time. `recordIntake` MUST stay the path for `NOT_TAKEN` and for a custom `takenAt`. This change MUST NOT add an endpoint.

#### Scenario: One tap records a taken dose
- GIVEN a pending dose for a cycle that is already in the medications or calendar cache
- WHEN the user triggers `useConfirmIntakeMutation`
- THEN that cycle shows a `TAKEN` intake before the response returns
- AND a failed response restores the previous cache

#### Scenario: Not taken stores the reason
- GIVEN a pending dose
- WHEN `useRecordIntakeMutation` runs with `status: "NOT_TAKEN"` and a `notTakenReason` of `FORGOT`, `NOT_PURCHASED`, or `OTHER`
- THEN the cached intake carries that status and reason
- AND a failed response restores the previous cache

### RF-API-AI2 — Check-in row is optimistic, streak is not

`useCreateDailyCheckInMutation` MUST insert the day's check-in into the `daily-checkins` and `calendar` caches inside `onMutate`, and MUST restore them on error. It MUST NOT change `UserProfile.currentStreak` inside `onMutate`. On success it MUST invalidate `me`, `treatments`, `daily-checkins`, and `calendar`, as it does today.

#### Scenario: The day updates before the streak
- GIVEN today has no check-in
- WHEN the user saves a mood
- THEN today's check-in appears in the cache before the response
- AND the streak number changes only after a successful response
- AND a failed response removes the temporary check-in and does not show the success toast

### RF-API-AI3 — Revoking a delegation waits for the server

`useRevokeDelegationMutation` MUST NOT change the cache inside `onMutate`. It MUST invalidate `delegationKeys.all()` on settle. `useUpdateDelegationColorsMutation` MUST stay optimistic.

#### Scenario: A rejected revoke leaves the row
- GIVEN a delegation is visible in the list
- WHEN revoke fails
- THEN the row is still in the list

#### Scenario: A successful revoke removes the row after the response
- GIVEN a delegation is visible in the list
- WHEN revoke succeeds
- THEN the row disappears only after the mutation settles and the list is refreshed
