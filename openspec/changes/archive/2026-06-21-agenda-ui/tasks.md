# Tasks: agenda-ui — Tab Bienestar + HeluAgendaCalendar

**Change:** agenda-ui · **Phase:** tasks · **Date:** 2026-06-21  
**Artifact store:** openspec · **Delivery strategy:** ask-on-risk

---

## Review Workload Forecast

| Slice | Files | Est. lines changed | 400-line budget risk | Chained PRs recommended |
|-------|-------|--------------------|----------------------|------------------------|
| S1 — Bienestar MVP | 10 | ~375 | **Medium** (borderline — 94% of budget) | No — single PR fits |
| S2 — Edit/Delete + Grid | 14 | ~700–900 | **High** | **Yes — minimum 2 chained PRs** |

### S1 line breakdown (applies to ask-on-risk gate)

| File | Action | Est. lines |
|------|--------|-----------|
| `packages/api/src/schemas.ts` | Modify | ~40 |
| `packages/api/src/endpoints.ts` | Modify | ~30 |
| `packages/api/src/reactQueryHooks.ts` | Modify | ~45 |
| `apps/mobile/src/components/agenda/MoodPicker.tsx` | Create | ~70 |
| `apps/mobile/src/components/agenda/DailyCheckInListItem.tsx` | Create | ~55 |
| `apps/mobile/src/components/agenda/DailyCheckInForm.tsx` | Create | ~100 |
| `apps/mobile/src/components/agenda/index.ts` | Create | ~6 |
| `apps/mobile/src/navigation/TabNavigator.tsx` | Modify | ~5 |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modify | ~80 |
| `apps/mobile/src/hooks/usePushNotifications.ts` | Modify | ~5 |
| **Total** | | **~436** |

> **Note:** Design estimated 375 lines; component implementations often run 10–15% over estimate.
> Monitor the diff before opening the PR. If the PR lands above 400 lines, open a GitHub issue
> tagging `size:exception` before merging, per the project's review conventions.

### S2 chained PR split (when backend gates clear)

| PR | Scope | Est. lines |
|----|-------|-----------|
| S2-PR-1 | PATCH/DELETE endpoints + update/delete hooks + edit/delete UI (`DailyCheckInForm` edit mode) | ~200 |
| S2-PR-2 | `CalendarDaySchema` validation + `HeluAgendaCalendar` component tree + `AgendaScreen` Calendario/Lista toggle | ~550–700 |

S2-PR-2 is itself over budget and MAY need a third slice at implementation time (grid internals vs screen wiring).
Revisit with `ask-on-risk` when S2 work begins.

---

## Slice 1 — Bienestar MVP (apply-ready)

> All S1 tasks target the existing backend (`GET`/`POST /daily-checkins/`). No backend gates block any task below.
> Execution order follows config: `packages/api` → `components/agenda/` → screens/navigation/hooks.

### Phase 1 — API Layer (`packages/api`)

> **Suggested work-unit commit:** `feat(api): add daily check-in schemas, endpoints, and query hooks`
> Covers tasks 1.1–1.3. The API layer compiles and is useful independently.

- [x] **1.1** — Add `DailyCheckInSchema`, `DailyCheckInCreateSchema`, `DailyCheckInPageSchema` and their inferred types to `packages/api/src/schemas.ts`
  - `DailyCheckInSchema`: `id`, `userId`, `createdBy`, `mood` (MoodEnum), `recordedAt`, `notes` — see RF-SA-1
  - `DailyCheckInCreateSchema`: `mood` (required), `recordedAt` (required), `notes` (optional) — see RF-SA-2
  - `DailyCheckInPageSchema = createPageSchema(DailyCheckInSchema)` — see RF-SA-3
  - All types exported as named exports (`export type DailyCheckIn = z.infer<...>`)
  - `MoodEnum = "excellent" | "good" | "okay" | "bad" | "awful"` defined in this file and re-exported

