# Delta for mobile/agenda-calendar

## ADDED Requirements

### Requirement: Medication intake modal resolvable from notification deep link

`AgendaScreen` MUST accept a medication-intake intent (in addition to `initialTab`) carrying `entity_id`/cycle id, `day_key`, and `intake_time`. When present, `AgendaScreen` MUST resolve it into opening `MedicationIntakeModal` directly, without requiring the agenda calendar's own query cache to already contain that day's data.

#### Scenario: Deep-link intent opens modal without waiting for cache

- GIVEN `AgendaScreen` receives a medication-intake intent with `entity_id`, `day_key`, and `intake_time`
- WHEN the screen mounts
- THEN `MedicationIntakeModal` opens directly using the intent's fields
- AND it does not block on `useCalendarEventsQuery` resolving first

#### Scenario: Missing required intent fields degrades gracefully

- GIVEN a medication-intake intent is missing `day_key` or `intake_time`
- WHEN `AgendaScreen` resolves the intent
- THEN it falls back to the medications list view instead of crashing or opening a malformed modal
