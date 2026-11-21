export interface DiscardChangesDialogProps {
  /** Keeps the form open. */
  onKeep: () => void;
  /** Closes the form and drops unsaved changes. */
  onDiscard: () => void;
}
