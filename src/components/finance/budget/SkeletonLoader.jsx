/**
 * Composant de chargement skeleton pour le module Budget
 */

import React from 'react';

const SkeletonLoader = ({ type = 'default' }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'budget-tab':
        return (
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-700 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-700 rounded"></div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="animate-pulse space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-slate-700 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-slate-700 rounded"></div>
            <div className="h-48 bg-slate-700 rounded"></div>
          </div>
        );

      case 'category-manager':
        return (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-700 rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-700 rounded"></div>
              ))}
            </div>
          </div>
        );

      case 'calendar':
        return (
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-slate-700 rounded w-1/3"></div>
            <div className="h-96 bg-slate-700 rounded"></div>
          </div>
        );

      default:
        return (
          <div className="animate-pulse">
            <div className="h-8 bg-slate-700 rounded w-1/2 mb-4"></div>
            <div className="h-32 bg-slate-700 rounded"></div>
          </div>
        );
    }
  };

  return (
    <div className="skeleton-loader">
      {renderSkeleton()}
    </div>
  );
};

export default SkeletonLoader;

