# Spec: mobile — Fonts and v2 colors

**Change:** design-system-v2-foundation
**Domain:** mobile (`apps/mobile`)
**Phase:** spec
**Date:** 2026-11-20

---

## Requirements

### RF-M-F1 — Load fonts before the first screen

`App.tsx` MUST load Nunito (700, 800, 900) and Inter (400, 500, 600) with `expo-font`. It MUST keep showing the existing loading view until both the fonts are loaded and the auth store is hydrated. If loading fails, the app MUST continue with the system font instead of blocking.

#### Scenario: Cold start
- GIVEN a cold start with fonts not yet loaded
- WHEN the app mounts
- THEN the loading view stays until the fonts finish loading, and the first screen renders with Nunito and Inter available

#### Scenario: Font loading error
- GIVEN `useFonts` returns an error
- WHEN the app mounts
- THEN it renders the navigator with the system font and logs the error

### RF-M-F2 — Typography uses the loaded families

`Typography.native` MUST set `fontFamily` from `nativeFont(role, weight)`:
- headings (`h1`–`h4`) use Nunito;
- body, caption, label and overline use Inter.

It MUST NOT rely on `fontWeight` alone to pick a weight.

#### Scenario: Heading on Android
- GIVEN `<Typography variant="h1">` on Android
- WHEN it renders
- THEN the text uses the `Nunito_900Black` family

### RF-M-F3 — Primary fills and links use v2 brand

Primary buttons, the FAB, the detail footer action, the invite and accept buttons and the login submit button MUST use the v2 brand solid as their fill. Links in auth screens and «Confirmar» in date and time pickers MUST use the v2 brand text color. Loading spinners and active brand icons MUST use the v2 brand solid.

#### Scenario: Login submit button
- GIVEN the login screen
- WHEN the submit button renders
- THEN it has a flat `#2563EB` fill with white text (no 400→500 gradient)

### RF-M-F4 — No hard-coded colors in touched screens

`AgendaTaskFormScreen`, `AppointmentFormScreen`, `MedicationDetailScreen` and `CycleDetailScreen` MUST use theme tokens instead of the hex literals `#e53e3e`, `#FFF3CD`, `#856404` and `#4ade80`.

### RF-M-F5 — Tuteo in remaining copy

User-facing strings MUST NOT use voseo («tenés»). Each one is rewritten in tuteo.
