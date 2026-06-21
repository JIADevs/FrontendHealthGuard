# Exploration — agenda-ui

**Change:** agenda-ui  
**Phase:** explore  
**Date:** 2026-06-21  
**Status:** done

---

## Executive Summary

The frontend is fully unblocked for **Slice 1** (Tab Bienestar MVP: list + create check-in) using existing `GET/POST /daily-checkins/` backend endpoints. Slice 2 (edit/delete, HeluAgendaCalendar grilla) is **blocked** on `PATCH /daily-checkins/{id}`, `DELETE /daily-checkins/{id}`, and extending `GET /calendar/events` with `checkIns` — none of which exist yet in the backend.

---

## Codebase State

### What exists today

| Area | File / symbol | State |
|------|---------------|-------|
| `AgendaScreen` tabs | `apps/mobile/src/screens/AgendaScreen.tsx` | 2 tabs: `appointments` \| `medications` |
| Tab param type | `TabNavigator.tsx` → `TabParamList.Agenda.initialTab` | `"appointments" \| "medications"` only |
| Calendar query hook | `packages/api/src/reactQueryHooks.ts` → `useCalendarEventsQuery` | Defined, **unused** in any screen |
| Calendar endpoint | `packages/api/src/endpoints.ts` → `getCalendarEvents` | No Zod validation — returns raw `data` |
| Calendar schema (backend) | `app/schemas/calendar.py` → `CalendarDayResponse` | `appointments`, `medications`, `symptoms` — **no `checkIns`** |
| Check-in endpoint (backend) | `app/api/api_v1/endpoints/daily_checkins.py` | `GET /` + `POST /` — **no PATCH/DELETE** |
| Check-in schema (frontend) | `packages/api/src/schemas.ts` | **Does not exist** |
| Check-in endpoints (frontend) | `packages/api/src/endpoints.ts` | **Does not exist** |
| Check-in hooks (frontend) | `packages/api/src/reactQueryHooks.ts` | **Does not exist** |
| Agenda module components | `apps/mobile/src/components/agenda/` | **Directory does not exist** |
| Push CHECKIN handler | `apps/mobile/src/hooks/usePushNotifications.ts` → `handleNotificationTap` | All types (CHECKIN, APPOINTMENT, etc.) navigate to `Notifications` — **broken** |
| Profile streak fields | `packages/api/src/schemas.ts` → `UserProfileSchema` | `currentStreak`, `longestStreak` present |
| `DailyCheckInPage` (backend) | `app/schemas/daily_checkin.py` | Returns `total_pages` (snake_case) |
| Axios camelizer | `packages/api/src/client.ts` | Auto-camelizes responses — `total_pages` → `totalPages` ✓ |

### Key infrastructure available for reuse

- `Modal`, `ConfirmModal`, `Card`, `Spinner`, `EmptyState`, `Button`, `TextField`, `DateTimePicker`, `ActionButton`, `Pagination`, `Typography` — all in `@helu/ui`
- `Toast` from `react-native-toast-message` — already wired in `AgendaScreen`
- `useAppTheme` for tokens
- Same tab pattern (style, `tabActive`, etc.) already in `AgendaScreen`
- `isApiError` from `@helu/api`
- `createPageSchema` factory for paginated responses

---

## Approach Analysis

### Option A — Slice 1 first (UI with existing backend), Slice 2 when backend ready

| Factor | Assessment |
|--------|------------|
| Unblocked? | YES — GET + POST exist. List + create check-in fully deliverable now |
| Slice boundary | Clear: Slice 1 = list + create; Slice 2 = edit + delete + calendar grilla |
| User value | Immediate: tab Bienestar visible, users can register check-ins, push fixed |
| Risk | Low — no backend changes needed in Slice 1 |
| Coupling | Slice 2 can build on Slice 1's schemas/hooks |

### Option B — Wait for full backend before starting UI

| Factor | Assessment |
|--------|------------|
| Blocks frontend | Unnecessary — 70% of Bienestar MVP works now |
| Delays push fix | Undesirable; push CHECKIN is broken today for all users |
| Risk | Higher: more changes in a single PR |

**Recommendation: Option A.** Start Slice 1 immediately.

---

## Slice 1 — UI-first, existing backend only (RECOMMENDED SCOPE)

**Goal:** Ship Tab Bienestar with check-in list + create. Fix push CHECKIN handler.  
**Backend requirement:** None (uses `GET /daily-checkins/` + `POST /daily-checkins/`).

### Files to create or modify

#### `packages/api` layer

| File | Action | What changes |
|------|--------|-------------|
| `packages/api/src/schemas.ts` | **Modify** | Add `DailyCheckInSchema`, `DailyCheckInCreateSchema`, `DailyCheckInPageSchema`; export inferred types |
| `packages/api/src/endpoints.ts` | **Modify** | Add `getDailyCheckIns(params)` + `createDailyCheckIn(payload)` with Zod validation |
| `packages/api/src/reactQueryHooks.ts` | **Modify** | Add `QK.dailyCheckIns`, `useDailyCheckInsQuery`, `useCreateDailyCheckInMutation` (invalidates `dailyCheckIns` + `calendar` + `profile`) |