- [x] **1.2** — Add `getDailyCheckIns` and `createDailyCheckIn` endpoint functions to `packages/api/src/endpoints.ts`
  - `getDailyCheckIns(params?: { page?, limit?, startDate?, endDate? }): Promise<DailyCheckInPage>` — `GET /daily-checkins/` — validate with `DailyCheckInPageSchema.parse(data)` — RF-SA-5
  - `createDailyCheckIn(payload: DailyCheckInCreate): Promise<DailyCheckIn>` — `POST /daily-checkins/` — validate with `DailyCheckInSchema.parse(data)` — RF-SA-6
  - Zero business logic in this file — pure API calls + Zod validation — RF-SA-15
  - Both functions exported as named exports

- [x] **1.3** — Add `QK.dailyCheckIns`, `useDailyCheckInsQuery`, and `useCreateDailyCheckInMutation` to `packages/api/src/reactQueryHooks.ts`
  - `QK.dailyCheckIns`: `(page = 1, startDate?, endDate?) => ["daily-checkins", page, startDate ?? null, endDate ?? null] as const` — RF-SA-9
  - `useDailyCheckInsQuery(params?)`: `useQuery` with `queryKey: QK.dailyCheckIns(...)`, `queryFn: getDailyCheckIns(params)`, `placeholderData: keepPreviousData` — RF-SA-10
  - `useCreateDailyCheckInMutation()`: `useMutation` — `onSuccess` MUST invalidate `["daily-checkins"]`, `["calendar"]`, and `["me"]` — RF-SA-11
  - All three exported as named exports; hook imports from `@helu/api/hooks` entry point (not root index)

---

### Phase 2 — Module Components (`apps/mobile/src/components/agenda/`)

> **Suggested work-unit commit:** `feat(mobile/agenda): add MoodPicker, DailyCheckInListItem, and DailyCheckInForm`
> Covers tasks 2.1–2.4. Components compile and are importable independently of screen changes.

- [x] **2.1** — Create `apps/mobile/src/components/agenda/MoodPicker.tsx`
  - Controlled component with `value: MoodEnum | null` and `onChange: (mood: MoodEnum) => void` — RF-MB-4
  - Renders exactly five tappable chips in order: `Excelente`, `Bien`, `Regular`, `Mal`, `Muy mal` — RF-MB-5
  - Selected chip uses `palette.accent.notification` (emerald) token — RF-MB-6; unselected chips neutral/muted
  - Each chip has `accessibilityLabel` including label + selection state, e.g. `"Excelente, seleccionado"` — RF-MB-7
  - English `MoodEnum` values map to Spanish labels inside this component; no label logic leaks out
  - Uses token colors only — never hex literals (code-conventions)

- [x] **2.2** — Create `apps/mobile/src/components/agenda/DailyCheckInListItem.tsx`
  - Props: `{ checkIn: DailyCheckIn; onEdit?: (checkIn: DailyCheckIn) => void }` — RF-MB-15, RF-MB-16
  - Renders: mood emoji + Spanish label, `recordedAt` formatted as local date + time (via `toLocaleString()`), notes if present — RF-MB-15
  - `onEdit` prop accepted; in S1 the edit button is rendered but disabled/hidden (not wired) — RF-MB-16
  - Emoji map defined locally; same map SHOULD be shared with `MoodPicker` (extract to a `moodConfig` constant in this file or a sibling `moodConfig.ts`)
  - `accessibilityLabel` on the item — RF-MB-7 style convention

- [x] **2.3** — Create `apps/mobile/src/components/agenda/DailyCheckInForm.tsx`
  - Props: `{ onClose: () => void }` (S1) — RF-MB-8
  - Wraps `MoodPicker` (required field), optional `TextField` for notes, optional `DateTimePicker` for `recordedAt` (defaults to `new Date().toISOString()`) — RF-MB-8, RF-MB-13
  - Submit button labeled `"Registrar"` — RF-MB-8
  - On submit: calls `useCreateDailyCheckInMutation().mutate(payload)` where payload conforms to `DailyCheckInCreate` — RF-MB-9
  - While `isPending === true`: submit button shows loading indicator and is non-interactive — RF-MB-10
  - On `onSuccess`: dismiss modal + show `"Check-in registrado"` toast via `react-native-toast-message` — RF-MB-11
  - On `onError`: show error toast `"No se pudo registrar el check-in"`, modal stays open for retry — RF-MB-12
  - `recordedAt` timezone: `new Date().toISOString()` (UTC) — RF-MB-13

