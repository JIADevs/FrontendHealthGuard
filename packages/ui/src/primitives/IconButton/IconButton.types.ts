import type { ReactNode } from 'react';

/** Botón redondo de 44 px (MASTER §6–7): campana, cerrar, filtros, volver, «⋯». */
export interface IconButtonProps {
  icon: ReactNode;
  /** Obligatoria: el botón no tiene texto visible */
  accessibilityLabel: string;
  /** `neutral`: borde gris sobre superficie; `tint`: fondo gris sin borde (cerrar en hojas y modales) */
  tone?: 'neutral' | 'tint';
  /** Punto (true) o número sobre el botón, por ejemplo notificaciones sin leer */
  badge?: boolean | number;
  disabled?: boolean;
  onPress?: () => void;
}
