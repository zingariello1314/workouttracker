/**
 * Carte étirement compacte pour carrousels (similaires).
 */
import React from 'react';
import { Target, Clock, Star, Plus } from 'lucide-react';
import AnatomyBankCardPreview from '../../anatomy/AnatomyBankCardPreview';
import {
  computeStretchXpFromRating,
  computeStretchWeightedGlobal5,
  stretchStorageToDraft
} from '../../../utils/stretchPerceivedRatings';

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const r = seconds % 60;
  return r === 0 ? `${m} min` : `${m}m${r}s`;
}

export default function StretchBankCarouselCard({
  stretch,
  ratingForCard,
  onOpen,
  onRequestAddToProgram,
  isAuthenticated
}) {
  const xpPerCheck = computeStretchXpFromRating(ratingForCard);
  const global5 = computeStretchWeightedGlobal5(stretchStorageToDraft(ratingForCard || {}));
  const avgNote = global5 != null ? (Math.round(global5 * 10) / 10).toFixed(1) : null;

  const open = () => onOpen(stretch);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="group text-left rounded-xl border-2 border-[#0F4C5C]/85 bg-black shadow-lg hover:border-[#0F5C45]/80 transition-all p-4 grid h-full min-h-[28rem] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/45
        grid-rows-[auto_auto_auto_220px_auto_auto]
        gap-2"
    >
      <div className="flex items-start justify-between gap-2 border-b border-[#0F4C5C]/35 pb-2">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-2 min-h-[2.5rem]">
          {stretch.name}
        </h4>
        <span className="shrink-0 text-[10px] text-teal-600/90 inline-flex items-center gap-0.5 rounded-md border border-[#0F4C5C]/50 px-2 py-0.5">
          <Star className="w-3 h-3 text-amber-400" />
          {xpPerCheck} XP
        </span>
      </div>

      {isAuthenticated && onRequestAddToProgram ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRequestAddToProgram({
              kind: 'stretch',
              stretchKey: stretch.key,
              stretchLabel: stretch.name
            });
          }}
          className="inline-flex w-fit items-center gap-1.5 rounded-lg border-2 border-[#0F5C45] bg-[#0F5C45]/40 px-2.5 py-1.5 text-[10px] font-semibold uppercase text-white"
        >
          <Plus className="h-3.5 w-3.5" />
          Ajouter
        </button>
      ) : (
        <span className="h-8" aria-hidden />
      )}

      <div className="flex flex-wrap gap-1.5 text-[10px]">
        <span className="px-2 py-0.5 rounded-md border border-[#0F5C45]/45 bg-[#0F5C45]/15 text-teal-100 inline-flex items-center gap-1 capitalize">
          <Target className="w-3 h-3" />
          {stretch.bodyZone}
        </span>
        <span className="px-2 py-0.5 rounded-md border border-[#0F4C5C]/50 text-teal-200/90">
          {stretch.category}
        </span>
        <span className="text-teal-700 inline-flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDuration(stretch.defaultDuration)}
        </span>
        <span className="text-teal-700">Niv. {stretch.difficulty}/4</span>
      </div>

      <div className="h-[220px] w-full overflow-hidden [&>*]:min-h-0">
        <AnatomyBankCardPreview
          primaryMuscles={stretch.primaryMuscles}
          secondaryMuscles={stretch.secondaryMuscles}
          mode="stretch"
          layout="gridFill"
          stretchDatabaseKey={stretch.key}
        />
      </div>

      {stretch.primaryMuscles?.length > 0 && (
        <p className="text-[10px] text-teal-100/85 line-clamp-2">
          <span className="text-teal-800 uppercase font-medium">Primaires · </span>
          {stretch.primaryMuscles.slice(0, 3).join(' · ')}
        </p>
      )}

      <p className="text-[11px] text-teal-100/75 line-clamp-2 border-t border-[#0F4C5C]/30 pt-2">
        {stretch.description}
        {avgNote != null ? ` · Note ${avgNote}/5` : ''}
      </p>
    </div>
  );
}
