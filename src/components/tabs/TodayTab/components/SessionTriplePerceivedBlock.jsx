import React, { useMemo } from 'react';
import SessionEffortBlock from './SessionEffortBlock';
import {
  SESSION_PERCEIVED_HINTS,
  SESSION_PERCEIVED_WEIGHTS,
  computeOverallSessionStars,
  emptySessionPerceivedDraft
} from '../../../../utils/exerciseSessionPerceivedModel';

const ROWS = [
  { key: 'difficulty', label: 'Difficulté', hint: SESSION_PERCEIVED_HINTS.difficulty },
  { key: 'feeling', label: 'Ressenti', hint: SESSION_PERCEIVED_HINTS.feeling },
  { key: 'pleasure', label: 'Plaisir', hint: SESSION_PERCEIVED_HINTS.pleasure }
];

/**
 * Trois curseurs (difficulté, ressenti, plaisir) + note globale pondérée.
 */
export default function SessionTriplePerceivedBlock({
  persistedDraft,
  suggestedStars = 3,
  disabled = false,
  onChange,
  idPrefix = 'perceived'
}) {
  const draft = useMemo(() => {
    const base = emptySessionPerceivedDraft();
    return { ...base, ...(persistedDraft || {}) };
  }, [persistedDraft]);

  const overall = useMemo(() => computeOverallSessionStars(draft), [draft]);

  const fallback = useMemo(() => {
    const s = Number(suggestedStars);
    return Number.isFinite(s) && s >= 1 && s <= 5 ? Math.round(s) : 3;
  }, [suggestedStars]);

  const patch = (key, value) => {
    const next = { ...draft, [key]: value };
    const overallNext = computeOverallSessionStars(next);
    onChange?.(next, overallNext);
  };

  const weightPct = (k) => Math.round(SESSION_PERCEIVED_WEIGHTS[k] * 100);

  return (
    <div className="space-y-3 w-full max-w-md">
      {ROWS.map((row) => (
        <div key={row.key} className="rounded-lg border border-slate-600/40 bg-slate-800/40 px-2.5 py-2">
          <p className="text-[11px] font-medium text-amber-100/95 mb-0.5">
            {row.label}
            <span className="ml-1.5 text-[10px] font-normal text-slate-500">
              ({weightPct(row.key)} % de la note globale)
            </span>
          </p>
          <SessionEffortBlock
            idPrefix={`${idPrefix}-${row.key}`}
            persistedValue={draft[row.key] > 0 ? draft[row.key] : null}
            suggestedStars={fallback}
            disabled={disabled}
            onChange={(n) => patch(row.key, n)}
          />
          <p className="text-[10px] text-slate-500 leading-snug mt-1">{row.hint}</p>
        </div>
      ))}

      <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/25 px-3 py-2">
        <p className="text-[11px] font-semibold text-emerald-200/95">
          Note globale de la séance
          {overall != null ? (
            <span className="ml-2 tabular-nums text-emerald-100">{overall} / 5</span>
          ) : (
            <span className="ml-2 text-slate-500 font-normal">— renseigne au moins un critère</span>
          )}
        </p>
        <p className="text-[10px] text-emerald-100/70 mt-1 leading-snug">
          Moyenne pondérée : difficulté {weightPct('difficulty')} %, ressenti {weightPct('feeling')} %, plaisir{' '}
          {weightPct('pleasure')} %. Cette note alimente l’historique et l’analyse de charge de l’exercice.
        </p>
      </div>
    </div>
  );
}
