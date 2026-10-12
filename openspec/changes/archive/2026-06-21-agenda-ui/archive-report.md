# Archive Report: agenda-ui

**Change:** agenda-ui  
**Archived:** 2026-06-21  
**Archive location:** `openspec/changes/archive/2026-06-21-agenda-ui/`  
**Verdict:** PASS WITH WARNINGS — Slice 1 complete; Slice 2 deferred

---

## Executive Summary

Change `agenda-ui` (Tab Bienestar + HeluAgendaCalendar) is archived after successful completion
and verification of Slice 1. All 10 S1 tasks (1.1–3.3) are implemented, TypeScript-clean, and
verified with 17/17 scenarios compliant and 0 CRITICALs. Slice 2 (edit/delete check-in +
HeluAgendaCalendar grid) is explicitly deferred pending backend gate clearance and documented
in this report for continuity.

---

## Slice 1 — Completed

### Implementation commits (branch: `agenda`)

| Commit | Description |
|--------|-------------|
| `fad403d` | `feat(api): add daily check-in schemas, endpoints, and query hooks` |
| `1cd9f93` | `feat(mobile/agenda): add MoodPicker, DailyCheckInListItem, and DailyCheckInForm` |
| `971727e` | `feat(mobile): add WellbeingTab to AgendaScreen and fix CHECKIN push routing` |

### Files delivered (S1)

| File | Action |
|------|--------|
| `packages/api/src/schemas.ts` | Modified — added DailyCheckIn schemas + MoodEnum |
| `packages/api/src/endpoints.ts` | Modified — added getDailyCheckIns, createDailyCheckIn |
| `packages/api/src/reactQueryHooks.ts` | Modified — added QK.dailyCheckIns, useDailyCheckInsQuery, useCreateDailyCheckInMutation |
| `apps/mobile/src/components/agenda/MoodPicker.tsx` | Created |
| `apps/mobile/src/components/agenda/DailyCheckInListItem.tsx` | Created |
| `apps/mobile/src/components/agenda/DailyCheckInForm.tsx` | Created |
| `apps/mobile/src/components/agenda/index.ts` | Created |
| `apps/mobile/src/navigation/TabNavigator.tsx` | Modified — extended TabParamList with `"wellbeing"` |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modified — added WellbeingTab |
| `apps/mobile/src/hooks/usePushNotifications.ts` | Modified — added CHECKIN push routing |

### Verification result

| Metric | Value |
|--------|-------|
| Verdict | PASS WITH WARNINGS |
| CRITICALs | 0 |
| WARNINGs | 1 |
| SUGGESTIONs | 2 |
| Scenarios compliant (S1) | 17 / 17 |
| New TypeScript errors | 0 |
| Pre-existing TypeScript errors | 59 (unchanged, unrelated) |

### WARNING-1 (accepted, low-priority)

**RF-MB-16:** `DailyCheckInListItem` declares `onEdit?` prop in its interface but does not render
a disabled/placeholder edit button in S1. The spec required a visible-but-disabled button.
Resolution: Add `ActionButton action="edit"` (disabled) as part of S2 when wiring happens anyway.
This does not affect S1 functionality.

---

## Slice 2 — Deferred

### Status: BLOCKED — pending backend gate clearance

All S2 tasks (4.1–6.8) remain `[ ]` in `tasks.md`. These are NOT stale — they are intentionally
blocked by backend gates that were not available at archive time. The orchestrator explicitly
approved archiving S1 and documenting S2 as deferred.

### Backend gates required to unblock S2

| Gate | Backend requirement | Status at archive |
|------|---------------------|-------------------|
| Edit check-in | `PATCH /daily-checkins/{id}` + streak recalculation | Missing |
| Delete check-in | `DELETE /daily-checkins/{id}` + streak recalculation | Missing |
| Calendar check-ins | `checkIns: List[DailyCheckIn]` in `CalendarDayResponse` | Missing |

### S2 scope (when gates clear)

- **S2-PR-1** (~200 lines): `DailyCheckInUpdateSchema` + PATCH/DELETE endpoint functions + update/delete mutations + `DailyCheckInForm` edit mode
- **S2-PR-2** (~550–700 lines, may need further splitting): `CalendarDaySchema` + full `HeluAgendaCalendar` component tree + Citas tab Calendario/Lista toggle

Delivery strategy: `ask-on-risk` (revisit before S2 apply).

---

## Specs Synced to Main

No pre-existing main specs were found. Delta specs were copied directly as new main specs:

| Delta spec | Main spec (source of truth) | Action |
|------------|----------------------------|--------|
| `changes/agenda-ui/specs/shared-api/daily-checkin.spec.md` | `specs/shared-api/daily-checkin.spec.md` | Created (15 requirements, 9 scenarios) |
| `changes/agenda-ui/specs/mobile/bienestar.spec.md` | `specs/mobile/bienestar.spec.md` | Created (27 requirements, 12 scenarios) |
| `changes/agenda-ui/specs/mobile/agenda-calendar.spec.md` | `specs/mobile/agenda-calendar.spec.md` | Created (14 requirements, 10 scenarios) |

