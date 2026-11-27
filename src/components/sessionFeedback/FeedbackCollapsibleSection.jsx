import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function FeedbackCollapsibleSection({
  id,
  title,
  open,
  onToggle,
  children,
  badge = null
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-[#0F4C5C]/45 bg-black/40">
      <button
        type="button"
        id={`${id}-header`}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#0F4C5C]/15"
      >
        <span className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">{title}</span>
          {badge != null && (
            <span className="rounded-md bg-teal-500/15 px-1.5 py-0.5 text-[10px] font-medium text-teal-300">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div id={`${id}-panel`} role="region" aria-labelledby={`${id}-header`} className="space-y-4 border-t border-[#0F4C5C]/35 px-4 py-4">
          {children}
        </div>
      )}
    </section>
  );
}
