import { semanticLight, semanticDark, type SemanticKey } from './semantic';
import type { ThemeMode } from './theme';

/**
 * Tonos compartidos por IconTile, Chip, ListRow y otros componentes v2 (MASTER §4.2–4.4).
 * Cada tono es un par fondo / texto-ícono de la capa semántica (`semantic.ts`).
 */
export type Tone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'ai'
  | 'streak'
  | 'mission'
  | 'medication'
  | 'appointment'
  | 'document'
  | 'backpack'
  | 'treatment'
  | 'wellbeing'
  | 'notification';

const toneKeys: Record<Tone, { bg: SemanticKey; fg: SemanticKey }> = {
  neutral:      { bg: 'surface-muted', fg: 'text-on-muted' },
  brand:        { bg: 'brand-tint', fg: 'brand-text' },
  success:      { bg: 'success-bg', fg: 'success-fg' },
  warning:      { bg: 'warning-bg', fg: 'warning-fg' },
  danger:       { bg: 'danger-bg', fg: 'danger-fg' },
  info:         { bg: 'info-bg', fg: 'info-fg' },
  ai:           { bg: 'feature-ai-bg', fg: 'feature-ai-fg' },
  streak:       { bg: 'motivation-streak-bg', fg: 'motivation-streak-text' },
  mission:      { bg: 'feature-mission-bg', fg: 'feature-mission-fg' },
  medication:   { bg: 'feature-medication-bg', fg: 'feature-medication-fg' },
  appointment:  { bg: 'feature-appointment-bg', fg: 'feature-appointment-fg' },
  document:     { bg: 'feature-document-bg', fg: 'feature-document-fg' },
  backpack:     { bg: 'feature-backpack-bg', fg: 'feature-backpack-fg' },
  treatment:    { bg: 'feature-treatment-bg', fg: 'feature-treatment-fg' },
  wellbeing:    { bg: 'feature-wellbeing-bg', fg: 'feature-wellbeing-fg' },
  notification: { bg: 'feature-notification-bg', fg: 'feature-notification-fg' },
};

/** Native: colores resueltos para el modo actual (`useAppTheme().mode`). */
export function toneColors(tone: Tone, mode: ThemeMode = 'light'): { bg: string; fg: string } {
  const s = mode === 'dark' ? semanticDark : semanticLight;
  const k = toneKeys[tone];
  return { bg: s[k.bg], fg: s[k.fg] };
}

/** Web: variables CSS (`--color-*`), así el tono sigue el modo oscuro sin JS. */
export function toneVars(tone: Tone): { bg: string; fg: string } {
  const k = toneKeys[tone];
  return { bg: `var(--color-${k.bg})`, fg: `var(--color-${k.fg})` };
}