- [x] **2.4** — Create `apps/mobile/src/components/agenda/index.ts`
  - Re-exports all three public components as named exports — RF-MB-26:
    ```ts
    export { MoodPicker } from "./MoodPicker";
    export { DailyCheckInForm } from "./DailyCheckInForm";
    export { DailyCheckInListItem } from "./DailyCheckInListItem";
    ```
  - All imports in screens MUST use `components/agenda`, not individual file paths

---

### Phase 3 — Screens, Navigation, Hooks

> **Suggested work-unit commit:** `feat(mobile): add WellbeingTab to AgendaScreen and fix CHECKIN push routing`
> Covers tasks 3.1–3.3. This is the user-visible delivery; depends on Phase 1 + Phase 2.

- [x] **3.1** — Modify `apps/mobile/src/navigation/TabNavigator.tsx` — extend `TabParamList`
  - `Agenda.initialTab` union extended: `"appointments" | "medications" | "wellbeing"` — RF-MB-2
  - Default `"appointments"` preserved — RF-MB-2
  - **This task MUST be completed before task 3.3** (TypeScript must accept `{ initialTab: "wellbeing" }`) — RF-MB-25

- [x] **3.2** — Modify `apps/mobile/src/screens/AgendaScreen.tsx` — add `WellbeingTab`
  - Tab union extended to include `"wellbeing"` — RF-MB-1
  - Third permanent tab renders with label `"Bienestar"` and heart/wellness icon — RF-MB-3
  - `WellbeingTab` section composed (NOT inline JSX logic) — RF-MB-27:
    - While `isLoading`: render `Spinner` or skeleton consistent with existing tabs — RF-MB-20
    - If `isError`: render error message with retry affordance — RF-MB-21
    - If `items` empty + not loading: render `EmptyState` (from `@helu/ui`) with CTA `"Registrar check-in"` that opens `DailyCheckInForm` — RF-MB-18
    - Otherwise: `FlatList` of `DailyCheckInListItem` from `useDailyCheckInsQuery` — RF-MB-17
    - All check-ins shown including multiple per day — no deduplication — RF-MB-22
    - Pagination implemented (next-page on scroll end or explicit control) — RF-MB-17
    - `"+ Registrar"` button always visible above/below list — RF-MB-19
  - `X-Patient-Context` delegation handled transparently by Axios interceptor — no additional logic needed — RF-MB-23
  - Screen accepts `initialTab="wellbeing"` prop — RF-MB-27
  - All component imports from `components/agenda` barrel — not from individual files

- [x] **3.3** — Modify `apps/mobile/src/hooks/usePushNotifications.ts` — fix CHECKIN routing
  - Add `"CHECKIN"` case in `handleNotificationTap` to navigate to `AgendaScreen` with `initialTab: "wellbeing"` — RF-MB-24:
    ```ts
    case "CHECKIN":
      navigateTo("Agenda", { initialTab: "wellbeing" });
      break;
    ```
  - **Prerequisite:** task 3.1 must be done first (TS guard) — RF-MB-25
  - Verify TypeScript compiles without error: `pnpm exec tsc --noEmit -p apps/mobile`

---

## Slice 2 — Edit/Delete + Grid (design-only, blocked)

> **Status: BLOCKED — do not apply until all backend gates are cleared.**
>
> Gates required before ANY S2 work:
> - `PATCH /daily-checkins/{id}` + streak recalculation (backend)
> - `DELETE /daily-checkins/{id}` + streak recalculation (backend)
> - `checkIns: List[DailyCheckIn]` field in `CalendarDayResponse` (backend)
>
> When gates clear, revisit delivery strategy with `ask-on-risk` before starting S2 tasks.

### Phase 4 — API Layer S2 (`packages/api`) [BLOCKED]

- [ ] **4.1** — Add `DailyCheckInUpdateSchema` to `packages/api/src/schemas.ts`
  - `DailyCheckInUpdateSchema = DailyCheckInCreateSchema.partial()` — RF-SA-4
  - **Gate:** backend `PATCH /daily-checkins/{id}`

