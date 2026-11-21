# Spec: web — Agenda and Inicio

**Change:** design-system-v2-agenda-inicio
**Domain:** web (`apps/web`)
**Phase:** spec
**Date:** 2026-11-20
**Source:** `.docs/design/system/pages/web.md`, `.docs/design/system/pages/inicio-agenda.md`, `design.md` of this change.

Page files MUST stay thin. Agenda and Inicio UI MUST live in `apps/web/src/components/agenda/` and `apps/web/src/components/home/`. Web MUST use the same `packages/api` mutations as mobile. Web screens MUST NOT mount `BottomSheet`.

## Requirements

### RF-WEB-AI1 — Routes

The Agenda nav item MUST keep pointing at `/agenda`. These paths MUST exist:

| Screen | Path |
|---|---|
| Calendar | `/agenda` |
| Appointments | `/agenda/citas` |
| Appointment detail | `/agenda/citas/[id]` |
| New appointment | `/agenda/citas/nueva` |
| Medications | `/agenda/medicamentos` |
| Cycle detail | `/agenda/medicamentos/[cycleId]` |
| New medication | `/agenda/medicamentos/nuevo` |
| Wellbeing | `/agenda/bienestar` |
| Check-in | `/agenda/check-in` |
| New professional | `/agenda/profesionales/nuevo` |

`/agenda?tab=appointments` MUST redirect to `/agenda/citas`. `/agenda?tab=medications` MUST redirect to `/agenda/medicamentos`. Reloading a detail or form URL MUST open that detail or form again.

#### Scenario: Old tab links still land
- GIVEN the user opens `/agenda?tab=medications`
- WHEN the page loads
- THEN the browser ends on `/agenda/medicamentos`

### RF-WEB-AI2 — Modal or full view

At a viewport of 1024 px or wider, new appointment, new medication, check-in, and new professional MUST render as a 560 px modal whose height is at most the viewport minus 48 px, with a fixed footer. Below 1024 px they MUST occupy the view. Appointment detail and cycle detail MUST sit beside their list at 1280 px or wider, and MUST occupy the view below that. Closing a dirty form with the close control, Esc, the backdrop, or Back MUST open `DiscardChangesDialog` before leaving.

#### Scenario: Back on a dirty form
- GIVEN the new-appointment form has unsaved changes
- WHEN the user presses Back
- THEN the discard dialog appears and the form stays until the user confirms

### RF-WEB-AI3 — Inicio

`/dashboard` MUST lay blocks out in three columns from 1280 px, two columns from 1024 px to 1279 px, and one column below 1024 px. It MUST NOT use fixed 400 px or 360 px columns. While a dose is pending, «Tomar» MUST be the only primary action. Upload, new appointment, and share MUST be secondary. The page MUST NOT offer «Escanear». The streak card, the «Todo al día» state, and «Configura Helu» MUST follow RF-MOB-AI5, including `home_setup_checklist_hidden`. The page header MUST NOT show streak or level. The streak-card check-in MUST navigate to `/agenda/check-in`.

#### Scenario: One primary on Inicio
- GIVEN a dose is pending on `/dashboard`
- WHEN the page renders
- THEN «Tomar» is the only primary button

### RF-WEB-AI4 — Agenda content

The calendar MUST show a seven-column month. From 1024 px the «Hoy» panel MUST be 340 px beside the month. Below 1024 px that panel MUST sit under the grid. Each day MUST show at most three type icons and then «+n». The legend MUST be Tomas, Citas, Check-in, and Tareas. Mission events MUST NOT be rendered. In a day list, only the urgent action MUST be primary or success. Tasks in that list MUST offer «Completar» and «Reprogramar» as secondary actions.

Appointments and medications MUST follow the mobile rules for order, attendance, «Cómo llegar», «+ Agregar documento», cancel, active and finished, and «Tomar». «Nueva cita» MUST be a secondary «+» action. The primary action of a list-plus-detail view MUST be the main action of the open detail. «No la tomé» MUST be the 560 px modal, not a bottom sheet. Wellbeing MUST show the five faces in the same order as mobile. The selected list row MUST use the `Card` selected style.

#### Scenario: Calendar legend has no missions
- GIVEN the user is on `/agenda`
- WHEN the legend renders
- THEN it names Tomas, Citas, Check-in, and Tareas, and it does not name Misiones

### RF-WEB-AI5 — Shell breakpoint

The sidebar MUST collapse at 1024 px instead of 768 px. This change MUST NOT redesign the sidebar destinations or move account links into an avatar menu.

#### Scenario: Sidebar at tablet width
- GIVEN the viewport is 900 px wide
- WHEN any authenticated page renders
- THEN the sidebar is the collapsed menu, not the 768 px layout
