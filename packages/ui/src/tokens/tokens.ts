/**
 * Design tokens compartidos entre web y mobile.
 * Fuente de verdad única para colores, tipografía, espaciado y radios.
 */

// ─── Colores ────────────────────────────────────────────────────────────────

export const colors = {
  // Azul primario (usado en web como --primary-*)
  primary: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },

  // Escala de grises neutros (--gray-*)
  gray: {
    50:  '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Escala slate (usada ampliamente en mobile)
  slate: {
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },

  // Sky (color primario de acciones en mobile)
  sky: {
    50:  '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },

  // Amber
  amber: {
    50:  '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
  },

  // Yellow
  yellow: {
    50:  '#fefce8',
    100: '#fef9c3',
    200: '#fef08a',
    500: '#eab308',
    600: '#ca8a04',
    700: '#a16207',
  },

  // Green (extended — success no cubre todos los tonos)
  green: {
    50:  '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },

  // Pink
  pink: {
    50:  '#fdf2f8',
    100: '#fce7f3',
    200: '#fbcfe8',
    500: '#ec4899',
    600: '#db2777',
    700: '#be185d',
  },

  // Orange
  orange: {
    50:  '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
  },

  // Violeta (IA, acciones especiales)
  violet: {
    50:  '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
  },

  // Emerald (usado en notificaciones tipo CHECKIN)
  emerald: {
    50:  '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
  },

  // Semánticos de estado
  success: {
    50:  '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
  },
  warning: {
    50:  '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
  error: {
    50:  '#fef2f2',
    100: '#fee2e2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    800: '#991b1b',
  },

  // Base
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Tokens semánticos (superficie / texto / borde) ─────────────────────────

export const surface = {
  bg:             colors.slate[50],   // Fondo de pantalla
  bgCard:         colors.white,       // Fondo de tarjeta
  bgSidebar:      colors.slate[900],  // Sidebar web
  bgSidebarHover: colors.slate[800],
} as const;

export const text = {
  primary:   colors.gray[900],
  secondary: colors.slate[500],
  sidebar:   colors.slate[200],
  muted:     colors.gray[400],
} as const;

export const border = {
  default: colors.gray[200],
  light:   colors.slate[100],
  medium:  colors.slate[200],
} as const;

// ─── Radios ─────────────────────────────────────────────────────────────────

export const radii = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 9999,
} as const;

// ─── Espaciado ───────────────────────────────────────────────────────────────

export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
} as const;

// ─── Tipografía ──────────────────────────────────────────────────────────────

export const fontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   20,
  '2xl': 22,
  '3xl': 24,
  '4xl': 28,
} as const;

export const fontWeight = {
  normal:    '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
} as const;

export const fontFamily = {
  inherit: 'inherit',
  sans:    'Inter, system-ui, sans-serif',
  mono:    'JetBrains Mono, Menlo, monospace',
} as const;

// React Native no acepta fallbacks CSS — solo el nombre exacto de la fuente cargada
export const nativeFontFamily = {
  sans: 'Inter',
  mono: 'JetBrainsMono',
} as const;

// ─── Overlays ────────────────────────────────────────────────────────────────

export const overlay = {
  dark:    'rgba(0, 0, 0, 0.3)',
  darker:  'rgba(0, 0, 0, 0.5)',
  light:   'rgba(255, 255, 255, 0.2)',
} as const;

// ─── Backgrounds oscuros para toasts (dark surface) ──────────────────────────

export const toastBg = {
  success: '#052e16',
  error:   '#2d0a0a',
  warning: '#1c1100',
  info:    '#0c1a2e',
} as const;

// ─── Sombras (para React Native) ────────────────────────────────────────────

export const shadows = {
  sm: {
    shadowColor:   colors.black,
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius:  2,
    elevation:     1,
  },
  md: {
    shadowColor:   colors.black,
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius:  8,
    elevation:     2,
  },
  lg: {
    shadowColor:   colors.black,
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     4,
  },
} as const;

// ─── Tema completo (export agrupado) ─────────────────────────────────────────

export const theme = {
  colors,
  surface,
  text,
  border,
  radii,
  spacing,
  fontSize,
  fontWeight,
  fontFamily,
  shadows,
} as const;

export type Theme = typeof theme;

// ─── Paleta Semántica (3 niveles) ────────────────────────────────────────────
// Los componentes deben usar `palette.*` en lugar de `colors.*` directamente.
// Cambiar el color de marca = cambiar 1 línea (brand: colors.sky → colors.violet)

export const palette = {
  /** Nivel 1 — Brand Identity (CTAs, sidebar, links, focus rings) */
  brand: colors.primary,

  /** Nivel 2 — Estados Semánticos (significado funcional fijo) */
  status: {
    success: colors.success,
    warning: colors.warning,
    error:   colors.error,
    info:    colors.sky,
  },

  /** Nivel 3 — Acentos por Feature (diferenciación visual) */
  accent: {
    ai:           colors.violet,
    medication:   colors.amber,
    notification: colors.emerald,
    document:     colors.green,
    calendar:     colors.pink,
    backpack:     colors.orange,
  },

  /** Neutros */
  neutral: colors.gray,
  surface: colors.slate,
} as const;

export type Palette = typeof palette;
