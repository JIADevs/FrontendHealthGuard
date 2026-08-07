## Exploration: push-notification-fixes

### Current State

**Dedupe already exists at the logical-event level.** `NotificationService.notify_user` (`BackendHealthGuard/app/services/notification.py`) accepts a `dedupe_key` and reserves it via `NotificationDispatch` (unique `dedupe_key` column, migration `8f1c2d4e9b77`) before persisting/sending. All scheduler jobs (`app/core/scheduler.py`) already pass a `dedupe_key` per cycle/date. So "1 logical event → 1 `notify_user` call" is solved. The remaining bugs are about **fan-out to device tokens** and **client-side routing**, not duplicate scheduling.

**Device token lifecycle has no ownership guarantee.** `DeviceToken` (`app/models/notification.py`) has no unique constraint on `token` — only `(user_id, token)` is checked, non-atomically (`SELECT` then `INSERT`, no `ON CONFLICT`) in `CRUDDeviceToken.register_token` (`app/crud/crud_notification.py`). A push token is a property of a *physical device*, not a user, so:
- The same token can end up stored under two different `user_id` rows (old user + new user) — this is exactly what causes bugs #2 and #3.
- Nothing ever prunes a token: FCM `UNREGISTERED`/invalid-token errors from `_send_fcm` (`app/core/firebase.py`) are caught and logged, never used to delete the row. A user who reinstalls the app or has an old token rotate keeps accumulating token rows that all still get a send attempt for every future logical event — this is bug #1 ("stale tokens").

