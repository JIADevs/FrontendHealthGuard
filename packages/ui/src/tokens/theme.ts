import { colors } from "./tokens";

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
} as const;

// ─── Tema Dark ────────────────────────────────────────────────────────────────

export const darkTheme = {
  surface: {
    bg:             colors.slate[900],
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
    light:   colors.slate[800],
    medium:  colors.slate[700],
  },
} as const;

export type LightTheme = typeof lightTheme;
export type DarkTheme = typeof darkTheme;

/** Union semántica: cada propiedad puede ser cualquier valor de light o dark */
export type AppTheme = {
  surface: { bg: string; bgCard: string; bgSidebar: string; bgSidebarHover: string };
  text:    { primary: string; secondary: string; muted: string };
  border:  { default: string; light: string; medium: string };
};

export type ThemeMode = "light" | "dark";

