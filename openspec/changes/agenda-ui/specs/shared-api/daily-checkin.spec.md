# Spec: shared-api — Daily Check-In API Layer

**Change:** agenda-ui  
**Domain:** shared-api (`packages/api`)  
**Slice:** S1 (schemas, list, create, hooks, invalidations), S2 (update, delete, CalendarDaySchema)  
**Phase:** spec  
**Date:** 2026-06-21

---

## Requirements

### RF-SA-1 — DailyCheckInSchema [S1]

The package `@helu/api` MUST export a `DailyCheckInSchema` Zod object that exactly mirrors the
backend `DailyCheckIn` response after Axios camelization:

```ts
const DailyCheckInSchema = z.object({
  id:         z.string().uuid(),
  userId:     z.string().uuid(),
  createdBy:  z.string().uuid().nullable().optional(),
  mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
  recordedAt: z.string(),       // ISO 8601; camelized from recorded_at
  notes:      z.string().nullable().optional(),
});

export type DailyCheckIn = z.infer<typeof DailyCheckInSchema>;
```

### RF-SA-2 — DailyCheckInCreateSchema [S1]

The package MUST export `DailyCheckInCreateSchema`:

```ts
const DailyCheckInCreateSchema = z.object({
  mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
  recordedAt: z.string(),   // caller sets new Date().toISOString()
  notes:      z.string().optional(),
});

export type DailyCheckInCreate = z.infer<typeof DailyCheckInCreateSchema>;
```

### RF-SA-3 — DailyCheckInPageSchema [S1]

The package MUST export `DailyCheckInPageSchema` using the existing `createPageSchema` factory:

```ts
export const DailyCheckInPageSchema = createPageSchema(DailyCheckInSchema);
export type DailyCheckInPage = z.infer<typeof DailyCheckInPageSchema>;
```

The Axios response interceptor already camelizes `total_pages` → `totalPages` transparently; no
custom transform is needed.

### RF-SA-4 — DailyCheckInUpdateSchema [S2 — deferred]

When backend `PATCH /daily-checkins/{id}` is available, the package MUST export:

```ts
export const DailyCheckInUpdateSchema = DailyCheckInCreateSchema.partial();
export type DailyCheckInUpdate = z.infer<typeof DailyCheckInUpdateSchema>;
```

**Gate:** backend `PATCH /daily-checkins/{id}` + streak recalc.

### RF-SA-5 — getDailyCheckIns endpoint [S1]

The package MUST export:

```ts
export async function getDailyCheckIns(params?: {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
}): Promise<DailyCheckInPage>
```

Implementation MUST:
- Call `GET /daily-checkins/` via `apiClient` passing `params` as query params.
- Validate the response with `DailyCheckInPageSchema.parse(data)` — MUST fail loudly in dev
  if the backend shape drifts.
- Return the typed `DailyCheckInPage`.

### RF-SA-6 — createDailyCheckIn endpoint [S1]

The package MUST export:

```ts
export async function createDailyCheckIn(payload: DailyCheckInCreate): Promise<DailyCheckIn>
```

Implementation MUST call `POST /daily-checkins/` and validate the response with
`DailyCheckInSchema.parse(data)`.

### RF-SA-7 — updateDailyCheckIn endpoint [S2 — deferred]

The package MUST export `updateDailyCheckIn(id: string, payload: DailyCheckInUpdate): Promise<DailyCheckIn>`
calling `PATCH /daily-checkins/{id}`.

**Gate:** backend `PATCH /daily-checkins/{id}`.

### RF-SA-8 — deleteDailyCheckIn endpoint [S2 — deferred]

The package MUST export `deleteDailyCheckIn(id: string): Promise<void>` calling
`DELETE /daily-checkins/{id}` (expects 204).

**Gate:** backend `DELETE /daily-checkins/{id}`.

### RF-SA-9 — Query key QK.dailyCheckIns [S1]

The `QK` object in `reactQueryHooks.ts` MUST include:

```ts
dailyCheckIns: (page = 1, startDate?: string, endDate?: string) =>
  ["daily-checkins", page, startDate ?? null, endDate ?? null] as const,
```

### RF-SA-10 — useDailyCheckInsQuery [S1]

The package MUST export `useDailyCheckInsQuery(params?)` using `useQuery` with:
- `queryKey: QK.dailyCheckIns(params?.page, params?.startDate, params?.endDate)`
- `queryFn: () => getDailyCheckIns(params)`
- `placeholderData: keepPreviousData` — keeps previous page data visible while next page loads.

### RF-SA-11 — useCreateDailyCheckInMutation [S1]

The package MUST export `useCreateDailyCheckInMutation()` using `useMutation` whose `onSuccess`
callback MUST invalidate all three of:

