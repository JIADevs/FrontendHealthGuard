import type { ReactNode } from 'react';

export type ConfirmModalIconTone = 'danger' | 'warning' | 'primary' | 'info';

export interface ConfirmModalProps {
  /** Modal title */
  title: string;
  /** Confirmation message body */
  message: string;
  /** Label for the confirm button */
  confirmLabel?: string;
  /** Button variant for the confirm button */
  confirmVariant?: 'primary' | 'danger';
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or closes the modal */
  onCancel: () => void;
  /**
   * Optional icon to render at the top. When provided, the modal renders in
   * a compact centered layout (no close button, title/message centered,
   * equal-width buttons).
   */
  icon?: ReactNode;
  /** Tinted background color for the icon container. Defaults to 'danger'. */
  iconTone?: ConfirmModalIconTone;
  /** Side-by-side (default) or full-width stacked buttons — use stacked for longer labels. */
  actionsLayout?: 'row' | 'stacked';
}
