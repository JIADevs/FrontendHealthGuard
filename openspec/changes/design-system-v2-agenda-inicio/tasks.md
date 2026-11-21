# Tasks: Design system v2 — Agenda and Inicio (Phase 1)

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 2200–3500 |
| 400-line budget risk | High |
| Chained PRs recommended | No |
| Suggested split | One PR, one commit per work unit below |
| Delivery strategy | single-pr |

Decision needed before apply: No. Issue #35 and the proposal already lock this wave into one PR. The commits are the review slices.

Each commit is checked on mobile and web before the next one starts. Mobile: Expo Go 58 against the local API. Web: `pnpm dev:web`. A slice with no new screen still has to boot both apps. The note under that commit says what can actually be seen.

### Work-Unit Commit Map

| Commit | Scope |
|--------|-------|
| 1 | `feat(api): make dose and check-in optimistic and wait to revoke` |
| 2 | `feat(ui): add BottomSheet, ChoiceChips and DiscardChangesDialog` |
| 3 | `feat(mobile): one-tap dose and the not-taken sheet` |
| 4 | `feat(mobile): agenda calendar, appointments, medications, wellbeing and tasks` |
| 5 | `feat(mobile): rework Inicio for v2` |
| 6 | `feat(web): add agenda routes and the 1024 px sidebar breakpoint` |
| 7 | `feat(web): rework Inicio for v2` |
| 8 | `feat(web): calendar, appointments, medications, wellbeing and check-in` |
| 9 | `docs: update ADR 0002, design-system.md and issue 35` |

## Phase 1: API — RF-API-AI1, RF-API-AI2, RF-API-AI3

- [x] 1.1 `useConfirmIntakeMutation` and `useRecordIntakeMutation`: in `onMutate`, cancel and snapshot every query whose key starts with `medications` or `calendar`, then insert the `MedicationIntake` on that `cycleId`. `TAKEN` uses the current time. `NOT_TAKEN` keeps `notTakenReason`.
- [x] 1.2 `onError` restores that snapshot. `onSettled` invalidates `medications` and `calendar`.
- [x] 1.3 `useCreateDailyCheckInMutation`: insert today's check-in into `daily-checkins` and `calendar` in `onMutate`. Do not write `currentStreak` there. Restore on error. On success, invalidate `me`, `treatments`, `daily-checkins`, and `calendar`.
- [x] 1.4 Remove `onMutate` from `useRevokeDelegationMutation`. Keep the `onSettled` invalidation of `delegationKeys.all()`. Leave `useUpdateDelegationColorsMutation` as it is.
- [x] 1.5 Boot mobile and web. Mobile: in Dependientes, revoking keeps the row until the server answers. A check-in still saves, and the streak toast still waits for success. Web: Agenda still loads and «Tomado» still saves. Web has no Dependientes or check-in screen yet, so those two paths are not visible there.
  - Checked 2026-11-21 on the iOS simulator with the API paused and then resumed. Revoke kept the row while the request was pending and after it failed. A check-in saved (201), and its success toast only showed after the server answered. Mobile has no streak toast yet, only «Check-in registrado».
  - This check found that `newOptimisticId` used `crypto.randomUUID`, which Hermes lacks. `onMutate` threw, so check-in (and «Tomar» on a cached cycle) never reached the server. Fixed in `optimisticCache.ts`.
  - Web: Agenda loads. «Tomado» returns 404 because `agenda/page.tsx` sends the medication id as the cycle id. That bug is already on `dev`, since this branch does not touch `apps/web`. Task 8.2 replaces that screen.

## Phase 2: Primitives — RF-UI-AI1, RF-UI-AI2, RF-UI-AI3

