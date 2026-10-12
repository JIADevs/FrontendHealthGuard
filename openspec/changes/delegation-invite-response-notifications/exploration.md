# Exploration: Notify inviter when a delegation invite is accepted/rejected

## Current State

**Invite creation already notifies the invitee.**
`POST /users/me/delegations` (`BackendHealthGuard/app/api/api_v1/endpoints/users.py:41-96`) creates a `PENDING` `UserDelegation` row, then calls:

```python
title, body = build_delegation_invite_notification(current_user, req.relationship)
await notification_service.notify_user(
    db, user_id=target_user.id, title=title, body=body,
    notification_type=DELEGATION_INVITE_TYPE,
    entity_id=created.id,
    dedupe_key=f"{DELEGATION_INVITE_TYPE}:{created.id}",
    include_managers=False,
)
```

`build_delegation_invite_notification` (`app/services/delegation_notifications.py`) crafts direction-aware copy from `req.relationship` (`I_WANT_TO_MANAGE_THEM` vs `THEY_WILL_MANAGE_ME`).

**Accept/reject does NOT notify anyone.**
`PATCH /users/me/delegations/{id}/status?action=accept|reject` (`users.py:114-137`):

```python
delegation = await crud_delegation.get(db, id=id)
if delegation.linked_user_email != current_user.email:
    raise HTTPException(403, ...)
status_str = "ACTIVE" if action == "accept" else "REJECTED"
await crud_delegation.update_status(db, db_obj=delegation, status=status_str)
return {"message": f"Request {action}ed successfully"}
```

`crud_delegation.update_status` (`app/crud/crud_delegation.py:52-57`) mutates `status` and **commits internally** — it never calls `notification_service`. This is the gap: the inviter gets no signal (push or in-app) that their invitation was answered.

