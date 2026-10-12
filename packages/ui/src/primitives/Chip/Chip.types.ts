export type ChipColor = 'default' | 'green' | 'amber';

export type ChipSize = 'default' | 'compact';

export interface ChipProps {
  label: string;
  color?: ChipColor;
  /** `compact` matches the 28px dashed “+” control in tag editors. */
  size?: ChipSize;
  selected?: boolean;
  onPress?: () => void;
}
