# Agenda Tasks (Tareas) — Mobile Frontend

**Issue:** [#29](https://github.com/JIADevs/FrontendHealthGuard/issues/29)  
**Backend:** [BackendHealthGuard#15](https://github.com/JIADevs/BackendHealthGuard/issues/15)  
**Implementation branch:** `feat/agenda-tasks`  
**Status:** Implemented (T1–T5); Expo SDK **57** upgrade in-branch; pending PR  
**Delivery:** Mobile only (`@helu/api` + `@helu/ui` HeluAgendaCalendar + `apps/mobile`)  
**Out of scope:** `apps/web`; cancel status (backend has only `pending` | `completed`)

## Specs

### S1 — API contract + calendar payload
Zod `AgendaTask*` schemas; `CalendarDay` includes `tasks[]`; endpoints + TanStack Query hooks; mutations invalidate `["calendar"]` and task keys.

### S2 — Calendar surface + tap
Tasks map to `AgendaEvent` type `task`; day indicators include tasks; `EventBlock` tappable via `onTaskPress` → `AgendaTaskDetail`.

### S3 — Create / edit
FAB → Agregar a agenda → Nueva tarea → form (title + start required; reminder offsets default `[30]`; optional linked docs/backpacks). Edit from detail menu (start changes via reschedule only).

### S4 — Detail, complete, reschedule
Detail shows status, offsets, links. Completar sheet (optional result doc/backpack/comment). Reagendar (new start). Loading + toast on mutations.

### S5 — Push deep links
`NotificationType` includes `AGENDA_TASK` and `AGENDA_TASK_FOLLOWUP`; `notificationRouting` opens detail; follow-up opens with `intent: complete` (user can still reschedule).

## Tasks

| ID | Spec | Status |
|----|------|--------|
| T1 | S1 | done |
| T2 | S2 | done |
| T3 | S3 | done |
| T4 | S4 | done |
| T5 | S5 | done |

## UX decisions (accepted)

- No dedicated “Tareas” tab in v1
- Calendar block tap opens detail (same as appointments)
- Detail menu `⋯` for Editar; primary buttons Completar / Reagendar
- Web deferred

## Log

- L1: User scoped mobile-only; approved calendar tap → detail; issue #29; branch `feat/agenda-tasks`.
- L2: T1 — Zod/endpoints/hooks for `/agenda-tasks`; calendar `tasks[]`; notification types `AGENDA_TASK*`. Cancel out of scope until backend supports it.
- L3: T2 — Calendar maps `tasks` → EventBlock (backpack accent); month dots + legend; `onTaskPress` → `AgendaTaskDetail`.
- L4: T3–T5 — Form + Add sheet; detail complete/reschedule; notification routing with follow-up intent.
- L5: Expo SDK 54 → 57 (App Store Expo Go is 57); same issue #29.
