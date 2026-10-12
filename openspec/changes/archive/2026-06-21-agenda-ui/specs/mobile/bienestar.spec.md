# Spec: mobile — Tab Bienestar (Daily Check-In UI)

**Change:** agenda-ui  
**Domain:** mobile (`apps/mobile`)  
**Slice:** S1 (tab, list, create, push fix, all module components), S2 (edit/delete wiring)  
**Phase:** spec  
**Date:** 2026-06-21

---

## Requirements

### Navigation

#### RF-MB-1 — Third permanent Bienestar tab [S1]

`AgendaScreen` MUST render a third permanent tab with key `"wellbeing"` alongside the existing
`"appointments"` and `"medications"` tabs. The tab MUST be visible at all times — not
feature-flagged.

#### RF-MB-2 — TabParamList extended [S1]

`TabParamList.Agenda.initialTab` in `TabNavigator.tsx` MUST be extended to include `"wellbeing"`:

```ts
initialTab: "appointments" | "medications" | "wellbeing"
```

The existing `"appointments"` default MUST be preserved.

#### RF-MB-3 — Tab label and icon [S1]

The Bienestar tab MUST display a short label and icon consistent with the existing tabs, fitting
on a 375 px wide screen without overflow. Label: `"Bienestar"`. Icon: heart or wellness glyph
from the existing icon set.

---

### MoodPicker component

#### RF-MB-4 — MoodPicker controlled component [S1]

`apps/mobile/src/components/agenda/MoodPicker.tsx` MUST be a controlled component with:
- `value: MoodEnum | null`
- `onChange: (mood: MoodEnum) => void`

`MoodEnum` = `"excellent" | "good" | "okay" | "bad" | "awful"`.

#### RF-MB-5 — MoodPicker renders five mood chips [S1]

The component MUST render exactly five tappable chips in order: Excelente, Bien, Regular, Mal,
Muy mal (Spanish UI labels; enum values remain English per backend contract).

#### RF-MB-6 — MoodPicker selected state [S1]

The selected chip MUST use the design-system `palette.accent.notification` tint (or equivalent
semantic token) to visually distinguish the active mood. Unselected chips use a neutral/muted
style.

#### RF-MB-7 — MoodPicker accessibility [S1]

Each chip MUST have an `accessibilityLabel` that includes the mood label and its selection state
(e.g., `"Excelente, seleccionado"` / `"Excelente, no seleccionado"`).

---

### DailyCheckInForm component

#### RF-MB-8 — DailyCheckInForm wraps create flow [S1]

`apps/mobile/src/components/agenda/DailyCheckInForm.tsx` MUST be a modal form that:
- Contains `MoodPicker` (required field).
- Contains an optional `TextField` for notes.
- Contains an optional `DateTimePicker` for `recordedAt` (defaults to `new Date().toISOString()`).
- Has a submit button labeled "Registrar".
- Has a cancel/close action.

#### RF-MB-9 — Form submit calls createDailyCheckIn mutation [S1]

On submit, the form MUST call `useCreateDailyCheckInMutation().mutate(payload)` where `payload`
conforms to `DailyCheckInCreate`.

#### RF-MB-10 — Submit loading state [S1]

While `isPending === true` (mutation in flight), the submit button MUST show a loading indicator
(spinner or disabled state with visual feedback). The button MUST be non-interactive during the
pending state. (Required by `frontend-mutation-feedback` skill.)

#### RF-MB-11 — Submit success toast [S1]

On `onSuccess`, the form MUST:
1. Dismiss the modal.
2. Show a success toast (via `react-native-toast-message`): `"Check-in registrado"`.

(Required by `frontend-mutation-feedback` skill.)

#### RF-MB-12 — Submit error toast [S1]

On `onError`, the form MUST show an error toast with a user-readable message (e.g.,
`"No se pudo registrar el check-in"`). The modal MUST remain open so the user can retry.

(Required by `frontend-mutation-feedback` skill.)

#### RF-MB-13 — recordedAt timezone [S1]

`recordedAt` MUST default to `new Date().toISOString()` (UTC). Display of dates in the list
MUST convert to the user's local timezone via `toLocaleString()` or equivalent.

