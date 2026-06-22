# Proposal: Agenda UI — Tab Bienestar + HeluAgendaCalendar

## Intent

Helu stores appointments and medications but exposes them as flat paginated lists with no time-based view, and the backend's daily check-in feature (streak logic, `CHECKIN` push) has **no frontend at all**. This change turns Agenda into a daily health planner: a permanent **Bienestar** tab for check-ins and a custom **HeluAgendaCalendar** grid for the Citas tab. Delivered UI-first against the existing backend, then extended once backend PATCH/DELETE/calendar work lands.

## Scope

### In Scope
- **Slice 1 (UI-first, existing backend):** `@helu/api` check-in layer (schemas, endpoints, hooks), 3rd permanent **Bienestar** tab (paginated list + create check-in via `MoodPicker`/`DailyCheckInForm`), fix broken `CHECKIN` push handler.
- **Slice 2 (backend-dependent):** edit/delete check-in, `checkIns` in calendar read model, custom `HeluAgendaCalendar` grid (1d default) in `packages/ui`.

### Out of Scope
- Web UI screens — shared layer (`packages/api`, module contracts) is built so web reuses it later `[web-deferred]`; no web screens this change.
- Symptoms in the grid (v1), provider scheduling, EMR/Google/Apple sync, medication-history redesign, offline check-in queue (online only).

## Capabilities

### New Capabilities
- `daily-checkin`: list/create/edit/delete check-ins, mood model, streak invalidation, Bienestar tab UX.
- `agenda-calendar`: HeluAgendaCalendar grid — `AgendaEvent` model, day/range view, EventBlock variants (appointment vs exam vs check-in), FAB.

### Modified Capabilities
- `agenda-navigation`: extend `TabParamList.Agenda.initialTab` with `"wellbeing"`; Calendario/Lista toggle in Citas tab.
- `push-notifications`: route `CHECKIN` tap to Agenda Bienestar instead of Notifications.

## Approach

Follow `code-conventions` layering: schemas + endpoints (Zod, Axios auto-camelizes) + core hooks live in `packages/api`; reusable check-in UI lives in `apps/mobile/src/components/agenda/` (module folder per config); `AgendaScreen` only composes. Grid is a self-contained `packages/ui/src/platform/HeluAgendaCalendar/` tree driven by `useHeluAgendaCalendar` + `mapCalendarApiToEvents`, inspired by Solid Calendar but **fully custom** (no demo dependency). Mutations invalidate `daily-checkins` + `calendar` + `me` (RF-5.3).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `packages/api/src/{schemas,endpoints,reactQueryHooks}.ts` | Modified | Check-in schemas/endpoints/hooks (S1); update/delete + `CalendarDaySchema` (S2) |
| `apps/mobile/src/components/agenda/` | New | `MoodPicker`, `DailyCheckInForm`, `DailyCheckInListItem`, `index.ts` |
| `apps/mobile/src/screens/AgendaScreen.tsx` | Modified | Add `WellbeingTab`; wire edit flow (S2) |
| `apps/mobile/src/navigation/TabNavigator.tsx` | Modified | Extend `initialTab` with `"wellbeing"` |
| `apps/mobile/src/hooks/usePushNotifications.ts` | Modified | Fix `CHECKIN` handler |
| `packages/ui/src/platform/HeluAgendaCalendar/` | New (S2) | Custom grid component tree |
| `BackendHealthGuard` (PATCH/DELETE/calendar/crud/schema) | Modified (S2) | Reference repo — out of this frontend slice |

## Slice Boundaries

### Slice 1 — Bienestar MVP (deliverable now)
- **Backend:** none (uses `GET`/`POST /daily-checkins/`).
- **Success:** Bienestar tab visible mobile; user creates ≥1 (and multiple/day) check-ins; list paginates; streak updates after create; `CHECKIN` push opens Bienestar; delegated patient context loads correct check-ins.

