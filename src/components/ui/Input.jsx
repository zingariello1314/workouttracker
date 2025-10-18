import React, { forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { buildInputClasses, buildLabelClasses, errorStyles, helpStyles } from '../../styles/input';

const Input = forwardRef(({
  label,
  error,
  help,
  required = false,
  optional = false,
  variant = 'primary',
  size = 'md',
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const inputClasses = buildInputClasses({
    variant,
    size,
    disabled: props.disabled,
    readonly: props.readOnly,
    error: !!error,
    className
  });

  const labelClasses = buildLabelClasses({
    required,
    optional,
    className: labelClassName
  });

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={props.id} className={labelClasses}>
          {label}
        </label>
      )}
      
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <div className={errorStyles.base}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {help && !error && (
        <div className={helpStyles.base}>
          {help}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Composant TextArea avec les mêmes styles
const TextArea = forwardRef(({
  label,
  error,
  help,
  required = false,
  optional = false,
  variant = 'primary',
  size = 'md',
  rows = 4,
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const inputClasses = buildInputClasses({
    variant,
    size,
    disabled: props.disabled,
    readonly: props.readOnly,
    error: !!error,
    className: `resize-none ${className}`
  });

  const labelClasses = buildLabelClasses({
    required,
    optional,
    className: labelClassName
  });

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={props.id} className={labelClasses}>
          {label}
        </label>
      )}
      
      <textarea
        ref={ref}
        rows={rows}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <div className={errorStyles.base}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {help && !error && (
        <div className={helpStyles.base}>
          {help}
        </div>
      )}
    </div>
  );
});

TextArea.displayName = 'TextArea';

// Composant Select avec les mêmes styles
const Select = forwardRef(({
  label,
  error,
  help,
  required = false,
  optional = false,
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  const inputClasses = buildInputClasses({
    variant,
    size,
    disabled: props.disabled,
    error: !!error,
    className
  });

  const labelClasses = buildLabelClasses({
    required,
    optional,
    className: labelClassName
  });

  return (
    <div className={`space-y-2 ${containerClassName}`}>
      {label && (
        <label htmlFor={props.id} className={labelClasses}>
          {label}
        </label>
      )}
      
      <select
        ref={ref}
        className={inputClasses}
        {...props}
      >
        {children}
      </select>
      
      {error && (
        <div className={errorStyles.base}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {help && !error && (
        <div className={helpStyles.base}>
          {help}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

// Composant Checkbox avec les mêmes styles
const Checkbox = forwardRef(({
  label,
  error,
  help,
  className = '',
  containerClassName = '',
  labelClassName = '',
  ...props
}, ref) => {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <div className="flex items-center space-x-3">
        <input
          ref={ref}
          type="checkbox"
          className={`w-5 h-5 text-blue-600 bg-slate-700 border-slate-500 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200 ${className}`}
          {...props}
        />
        {label && (
          <label htmlFor={props.id} className={`text-sm font-medium text-slate-300 cursor-pointer ${labelClassName}`}>
            {label}
          </label>
        )}
      </div>
      
      {error && (
        <div className={errorStyles.base}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {help && !error && (
        <div className={helpStyles.base}>
          {help}
        </div>
      )}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

export { Input, TextArea, Select, Checkbox };
export default Input;