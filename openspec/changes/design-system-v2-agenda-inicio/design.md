# Design: Design system v2 — Agenda e Inicio (Fase 1)

**Change:** design-system-v2-agenda-inicio
**Date:** 2026-11-20

El código nuevo sigue las skills que lista `AGENTS.md`. Este archivo no las copia. Fija cómo se arma esta ola.

## Technical Approach

Los hooks de `packages/api` cambian primero. Mobile y web leen la misma cache. Después entran los primitivos que faltan en `@helu/ui`. Las pantallas no ganan lógica: se extienden los componentes que ya existen en `apps/mobile/src/components/{agenda,home}/` y se extraen los de web a `apps/web/src/components/{agenda,home}/`.

```
packages/api hooks
  useConfirmIntakeMutation / useRecordIntakeMutation / useCreateDailyCheckInMutation
  useRevokeDelegationMutation
        │
        ▼
@helu/ui
  BottomSheet (solo native) · ChoiceChips · DiscardChangesDialog
        │
        ├── apps/mobile  AgendaScreen, HomeScreen y las screens de detalle ya registradas
        └── apps/web     /dashboard y /agenda/*
```

La toma de un toque sigue en `confirmIntake`. «No la tomé» y «Cambiar hora» siguen en `recordIntake`. El sheet de mobile reemplaza el contenedor de `MedicationIntakeModal`; el contenido y las tres razones (`FORGOT`, `NOT_PURCHASED`, `OTHER`) se quedan. El check-in sigue en `DailyCheckInForm` y `MoodPicker`.

## Architecture Decisions

| Decisión | Elección | Por qué |
|---|---|---|
| Optimismo de la toma | Parchear cada cache cuya key empieza por `medications` o `calendar`. En el ciclo correspondiente se agrega el `MedicationIntake`. `onError` restaura el snapshot. `onSettled` invalida esas dos familias | La dosis vive en `MedicationCycle.intakes` y el calendario trae los mismos medicamentos por día. Parchear una sola key deja las otras listas viejas |
| Optimismo del check-in | El día queda marcado al instante en las queries `daily-checkins` y `calendar`. El número de racha y el toast salen de la respuesta del servidor | `movimiento-interacciones.md` hace esperar la llama y el número a la confirmación. La fila igual cambia antes de los 400 ms |
| Racha en cache | No se incrementa `UserProfile.currentStreak` dentro de `onMutate` | Si el POST falla, no mostramos una racha que hay que deshacer |
| Revocar delegación | Se elimina el `onMutate` de `useRevokeDelegationMutation`. Queda `onSettled` invalidando `delegationKeys.all()` | El proposal lo pide. La fila sigue visible, con la acción en carga, hasta la respuesta |
| Colores de contexto | `useUpdateDelegationColorsMutation` no se toca | El issue solo invierte la revocación |
| `BottomSheet` | `containers/BottomSheet`, exportado en el entry native. El entry web no lo exporta | En web el formulario corto es modal (`web.md` §2) |
| `ChoiceChips` | `forms/ChoiceChips`, native y web. Cada opción renderiza `Chip` con `variant="option"` | El chip de 44 px con ✓ ya existe |
| `DiscardChangesDialog` | `composed/DiscardChangesDialog`, native y web, sobre `ConfirmModal` con la opción segura primero | Cita, medicamento y profesional lo comparten. En web también lo disparan Esc, clic afuera y Atrás |
| URLs web | Paths bajo `/agenda`, no `?tab=` | `web.md` §5 usa el ejemplo `/documents/{id}`. `?tab=` no se puede compartir para un detalle |
| `?tab=` viejo | `/agenda?tab=appointments` redirige a `/agenda/citas`. `medications` redirige a `/agenda/medicamentos` | Hoy la página lee ese parámetro |
| Modal vs vista | A 1024 px o más, el formulario es un modal de 560 px sobre la lista. Por debajo, la ruta ocupa la vista. Atrás cierra. Recargar reabre | Misma regla para cita, medicamento, check-in y profesional. No hace falta un route interceptor: el layout de `/agenda` elige modal o vista según el ancho |
| Corte de la barra lateral | El `@media (max-width: 768px)` de `.sidebar` en `globals.css` pasa a 1024 px | `web.md` §4. Afecta todas las rutas. La lista de destinos no se rediseña |
| «Configura Helu» | Clave `home_setup_checklist_hidden`. Valor `true` la oculta en las dos apps | `setPreference` ya existe. No hay clave documentada |
| Pasos de esa lista | Cuenta (siempre hecha), primer medicamento, primera cita, primer documento. El hecho se deduce de las queries de medicamentos, citas y documentos | Es el bloque del mockup `m1-acceso-inicio.js`. Sin endpoint nuevo |
| Leyenda web | Tomas, Citas, Check-in, Tareas | Las misiones no entran en este change |
| Panel «Hoy» | 340 px al lado del mes desde 1024 px. Por debajo, debajo de la grilla | `inicio-agenda.md` fija los 340 px y no dice qué hacer en una columna |

## Data Flow

### Toma

```
«Tomar»
  confirmIntake(cycleId)          → POST con taken_at = ahora, status TAKEN
«No la tomé» / «Cambiar hora»
  recordIntake(cycleId, payload)  → el mismo POST, con status o takenAt
```

`onMutate` en las dos mutaciones:

