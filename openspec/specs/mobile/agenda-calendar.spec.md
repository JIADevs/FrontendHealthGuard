# Spec: mobile — HeluAgendaCalendar & Agenda navigation

**Domain:** mobile (`packages/ui/src/platform/HeluAgendaCalendar/`, `apps/mobile`)
**Source change:** agenda-ui (S1 archived 2026-06-21; S2 shipped on branch `agenda`)
**Status:** SHIPPED (mobile native)
**Last updated:** 2026-06-21

---

## Overview

The Agenda screen is **calendar-first**: `HeluAgendaCalendar` fills the default view. Citas,
Medicamentos, and Bienestar are reachable via `AgendaMenuSheet` (hamburger menu). The calendar FAB
lives in `AgendaScreen`, not inside the UI package component.

`HeluAgendaCalendar` is implemented as a **custom native component** (no external calendar
library). There is no `.web.tsx` implementation yet.

---

## Requirements

### AgendaEvent model

#### RF-AC-1 — AgendaEvent union type [shipped]

`packages/ui/src/platform/HeluAgendaCalendar/mapCalendarApiToEvents.ts` defines:

```ts
type AgendaEvent =
  | { type: "appointment"; data: Appointment; sortKey: number }
  | { type: "exam";        data: Appointment; sortKey: number }
  | { type: "checkin";     data: DailyCheckIn; sortKey: number }
  | { type: "medication";  data: Medication; dayKey: string; intakeTime: string; sortKey: number };
```

`mapCalendarApiToEvents(days: CalendarDay[]): AgendaEvent[]` flattens all days into a list sorted
by `sortKey`. Medication intakes are **computed client-side** from `firstIntakeTime` +
`frequency` (`medicationIntakeUtils.ts`).

#### RF-AC-2 — Appointments vs exams visual differentiation [shipped]

`EventBlock` renders `appointment` (primary accent + stethoscope) and `exam` (secondary + lab
icon) as distinct variants.

#### RF-AC-3 — CheckIn EventBlock [shipped]

`checkin` events render with mood emoji (`moodEmoji.ts`) + label `"Check-in"`. Visually distinct
from appointment/exam/medication blocks.

#### RF-AC-4 — Medication intake EventBlock [shipped]

`medication` events render with amber styling and pill icon. Positioned at computed intake time
for each active medication cycle day.

#### RF-AC-5 — Symptoms excluded from grid [shipped]

`mapCalendarApiToEvents` MUST NOT include symptoms in `AgendaEvent[]`.

---

### CalendarDaySchema (API layer)

#### RF-AC-6 — CalendarDaySchema dependency [shipped]

See `openspec/specs/shared-api/daily-checkin.spec.md` RF-SA-14. `useCalendarEventsQuery`
validates responses via `parseCalendarEventsResponse`.

---

### HeluAgendaCalendar component

#### RF-AC-7 — Custom implementation, native only [shipped]

`packages/ui/src/platform/HeluAgendaCalendar/` is fully custom. No `react-native-calendars`,
Solid Calendar, or equivalent runtime dependency.

#### RF-AC-8 — View modes [shipped]

| Mode | Key | Label | Columns | Nav step |
|------|-----|-------|---------|----------|
| Day | `day` | Día | 1 (24h timeline) | ±1 day |
| 3-day | `threeDay` | 3 días | 3 (anchor−1…+1) | ±3 days |
| Week | `week` | Semana | 7 (Mon–Sun) | ±7 days |
| Month | `month` | Mes | Month grid + dots | ±1 month |

- Default view: **day**, showing today.
- View range is **not persisted** between app launches (resets to day/today).
- Tapping a day in week or month view switches to **day** view with that date selected.
- Month view shows activity dots only (no hourly event blocks).

#### RF-AC-9 — Component tree [shipped]

```
packages/ui/src/platform/HeluAgendaCalendar/
├── HeluAgendaCalendar.native.tsx   ← root (DaySelector + grid or month)
├── useHeluAgendaCalendar.ts        ← state, fetch range, cache merge, nav
├── DaySelector.tsx                 ← view chips + arrows + "Hoy"
├── CalendarGrid.tsx                ← hourly timeline, day columns, collision lanes
├── MonthGridView.tsx               ← month grid, activity dots, legend
├── EventBlock.tsx                  ← appointment / exam / checkin / medication
├── eventDayLayout.ts               ← side-by-side overlap lanes
├── mapCalendarApiToEvents.ts       ← CalendarDay[] → AgendaEvent[]
├── calendarDateUtils.ts            ← local YYYY-MM-DD keys, week/month helpers
├── calendarConstants.ts            ← buffer sizes, nav steps
├── dayActivityIndicators.ts        ← hasAppointments / hasMedications / hasCheckIn
├── medicationIntakeUtils.ts        ← intake slot generation
├── moodEmoji.ts
└── index.ts
```

> **Note:** `AgendaCalendarFAB.tsx` exists but is **unused**. The live FAB is
> `apps/mobile/src/components/agenda/AgendaFAB.tsx`.

#### RF-AC-10 — useHeluAgendaCalendar hook [shipped]

The hook MUST:
- Accept `initialDate?: string` (defaults to today, local `YYYY-MM-DD`).
- Manage `selectedDate`, `viewMode`, and derived `visibleDates`.
- Fetch via `useCalendarEventsQuery` with **range expansion** (never shrinks day-mode cache).
- Apply **stale-while-revalidate** (`placeholderData: keepPreviousData`, `staleTime: 60_000`).
- Expose `selectDate`, `setViewMode`, `goToToday`, `goPrevious`, `goNext`.

