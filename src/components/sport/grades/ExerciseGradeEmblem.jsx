import React from 'react';
import { exerciseGradeArtUrl } from '../../../services/xp/exerciseGradeArt';

/**
 * Badge visuel grade exercice (image matériau + palier romain).
 */
export default function ExerciseGradeEmblem({ gradeId, gradeLabel, layout = 'row', className = '' }) {
  const src = exerciseGradeArtUrl(gradeId);
  const match = String(gradeLabel || '').match(/^(.*?)\s+(I{1,3})$/);
  const roman = match ? match[2] : null;

  const imgSize =
    layout === 'hero'
      ? 'h-[min(100%,200px)] w-full min-h-[140px] aspect-square max-w-[200px]'
      : layout === 'chip'
        ? 'h-14 w-14'
        : 'h-12 w-12';

  const showSideLabel = layout !== 'chip' && layout !== 'hero' && gradeLabel;

  return (
    <div
      className={`${layout === 'hero' ? 'flex flex-col items-center' : 'flex items-center gap-2'} ${className}`}
    >
      <div className={`relative shrink-0 overflow-hidden rounded-lg border border-[#0F4C5C]/40 bg-black/80 ${imgSize}`}>
        <img
          src={src}
          alt={gradeLabel || 'Grade exercice'}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {roman ? (
          <span className="absolute bottom-0 inset-x-0 bg-black/75 py-0.5 text-center text-[9px] font-bold tabular-nums text-white">
            {roman}
          </span>
        ) : null}
      </div>
      {showSideLabel ? (
        <span className="text-xs font-semibold text-slate-200">{gradeLabel}</span>
      ) : null}
    </div>
  );
}
