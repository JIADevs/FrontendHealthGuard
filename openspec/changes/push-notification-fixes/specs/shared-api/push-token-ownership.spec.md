# Shared-API Push Token Ownership Specification

## Purpose

Device-scoped push token lifecycle: registration, reassignment on account switch, pruning on permanent delivery failure, and unregistration on logout. Backend owns token identity so correctness never depends on the client succeeding at logout.

## Requirements

### Requirement: Unique token constraint with safe migration

`device_tokens.token` MUST be UNIQUE at the database level. The migration adding this constraint MUST first dedupe existing duplicate rows (keep the newest row per token) before applying the constraint.

#### Scenario: Migration dedupes before constraint

- GIVEN `device_tokens` has multiple rows sharing the same `token`
- WHEN the migration runs
- THEN only the newest row per token remains
- AND the UNIQUE constraint is applied without error

#### Scenario: Duplicate insert rejected at DB level

- GIVEN the UNIQUE constraint is active
- WHEN application code attempts a plain INSERT with an existing token
- THEN the database MUST reject it (callers MUST use the upsert path instead)

### Requirement: Atomic upsert-on-register reassigns ownership

Registering a token MUST use an atomic `ON CONFLICT (token) DO UPDATE` that reassigns `user_id` to the registering user (`strict_reassign`). The previous owner MUST stop receiving pushes to that token immediately after the upsert commits.

#### Scenario: User B logs in on User A's device

- GIVEN token T is currently owned by user A
- WHEN user B registers token T after logging in
- THEN T's owner becomes B
- AND subsequent notifications for A MUST NOT be sent to T

#### Scenario: Concurrent registration does not duplicate rows

- GIVEN two registration calls for the same token arrive concurrently
- WHEN both are processed
- THEN exactly one row exists for that token afterward

### Requirement: Prune only on permanent delivery errors

The notification service MUST prune (delete or deactivate) a device token only when FCM/APNs returns a permanent invalid-token error (`UNREGISTERED`, `SenderIdMismatch`, APNs `BadDeviceToken`/410). It MUST NOT prune on transient errors (timeouts, rate limits, unknown/5xx errors).

#### Scenario: Permanent error prunes token

- GIVEN a push send returns `UNREGISTERED` for token T
- WHEN the service processes the failure
- THEN T is pruned and no longer targeted by future sends

#### Scenario: Transient error does not prune

- GIVEN a push send times out or returns a transient error for token T
- WHEN the service processes the failure
- THEN T remains active and eligible for future sends

### Requirement: Unregister endpoint for logout hard-stop

The shared API MUST expose an `unregisterDeviceToken(token)` operation. Mobile logout MUST call it before clearing local auth state (`hard_stop`): after logout, the device MUST receive zero pushes for that user until the next login. Server-side reassign-on-register remains the authoritative guarantee if the client call fails (e.g., offline).

#### Scenario: Logout unregisters before clearing auth

- GIVEN a logged-in user with an active device token
- WHEN they log out with network available
- THEN `unregisterDeviceToken` is called and succeeds before auth state is cleared
- AND the device receives no further pushes for that user

#### Scenario: Offline logout still stops pushes on next login elsewhere

- GIVEN the unregister call fails because the device is offline
- WHEN a different user later registers the same physical token
- THEN the atomic upsert-on-register reassigns ownership regardless of the failed unregister call

### Requirement: One push per physical device per event

For a single logical notification event, the system MUST deliver at most one push to a given physical device (no duplicate `device_tokens` rows for the same device causing repeated sends).

#### Scenario: No duplicate sends after dedupe migration

- GIVEN a physical device previously accumulated multiple token rows
- WHEN a notification event fires after migration and reassignment are in place
- THEN the device receives exactly one push for that event
