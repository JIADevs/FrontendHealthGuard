import type { ReactNode } from 'react';

/**
 * Acción destructiva v2 (MASTER §7): enlace rojo con ícono, al final del contenido y lejos de
 * «Guardar» / «Editar». Nunca en la barra inferior. Eliminar, revocar, cancelar cita.
 */
export interface DangerLinkProps {
  label: string;
  /** Ícono de 16 px (por defecto, un tacho de basura lo pone quien lo usa) */
  icon?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}
