// Système d'inputs unifié pour l'application Momentum

export const inputStyles = {
  // Classes de base pour tous les inputs
  base: 'transition-all duration-200 focus:outline-none',
  
  // Styles par défaut
  default: 'w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-500',
  
  // Variantes
  variants: {
    primary: 'bg-slate-800/50 border-slate-600 focus:ring-blue-500 focus:border-blue-500',
    secondary: 'bg-slate-700/50 border-slate-500 focus:ring-purple-500 focus:border-purple-500',
    success: 'bg-green-900/20 border-green-600 focus:ring-green-500 focus:border-green-500',
    warning: 'bg-yellow-900/20 border-yellow-600 focus:ring-yellow-500 focus:border-yellow-500',
    danger: 'bg-red-900/20 border-red-600 focus:ring-red-500 focus:border-red-500',
    glass: 'books-glass-input w-full px-4 py-3'
  },
  
  // Tailles
  sizes: {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-5 py-4 text-lg'
  },
  
  // États
  states: {
    disabled: 'opacity-50 cursor-not-allowed bg-slate-800/30',
    readonly: 'bg-slate-700/30 cursor-default',
    error: 'border-red-500 focus:ring-red-500 focus:border-red-500'
  }
};

// Classes pour les labels
export const labelStyles = {
  base: 'block text-sm font-medium text-slate-300 mb-2',
  required: 'after:content-["*"] after:text-red-400 after:ml-1',
  optional: 'after:content-["(optionnel)"] after:text-slate-500 after:ml-1 after:text-xs'
};

// Classes pour les messages d'erreur
export const errorStyles = {
  base: 'text-sm text-red-400 mt-1 flex items-center gap-1'
};

// Classes pour les messages d'aide
export const helpStyles = {
  base: 'text-sm text-slate-400 mt-1'
};

// Classes pour les groupes d'inputs
export const inputGroupStyles = {
  base: 'space-y-2',
  horizontal: 'flex items-center gap-4',
  inline: 'flex items-center gap-2'
};

// Fonction utilitaire pour construire les classes d'input
export const buildInputClasses = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
  readonly = false,
  error = false,
  className = ''
}) => {
  const classes = [
    inputStyles.base,
    inputStyles.variants[variant],
    inputStyles.sizes[size]
  ];
  
  if (disabled) classes.push(inputStyles.states.disabled);
  if (readonly) classes.push(inputStyles.states.readonly);
  if (error) classes.push(inputStyles.states.error);
  if (className) classes.push(className);
  
  return classes.join(' ');
};

// Fonction utilitaire pour construire les classes de label
export const buildLabelClasses = ({
  required = false,
  optional = false,
  className = ''
}) => {
  const classes = [labelStyles.base];
  
  if (required) classes.push(labelStyles.required);
  if (optional) classes.push(labelStyles.optional);
  if (className) classes.push(className);
  
  return classes.join(' ');
};

export default inputStyles;