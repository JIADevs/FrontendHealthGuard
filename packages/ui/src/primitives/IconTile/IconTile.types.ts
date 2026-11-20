import type { ReactNode } from 'react';
import type { Tone } from '../../tokens/tones';

/** Cuadro con tinte del módulo + ícono (MASTER §7, «Fila de lista»). */
export interface IconTileProps {
  /** Ícono (lucide) de 18–24 px; su color lo toma del tono si no se lo pasa explícito */
  icon: ReactNode;
  tone?: Tone;
  /** `md` 40 px (filas), `lg` 52 px (encabezados) */
  size?: 'md' | 'lg';
  /** Círculo en vez de cuadro (encabezados de hojas y diálogos) */
  round?: boolean;
}