> `packages/api/src/hooks.ts` and `index.ts` need no changes — both already re-export `reactQueryHooks` and `schemas`.

#### `apps/mobile/src/components/agenda/` module (new)

| File | Action | What it does |
|------|--------|-------------|
| `MoodPicker.tsx` | **Create** | Row of 5 mood chips (Excelente→Muy mal); controlled `value` + `onChange`. Uses `palette.accent.notification` tint for selected state |
| `DailyCheckInForm.tsx` | **Create** | Modal wrapping `MoodPicker` + optional `TextField` (notes) + `DateTimePicker` (recordedAt). Slice 1: create-only. Loading state on submit per `frontend-mutation-feedback` skill |
| `DailyCheckInListItem.tsx` | **Create** | Card showing mood emoji + label + `recordedAt` date + notes. Editar button (opens form — enabled in Slice 2 via prop) |
| `index.ts` | **Create** | Re-exports public symbols: `MoodPicker`, `DailyCheckInForm`, `DailyCheckInListItem` |

#### `apps/mobile` screens / navigation

| File | Action | What changes |
|------|--------|-------------|
| `apps/mobile/src/screens/AgendaScreen.tsx` | **Modify** | Add 3rd tab `"wellbeing"` with `WellbeingTab` component (paginated list of check-ins + "+ Registrar" CTA + `DailyCheckInForm` modal) |
| `apps/mobile/src/navigation/TabNavigator.tsx` | **Modify** | Extend `TabParamList.Agenda.initialTab` to include `"wellbeing"` |
| `apps/mobile/src/hooks/usePushNotifications.ts` | **Modify** | Fix `CHECKIN` case in `handleNotificationTap` → `navigateTo("Agenda", { initialTab: "wellbeing" })` |

### Zod schema design

```ts
// DailyCheckInSchema — matches backend DailyCheckIn (camelized by Axios)
const DailyCheckInSchema = z.object({
  id:         z.string().uuid(),
  userId:     z.string().uuid(),
  createdBy:  z.string().uuid().nullable().optional(),
  mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
  recordedAt: z.string(),   // ISO 8601, camelized from recorded_at
  notes:      z.string().nullable().optional(),
});

const DailyCheckInCreateSchema = z.object({
  mood:       z.enum(["excellent", "good", "okay", "bad", "awful"]),
  recordedAt: z.string(),   // default to new Date().toISOString() in form
  notes:      z.string().optional(),
});

// Reuses existing createPageSchema factory
const DailyCheckInPageSchema = createPageSchema(DailyCheckInSchema);
```

> **Camelization note:** The Axios response interceptor in `client.ts` already auto-camelizes all keys, so `recorded_at` → `recordedAt` and `total_pages` → `totalPages` transparently.

### Query key addition

```ts
QK.dailyCheckIns: (page = 1, startDate?: string, endDate?: string) =>
  ["daily-checkins", page, startDate ?? null, endDate ?? null] as const
```

### Mutation invalidations (RF-5.3)

`useCreateDailyCheckInMutation.onSuccess` must invalidate:
1. `["daily-checkins"]` — refresh list in tab Bienestar
2. `["calendar"]` — calendar grilla (future use; costs nothing now)
3. `["me"]` — profile streak (`currentStreak` updated by backend on POST)

### AgendaScreen tab structure (after Slice 1)

```
AgendaScreen
├── Tab: appointments  (existing AppointmentsTab)
├── Tab: medications   (existing MedicationsTab)
└── Tab: wellbeing     (new WellbeingTab)
    ├── FlatList of DailyCheckInListItem (paginated)
    ├── EmptyState + "Registrar" CTA when empty
    └── DailyCheckInForm modal (create-only, no edit in Slice 1)
```

### Push fix

```ts
// usePushNotifications.ts — handleNotificationTap
case "CHECKIN":
  navigateTo("Agenda", { initialTab: "wellbeing" });
  break;
```

---

## Slice 2 — Backend-dependent features (DEFERRED)

**Blocked on:** Backend `PATCH /daily-checkins/{id}`, `DELETE /daily-checkins/{id}`, and `checkIns` in `CalendarDayResponse`.

### Backend changes required (BackendHealthGuard)

| Change | File | Detail |
|--------|------|--------|
| `PATCH /daily-checkins/{id}` | `app/api/api_v1/endpoints/daily_checkins.py` | Update mood, notes, recordedAt; owner validation (same as symptoms pattern) |
| `DELETE /daily-checkins/{id}` | `app/api/api_v1/endpoints/daily_checkins.py` | Delete + trigger streak recalculation |
| `DailyCheckInUpdate` schema | `app/schemas/daily_checkin.py` | Partial fields |
| Streak recalc in update/delete | `app/crud/crud_daily_checkin.py` | Recalculate if recorded_at day changes or check-in deleted |
| `checkIns` in calendar | `app/schemas/calendar.py` + `calendar.py` | Add `checkIns: List[DailyCheckIn]` to `CalendarDayResponse`; fetch in date range |

### Frontend additions in Slice 2