- [x] 2.1 `containers/BottomSheet` (native entry only): grabber, header, scroll body, keyboard inset, and a discard confirmation when `dirty` is true. Do not export it from the web entry.
- [x] 2.2 `forms/ChoiceChips`, native and web: `options`, `value`, `multiple`, `onChange`. Each option is `Chip` `variant="option"`, at least 44 px, with a check when selected.
- [x] 2.3 `composed/DiscardChangesDialog`, native and web: renders `ConfirmModal`, safe option first.
- [x] 2.4 Export the three from `src/index.ts`. Export only `ChoiceChips` and `DiscardChangesDialog` from `src/web.ts`.
- [x] 2.5 `pnpm --filter @helu/ui check:tokens` passes. No hex literals in the new files.

## Phase 3: Mobile doses — RF-MOB-AI1, RF-MOB-AI6

- [x] 3.1 Extend `MedicationIntakeModal` so its body sits in `BottomSheet`. Keep the three reasons. Show them only after «No la tomé». «Cambiar hora» stays optional and calls `useRecordIntakeMutation`.
- [x] 3.2 `MedicationCard` and `home/MedicationDoseListItem`: pending shows «Tomar» at 48 px and calls `useConfirmIntakeMutation`. Taken, not-taken (with the reason), and «Más tarde» match the four row states. A future dose has no «Tomar».
- [x] 3.3 An Agenda deep link with `intent: "medication-intake"` or `"daily-checkin"` opens the matching sheet. The tabs `calendar`, `appointments`, `medications`, and `wellbeing` stay.

## Phase 4: Mobile Agenda — RF-MOB-AI2, RF-MOB-AI3, RF-MOB-AI4

- [x] 4.1 Calendar legend stays visible: Tomas, Citas, Check-in, Tareas. Each day-list event states its type in text. Only the urgent action uses primary or success. Do not render mission events.
- [x] 4.2 Appointments: «Próximas» and «Anteriores», chronological. Detail hides «¿Pudiste asistir?» before the start time. From that time it offers `ASISTI` and `NO_ASISTI`, plus «Cómo llegar» and «+ Agregar documento». «Cancelar cita» is a `DangerLink` whose confirm offers «Mantener cita» first.
- [x] 4.3 New appointment form order: «Fecha y hora», «Profesional», «Modalidad y lugar». `DoctorForm` stays the screen that creates a professional. Dirty close uses `DiscardChangesDialog`.
- [x] 4.4 Medications: «Activos» and «Finalizados». Cycle detail offers «Tomar» when a dose is pending.
  - One list grouped into ACTIVOS / FINALIZADOS (the «Medicamentos / Ciclos» sub-tabs are gone; cycles stay in the medication detail). Active cards show the green cycle bar, «Próxima toma» or «Toma pendiente» for an overdue slot, and «Ciclo: X de N días». Finished cards show a grey tile, «Terminó el …» and «Finalizado».
  - `PendingDoseButton` is the detail's primary action in both the cycle and the medication detail, and fades through to «✓ Tomado».
  - Fix found here: dose mutations now also patch and invalidate `["medication", id]`, so the detail updates optimistically. Before, it kept the old dose until a reload.
  - Checked 2026-11-21 on the iOS simulator with temporary test medications on `juan@helu.dev`, deleted afterwards.
- [x] 4.5 Wellbeing keeps `DailyCheckInForm` and `MoodPicker`. Face order: Muy mal, Mal, Regular, Bien, Excelente, labels from `moodConfig.ts`. The streak toast fires only after the mutation succeeds.
  - Faces are drawn (`MoodFace`, red to emerald, as in the kit) instead of emoji. The check-in sheet follows the mockup: «CHECK-IN DE HOY», `ChoiceChips` for the treatment, and «Guardar check-in» in the streak color. Editing uses «Guardar cambios», and «Eliminar check-in» is a `DangerLink`.
  - The streak toast reads `currentStreak` from a fresh profile after the save (`useFetchCurrentStreak` in `@helu/api`): «¡N días seguidos cuidándote!», or «Es el primer día de tu racha.» for day one. `notify` gains a mobile-only `streak` tone.
  - Bienestar is now `components/agenda/WellbeingTab`, out of `AgendaScreen`. It shows the «Tu bienestar» card (latest mood, legend, 7-day bars with faces) and check-ins as cards grouped by day. Only the pull gesture shows the refresh spinner.
  - Not done: the mockup's symptom chips («Dolor», «Cansancio»…). The check-in API has no symptoms field, and backend changes are out of scope.
  - Checked 2026-11-21 on the iOS simulator with `juan@helu.dev`. The test check-ins were deleted.
