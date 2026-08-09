import React, { useMemo } from 'react';
import { getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';
import AnatomyMuscleThumbPreview from '../../anatomy/AnatomyMuscleThumbPreview';
import { HighlightQueryInLabel } from './AnatomySearchHighlight';
import { ANATOMY } from './anatomyTheme';

export default function AnatomySearchMuscleChip({ muscleId, query, onClick }) {
  const muscle = useMemo(() => getAnatomyMuscle(muscleId), [muscleId]);
  if (!muscle) return null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 flex items-center gap-2 rounded-xl border border-[#0F4C5C]/70 bg-black/80 pr-3 pl-1 py-1 hover:border-teal-500/50 transition text-left max-w-[200px]`}
    >
      <div className="w-[52px] h-[68px] shrink-0 overflow-hidden rounded-lg">
        <AnatomyMuscleThumbPreview muscle={muscle} className="!w-full !h-full scale-[0.92] origin-top" />
      </div>
      <span className="text-xs font-semibold text-white leading-tight line-clamp-2">
        <HighlightQueryInLabel label={muscle.name} query={query} />
      </span>
    </button>
  );
}
