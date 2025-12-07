/**
 * Composant Button - Bouton réutilisable avec variants
 * Améliore la cohérence et la maintenabilité
 */

import React from 'react';

const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'success', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left', // 'left', 'right'
  fullWidth = false,
  className = '',
  onClick,
  type = 'button',
  as,
  ...props
}) => {
  const Component = as || 'button';
  const variantStyles = {
    primary: 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border-emerald-500 text-emerald-400 hover:from-emerald-500/30 hover:to-cyan-500/30 hover:border-cyan-400 hover:shadow-lg hover:shadow-emerald-500/40',
    secondary: 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500',
    danger: 'bg-red-900/30 border-red-500 text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/40',
    success: 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40',
    ghost: 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs min-h-[32px]',
    md: 'px-4 py-2 md:px-6 md:py-3 text-sm md:text-base min-h-[44px]',
    lg: 'px-6 py-3 md:px-8 md:py-4 text-base md:text-lg min-h-[52px]',
  };

  const baseStyles = 'inline-flex items-center justify-center gap-2 border-2 rounded-lg font-semibold uppercase tracking-wide transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed';

  const hoverStyles = !disabled && !loading
    ? 'hover:-translate-y-0.5 active:translate-y-0'
    : '';

  // Gérer l'icône : si c'est un composant React, l'invoquer
  const IconComponent = icon;
  const renderIcon = () => {
    if (!icon) return null;
    
    // Si c'est un composant React (fonction ou classe)
    if (typeof icon === 'function' || (icon && icon.$$typeof)) {
      return <IconComponent size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} />;
    }
    
    // Si c'est déjà un élément React ou une string
    return icon;
  };

  return (
    <Component
      type={as ? undefined : type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${hoverStyles} ${className}`}
      style={{ willChange: 'transform' }}
      {...props}
    >
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden="true">⏳</span>
          <span>Chargement...</span>
        </>
      ) : (
        <>
          {iconPosition === 'left' && renderIcon()}
          {children}
          {iconPosition === 'right' && renderIcon()}
        </>
      )}
    </Component>
  );
};

export default Button;
