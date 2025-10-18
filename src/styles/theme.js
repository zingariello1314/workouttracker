// Système de design unifié pour l'application Momentum

export const theme = {
  // Palette de couleurs principale
  colors: {
    // Couleurs de base
    primary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    
    // Couleurs d'accent (purple/violet)
    accent: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    
    // Couleurs secondaires (blue)
    secondary: {
      50: '#eff6ff',
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
    
    // États
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    
    danger: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
  
  // Espacements standardisés
  spacing: {
    xs: '0.5rem',    // 8px
    sm: '0.75rem',   // 12px
    md: '1rem',      // 16px
    lg: '1.5rem',    // 24px
    xl: '2rem',      // 32px
    '2xl': '3rem',   // 48px
    '3xl': '4rem',   // 64px
  },
  
  // Rayons de bordure
  borderRadius: {
    none: '0',
    sm: '0.25rem',   // 4px
    md: '0.375rem',  // 6px
    lg: '0.5rem',    // 8px
    xl: '0.75rem',   // 12px
    '2xl': '1rem',   // 16px
    full: '9999px',
  },
  
  // Ombres
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  },
  
  // Typographie
  typography: {
    fontSizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem', // 36px
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeights: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  
  // Composants standardisés
  components: {
    // Styles de base pour les cartes
    card: {
      base: 'bg-primary-800/90 backdrop-blur-sm border border-primary-700/50 rounded-lg shadow-lg',
      hover: 'hover:bg-primary-800/95 transition-all duration-200',
      padding: {
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
    },
    
    // Styles pour les modales
    modal: {
      overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50',
      container: 'bg-primary-900 rounded-xl shadow-2xl border border-primary-700/50 max-h-[90vh] overflow-hidden',
      header: 'border-b border-primary-700/50 p-6',
      content: 'p-6',
    },
    
    // Styles pour les boutons
    button: {
      base: 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary-900',
      sizes: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
      variants: {
        primary: 'bg-accent-600 hover:bg-accent-700 text-white focus:ring-accent-500 shadow-md hover:shadow-lg',
        secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white focus:ring-secondary-500 shadow-md hover:shadow-lg',
        success: 'bg-success-600 hover:bg-success-700 text-white focus:ring-success-500 shadow-md hover:shadow-lg',
        danger: 'bg-danger-600 hover:bg-danger-700 text-white focus:ring-danger-500 shadow-md hover:shadow-lg',
        outline: 'border border-accent-600 text-accent-400 hover:bg-accent-900/20 focus:ring-accent-500',
        ghost: 'text-primary-300 hover:bg-primary-700/50 hover:text-white focus:ring-primary-500',
      },
    },
    
    // Styles pour les inputs
    input: {
      base: 'w-full px-3 py-2 bg-primary-700/50 border border-primary-600/50 rounded-lg text-white placeholder-primary-400 focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200',
      error: 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
    },
  },
};

// Classes Tailwind correspondantes pour une utilisation facile
export const tw = {
  // Couleurs de fond
  bg: {
    primary: 'bg-slate-800',
    primaryLight: 'bg-slate-700',
    primaryDark: 'bg-slate-900',
    accent: 'bg-purple-600',
    accentLight: 'bg-purple-500',
    accentDark: 'bg-purple-700',
    secondary: 'bg-blue-600',
    success: 'bg-green-600',
    danger: 'bg-red-600',
    warning: 'bg-yellow-600',
  },
  
  // Couleurs de texte
  text: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    accent: 'text-purple-400',
    success: 'text-green-400',
    danger: 'text-red-400',
    warning: 'text-yellow-400',
  },
  
  // Bordures
  border: {
    primary: 'border-slate-700',
    accent: 'border-purple-600',
    light: 'border-slate-600',
  },
};

export default theme;