1. `cancelQueries` de `["medications"]` y `["calendar"]`.
2. `getQueriesData` de esas familias y guardar el snapshot.
3. En cada `Medication` cacheado, y en cada `CalendarDay.medications`, insertar el intake en el ciclo `cycleId`. Si era `NOT_TAKEN`, incluye `notTakenReason`.
4. `onError`: `setQueryData` con el snapshot.
5. `onSettled`: invalidar `["medications"]` y `["calendar"]`.

La fila pinta «Tomado» o el motivo desde esa cache. No hay un segundo estado local que pueda divergir.

### Check-in

`useCreateDailyCheckInMutation`:

1. Snapshot de `["daily-checkins"]` y `["calendar"]`.
2. Insertar un check-in temporal del día en esas queries.
3. `onError` restaura.
4. `onSuccess` invalida también `["me"]` y `["treatments"]`, como hoy, y recién ahí la tarjeta lee `currentStreak` y muestra el toast.
5. `onSettled` invalida check-ins y calendario.

### Revocar

El botón de revocar queda pendiente hasta que `revokeDelegation` resuelve. Si falla, la fila no se fue. Si responde, `onSettled` refresca la lista y la fila desaparece.

## File Map

| Pieza | Dónde | Qué hace |
|---|---|---|
| Mutaciones | `packages/api/src/reactQueryHooks.ts` | Optimismo de toma y check-in. Revocar espera |
| `BottomSheet` | `packages/ui/src/containers/BottomSheet/` | Asa, título, scroll, inset del teclado, descarte si `dirty` |
| `ChoiceChips` | `packages/ui/src/forms/ChoiceChips/` | Grupo de `Chip` `option` |
| `DiscardChangesDialog` | `packages/ui/src/composed/DiscardChangesDialog/` | Confirmación de descarte |
| Toma | `apps/mobile/src/components/agenda/MedicationIntakeModal.tsx` | Pasa a contenido de `BottomSheet`. Mismas razones |
| Fila de dosis | `MedicationCard.tsx`, `home/MedicationDoseListItem.tsx` | «Tomar» de 48 px, estados pendiente / tomada / no tomada / «Más tarde» |
| Calendario mobile | Componentes de `components/agenda/` que ya arma `AgendaScreen` | Leyenda y tipo en texto. Se extienden, no se duplican |
| Citas, medicamentos, bienestar, tareas | Cards y tabs ya existentes en `components/agenda/` | Visual v2. Las screens `AppointmentDetail`, `CycleDetail`, `DoctorForm`, `MedicationForm` solo conectan |
| Inicio mobile | `components/home/` | `SetupChecklist`, tarjeta de racha, estado «Todo al día». `HomeScreen` los ordena |
| Inicio web | `apps/web/src/components/home/` | Los mismos bloques, en 3 / 2 / 1 columnas. `dashboard/page.tsx` queda delgada |
| Agenda web | `apps/web/src/components/agenda/` | Mes, listas, detalle, modales. Las `page.tsx` leen el param y renderizan |
| Barra lateral | `apps/web/src/app/globals.css` | Corte en 1024 px |

`AgendaScreen` conserva las pestañas `calendar`, `appointments`, `medications`, `wellbeing` de `AgendaRouteParams`. Un push con `intent: "medication-intake"` o `"daily-checkin"` abre el sheet, no una pantalla nueva.

## Web Routes

El link «Agenda» del shell sigue yendo a `/agenda`.

| Pantalla | Path | A 1024 px o más | Por debajo de 1024 px |
|---|---|---|---|
| Calendario | `/agenda` | Mes de 7 columnas y panel «Hoy» de 340 px | Panel debajo del mes |
| Citas | `/agenda/citas` | Lista | Lista |
| Detalle de cita | `/agenda/citas/[id]` | Lista + detalle | Solo el detalle |
| Nueva cita | `/agenda/citas/nueva` | Modal | Vista |
| Medicamentos | `/agenda/medicamentos` | Lista Activos / Finalizados | Lista |
| Detalle de ciclo | `/agenda/medicamentos/[cycleId]` | Lista + detalle | Solo el detalle |
| Nuevo medicamento | `/agenda/medicamentos/nuevo` | Modal | Vista |
| Bienestar | `/agenda/bienestar` | Gráfico con las 5 caras | Igual, en una columna |
| Check-in | `/agenda/check-in` | Modal | Vista |
| Nuevo profesional | `/agenda/profesionales/nuevo` | Modal | Vista |

Cerrar un modal con cambios abre `DiscardChangesDialog` y, si confirma, hace `router.back()`. Sin historia previa, navega al path padre. El ítem abierto en la lista usa el estilo `selected` de `Card`.

En el detalle de cita, «Nueva cita» y «Nuevo profesional» son secundarios. «¿Pudiste asistir?» es la primaria desde la hora de la cita. «Cancelar cita» es `DangerLink` y confirma con «Mantener cita».

## Gaps

Estas pantallas web no tienen mockup auditado. Queda fijo así, y no se decide de nuevo en la implementación:

- El mes usa íconos por tipo, hasta 3 y después «+n». El texto del evento está en la lista del día, no en la celda.
- La leyenda no tiene una entrada de misiones.
- El check-in y el profesional nuevo no son páginas con layout propio. Son el modal de 560 px con URL.
- El gráfico de bienestar muestra una barra por registro, con su cara. El orden visible es el de `inicio-agenda.md`: Muy mal, Mal, Regular, Bien, Excelente. Las etiquetas salen de `moodConfig.ts`.
- Los cuatro pasos de «Configura Helu» son los del mockup de Inicio. «Ocultar esta lista» escribe la preferencia y no borra datos.
