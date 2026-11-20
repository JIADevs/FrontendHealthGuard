import type { ReactNode } from 'react';

/**
 * v2 (MASTER §7): `primary` (marca), `secondary` (blanco con borde), `success` (completar),
 * `streak` (check-in, racha), `danger` (relleno rojo) y `ghost` (sin fondo).
 */
export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'streak' | 'danger' | 'ghost';
/** `sm` 44 px de alto mínimo, `md` 48 px (por defecto), `lg` 52 px. */
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  disabled?: boolean;
  loading?: boolean;
  /** Texto mientras `loading` (gerundio: «Guardando…»). Sin él, se mantiene el texto del botón. */
  loadingLabel?: string;
  /** Ícono junto al texto (por ejemplo un ícono de lucide de 16–18 px) */
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  /** Etiqueta para lectores de pantalla cuando el texto visible no alcanza */
  accessibilityLabel?: string;
  onPress?: () => void;
  /** Web only — maps to the <button> type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Web only — associates button with a form by id (HTML form attribute) */
  form?: string;
}
