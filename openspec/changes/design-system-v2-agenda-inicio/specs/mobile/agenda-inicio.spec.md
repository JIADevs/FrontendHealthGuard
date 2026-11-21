# Spec: mobile — Agenda and Inicio

**Change:** design-system-v2-agenda-inicio
**Domain:** mobile (`apps/mobile`)
**Phase:** spec
**Date:** 2026-11-20
**Source:** `.docs/design/system/pages/inicio-agenda.md`, `formularios.md`, `design.md` of this change. Issue #35, phase 1.

Screens MUST stay thin. Module UI MUST stay in `apps/mobile/src/components/agenda/` and `apps/mobile/src/components/home/`. This change MUST extend `MedicationIntakeModal`, `DailyCheckInForm`, and `MoodPicker` instead of adding a second dose or check-in UI. Copy MUST use tuteo.

## Requirements

### RF-MOB-AI1 — One-tap dose

When a dose is pending, «Tomar» MUST be a 48 px success button and MUST call `useConfirmIntakeMutation`. «No la tomé» MUST open a `BottomSheet`. The reasons «Se me olvidó», «No lo compré», and «Otro» MUST appear only after the user chooses that they did not take it, and MUST be `ChoiceChips`. «Cambiar hora» MUST be optional and MUST call `useRecordIntakeMutation`. A future dose MUST show «Más tarde» and MUST NOT offer «Tomar».

#### Scenario: Take it
- GIVEN a dose is pending
- WHEN the user presses «Tomar»
- THEN the row shows the taken state without a sheet

#### Scenario: Reasons come second
- GIVEN the dose sheet is open on its first step
- WHEN the user has not chosen «No la tomé»
- THEN the three reasons are not visible

### RF-MOB-AI2 — Calendar

The calendar legend MUST stay visible and MUST name Tomas, Citas, Check-in, and Tareas. Each event in the day list MUST state its type in text. Only the most urgent action in that list MUST use the primary or success style. Mission events MUST NOT be rendered.

#### Scenario: Urgent action is the only primary
- GIVEN a day list with a pending dose and a task
- WHEN it renders
- THEN «Tomar» is the success action and «Completar» is secondary

### RF-MOB-AI3 — Appointments

Appointments MUST be split into «Próximas» and «Anteriores», in chronological order. Before the appointment time, the detail MUST NOT offer «Marcar como completada». From that time, it MUST ask «¿Pudiste asistir?» with `ASISTI` and `NO_ASISTI`. The detail MUST include «Cómo llegar» and «+ Agregar documento». «Cancelar cita» MUST be a `DangerLink` at the end and its confirmation MUST offer «Mantener cita» first. The new-appointment form MUST lead with «Fecha y hora», then «Profesional», then «Modalidad y lugar».

#### Scenario: Future appointment has no attendance question
- GIVEN an appointment whose start is still in the future
- WHEN the user opens its detail
- THEN «¿Pudiste asistir?» is not shown

### RF-MOB-AI4 — Medications, wellbeing, and tasks

Medications MUST be split into «Activos» and «Finalizados». Cycle detail MUST offer «Tomar» when a dose is pending. Wellbeing MUST show five faces in this order: Muy mal, Mal, Regular, Bien, Excelente, with the labels from `moodConfig.ts`. Saving a check-in MUST toast the streak only after the server succeeds. Agenda tasks MUST use the brand accent and MUST offer «Completar» and «Reprogramar».

#### Scenario: Check-in toast waits
- GIVEN the user picks a face and saves
- WHEN the request has not succeeded
- THEN the streak toast is not shown

### RF-MOB-AI5 — Inicio

«Tomar» MUST be the only primary action while a dose is pending. The streak card MUST read `currentStreak` and `longestStreak`, and its check-in action MUST be secondary. When nothing is pending, the greeting MUST use the «Todo al día» state. «Configura Helu» MUST list four steps: the account (always done), the first medication, the first appointment, and the first document. «Ocultar esta lista» MUST call `setPreference("home_setup_checklist_hidden", true)` and the list MUST stay hidden when that preference is true. Inicio MUST NOT render missions, level, or badges.

#### Scenario: Hide the setup list
- GIVEN the setup list is visible
- WHEN the user presses «Ocultar esta lista»
- THEN the preference is saved and the list is gone on the next visit

### RF-MOB-AI6 — Deep links

`AgendaScreen` MUST keep the tabs `calendar`, `appointments`, `medications`, and `wellbeing`. An `AgendaRouteParams` intent of `medication-intake` or `daily-checkin` MUST open the matching sheet on the Agenda tab.