- [ ] **4.2** — Add `updateDailyCheckIn` and `deleteDailyCheckIn` to `packages/api/src/endpoints.ts`
  - `updateDailyCheckIn(id: string, payload: DailyCheckInUpdate): Promise<DailyCheckIn>` — `PATCH /daily-checkins/{id}` — RF-SA-7
  - `deleteDailyCheckIn(id: string): Promise<void>` — `DELETE /daily-checkins/{id}` (204) — RF-SA-8
  - **Gates:** backend PATCH + DELETE endpoints

- [ ] **4.3** — Add `useUpdateDailyCheckInMutation`, `useDeleteDailyCheckInMutation`, and `CalendarDaySchema` to `packages/api/src/reactQueryHooks.ts`
  - Both mutations: `onSuccess` invalidates `["daily-checkins"]`, `["calendar"]`, `["me"]` — RF-SA-12, RF-SA-13
  - `CalendarDaySchema`: `{ date, appointments, medications, symptoms, checkIns: z.array(DailyCheckInSchema) }` — RF-SA-14
  - `useCalendarEventsQuery` updated to validate with `z.array(CalendarDaySchema).parse(data)` — RF-SA-14
  - **Gate:** all three backend endpoints + `checkIns` field

### Phase 5 — Edit/Delete UI (`apps/mobile/src/components/agenda/`) [BLOCKED]

- [ ] **5.1** — Modify `apps/mobile/src/components/agenda/DailyCheckInForm.tsx` — add edit mode
  - Accept `initialValues?: DailyCheckIn` prop — RF-MB-14
  - When `initialValues` provided: pre-populate mood, notes, `recordedAt`; call `useUpdateDailyCheckInMutation` on submit
  - Render destructive `"Eliminar"` button that opens `ConfirmModal` before calling `useDeleteDailyCheckInMutation` — RF-MB-14
  - **Gate:** tasks 4.2 + 4.3 done

- [ ] **5.2** — Modify `apps/mobile/src/screens/AgendaScreen.tsx` — wire `onEdit` in `WellbeingTab`
  - Pass `onEdit` callback to `DailyCheckInListItem` → opens `DailyCheckInForm` with `initialValues` — RF-MB-14
  - **Gate:** task 5.1 done

### Phase 6 — `HeluAgendaCalendar` component tree (`packages/ui`) [BLOCKED]

> All tasks in this phase require `CalendarDaySchema` (task 4.3) and the edit/delete mutations (4.2–4.3).
> S2-PR-2 covers tasks 6.1–6.8 + task 5.2. Revisit splitting if > 400 lines at implementation time.

- [ ] **6.1** — Create `packages/ui/src/platform/HeluAgendaCalendar/mapCalendarApiToEvents.ts`
  - Pure function: `mapCalendarApiToEvents(days: CalendarDay[]): AgendaEvent[]` — RF-AC-1
  - Flattens appointments, exams, and check-ins; sorts by datetime — RF-AC-1
  - MUST NOT include symptoms — RF-AC-12
  - No `react-native-*` imports (pure logic hook rule)

- [ ] **6.2** — Create `packages/ui/src/platform/HeluAgendaCalendar/useHeluAgendaCalendar.ts`
  - Hook: `selectedDate`, `viewRange` (1|3|7), `visibleDates` (derived), `events: AgendaEvent[]` — RF-AC-8
  - Accepts `initialDate?: string` (ISO 8601, defaults to today) — RF-AC-8
  - Exposes `setSelectedDate`, `setViewRange`, `goToToday`, `goPrevious`, `goNext` — RF-AC-8
  - Uses `mapCalendarApiToEvents` + `useCalendarEventsQuery` for the visible date window — RF-AC-8
  - No `react-native-*` imports — shared logic hook rule

- [ ] **6.3** — Create `packages/ui/src/platform/HeluAgendaCalendar/CalendarGrid.tsx`
  - Hourly lanes 00:00–23:00; events positioned in their time slot — RF-AC-9
  - Events outside 08:00–20:00 accessible via scroll — RF-AC-9

