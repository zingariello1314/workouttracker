/**
 * Composant Badge - Badge réutilisable avec variants
 * Pour afficher des statuts, niveaux, catégories
 */

import React from 'react';

const Badge = ({
  children,
  variant = 'default', // 'default', 'success', 'warning', 'danger', 'info', 'emerald', 'cyan'
  size = 'md', // 'sm', 'md', 'lg'
  icon,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-700/50 border-slate-600 text-slate-300',
    success: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    warning: 'bg-amber-500/20 border-amber-500/50 text-amber-400',
    danger: 'bg-red-500/20 border-red-500/50 text-red-400',
    info: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
    emerald: 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400',
    cyan: 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm',
  };

  // Gérer l'icône : si c'est un composant React, l'invoquer
  const IconComponent = icon;
  const renderIcon = () => {
    if (!icon) return null;
    
    // Si c'est un composant React (fonction ou classe)
    if (typeof icon === 'function' || (icon && icon.$$typeof)) {
      return <IconComponent size={size === 'sm' ? 12 : size === 'lg' ? 16 : 14} />;
    }
    
    // Si c'est déjà un élément React ou une string
    return icon;
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wide ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && <span aria-hidden="true">{renderIcon()}</span>}
      {children}
    </span>
  );
};

export default Badge;
export { Badge };
