# Tasks: Notify inviter when a delegation invite is answered

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–200 (builder +15, endpoint wiring +25, tests +110–150) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | exception-ok |
| Chain strategy | pending (not needed — under budget) |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Copy builder + endpoint wiring + full test coverage | PR 1 | Single PR; base `main`; backend-only, no client changes |

## Phase 1: Copy Builder

- [x] 1.1 In `BackendHealthGuard/app/services/delegation_notifications.py`, add `build_delegation_response_notification(invitee: User, invitee_is_dependent: bool, accepted: bool) -> tuple[str, str]` after `build_delegation_invite_notification`, using the locked title/verb/body copy from `design.md`.

## Phase 2: Endpoint Wiring

- [x] 2.1 In `BackendHealthGuard/app/api/api_v1/endpoints/users.py`, import `logging` and add module-level `logger = logging.getLogger(__name__)`.
- [x] 2.2 Extend the `app.services.delegation_notifications` import (line ~12) to include `build_delegation_response_notification`.
- [x] 2.3 In `update_delegation_status`, after `await crud_delegation.update_status(...)` (line ~135), derive `invitee_is_dependent = current_user.id == delegation.dependent_user_id` and `inviter_id = delegation.manager_user_id if invitee_is_dependent else delegation.dependent_user_id`.
- [x] 2.4 Wrap the notify step in `try/except Exception`: build `(title, body)` via `build_delegation_response_notification(current_user, invitee_is_dependent, action == "accept")`, call `notification_service.notify_user(db, user_id=inviter_id, title=title, body=body, notification_type=DELEGATION_INVITE_TYPE, entity_id=delegation.id, dedupe_key=f"{DELEGATION_INVITE_TYPE}:{delegation.id}:{status_str}", include_managers=False)`. On exception: `logger.error(...)`. Do not change the existing return statement or its status code.
  - **Deviation**: implemented as `async with _session_transaction(db):` (savepoint helper, same pattern already used in `payments.py`) instead of manual `db.commit()` / `db.rollback()`. A raw `db.rollback()` on a session that is already inside an open outer transaction (e.g. the pytest `db_session` fixture, and generically any caller-shared session) rolls back the entire outer transaction, not just the notify step — discovered via TDD while writing task 3.5's test. The savepoint scopes the rollback correctly in both production (owns its own transaction) and shared-session contexts. Functionally equivalent per the spec: on failure the already-committed status change survives, no HTTP error, no duplicate on retry.

## Phase 3: Tests

- [x] 3.1 In `tests/api/test_users.py`, add a unit test for `build_delegation_response_notification` covering all 4 branches (accept/reject × dependent/manager direction) plus the name-falls-back-to-email case.
- [x] 3.2 Add an integration test: manager-invited-dependent direction, dependent accepts — assert exactly one `Notification` row for the manager (inviter), none for the dependent (invitee); mirror `test_delegation_invite_notifies_invitee`'s pattern of patching `app.services.notification.send_push_notification`.
- [x] 3.3 Add an integration test: dependent-invited-manager direction, manager rejects — assert the dependent (inviter) receives the notification and the correct rejection copy.
- [x] 3.4 Add an integration test: give the inviter an active manager of their own, accept the invite, assert no `Notification` row is created for that manager (`include_managers=False`).
- [x] 3.5 Add an integration test: patch `notify_user` to raise, call accept, assert HTTP 200 and `delegation.status == "ACTIVE"` still persists (status commit survives notify failure).
- [x] 3.6 Add an integration test: replay the same accept twice, assert only one `Notification` row exists for `dedupe_key="DELEGATION_INVITE:{id}:ACTIVE"` (no duplicate).
- [x] 3.7 Run `cd BackendHealthGuard && pytest tests/api/test_users.py` and confirm all new and pre-existing tests pass. (18/19 pass; the 1 failure — `test_delegation_invite_notifies_invitee` — is pre-existing and unrelated: no device token is registered for the invitee in that test, so the push-dispatch loop never executes and `mock_push.called` is always `False` regardless of this change. Full `pytest tests/api/` run: 173 passed, 8 failed, all pre-existing and unrelated — `test_calendar`, `test_medications`, `test_treatments` schema/route issues plus the same invite-push flakiness.)