#### RF-MB-14 — DailyCheckInForm edit mode [S2 — deferred]

When `initialValues: DailyCheckIn` is provided, the form MUST:
- Pre-populate all fields from `initialValues`.
- Call `useUpdateDailyCheckInMutation` on submit instead of create.
- Display a destructive "Eliminar" button that opens a `ConfirmModal` before calling
  `useDeleteDailyCheckInMutation`.

**Gate:** backend PATCH/DELETE endpoints + `useUpdateDailyCheckInMutation` + 
`useDeleteDailyCheckInMutation` from `@helu/api`.

---

### DailyCheckInListItem component

#### RF-MB-15 — DailyCheckInListItem renders check-in data [S1]

`apps/mobile/src/components/agenda/DailyCheckInListItem.tsx` MUST render:
- Mood emoji + Spanish label (e.g., 😊 Bien).
- `recordedAt` formatted as local date + time.
- Notes text (if present).

#### RF-MB-16 — DailyCheckInListItem edit affordance [S1]

The component MUST accept an `onEdit?: (checkIn: DailyCheckIn) => void` prop. In S1 this prop is
not wired (button rendered but disabled or hidden). In S2, `WellbeingTab` wires it.

---

### WellbeingTab (in AgendaScreen)

#### RF-MB-17 — WellbeingTab shows paginated list [S1]

The `WellbeingTab` section of `AgendaScreen` MUST render a `FlatList` of `DailyCheckInListItem`
components driven by `useDailyCheckInsQuery`. Pagination MUST be implemented (next-page on scroll
end or explicit pagination controls).

#### RF-MB-18 — WellbeingTab empty state [S1]

When `items` is empty and no query is loading, MUST render an `EmptyState` component
(from `@helu/ui`) with a CTA label `"Registrar check-in"` that opens `DailyCheckInForm`.

#### RF-MB-19 — WellbeingTab create CTA [S1]

A `"+ Registrar"` button or `ActionButton` MUST always be visible (above or below the list) to
open `DailyCheckInForm` regardless of list state.

#### RF-MB-20 — WellbeingTab loading state [S1]

While `isLoading === true` (initial fetch), MUST render a `Spinner` or skeleton placeholder
consistent with the existing tab pattern in `AgendaScreen`.

#### RF-MB-21 — WellbeingTab error state [S1]

If `isError === true`, MUST render a user-visible error message with a retry affordance.

#### RF-MB-22 — Multiple check-ins per day allowed [S1]

The list MUST display all check-ins including multiple entries for the same calendar day —
no deduplication or limit per day in the UI.

#### RF-MB-23 — WellbeingTab delegation context [S1]

When `activePatientId` is set in the auth store, the `X-Patient-Context` header is injected
automatically by the Axios interceptor. The tab MUST not add any special delegation logic;
the existing interceptor handles it transparently.

---

### Push notifications

#### RF-MB-24 — CHECKIN push tap navigates to Bienestar [S1]

`apps/mobile/src/hooks/usePushNotifications.ts` → `handleNotificationTap` MUST handle the
`"CHECKIN"` type by navigating to the Agenda screen with `initialTab: "wellbeing"`:

```ts
case "CHECKIN":
  navigateTo("Agenda", { initialTab: "wellbeing" });
  break;
```

Currently ALL notification types (including `CHECKIN`) route to `Notifications` — this MUST be
fixed in S1.

#### RF-MB-25 — TabParamList update precedes push fix [S1]

RF-MB-2 (extending `TabParamList`) MUST be implemented before RF-MB-24. The TypeScript compiler
MUST accept `{ initialTab: "wellbeing" }` without error before the push handler change is
shipped.

---

### Module structure

#### RF-MB-26 — Module components in components/agenda/ [S1]

All new UI components MUST reside in `apps/mobile/src/components/agenda/`. The directory MUST
have an `index.ts` that re-exports all public symbols:

```ts
export { MoodPicker } from "./MoodPicker";
export { DailyCheckInForm } from "./DailyCheckInForm";
export { DailyCheckInListItem } from "./DailyCheckInListItem";
```

