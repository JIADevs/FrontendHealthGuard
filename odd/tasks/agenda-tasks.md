# Agenda Tasks (Tareas) — Mobile Frontend

**Issue:** [#29](https://github.com/JIADevs/FrontendHealthGuard/issues/29)  
**Backend:** [BackendHealthGuard#15](https://github.com/JIADevs/BackendHealthGuard/issues/15)  
**Implementation branch:** `feat/agenda-tasks`  
**Status:** In progress (T1)  
**Delivery:** Mobile only (`@helu/api` + `@helu/ui` HeluAgendaCalendar + `apps/mobile`)  
**Out of scope:** `apps/web`; cancel status (backend has only `pending` | `completed`)

## Specs

### S1 — API contract + calendar payload
Zod `AgendaTask*` schemas; `CalendarDay` includes `tasks[]` (no longer stripped); endpoints + TanStack Query hooks for list/get/create/update/complete/reschedule; mutations invalidate `["calendar"]` and task keys.

### S2 — Calendar surface + tap
Tasks map to `AgendaEvent` type `task`; day indicators include tasks; `EventBlock` is tappable via `onTaskPress` → `AgendaTaskDetail`.

### S3 — Create / edit
FAB → Agregar a agenda → Nueva tarea → form (title + start required; reminder offsets default `[15]`; optional linked docs/backpacks). Edit from detail menu.

### S4 — Detail, complete, reschedule, cancel
Detail shows status, offsets, links. Completar sheet (optional result doc/backpack/comment). Reagendar (new start). Cancelar → cancelled status. Loading + toast on mutations.

### S5 — Push deep links
`NotificationType` includes `AGENDA_TASK` and `AGENDA_TASK_FOLLOWUP`; `notificationRouting` opens detail and honors complete/reschedule intent when payload provides it.

## Tasks

| ID | Spec | Status |
|----|------|--------|
| T1 | S1 | pending |
| T2 | S2 | pending |
| T3 | S3 | pending |
| T4 | S4 | pending |
| T5 | S5 | pending |

### T1 — `@helu/api` schemas, endpoints, hooks
- `AgendaTask` + Create/Update/Complete/Reschedule (+ page if needed)
- Extend `CalendarDayPayloadSchema.tasks`
- Extend notification enum
- Endpoints under `/agenda-tasks`
- Query/mutation hooks + cache invalidation
- Optional `useAgendaTaskFormCore`

### T2 — HeluAgendaCalendar mapping + press
- `mapCalendarApiToEvents`, indicators, `EventBlock` task style
- `onTaskPress` through native calendar → `AgendaScreen`

### T3 — Form + Add sheet + routes
- `AgendaAddSheet` option Nueva tarea
- `AgendaTaskFormScreen` + navigator params
- Reuse doc/backpack picker pattern from appointments

### T4 — Detail + complete + reschedule + cancel
- `AgendaTaskDetailScreen`
- Complete sheet / reschedule picker
- Mutation feedback (spinner + toast)

### T5 — Notification routing
- Enum already in T1; wire `navigateForNotification`
- Follow-up CTA → complete or reschedule entry

## UX decisions (accepted)

- No dedicated “Tareas” tab in v1
- Calendar block tap opens detail (same as appointments)
- Detail menu `⋯` for Editar / Cancelar; primary buttons Completar / Reagendar
- Web deferred

## Log

- L1: User scoped mobile-only; approved calendar tap → detail; issue #29; branch `feat/agenda-tasks`.
