import type { ReactNode } from 'react';

export interface EmptyStateProps {
  /** Icon or illustration to display above the message */
  icon?: ReactNode;
  /** Primary message */
  message: string;
  /** Optional secondary description */
  description?: string;
  /** Optional action button or element */
  action?: ReactNode;
}
