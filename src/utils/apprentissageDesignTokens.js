/**
 * Design Tokens pour le module Apprentissage
 * Centralise les couleurs, espacements, typographie pour cohérence
 */

/** Charte UI : fond noir, contours verts (Tailwind : bg-black + border-emerald-500/…), fluide XP en verts. */
export const CHARTER = {
  surface: '#000000',
  border: 'rgba(16, 185, 129, 0.72)', // emerald-500
  borderSoft: 'rgba(16, 185, 129, 0.45)',
  xpTrack: '#000000',
  xpFillFrom: '#059669', // emerald-600
  xpFillTo: '#34d399', // emerald-400
  textPrimary: 'rgba(209, 250, 229, 0.95)', // emerald-50-ish
  textMuted: 'rgba(167, 243, 208, 0.75)', // emerald-200/80
};

export const COLORS = {
  // Couleurs principales
  primary: {
    emerald: '#10b981', // emerald-500
    emeraldLight: '#34d399', // emerald-400
    emeraldDark: '#059669', // emerald-600
    cyan: '#06b6d4', // cyan-500
    cyanLight: '#22d3ee', // cyan-400
  },
  
  // Couleurs d'état
  success: '#10b981', // emerald-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
  
  // Couleurs de texte
  text: {
    primary: '#e2e8f0', // slate-200
    secondary: '#cbd5e1', // slate-300
    tertiary: '#94a3b8', // slate-400
    muted: '#64748b', // slate-500
  },
  
  // Couleurs de fond (charte : noir dominant)
  background: {
    primary: '#000000',
    secondary: '#000000',
    tertiary: '#052e16', // emerald-950 — rares accents
    overlay: 'rgba(0, 0, 0, 0.78)',
  },
  
  // Couleurs de bordure (charte : vert)
  border: {
    default: 'rgba(16, 185, 129, 0.45)', // emerald-500/45
    focus: 'rgba(52, 211, 153, 0.65)', // emerald-400
    active: 'rgba(16, 185, 129, 0.55)',
  },
};

export const SPACING = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
};

export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['Fira Code', 'monospace'],
  },
  
  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },
  
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
};

export const BORDER_RADIUS = {
  none: '0',
  sm: '0.125rem', // 2px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  full: '9999px',
};

export const SHADOWS = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  emerald: '0 0 20px rgba(16, 185, 129, 0.4)',
  cyan: '0 0 20px rgba(6, 182, 212, 0.4)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
};

export const TRANSITIONS = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
  easing: {
    default: 'cubic-bezier(0.4, 0, 0.2, 1)',
    in: 'cubic-bezier(0.4, 0, 1, 1)',
    out: 'cubic-bezier(0, 0, 0.2, 1)',
    inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
};

export default {
  CHARTER,
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
  TRANSITIONS,
  BREAKPOINTS,
  Z_INDEX,
};

