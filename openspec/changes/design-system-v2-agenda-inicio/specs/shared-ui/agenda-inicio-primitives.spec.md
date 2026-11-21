# Spec: shared-ui — Agenda and Inicio primitives

**Change:** design-system-v2-agenda-inicio
**Domain:** shared-ui (`packages/ui`)
**Phase:** spec
**Date:** 2026-11-20
**Source:** `.docs/design/system/componentes.md`, `formularios.md`, `design.md` of this change.

## Requirements

### RF-UI-AI1 — BottomSheet

`BottomSheet` MUST live in `packages/ui/src/containers/BottomSheet/` and MUST be exported from the native entry only. The web entry MUST NOT export it. It MUST render a grabber, a header, and a scrollable body. It MUST stay above the keyboard. When `dirty` is true, closing MUST ask for confirmation before dismissing. New code MUST NOT contain hex color literals.

#### Scenario: Dirty sheet asks before closing
- GIVEN a `BottomSheet` with `dirty` true
- WHEN the user drags it closed or presses the close control
- THEN a discard confirmation appears and the sheet stays open until the user confirms

#### Scenario: Clean sheet closes
- GIVEN a `BottomSheet` with `dirty` false
- WHEN the user closes it
- THEN it dismisses without a confirmation

### RF-UI-AI2 — ChoiceChips

`ChoiceChips` MUST live in `packages/ui/src/forms/ChoiceChips/` with native and web implementations. It MUST accept `options`, `value`, `multiple`, and `onChange`. Each option MUST render `Chip` with `variant="option"`. A selected option MUST show the check mark and MUST be at least 44 px tall. `multiple` false MUST keep a single selected value.

#### Scenario: Single choice
- GIVEN options «Horas», «Días», and «Semanas» and `multiple` false
- WHEN the user selects «Días»
- THEN only «Días» is selected and `onChange` receives that value

### RF-UI-AI3 — DiscardChangesDialog

`DiscardChangesDialog` MUST live in `packages/ui/src/composed/DiscardChangesDialog/` with native and web implementations. It MUST render `ConfirmModal`. The safe option MUST come first.

#### Scenario: Safe option is first
- GIVEN the dialog is open
- WHEN it renders
- THEN the option that keeps the form comes before the option that discards it
