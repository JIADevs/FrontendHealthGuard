import type { ReactNode } from 'react';

export type ModalSize = 'sm' | 'md' | 'lg';

export interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  /** Rendered inside the footer bar (e.g. action buttons) */
  footer?: ReactNode;
}
