import React from 'react';
import { Plus, Target, Clock, Star, Heart } from 'lucide-react';
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

/** Carte étirement — même layout que la banque d'étirements (aperçu bleu). */
export default function PathologyStretchCard({
  stretch,
  ratingForCard,
  dosage,
  selected = false,
  onToggleSelect,
  onOpen,
  onRequestAddToProgram,
  showSelect = false
}) {
  const xpPerCheck = computeStretchXpFromRating(ratingForCard);
  const global5 = computeStretchWeightedGlobal5(stretchStorageToDraft(ratingForCard || {}));
  const avgNote = global5 != null ? (Math.round(global5 * 10) / 10).toFixed(1) : null;

  return (
    <div
      className={`flex h-full min-h-[32rem] flex-col overflow-hidden rounded-xl border-2 bg-black shadow-lg shadow-black/40 transition-all duration-200
        ${selected ? 'border-teal-400/70 ring-2 ring-teal-400/30' : 'border-[#0F4C5C]/85 hover:border-[#0F5C45]/80'}`}
    >
      {(showSelect || dosage) && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[#0F4C5C]/40 bg-[#041a13]/80 px-3 py-1.5">
          {showSelect ? (
            <label className="flex cursor-pointer items-center gap-2 text-[10px] text-teal-200">
              <input
                type="checkbox"
                checked={selected}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.();
                }}
                className="accent-teal-500"
              />
              Sélectionner
            </label>
          ) : (
            <span />
          )}
          {dosage && (
            <span className="shrink-0 rounded-md border border-sky-500/40 bg-black/60 px-2 py-0.5 text-[10px] font-mono text-sky-200">
              {dosage}
            </span>
          )}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_auto_300px_auto_auto_minmax(3.25rem,1fr)_auto] gap-3 p-5">
        <button
          type="button"
          onClick={onOpen}
          className="row-start-1 flex min-h-[3.75rem] w-full items-start justify-between gap-3 border-b border-[#0F4C5C]/35 pb-3 text-left"
        >
          <h4 className="min-h-[2.5rem] flex-1 text-sm font-semibold leading-snug tracking-tight text-white line-clamp-2">
            {stretch.name}
          </h4>
          <span className="shrink-0 text-[10px] text-teal-600/90 inline-flex items-center gap-0.5 tabular-nums rounded-md border border-[#0F4C5C]/50 bg-black px-2 py-0.5">
            <Star className="w-3 h-3 text-amber-400" />
            {xpPerCheck} XP
          </span>
        </button>

        <div className="row-start-2 flex min-h-[2.875rem] flex-col justify-start gap-1">
          {onRequestAddToProgram && (
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
              className="inline-flex w-fit max-w-full items-center justify-center gap-1.5 rounded-lg border-2 border-[#0F5C45] bg-[#0F5C45]/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-[0_0_16px_-6px_rgba(15,92,69,0.55)] transition hover:bg-[#0F5C45]/65"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              Ajouter au programme
            </button>
          )}
        </div>

        <div className="row-start-3 flex min-h-[3.25rem] shrink-0 flex-wrap content-start items-start gap-2 text-[10px]">
          <span className="px-2 py-0.5 rounded-md border border-[#0F5C45]/45 bg-[#0F5C45]/15 text-teal-100 inline-flex items-center gap-1 capitalize">
            <Target className="w-3 h-3 text-teal-400 shrink-0" />
            {stretch.bodyZone}
          </span>
          <span className="px-2 py-0.5 rounded-md border border-[#0F4C5C]/50 bg-black text-teal-200/90">
            {stretch.category}
          </span>
          <span className="text-teal-700 inline-flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {formatDuration(stretch.defaultDuration)}
          </span>
          <span className="text-teal-700 tabular-nums">Niv. {stretch.difficulty}/4</span>
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="row-start-4 flex h-[300px] w-full min-h-0 shrink-0 overflow-hidden [&>*]:min-h-0"
        >
          <AnatomyBankCardPreview
            primaryMuscles={stretch.primaryMuscles}
            secondaryMuscles={stretch.secondaryMuscles}
            mode="stretch"
            layout="gridFill"
            stretchDatabaseKey={stretch.key}
          />
        </button>

        <div className="row-start-5 space-y-1 min-h-[2.75rem]">
          {stretch.primaryMuscles?.length > 0 && (
            <div className="text-[10px] text-teal-600/90 leading-snug">
              <span className="text-teal-800 uppercase tracking-wide font-medium">Primaires · </span>
              <span className="text-teal-100/85">{stretch.primaryMuscles.slice(0, 4).join(' · ')}</span>
            </div>
          )}
          {stretch.secondaryMuscles?.length > 0 && (
            <div className="text-[10px] text-slate-500 leading-snug line-clamp-2">
              <span className="text-slate-600 uppercase tracking-wide font-medium">Secondaires · </span>
              {stretch.secondaryMuscles.slice(0, 3).join(' · ')}
            </div>
          )}
        </div>

        <div className="row-start-6 flex min-h-[2.25rem] items-center border-t border-[#0F4C5C]/35 pt-2">
          {avgNote !== null ? (
            <div className="flex w-full items-center justify-between text-[10px] text-amber-300/90">
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3 h-3 shrink-0" />
                Note : {avgNote}/5
              </span>
            </div>
          ) : (
            <div className="text-[10px] text-transparent select-none">—</div>
          )}
        </div>

        <p className="row-start-7 text-[11px] text-teal-100/75 line-clamp-3 leading-relaxed border-t border-[#0F4C5C]/30 pt-3 min-h-[3.75rem]">
          {stretch.description}
        </p>
      </div>
    </div>
  );
}
