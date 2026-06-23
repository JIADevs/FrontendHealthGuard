# Spec: shared-api — Daily Check-In & Calendar API Layer

**Domain:** shared-api (`packages/api`)
**Source change:** agenda-ui (S1 archived 2026-06-21; S2 shipped on branch `agenda`)
**Status:** SHIPPED
**Last updated:** 2026-06-22

---

## Requirements

### Daily Check-In schemas

#### RF-SA-1 — DailyCheckInSchema [shipped]

```ts
const DailyCheckInSchema = z.object({
  id:         z.string().uuid(),
  userId:     z.string().uuid(),
  createdBy:  z.string().uuid().nullable().optional(),
  mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
  recordedAt: z.string(),       // ISO 8601 UTC from backend
  notes:      z.string().nullable().optional(),
});
```

#### RF-SA-2 — DailyCheckInCreateSchema [shipped]

```ts
const DailyCheckInCreateSchema = z.object({
  mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
  recordedAt: z.string(),   // caller MUST send UTC ISO (see RF-SA-16)
  notes:      z.string().optional(),
});
```

#### RF-SA-3 — DailyCheckInPageSchema [shipped]

`createPageSchema(DailyCheckInSchema)` — Axios camelizes `total_pages` → `totalPages`.

#### RF-SA-4 — DailyCheckInUpdateSchema [shipped]

```ts
export const DailyCheckInUpdateSchema = DailyCheckInCreateSchema.partial();
```

#### RF-SA-5 — getDailyCheckIns [shipped]

`GET /daily-checkins/` with optional `page`, `limit`, `startDate`, `endDate`.
Response validated with `DailyCheckInPageSchema`.

#### RF-SA-6 — createDailyCheckIn [shipped]

`POST /daily-checkins/` → `DailyCheckInSchema.parse(data)`.

#### RF-SA-7 — updateDailyCheckIn [shipped]

`PATCH /daily-checkins/{id}` → validates response with `DailyCheckInSchema`.

Backend recalculates streak counters on update.

#### RF-SA-8 — deleteDailyCheckIn [shipped]

`DELETE /daily-checkins/{id}` (204).

Backend recalculates streak counters on delete.

---

### React Query hooks

#### RF-SA-9 — QK.dailyCheckIns [shipped]

```ts
dailyCheckIns: (page = 1, startDate?: string, endDate?: string) =>
  ["daily-checkins", page, startDate ?? null, endDate ?? null] as const,
```

Infinite variant: `["daily-checkins", "infinite", limit]`.

#### RF-SA-10 — useDailyCheckInsQuery [shipped]

Paginated query with `placeholderData: keepPreviousData`, `staleTime: 5_000`.

#### RF-SA-11 — useCreateDailyCheckInMutation [shipped]

`onSuccess` invalidates:
1. `["daily-checkins"]`
2. `["calendar"]`
3. `["me"]`

#### RF-SA-12 — useUpdateDailyCheckInMutation [shipped]

Same invalidation keys as RF-SA-11.

#### RF-SA-13 — useDeleteDailyCheckInMutation [shipped]

Same invalidation keys as RF-SA-11.

#### RF-SA-14 — CalendarDaySchema [shipped]

```ts
const CalendarDayPayloadSchema = z.object({
  appointments: z.array(AppointmentSchema).default([]),
  medications:  z.array(MedicationSchema).default([]),
  symptoms:     z.array(z.unknown()).default([]),
  checkIns:     z.array(DailyCheckInSchema).default([]),
});

export const CalendarDaySchema = CalendarDayPayloadSchema.extend({
  date: z.string(),   // "YYYY-MM-DD"
});

export function parseCalendarEventsResponse(data: unknown): CalendarDay[]
```

`getCalendarEvents` uses `parseCalendarEventsResponse`. Backend returns a record keyed by date;
parser normalizes to sorted `CalendarDay[]`.

Backend groups check-ins by **America/Bogota** local date (`_local_calendar_date`). Frontend
places check-in blocks by **device local** date from `recordedAt` UTC ISO.

#### RF-SA-15 — No business logic in endpoints [shipped]

`endpoints.ts` contains API calls + Zod validation only.