- [x] 4.6 Agenda tasks keep the brand accent and the «Completar» and «Reprogramar» actions.
  - The day list already had the brand border and «Completar». The task detail used the backpack accent; it now uses brand, with the «Pendiente» chip in amber.
  - «Completar tarea» (success) and «Reprogramar» (secondary) sit in `BottomActionBar`. They open `CompleteTaskSheet` (optional comment, documents and backpacks as `ChoiceChips`) and `RescheduleTaskSheet` (date and time, errors under the field). Both are module components on `BottomSheet` and replace the v1 modals. The copy is in tuteo and says «Reprogramar», not «Reagendar».
  - Fixes found here: complete, reschedule and update wrote nothing back and dropped the detail cache (`removeQueries`), so the open detail fell back to a full-screen spinner. They now write the returned task into it. The detail also read `.data` from `useQueries` arrays, so linked and result documents showed their ids instead of their names. That also clears 8 type errors (mobile tsc: 64 → 56).
  - Checked 2026-11-21 on the iOS simulator with `juan@helu.dev`. The API has no delete for tasks, so the two test tasks («… (prueba 4.6)») are still in that seed account.
- [x] 4.7 Screens (`AgendaScreen`, `AppointmentDetail`, `AppointmentForm`, `MedicationDetail`, `CycleDetail`, `DoctorForm`, `MedicationForm`) only pass props and callbacks.
  - The UI lives in `components/agenda` (`Agenda`, `AppointmentDetail`, `AppointmentForm`, `MedicationDetail`, `CycleDetail`, `DoctorForm`, `MedicationForm`); none of them imports React Navigation.
  - The tabs and calendar navigate through `AgendaNavigationProvider` / `useAgendaNavigation`, which `AgendaScreen` fills. `AppointmentForm` gets the leave guard as `subscribeBeforeLeave`, adapted from `beforeRemove` by its screen.
- [ ] 4.8 The detail and form screens follow the v2 mockups (`m2-agenda.js`). This starts after 4.7, on the module components that 4.7 extracts.
  - **Nuevo / Editar medicamento:** sections «Medicamento», «Prescripción», «Periodo del ciclo», «Recordatorios» and «Tratamiento».
    - Fields: «Forma farmacéutica» as `ChoiceChips`; «Dosis por toma», whose unit comes from the form; and «Frecuencia (cada cuánto)» with Horas / Días / Semanas chips.
    - A summary is calculated under the frequency: «1 tableta cada 12 horas · 2 tomas al día».
    - Optional fields say «(opcional)». «Guardar medicamento» sits in `BottomActionBar`.
  - **Detalle de medicamento:** «Editar» goes in the header. The header card shows the name and «Próxima toma», then `PendingDoseButton`. Cycles are grouped into ACTIVOS / ANTERIORES with the green bar and «X de N días». «Nuevo ciclo» is secondary.
  - **Detalle de ciclo:** a green ring «día/total», the «En curso» / «Finalizado» chip, and the dates.
    - Rows: Dosis, Frecuencia, Concentración and Razón.
    - Then «Historial de tomas».
    - «Editar» goes in the header. «Finalizar ciclo» is a `DangerLink` at the end, and its confirm puts the safe option first. The blue hero and `DetailFooter` are removed.
  - **Detalle de tarea:** a tile with the title, date and status chip, then notes and the «Aviso» row. «Completar tarea» is the success button and «Reprogramar» is secondary.
  - **Nuevo profesional:** one column, with «(opcional)» on Teléfono and Notas. A dirty close uses `DiscardChangesDialog`.
  - Not in this task: the weekly goal ring (out of scope in the proposal).

