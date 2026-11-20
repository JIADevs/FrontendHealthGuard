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
  // v2 (MASTER §5)
  | 'display'  // Nunito 900 30 — celebración, número de racha
  | 'eyebrow'  // Nunito 900 11 mayúsculas .08em — «PASO 4 · AHORA»
  | 'data'     // Inter 600 14 — dato principal de una fila
  | 'meta'     // Inter 400 13, text.secondary — metadato (mínimo absoluto)
  ;

export type TypographyColor =
  | 'default'   // text.primary
  | 'secondary' // text.secondary
  | 'muted'     // text.muted
  | 'error'
  | 'success'
  | 'warning'
  | 'inherit'
  | 'brand'     // brand.text — enlaces y texto sobre tinte de marca
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