### Slice 2 — Edit/Delete + Grid (blocked on backend)
- **Backend prerequisite:** `PATCH`/`DELETE /daily-checkins/{id}` + streak recalc + `checkIns` in `CalendarDayResponse`.
- **Success:** edit/delete check-in with streak recalc; Citas tab defaults to calendar (1d, today); appointments vs exams visually distinct; check-ins render same day; data from `GET /calendar/events`.

## Proposal Assumptions (product decisions — closed in PRD, do not re-open)

- Bienestar is the **3rd permanent tab**; multiple check-ins/day allowed; edit yes (Slice 2).
- `HeluAgendaCalendar` is **custom** (Solid Calendar UX inspiration only, no demo dependency).
- Default view **1d** on open, no 1/3/7d persistence in MVP; FAB for quick actions (mobile).
- Exam vs cita = visual differentiation (icon + color); **no symptoms** in grid v1; check-in **online only**.
- Mood enum `excellent|good|okay|bad|awful` → Spanish UI labels; streak counts ≥1 check-in/calendar-day once.
- Mobile-first; web deferred but shared layer reusable.

## Open Product Questions

None blocking — all MVP product decisions are closed per PRD §Decisiones de producto. Backend availability of PATCH/DELETE/calendar `checkIns` is the only Slice 2 gate (engineering dependency, not a product question).

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Slice 2 backend (PATCH/DELETE/calendar) not ready | High | Slice 1 fully independent; gate Slice 2 on backend |
| Slice 2 (backend + frontend + grid tree) exceeds 400-line review budget | High | Chained/stacked PRs — see Review Workload Forecast |
| `getCalendarEvents` has no Zod validation today | Medium | Add `CalendarDaySchema` in Slice 2 when wiring grid |
| `recordedAt` timezone (UTC store vs local display) | Medium | Default `new Date().toISOString()`; display via locale |
| 3rd tab crowds 375px header | Low | Icons + short labels; test narrow viewport |

## Rollback Plan

- **Slice 1:** revert the feature PR — additive only (new module dir, new `@helu/api` exports, additive tab + push case). No schema/data migration; no backend change.
- **Slice 2:** frontend PRs revert independently of backend; backend PATCH/DELETE/calendar revert on the backend repo; calendar grid is behind the Calendario/Lista toggle (Lista preserves existing CRUD).

## Dependencies

- Slice 1: existing `GET`/`POST /daily-checkins/`; `createPageSchema` factory; `@helu/ui` primitives; `react-native-toast-message`.
- Slice 2: backend `PATCH`/`DELETE /daily-checkins/{id}`, `checkIns` in `CalendarDayResponse`; `react-native-reanimated` + `react-native-gesture-handler` (grid gestures).

## Success Criteria

- [ ] Slice 1: Bienestar tab lists check-ins, creates (incl. multiple/day), streak updates, push fixed, delegation works — no backend changes.
- [ ] Slice 2: edit/delete with streak recalc; calendar grid default (1d today) with distinct exam/cita blocks + same-day check-ins from `GET /calendar/events`.
- [ ] All check-in UI lands as module components in `components/agenda/`; screens compose only; shared layer ready for web reuse `[web-deferred]`.

## Review Workload Forecast

- **Slice 1:** ~10 files (4 create, 6 modify), **~375 changed lines** — within the 400-line budget. **Single PR.**
- **Slice 2:** Backend (~5 files) + frontend update/delete + `HeluAgendaCalendar` tree (~10 files) — **well over 400 lines**.
- **Decision needed before apply: Yes** (Slice 2).
- **Chained PRs recommended: Yes** (Slice 2): (1) backend PATCH/DELETE + streak, (2) backend calendar `checkIns`, (3) frontend edit/delete, (4) `HeluAgendaCalendar` grid. Slice 1 ships independently first.
- **400-line budget risk: Low** (Slice 1) / **High** (Slice 2).
- Strategy: `ask-on-risk` — propose the chained split before applying Slice 2.
