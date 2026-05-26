import { colors, palette } from "./tokens";

// ─── Tema Light ───────────────────────────────────────────────────────────────

export const lightTheme = {
  surface: {
    bg:             colors.slate[50],
    bgCard:         colors.white,
    bgSidebar:      colors.slate[900],
    bgSidebarHover: colors.slate[800],
  },
  text: {
    primary:   colors.gray[900],
    secondary: colors.slate[500],
    muted:     colors.gray[400],
  },
  border: {
    default: colors.gray[200],
    light:   colors.slate[100],
    medium:  colors.slate[200],
  },
  brand: {
    /** Solid bg — headers, FAB, primary buttons */
    solid:      palette.brand[500],
    /** Solid hover/pressed */
    solidAlt:   palette.brand[600],
    /** Light tint bg — badges, icon containers, pills */
    tint:       palette.brand[50],
    /** Medium tint bg — active nav bg, highlighted rows */
    tintMed:    palette.brand[100],
    /** Border on tinted elements */
    tintBorder: palette.brand[200],
    /** Text on tinted backgrounds */
    tintText:   palette.brand[700],
    /** Dark brand text — headings inside brand areas */
    tintStrong: palette.brand[900],
    /** Subtitle text on solid brand backgrounds */
    onSolid:    palette.brand[100],
    /** Foreground — icon color, active tab, stays vivid in both modes */
    fg:         palette.brand[500],
  },
  status: {
    errorBg:     palette.status.error[50],
    errorFg:     palette.status.error[500],
    errorBorder: palette.status.error[600],
    successBg:   palette.status.success[50],
    successFg:   palette.status.success[500],
    warningBg:   palette.status.warning[50],
    warningFg:   palette.status.warning[500],
  },
  accent: {
    docBg:      palette.accent.document[50],
    docFg:      palette.accent.document[600],
    calBg:      palette.accent.calendar[50],
    calFg:      palette.accent.calendar[600],
    medBg:      palette.accent.medication[50],
    medFg:      palette.accent.medication[600],
    aiBg:       palette.accent.ai[50],
    aiFg:       palette.accent.ai[500],
    notifBg:    palette.accent.notification[50],
    notifFg:    palette.accent.notification[500],
  },
} as const;

// ─── Tema Dark ────────────────────────────────────────────────────────────────

export const darkTheme = {
  surface: {
    bg:             '#0c1222',
    bgCard:         colors.slate[800],
    bgSidebar:      colors.slate[950],
    bgSidebarHover: colors.slate[700],
  },
  text: {
    primary:   colors.slate[50],
    secondary: colors.slate[400],
    muted:     colors.slate[500],
  },
  border: {
    default: colors.slate[700],
    light:   'rgba(148, 163, 184, 0.1)',
    medium:  colors.slate[700],
  },
  brand: {
    /** Solid bg — deeper blue for dark headers */
    solid:      palette.brand[800],
    solidAlt:   palette.brand[900],
    /** Light tint — semi-transparent on dark bg */
    tint:       'rgba(59, 130, 246, 0.12)',
    tintMed:    'rgba(59, 130, 246, 0.18)',
    tintBorder: 'rgba(59, 130, 246, 0.25)',
    /** Text on tinted — lighter for readability */
    tintText:   palette.brand[300],
    tintStrong: palette.brand[200],
    /** Subtitle on solid headers */
    onSolid:    palette.brand[200],
    /** Foreground — stays vivid for icons/active elements */
    fg:         palette.brand[400],
  },
  status: {
    errorBg:     'rgba(239, 68, 68, 0.12)',
    errorFg:     palette.status.error[400],
    errorBorder: palette.status.error[500],
    successBg:   'rgba(34, 197, 94, 0.12)',
    successFg:   palette.status.success[500],
    warningBg:   'rgba(245, 158, 11, 0.12)',
    warningFg:   palette.status.warning[500],
  },
  accent: {
    docBg:      'rgba(34, 197, 94, 0.12)',
    docFg:      palette.accent.document[500],
    calBg:      'rgba(244, 114, 182, 0.12)',
    calFg:      palette.accent.calendar[500],
    medBg:      'rgba(245, 158, 11, 0.12)',
    medFg:      palette.accent.medication[500],
    aiBg:       'rgba(139, 92, 246, 0.12)',
    aiFg:       palette.accent.ai[500],
    notifBg:    'rgba(16, 185, 129, 0.12)',
    notifFg:    palette.accent.notification[500],
  },
} as const;

export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;

/** Union semántica */
export type AppTheme = {
  surface: { bg: string; bgCard: string; bgSidebar: string; bgSidebarHover: string };
  text:    { primary: string; secondary: string; muted: string };
  border:  { default: string; light: string; medium: string };
  brand:   {
    solid: string; solidAlt: string;
    tint: string; tintMed: string; tintBorder: string;
    tintText: string; tintStrong: string;
    onSolid: string; fg: string;
  };
  status:  {
    errorBg: string; errorFg: string; errorBorder: string;
    successBg: string; successFg: string;
    warningBg: string; warningFg: string;
  };
  accent:  {
    docBg: string; docFg: string;
    calBg: string; calFg: string;
    medBg: string; medFg: string;
    aiBg: string; aiFg: string;
    notifBg: string; notifFg: string;
  };
};

export type ThemeMode = "light" | "dark";
