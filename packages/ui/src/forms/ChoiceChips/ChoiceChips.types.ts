import type { ReactNode } from 'react';

export interface ChoiceChipOption {
  value: string;
  label: string;
  icon?: ReactNode;
}

interface ChoiceChipsBase {
  options: ChoiceChipOption[];
  /** Web only. */
  className?: string;
}

export interface ChoiceChipsSingleProps extends ChoiceChipsBase {
  multiple?: false;
  value: string | null;
  onChange: (value: string) => void;
}

export interface ChoiceChipsMultipleProps extends ChoiceChipsBase {
  multiple: true;
  value: string[];
  onChange: (value: string[]) => void;
}

export type ChoiceChipsProps = ChoiceChipsSingleProps | ChoiceChipsMultipleProps;
