import type { ReactNode } from 'react';

export type CardVariant = 'default' | 'compact' | 'selected';
export type CardTone = 'streak' | 'ai' | 'success';

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
  /** Line between the main row and the footer. Off for content that belongs to the card body (cycle progress). Default true. */
  footerDivider?: boolean;
  /** Makes the whole card pressable/clickable */
  onPress?: () => void;
  /** v2: `compact` (padding 12), `selected` (borde de marca, ítem abierto en lista + detalle) */
  variant?: CardVariant;
  /** v2: tinte de fondo y borde (tarjeta de racha, aviso de IA, éxito) */
  tone?: CardTone;
}
