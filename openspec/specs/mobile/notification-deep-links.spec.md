# Mobile Notification Deep Links Specification

## Purpose

Single routing contract for push-notification taps, covering push tap while running, cold start, and in-app notification list taps. Replaces two divergent switch statements with one shared helper.

## Requirements

### Requirement: Shared navigateForNotification helper

The app MUST implement a single `navigateForNotification({ type, entityId, extra })` function as the only code path that routes a notification payload to a destination. Push-tap handling, cold-start handling, and `NotificationsScreen` MUST all call this same helper; no other routing switch MAY exist.

#### Scenario: Push tap and in-app list tap resolve identically

- GIVEN the same notification payload
- WHEN it is opened via a live push tap and, separately, via tapping the same entry in `NotificationsScreen`
- THEN both navigate to the same destination

### Requirement: Cold start handled via getLastNotificationResponseAsync

On launch, the app MUST call `getLastNotificationResponseAsync` and, if a response exists, MUST route it through `navigateForNotification` exactly once. It MUST NOT be processed again by the foreground/live listener.

#### Scenario: App killed, user taps push, opens to correct destination

- GIVEN the app was fully closed
- WHEN the user taps a push notification
- THEN the app cold-starts and navigates directly to the destination for that notification's type

#### Scenario: Cold-start notification not double-processed

- GIVEN `getLastNotificationResponseAsync` already routed a notification on launch
- WHEN the foreground listener mounts afterward
- THEN it MUST NOT route the same notification response again

### Requirement: APPOINTMENT routes to AppointmentDetail

`type === "APPOINTMENT"` MUST navigate to `AppointmentDetail` with the appointment's `entityId`.

#### Scenario: Appointment push tap opens detail

- GIVEN an APPOINTMENT notification with a valid `entityId`
- WHEN the user taps it (live, cold start, or list)
- THEN `AppointmentDetail` opens for that appointment

### Requirement: MEDICATION routes directly to the intake modal

`type === "MEDICATION"` MUST navigate to the Agenda tab with an intent that opens `MedicationIntakeModal` directly — not the medication list, not a generic inbox. The payload MUST include `day_key` and `intake_time` (plus `entity_id`/cycle id) so the modal can be constructed without waiting for cached agenda data.

#### Scenario: Medication push tap opens intake modal directly

- GIVEN a MEDICATION notification carrying `entity_id`, `day_key`, and `intake_time`
- WHEN the user taps it
- THEN `MedicationIntakeModal` opens pre-populated for that cycle/day/time
- AND the medication list or a generic screen is NOT shown first

#### Scenario: Cold start resolves modal without cached agenda data

- GIVEN the app was closed and agenda data is not yet cached
- WHEN a MEDICATION notification is tapped at cold start
- THEN the modal opens using the payload's `day_key`/`intake_time` without waiting on a cache fetch

### Requirement: CHECKIN routes via fresh already-checked-in check

`type === "CHECKIN"` MUST perform a fresh (non-cached) fetch at tap time to determine whether the user already checked in today, before choosing the destination. If not checked in, it MUST open `DailyCheckInForm`. If already checked in, it MUST show a toast and open the wellbeing list, and MUST NOT open an empty form.

#### Scenario: Not checked in today opens the form

- GIVEN the fresh fetch shows no check-in for today
- WHEN the user taps a CHECKIN notification
- THEN `DailyCheckInForm` opens

#### Scenario: Already checked in shows toast, not form

- GIVEN the fresh fetch shows a check-in already exists for today
- WHEN the user taps a CHECKIN notification
- THEN a toast is shown and the wellbeing list opens
- AND no empty form is presented

#### Scenario: Decision uses fresh data, not stale cache

- GIVEN a locally cached wellbeing query is stale (checked in status changed since last fetch)
- WHEN a CHECKIN notification is tapped
- THEN the routing decision is based on a fresh fetch, not the stale cached value
