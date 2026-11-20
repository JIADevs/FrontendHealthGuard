import type { Tone } from '../../tokens/tones';
import type { ChipColor } from './Chip.types';

export const toneFromColor: Record<ChipColor, Tone> = {
  default: 'brand',
  green: 'success',
  amber: 'medication',
};

/** Alto mínimo de la variante `option` (token `chip.height-option`, MASTER §6). */
export const OPTION_HEIGHT = 44;
