# Spec: mobile — HeluAgendaCalendar

**Change:** agenda-ui  
**Domain:** mobile (`packages/ui/src/platform/HeluAgendaCalendar/`, `apps/mobile`)  
**Slice:** S2 — fully deferred (blocked on backend `checkIns` in `CalendarDayResponse` and
`PATCH`/`DELETE /daily-checkins/{id}`)  
**Phase:** spec  
**Date:** 2026-06-21

> **Note:** All requirements and scenarios in this file are `[S2 — deferred]` unless explicitly
> marked otherwise. No implementation work on this spec is expected until the backend gates are
> cleared. The Citas tab Calendario/Lista toggle and `HeluAgendaCalendar` grid are part of this
> slice.

---

## Backend Gates (must all be satisfied before any S2 work begins)

| Gate | Backend endpoint / field | Status |
|------|--------------------------|--------|
| Edit check-in | `PATCH /daily-checkins/{id}` + streak recalc | Missing |
| Delete check-in | `DELETE /daily-checkins/{id}` + streak recalc | Missing |
| Check-ins in calendar | `checkIns: List[DailyCheckIn]` in `CalendarDayResponse` | Missing |
| Calendar events endpoint | `GET /calendar/events?startDate=&endDate=` | Exists, no Zod |

---

## Requirements

### AgendaEvent model

#### RF-AC-1 — AgendaEvent union type [S2 — deferred]

The `packages/ui` package MUST define an `AgendaEvent` discriminated union:

```ts
type AgendaEvent =
  | { type: "appointment"; data: Appointment }
  | { type: "exam";        data: Appointment }   // type === "EXAM" from backend
  | { type: "checkin";     data: DailyCheckIn };
```

`mapCalendarApiToEvents(days: CalendarDay[]): AgendaEvent[]` MUST flatten all events from all
days into a list sorted by datetime.

#### RF-AC-2 — Appointments vs exams visual differentiation [S2 — deferred]

`EventBlock` variants MUST visually distinguish `appointment` (primary accent color + stethoscope
icon) from `exam` (secondary color + lab/beaker icon). This is a closed product decision (PRD
§Decisiones de producto).

#### RF-AC-3 — CheckIn EventBlock [S2 — deferred]

A `checkin` event MUST render as an `EventBlock` variant with mood emoji + label. It MUST be
visually distinct from appointment/exam blocks (e.g., tertiary background color).

---

### CalendarDaySchema (API layer)

#### RF-AC-4 — CalendarDaySchema in shared-api [S2 — deferred]

See `shared-api/daily-checkin.spec.md` RF-SA-14. The calendar schema is owned by the shared-api
spec; this file references it as a dependency.

---

### HeluAgendaCalendar component

#### RF-AC-5 — HeluAgendaCalendar is a custom component [S2 — deferred]

`packages/ui/src/platform/HeluAgendaCalendar/` MUST be a fully custom implementation.
No external calendar library (including Solid Calendar or react-native-calendars) MAY be used as
a runtime dependency. UX inspiration from Solid Calendar is acceptable; code dependency is not.

#### RF-AC-6 — Default view: 1-day, today [S2 — deferred]

On first render, `HeluAgendaCalendar` MUST default to the 1-day view showing today's events.
The selected day view range (1d / 3d / 7d) MUST NOT be persisted to storage in MVP v1 — it
resets to 1d on every app launch.

#### RF-AC-7 — Component tree structure [S2 — deferred]

The component tree MUST be organized as:

```
packages/ui/src/platform/HeluAgendaCalendar/
├── HeluAgendaCalendar.tsx          ← root; accepts date + events array
├── CalendarGrid.tsx                ← time-column grid with hourly lanes
├── EventBlock.tsx                  ← appointment / exam / checkin variant
├── DaySelector.tsx                 ← 1d / 3d / 7d toggle + day navigation
├── FAB.tsx                         ← floating action button for quick actions
├── useHeluAgendaCalendar.ts        ← hook: state, derived view window, event mapping
├── mapCalendarApiToEvents.ts       ← pure function: CalendarDay[] → AgendaEvent[]
└── index.ts                        ← re-exports HeluAgendaCalendar + types
```

#### RF-AC-8 — useHeluAgendaCalendar hook [S2 — deferred]

The hook MUST:
- Accept `initialDate?: string` (ISO 8601 date, defaults to today).
- Manage `selectedDate`, `viewRange` (1 | 3 | 7 days), and `visibleDates` (derived array).
- Expose `events: AgendaEvent[]` derived via `mapCalendarApiToEvents` from the
  `useCalendarEventsQuery` data for the visible date window.
- Expose `setSelectedDate`, `setViewRange`, `goToToday`, `goPrevious`, `goNext`.

#### RF-AC-9 — CalendarGrid renders time lanes [S2 — deferred]