**Logout never calls the backend.** `DELETE /notifications/devices` exists and works (`app/api/api_v1/endpoints/notifications.py`), and `registerDeviceToken` exists client-side (`packages/api/src/endpoints.ts`), but there is **no `unregisterDeviceToken` function** in `endpoints.ts` and `MoreScreen.tsx`'s logout handler (line ~92) only does `queryClient.clear(); logout();` — the device token is never revoked server-side. `resetDevicePushTokenRegistration()` only clears an in-memory JS variable (`pushTokenRegistration.ts`) so the *next* login on the same device re-registers cleanly client-side, but the *old* user's row survives in `device_tokens` forever (bug #2), and if a different user logs in on the same physical device, both rows now share the same token value (bug #3).

**Tap routing is inconsistent between two code paths that should behave identically:**
- Push tap handler `handleNotificationTap` (`apps/mobile/src/hooks/usePushNotifications.ts`, ~line 70): `CHECKIN` and `DELEGATION_INVITE` deep-link correctly; `APPOINTMENT`/`MEDICATION`/`SYSTEM`/`INFO` all fall through to a generic `navigateTo("Notifications")` — no entity-specific deep link at all.
- In-app notification list tap `handleNotificationPress` (`apps/mobile/src/screens/NotificationsScreen.tsx`, ~line 95): `DELEGATION_INVITE` and `CHECKIN` navigate correctly; `APPOINTMENT`/`MEDICATION`/`SYSTEM`/`INFO` hit `default: break;` — literally does nothing.
- `AppointmentDetail: { id }` screen exists and is reachable elsewhere in the app with just an id (`RootNavigator.tsx`) — trivial to wire for `APPOINTMENT` since `entity_id` sent by the backend for that type is the appointment id (`scheduler.py` `check_appointments`/`check_appointment_followups`).
- `MEDICATION`/`MEDICATION_FOLLOWUP` pushes carry `entity_id = cycle.id` (medication **cycle**, not medication), but the natural landing screen `CycleDetail` requires `{ cycleId, medicationId, medicationName }` (`RootNavigator.tsx`, `CycleDetailScreen.tsx`) — medicationId/medicationName aren't derivable from the push payload today. The backend already loads `cycle.medication` in the scheduler (`cycle.medication.user_id`), so enriching the push `data` payload with `medication_id`/`medication_name` is cheap and avoids an extra client-side fetch-before-navigate step.

**No cold-start handling.** `getLastNotificationResponseAsync` is never called anywhere in the mobile app (verified via search). Only the two live listeners (`addNotificationReceivedListener`, `addNotificationResponseReceivedListener`) are registered in `usePushNotifications`. A push tapped while the app was fully killed is delivered to the OS, opens the app, but the JS-side response listener is attached too late to see the response that launched the app — so the tap silently does nothing (falls back to default screen) instead of deep-linking.

### Affected Areas

**Backend (`BackendHealthGuard/`)**
- `app/models/notification.py` — `DeviceToken` needs a unique constraint on `token` (device-owns-token, not user-owns-token) to make reassignment atomic; new Alembic migration required.
- `app/crud/crud_notification.py` — `CRUDDeviceToken.register_token` needs an atomic upsert (`ON CONFLICT (token) DO UPDATE SET user_id=..., device_type=...`) so registering an existing physical token to a new user **reassigns** it instead of creating a duplicate row under the old owner.
- `app/core/firebase.py` — `_send_fcm`/`_send_apns` need to surface a structured "token invalid" signal (catch `firebase_admin.messaging.UnregisteredError`/`SenderIdMismatchError` for FCM; APNs `BadDeviceToken`/410 status for APNs) instead of swallowing all exceptions identically.
- `app/services/notification.py` — `notify_user`'s dispatch loop (step 5) needs to call a prune step when `send_push_notification` reports an invalid token.
- `app/api/api_v1/endpoints/notifications.py` — `DELETE /notifications/devices` already exists and needs no change; confirm it's called by the client on logout.
- `alembic/versions/` — one new migration for the unique constraint on `device_tokens.token` (must also decide/handle any existing duplicate rows in production data before applying it).

**Mobile (`FrontendHealthGuard/apps/mobile`, `packages/*`)**
- `packages/api/src/endpoints.ts` — add `unregisterDeviceToken(token)` calling `DELETE /notifications/devices?token=...` (mirrors `registerDeviceToken`, needs `skipPatientContext: true` too).
- `apps/mobile/src/services/pushTokenRegistration.ts` — expose the last-registered token (or a getter) so the logout flow can pass it to `unregisterDeviceToken`; keep `resetDevicePushTokenRegistration()` for the in-memory reset.
- `apps/mobile/src/screens/MoreScreen.tsx` — logout handler must await `unregisterDeviceToken(currentToken)` (best-effort, non-blocking on failure) before/alongside `logout()`.
- `apps/mobile/src/hooks/usePushNotifications.ts` — needs (a) a shared `navigateForNotificationType(type, entityId, extra?)` helper usable by both the push handler and the notification list, (b) a cold-start check via `Notifications.getLastNotificationResponseAsync()` run once after `navigationRef` is ready.
- `apps/mobile/src/screens/NotificationsScreen.tsx` — `handleNotificationPress` should call the same shared routing helper for `APPOINTMENT`/`MEDICATION` instead of `break`.
- `apps/mobile/src/navigation/RootNavigator.tsx` / `CycleDetailScreen.tsx` — no structural change expected if backend enriches payload with `medicationId`/`medicationName`; otherwise CycleDetailScreen would need to tolerate fetching by cycleId alone (bigger change).
- Note: stray duplicate files exist in the repo (e.g. `pushTokenRegistration 2.ts`, `MoreScreen 2.tsx`, `MedicationIntakeModal 2.tsx`) — these look like accidental copies (space + "2" suffix), not real platform variants. Flag for cleanup so edits don't accidentally land in the wrong (stale) copy.

### Approaches

#### Bug #1 — Triple identical pushes (stale tokens)

1. **DB-level uniqueness + FCM-error-driven pruning** — add `UNIQUE(token)` on `device_tokens`, upsert on register (reassigns ownership atomically), and delete the row whenever FCM/APNs reports the token as invalid/unregistered.
   - Pros: fixes root cause (both duplicate rows AND genuinely dead tokens); self-healing over time; no dependency on client cooperation.
   - Cons: needs a migration + one-time cleanup of any pre-existing duplicate `token` values in production before the constraint can be added.
   - Effort: Medium.

2. **Client-side only — call `unregisterDeviceToken` proactively on token refresh/app reinstall detection.**
   - Pros: no backend migration.
   - Cons: doesn't fix tokens that go stale silently (uninstalls, OS-level token expiry) since the client never runs again to unregister them; doesn't fix the race that creates duplicate rows. Doesn't address root cause.
   - Effort: Low, but incomplete.

3. **Time-based token expiry (TTL) — drop tokens not "seen" (re-registered) in N days.**
   - Pros: simple cron job, catches abandoned installs.
   - Cons: doesn't fix immediate duplicates from the registration race; arbitrary TTL can drop a legitimately still-installed app that just doesn't reopen often; doesn't fix bug #3 reassignment.
   - Effort: Low, but only a partial mitigation — best paired with Approach 1, not instead of it.

#### Bugs #2/#3 — Logout / account switch still receive pushes

1. **Unregister-on-logout (client) + unique-token upsert (server), combined.**
   - Pros: logout is the "happy path" fix (bug #2 fully solved when logout succeeds); the unique-token upsert is the safety net for bug #3 and for logout calls that fail (network drop, app killed before the request completes) — reassignment self-heals on the *next* login regardless.
   - Cons: requires both a mobile change and a backend migration to fully close the gap.
   - Effort: Medium (this is really Approach 1 from bug #1 plus a small client change).

2. **Client-only unregister-on-logout, no backend uniqueness change.**
   - Pros: smallest diff, no migration.
   - Cons: still broken whenever the `DELETE` call fails or is skipped (app force-quit right after tapping "Cerrar sesión", offline logout, etc.) — bug #3 specifically (switching accounts on the same device) is only fixed if logout always successfully unregisters first, which isn't guaranteed on mobile.
   - Effort: Low, but leaves a real gap for #3.

#### Bug #4/#6 — Deep link routing consistency (push tap + in-app list tap)

1. **Extract a single shared `navigateForNotification({ type, entityId, extra })` helper used by both `usePushNotifications.handleNotificationTap` and `NotificationsScreen.handleNotificationPress`; enrich MEDICATION push payload with `medicationId`/`medicationName` from the backend.**
   - Pros: guarantees the two paths can't drift again; backend enrichment avoids adding a fetch-before-navigate step or a new "get cycle by id" endpoint; reuses existing `AppointmentDetail`/`CycleDetail` screens as-is.
   - Cons: slightly larger backend diff (touch every `notify_user` call site or centralize inside `notify_user`/`send_push_notification` for MEDICATION types).
   - Effort: Medium.

2. **Keep two separate handlers but duplicate the same switch/case logic in both files.**
   - Pros: zero backend change, mobile-only.
   - Cons: exactly how bug #4/#6 happened in the first place (the two switch statements already drifted); high risk of recurring regressions.
   - Effort: Low, but rejected — repeats the root cause.

3. **Add a new backend "resolve notification target" endpoint (`GET /notifications/{id}/target`) returning fully-resolved navigation params.**
   - Pros: centralizes routing logic server-side; mobile just calls one function.
   - Cons: extra network round-trip on every tap (latency before navigation), a new endpoint + schema to maintain, overkill for the two payload shapes that exist today (appointment id vs. cycle id).
   - Effort: High — not justified for the current scope (2 entity types).

#### Bug #5 — Cold start

1. **Call `Notifications.getLastNotificationResponseAsync()` once, guarded by `navigationRef.isReady()`, right after the app mounts / navigation container is ready, reusing the same shared routing helper from bug #4.**
   - Pros: standard Expo Notifications pattern; small, isolated addition; naturally shares code with the warm-tap path once the helper from bug #4 exists.
   - Cons: needs to run only once per cold start (guard against re-navigating on every re-render) and needs `navigationRef` to be ready, which can race with very fast cold starts — needs a small retry/ready-listener, not a fire-once effect with no guard.
   - Effort: Low (once bug #4's shared helper exists).

### Recommendation

Treat this as two coupled slices, not six independent ones — the root causes overlap:

- **Slice A (backend-heavy): token ownership integrity.** Unique constraint + upsert on `device_tokens.token`, FCM/APNs invalid-token pruning in the dispatch path, and `unregisterDeviceToken` wired into mobile logout. This closes bugs #1, #2, #3 together because they share the same root cause (a token is device-scoped, not user-scoped, and nothing prunes it). Approach 1 for bug #1 and Approach 1 for bugs #2/#3 are the same work.
- **Slice B (mobile-heavy): unified deep-link routing.** One shared `navigateForNotification` helper consumed by the push tap listener, the cold-start check, and the in-app notification list. Backend enriches the MEDICATION push payload with `medicationId`/`medicationName` so the client never needs an extra fetch. This closes bugs #4, #5, #6 together.

This split also maps cleanly to two independently reviewable/shippable PRs (aligns with `delivery_strategy: exception-ok` if either slice alone comes in under budget — Slice A is backend + a small mobile logout change; Slice B is entirely mobile + a small backend payload enrichment).

### Risks

- **Data migration risk**: adding `UNIQUE(token)` to `device_tokens` will fail if duplicate token rows already exist in production. Need a pre-migration cleanup step (e.g. keep the most recently created row per token, delete older ones) as part of the same change.
- **Silent send failures today**: `_send_fcm`/`_send_apns` currently return `None` on any exception without distinguishing "invalid token" from "transient network error" — pruning must only trigger on genuinely permanent errors (`UNREGISTERED`, `INVALID_ARGUMENT` for FCM; `BadDeviceToken`/410 `Unregistered` for APNs), not on timeouts, or the fix would delete good tokens on transient failures.
- **Best-effort unregister on logout**: the `DELETE /notifications/devices` call on logout can fail (offline, app killed mid-request) — must not block/delay the logout UX, and Slice A's server-side upsert-on-register is the real safety net, not the client call alone.
- **Duplicate stray files** (`* 2.ts`/`* 2.tsx` copies) in the mobile repo increase the chance of editing the wrong copy during implementation; should be resolved (deleted or reconciled) before/at the start of apply, not silently ignored.
- **`include_managers` fan-out**: `notify_user` already sends to a user AND their active managers (delegation) — any device-token fix must preserve that multi-receiver fan-out and not be confused with the "duplicate token" bug; they are different mechanisms (one is intentional multi-user delivery, the other is unintentional multi-token delivery to the same person).
- **Test coverage gap**: `tests/api/test_notifications.py` covers dedupe/preferences but has no test for token reassignment, pruning-on-invalid-token, or the unique constraint — new tests needed alongside the fix, not just manual QA.

### Ready for Proposal

Yes. Recommend the orchestrator proceed to `sdd-propose` with the two-slice split (Slice A: token ownership integrity; Slice B: unified deep-link routing) as the proposed scope boundary, and confirm with the user whether both slices ship in this change or Slice A ships first (it's the more urgent/user-visible complaint — triple pushes and phantom pushes after logout — while Slice B is a UX polish item).
