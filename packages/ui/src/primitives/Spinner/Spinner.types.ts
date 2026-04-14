export type SpinnerSize = 'sm' | 'md' | 'lg';
export type SpinnerColor = 'primary' | 'white';

export interface SpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
  /** Envuelve el spinner en un contenedor centrado con flex */
  center?: boolean;
}
