# Backend-API Delegation Notifications Specification

## Purpose

Server-side dispatch for delegation lifecycle events: when an invitee responds to a delegation invite, the system notifies the inviter with direction-aware, symmetric-treatment copy, using the existing `DELEGATION_INVITE` notification type so no client changes are required.

## Requirements

### Requirement: Notify inviter on delegation response, both directions

`PATCH /users/me/delegations/{id}/status` MUST notify the delegation's inviter whenever the invitee accepts or rejects, regardless of invite direction (manager invited dependent, or dependent invited manager).

#### Scenario: Manager invited dependent, dependent accepts

- GIVEN a delegation where the manager is the inviter and the dependent is the invitee
- WHEN the dependent accepts
- THEN the manager receives one in-app notification and one push

#### Scenario: Dependent invited manager, manager rejects

- GIVEN a delegation where the dependent is the inviter and the manager is the invitee
- WHEN the manager rejects
- THEN the dependent receives one in-app notification and one push

#### Scenario: Invitee receives no notification for their own response

- GIVEN either invite direction
- WHEN the invitee accepts or rejects
- THEN the invitee (the actor) receives no notification for that action

### Requirement: Recipient resolution excludes managers of either party

Resolving the recipient MUST call `notify_user` with `include_managers=False` and the inviter's user id as the sole recipient.

#### Scenario: notify_user called with include_managers=False, no manager rows

- GIVEN a status change from `PENDING` to `ACCEPTED` or `REJECTED`, and either party has managers on file
- WHEN the notification is dispatched
- THEN `notify_user` is invoked with `include_managers=False` and `inviter_id` as the sole recipient
- AND no notification row is created for any manager of either party

### Requirement: Direction-aware copy, symmetric accept/reject treatment

`build_delegation_response_notification(invitee, invitee_is_dependent, accepted)` MUST produce a body naming the invitee and stating the outcome. Accept and reject notifications MUST carry the same priority and tone treatment (same notification type, same urgency, no suppression of either outcome); only the copy text MUST differ between the two outcomes.

#### Scenario: Accepted invite produces outcome-specific copy

- GIVEN `accepted=True`
- WHEN the notification body is built
- THEN it names the invitee and states the invite was accepted

#### Scenario: Rejected invite produces outcome-specific copy at equal priority

- GIVEN `accepted=False`
- WHEN the notification body is built
- THEN it names the invitee and states the invite was rejected
- AND it is dispatched with the same type and urgency as an accepted-invite notification (not suppressed, not deprioritized)

### Requirement: Type, entity, and dedupe contract

Response notifications MUST use `type=DELEGATION_INVITE`, `entity_id=delegation.id`, and `dedupe_key="DELEGATION_INVITE:{id}:{status}"`.

#### Scenario: Retry of the same status change does not duplicate

- GIVEN a notification was already sent for `DELEGATION_INVITE:{id}:ACCEPTED`
- WHEN the same status transition is retried
- THEN no duplicate notification row is created

#### Scenario: Existing mobile deep link routing keeps working unchanged

- GIVEN the notification uses `type=DELEGATION_INVITE` and `entity_id=delegation.id`
- WHEN the inviter taps it
- THEN it opens the Dependientes screen via the existing `DELEGATION_INVITE` routing, with no client-side changes required

### Requirement: Notify runs after durable commit and never fails the request

`update_delegation_status` MUST commit the status change before attempting to notify. The notify call MUST be wrapped in `try/except`, logging via `logger.error` on failure, and MUST NOT alter the HTTP response of a successful status update.

#### Scenario: Notification failure does not affect the response

- GIVEN the notify call raises an exception
- WHEN the invitee's status update request is processed
- THEN the status change is already committed
- AND the HTTP response is still a successful status update
- AND the failure is logged via `logger.error`

#### Scenario: Status commit is not rolled back by a notify failure

- GIVEN the status commit succeeded
- WHEN the subsequent notify call fails
- THEN the committed status change persists unaffected
