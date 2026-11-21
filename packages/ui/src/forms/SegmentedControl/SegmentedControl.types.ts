import type { ReactNode } from 'react';

export interface SegmentedOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

/**
 * Control segmentado v2 (formularios.md §4, kit `.seg`): 2 a 4 opciones excluyentes,
 * siempre visibles. Se anuncia como `radiogroup`.
 */
export interface SegmentedControlProps {
  options: SegmentedOption[];
  value: string;
  onChange: (value: string) => void;
  /** Etiqueta del grupo para lectores de pantalla. */
  accessibilityLabel?: string;
}
