/**
 * Composant Card - Carte réutilisable avec variants
 * Améliore la cohérence visuelle et la maintenabilité
 */

import React from 'react';

const Card = ({
  children,
  variant = 'default', // 'default', 'highlighted', 'success', 'warning', 'danger'
  hover = false,
  className = '',
  onClick,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-800/50 border border-slate-700/50',
    highlighted: 'bg-slate-800/70 border border-emerald-500/30 shadow-xl shadow-emerald-500/10',
    success: 'bg-emerald-500/10 border border-emerald-500/30',
    warning: 'bg-amber-500/10 border border-amber-500/30',
    danger: 'bg-red-500/10 border border-red-500/30',
  };

  const hoverStyles = hover || onClick
    ? 'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`backdrop-blur-sm rounded-xl p-4 md:p-6 ${variantStyles[variant]} ${hoverStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};

// Composants de structure pour Card
const CardHeader = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-4 md:px-6 py-4 border-b border-slate-700/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardTitle = ({ children, className = '', ...props }) => {
  return (
    <h3
      className={`text-lg md:text-xl font-bold text-emerald-400 uppercase tracking-wide ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
};

const CardContent = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-4 md:px-6 py-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const CardFooter = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`px-4 md:px-6 py-4 border-t border-slate-700/50 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
export { Card, CardHeader, CardTitle, CardContent, CardFooter };
