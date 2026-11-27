import React, { useMemo } from 'react';
import { ANSWER_STATES, getQuestion } from '../../utils/sessionFeedbackCatalog';

/**
 * Échelle numérique ancrée (souris / clavier / tactile).
 * Pas de présélection : valeur nulle = non répondu.
 */
export default function FeedbackScaleControl({
  questionId,
  cell,
  onChange,
  onClear,
  className = ''
}) {
  const question = getQuestion(questionId);
  const min = question?.value?.min ?? 1;
  const max = question?.value?.max ?? 10;

  const values = useMemo(() => {
    const out = [];
    for (let n = min; n <= max; n += 1) out.push(n);
    return out;
  }, [min, max]);

  const selected =
    cell?.state === ANSWER_STATES.ANSWERED && Number.isFinite(Number(cell.value))
      ? Number(cell.value)
      : null;

  const anchorLabel = useMemo(() => {
    if (!question || selected == null || !Array.isArray(question.anchors)) return null;
    const hit = question.anchors.find((a) => selected >= a.min && selected <= a.max);
    return hit?.labelFr || null;
  }, [question, selected]);

  if (!question || question.type !== 'scale') return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white leading-snug">{question.promptFr}</p>
          {selected != null && (
            <p className="mt-1 text-xs text-teal-300/90 tabular-nums">
              {selected}
              <span className="text-slate-500">/{max}</span>
              {anchorLabel ? <span className="ml-2 text-slate-400">{anchorLabel}</span> : null}
            </p>
          )}
          {selected == null && (
            <p className="mt-1 text-xs text-slate-500">Non renseigné</p>
          )}
        </div>
        {selected != null && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        role="group"
        aria-label={question.promptFr}
      >
        {values.map((n) => {
          const active = selected === n;
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange({ state: ANSWER_STATES.ANSWERED, value: n })
              }
              className={[
                'min-h-10 min-w-10 rounded-lg border text-sm font-semibold tabular-nums transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70',
                active
                  ? 'border-teal-400 bg-teal-500/20 text-teal-100 shadow-[0_0_0_1px_rgba(45,212,191,0.25)]'
                  : 'border-[#0F4C5C]/55 bg-black/40 text-slate-300 hover:border-teal-500/40 hover:bg-[#0F4C5C]/25'
              ].join(' ')}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
