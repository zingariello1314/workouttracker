import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  className = '',
  icon: Icon,
  loading = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 shadow-sm hover:shadow-md active:scale-95';
  
  const variants = {
    primary: 'bg-purple-600/90 backdrop-blur-sm hover:bg-purple-700/90 text-white focus:ring-purple-500 shadow-purple-500/25 border border-purple-500/20',
    secondary: 'bg-blue-600/90 backdrop-blur-sm hover:bg-blue-700/90 text-white focus:ring-blue-500 shadow-blue-500/25 border border-blue-500/20',
    success: 'bg-green-600/90 backdrop-blur-sm hover:bg-green-700/90 text-white focus:ring-green-500 shadow-green-500/25 border border-green-500/20',
    danger: 'bg-red-600/90 backdrop-blur-sm hover:bg-red-700/90 text-white focus:ring-red-500 shadow-red-500/25 border border-red-500/20',
    warning: 'bg-yellow-600/90 backdrop-blur-sm hover:bg-yellow-700/90 text-white focus:ring-yellow-500 shadow-yellow-500/25 border border-yellow-500/20',
    outline: 'border-2 border-purple-600/60 backdrop-blur-sm text-purple-400 hover:bg-purple-600/20 hover:text-white focus:ring-purple-500 bg-transparent',
    ghost: 'text-slate-300 hover:bg-slate-700/50 hover:text-white focus:ring-slate-500 bg-transparent shadow-none hover:shadow-sm backdrop-blur-sm',
    glass: 'books-glass-button'
  };
  
  const sizes = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };
  
  const disabledClasses = disabled || loading ? 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100' : '';
  
  const classes = `${baseClasses} ${variants[variant]} ${sizes[size]} ${disabledClasses} ${className}`;
  
  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
      ) : (
        Icon && <Icon className={`${iconSizes[size]} ${children ? 'mr-2' : ''}`} />
      )}
      {children}
    </button>
  );
};

export default Button;