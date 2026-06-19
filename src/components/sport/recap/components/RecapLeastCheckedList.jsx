/**
 * Liste « exercices les moins cochés » avec circuits repliables.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';

function barColor(pct) {
  if (pct >= 70) return '#34d399';
  if (pct >= 40) return '#fbbf24';
  return '#fb7185';
}

function RowBar({ label, pct, display, isCircuit, expanded, onToggle, hasChildren }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px]">
        <span className="flex min-w-0 items-center gap-1 truncate text-slate-400">
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggle}
              className="shrink-0 rounded p-0.5 text-teal-300/80 hover:bg-teal-950/40"
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : null}
          {isCircuit ? <Layers size={11} className="shrink-0 text-sky-400/80" /> : null}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 tabular-nums font-medium text-slate-200">{display}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/80 ring-1 ring-[#0F4C5C]/35">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${Math.min(100, Math.max(0, pct))}%`,
            backgroundColor: barColor(pct),
            boxShadow: `0 0 8px ${barColor(pct)}66`
          }}
        />
      </div>
    </div>
  );
}

export default function RecapLeastCheckedList({ items }) {
  const t = useTranslation();
  const [openKeys, setOpenKeys] = useState(() => new Set());

  if (!items?.length) return null;

  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ul className="space-y-2">
      {items.map((ex) => {
        const key = String(ex.id);
        const isCircuit = ex.kind === 'circuit';
        const hasChildren = isCircuit && (ex.children?.length ?? 0) > 0;
        const expanded = openKeys.has(key);
        const display = t('recap.enrichment.leastCheckedRow', {
          checked: ex.checked,
          planned: ex.planned,
          pct: ex.pct
        });

        return (
          <li key={key}>
            <RowBar
              label={ex.name}
              pct={ex.pct}
              display={display}
              isCircuit={isCircuit}
              expanded={expanded}
              onToggle={() => toggle(key)}
              hasChildren={hasChildren}
            />
            {hasChildren && expanded && (
              <ul className="mt-2 space-y-1.5 border-l border-teal-900/40 pl-3 text-[10px] text-slate-500">
                {ex.children.map((session) => (
                  <li key={`${session.id}-${session.date}`}>
                    <div className="font-medium text-slate-400">
                      {new Date(`${session.date}T12:00:00`).toLocaleDateString('fr-FR', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                      {session.rounds != null
                        ? ` · ${session.rounds}/${session.target} tours`
                        : ''}
                      {session.checked ? ' ✓' : ''}
                    </div>
                    {session.exercises?.map((child) => (
                      <div key={child.id} className="pl-2">
                        {child.checked ? '✓' : '○'} {child.name}
                      </div>
                    ))}
                    {session.name && !session.exercises && (
                      <div className="pl-2">
                        {session.checked ? '✓' : '○'} {session.name}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
