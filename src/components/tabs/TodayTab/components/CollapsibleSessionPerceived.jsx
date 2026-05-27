import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import SessionTriplePerceivedBlock from './SessionTriplePerceivedBlock';

/**
 * Bloc ressenti (étoiles) repliable sous un exercice coché.
 */
export default function CollapsibleSessionPerceived({
  label = 'Ressenti de la séance',
  expanded,
  onToggle,
  ...blockProps
}) {
  return (
    <div className="w-full pt-3 mt-1 border-t border-[#0F4C5C]/45">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 text-left rounded-md py-1 -mx-1 px-1 hover:bg-slate-800/40 transition-colors"
        aria-expanded={expanded}
      >
        <span className="text-[11px] font-medium text-amber-200/90">{label}</span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-amber-300/80" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-amber-300/80" aria-hidden />
        )}
      </button>
      {expanded ? (
        <div className="mt-1.5">
          <SessionTriplePerceivedBlock {...blockProps} />
        </div>
      ) : null}
    </div>
  );
}