Fetch buffers (`calendarConstants.ts`):
- Day mode initial: −7 / +28 days from anchor.
- Week: ±7 / +21 day buffer around visible week.
- 3-day: ±3 / +6 day buffer.
- Month: ±1 month around anchor month.

#### RF-AC-11 — CalendarGrid time lanes [shipped]

`CalendarGrid` renders hourly lanes (00:00–23:00). Events position by `eventHourFraction`.
Overlapping events in the same column use **collision lanes** (`eventDayLayout.ts`).

Check-ins filter to visible dates via `localDateKeyFromISO(recordedAt)` (device local TZ).

#### RF-AC-12 — Month activity indicators [shipped]

`MonthGridView` shows per-day dots:
- Pink — appointments or exams
- Amber — medications
- Green — check-in

Legend labels: Citas, Medicamentos, Check-in.

---

### AgendaScreen navigation

#### RF-AC-13 — Calendar-first layout [shipped]

`AgendaScreen` default view is `"calendar"`. Top tabs were replaced by:
- **Calendar view:** title `"Agenda Médica"` + menu icon → `AgendaMenuSheet`
- **List views:** back header `"← Calendario"` + section title (Citas / Medicamentos / Bienestar)

`AgendaView = "calendar" | "appointments" | "medications" | "wellbeing"`.

Deep link: `route.params.initialTab` (e.g. CHECKIN push → `"wellbeing"`).

#### RF-AC-14 — AgendaMenuSheet [shipped]

Bottom sheet with: Calendario, Citas, Medicamentos, Bienestar. Active item highlighted.

#### RF-AC-15 — Agenda FAB + add sheet [shipped]

`CalendarTab` renders:
- `HeluAgendaCalendar` (no FAB inside UI package)
- `AgendaFAB` → opens `AgendaAddSheet`

`AgendaAddSheet` options:
- **Nueva cita** → navigate to `AppointmentForm`
- **Nuevo medicamento** → `MedicationFormModal`
- **Registrar check-in** → `DailyCheckInForm`

#### RF-AC-16 — Citas list preserved [shipped]

`AppointmentsTab` keeps the existing paginated FlatList with status pills and CRUD navigation.
No Calendario/Lista toggle inside Citas — calendar is the separate default view.

---

## Acceptance Scenarios

### SC-AC-1: Calendar renders today's events by default [shipped]

**Given** the user opens Agenda  
**When** the screen loads  
**Then** `HeluAgendaCalendar` shows today in 1-day view  
**And** today's appointments, exams, check-ins, and medication intakes appear as `EventBlock` items

### SC-AC-2: Appointment and exam blocks are visually distinct [shipped]

**Given** a day has both APPOINTMENT and EXAM records  
**When** they render  
**Then** the user can distinguish them by color and icon at a glance

### SC-AC-3: Check-in blocks appear at local recordedAt hour [shipped]

**Given** the user registered a check-in at 3:00 PM local time  
**When** the calendar day is fetched  
**Then** a `checkin` EventBlock appears in the 15:00 lane on the correct local day

### SC-AC-4: View range toggle changes visible window [shipped]

**Given** the calendar is in day view  
**When** the user taps `"3 días"` or `"Semana"`  
**Then** three or seven day columns render with respective events

### SC-AC-5: Navigation arrows move the visible window [shipped]

**Given** day view showing today  
**When** the user taps the right arrow  
**Then** tomorrow's events appear (step = 1 day; 3 days in 3-day mode; 7 in week mode)

### SC-AC-6: Month view shows activity dots [shipped]

**Given** the user switches to `"Mes"`  
**When** the month grid renders  
**Then** days with events show colored dots (citas / medicamentos / check-in)  
**And** tapping a day opens day view for that date

### SC-AC-7: FAB opens add sheet with three actions [shipped]

**Given** the user is on the calendar view  
**When** they tap `AgendaFAB`  
**Then** `AgendaAddSheet` offers cita, medicamento, and check-in entry points

### SC-AC-8: Overlapping events render in parallel lanes [shipped]

**Given** two events overlap in time on the same day column  
**When** `CalendarGrid` lays them out  
**Then** both remain visible side-by-side (collision lanes)

### SC-AC-9: View range does not persist between sessions [shipped]

**Given** the user set week view  
**When** they restart the app  
**Then** the calendar defaults to day view / today again

### SC-AC-10: No external calendar library at runtime [shipped]

**Given** the production bundle is analyzed  
**Then** no external calendar library appears in dependencies

### SC-AC-11: Menu navigates to list views [shipped]

**Given** the user is on the calendar  
**When** they open `AgendaMenuSheet` and tap `"Citas"`  
**Then** the appointments list renders with a back-to-calendar header

---

## Implementation commits (branch `agenda`, selected)

| Commit | Description |
|--------|-------------|
| `94861cc` | Initial `HeluAgendaCalendar` platform component |
| `6057ccf` | Check-ins on calendar using local dates |
| `34b4335` | Day-column scroll |
| `4f71ce0` | Week view + fetch cache reuse |
| `ccd9050` | 3-day view + calendar-first menu |
| `3ca1997` | Week/3-day buffers + stale-while-revalidate |
| `ea01227` | Month view, medication intakes, collision lanes |
| `14c4c77` | Agenda FAB + add sheet |
