/**
 * SectionSkeleton - Skeleton loader pour sections NutritionTab
 * 
 * ✅ OPTIMISATION Phase 11.1 : Skeleton loader optimisé pour lazy loading
 * 
 * @module components/tabs/nutrition/components/SectionSkeleton
 */

import React from 'react';

/**
 * SectionSkeleton - Skeleton loader pour sections NutritionTab
 * 
 * ✅ OPTIMISATION Phase 11.1 : Skeleton loader optimisé pour lazy loading
 * 
 * @param {Object} props
 * @param {string} props.label - Label à afficher (optionnel)
 * @param {string} props.minHeight - Hauteur minimale (défaut: '400px')
 */
const SectionSkeleton = React.memo(({ label = 'du contenu', minHeight = '400px' }) => {
  return (
    <div
      className="rounded-lg border border-slate-700 bg-slate-800/60 flex items-center justify-center text-slate-300 text-sm"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <span 
          className="h-5 w-5 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin" 
          aria-hidden="true"
        />
        <span>Chargement {label}…</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.label === nextProps.label && prevProps.minHeight === nextProps.minHeight;
});

SectionSkeleton.displayName = 'SectionSkeleton';

export default SectionSkeleton;


