export type ChipColor = 'default' | 'green' | 'amber';

export interface ChipProps {
  label: string;
  color?: ChipColor;
  selected?: boolean;
  onPress?: () => void;
}
