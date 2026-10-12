# Spec: mobile — Bienestar (Daily Check-In UI)

**Domain:** mobile (`apps/mobile`)
**Source change:** agenda-ui (S1 archived 2026-06-21; S2+ shipped on branch `agenda`); push-notification-fixes (archived 2026-08-06)
**Status:** SHIPPED
**Last updated:** 2026-08-06

---

## Overview

Bienestar is one of four views in `AgendaScreen`, reached via `AgendaMenuSheet` (not a top tab).
The list uses a **journal-style** layout grouped by local day with **infinite scroll**. Check-in
create/edit/delete and calendar integration are fully wired.

---

## Requirements

### Navigation

#### RF-MB-1 — Bienestar as AgendaMenuSheet destination [shipped]

`AgendaScreen` view `"wellbeing"` renders `WellbeingTab`. Entry points:
- `AgendaMenuSheet` → Bienestar
- CHECKIN push notification → `initialTab: "wellbeing"`
- `AgendaAddSheet` → Registrar check-in (from calendar FAB)

#### RF-MB-2 — TabParamList deep link [shipped]

`TabNavigator` → `Agenda: { initialTab?: "calendar" | "appointments" | "medications" | "wellbeing" }`.

#### RF-MB-3 — Back navigation to calendar [shipped]

List views (including Bienestar) show `"← Calendario"` in the header to return to calendar-first view.

---

### MoodPicker component

#### RF-MB-4 — MoodPicker controlled component [shipped]

`MoodPicker.tsx`: `value: MoodEnum | null`, `onChange: (mood: MoodEnum) => void`.

#### RF-MB-5 — Five mood chips [shipped]

Excelente, Bien, Regular, Mal, Muy mal (`moodConfig.ts`).

#### RF-MB-6 — Selected state [shipped]

Selected chip uses accent notification tint; unselected chips are muted.

#### RF-MB-7 — Accessibility [shipped]

Each chip has `accessibilityLabel` with mood + selection state.

---

### DailyCheckInForm component

#### RF-MB-8 — Create and edit modes [shipped]

`DailyCheckInForm.tsx` modal:
- **Create:** title `"Nuevo check-in"`, submit `"Registrar"`
- **Edit:** title `"Editar check-in"`, submit `"Guardar"`, destructive `"Eliminar"`

Fields:
- `MoodPicker` (required) — label **"¿Cómo te sientes hoy?"**
- `TextField` notes (optional)
- `DateTimePicker` for `recordedAt` (optional) — label `"Fecha y hora (opcional)"`

#### RF-MB-9 — Mutations [shipped]

- Create: `useCreateDailyCheckInMutation`
- Edit: `useUpdateDailyCheckInMutation`
- Delete: `useDeleteDailyCheckInMutation` (via `ConfirmModal`)

#### RF-MB-10 — Submit loading state [shipped]

Submit button shows loading / is disabled while `isPending`.

#### RF-MB-11 — Success toasts [shipped]

- Create: `"Check-in registrado"`
- Update: `"Check-in actualizado"`
- Delete: `"Check-in eliminado"`

#### RF-MB-12 — Error toasts [shipped]

User-readable error messages; modal stays open on create/update failure.

#### RF-MB-13 — recordedAt timezone contract [shipped]

Picker stores **local** `YYYY-MM-DDTHH:mm` via `toISOLocal` (`@helu/ui`).

On submit, `toUtcIsoFromPickerValue(recordedAt)` converts to UTC ISO before API call.
Backend treats naive datetimes as UTC — local→UTC conversion is mandatory for correct calendar
hour placement.

On edit hydrate: `pickerValueFromUtcIso(initialValues.recordedAt)`.

Default create value: `toISOLocal(new Date())`.

Helpers live in `packages/ui/src/forms/DateTimePicker/DateTimePicker.utils.ts`.

#### RF-MB-28 — recordedAt past-only constraint [shipped]

Check-in `recordedAt` MUST allow **now and any past datetime** — **future dates/times are not
allowed** (create and edit).

Implementation in `DailyCheckInForm`:
- `DateTimePicker` receives `maxDate={toISOLocal(new Date())}` (native `maximumDate`)
- `clampPickerValueToMax(value)` runs on picker change, initial state, edit hydrate, and submit
- No `minDate` — user may backdate check-ins arbitrarily into the past

Product rule: a check-in records how the user felt at a moment that already happened; scheduling
a future check-in is invalid.

Backend enforces the same rule: `POST`/`PATCH /daily-checkins/` return **422** when `recorded_at`
is after the current UTC instant (`ensure_not_future_utc` in `app/schemas/daily_checkin.py`).

#### RF-MB-14 — Delete confirmation [shipped]

`ConfirmModal`: `"¿Eliminar check-in?"` / `"Esta acción no se puede deshacer."`

---

### DailyCheckInListItem component

#### RF-MB-15 — Journal row layout [shipped]

Renders mood emoji circle, Spanish label, local time (`es-AR`, hour:minute), optional notes
(up to 4 lines).

#### RF-MB-16 — Edit affordance [shipped]

When `onEdit` is provided, pencil button opens `DailyCheckInForm` with `initialValues`.

---

### WellbeingTab

#### RF-MB-17 — Infinite scroll journal list [shipped]

`WellbeingTab` uses `SectionList` driven by `useWellbeingScreen`:
- Data: `useInfiniteDailyCheckIns` (page size 15)
- Grouped by local day via `groupCheckInsByDay`
- Section headers: `"Hoy"`, `"Ayer"`, or long `es-AR` date (capitalized)
- Pull-to-refresh + scroll-end loads next page

#### RF-MB-18 — WellbeingHeader [shipped]

Hero strip at top of Bienestar list (title/subtitle branding).

#### RF-MB-19 — Empty state [shipped]

