import React from 'react';
import { READING_SESSION_CRITERIA, getCriterionScaleLabel } from '../../utils/bookReadingRatings';

/**
 * Cinq critères 1–10 avec libellé dynamique pour la valeur choisie.
 */
export default function ReadingSessionCriteriaSliders({ criteriaRatings = {}, onChange }) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-3">
      <p className="text-xs font-semibold text-slate-200">
        Retour sur cette session (1 = faible, 10 = fort) — la note de session est la moyenne des cinq critères.
      </p>
      {READING_SESSION_CRITERIA.map(({ key, label, intro }) => {
        const v = Number(criteriaRatings[key]) || 5;
        const scaleText = getCriterionScaleLabel(key, v);
        return (
          <div key={key} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-slate-100">{label}</span>
              <span className="text-xs font-mono text-amber-200/90">{v}/10</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">{intro}</p>
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={v}
              onChange={(e) => onChange?.(key, Number(e.target.value))}
              className="w-full accent-amber-400 h-2"
            />
            <p className="text-[11px] text-slate-400 leading-snug border-l-2 border-amber-500/40 pl-2">
              {scaleText}
            </p>
          </div>
        );
      })}
    </div>
  );
}
