/**
 * Composant Input - Champ de saisie réutilisable
 * Améliore la cohérence et l'accessibilité
 */

import React from 'react';

const Input = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  variant = 'default', // 'default', 'search', 'file'
  size = 'md', // 'sm', 'md', 'lg'
  fullWidth = true,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 md:py-3 text-base',
    lg: 'px-5 py-3 md:py-4 text-lg',
  };

  const baseStyles = 'w-full bg-black/30 border-2 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm';

  const borderStyles = error
    ? 'border-red-500/50 focus:border-red-400'
    : 'border-emerald-500/50 focus:border-cyan-400 focus:bg-emerald-500/5';

  const inputId = props.id || `input-${Math.random().toString(36).substring(2, 9)}`;

  // Gérer l'icône : si c'est un composant React, l'invoquer
  const IconComponent = icon;
  const renderIcon = () => {
    if (!icon) return null;
    
    // Si c'est un composant React (fonction ou classe)
    if (typeof icon === 'function' || (icon && icon.$$typeof)) {
      return <IconComponent size={18} />;
    }
    
    // Si c'est déjà un élément React ou une string
    return icon;
  };

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-semibold text-slate-300 mb-2"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1" aria-label="requis">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          >
            {renderIcon()}
          </span>
        )}
        <input
          id={inputId}
          className={`${baseStyles} ${borderStyles} ${sizeStyles[size]} ${icon && iconPosition === 'left' ? 'pl-10' : ''} ${icon && iconPosition === 'right' ? 'pr-10' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {icon && iconPosition === 'right' && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            aria-hidden="true"
          >
            {renderIcon()}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="mt-1 text-sm text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Composant TextArea avec forwardRef pour supporter les refs
const TextArea = React.forwardRef(({
  label,
  error,
  helperText,
  size = 'md',
  fullWidth = true,
  className = '',
  ...props
}, ref) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 md:py-3 text-base',
    lg: 'px-5 py-3 md:py-4 text-lg',
  };

  const baseStyles = 'w-full bg-black/30 border-2 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm resize-y';

  const borderStyles = error
    ? 'border-red-500/50 focus:border-red-400'
    : 'border-emerald-500/50 focus:border-cyan-400 focus:bg-emerald-500/5';

  const textAreaId = props.id || `textarea-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={textAreaId}
          className="block text-sm font-semibold text-slate-300 mb-2"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1" aria-label="requis">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        id={textAreaId}
        className={`${baseStyles} ${borderStyles} ${sizeStyles[size]} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${textAreaId}-error` : helperText ? `${textAreaId}-helper` : undefined}
        {...props}
      />
      {error && (
        <p id={`${textAreaId}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${textAreaId}-helper`} className="mt-1 text-sm text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

// Composant Select
const Select = ({
  label,
  error,
  helperText,
  size = 'md',
  fullWidth = true,
  className = '',
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 md:py-3 text-base',
    lg: 'px-5 py-3 md:py-4 text-lg',
  };

  const baseStyles = 'w-full bg-black/30 border-2 rounded-lg text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all duration-200 backdrop-blur-sm';

  const borderStyles = error
    ? 'border-red-500/50 focus:border-red-400'
    : 'border-emerald-500/50 focus:border-cyan-400 focus:bg-emerald-500/5';

  const selectId = props.id || `select-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-semibold text-slate-300 mb-2"
        >
          {label}
          {props.required && <span className="text-red-400 ml-1" aria-label="requis">*</span>}
        </label>
      )}
      <select
        id={selectId}
        className={`${baseStyles} ${borderStyles} ${sizeStyles[size]} ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={`${selectId}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${selectId}-helper`} className="mt-1 text-sm text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Composant Checkbox
const Checkbox = ({
  label,
  error,
  helperText,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const checkboxId = props.id || `checkbox-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          className={`w-4 h-4 bg-black/30 border-2 border-emerald-500/50 rounded text-emerald-400 focus:ring-2 focus:ring-emerald-500/50 focus:outline-none transition-all duration-200 ${error ? 'border-red-500/50' : ''} ${className}`}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${checkboxId}-error` : helperText ? `${checkboxId}-helper` : undefined}
          {...props}
        />
        {label && (
          <label
            htmlFor={checkboxId}
            className="text-sm font-semibold text-slate-300 cursor-pointer"
          >
            {label}
            {props.required && <span className="text-red-400 ml-1" aria-label="requis">*</span>}
          </label>
        )}
      </div>
      {error && (
        <p id={`${checkboxId}-error`} className="mt-1 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${checkboxId}-helper`} className="mt-1 text-sm text-slate-400">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
export { Input, TextArea, Select, Checkbox };
