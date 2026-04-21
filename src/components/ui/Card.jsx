/**
 * Composant Card - Carte réutilisable avec variants
 * Améliore la cohérence visuelle et la maintenabilité
 */

import React from 'react';

const Card = ({
  children,
  variant = 'default', // 'default', 'glass', 'books', 'sport', 'highlighted', 'success', 'warning', 'danger'
  hover = false,
  className = '',
  onClick,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-slate-800/50 border border-slate-700/50',
    glass: 'bg-slate-950/55 border border-slate-600/60 shadow-md shadow-black/30',
    books: 'bg-black border-2 border-[#3A86FF] shadow-lg shadow-black/30 rounded-2xl',
    /** Charte Sport : fond noir opaque, contours teal / émeraude (pas de flou arrière-plan). */
    sport: 'bg-black border-2 border-[#0F4C5C]/85 shadow-lg shadow-black/40',
    highlighted: 'bg-slate-800/70 border border-emerald-500/30 shadow-xl shadow-emerald-500/10',
    success: 'bg-emerald-500/10 border border-emerald-500/30',
    warning: 'bg-amber-500/10 border border-amber-500/30',
    danger: 'bg-red-500/10 border border-red-500/30',
  };

  const resolvedVariant = variantStyles[variant] ? variant : 'default';
  const isBooks = resolvedVariant === 'books';
  const isSport = resolvedVariant === 'sport';
  const blurClass = isBooks || isSport ? '' : 'backdrop-blur-sm';
  const roundedClass = isBooks ? '' : 'rounded-xl';

  const hoverStyles =
    hover || onClick
      ? resolvedVariant === 'glass'
        ? 'hover:border-slate-500/80 hover:shadow-lg hover:shadow-black/30 transition-all duration-200 cursor-pointer'
        : resolvedVariant === 'books'
          ? 'hover:border-sky-400/90 hover:shadow-[#3A86FF]/15 transition-all duration-200 cursor-pointer'
          : resolvedVariant === 'sport'
            ? 'hover:border-[#0F5C45]/80 hover:shadow-lg hover:shadow-[#0F4C5C]/20 transition-all duration-200 cursor-pointer'
            : 'hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 cursor-pointer'
      : '';

  return (
    <div
      className={`${blurClass} ${roundedClass} p-4 md:p-6 ${variantStyles[resolvedVariant]} ${hoverStyles} ${className}`}
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

const CardTitle = ({ children, className = '', tone = 'emerald', size, ...props }) => {
  const toneClass =
    tone === 'books'
      ? 'text-[#93c5fd]'
      : tone === 'slate'
        ? 'text-slate-200'
        : 'text-emerald-400';
  const sizeClass =
    size === 'sm'
      ? 'text-sm md:text-base'
      : size === 'lg'
        ? 'text-xl md:text-2xl'
        : 'text-lg md:text-xl';

  return (
    <h3
      className={`${sizeClass} font-bold ${toneClass} uppercase tracking-wide ${className}`}
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

// Attacher les sous-composants à Card pour permettre Card.Header, Card.Title, etc.
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Content = CardContent;
Card.Footer = CardFooter;

export default Card;
export { Card, CardHeader, CardTitle, CardContent, CardFooter };
