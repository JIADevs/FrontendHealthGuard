import type { ReactNode } from 'react';

export interface CardProps {
  title: string;
  subtitle?: ReactNode;
  /** Element rendered inside the left icon container */
  icon?: ReactNode;
  /** Background color for the icon container. Defaults to a light gray. */
  iconBackground?: string;
  /** Extra content below title/subtitle (chips, status pills, intake buttons, etc.) */
  children?: ReactNode;
  /** Rendered in a column on the right side of the card */
  actions?: ReactNode;
  /** Bottom row rendered below the main content, separated by a border */
  footer?: ReactNode;
  /** Makes the whole card pressable/clickable */
  onPress?: () => void;
}
