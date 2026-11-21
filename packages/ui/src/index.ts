// ─── Entry Point: Mobile (React Native) ──────────────────────────────────────
// This file is resolved via the "react-native" condition in package.json exports.
// It re-exports everything consumers need from @helu/ui.

// ─── Foundation ──────────────────────────────────────────────────────────────
export * from './tokens/tokens';
export * from './tokens/theme';
export * from './tokens/semantic';
export * from './tokens/tones';
export * from './tokens/useTheme';
export { ThemeProvider, useAppTheme } from './tokens/ThemeProvider';
export type { ThemeContextValue } from './tokens/ThemeProvider';
// Movimiento v2 (solo native; en web el movimiento va por CSS con los mismos tokens)
export * from './motion/motion.native';
export * from './tokens/cssVariables';

// ─── Utils ───────────────────────────────────────────────────────────────────
export * from './utils/useDebounceSearch';
export * from './utils/formatters';
export * from './utils/documentTypes';
export * from './utils/constants';

// ─── Primitives ──────────────────────────────────────────────────────────────
export * from './primitives/DocumentTypeIcon/DocumentTypeIcon.native';
export * from './primitives/Spinner/Spinner.types';
export * from './primitives/Spinner/Spinner.native';
export * from './primitives/ActionButton/ActionButton.types';
export * from './primitives/ActionButton/ActionButton.native';
export * from './primitives/Button/Button.types';
export * from './primitives/Button/Button.native';
export * from './primitives/IconTile/IconTile.types';
export * from './primitives/IconTile/IconTile.native';
export * from './primitives/IconButton/IconButton.types';
export * from './primitives/IconButton/IconButton.native';
export * from './primitives/DangerLink/DangerLink.types';
export * from './primitives/DangerLink/DangerLink.native';
export * from './composed/ListRow/ListRow.types';
export * from './composed/ListRow/ListRow.native';
export * from './containers/BottomActionBar/BottomActionBar.native';
export * from './primitives/Chip/Chip.types';
export * from './primitives/Chip/Chip.native';
export * from './primitives/Pagination/Pagination.types';
export * from './primitives/Pagination/Pagination.native';
export * from './primitives/CardGrid/CardGrid.types';
export * from './primitives/CardGrid/CardGrid.native';
export * from './primitives/Typography/Typography.types';
export * from './primitives/Typography/Typography.native';
export * from './primitives/EmptyState/EmptyState.types';
export * from './primitives/EmptyState/EmptyState.native';

// ─── Forms ───────────────────────────────────────────────────────────────────
export { FieldError } from './forms/fieldKit.native';
export * from './forms/TextField/TextField.types';
export * from './forms/TextField/TextField.native';
export * from './forms/PasswordField/PasswordField.types';
export * from './forms/PasswordField/PasswordField.native';
export * from './forms/Select/Select.types';
export * from './forms/Select/Select.native';
export * from './forms/Checkbox/Checkbox.types';
export * from './forms/Checkbox/Checkbox.native';
export * from './forms/SearchField/SearchField.types';
export * from './forms/SearchField/SearchField.native';
export * from './forms/DateTimePicker/DateTimePicker.types';
export * from './forms/DateTimePicker/DateTimePicker.utils';
export * from './forms/DateTimePicker/DateTimePicker.native';
export * from './forms/DatePicker/DatePicker.types';
export * from './forms/DatePicker/DatePicker.native';
export * from './forms/TimePicker/TimePicker.types';
export * from './forms/TimePicker/TimePicker.native';
export * from './forms/ChoiceChips/ChoiceChips.types';
export * from './forms/ChoiceChips/ChoiceChips.native';
export * from './forms/SegmentedControl/SegmentedControl.types';
export * from './forms/SegmentedControl/SegmentedControl.native';

// ─── Containers ──────────────────────────────────────────────────────────────
export * from './containers/Modal/Modal.types';
export * from './containers/Modal/Modal.native';
export * from './containers/BottomSheet/BottomSheet.types';
export * from './containers/BottomSheet/BottomSheet.native';
export * from './containers/Card/Card.types';
export * from './containers/Card/Card.native';

// ─── Composed ────────────────────────────────────────────────────────────────
export * from './composed/ConfirmModal/ConfirmModal.types';
export * from './composed/ConfirmModal/ConfirmModal.native';
export * from './composed/DiscardChangesDialog/DiscardChangesDialog.types';
export * from './composed/DiscardChangesDialog/DiscardChangesDialog.native';

// ─── Platform ────────────────────────────────────────────────────────────────
export * from './platform/HeluAgendaCalendar';