| File | Action | What changes |
|------|--------|-------------|
| `packages/api/src/schemas.ts` | Add | `DailyCheckInUpdateSchema` |
| `packages/api/src/endpoints.ts` | Add | `updateDailyCheckIn(id, payload)`, `deleteDailyCheckIn(id)` |
| `packages/api/src/reactQueryHooks.ts` | Add | `useUpdateDailyCheckInMutation`, `useDeleteDailyCheckInMutation`; add `CalendarDaySchema` with `checkIns`; fix `useCalendarEventsQuery` to validate with Zod |
| `apps/mobile/src/components/agenda/DailyCheckInForm.tsx` | Extend | Add edit mode (initial values) + destructive "Eliminar" button with `ConfirmModal` |
| `apps/mobile/src/components/agenda/DailyCheckInListItem.tsx` | Extend | Wire `onEdit` prop (passes check-in to form) |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Extend | Wire edit flow in `WellbeingTab` |
| `packages/ui/src/platform/HeluAgendaCalendar/` | **Create** | Entire new component tree (see PRD §Estructura de archivos); depends on `checkIns` in calendar events |

---

## Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `PATCH`/`DELETE` backend not ready | **Blocker for Slice 2** | Slice 1 is fully independent; defer edit/delete UI to Slice 2 |
| `CalendarDayResponse` missing `checkIns` | **Blocker for HeluAgendaCalendar** | Calendar grilla moved to Slice 2 entirely |
| `getCalendarEvents` has no Zod validation today | Medium | Add `CalendarDaySchema` in Slice 2 when we wire up the grilla; low risk in Slice 1 since we don't consume it |
| `DailyCheckInPage.totalPages` camelization | Low | Axios interceptor auto-camelizes; `createPageSchema` factory works transparently |
| 3rd tab may crowd mobile header | Low | PRD decision closed: use icons + short labels; test on 375px viewport |
| Push CHECKIN navigation: `navigateTo("Agenda", { initialTab: "wellbeing" })` requires `TabParamList` update first | Low | Must update `TabParamList` before patching push handler |
| `DailyCheckInForm` `recordedAt` default timezone | Medium | Default to `new Date().toISOString()`; backend stores UTC; display converts to local per `toLocaleString` |

---

## Key Patterns to Follow

| Pattern | Source |
|---------|--------|
| Tab structure (tab, tabActive, tabContent styles) | `AgendaScreen.tsx` |
| Mutation feedback (spinner + toast) | `frontend-mutation-feedback` skill + `AgendaScreen.tsx` pattern |
| Paginated list with `keepPreviousData` | `useAppointmentsQuery` in `reactQueryHooks.ts` |
| Hook adapter (screen-level form state) | `useMedicationForm.ts` adapter pattern |
| Modal form | `MedicationFormModal` in `AgendaScreen.tsx` |
| Query invalidation on mutation | `useCreateAppointmentMutation.onSettled` |
| Core hook in `packages/api`, adapter in `apps/mobile/src/hooks/` | `code-conventions` skill |
| Module components in `apps/mobile/src/components/{module}/` | `openspec/config.yaml` + documents module as reference |

---

## File Touch Summary

### Slice 1 (deliverable now)

```
packages/api/src/schemas.ts                     [MODIFY — add DailyCheckIn schemas]
packages/api/src/endpoints.ts                   [MODIFY — add getDailyCheckIns, createDailyCheckIn]
packages/api/src/reactQueryHooks.ts             [MODIFY — add QK + hooks]
apps/mobile/src/components/agenda/MoodPicker.tsx           [CREATE]
apps/mobile/src/components/agenda/DailyCheckInForm.tsx     [CREATE]
apps/mobile/src/components/agenda/DailyCheckInListItem.tsx [CREATE]
apps/mobile/src/components/agenda/index.ts                 [CREATE]
apps/mobile/src/screens/AgendaScreen.tsx        [MODIFY — add WellbeingTab]
apps/mobile/src/navigation/TabNavigator.tsx     [MODIFY — extend TabParamList]
apps/mobile/src/hooks/usePushNotifications.ts   [MODIFY — fix CHECKIN handler]
```

Total: **10 files** (4 create, 6 modify). Estimated ~350–400 changed lines.

### Slice 2 (deferred — needs backend)

```
BackendHealthGuard — 5 files (PATCH/DELETE/schemas/crud/calendar)
packages/api/src/schemas.ts                     [MODIFY — DailyCheckInUpdateSchema]
packages/api/src/endpoints.ts                   [MODIFY — update/delete]
packages/api/src/reactQueryHooks.ts             [MODIFY — update/delete mutations + CalendarDaySchema]
apps/mobile/src/components/agenda/DailyCheckInForm.tsx     [EXTEND — edit + delete mode]
apps/mobile/src/components/agenda/DailyCheckInListItem.tsx [EXTEND — onEdit wire]
apps/mobile/src/screens/AgendaScreen.tsx        [EXTEND — edit flow in WellbeingTab]
packages/ui/src/platform/HeluAgendaCalendar/    [CREATE — entire new tree, ~10 files]
```
