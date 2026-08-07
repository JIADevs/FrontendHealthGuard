# Design: Push Notification Fixes

## Technical Approach

Two slices, one change. **Slice A** makes the backend the owner of push-token identity: `UNIQUE(device_tokens.token)` + atomic upsert-reassign + prune on permanent provider errors, with mobile logout-unregister as a best-effort accelerator. **Slice B** collapses three divergent tap paths into one `navigateForNotification` helper (push tap, cold start, in-app list) and enriches the MEDICATION payload so the intake modal opens without relying on cached agenda data.

## Architecture Decisions

| # | Decision | Alternatives rejected | Rationale |
|---|---|---|---|
| 1 | `UNIQUE(token)` + dedupe-in-migration (keep newest row per token) | Composite `UNIQUE(user_id, token)`; app-level check | A push token is a device property. Composite key permits the exact duplicate that causes bugs #2/#3. App-level check is racy (current `SELECT`-then-`INSERT`). |
| 2 | `ON CONFLICT (token) DO UPDATE SET user_id, device_type, created_at` | Delete-then-insert | Single atomic statement; enforces `strict_reassign` even if user A never logged out. |
| 3 | Prune only on enumerated permanent errors | Prune on any send failure; TTL sweep | Timeouts and FCM outages must never delete a live token. |
| 4 | MEDICATION payload carries `scheduled_time` (ISO-8601 UTC instant); client derives `day_key` + `intake_time` in device-local time | Backend computes `day_key`/`intake_time` | **Deviation from locked decision 1, deliberate.** Agenda slots are generated client-side in device-local time. A 20:00 local dose is 01:00 UTC *the next day*, so a server-computed `day_key` would open the wrong day and miss the slot. Server-side derivation would require a `users.timezone` column (not in scope). Payload still carries everything needed — no cache dependency. |
| 5 | One `navigateForNotification` on `navigationRef` | Injecting each screen's `navigation` object | Same navigation container everywhere; a single implementation is the point of the fix. |
| 6 | Deep-link intent as Agenda tab params + `intentAt` nonce | New `MedicationIntake` / `CheckIn` stack screens | Locked decision 5: both are Agenda modals. The nonce lets a second identical push reopen the modal while a re-render does not. |
| 7 | CHECKIN tap does a fresh `fetchQuery` before choosing form vs. toast | Read the TanStack cache | Locked decision 2. Cache may be cold on cold start or stale after a check-in on another device. |
| 8 | Logout shows a busy state but no toast on unregister failure | Error toast on failed unregister | Logout always succeeds locally; the server-side reassign is the real guarantee. Telling the user "logout failed" would be wrong. Documented deviation from `frontend-mutation-feedback`. |
| 9 | Cold start via `waitForNavigationReady()` poll util in `navigationRef.ts` | `NavigationContainer.onReady` wiring in `App.tsx` | Keeps the hook self-contained and unit-testable; no app-shell coupling. |

## Data Flow

**Token lifecycle (Slice A)**

    login B on A's device
      └─ registerDevicePushToken ──→ POST /notifications/devices
                                       └─ ON CONFLICT (token) DO UPDATE user_id=B
                                            → A's row is gone; only B receives pushes

    scheduler → notify_user → send_push_notification ──→ PushResult{ok, invalid_token}
                                       │
                    invalid_token=True ┴──→ collect → delete_by_tokens (same txn)

    logout → unregisterDevicePushToken (best effort, auth header still valid)
             → queryClient.clear() → logout()

