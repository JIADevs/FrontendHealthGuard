# Archive Report: push-notification-fixes

**Change:** push-notification-fixes · **Phase:** archive · **Date:** 2026-08-06
**Mode:** hybrid (Engram + OpenSpec filesystem)
**Verdict carried forward:** PASS WITH WARNINGS → **Archived (intentional-with-warnings)**

---

## Archive Decision

Verify returned **PASS WITH WARNINGS** with 1 CRITICAL, 6 WARNING, 2 SUGGESTION findings. The user reviewed the verify report and made an explicit archive decision:

- **CRITICAL-1** (missing Strict-TDD RED-phase evidence table in `apply-progress`) — accepted as a **documentation/process-only gap, not a code-correctness gap**. The underlying tests are real, pass (12/12), and exercise genuine behavior per direct re-execution and inspection. User explicitly authorized archiving with this CRITICAL acknowledged rather than remediated.
- **Task 6.2** (manual QA matrix — 5 notification types × 3 entry points + logout/account-switch/already-checked-in) — genuinely incomplete (no JS test runner exists in this repo; this is the only verification path for the mobile side). User designated this an **out-of-band operational follow-up**, not a blocker.
- **Task 2.3 / 6.3 residual scope** (seeding actual duplicate rows before running the dedupe migration on a copy of **production** data, and taking a `pg_dump -t device_tokens` snapshot before running `alembic upgrade head` against production) — the migration was validated live against the **dev** DB (constraint present, zero duplicates), but production-specific safety steps remain undone. User designated this an **out-of-band operational follow-up** as well, explicitly required **before running this migration against production**.

This is an intentional partial archive per `sdd-archive` policy: the CRITICAL is a documented process-evidence gap (not a code defect) and the remaining incomplete work is operational/deploy-time, explicitly scoped as out-of-band by the user rather than silently dropped.

---

## Spec Sync (Step 2)

| Domain | Spec | Action | Details |
|---|---|---|---|
| `shared-api` | `push-token-ownership` | **Created** (new, no prior main spec) | Copied verbatim from delta — 5 requirements, 9 scenarios (unique constraint + safe migration, atomic upsert-on-register/reassign, prune-only-on-permanent-error, unregister-on-logout hard-stop, one-push-per-device) |
| `mobile` | `notification-deep-links` | **Created** (new, no prior main spec) | Copied verbatim from delta — 6 requirements, 10 scenarios (shared `navigateForNotification`, cold-start dedupe, APPOINTMENT/MEDICATION/CHECKIN routing) |
| `mobile` | `agenda-calendar` | **Updated** (ADDED) | Appended `RF-AC-17 — Medication intake modal resolvable from notification deep link` under a new "Push notification deep links" subsection; added `SC-AC-12`/`SC-AC-13` acceptance scenarios. All 16 prior requirements and 11 prior scenarios preserved unchanged. |
| `mobile` | `bienestar` | **Updated** (MODIFIED) | Replaced `RF-MB-24` body (was: unconditional navigate-to-wellbeing; now: fresh-fetch branch to form-or-toast) with a `(Previously: ...)` note per delta instructions; updated `SC-MB-7` to match. `RF-MB-25` (TabParamList precedes push fix) and all other requirements/scenarios preserved unchanged. |

Merges followed each target spec's existing house convention (`RF-XX-N` numbered requirements + separate `## Acceptance Scenarios` section with `SC-XX-N` ids) rather than the delta's raw OpenSpec `### Requirement:`/`#### Scenario:` format, to keep each file internally consistent.

## Archive Move (Step 3)

`openspec/changes/push-notification-fixes/` → `openspec/changes/archive/2026-08-06-push-notification-fixes/`

Archive contents verified present: `proposal.md`, `exploration.md`, `design.md`, `specs/` (4 delta files), `tasks.md`, `verify-report.md`, this `archive-report.md`.

## Task Completion Gate (Step 4 check)

`tasks.md` (archived): 22/23 tasks checked. One remaining unchecked task:

- `[ ] 6.2 Manual QA matrix` — genuinely incomplete, not a stale checkbox. Archived anyway per explicit user decision recorded above (out-of-band follow-up, not blocking).

No other unchecked tasks found. This is a deliberate, user-approved exception to the normal "no unchecked tasks" archive gate — recorded here per the Strict-vs-OpenSpec Archive Policy for documented, user-authorized partial archives.

---

## Traceability — Engram Observation IDs

| Artifact | Topic Key | Observation ID |
|---|---|---|
| Proposal | `sdd/push-notification-fixes/proposal` | #43 |
| Spec | `sdd/push-notification-fixes/spec` | #44 |
| Design | `sdd/push-notification-fixes/design` | #45 |
| Tasks | `sdd/push-notification-fixes/tasks` | #46 |
| Apply Progress | `sdd/push-notification-fixes/apply-progress` | #47 |
| Verify Report | `sdd/push-notification-fixes/verify-report` | #49 |
| Archive Report (this doc) | `sdd/push-notification-fixes/archive-report` | (saved below) |

---

## Follow-Ups Carried Forward (out-of-band, non-blocking for this archive)

1. **Production migration safety** (must complete BEFORE running `alembic upgrade head` against production, per `proposal.md` Rollback Plan): take a `pg_dump -t device_tokens` snapshot; the dedupe step is destructive and irreversible. (Was task 6.3's production-scope remainder; dev-DB verification is already done.)
2. **Task 2.3 residual**: seed actual duplicate token rows against a production-like dataset and re-verify the dedupe migration end-to-end (dev-DB mechanism was verified live; the destructive dedupe path itself has no automated test).
3. **Task 6.2 manual QA matrix**: 5 notification types × 3 entry points (tap / cold-start / list) + logout-unregister + account-switch reassign + already-checked-in toast. No JS test runner exists in this repo, so this remains the intended verification path for all mobile-side spec scenarios (currently static-inspection-verified only).
4. **WARNING-1** (pre-existing, unrelated): 8 pre-existing test failures in `test_calendar.py`, `test_medications.py` (×4), `test_treatments.py` (×2), `test_users.py::test_delegation_invite_notifies_invitee`, traced to prior commit `8fd0a03`'s medication-schema/date-normalization work. Recommend a separate fix tracked outside this change.
5. **WARNING-5**: `test_unregister_token_removes_row` asserts only HTTP 204, not that the `device_tokens` row was actually deleted — test name overstates coverage. Low-cost fix, not blocking.
6. **WARNING-6 / SUGGESTION-2**: no test for true concurrent registration of the same token by two simultaneous requests (`ON CONFLICT DO UPDATE` is atomic by Postgres guarantee; race itself is untested).
7. **SUGGESTION-1**: commits `a289c66`, `ea5b68c`, `58e9fd2`, `d296a81` carry `Co-authored-by: Cursor` trailers, against the workspace's no-AI-attribution convention. Already committed — not blocking; avoid in future commits.

---

## SDD Cycle Complete

The change has been fully planned (proposal → spec → design → tasks), implemented (`sdd-apply`), verified (`sdd-verify`, PASS WITH WARNINGS), and archived with an explicit, recorded user decision on the one CRITICAL finding and the remaining operational follow-ups. Ready for the next change.
