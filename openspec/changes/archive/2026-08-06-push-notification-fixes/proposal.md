# Proposal: Push Notification Fixes

Platform scope: **backend (BackendHealthGuard) + mobile (apps/mobile) + shared packages (api)**. Web deferred.

## Intent

Six reported push bugs collapse into two root causes: (1) `device_tokens.token` is user-scoped, non-unique and never pruned, so one physical device accumulates rows and keeps receiving pushes for old owners; (2) notification taps are routed by two divergent switch statements, and cold-start taps are never handled. Result: triple pushes, pushes after logout, previous account's pushes after switching users, and taps landing on a generic list instead of the relevant flow.

## Scope

### In Scope
- **Slice A — token ownership**: `UNIQUE(device_tokens.token)` with pre-migration dedupe, atomic upsert-on-register (reassign owner), prune on *permanent* FCM/APNs invalid-token errors, `unregisterDeviceToken` called on mobile logout.
- **Slice B — unified routing**: one `navigateForNotification({ type, entityId, extra })` helper shared by push tap, cold start (`getLastNotificationResponseAsync`), and `NotificationsScreen`; backend enriches MEDICATION payload with `medication_id`, `medication_name`, `scheduled_time`.
- Remove stray `* 2.ts(x)` duplicate files in touched paths.

### Out of Scope
- Local `scheduleNotificationAsync` reminders
- Notification-center redesign beyond routing alignment
- `apps/web`

## Locked Product Rules

| Rule | Decision |
|---|---|
| Logout | `hard_stop` — zero pushes to that device until next login |
| Account switch | `strict_reassign` — token moves to new user on login; old user stops immediately |
| APPOINTMENT tap | `AppointmentDetail` |
| MEDICATION tap | Medication intake flow (not inbox, not list) |
| CHECKIN tap | Daily check-in form directly |
| CHECKIN, already done today | Toast + wellbeing list (no empty form) |

## Capabilities

### New Capabilities
- `shared-api/push-token-ownership`: device-scoped token lifecycle — register, reassign, prune, unregister, and logout semantics.
- `mobile/notification-deep-links`: single routing contract covering push tap, cold start, and in-app list.

### Modified Capabilities
- `mobile/agenda-calendar`: medication intake modal must be reachable from a notification deep link.
- `mobile/bienestar`: check-in form reachable from a deep link, plus the already-checked-in toast path.

## Approach

The backend owns token identity (unique constraint + upsert + prune) so correctness never depends on the client succeeding at logout; the mobile unregister call is a best-effort accelerator, not the guarantee. Pruning fires only on permanent errors (`UNREGISTERED`, `SenderIdMismatch`, APNs `BadDeviceToken`/410), never on timeouts.

On mobile, three tap paths collapse into one helper. Intake and check-in are modals inside the Agenda tab, not stack screens, so the helper navigates with an intent param (`initialTab` + intent + entity refs) that `AgendaScreen` resolves into the right modal.

## Affected Areas

| Area | Impact | Description |
|---|---|---|
| `app/models/notification.py` | Modified | `UNIQUE(token)` on `DeviceToken` |
| `alembic/versions/` | New | Dedupe existing rows, then add constraint |
| `app/crud/crud_notification.py` | Modified | `ON CONFLICT (token) DO UPDATE` reassign |
| `app/core/firebase.py` | Modified | Surface permanent invalid-token signal |
| `app/services/notification.py` | Modified | Prune on invalid token; enrich MEDICATION payload |
| `packages/api/src/endpoints.ts` | Modified | Add `unregisterDeviceToken(token)` |
| `apps/mobile/src/services/pushTokenRegistration.ts` | Modified | Expose current token for logout |
| `apps/mobile/src/screens/MoreScreen.tsx` | Modified | Unregister before `logout()` |
| `apps/mobile/src/hooks/usePushNotifications.ts` | Modified | Shared helper + cold-start handling |
| `apps/mobile/src/screens/NotificationsScreen.tsx` | Modified | Reuse shared helper |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modified | Resolve deep-link intent into modal |

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Migration fails on existing duplicate tokens | High | Dedupe step in same migration: keep newest row per token |
| Pruning good tokens on transient errors | Med | Prune only on enumerated permanent error codes |
| Intake modal needs a full `AgendaEvent`, push carries only `cycle_id` | High | Enriched payload + client-side resolution against agenda data; settled in design |
| Logout unregister fails offline | Med | Server-side reassign-on-register is the real guarantee |
| Editing stray `* 2.tsx` copies by mistake | Med | Delete duplicates in touched paths first |

## Rollback Plan

Slices are independent. Slice B: revert mobile commits — routing falls back to the current generic behavior, no data impact. Slice A: revert application code first (restores previous send/register behavior); the unique constraint can stay safely, or run `alembic downgrade` to drop it. The migration's dedupe step is destructive — snapshot `device_tokens` before applying.

## Dependencies

- Production `device_tokens` snapshot before migration.
- FCM/APNs permanent-error codes confirmed against the installed `firebase-admin` version.

## Success Criteria

- [ ] One logical event produces exactly one push per physical device.
- [ ] After logout, the device receives zero pushes until next login.
- [ ] After user B logs in on user A's device, only B receives pushes.
- [ ] APPOINTMENT / MEDICATION / CHECKIN taps land on the same destination from push tap, cold start, and in-app list.
- [ ] CHECKIN tap when already checked in shows a toast and the wellbeing list.
- [ ] Tests cover reassignment, pruning on permanent error, and the unique constraint.

## Open Questions

1. Medication intake deep link needs a resolvable agenda event; confirm whether the client resolves it from already-cached agenda data or the payload must carry `day_key` + `intake_time` explicitly.
2. Source of truth for "already checked in today" at tap time — cached wellbeing query vs. fresh fetch before deciding form vs. toast.
