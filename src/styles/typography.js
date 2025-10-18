// Système de typographie unifié pour l'application Momentum

export const typography = {
  // Tailles de police standardisées
  fontSize: {
    xs: 'text-xs',      // 12px
    sm: 'text-sm',      // 14px
    base: 'text-base',  // 16px
    lg: 'text-lg',      // 18px
    xl: 'text-xl',      // 20px
    '2xl': 'text-2xl',  // 24px
    '3xl': 'text-3xl',  // 30px
    '4xl': 'text-4xl',  // 36px
    '5xl': 'text-5xl',  // 48px
    '6xl': 'text-6xl'   // 60px
  },

  // Poids de police standardisés
  fontWeight: {
    thin: 'font-thin',        // 100
    light: 'font-light',      // 300
    normal: 'font-normal',    // 400
    medium: 'font-medium',    // 500
    semibold: 'font-semibold', // 600
    bold: 'font-bold',        // 700
    extrabold: 'font-extrabold' // 800
  },

  // Hauteurs de ligne standardisées
  lineHeight: {
    tight: 'leading-tight',   // 1.25
    snug: 'leading-snug',     // 1.375
    normal: 'leading-normal', // 1.5
    relaxed: 'leading-relaxed', // 1.625
    loose: 'leading-loose'    // 2
  },

  // Couleurs de texte cohérentes avec le thème
  textColor: {
    primary: 'text-white',
    secondary: 'text-slate-300',
    muted: 'text-slate-400',
    accent: 'text-blue-400',
    success: 'text-green-400',
    warning: 'text-yellow-400',
    danger: 'text-red-400',
    gradient: 'bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent'
  },

  // Styles prédéfinis pour différents éléments
  presets: {
    // Titres principaux
    h1: 'text-4xl font-bold text-white leading-tight',
    h2: 'text-3xl font-bold text-white leading-tight',
    h3: 'text-2xl font-semibold text-white leading-snug',
    h4: 'text-xl font-semibold text-white leading-snug',
    h5: 'text-lg font-medium text-white leading-normal',
    h6: 'text-base font-medium text-white leading-normal',

    // Titres avec gradient
    h1Gradient: 'text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-tight',
    h2Gradient: 'text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent leading-tight',

    // Corps de texte
    body: 'text-base text-slate-300 leading-relaxed',
    bodyLarge: 'text-lg text-slate-300 leading-relaxed',
    bodySmall: 'text-sm text-slate-300 leading-normal',

    // Texte secondaire
    caption: 'text-sm text-slate-400 leading-normal',
    label: 'text-sm font-medium text-slate-300 leading-normal',
    
    // Texte d'interface
    button: 'font-medium leading-normal',
    link: 'text-blue-400 hover:text-blue-300 transition-colors duration-200',
    
    // États spéciaux
    success: 'text-green-400 font-medium',
    warning: 'text-yellow-400 font-medium',
    error: 'text-red-400 font-medium',
    
    // Texte sur fond sombre
    onDark: 'text-white',
    onDarkSecondary: 'text-slate-300',
    onDarkMuted: 'text-slate-400'
  },

  // Utilitaires pour les composants
  components: {
    card: {
      title: 'text-xl font-semibold text-white mb-2',
      subtitle: 'text-sm text-slate-400 mb-4',
      content: 'text-slate-300 leading-relaxed'
    },
    
    modal: {
      title: 'text-2xl font-bold text-white mb-4',
      subtitle: 'text-slate-300 mb-6',
      content: 'text-slate-300 leading-relaxed'
    },
    
    form: {
      label: 'block text-sm font-medium text-slate-300 mb-2',
      error: 'text-sm text-red-400 mt-1',
      help: 'text-sm text-slate-400 mt-1'
    },
    
    navigation: {
      active: 'font-medium text-white',
      inactive: 'font-medium text-slate-300 hover:text-white transition-colors duration-200'
    },
    
    badge: {
      small: 'text-xs font-medium',
      medium: 'text-sm font-medium',
      large: 'text-base font-medium'
    }
  }
};

// Fonction utilitaire pour combiner les classes de typographie
export const combineTypography = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Fonction pour obtenir un style de typographie prédéfini
export const getTypographyStyle = (preset) => {
  return typography.presets[preset] || '';
};

export default typography;