`CalendarGrid` MUST render hourly time lanes (00:00–23:00). Events MUST be positioned within
their corresponding time slots. Events outside 08:00–20:00 SHOULD still be accessible (scroll).

#### RF-AC-10 — DaySelector toggle [S2 — deferred]

`DaySelector` MUST render a toggle for `1d` / `3d` / `7d` view ranges and left/right navigation
arrows to move the visible window. Tapping a day in the 3d or 7d view MUST set
`selectedDate` to that day and collapse to 1d detail.

#### RF-AC-11 — FAB for quick actions [S2 — deferred]

`FAB` in `HeluAgendaCalendar` MUST provide a floating action button for quick entry (e.g., add
appointment, add check-in). The specific actions MUST be configurable via props. In the Citas tab
context, the FAB MUST at minimum offer `"Nueva cita"`.

#### RF-AC-12 — No symptoms in grid v1 [S2 — deferred]

`mapCalendarApiToEvents` MUST NOT include symptoms in the returned `AgendaEvent[]` in v1. This
is a closed product decision.

---

### Citas tab — Calendario/Lista toggle

#### RF-AC-13 — Citas tab adds Calendario/Lista toggle [S2 — deferred]

The `AppointmentsTab` section in `AgendaScreen` MUST add a secondary toggle:
`"Calendario"` | `"Lista"`. Default: `"Calendario"` (1d today with `HeluAgendaCalendar`).
`"Lista"` preserves the existing flat paginated appointments list.

#### RF-AC-14 — Lista view preserved as-is [S2 — deferred]

Switching to `"Lista"` MUST render the existing appointments list unchanged — no regression.

---

## Acceptance Scenarios

### SC-AC-1: HeluAgendaCalendar renders today's events by default [S2 — deferred]

**Given** the user navigates to the Citas tab  
**When** the tab renders with `HeluAgendaCalendar` in default state  
**Then** the calendar shows today's date in 1-day view  
**And** all appointments, exams, and check-ins for today are visible as `EventBlock` items  
**Note:** Deferred — requires backend `checkIns` in calendar response + Zod validation.

### SC-AC-2: Appointment and exam blocks are visually distinct [S2 — deferred]

**Given** the calendar day contains both a `type: APPOINTMENT` and a `type: EXAM` record  
**When** they render as `EventBlock` components  
**Then** appointment block uses primary accent color + stethoscope icon  
**And** exam block uses secondary color + lab icon  
**And** the user can distinguish them at a glance  
**Note:** Deferred.

### SC-AC-3: Check-in blocks render in the grid [S2 — deferred]

**Given** the user has registered two check-ins today  
**When** the calendar day is fetched and `mapCalendarApiToEvents` processes it  
**Then** two `checkin` EventBlocks appear in the time lane at their `recordedAt` times  
**Note:** Deferred — requires `checkIns` in `CalendarDayResponse`.

### SC-AC-4: View range toggle changes visible window [S2 — deferred]

**Given** the calendar is in 1d view  
**When** the user taps `"3d"` in `DaySelector`  
**Then** three day columns render with their respective events  
**And** the previously selected date remains centered

### SC-AC-5: Navigation arrows move the visible window [S2 — deferred]

**Given** the calendar is in 1d view showing today  
**When** the user taps the right arrow  
**Then** tomorrow's events are shown  
**When** they tap the left arrow  
**Then** today's events are restored

### SC-AC-6: FAB opens new appointment flow [S2 — deferred]

**Given** the user is viewing the Citas tab in Calendario mode  
**When** they tap the FAB  
**Then** the new appointment form opens (existing flow)

### SC-AC-7: Citas tab Lista view preserved [S2 — deferred]

**Given** the user is on the Citas tab in Calendario mode  
**When** they tap the `"Lista"` toggle  
**Then** the existing flat paginated appointments list renders with no regressions  
**And** all existing appointment CRUD actions still work

### SC-AC-8: mapCalendarApiToEvents excludes symptoms [S2 — deferred]

**Given** a `CalendarDay` contains `symptoms`, `appointments`, `exams`, and `checkIns`  
**When** `mapCalendarApiToEvents([day])` is called  
**Then** the result contains only `appointment`, `exam`, and `checkin` events  
**And** no `symptom` events appear in the grid

### SC-AC-9: View range does not persist between sessions [S2 — deferred]

**Given** the user set the calendar to 7d view  
**When** they close and reopen the app  
**Then** the calendar defaults to 1d view again (no persistence in MVP)

### SC-AC-10: No external calendar library at runtime [S2 — deferred]

**Given** `HeluAgendaCalendar` is fully implemented  
**When** the bundle is analyzed  
**Then** no `react-native-calendars`, `solid-calendar`, or equivalent external calendar library
appears in the production dependency tree
