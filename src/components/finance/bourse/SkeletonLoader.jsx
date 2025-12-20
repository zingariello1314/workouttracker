import React from 'react';

export const PortfolioTableSkeleton = () => (
  <div className="space-y-4">
    <div className="animate-pulse">
      <div className="h-12 bg-slate-700/50 rounded-lg mb-4"></div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-slate-700/30 rounded-lg mb-2"></div>
      ))}
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-96 bg-slate-700/50 rounded-lg"></div>
  </div>
);

export const CardSkeleton = () => (
  <div className="animate-pulse bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
    <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
    <div className="h-4 bg-slate-700/30 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-slate-700/30 rounded w-2/3 mb-2"></div>
    <div className="h-4 bg-slate-700/30 rounded w-1/4"></div>
  </div>
);

export const SummarySkeleton = () => (
  <div className="animate-pulse grid grid-cols-1 md:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="h-24 bg-slate-700/50 rounded-lg"></div>
    ))}
  </div>
);

/**
 * Skeleton pour AlertsPanel
 * ✅ OPTIMISATION Phase 2.1 : Skeleton pour lazy loading
 */
export const AlertsPanelSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-slate-700/50 rounded w-1/4 mb-4"></div>
    {[...Array(3)].map((_, i) => (
      <div key={i} className="h-20 bg-slate-700/30 rounded-lg border border-slate-700/50"></div>
    ))}
  </div>
);

/**
 * Skeleton pour RecommendationsPanel
 * ✅ OPTIMISATION Phase 2.1 : Skeleton pour lazy loading
 */
export const RecommendationsPanelSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
    {[...Array(2)].map((_, i) => (
      <div key={i} className="h-32 bg-slate-700/30 rounded-lg border border-slate-700/50 p-4">
        <div className="h-4 bg-slate-700/50 rounded w-1/2 mb-2"></div>
        <div className="h-3 bg-slate-700/30 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-700/30 rounded w-2/3"></div>
      </div>
    ))}
  </div>
);

// Export par défaut pour compatibilité
const SkeletonLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-slate-400">Chargement...</p>
    </div>
  </div>
);

export default SkeletonLoader;

