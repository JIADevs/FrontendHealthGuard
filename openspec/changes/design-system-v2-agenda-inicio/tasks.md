# Tasks: Design system v2 — mobile, module by module

## Roadmap (changed 2026-11-21)

Phases 1–4 shipped as planned. From Phase 5 on, the work follows the mockup order (`.docs/design/mockups/index.html`): one phase per module, **mobile only**. Web (the old phases 6–8) waits in «Deferred: web» at the end.

Skipped on purpose:
- Missions (`m3-misiones.js`, module 4). The API has no missions yet. Treatments from that module are in scope.
- Password recovery (module 1: «Recuperar contraseña», «Revisa tu correo», «Nueva contraseña»). `auth.py` has no reset endpoint yet.

### How every phase runs

Each phase has the same three steps, in order:

1. **Identify.** Compare each screen in the phase with its mockups, and with the cross-cutting states for those screens: confirmations and errors (`m7-estados.js`), loading (`m8-carga.js`), empty states (`m9-vacios.js`). Check it against the system docs:
   - `system/MASTER.md` and `system/componentes.md`: layout, tokens, components.
   - `system/pages/formularios.md`: field anatomy, validation, submit and response, microcopy.
   - `system/pages/movimiento-interacciones.md`: transitions (§3), sheets and modals (§4), buttons (§5), feedback and toasts (§6), skeletons (§6c), reduced motion (§8).
   Write the gap list under the phase before touching code.
2. **Build.** Close the gaps. UI lives in `components/<module>/` and screens only read the route and pass callbacks (the 4.7 rule).
3. **Review.** Walk every screen in the simulator next to its mockup and run the §9 checklist from `movimiento-interacciones.md`. `pnpm exec tsc --noEmit -p apps/mobile` adds no errors, and `pnpm --filter @helu/ui check:tokens` passes. Fix what is off, then commit the phase in work units.

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
- [x] 4.8 Moved to Phase 7 (7.2), after Acceso and Inicio.

## Phase 5: Acceso — module 1 (`m1-acceso-inicio.js`)

Screens: `LoginScreen`, `SignupScreen`, `components/auth/*`, `AnimatedLoginBackground`.
Mockups: «Inicio de sesión», «Registro», «Error de inicio de sesión», «Bienvenida (después del registro)».

- [ ] 5.1 Identify: write the gap list here.
- [ ] 5.2 Build:
  - Login and signup cards, fields and validation as in the mockup (email, password of at least 8 characters, show/hide password), with the mascot greeting.
  - The login error state, and the welcome screen after signup.
- [ ] 5.3 Review in the simulator against the mockups, fix, and commit.

## Phase 6: Inicio — module 2 (`m1-acceso-inicio.js`)

Screens: `HomeScreen`, `components/home/*`.
Mockups: «Inicio», «Inicio · primer uso», «Inicio · todo al día», «Check-in de hoy», «Racha sumada», plus the Inicio skeleton (m8) and empty states (m9).

- [ ] 6.1 Identify: write the gap list here.
- [ ] 6.2 Build:
  - Add `SetupChecklist`, the streak card and the «Todo al día» state under `components/home/`. `HomeScreen` only orders them.
  - «Tomar» is the only primary action while a dose is pending. The streak card reads `currentStreak` and `longestStreak`, and its check-in action is secondary.
  - The checklist steps are the account (always done), the first medication, the first appointment and the first document, derived from the existing list queries. «Ocultar esta lista» calls `setPreference("home_setup_checklist_hidden", true)` and the list stays hidden while that is true.
  - Inicio renders no missions, level or badges.
- [ ] 6.3 Review in the simulator against the mockups, fix, and commit.

## Phase 7: Agenda, citas y medicamentos — module 3 (`m2-agenda.js`)

The tabs, the dose sheet and Bienestar already follow v2 (Phases 3–4). This phase covers the rest.
Screens: `components/agenda/*`, `AgendaTaskFormScreen`, `AgendaTaskDetailScreen`.
Mockups: «Agregar a agenda», «Registrar toma», «Nueva cita · más detalles», «Detalle de cita · después de la hora», «Nuevo profesional», «Nuevo medicamento», «Detalle de medicamento», «Detalle de ciclo», «Nueva tarea», «Detalle de tarea», «Completar tarea».
States: Citas / Medicamentos / Bienestar vacío, «Calendario · día sin eventos», «Medicamentos · todo tomado hoy», «¿Cancelar la cita?», «¿Finalizar ciclo?», «Cita no encontrada», «Formulario con errores», «Borrador recuperado», «No se pudo guardar».

