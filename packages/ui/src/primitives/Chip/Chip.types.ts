import type { ReactNode } from 'react';
import type { Tone } from '../../tokens/tones';

/** v1: se mantiene por compatibilidad. `default` → tono `brand`, `green` → `success`, `amber` → `medication`. */
export type ChipColor = 'default' | 'green' | 'amber';

export type ChipSize = 'default' | 'compact';

/**
 * `tag`: etiqueta o estado (píldora con tinte). `option`: chip seleccionable de 44 px con borde,
 * que marca el seleccionado con ✓ además del color (MASTER §7).
 */
export type ChipVariant = 'tag' | 'option';

export interface ChipProps {
  label: string;
  /** v2: tono de estado, IA, racha o módulo. Tiene prioridad sobre `color`. */
  tone?: Tone;
  /** v1 */
  color?: ChipColor;
  variant?: ChipVariant;
  /** Ícono de 12–14 px antes del texto */
  icon?: ReactNode;
  /** `compact` matches the 28px dashed “+” control in tag editors (solo `tag`). */
  size?: ChipSize;
  selected?: boolean;
  onPress?: () => void;
}
