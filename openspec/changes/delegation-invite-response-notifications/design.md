# Design: Notify inviter when a delegation invite is answered

## Technical Approach

Backend-only slice implementing proposal Approach 1. Two edits in `BackendHealthGuard`:

1. A pure copy builder `build_delegation_response_notification` in `app/services/delegation_notifications.py`, symmetric to the existing invite builder.
2. A guarded notification block in `update_delegation_status` (`app/api/api_v1/endpoints/users.py`) that resolves the inviter from the existing columns and calls `notification_service.notify_user`.

No model, migration, Pydantic enum, Zod schema, or mobile/web change. `openspec/config.yaml` `rules.design` targets frontend layering and does not apply here; nothing is deferred to web because no shared frontend surface changes.

## Architecture Decisions

| Decision | Chosen | Rejected | Rationale |
|---|---|---|---|
| Notification type | Reuse `DELEGATION_INVITE` | New `DELEGATION_INVITE_ACCEPTED` / `_REJECTED` | Avoids syncing backend `NotificationType` + frontend `NotificationSchema` enums; inherits the correct `Dependientes` route and `Users` icon for free |
| Direction source | Derive from `manager_user_id` / `dependent_user_id` vs `current_user.id` | New `inviter_id` / `relationship` column | Ids are already unambiguous; no migration |
| Builder signature | `(invitee, invitee_is_dependent, accepted)` | Pass the raw relationship string | Relationship is not persisted; the boolean is what the endpoint can actually derive |
| Copy tone | Symmetric title, distinct body naming the responder | Suppress or soften rejection | Locked by user: both outcomes are first-class |
| Failure isolation | `try/except` → `logger.error` + `db.rollback()` | Let the exception bubble | `update_status` already committed; a push/DB hiccup must not 500 a successful accept/reject |
| Fan-out | `include_managers=False` | Default `True` | The inviter's own managers are out of scope and a privacy leak |
| Dedupe key | `DELEGATION_INVITE:{id}:{status}` | Reuse the invite key | Invite already reserved `DELEGATION_INVITE:{id}`; the status suffix separates events and blocks retry duplicates |

## Data Flow

```
PATCH /users/me/delegations/{id}/status?action=accept|reject
  │
  ├─ crud_delegation.get(id) ──→ 404 if missing
  ├─ linked_user_email == current_user.email ──→ 403 otherwise
  ├─ crud_delegation.update_status(status_str)      [COMMITS status]
  │
  └─ try:
       invitee_is_dependent = current_user.id == delegation.dependent_user_id
       inviter_id           = manager_user_id if invitee_is_dependent else dependent_user_id
       build_delegation_response_notification(current_user, invitee_is_dependent, accepted)
       notification_service.notify_user(user_id=inviter_id, include_managers=False)
         ├─ reserve_dedupe_key ──→ no-op if already dispatched
         ├─ Notification row (inviter)
         └─ push to inviter's device tokens only
       db.commit()
     except Exception:
       logger.error(...); db.rollback()      # status stays committed
  │
  └─ 200 {"message": "Request accepted successfully"}
```

## File Changes

| File | Action | Description |
|---|---|---|
| `BackendHealthGuard/app/services/delegation_notifications.py` | Modify | Add `build_delegation_response_notification`; reuse `DELEGATION_INVITE_TYPE` |
| `BackendHealthGuard/app/api/api_v1/endpoints/users.py` | Modify | Add module `logger`; import the new builder; resolve inviter and notify inside a guarded block in `update_delegation_status` |
| `BackendHealthGuard/tests/api/test_users.py` | Modify | Add accept/reject coverage for both invite directions |

## Interfaces / Contracts

```python
# app/services/delegation_notifications.py
def build_delegation_response_notification(
    invitee: User,
    invitee_is_dependent: bool,
    accepted: bool,
) -> tuple[str, str]:
    """Returns (title, body) for the inviter after an invite is answered."""
    label = (invitee.name or invitee.email).strip()
    title = "Invitación aceptada" if accepted else "Invitación rechazada"
    verb = "aceptó" if accepted else "rechazó"

    if invitee_is_dependent:  # inviter asked to manage them
        return title, f"{label} {verb} que gestiones su cuenta de salud."
    return title, f"{label} {verb} ser tu cuidador."
```

Notification contract for the inviter: `type=DELEGATION_INVITE`, `entity_id=delegation.id`, `dedupe_key=DELEGATION_INVITE:{delegation.id}:{ACTIVE|REJECTED}`, `include_managers=False`, no `push_data`. Response body of the endpoint is unchanged.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | Copy builder — 4 branches (accept/reject × direction), name falls back to email | Direct call, assert title and body |
| Integration | Accept and reject each create exactly one `Notification` for the inviter, none for the invitee | `authorized_client` + `db_session`, patch `app.services.notification.send_push_notification`, mirroring `test_delegation_invite_notifies_invitee` |
| Integration | Both invite directions resolve the right inviter | Signup a second user; run `I_WANT_TO_MANAGE_THEM` and `THEY_WILL_MANAGE_ME` |
| Integration | No rows for the inviter's own managers (`include_managers=False`) | Give the inviter an active manager; assert no notification for that manager |
| Integration | Notify failure keeps HTTP 200 and the committed status | Patch `notify_user` to raise; assert 200 and `status == ACTIVE` |

Run: `cd BackendHealthGuard && pytest tests/api/test_users.py`.

## Migration / Rollout

No migration required. No feature flag: revert the two source files to roll back; existing notification rows stay renderable on any client.

## Open Questions

- [ ] Should rejection copy be softer, or the rejection notification suppressed? (non-blocking — symmetric tone is locked for this slice)
- [ ] Should the tap deep-link to the specific delegation row instead of the `Dependientes` list?
- [ ] Should revoke/delete get the same treatment in a follow-up?