- [ ] 7.1 Identify: write the gap list here.
- [ ] 7.2 Build: the detail and form screens (carried over from 4.8):
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
  - «Nueva tarea» follows its mockup, and the states listed above are in place.
- [ ] 7.3 Review in the simulator against the mockups, fix, and commit.

## Phase 8: Tratamientos — module 4, without missions (`m3-misiones.js`)

Screens: `TreatmentsScreen`, `TreatmentDetailScreen`, `TreatmentFormScreen`.
Mockups: «Tratamientos», «Nuevo tratamiento», «Detalle de tratamiento», «Tratamientos · vacío», «Tratamiento · recién creado».

- [ ] 8.1 Identify: write the gap list here.
- [ ] 8.2 Build:
  - List, detail and form as in the mockups, with their empty, loading and «recién creado» states.
- [ ] 8.3 Review in the simulator against the mockups, fix, and commit.

## Phase 9: Documentos — module 5 (`m4-documentos.js`)

Screens: `DocumentsScreen`, `ScannerScreen`, `DocumentUploadScreen`, `DocumentDetailScreen`, `DocumentEditScreen`, `components/documents/*` (including the `withDocumentsTheme` override).
Mockups: «Documentos», «Agregar documento», «Escáner» (review pages, no camera permission), «Subir documento» (and uploading), «Resultado de examen virtual», «Detalle de documento», «Editar documento», «Filtros».
States: «Documentos · vacío», «Documentos · filtro sin resultados», «Búsqueda sin resultados», «Documento eliminado · deshacer».

- [ ] 9.1 Identify: write the gap list here.
- [ ] 9.2 Build:
  - Every screen and state above. Check during 9.1 that the API supports «Resultado de examen virtual»; if it does not, skip it like missions.
- [ ] 9.3 Review in the simulator against the mockups, fix, and commit.

## Phase 10: Mochilas — module 6 (`m5-mochilas-compartir.js`)

Screens: `BackpacksScreen`, `BackpackDetailScreen`, `BackpackEditScreen`, `BackpackAddDocumentsScreen`, `components/backpacks/*`.
Mockups: «Mochilas», «Detalle de mochila», «Nueva mochila», «Editar mochila», «Agregar documentos».
States: «Mochilas · vacío», «Mochila · sin documentos», «Agregar documentos · sin documentos».

- [ ] 10.1 Identify: write the gap list here.
- [ ] 10.2 Build:
  - Every screen and state above.
- [ ] 10.3 Review in the simulator against the mockups, fix, and commit.

## Phase 11: Compartir — module 7 (`m5-mochilas-compartir.js`)

Screens: `ShareDocumentsScreen`, `ShareConfigureScreen`, `ShareQrScreen`, `SharedHistoryScreen`, `SharedDetailScreen`, `components/share/*`.
Mockups: «Elegir documentos», «Configurar enlace», «Enlace listo · QR», «Compartidos», «Detalle compartido».
States: «Compartidos · vacío», «¿Revocar acceso?».
The public view of a shared link is web and stays out.

- [ ] 11.1 Identify: write the gap list here.
- [ ] 11.2 Build:
  - Every screen and state above.
- [ ] 11.3 Review in the simulator against the mockups, fix, and commit.

## Phase 12: Dependientes — module 8 (`m6-cuenta.js`)

Screens: `DependientesScreen`, `DependientesInviteScreen`, `components/dependientes/*`, management mode.
Mockups: «Dependientes», «Invitar», «Modo gestión (Inicio de Juan)».
States: «Dependientes · vacío», «¿Revocar delegación?», «Modo gestión · Juan sin documentos».

- [ ] 12.1 Identify: write the gap list here.
- [ ] 12.2 Build:
  - Every screen and state above.
- [ ] 12.3 Review in the simulator against the mockups, fix, and commit.

## Phase 13: Cuenta — module 9 (`m6-cuenta.js`)