## Phase 5: Mobile Inicio — RF-MOB-AI5

- [ ] 5.1 Add `SetupChecklist`, the streak card, and the «Todo al día» state under `components/home/`. `HomeScreen` only orders them.
- [ ] 5.2 «Tomar» is the only primary action while a dose is pending. The streak card reads `currentStreak` and `longestStreak`. Its check-in action is secondary.
- [ ] 5.3 The checklist steps are the account (always done), the first medication, the first appointment, and the first document, derived from the existing list queries. «Ocultar esta lista» calls `setPreference("home_setup_checklist_hidden", true)` and the list stays hidden when that value is true.
- [ ] 5.4 Inicio does not render missions, level, or badges.

## Phase 6: Web shell and routes — RF-WEB-AI1, RF-WEB-AI2, RF-WEB-AI5

- [ ] 6.1 Move the `.sidebar` breakpoint in `globals.css` from 768 px to 1024 px. Do not change the destination list.
- [ ] 6.2 Add the paths from RF-WEB-AI1. `/agenda?tab=appointments` redirects to `/agenda/citas`. `/agenda?tab=medications` redirects to `/agenda/medicamentos`. The nav item still points at `/agenda`.
- [ ] 6.3 The `/agenda` layout renders a form as a 560 px modal at 1024 px and above, and as the whole view below that. Detail sits beside the list from 1280 px and fills the view below that. Reload keeps the URL open. Back on a dirty form opens `DiscardChangesDialog`.

## Phase 7: Web Inicio — RF-WEB-AI3

- [ ] 7.1 Move the dashboard blocks into `apps/web/src/components/home/`. `dashboard/page.tsx` only composes them.
- [ ] 7.2 Three columns from 1280 px, two from 1024 px, one below that. No fixed 400 px or 360 px columns.
- [ ] 7.3 «Tomar» is the only primary action. Upload, new appointment, and share are secondary. Remove «Escanear». The header shows no streak and no level. The streak card opens `/agenda/check-in`. The checklist uses the same preference as mobile.

## Phase 8: Web Agenda — RF-WEB-AI4

- [ ] 8.1 Calendar at `/agenda`: seven equal columns, up to three type icons per day, then «+n». «Hoy» is 340 px beside the month from 1024 px and below the grid under that. Legend: Tomas, Citas, Check-in, Tareas. No mission events. Event text lives in the day list. Only the urgent action is primary or success.
- [ ] 8.2 Appointments and medications follow the mobile rules for order, attendance, «Cómo llegar», «+ Agregar documento», cancel, active and finished, and «Tomar». «Nueva cita» is a secondary «+». «No la tomé» is the 560 px modal. The open row uses `Card` `selected`.
- [ ] 8.3 `/agenda/bienestar` shows the five faces in the mobile order. `/agenda/check-in` and `/agenda/profesionales/nuevo` are the modal-or-view form. Tasks in the day list offer «Completar» and «Reprogramar» as secondary actions.
- [ ] 8.4 Page files only read params and render the components in `apps/web/src/components/agenda/`.

## Phase 9: Verification

- [ ] 9.1 `pnpm exec tsc --noEmit -p apps/mobile` adds no errors against `dev`. Compare by file, line, and error code.
- [ ] 9.2 `pnpm --filter @helu/web build` passes.
- [ ] 9.3 `pnpm --filter @helu/ui check:tokens` passes.
- [ ] 9.4 On a phone with Expo Go 58: «Tomar», «No la tomé», and the check-in sheet. In the browser at 1280, 1024, and below 1024: Inicio, the calendar, a detail URL, and a dirty form that asks before closing.

## Phase 10: Docs

- [ ] 10.1 Update the ADR 0002 table and `.docs/architecture/design-system.md`. Mark phase 1 on issue #35.
