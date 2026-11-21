import type { ReactNode } from 'react';

export interface BottomSheetProps {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  /** When true, closing asks before the sheet dismisses. */
  dirty?: boolean;
  onClose: () => void;
  children: ReactNode;
}
