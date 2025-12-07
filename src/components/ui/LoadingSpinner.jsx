import React from 'react';

/**
 * LoadingSpinner Component - Animated loading indicator
 * 
 * @param {Object} props
 * @param {string} props.size - Spinner size: 'sm', 'md', 'lg'
 * @param {string} props.color - Spinner color (Tailwind class)
 * @param {string} props.text - Optional loading text
 */
const LoadingSpinner = ({
  size = 'md',
  color = 'border-orange-500',
  text
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} ${color} border-t-transparent rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className="text-sm text-gray-400 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
