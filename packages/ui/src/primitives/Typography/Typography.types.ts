import type { ReactNode } from 'react';

export type TypographyVariant =
  | 'h1'       // 28px extrabold — título de página
  | 'h2'       // 24px extrabold — título de sección
  | 'h3'       // 20px bold      — título de tarjeta
  | 'h4'       // 18px semibold  — subtítulo
  | 'body'     // 15px normal    — texto principal
  | 'bodyLg'   // 16px normal    — texto ampliado
  | 'bodySm'   // 13px normal    — texto secundario
  | 'caption'  // 11px normal    — texto de ayuda / hint
  | 'label'    // 13px semibold  — etiquetas, tags
  | 'overline' // 11px semibold uppercase — cabeceras de sección
  ;

export type TypographyColor =
  | 'default'   // text.primary
  | 'secondary' // text.secondary
  | 'muted'     // text.muted
  | 'error'
  | 'success'
  | 'warning'
  | 'inherit'
  ;

export type TypographyAlign = 'left' | 'center' | 'right';

export interface TypographyProps {
  variant?: TypographyVariant;
  color?: TypographyColor;
  align?: TypographyAlign;
  /** Truncate after N lines (native) / sets CSS line-clamp (web) */
  numberOfLines?: number;
  children: ReactNode;
}
