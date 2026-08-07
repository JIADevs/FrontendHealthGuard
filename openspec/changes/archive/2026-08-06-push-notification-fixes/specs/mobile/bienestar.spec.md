# Delta for mobile/bienestar

## MODIFIED Requirements

### Requirement: CHECKIN push routes to form or toast based on fresh check-in status

`usePushNotifications`' CHECKIN handling (via `navigateForNotification`) MUST perform a fresh (non-cached) fetch of today's check-in status before navigating. If the user has NOT checked in today, it MUST navigate to open `DailyCheckInForm`. If the user HAS already checked in today, it MUST navigate to the Agenda wellbeing list AND show a toast; it MUST NOT open an empty form.

(Previously: CHECKIN push always navigated to Agenda with `initialTab: "wellbeing"`, with no already-checked-in branch — RF-MB-24.)

#### Scenario: TabParamList deep link still applies (unchanged)

- GIVEN `TabNavigator`'s `Agenda: { initialTab?: ... }` param contract
- WHEN a CHECKIN notification resolves to the wellbeing list branch
- THEN it still navigates via `initialTab: "wellbeing"`

#### Scenario: Not checked in today opens the form

- GIVEN a fresh fetch shows no check-in recorded for today
- WHEN the user taps a CHECKIN push, cold-starts into one, or taps it from `NotificationsScreen`
- THEN `DailyCheckInForm` opens directly

#### Scenario: Already checked in today shows toast and wellbeing list

- GIVEN a fresh fetch shows a check-in already exists for today
- WHEN the user taps a CHECKIN notification (any entry point)
- THEN a toast informs the user they already checked in
- AND the wellbeing list opens
- AND no empty `DailyCheckInForm` is shown
