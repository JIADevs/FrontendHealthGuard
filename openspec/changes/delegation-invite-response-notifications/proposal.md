# Proposal: Notify inviter when a delegation invite is answered

## Intent

`POST /users/me/delegations` notifies the invitee, but `PATCH /users/me/delegations/{id}/status` notifies nobody: the inviter gets no push and no in-app entry, and must poll Dependientes to learn the outcome.

## Scope

### In Scope

- `build_delegation_response_notification(invitee, invitee_is_dependent, accepted)` in `app/services/delegation_notifications.py` — Spanish copy naming the invitee plus the outcome.
- `update_delegation_status` resolves `inviter_id`, calls `notify_user(..., include_managers=False)`, then commits.
- Type `DELEGATION_INVITE`, `entity_id=delegation.id`, `dedupe_key="DELEGATION_INVITE:{id}:{status}"`.
- Notify wrapped in `try/except` + `logger.error` — never 500s a successful accept/reject.
- Tests: accept and reject, both directions, no extra recipients.

### Out of Scope

- New `NotificationType` values — follow-up if per-type preferences ship.
- Frontend: Zod enum, mobile routing, `TYPE_CONFIG` icons. Web untouched.
- Notifying either party's managers; email; revoke notifications.

## Capabilities

### New Capabilities

- `backend-api/delegation-notifications`: server-side dispatch for delegation lifecycle events — recipient resolution, direction-aware copy, type/entity/dedupe contract, fan-out rules, failure isolation.

### Modified Capabilities

- None. No new enum value, so `shared-api/delegation` and `mobile/notification-deep-links` requirements stay unchanged.

## Approach

Exploration Approach 1 (reuse `DELEGATION_INVITE`). Direction derives from existing columns — no migration:

- `current_user` is the invitee (already enforced via `linked_user_email`).
- Invitee `== dependent_user_id` → inviter is the manager (`I_WANT_TO_MANAGE_THEM`); otherwise inviter is the dependent (`THEY_WILL_MANAGE_ME`).
- `inviter_id` is the opposite id; copy branches on direction plus `accepted`.
- `update_status` commits internally, so notify runs after a durable status change.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `app/services/delegation_notifications.py` | Modified | Response copy builder |
| `app/api/api_v1/endpoints/users.py` | Modified | Resolve inviter, notify, commit |
| `tests/api/test_users.py` | Modified | Accept/reject coverage |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Wrong recipient | Med | Asserted per direction in tests |
| `include_managers` default leaks to inviter's managers | Med | Explicit `False` + test asserting no extra rows |
| Notify failure after status commit | Med | `try/except` + `logger.error` |
| Duplicate on retry | Low | `dedupe_key` suffixed with status |
| Shared opt-out mutes both events | Low | No preference UI exists today |

## Rollback Plan

Revert `delegation_notifications.py` and `users.py`. No migration, no enum change, no frontend coupling; existing rows stay renderable on any client.

## Dependencies

- None — `notify_user`, dedupe, and push fan-out already ship.

## Success Criteria

- [ ] Inviter gets in-app plus push on accept and reject, both directions.
- [ ] Body names the invitee and the outcome; tap opens Dependientes.
- [ ] `GET /notifications` parses with no `ZodError`.
- [ ] No notification for the invitee or for anyone's managers.
- [ ] Notify failure never changes HTTP status; retries create no duplicate.
