import type { ReactNode } from 'react';

export type ConfirmModalIconTone = 'danger' | 'warning' | 'primary' | 'info' | 'neutral';

export interface ConfirmModalProps {
  /** Modal title */
  title: string;
  /** Confirmation message body */
  message: string;
  /** Label for the confirm button: the exact verb («Cancelar cita», «Revocar acceso») */
  confirmLabel?: string;
  /**
   * v2: label of the safe option, shown first («Mantener cita», «Seguir editando»).
   * Defaults to «Cancelar».
   */
  keepLabel?: string;
  /**
   * v2: style of the safe option. `secondary` by default; `primary` when keeping is the
   * recommended path («Seguir editando», formularios.md §7.4).
   */
  keepVariant?: 'secondary' | 'primary';
  /** Button variant for the confirm button */
  confirmVariant?: 'primary' | 'danger';
  /** Whether the confirm action is in progress */
  loading?: boolean;
  /** Called when user confirms */
  onConfirm: () => void;
  /** Called when user cancels or closes the modal */
  onCancel: () => void;
  /**
   * Icon shown in a round tile at the top (MASTER §7, v2.33). Every confirmation passes one;
   * only «¿Descartar los cambios?» goes without. On mobile the icon takes the tone's color and
   * 24 px size, so a bare `<Trash2 />` is enough.
   */
  icon?: ReactNode;
  /** Tone of the icon tile: `danger` for delete, cancel or revoke; `warning` / `neutral` otherwise. Defaults to 'danger'. */
  iconTone?: ConfirmModalIconTone;
  /** Web only: side-by-side (default) or stacked buttons. On mobile the buttons are always stacked (v2.33). */
  actionsLayout?: 'row' | 'stacked';
}