When no check-ins and not loading: `EmptyState` with CTA `"Registrar check-in"`.

#### RF-MB-20 — WellbeingFAB [shipped]

Floating action button opens new check-in form (separate from calendar `AgendaFAB`).

#### RF-MB-21 — Loading / error states [shipped]

Initial load: `Spinner`. Error: message + retry via refetch.

#### RF-MB-22 — Multiple check-ins per day [shipped]

All entries shown; no deduplication per day.

#### RF-MB-23 — Delegation context [shipped]

`X-Patient-Context` injected by Axios interceptor when `activePatientId` is set.

---

### Push notifications

#### RF-MB-24 — CHECKIN push routes to form or toast based on fresh check-in status [shipped]

`usePushNotifications`' CHECKIN handling (via `navigateForNotification`) MUST perform a fresh
(non-cached) fetch of today's check-in status before navigating. If the user has NOT checked in
today, it MUST navigate to open `DailyCheckInForm`. If the user HAS already checked in today, it
MUST navigate to the Agenda wellbeing list AND show a toast; it MUST NOT open an empty form.

(Previously: CHECKIN push always navigated to Agenda with `initialTab: "wellbeing"`, with no
already-checked-in branch.)

#### RF-MB-25 — TabParamList precedes push fix [shipped]

TypeScript accepts `{ initialTab: "wellbeing" }` before push handler uses it.

---

### Module structure

#### RF-MB-26 — components/agenda/ barrel [shipped]

```ts
export { MoodPicker } from "./MoodPicker";
export { DailyCheckInForm } from "./DailyCheckInForm";
export { DailyCheckInListItem } from "./DailyCheckInListItem";
export { WellbeingFAB } from "./WellbeingFAB";
export { WellbeingHeader } from "./WellbeingHeader";
export { AgendaFAB } from "./AgendaFAB";
export { AgendaAddSheet } from "./AgendaAddSheet";
export { AgendaMenuSheet, type AgendaView } from "./AgendaMenuSheet";
```

#### RF-MB-27 — AgendaScreen composes only [shipped]

`AgendaScreen.tsx` wires hooks and module components; no duplicated form/list logic.

---

## Acceptance Scenarios

### SC-MB-1: Bienestar reachable from menu [shipped]

**Given** the user is on the calendar  
**When** they open the menu and tap Bienestar  
**Then** the journal list renders with back-to-calendar header

### SC-MB-2: User completes create form [shipped]

**Given** the user opens `DailyCheckInForm`  
**When** they select mood and tap Registrar  
**Then** `recordedAt` is sent as UTC ISO  
**And** success toast appears and list/calendar invalidate

### SC-MB-3: Submit loading then success [shipped]

**Given** the user submits the form  
**When** mutation is in flight  
**Then** button is non-interactive with loading state  
**When** it succeeds  
**Then** modal closes and toast appears

### SC-MB-4: Submit error keeps modal open [shipped]

**Given** the network fails  
**When** submit is attempted  
**Then** modal stays open and error toast shows

### SC-MB-5: Multiple same-day check-ins in list [shipped]

**Given** two check-ins on the same local day  
**Then** both appear under one section header, sorted by time within the section

### SC-MB-6: Empty state CTA [shipped]

**Given** no check-ins exist  
**When** loading completes  
**Then** empty state with register CTA is visible

### SC-MB-7: CHECKIN push routes to form or toast based on fresh status [shipped]

**Given** a CHECKIN notification  
**When** the user taps it (live, cold start, or from `NotificationsScreen`)  
**Then** a fresh (non-cached) fetch determines today's check-in status  
**And** if not checked in, `DailyCheckInForm` opens directly  
**And** if already checked in, a toast appears and the Agenda wellbeing list opens (no empty form)

### SC-MB-8: Delegated patient context [shipped]

**Given** `activePatientId` is set  
**Then** list queries include `X-Patient-Context` and show that patient's data

### SC-MB-9: Streak updates after create [shipped]

**Given** a check-in is created  
**Then** `["me"]` invalidation refreshes streak fields on profile

### SC-MB-10: Infinite scroll loads next page [shipped]

**Given** more than 15 check-ins exist  
**When** the user scrolls to the end  
**Then** the next page appends without clearing prior items

### SC-MB-11: Edit pre-populates fields [shipped]

**Given** the user taps edit on a list item  
**Then** mood, notes, and local `recordedAt` are pre-filled in the form

### SC-MB-12: Delete requires confirmation [shipped]

**Given** edit mode  
**When** the user taps Eliminar and confirms  
**Then** the check-in is deleted and removed from list/calendar

### SC-MB-13: Calendar hour matches submitted local time [shipped]

**Given** the user sets check-in time to 3:00 PM local  
**When** they view the calendar day  
**Then** the check-in block appears at 15:00 local (not offset by timezone)

### SC-MB-14: Future recordedAt is blocked [shipped]

**Given** the user opens `DailyCheckInForm`  
**When** they open the fecha y hora picker  
**Then** they cannot select a date or time after the current moment  
**When** they submit with a value at or before now  
**Then** the check-in is created/updated with that `recordedAt` in UTC ISO

---

## Implementation commits (branch `agenda`, selected)

| Commit | Description |
|--------|-------------|
| `1cd9f93` | MoodPicker, DailyCheckInListItem, DailyCheckInForm (S1) |
| `971727e` | WellbeingTab + CHECKIN push (S1) |
| `0169664` | API update/delete + CalendarDaySchema |
| `1da3f83` | Check-in edit/delete form modes |
| `02a95b7` | Journal UI, infinite scroll, WellbeingHeader |
| `39cbf1a` | UTC recordedAt on submit + form copy |
| `70b0691` | Block future dates on check-in recordedAt picker |
