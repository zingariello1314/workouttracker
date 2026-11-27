import React from 'react';
import { ANSWER_STATES, getQuestion } from '../../utils/sessionFeedbackCatalog';

/**
 * Choix segmentés / boutons pour enums catalogue.
 */
export default function FeedbackSegmentControl({
  questionId,
  cell,
  onChange,
  onClear,
  optionsOverride = null,
  promptOverride = null,
  className = '',
  compact = false
}) {
  const question = getQuestion(questionId);
  if (!question) return null;

  const options = Array.isArray(optionsOverride)
    ? optionsOverride
    : question.value?.options || [];
  const prompt = promptOverride || question.promptFr;

  const selected =
    cell?.state === ANSWER_STATES.ANSWERED ? cell.value : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white leading-snug">{prompt}</p>
        {selected !== undefined && (
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
        className={
          compact
            ? 'flex flex-wrap gap-1.5'
            : 'grid grid-cols-1 gap-1.5 sm:grid-cols-2'
        }
        role="group"
        aria-label={question.promptFr}
      >
        {options.map((opt) => {
          const active = selected === opt.value;
          return (
            <button
              key={String(opt.value)}
              type="button"
              aria-pressed={active}
              onClick={() =>
                onChange({ state: ANSWER_STATES.ANSWERED, value: opt.value })
              }
              className={[
                'rounded-lg border px-3 py-2.5 text-left text-sm transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70',
                active
                  ? 'border-teal-400 bg-teal-500/15 text-teal-50'
                  : 'border-[#0F4C5C]/50 bg-black/35 text-slate-300 hover:border-teal-500/35 hover:bg-[#0F4C5C]/20'
              ].join(' ')}
            >
              {opt.labelFr || String(opt.value)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