Screens MUST import from `components/agenda` — not from individual component files.

#### RF-MB-27 — AgendaScreen composes, does not implement [S1]

`AgendaScreen.tsx` MUST only compose module components and wire hooks. No inline JSX that
duplicates logic already in `DailyCheckInForm` or `DailyCheckInListItem`.

---

## Acceptance Scenarios

### SC-MB-1: Bienestar tab is visible on app load [S1]

**Given** the user opens the app and navigates to the Agenda screen  
**When** the screen renders  
**Then** three tabs are visible: `"Citas"`, `"Medicamentos"`, and `"Bienestar"`  
**And** the default active tab is `"Citas"` (existing behavior preserved)

### SC-MB-2: User can open and complete the create form [S1]

**Given** the user is on the Bienestar tab  
**When** they tap `"+ Registrar"`  
**Then** `DailyCheckInForm` opens as a modal  
**And** they can select a mood, optionally add notes, optionally change `recordedAt`  
**And** the submit button is labeled `"Registrar"`

### SC-MB-3: Submit shows loading then success toast [S1]

**Given** the user fills the form and taps `"Registrar"`  
**When** the mutation is in flight  
**Then** the button shows a spinner and is non-interactive  
**When** the mutation succeeds  
**Then** the modal closes and a `"Check-in registrado"` toast appears  
**And** the list refreshes (due to `["daily-checkins"]` invalidation)

### SC-MB-4: Submit error keeps modal open [S1]

**Given** the network is unavailable  
**When** the user taps `"Registrar"` and the mutation fails  
**Then** the modal remains open  
**And** an error toast appears with a user-readable message  
**And** no duplicate check-in is created

### SC-MB-5: Multiple check-ins same day appear in list [S1]

**Given** the user has already registered one check-in today  
**When** they create a second check-in on the same day  
**Then** both entries appear in the `WellbeingTab` list, sorted by `recordedAt` descending

### SC-MB-6: Empty state shows CTA [S1]

**Given** the user has no check-ins  
**When** the `WellbeingTab` finishes loading  
**Then** an `EmptyState` with `"Registrar check-in"` CTA is visible  
**And** tapping it opens `DailyCheckInForm`

### SC-MB-7: CHECKIN push opens Bienestar tab [S1]

**Given** the user receives a `CHECKIN` push notification  
**When** they tap the notification  
**Then** the app navigates to `AgendaScreen` with `initialTab: "wellbeing"` active  
**And** the Bienestar tab content is visible (not the Notifications screen)

### SC-MB-8: Delegated patient context loads correct check-ins [S1]

**Given** a manager has set `activePatientId = "patient-uuid"` in the auth store  
**When** the `WellbeingTab` calls `useDailyCheckInsQuery`  
**Then** all requests include `X-Patient-Context: patient-uuid` (injected by Axios interceptor)  
**And** the list shows only that patient's check-ins

### SC-MB-9: Streak updates after create [S1]

**Given** the user creates a check-in  
**When** the mutation succeeds and `["me"]` is invalidated  
**Then** the next render of any streak-displaying UI reflects the updated `currentStreak` from
the refetched profile

### SC-MB-10: Pagination loads next page [S1]

**Given** the user has more than one page of check-ins  
**When** they scroll to the end of the list (or tap "Next")  
**Then** page 2 loads without clearing page 1 data (keepPreviousData behavior)

### SC-MB-11: Form edit mode pre-populates fields [S2 — deferred]

**Given** the user taps the edit affordance on a `DailyCheckInListItem`  
**When** `DailyCheckInForm` opens with `initialValues` set to that check-in  
**Then** mood, notes, and `recordedAt` fields are pre-populated  
**Note:** Deferred — requires backend PATCH + update mutation.

### SC-MB-12: Delete requires confirmation [S2 — deferred]

**Given** the user is in edit mode on a check-in  
**When** they tap `"Eliminar"`  
**Then** a `ConfirmModal` appears asking for confirmation  
**When** they confirm  
**Then** `useDeleteDailyCheckInMutation` is called and the item is removed from the list  
**Note:** Deferred — requires backend DELETE + delete mutation.
