# Design: Agenda UI — Tab Bienestar + HeluAgendaCalendar

**Change:** agenda-ui · **Date:** 2026-06-21 · **Store:** openspec
Layer order (config): `packages/api` → `apps/mobile/src/components/agenda/` → screens.

## Technical Approach

Slice 1 ships entirely against the existing backend (`GET`/`POST /daily-checkins/`). The shared `@helu/api` package gains check-in schemas, endpoints and TanStack Query hooks following the exact `createPageSchema` + `QK` + `useQuery/useMutation` patterns already used for appointments/medications. Reusable check-in UI lives in a new module folder `components/agenda/`; `AgendaScreen` only composes it as a third `WellbeingTab`. The `CHECKIN` push case is fixed to route to the new tab. Slice 2 (edit/delete + `HeluAgendaCalendar` grid in `packages/ui`) is fully designed below but **gated on backend** — no apply work until gates clear.

## Architecture Decisions

| Decision | Choice | Alternatives rejected | Rationale |
|---|---|---|---|
| Check-in data layer location | Flat additions to existing `schemas.ts` / `endpoints.ts` / `reactQueryHooks.ts` | New `endpoints/daily-checkins.api.ts` folder | Repo uses flat files (skill folder layout is stale); match reality |
| Hook consumption | Components import from `@helu/api/hooks` | `@helu/api` root | Root `index.ts` does not re-export `reactQueryHooks`; `/hooks` does |
| WellbeingTab placement | Subcomponent inside `AgendaScreen.tsx` (like `AppointmentsTab`/`MedicationsTab`) | Separate screen | Mirrors existing tab pattern; reuses header/tab chrome |
| Create invalidation | `["daily-checkins"]` + `["calendar"]` + `["me"]` | Only `["daily-checkins"]` | `me` carries streak counters updated server-side (RF-SA-11) |
| Mood selected tint | `palette.accent.notification` (emerald) | brand color | Check-ins are the `notification` accent feature (design-system L3) |
| Grid (S2) | Custom `packages/ui/src/platform/HeluAgendaCalendar/` | `react-native-calendars` | Closed product decision: custom grid, no calendar lib at runtime |

## Data Flow (Slice 1 — create)

```
DailyCheckInForm ──mutate(payload)──▶ useCreateDailyCheckInMutation
       ▲ (loading/toast)                     │ POST /daily-checkins/  (Zod parse)
       │                                      ▼ onSuccess
       └──────── WellbeingTab ◀── invalidate ["daily-checkins"],["calendar"],["me"]
                 (useDailyCheckInsQuery, keepPreviousData)
```

## File Changes

### Slice 1 — Bienestar MVP (deliverable now, ~375 lines)

| File | Action | Description |
|---|---|---|
| `packages/api/src/schemas.ts` | Modify | Add `DailyCheckInSchema`, `DailyCheckInCreateSchema`, `DailyCheckInPageSchema = createPageSchema(...)` + inferred types (RF-SA-1/2/3) |
| `packages/api/src/endpoints.ts` | Modify | Add `getDailyCheckIns(params)` (`GET /daily-checkins/`, `DailyCheckInPageSchema.parse`) + `createDailyCheckIn(payload)` (`POST`, `DailyCheckInSchema.parse`) — no business logic (RF-SA-5/6/15) |
| `packages/api/src/reactQueryHooks.ts` | Modify | Add `QK.dailyCheckIns`, `useDailyCheckInsQuery` (keepPreviousData), `useCreateDailyCheckInMutation` (3-key invalidation) (RF-SA-9/10/11) |
| `apps/mobile/src/components/agenda/MoodPicker.tsx` | Create | Controlled 5-chip mood selector; selected = emerald; a11y labels (RF-MB-4–7) |
| `apps/mobile/src/components/agenda/DailyCheckInForm.tsx` | Create | `Modal` + `MoodPicker` + `TextField` notes + `DateTimePicker`; submit→create mutation with loading + success/error toast (RF-MB-8–13) |
| `apps/mobile/src/components/agenda/DailyCheckInListItem.tsx` | Create | Mood emoji+label, local `recordedAt`, notes; `onEdit?` prop (unwired S1) (RF-MB-15/16) |
| `apps/mobile/src/components/agenda/index.ts` | Create | Re-export the three components (RF-MB-26) |
| `apps/mobile/src/navigation/TabNavigator.tsx` | Modify | `Agenda.initialTab` union += `"wellbeing"` (RF-MB-2) |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modify | Tab union += `"wellbeing"`; add `WellbeingTab` (list/empty/loading/error + create CTA); accept `initialTab="wellbeing"` (RF-MB-1/17–22/27) |
| `apps/mobile/src/hooks/usePushNotifications.ts` | Modify | Split `CHECKIN` case → `navigateTo("Agenda", { initialTab: "wellbeing" })` (RF-MB-24) |

