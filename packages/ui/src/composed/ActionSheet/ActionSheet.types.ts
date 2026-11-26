import type { ReactNode } from 'react';
import type { Tone } from '../../tokens/tones';

export interface ActionSheetItem {
  key: string;
  label: string;
  /** One line under the label («Próxima: hoy 1:00 p. m.», «Se borra de tu agenda») */
  meta?: string;
  /** Icon inside the row's IconTile (lucide, 19 px) */
  icon: ReactNode;
  onPress: () => void;
}

/**
 * «Más» sheet of a list card (MASTER §7 «Acciones al deslizar», #127): every action of the card in
 * a list and, below it as their own group, the destructive ones in red with a subtitle that says
 * what happens. Each item closes the sheet first and then runs; destructive items open their own
 * `ConfirmModal`.
 */
export interface ActionSheetProps {
  /** Card title («Control de odontología») */
  title: string;
  /** Uppercase line above the title («CITA · MAR 2 DIC · 10:00 A. M.») */
  eyebrow?: string;
  /** Icon of the round tile in the header (lucide, 24 px) */
  icon?: ReactNode;
  /** Module tint of the header tile and the eyebrow */
  tone?: Tone;
  actions: ActionSheetItem[];
  /** Cancel, delete… Never in the swipe panels */
  destructive?: ActionSheetItem[];
  onClose: () => void;
}