1. `queryClient.invalidateQueries({ queryKey: ["daily-checkins"] })`
2. `queryClient.invalidateQueries({ queryKey: ["calendar"] })`
3. `queryClient.invalidateQueries({ queryKey: ["me"] })` — refreshes `currentStreak` /
   `longestStreak` updated by the backend on `POST`.

### RF-SA-12 — useUpdateDailyCheckInMutation [S2 — deferred]

MUST be added when backend `PATCH` is ready. `onSuccess` MUST invalidate the same three keys as
RF-SA-11.

### RF-SA-13 — useDeleteDailyCheckInMutation [S2 — deferred]

MUST be added when backend `DELETE` is ready. `onSuccess` MUST invalidate the same three keys as
RF-SA-11.

### RF-SA-14 — CalendarDaySchema [S2 — deferred, backend-blocked]

When the backend adds `checkIns` to `CalendarDayResponse`, the package MUST export:

```ts
export const CalendarDaySchema = z.object({
  date:         z.string(),                         // "YYYY-MM-DD"
  appointments: z.array(AppointmentSchema),
  medications:  z.array(MedicationSchema),
  symptoms:     z.array(z.unknown()),
  checkIns:     z.array(DailyCheckInSchema),        // new in S2
});
export type CalendarDay = z.infer<typeof CalendarDaySchema>;
```

`useCalendarEventsQuery` MUST be updated to validate with `z.array(CalendarDaySchema).parse(data)`
(currently returns raw unvalidated data).

**Gate:** backend `checkIns` field in `CalendarDayResponse`.

### RF-SA-15 — No business logic in endpoint files [S1]

Per team convention (`api-integration` skill), `endpoints.ts` MUST contain only API calls + Zod
validation. All business logic belongs in feature hooks or components.

---

## Acceptance Scenarios

### SC-SA-1: Schema validates backend response correctly [S1]

**Given** the backend returns a valid `DailyCheckIn` JSON object  
**When** `DailyCheckInSchema.parse(data)` is called  
**Then** it returns a fully typed `DailyCheckIn` with no runtime error

### SC-SA-2: Axios camelization is transparent [S1]

**Given** the backend returns `{ "recorded_at": "2026-06-21T12:00:00Z", "total_pages": 3 }`  
**When** the Axios response interceptor processes the response  
**Then** the shape delivered to Zod is `{ recordedAt: "...", totalPages: 3 }` — no manual
transform required

### SC-SA-3: Multiple check-ins same day are allowed [S1]

**Given** the backend returns two items with the same `recordedAt` date (different times)  
**When** `getDailyCheckIns()` parses the page  
**Then** both items are present in `items` and both pass `DailyCheckInSchema.parse`

### SC-SA-4: Create invalidates all three query keys [S1]

**Given** `useCreateDailyCheckInMutation` is in idle state  
**When** `mutate(payload)` is called and the backend responds with 201  
**Then** queries `["daily-checkins"]`, `["calendar"]`, and `["me"]` are all marked stale and
will refetch on next access

### SC-SA-5: Create mutation 422 surfaces fieldErrors [S1]

**Given** `POST /daily-checkins/` returns HTTP 422 with a Pydantic validation error body  
**When** the Axios response interceptor runs `parseApiError`  
**Then** `isApiError(error) === true`, `error.status === 422`, and `error.fieldErrors` contains
a key-value map of field names to error messages usable in `DailyCheckInForm`

### SC-SA-6: Pagination keepPreviousData [S1]

**Given** the user has loaded page 2 of the check-in list  
**When** the query key changes to page 3 (new `useDailyCheckInsQuery({ page: 3 })`)  
**Then** page 2 data remains rendered until page 3 resolves — no blank flash between pages

### SC-SA-7: Schema parse error fails loudly in dev [S1]

**Given** the backend returns a check-in with `mood: "terrible"` (not in enum)  
**When** `DailyCheckInSchema.parse(data)` is called  
**Then** a `ZodError` is thrown — the team is alerted to backend drift immediately

### SC-SA-8: Update/delete invalidate same three keys [S2 — deferred]

**Given** `useUpdateDailyCheckInMutation` or `useDeleteDailyCheckInMutation` completes  
**When** `onSuccess` fires  
**Then** `["daily-checkins"]`, `["calendar"]`, and `["me"]` are all invalidated  
**Note:** Scenario deferred — requires backend PATCH/DELETE endpoints.

### SC-SA-9: CalendarDaySchema includes checkIns array [S2 — deferred]

**Given** the backend adds `checkIns: List[DailyCheckIn]` to `CalendarDayResponse`  
**When** `useCalendarEventsQuery` parses the response with `z.array(CalendarDaySchema)`  
**Then** each `CalendarDay` has a `checkIns: DailyCheckIn[]` array populated correctly  
**Note:** Scenario deferred — requires backend `checkIns` field.