All S2/deferred requirements are clearly marked in main specs.

---

## Archive Contents Checklist

- [x] `exploration.md` — codebase exploration
- [x] `proposal.md` — change proposal + PRD alignment
- [x] `specs/shared-api/daily-checkin.spec.md` — 15 requirements, 9 scenarios
- [x] `specs/mobile/bienestar.spec.md` — 27 requirements, 12 scenarios
- [x] `specs/mobile/agenda-calendar.spec.md` — 14 requirements, 10 scenarios
- [x] `design.md` — architecture + file-change plan
- [x] `tasks.md` — 10 S1 tasks [x], 14 S2 tasks [ ] (blocked by design)
- [x] `verify-report.md` — PASS WITH WARNINGS, 0 CRITICALs
- [x] `archive-report.md` — this file

---

## Known Deviations (acceptable, recorded for audit)

| Deviation | Assessment |
|-----------|------------|
| Push routing via `navigationRef.navigate("MainTabs")` instead of `navigateTo("Agenda")` | Technically sound — required for nested tab navigation. `as any` casts are the only downside; track in pre-existing TS debt backlog. |
| `EmptyState` uses `action` ReactNode prop | Accepted — behavior meets RF-MB-18 correctly. |
| Card wrapped in outer `View` for accessibility | Accepted — meets RF-MB-7 convention. |
| S2 tasks remain `[ ]` at archive | Intentional — blocked by backend gates. Orchestrator approved partial archive. |

---

## Pre-existing TypeScript Debt (not introduced by this change)

59 pre-existing TypeScript errors in unrelated files at archive time. Recommended to resolve
before S2 ships:

- `AppointmentDetailScreen.tsx` — missing `surface.card` theme token (6 errors)
- `AppointmentFormScreen.tsx` / `2.tsx` — `brand.bg` token + `"numeric"` keyboardType (7 errors)
- `useAppointmentFormCore.ts` — `null` vs `undefined` mismatch in `reminderConfig` (3 errors)
- `useDocumentFormCore.ts` — missing `./documentUploadOverrides` module (2 errors)
- `packages/ui` form components — missing `text.tertiary` token (5 errors)

---

## Next Recommended Action

~~`/sdd-new agenda-ui-s2` when backend gates clear.~~ **Completed on branch `agenda` (2026-06-21).**
See **Post-Archive Addendum** below. Main specs at `openspec/specs/` are updated to SHIPPED status.

---

## Post-Archive Addendum (2026-06-21)

Slice 2 and subsequent calendar UX work shipped on branch `agenda` after backend gates cleared.
Main specs (`openspec/specs/`) updated to reflect current implementation.

### Backend gates — resolved

| Gate | Status |
|------|--------|
| `PATCH /daily-checkins/{id}` | Shipped |
| `DELETE /daily-checkins/{id}` | Shipped |
| `checkIns` in `CalendarDayResponse` | Shipped |
| `CalendarDaySchema` Zod validation | Shipped |

### Additional commits (post-archive)

| Commit | Description |
|--------|-------------|
| `0169664` | API check-in update/delete + CalendarDaySchema |
| `1da3f83` | Check-in edit/delete form modes |
| `94861cc` | Initial HeluAgendaCalendar |
| `6057ccf` | Check-ins on calendar (local dates) |
| `34b4335` | Day-column scroll |
| `4f71ce0` | Week view + cache reuse |
| `ccd9050` | 3-day view + calendar-first menu (replaces top tabs) |
| `02a95b7` | Wellbeing journal UI + infinite scroll |
| `3ca1997` | Fetch buffers + stale-while-revalidate |
| `ea01227` | Month view, medication intakes, collision lanes |
| `14c4c77` | Agenda FAB + add sheet |
| `39cbf1a` | UTC recordedAt on submit + form copy fix |

### Key UX changes documented in main specs

1. **Calendar-first navigation** — `AgendaMenuSheet` replaces permanent top tabs.
2. **Four calendar views** — day, 3-day, week, month (month = activity dots only).
3. **Agenda FAB** — multi-action add sheet (cita / medicamento / check-in) in `AgendaScreen`.
4. **Wellbeing journal** — infinite scroll, day grouping, `WellbeingHeader`.
5. **Timezone contract** — picker local → `toUtcIsoFromPickerValue` → API UTC.
6. **Medication intakes** — client-computed timeline slots from cycle schedule.
7. **Collision lanes** — overlapping events render side-by-side in day columns.

### Specs updated

| File | Change |
|------|--------|
| `openspec/specs/mobile/agenda-calendar.spec.md` | Rewritten — S2 shipped, full calendar + nav spec |
| `openspec/specs/mobile/bienestar.spec.md` | Rewritten — journal UI, edit/delete, timezone |
| `openspec/specs/shared-api/daily-checkin.spec.md` | S2 requirements marked shipped + RF-SA-16 |
