/**
 * Liste « exercices les moins cochés » avec circuits repliables.
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Layers } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';

function barAccent(pct) {
  if (pct >= 70) return 'var(--d)';
  if (pct >= 40) return 'var(--a3)';
  return 'var(--a4)';
}

function RowBar({ label, pct, display, isCircuit, expanded, onToggle, hasChildren }) {
  const accent = barAccent(pct);
  return (
    <div className="rb-least-row">
      <div className="rb-bar-top">
        <span className="rb-least-lab">
          {hasChildren ? (
            <button
              type="button"
              onClick={onToggle}
              className="rb-least-tog"
              aria-expanded={expanded}
            >
              {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
          ) : null}
          {isCircuit ? <Layers size={11} className="rb-least-ico" aria-hidden /> : null}
          <span>{label}</span>
        </span>
        <b>{display}</b>
      </div>
      <div className="gz" style={{ '--a': accent }}>
        <i style={{ '--w': `${Math.min(100, Math.max(0, pct))}%`, '--c': accent }} />
      </div>
    </div>
  );
}

export default function RecapLeastCheckedList({ items, layout = 'stack' }) {
  const t = useTranslation();
  const [openKeys, setOpenKeys] = useState(() => new Set());

  if (!items?.length) return null;
  const grid = layout === 'grid';

  const toggle = (key) => {
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <ul className={`rb-bars rb-least${grid ? ' rb-least-grid' : ''}`}>
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
              <ul className="rb-least-kids">
                {ex.children.map((session) => (
                  <li key={`${session.id}-${session.date}`}>
                    <div className="rb-least-day">
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
                      <div key={child.id} className="rb-least-ex">
                        {child.checked ? '✓' : '○'} {child.name}
                      </div>
                    ))}
                    {session.name && !session.exercises && (
                      <div className="rb-least-ex">
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