Screens: `MoreScreen`, `ProfileScreen`, `NotificationsScreen`, `SettingsScreen`, `components/more/*`.
Mockups: «Más», «Ayuda y contacto», «Mi plan», «Perfil», «Notificaciones» (empty and «al día»), «Configuración».
States: «¿Cerrar sesión?», «¿Eliminar tu cuenta?».

- [ ] 13.1 Identify: write the gap list here.
- [ ] 13.2 Build:
  - Every screen and state above.
- [ ] 13.3 Review in the simulator against the mockups, fix, and commit.

## Phase 14: Cross-cutting states and close

- [ ] 14.1 App-wide states from `m7-estados.js`: «Sin conexión» and «Error al cargar», checked on every tab.
- [ ] 14.2 Remove the 76 tracked iCloud duplicates (`* 2.tsx` and similar) once each is confirmed unused.
- [ ] 14.3 `pnpm exec tsc --noEmit -p apps/mobile` adds no errors against `dev` (compare by file, line and code). `pnpm --filter @helu/ui check:tokens` passes.
- [ ] 14.4 Walk the whole app on a phone with Expo Go 58.
- [ ] 14.5 Update the ADR 0002 table and `.docs/architecture/design-system.md`. Mark the mobile phases on issue #35.

## Deferred: web

Kept for a later wave, unchanged from the original plan:

### Old phase 6: Web shell and routes — RF-WEB-AI1, RF-WEB-AI2, RF-WEB-AI5

- [ ] 6.1 Move the `.sidebar` breakpoint in `globals.css` from 768 px to 1024 px. Do not change the destination list.
- [ ] 6.2 Add the paths from RF-WEB-AI1. `/agenda?tab=appointments` redirects to `/agenda/citas`. `/agenda?tab=medications` redirects to `/agenda/medicamentos`. The nav item still points at `/agenda`.
- [ ] 6.3 The `/agenda` layout renders a form as a 560 px modal at 1024 px and above, and as the whole view below that. Detail sits beside the list from 1280 px and fills the view below that. Reload keeps the URL open. Back on a dirty form opens `DiscardChangesDialog`.

### Old phase 7: Web Inicio — RF-WEB-AI3

- [ ] 7.1 Move the dashboard blocks into `apps/web/src/components/home/`. `dashboard/page.tsx` only composes them.
- [ ] 7.2 Three columns from 1280 px, two from 1024 px, one below that. No fixed 400 px or 360 px columns.
- [ ] 7.3 «Tomar» is the only primary action. Upload, new appointment, and share are secondary. Remove «Escanear». The header shows no streak and no level. The streak card opens `/agenda/check-in`. The checklist uses the same preference as mobile.

### Old phase 8: Web Agenda — RF-WEB-AI4

- [ ] 8.1 Calendar at `/agenda`: seven equal columns, up to three type icons per day, then «+n». «Hoy» is 340 px beside the month from 1024 px and below the grid under that. Legend: Tomas, Citas, Check-in, Tareas. No mission events. Event text lives in the day list. Only the urgent action is primary or success.
- [ ] 8.2 Appointments and medications follow the mobile rules for order, attendance, «Cómo llegar», «+ Agregar documento», cancel, active and finished, and «Tomar». «Nueva cita» is a secondary «+». «No la tomé» is the 560 px modal. The open row uses `Card` `selected`.
- [ ] 8.3 `/agenda/bienestar` shows the five faces in the mobile order. `/agenda/check-in` and `/agenda/profesionales/nuevo` are the modal-or-view form. Tasks in the day list offer «Completar» and «Reprogramar» as secondary actions.
- [ ] 8.4 Page files only read params and render the components in `apps/web/src/components/agenda/`.

### Old phase 9: Verification

- [ ] 9.1 `pnpm exec tsc --noEmit -p apps/mobile` adds no errors against `dev`. Compare by file, line, and error code.
- [ ] 9.2 `pnpm --filter @helu/web build` passes.
- [ ] 9.3 `pnpm --filter @helu/ui check:tokens` passes.
- [ ] 9.4 On a phone with Expo Go 58: «Tomar», «No la tomé», and the check-in sheet. In the browser at 1280, 1024, and below 1024: Inicio, the calendar, a detail URL, and a dirty form that asks before closing.

### Old phase 10: Docs

- [ ] 10.1 Update the ADR 0002 table and `.docs/architecture/design-system.md`. Mark phase 1 on issue #35.
