import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  border = true,
  hover = false,
  gradient = false,
  variant = 'default', // 'default' | 'glass'
  ...props 
}) => {
  const paddings = {
    none: '',
    xs: 'p-2',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
    '2xl': 'shadow-2xl'
  };

  const roundeds = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  // Style "liquid glass" iOS 2025 - utilise les classes CSS personnalisées
  const glassClasses = 'books-glass-card';
  
  const baseClasses = variant === 'glass'
    ? glassClasses
    : gradient 
      ? 'bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl text-white'
      : 'bg-slate-800/90 backdrop-blur-xl text-white';
    
  const borderClasses = variant === 'glass' ? '' : (border ? 'border border-slate-700/50' : '');
  const hoverClasses = variant === 'glass' 
    ? '' 
    : (hover ? 'hover:bg-slate-800/95 hover:shadow-2xl hover:backdrop-blur-2xl transition-all duration-300 cursor-pointer' : '');

  const classes = `
    ${baseClasses} 
    ${paddings[padding]} 
    ${shadows[shadow]} 
    ${roundeds[rounded]} 
    ${borderClasses} 
    ${hoverClasses} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

// Sous-composants pour une meilleure structure
const CardHeader = ({ children, className = '', ...props }) => {
  // Détecter si le parent Card a variant="glass" via le contexte visuel
  // Pour simplifier, on utilise une classe CSS qui s'adapte automatiquement
  return (
    <div className={`border-b border-white/10 dark:border-slate-700/50 pb-4 mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', size = 'lg', ...props }) => {
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
    xl: 'text-3xl'
  };
  
  return (
    <h3 className={`font-bold text-white ${sizes[size]} ${className}`} {...props}>
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '', ...props }) => (
  <div className={`text-slate-300 ${className}`} {...props}>
    {children}
  </div>
);

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div className={`border-t border-white/10 dark:border-slate-700/50 pt-4 mt-4 ${className}`} {...props}>
      {children}
    </div>
  );
};

Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
export { CardHeader, CardTitle, CardContent, CardFooter };