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
      className="flex items-center justify-center rounded-lg border-2 border-[#0F4C5C]/60 bg-black text-sm text-teal-200/80"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <span 
          className="h-5 w-5 animate-spin rounded-full border-2 border-[#0F4C5C]/50 border-t-[#0F5C45]"
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


