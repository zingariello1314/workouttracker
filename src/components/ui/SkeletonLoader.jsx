/**
 * Composant SkeletonLoader - Affiche un skeleton pendant le chargement
 * Améliore la perception de performance
 */

import React from 'react';

const SkeletonLoader = ({ 
  variant = 'default', 
  width, 
  height, 
  className = '',
  count = 1 
}) => {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 bg-[length:200%_100%] rounded';
  
  const variants = {
    default: 'h-4 w-full',
    text: 'h-4 w-full',
    title: 'h-8 w-3/4',
    avatar: 'h-12 w-12 rounded-full',
    card: 'h-48 w-full',
    button: 'h-10 w-24 rounded-lg',
    circle: 'h-16 w-16 rounded-full',
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  const skeletonClass = `${baseClasses} ${variants[variant] || variants.default} ${className}`;

  if (count > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className={skeletonClass} style={style} aria-hidden="true" />
        ))}
      </div>
    );
  }

  return <div className={skeletonClass} style={style} aria-hidden="true" aria-label="Chargement en cours" />;
};

export default SkeletonLoader;

