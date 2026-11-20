import type { ButtonVariant } from '../../primitives/Button/Button.types';

/**
 * Barra de acción fija abajo (MASTER §7, v2): formularios de pantalla completa y flujos de pasos.
 * Un botón principal de ancho completo con verbo + objeto («Guardar cita»). Respeta el área
 * segura; la pantalla deja `BOTTOM_ACTION_BAR_HEIGHT` + el inset inferior de espacio en su scroll.
 * Nunca lleva acciones destructivas.
 */
export interface BottomActionBarAction {
  label: string;
  onPress: () => void;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  /** Por defecto `primary`; `success` o `streak` cuando la acción lo pide (tomar, check-in) */
  variant?: Exclude<ButtonVariant, 'danger' | 'secondary' | 'ghost'>;
}

export interface BottomActionBarProps {
  primary: BottomActionBarAction;
  /** Acción secundaria opcional, como botón fantasma encima de la principal */
  secondary?: { label: string; onPress: () => void };
}

/** Alto de la barra sin el área segura (botón de 48 + padding 12 arriba y abajo + borde). */
export const BOTTOM_ACTION_BAR_HEIGHT = 73;
