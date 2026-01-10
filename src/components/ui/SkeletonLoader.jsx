/**
 * Composants de skeleton loaders réutilisables
 * 
 * ✅ PHASE 3 : Skeleton loaders améliorés
 * 
 * @module components/ui/SkeletonLoader
 */

import React from 'react';

/**
 * Skeleton de base avec animation
 */
const SkeletonBase = ({ className = '', width, height, rounded = 'rounded' }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`bg-slate-700/50 animate-pulse ${rounded} ${className}`}
      style={style}
    />
  );
};

/**
 * Skeleton pour une carte
 */
export const CardSkeleton = ({ className = '' }) => (
  <div className={`bg-slate-900/70 border border-slate-700/80 rounded-2xl p-6 ${className}`}>
    <SkeletonBase height={24} width="60%" className="mb-4" />
    <SkeletonBase height={16} width="100%" className="mb-2" />
    <SkeletonBase height={16} width="80%" />
  </div>
);

/**
 * Skeleton pour un tableau
 */
export const TableSkeleton = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`bg-slate-900/70 border border-slate-700/80 rounded-2xl overflow-hidden ${className}`}>
    {/* Header */}
    <div className="bg-slate-900/90 border-b border-slate-700/80 p-4">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} height={20} width="100%" />
        ))}
      </div>
    </div>
    {/* Rows */}
    <div className="divide-y divide-slate-800/70">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, j) => (
              <SkeletonBase key={j} height={16} width="100%" />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

/**
 * Skeleton pour une liste
 */
export const ListSkeleton = ({ items = 5, className = '' }) => (
  <div className={`space-y-3 ${className}`}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 p-4 bg-slate-900/70 border border-slate-700/80 rounded-xl">
        <SkeletonBase height={48} width={48} rounded="rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBase height={20} width="60%" />
          <SkeletonBase height={16} width="40%" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Skeleton pour un graphique
 */
export const ChartSkeleton = ({ className = '' }) => (
  <div className={`bg-slate-900/70 border border-slate-700/80 rounded-2xl p-6 ${className}`}>
    <SkeletonBase height={24} width="40%" className="mb-6" />
    <SkeletonBase height={300} width="100%" rounded="rounded-lg" />
  </div>
);

/**
 * Skeleton pour un formulaire
 */
export const FormSkeleton = ({ fields = 4, className = '' }) => (
  <div className={`space-y-6 ${className}`}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i} className="space-y-2">
        <SkeletonBase height={16} width="30%" />
        <SkeletonBase height={40} width="100%" rounded="rounded-lg" />
      </div>
    ))}
    <div className="flex gap-3 justify-end">
      <SkeletonBase height={40} width={100} rounded="rounded-lg" />
      <SkeletonBase height={40} width={100} rounded="rounded-lg" />
    </div>
  </div>
);

/**
 * Skeleton générique personnalisable
 */
export const Skeleton = ({ className = '', width, height, rounded = 'rounded' }) => (
  <SkeletonBase className={className} width={width} height={height} rounded={rounded} />
);

export default {
  CardSkeleton,
  TableSkeleton,
  ListSkeleton,
  ChartSkeleton,
  FormSkeleton,
  Skeleton,
};