- [ ] **6.4** — Create `packages/ui/src/platform/HeluAgendaCalendar/DaySelector.tsx`
  - 1d / 3d / 7d toggle + prev/next navigation arrows — RF-AC-10
  - Tapping a day in 3d or 7d view sets `selectedDate` and collapses to 1d — RF-AC-10

- [ ] **6.5** — Create `packages/ui/src/platform/HeluAgendaCalendar/FAB.tsx`
  - Configurable floating action button for quick actions via props — RF-AC-11
  - In Citas tab context: at minimum offers `"Nueva cita"` action — RF-AC-11

- [ ] **6.6** — Create `packages/ui/src/platform/HeluAgendaCalendar/EventBlock.tsx`
  - `appointment` variant: primary accent color + stethoscope icon — RF-AC-2
  - `exam` variant: secondary color + lab/beaker icon — RF-AC-2
  - `checkin` variant: mood emoji + label + tertiary background color (emerald) — RF-AC-3
  - Discriminated union on `type: "appointment" | "exam" | "checkin"` — RF-AC-1

- [ ] **6.7** — Create `packages/ui/src/platform/HeluAgendaCalendar/HeluAgendaCalendar.native.tsx` + `index.ts`
  - Root `.native.tsx`: composes `DaySelector` + `CalendarGrid` + `FAB`; uses `useHeluAgendaCalendar` — RF-AC-7
  - Default 1-day view showing today; view range MUST NOT persist to storage — RF-AC-6
  - No external calendar library (`react-native-calendars`, `solid-calendar`, etc.) — RF-AC-5
  - `index.ts`: re-exports `HeluAgendaCalendar` + `AgendaEvent` types
  - `[web-deferred]` `.web.tsx` file not created now; reuse path via same hook documented in design

- [ ] **6.8** — Modify `apps/mobile/src/screens/AgendaScreen.tsx` — Calendario/Lista toggle in `AppointmentsTab`
  - Secondary toggle `"Calendario"` | `"Lista"` in `AppointmentsTab` — RF-AC-13
  - Default: `"Calendario"` (1d today with `HeluAgendaCalendar`) — RF-AC-13
  - `"Lista"` renders existing flat paginated appointments list unchanged — RF-AC-14
  - **Gate:** tasks 6.1–6.7 done

---

## TypeScript Validation Gate

After completing S1 tasks 1.1–3.3, run:

```bash
pnpm exec tsc --noEmit -p apps/mobile
```

Zero type errors is the acceptance gate for S1. This replaces test-runner CI (config `tdd: false`).

---

## Spec Coverage Map

| Task | Spec requirements covered |
|------|--------------------------|
| 1.1 | RF-SA-1, RF-SA-2, RF-SA-3 |
| 1.2 | RF-SA-5, RF-SA-6, RF-SA-15 |
| 1.3 | RF-SA-9, RF-SA-10, RF-SA-11 |
| 2.1 | RF-MB-4, RF-MB-5, RF-MB-6, RF-MB-7 |
| 2.2 | RF-MB-15, RF-MB-16 |
| 2.3 | RF-MB-8, RF-MB-9, RF-MB-10, RF-MB-11, RF-MB-12, RF-MB-13 |
| 2.4 | RF-MB-26 |
| 3.1 | RF-MB-2, RF-MB-25 |
| 3.2 | RF-MB-1, RF-MB-3, RF-MB-17, RF-MB-18, RF-MB-19, RF-MB-20, RF-MB-21, RF-MB-22, RF-MB-23, RF-MB-27 |
| 3.3 | RF-MB-24, RF-MB-25 |
| 4.1 | RF-SA-4 |
| 4.2 | RF-SA-7, RF-SA-8 |
| 4.3 | RF-SA-12, RF-SA-13, RF-SA-14 |
| 5.1 | RF-MB-14 |
| 5.2 | RF-MB-14 (wiring) |
| 6.1 | RF-AC-1, RF-AC-12 |
| 6.2 | RF-AC-8 |
| 6.3 | RF-AC-9 |
| 6.4 | RF-AC-10 |
| 6.5 | RF-AC-11 |
| 6.6 | RF-AC-2, RF-AC-3 |
| 6.7 | RF-AC-5, RF-AC-6, RF-AC-7 |
| 6.8 | RF-AC-13, RF-AC-14 |