**Who is the "inviter"?** `UserDelegation` has no `created_by`/`inviter_id` column — only `manager_user_id`, `dependent_user_id`, and `linked_user_email` (the invitee's email, set at creation from `req.email`). The invitee is whichever side matches `current_user.id` in the `accept/reject` handler (enforced by the `linked_user_email` check); the **inviter is the other id**:

```python
inviter_id = delegation.dependent_user_id if current_user.id == delegation.manager_user_id else delegation.manager_user_id
```

The original relationship direction is also recoverable the same way (no new column needed) to produce direction-aware copy analogous to `build_delegation_invite_notification`.

**`NotificationService.notify_user`** (`app/services/notification.py`) already handles: DB persistence, dedupe via `NotificationDispatch` (unique `dedupe_key`), per-type opt-out (`user.preferences["notifications"][type]`, default `True`), push fan-out to device tokens, and — critically — an `include_managers` flag that also pushes to the target's *own* active managers. The invite-creation call already sets `include_managers=False` to avoid leaking the invite to unrelated managers; the same care is needed for the response notification (the inviter may themselves have managers who should NOT be pinged).

**Types and validation are enum-locked in three places**, all currently listing `DELEGATION_INVITE` but no response-specific type:
- `app/schemas/notification.py::NotificationType` (Pydantic enum — validates every notification returned by `GET /notifications`)
- `FrontendHealthGuard/packages/api/src/schemas.ts` — `NotificationSchema.type` is a strict `z.enum([...])`. Any backend type value not in this list **throws a `ZodError` and breaks the notification list fetch** for that user (this is a real risk, not hypothetical — the schema has no passthrough/catch-all).
- Mobile only: `apps/mobile/src/navigation/notificationRouting.ts::navigateForNotification` — switches on `type` to route push taps. `DELEGATION_INVITE` already routes to `Dependientes`. Unmatched types fall through to the generic `Notifications` screen (safe default, not a crash).
- `apps/mobile/src/screens/NotificationsScreen.tsx::TYPE_CONFIG` — icon/color per type, falls back to `TYPE_CONFIG.INFO` for unknown types (safe default).

**Tests**: `BackendHealthGuard/tests/api/test_users.py::test_delegation_invite_notifies_invitee` asserts a `Notification` row is created for the invitee on invite creation. No equivalent test exists for accept/reject. `tests/api/test_users.py` also has a full delegation lifecycle test (steps 1-7: create → list → accept-by-manager-should-403 → dependent deletes) that would be the natural place to extend.

## Affected Areas

- `BackendHealthGuard/app/api/api_v1/endpoints/users.py` — `update_delegation_status` must resolve `inviter_id` and call `notification_service.notify_user`, then commit (the CRUD call already commits the status change separately; the notify+push needs its own explicit `db.commit()`, matching the pattern in `app/core/recurring_subscriptions/helpers.py`).
- `BackendHealthGuard/app/services/delegation_notifications.py` — add a `build_delegation_response_notification(invitee, relationship, accepted: bool) -> (title, body)` helper, symmetric to the existing invite builder.
- `BackendHealthGuard/app/schemas/notification.py::NotificationType` — add new enum value(s) if a new type is introduced (Approach 2/3 below).
- `BackendHealthGuard/tests/api/test_users.py` — extend the delegation lifecycle test (or add a new one) asserting the inviter receives a `Notification` row on both accept and reject.
- `FrontendHealthGuard/packages/api/src/schemas.ts` — `NotificationSchema.type` enum must include any new type value or the notification list breaks for the inviter (`ZodError`).
- `FrontendHealthGuard/apps/mobile/src/navigation/notificationRouting.ts` — optionally add explicit routing for the new type (defaults safely to `Notifications` otherwise).
- `FrontendHealthGuard/apps/mobile/src/screens/NotificationsScreen.tsx::TYPE_CONFIG` — optionally add an icon/color entry (defaults safely to `INFO` styling otherwise).
- `FrontendHealthGuard/openspec/changes/dependientes/specs/shared-api/delegation.spec.md` and `FrontendHealthGuard/openspec/specs/mobile/notification-deep-links.spec.md` — existing specs to extend/reference, not rewrite.

## Approaches

1. **Reuse existing `DELEGATION_INVITE` type for the response notification** — call `notify_user(..., notification_type=DELEGATION_INVITE_TYPE, ...)` with accept/reject-specific copy, same as invite creation.
   - Pros: Zero schema/enum changes anywhere (backend Pydantic, frontend Zod). Zero frontend routing/icon changes needed — inherits the existing `DELEGATION_INVITE → Dependientes` route and `Users` icon, which is actually the *right* destination for this notification too. Fastest, lowest-risk slice.
   - Cons: Conflates two semantically different events under one type (harder to filter/analyze later; a future "manage delegation notification preferences" UI could not let a user opt out of invites while keeping responses, or vice versa). Push preference key `notifications.DELEGATION_INVITE` also gates the response push (currently no UI exposes this preference anyway, so low practical impact today).
   - Effort: Low.

2. **New dedicated type(s): `DELEGATION_INVITE_ACCEPTED` / `DELEGATION_INVITE_REJECTED`** — one type per outcome, following the `_FOLLOWUP` suffix precedent already used for `APPOINTMENT_FOLLOWUP`/`MEDICATION_FOLLOWUP`.
   - Pros: Clean semantic separation, easiest to reason about and test (`type == "DELEGATION_INVITE_ACCEPTED"` is unambiguous), future-proof for type-specific preferences/analytics, matches existing codebase convention of new type constants per lifecycle event.
   - Cons: Touches 3 enums that must stay in sync (backend Pydantic `NotificationType`, frontend Zod `NotificationSchema`) plus optional routing/icon updates on mobile. Missing the frontend Zod update is a real footgun — it would `ZodError`-crash `GET /notifications` parsing for the inviter (this is the single biggest risk across all approaches).
   - Effort: Medium.

3. **Reuse generic `SYSTEM` or `INFO` type** — call `notify_user(..., notification_type="SYSTEM", ...)`.
   - Pros: Also zero enum/schema changes (both types already exist everywhere).
   - Cons: Worst UX — taps route to the generic `Notifications` screen instead of `Dependientes`/the delegation context, and the icon is a generic bell/info glyph instead of the `Users` icon that already signals "this is about a delegation." Loses the semantic link to the delegation feature entirely. No advantage over Approach 1, which gets the same "no schema change" benefit *and* the right icon/routing for free.
   - Effort: Low.

| Approach | Pros | Cons | Effort |
|---|---|---|---|
| 1. Reuse `DELEGATION_INVITE` | No enum/schema changes anywhere; inherits correct routing + icon | Conflates invite/response semantics; shared opt-out preference | Low |
| 2. New `DELEGATION_INVITE_ACCEPTED`/`REJECTED` types | Clean semantics, future-proof, matches `_FOLLOWUP` precedent | 3 enums to keep in sync; missed Zod update breaks notification list | Medium |
| 3. Reuse `SYSTEM`/`INFO` | No enum/schema changes | Wrong routing + wrong icon; discards delegation context | Low |

## Recommendation

**Approach 1 (reuse `DELEGATION_INVITE`) for the first slice.** It delivers the actual user-facing requirement (inviter learns the outcome, taps it, lands on `Dependientes`) with the smallest, lowest-risk diff: one new copy-builder function plus one new call site in `update_delegation_status`, no changes to any Zod/Pydantic enum, no frontend routing/icon work. Approach 2's semantic cleanliness is a legitimate future improvement (worth a follow-up change once/if per-type notification preferences become a real feature), but is unjustified complexity for a first slice — the stated requirement is "notify the inviter," not "let users independently mute invite vs. response pushes." Approach 3 is strictly dominated by Approach 1 (same effort, worse UX) and should not be considered.

Design for the first slice:
- New `build_delegation_response_notification(invitee: User, relationship_from_inviter_pov: str, accepted: bool) -> tuple[str, str]` in `delegation_notifications.py`, mirroring the existing invite builder's direction-aware copy (e.g. "Juan aceptó tu invitación para gestionar su cuenta" vs "Juan aceptó ser tu cuidador"; equivalent rejected variants).
- In `update_delegation_status`, after resolving `inviter_id` (formula above) and calling `crud_delegation.update_status`, call `notification_service.notify_user(db, user_id=inviter_id, ..., notification_type=DELEGATION_INVITE_TYPE, entity_id=delegation.id, dedupe_key=f"{DELEGATION_INVITE_TYPE}:{delegation.id}:{status_str}", include_managers=False)`, then `await db.commit()` (the notify call itself does not commit).
- `include_managers=False` is required — otherwise the inviter's own managers would also get pushed, which is out of scope and a privacy leak.
- Dedupe key includes `status_str` so it's distinct from the original invite's dedupe key (`...:{id}` with no status suffix) and prevents double-fire if the endpoint is retried.

## Risks

- **Missed enum sync** is moot for Approach 1 (recommended) since no new enum value is introduced — this risk only applies if the team later chooses Approach 2.
- `crud_delegation.update_status` commits internally before the notification call; if the notification call fails after that commit, the status change persists but the inviter never finds out. Mitigate by wrapping the notify call in try/except (matching the `except Exception: logger.error(...)` pattern used in `app/core/scheduler.py`) so a push/DB hiccup never turns a successful accept/reject into a 500 for the invitee.
- No test currently exercises the accept/reject notification path — must be added (mirroring `test_delegation_invite_notifies_invitee`).
- `include_managers` must be explicitly set to `False`; the default is `True` and would incorrectly notify the inviter's own managers.
- No per-type notification-preference UI exists yet in the frontend, so opting out of `DELEGATION_INVITE` pushes today is only possible via a raw `preferences` API call — not a blocker, just confirms Approach 1's shared-preference con has near-zero practical impact right now.

## Ready for Proposal

Yes — scope is well-bounded (one backend endpoint, one new helper function, one test extension), the inviter-id derivation is confirmed working with the existing schema (no migration needed), and the recommended approach (reuse `DELEGATION_INVITE`) has no cross-package enum-sync risk. The orchestrator should proceed to `sdd-propose`, carrying forward: (a) the recommended approach, (b) the `include_managers=False` requirement, (c) the try/except-around-notify safety note, and (d) the need to extend `test_delegation_invite_notifies_invitee`-style coverage for accept and reject.