### Slice 2 — Edit/Delete + Grid (DESIGN ONLY — backend-gated, do NOT apply)

| File | Action | Slice | Description |
|---|---|---|---|
| `packages/api/src/schemas.ts` | Modify | S2 | `DailyCheckInUpdateSchema = DailyCheckInCreateSchema.partial()`; `CalendarDaySchema` w/ `checkIns` (RF-SA-4/14) |
| `packages/api/src/endpoints.ts` | Modify | S2 | `updateDailyCheckIn` (`PATCH`), `deleteDailyCheckIn` (`DELETE`); add `z.array(CalendarDaySchema).parse` to `getCalendarEvents` (RF-SA-7/8/14) |
| `packages/api/src/reactQueryHooks.ts` | Modify | S2 | `useUpdate/useDeleteDailyCheckInMutation` (same 3-key invalidation) (RF-SA-12/13) |
| `apps/mobile/src/components/agenda/DailyCheckInForm.tsx` | Modify | S2 | `initialValues` edit mode + destructive delete via `ConfirmModal` (RF-MB-14) |
| `packages/ui/src/platform/HeluAgendaCalendar/*` | Create | S2 | Custom grid tree (see below) |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modify | S2 | Wire `onEdit`; `Calendario`/`Lista` toggle in `AppointmentsTab` (RF-AC-13/14) |

## Interfaces / Contracts

```ts
// @helu/api (schemas.ts) — S1
type MoodEnum = "excellent" | "good" | "okay" | "bad" | "awful";
// MoodPicker
type MoodPickerProps = { value: MoodEnum | null; onChange: (m: MoodEnum) => void };
// DailyCheckInForm
type DailyCheckInFormProps = {
  onClose: () => void;
  initialValues?: DailyCheckIn; // S2 — edit mode
};
// DailyCheckInListItem
type DailyCheckInListItemProps = { checkIn: DailyCheckIn; onEdit?: (c: DailyCheckIn) => void };
```

Spanish UI labels: Excelente · Bien · Regular · Mal · Muy mal (enum stays English per backend contract). Emoji map drives both `MoodPicker` and `DailyCheckInListItem`.

## HeluAgendaCalendar Component Tree (S2 — packages/ui platform pattern)

```
packages/ui/src/platform/HeluAgendaCalendar/
├── useHeluAgendaCalendar.ts     ← shared logic: selectedDate, viewRange(1|3|7), visibleDates,
│                                   events via mapCalendarApiToEvents(useCalendarEventsQuery data)
├── mapCalendarApiToEvents.ts    ← pure: CalendarDay[] → AgendaEvent[] (appointment|exam|checkin; NO symptoms)
├── HeluAgendaCalendar.native.tsx← composes DaySelector + CalendarGrid + FAB (default 1d/today, no persist)
├── HeluAgendaCalendar.web.tsx   ← [web-deferred] same hook, web presentation
├── CalendarGrid.tsx             ← hourly lanes 00–23, events positioned by recordedAt/time
├── EventBlock.tsx               ← variants: appointment(brand+stethoscope) / exam(secondary+lab) / checkin(emerald+mood)
├── DaySelector.tsx              ← 1d/3d/7d toggle + prev/next nav
├── FAB.tsx                      ← configurable quick actions ("Nueva cita")
└── index.ts                     ← export HeluAgendaCalendar + AgendaEvent types
```

`AgendaEvent` discriminated union per RF-AC-1; hook follows the shared-`useX`/platform-extension rule (logic imports no `react-native-*`). Reuses existing `useCalendarEventsQuery` once `CalendarDaySchema` validation lands. Web file deferred but reuses the same hook — documented reuse path.

## Slice Dependencies

```
S1 (independent) ─ ships first as single PR (~375 lines, within budget)
S2 backend gates ─▶ chained PRs: (1) PATCH/DELETE+streak · (2) calendar checkIns
                         │
                         ▼ frontend chained PRs: (3) edit/delete UI · (4) HeluAgendaCalendar grid
```

`RF-MB-2` (TabParamList) must precede `RF-MB-24` (push fix) so TS accepts `initialTab: "wellbeing"`.

## Testing Strategy

Config sets `tdd: false`, no test command; verify gate is `pnpm exec tsc --noEmit -p apps/mobile`. Validation relies on Zod parse failing loudly on backend drift (SC-SA-7) + manual scenario walkthrough (SC-MB-1…10).

## Migration / Rollout

No data migration. S1 is additive (revert = revert one PR). S2 grid sits behind the Calendario/Lista toggle; Lista preserves existing CRUD.

## Open Questions

- [ ] None blocking. Slice 2 is gated only by backend `PATCH`/`DELETE /daily-checkins/{id}` and `checkIns` in `CalendarDayResponse` (engineering dependency, not a design question).
