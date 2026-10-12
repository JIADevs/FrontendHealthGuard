# Tasks: Push Notification Fixes

## Review Workload Forecast

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: size-exception
400-line budget risk: High

~750-1000 changed lines (backend ~400, frontend ~450 incl. 3 deletions). `exception-ok` accepted — one PR, commit by unit:

1. Backend token ownership: migration, model, CRUD, firebase, service, scheduler, tests.
2. Frontend nav infra: `navigationRef`, `notificationRouting.ts`, `RootNavigator` (needs 1).
3. Intent hooks + screen wiring: `AgendaScreen`, `usePushNotifications`, `NotificationsScreen` (needs 2).
4. Logout hard-stop + stray-file cleanup (independent).

## Phase 1: Backend Implementation

- [x] 1.1 Create `alembic/versions/r7s8t9u0v012_unique_device_token.py`: dedupe keep-newest-per-token, then `UNIQUE(device_tokens.token)`. Downgrade drops constraint only.
- [x] 1.2 Modify `app/models/notification.py`: `DeviceToken.token` → `unique=True, index=True`.
- [x] 1.3 Modify `app/core/firebase.py`: add `PushResult(ok, invalid_token=False)`; FCM `UnregisteredError`/`SenderIdMismatchError` + APNs 410/`BadDeviceToken` = permanent.
- [x] 1.4 Modify `app/crud/crud_notification.py`: `register_token` → `pg_insert(...).on_conflict_do_update(index_elements=["token"], set_={user_id, device_type, created_at})`; `delete_by_tokens(db, *, tokens)`, no commit.
- [x] 1.5 Modify `app/services/notification.py`: `notify_user(..., push_data=None)` merges into payload; collect `invalid_token=True` tokens, one `delete_by_tokens` per batch.
- [x] 1.6 Modify `app/core/scheduler.py`: medication checks pass `push_data={medication_id, medication_name, scheduled_time}`.

## Phase 2: Backend Testing

- [x] 2.1 Create `tests/api/test_device_tokens.py`: reassignment, idempotent re-register, unregister, prune-on-permanent, no-prune-on-transient.
- [x] 2.2 Modify `tests/api/test_notifications.py`: assert MEDICATION `push_data` enrichment.
- [x] 2.3 Migration check: verified directly against the running dev Postgres instance — `alembic current` reports `r7s8t9u0v012 (head)`, the `uq_device_tokens_token` constraint exists (`pg_constraint` query), and zero duplicate tokens remain (`GROUP BY token HAVING COUNT(*) > 1` → empty). No dedicated pytest migration-test pattern exists elsewhere in this codebase to mirror; verification was manual SQL inspection instead of a new test file.

## Phase 3: Frontend API & Nav

- [x] 3.1 Modify `packages/api/src/endpoints.ts`: `unregisterDeviceToken(token)` → `DELETE /notifications/devices`, `params:{token}, skipPatientContext:true`.
- [x] 3.2 Modify `navigationRef.ts`: add `waitForNavigationReady(timeoutMs=2000)`, polls `isReady()` at 100ms.
- [x] 3.3 Create `notificationRouting.ts`: `NotificationRoutePayload` + `navigateForNotification(payload)`, sole routing table (5 types), `intentAt` nonce. MEDICATION carries `scheduledTime` (UTC); derives `dayKey`/`intakeTime` (Decision 4).
- [x] 3.4 Modify `RootNavigator.tsx`: type `MainTabs` params as Agenda screen+params union; export `AgendaRouteParams`.

## Phase 4: Frontend Intent Hooks

- [x] 4.1 Create `useMedicationIntakeIntent.ts`: `useQuery(getMedicationById)` derives `dayKey`/`intakeTime` from `scheduledTime`, builds `AgendaEvent` via `findIntakeForSlot`; spinner, error toast on failure (no modal).
- [x] 4.2 Create `useDailyCheckInIntent.ts`: `fetchQuery(getDailyCheckIns {today})` → `"form" | "already-done"`; toast on already-done.
- [x] 4.3 Verify `findIntakeForSlot`/`resolveCycleForDay` export from `packages/ui/src/index.ts`; add if missing.

## Phase 5: Screen Wiring & Logout

- [x] 5.1 Modify `usePushNotifications.ts`: replace tap handler with `navigateForNotification`; cold-start via `getLastNotificationResponseAsync()`+`waitForNavigationReady()`; dedupe by `notification.request.identifier`.
- [x] 5.2 Modify `NotificationsScreen.tsx`: `handleNotificationPress` delegates to `navigateForNotification` (remove dead `default: break;`).
- [x] 5.3 Modify `AgendaScreen.tsx`: read `intent`/`intentAt`, `lastHandledIntentAt` ref guard; feed intake intent to `CalendarTab`; drive `checkInFormOpen`; missing fields → medications list.
- [x] 5.4 Modify `pushTokenRegistration.ts`: export `getLastRegisteredPushToken()`, `unregisterDevicePushToken()` (fallback, timeout, state reset).
- [x] 5.5 Modify `MoreScreen.tsx` logout (`hard_stop`): busy → `unregisterDevicePushToken()` → `queryClient.clear()` → `logout()`; auth header must be present. No error toast on unregister failure (deviation from `frontend-mutation-feedback`); busy indicator required.
- [x] 5.6 Delete stray duplicates (touched paths only): `pushTokenRegistration 2.ts`, `MoreScreen 2.tsx`, `MedicationIntakeModal 2.tsx`. Other `* 2` files untouched. (already absent on disk)

## Phase 6: Verification

- [x] 6.1 Run backend pytest: `test_device_tokens.py`, `test_notifications.py` pass. Full suite regression: 163 passed, 8 failed — all 8 confirmed pre-existing (reproduced identically with this change's diff stashed): `test_calendar.py::test_get_calendar_events_with_data`, `test_medications.py::{test_create_medication,test_update_medication,test_medication_intake_flow,test_delete_intake}`, `test_treatments.py::{test_update_treatment_and_cascade,test_treatment_detail_includes_daily_checkins}`, `test_users.py::test_delegation_invite_notifies_invitee`. None touch device-token/push code.
- [ ] 6.2 Manual QA matrix (no JS runner): 5 types × 3 entry points (tap/cold-start/list) + logout-unregister + account-switch reassign + already-checked-in toast; record results.
- [x] 6.3 Runbook: documented in `design.md` § Migration/Rollout (`pg_dump -t device_tokens` before `alembic upgrade head` — dedupe is destructive, irreversible). Locally, `alembic upgrade head` already applied cleanly against the dev DB with zero duplicate tokens remaining post-migration.
