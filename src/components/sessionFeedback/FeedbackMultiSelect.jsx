import React from 'react';
import { ANSWER_STATES, getQuestion } from '../../utils/sessionFeedbackCatalog';

export default function FeedbackMultiSelect({ questionId, cell, onChange, onClear, className = '' }) {
  const question = getQuestion(questionId);
  if (!question || question.type !== 'multi_enum') return null;

  const options = question.value?.options || [];
  const selected =
    cell?.state === ANSWER_STATES.ANSWERED && Array.isArray(cell.value) ? cell.value : [];

  const toggle = (value) => {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    if (!next.length) {
      onChange({ state: ANSWER_STATES.NOT_ANSWERED, value: null });
      return;
    }
    onChange({ state: ANSWER_STATES.ANSWERED, value: next });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-white leading-snug">{question.promptFr}</p>
        {selected.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={question.promptFr}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => toggle(opt.value)}
              className={[
                'rounded-full border px-3 py-1.5 text-xs transition-all',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70',
                active
                  ? 'border-teal-400 bg-teal-500/20 text-teal-100'
                  : 'border-[#0F4C5C]/50 bg-black/30 text-slate-400 hover:border-teal-500/30 hover:text-slate-200'
              ].join(' ')}
            >
              {opt.labelFr}
            </button>
          );
        })}
      </div>
    </div>
  );
}