#### RF-SA-16 — recordedAt caller contract [shipped]

Mobile `DailyCheckInForm` MUST convert picker local datetime to UTC ISO before POST/PATCH:

```ts
recordedAt: toUtcIsoFromPickerValue(clampPickerValueToMax(recordedAt))
```

Before conversion, `clampPickerValueToMax` ensures the picker value does not exceed the current
moment (no future check-ins). See `openspec/specs/mobile/bienestar.spec.md` RF-MB-28.

Naive local strings (e.g. `2026-06-21T15:00`) sent without conversion are interpreted as UTC by
the backend and produce incorrect calendar hour placement in non-UTC timezones.

#### RF-SA-17 — Backend rejects future recordedAt [shipped]

`DailyCheckInCreate` and `DailyCheckInUpdate` MUST reject `recorded_at` values after the current
UTC instant via Pydantic `field_validator` → HTTP **422**.

Implementation: `app/schemas/daily_checkin.py` calls `ensure_not_future_utc` from
`app/core/datetime_utils.py` (compares with `utc_now()` after `to_utc_aware` normalization).

Past datetimes remain valid with no `min` bound. Defense in depth alongside mobile RF-MB-28.

---

## Acceptance Scenarios

### SC-SA-1: Schema validates backend response [shipped]

Valid `DailyCheckIn` JSON passes `DailyCheckInSchema.parse` without error.

### SC-SA-2: Axios camelization transparent [shipped]

`recorded_at` → `recordedAt`, `total_pages` → `totalPages` via interceptor.

### SC-SA-3: Multiple check-ins same day allowed [shipped]

Two items same local date, different times — both in `items`.

### SC-SA-4: Create invalidates three query keys [shipped]

After successful POST: `daily-checkins`, `calendar`, `me` marked stale.

### SC-SA-5: 422 surfaces fieldErrors [shipped]

Validation errors available via `isApiError` + `fieldErrors` for form display.

### SC-SA-6: Pagination keepPreviousData [shipped]

Page transition keeps prior page visible until next resolves.

### SC-SA-7: Schema parse fails loudly on drift [shipped]

Invalid mood enum throws `ZodError` in dev.

### SC-SA-8: Update/delete invalidate same keys [shipped]

PATCH and DELETE mutations invalidate `daily-checkins`, `calendar`, `me`.

### SC-SA-9: CalendarDaySchema includes checkIns [shipped]

Each parsed `CalendarDay` has `checkIns: DailyCheckIn[]` populated from backend response.

### SC-SA-10: Calendar query skips retry on ZodError [shipped]

`useCalendarEventsQuery` does not retry when response fails Zod validation (max 2 otherwise).

### SC-SA-11: Mobile rejects future recordedAt before API call [shipped]

**Given** `DailyCheckInForm` has a picker value after the current moment  
**When** the user changes the value or submits  
**Then** `clampPickerValueToMax` reduces it to now before `toUtcIsoFromPickerValue` runs  
**And** the API never receives a future `recordedAt` from the mobile form

### SC-SA-12: Backend returns 422 for future recordedAt [shipped]

**Given** a client sends `POST` or `PATCH /daily-checkins/` with `recorded_at` in the future  
**When** the request is validated  
**Then** the API responds with HTTP 422 and a field error on `recorded_at`

---

## Backend dependencies (verified)

| Endpoint / field | Status |
|------------------|--------|
| `POST /daily-checkins/` | Exists |
| `PATCH /daily-checkins/{id}` + streak recalc | Exists |
| `DELETE /daily-checkins/{id}` + streak recalc | Exists |
| `checkIns` in `CalendarDayResponse` | Exists |
| `GET /calendar/events?startDate=&endDate=` | Exists, Zod-validated |

---

## Implementation commits (branch `agenda`, selected)

| Commit | Description |
|--------|-------------|
| `fad403d` | Daily check-in schemas, endpoints, hooks (S1) |
| `0169664` | Update/delete endpoints + CalendarDaySchema |
| `61e0619` | Medication cycle schema + calendar Zod retry fix |
| `39cbf1a` | UTC recordedAt contract documented in mobile form |
| `70b0691` | `clampPickerValueToMax` + past-only recordedAt rule |