**Notification tap (Slice B)**

    push tap ────────┐
    cold start ──────┼──→ navigateForNotification({type, entityId, extra})
    NotificationsScreen ┘        │
                                 ├─ APPOINTMENT*      → AppointmentDetail {id}
                                 ├─ MEDICATION*       → MainTabs>Agenda {initialTab:"calendar", intent:"medication-intake", …}
                                 ├─ CHECKIN           → MainTabs>Agenda {initialTab:"wellbeing", intent:"daily-checkin"}
                                 ├─ DELEGATION_INVITE → Dependientes
                                 └─ SYSTEM/INFO/*     → Notifications

    AgendaScreen resolves intent:
      medication-intake → getMedicationById(medicationId) → build AgendaEvent
                          {data, cycleId, dayKey, intakeTime, intake: findIntakeForSlot(...)}
                          → <MedicationIntakeModal event />
      daily-checkin     → fetchQuery(getDailyCheckIns today) →
                          exists ? Toast + wellbeing list : <DailyCheckInForm />

## File Changes

### BackendHealthGuard

| File | Action | Description |
|---|---|---|
| `alembic/versions/r7s8t9u0v012_unique_device_token.py` | Create | `down_revision = "p1q2r3s4t011"` (current head). Dedupe: `DELETE FROM device_tokens a USING device_tokens b WHERE a.token = b.token AND (a.created_at, a.id) < (b.created_at, b.id)`. Then `create_unique_constraint("uq_device_tokens_token", …, ["token"])`. Downgrade drops the constraint only — dedupe is irreversible. |
| `app/models/notification.py` | Modify | `DeviceToken.token`: `unique=True, index=True`. |
| `app/crud/crud_notification.py` | Modify | `register_token` → `pg_insert(...).on_conflict_do_update(index_elements=["token"], set_={user_id, device_type, created_at})...returning()`. Add `delete_by_tokens(db, *, tokens)` — no commit (caller owns the txn, scheduler uses `begin_nested`). |
| `app/core/firebase.py` | Modify | Return `PushResult(ok: bool, invalid_token: bool)` instead of `str \| None`. FCM permanent: `messaging.UnregisteredError`, `messaging.SenderIdMismatchError`. APNs permanent: HTTP 410, or 400 with reason `BadDeviceToken` / `DeviceTokenNotForTopic`. Everything else → `invalid_token=False`. |
| `app/services/notification.py` | Modify | `notify_user` gains `push_data: dict \| None = None` merged into the base payload. Dispatch loop collects tokens whose `PushResult.invalid_token` is true, then one `delete_by_tokens` call. |
| `app/core/scheduler.py` | Modify | `check_medications` / `check_medication_followups` pass `push_data={"medication_id", "medication_name", "scheduled_time": start.isoformat()}`. |
| `tests/api/test_device_tokens.py` | Create | Reassignment, idempotent re-register, unregister, prune-on-permanent, no-prune-on-transient. |
| `tests/api/test_notifications.py` | Modify | Assert MEDICATION `push_data` enrichment. |

### FrontendHealthGuard

| File | Action | Description |
|---|---|---|
| `packages/api/src/endpoints.ts` | Modify | `unregisterDeviceToken(token)` → `DELETE /notifications/devices` with `params: { token }` and `skipPatientContext: true`. |
| `apps/mobile/src/navigation/navigationRef.ts` | Modify | Add `waitForNavigationReady(timeoutMs = 2000)` — polls `navigationRef.isReady()` at 100 ms. |
| `apps/mobile/src/navigation/notificationRouting.ts` | Create | `NotificationRoutePayload` type + `navigateForNotification(payload)`. Sole owner of the type→destination table. Adds `intentAt: Date.now()` to Agenda intents. |
| `apps/mobile/src/navigation/RootNavigator.tsx` | Modify | Type `MainTabs` params: `{ screen: "Agenda"; params: AgendaRouteParams } \| undefined`; export `AgendaRouteParams` (`initialTab`, `intent`, `intentAt`, `cycleId`, `medicationId`, `medicationName`, `scheduledTime`). |
| `apps/mobile/src/hooks/usePushNotifications.ts` | Modify | Replace local `handleNotificationTap` with the helper. Add cold-start effect: `getLastNotificationResponseAsync()` after `waitForNavigationReady()`, guarded by a `coldStartHandled` ref. Track handled `notification.request.identifier` so the live listener doesn't double-navigate. |
| `apps/mobile/src/screens/NotificationsScreen.tsx` | Modify | `handleNotificationPress` delegates to the helper (removes the `default: break;` dead end). |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modify | Read `intent`/`intentAt` from route; `lastHandledIntentAt` ref guards single consumption. Pass intake intent into `CalendarTab`; drive `checkInFormOpen` from the check-in intent. |
| `apps/mobile/src/hooks/useMedicationIntakeIntent.ts` | Create | `useQuery(getMedicationById)` → derives `dayKey`/`intakeTime` from `scheduledTime` in local time → builds the `AgendaEvent`. Spinner while loading; error toast + no modal on failure. |
| `apps/mobile/src/hooks/useDailyCheckInIntent.ts` | Create | `fetchQuery(getDailyCheckIns {startDate: today, endDate: today})`; returns `"form" \| "already-done"`; toast on `already-done`. |
| `apps/mobile/src/services/pushTokenRegistration.ts` | Modify | Export `getLastRegisteredPushToken()` and `unregisterDevicePushToken()` (falls back to `getDevicePushTokenAsync()` when the in-memory value is null; best-effort with timeout; resets state). |
| `apps/mobile/src/screens/MoreScreen.tsx` | Modify | Logout: busy state → `await unregisterDevicePushToken()` → `queryClient.clear()` → `logout()`. Order matters: the auth header must still be present. |
| `apps/mobile/src/services/pushTokenRegistration 2.ts` | Delete | Stray duplicate in a touched path. |
| `apps/mobile/src/screens/MoreScreen 2.tsx` | Delete | Stray duplicate in a touched path. |
| `apps/mobile/src/components/agenda/MedicationIntakeModal 2.tsx` | Delete | Stray duplicate in a touched path. |

Only these three `* 2` duplicates sit in touched paths; the rest of the repo's duplicates stay untouched. Verify `findIntakeForSlot` / `resolveCycleForDay` are re-exported from `packages/ui/src/index.ts`; add the re-export if missing.

## Interfaces / Contracts

```python
# app/core/firebase.py
@dataclass(frozen=True)
class PushResult:
    ok: bool
    invalid_token: bool = False   # True only for enumerated permanent errors
```

```ts
// apps/mobile/src/navigation/notificationRouting.ts
export interface NotificationRoutePayload {
  type: string;
  entityId?: string | null;      // appointment id | medication cycle id
  medicationId?: string | null;
  medicationName?: string | null;
  scheduledTime?: string | null; // ISO-8601 UTC; client derives dayKey + intakeTime
}
export function navigateForNotification(payload: NotificationRoutePayload): void;
```

Push `data` keys stay snake_case (FCM stringifies everything); the mobile helper normalizes at the boundary.

## Testing Strategy

| Layer | What | Approach |
|---|---|---|
| Unit (backend) | Permanent vs. transient error classification | pytest, fake `messaging.UnregisteredError` and a timeout |
| Integration (backend) | Reassign on register; idempotent re-register; unregister; prune on permanent; no prune on transient | pytest-asyncio against the test DB, `tests/api/test_device_tokens.py` |
| Integration (backend) | MEDICATION `push_data` enrichment | Monkeypatch `send_push_notification`, assert payload keys |
| Migration | Dedupe keeps exactly the newest row per token | Seed duplicates, run `alembic upgrade head`, assert one row + constraint present |
| Mobile | Routing table, cold start, intent resolution | **No JS test runner exists in this repo** — manual QA matrix: 5 types × 3 entry points (push tap, cold start, in-app list), plus logout, account switch, and already-checked-in |

## Migration / Rollout

1. Snapshot `device_tokens` in production (`pg_dump -t device_tokens`) — the dedupe step is destructive and not reversible.
2. `alembic upgrade head`. Constraint creation fails loudly if dedupe missed a case; the transaction rolls back cleanly.
3. Deploy backend, then the mobile build. Order matters only for payload enrichment: an old client ignores unknown `data` keys, and a new client falls back to the Notifications screen when `scheduled_time` is absent.
4. Rollback: revert application code first. The unique constraint can safely stay; `alembic downgrade -1` drops it but cannot restore deduped rows.

## Open Questions

- [ ] Confirm `firebase-admin` in `requirements.txt` exposes `messaging.SenderIdMismatchError` (present since 5.x) before relying on it in the classifier.
- [ ] Decision 4 deviates from the locked "payload carries day_key + intake_time". Confirm the client-side derivation is acceptable, or accept a `users.timezone` column as a prerequisite.
