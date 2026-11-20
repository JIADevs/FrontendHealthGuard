import type { ReactNode } from 'react';
import type { Tone } from '../../tokens/tones';

/**
 * Fila de lista v2 (MASTER §7): IconTile de 40 px con el tinte del módulo + título (14/600) +
 * metadato (13) + acción a la derecha. Título y metadato ocupan hasta 2 líneas antes de cortarse.
 */
export interface ListRowProps {
  title: string;
  meta?: string;
  /** Ícono dentro del IconTile; sin ícono no se muestra el cuadro */
  icon?: ReactNode;
  /** Tinte del IconTile: el color del módulo va solo aquí (regla «color con medida») */
  tone?: Tone;
  /** Chip, botón o chevron a la derecha */
  trailing?: ReactNode;
  /** Toda la fila es tocable (no solo el texto) */
  onPress?: () => void;
  /** Etiqueta accesible de la fila cuando es tocable; por defecto, título + metadato */
  accessibilityLabel?: string;
}
