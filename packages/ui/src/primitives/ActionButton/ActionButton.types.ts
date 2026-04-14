export type ActionType = 'edit' | 'create' | 'delete' | 'copy' | 'share' | 'view';
export type ActionButtonSize = 'sm' | 'md' | 'lg';

export interface ActionButtonProps {
  action: ActionType;
  onPress?: () => void;
  size?: ActionButtonSize;
  /** Etiqueta opcional que aparece debajo del icono */
  label?: string;
  disabled?: boolean;
  loading?: boolean;
  /** Web only — texto del tooltip (title attribute) */
  tooltip?: string;
}
