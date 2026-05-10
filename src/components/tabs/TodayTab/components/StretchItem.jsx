/**
 * 🧘 COMPOSANT STRETCH ITEM
 *
 * Carte d'UN étirement individuel : nom (banque), badges zone & catégorie,
 * durée, instructions courtes (collapse/expand), checkbox de complétion.
 *
 * Reçoit un item NORMALISÉ par `normalizeStretchSlots` (cf. `utils/stretchUtils.js`).
 *
 * @module StretchItem
 */

import React, { memo, useCallback, useState } from 'react';
import { ChevronDown, ChevronUp, Clock, Target } from 'lucide-react';
import { Checkbox } from '../../../ui/Input';
import { useStretchTracking } from '../hooks/useStretchTracking';
import SessionEffortBlock from './SessionEffortBlock';

/**
 * Formate une durée en secondes vers "Xs" / "Xmin" / "Xmin Ys".
 */
function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '';
  if (seconds < 60) return `${seconds}s`;
  const min = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return rem === 0 ? `${min} min` : `${min} min ${rem}s`;
}

/**
 * @param {Object} props
 * @param {Object} props.item - Item normalisé { id, moment, stretchKey, name, duration, instructions, bodyZone, primaryMuscles, fromBank }
 * @param {Date} props.date
 * @param {boolean} [props.defaultExpanded=false] - Affiche les instructions en clair par défaut
 */
const StretchItem = memo(({ item, date, defaultExpanded = false }) => {
  const { toggleStretch, getStretchStatus, updateStretchSessionEffortStars } = useStretchTracking({ date });
  const { isChecked, sessionEffortStars } = getStretchStatus(item.moment, item.id);
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    toggleStretch(item.moment, item.id);
  }, [item.moment, item.id, toggleStretch]);

  const toggleExpand = useCallback(() => setExpanded((v) => !v), []);

  const hasInstructions = Boolean(item.instructions && item.instructions.trim());
  const durationLabel = formatDuration(item.duration);

  return (
    <div
      className={[
        'border-l-4 pl-4 pr-3 py-3 rounded-r-lg transition-colors',
        isChecked
          ? 'border-emerald-400/80 bg-emerald-950/30 ring-1 ring-emerald-500/30'
          : 'border-teal-500/60 bg-slate-900/50 ring-1 ring-slate-700/40 hover:bg-slate-900/70'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 mb-1">
            <h4 className={[
              'text-sm font-semibold leading-snug',
              isChecked ? 'text-emerald-200 line-through decoration-emerald-500/70' : 'text-white'
            ].join(' ')}>
              {item.name}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
            {durationLabel && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {durationLabel}
              </span>
            )}
            {item.bodyZone && item.bodyZone !== 'full' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-teal-900/40 text-teal-200 capitalize">
                <Target className="w-3 h-3" aria-hidden="true" />
                {item.bodyZone}
              </span>
            )}
            {item.primaryMuscles?.length > 0 && (
              <span className="truncate text-slate-500" title={item.primaryMuscles.join(', ')}>
                {item.primaryMuscles.slice(0, 2).join(' • ')}
                {item.primaryMuscles.length > 2 ? ` +${item.primaryMuscles.length - 2}` : ''}
              </span>
            )}
          </div>

          {isChecked && (
            <div className="mt-2 pt-2 border-t border-emerald-500/20">
              <p className="text-[11px] font-medium text-amber-200/90 mb-1.5">Ressenti aujourd’hui</p>
              <SessionEffortBlock
                idPrefix={`stretch-${item.moment}-${item.id}`}
                persistedValue={sessionEffortStars}
                suggestedStars={3}
                onChange={(n) => updateStretchSessionEffortStars(item.moment, item.id, n)}
              />
            </div>
          )}
          {hasInstructions && (
            <>
              {expanded ? (
                <p className="mt-2 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {item.instructions}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="mt-1 text-[11px] text-teal-300 hover:text-teal-200 inline-flex items-center gap-1"
                >
                  <ChevronDown className="w-3 h-3" />
                  Voir les instructions
                </button>
              )}
              {expanded && (
                <button
                  type="button"
                  onClick={toggleExpand}
                  className="mt-1 text-[11px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1"
                >
                  <ChevronUp className="w-3 h-3" />
                  Réduire
                </button>
              )}
            </>
          )}
        </div>

        <label
          className="shrink-0 inline-flex items-center"
          aria-label={`Marquer "${item.name}" comme effectué`}
        >
          <Checkbox
            checked={isChecked}
            onChange={handleToggle}
            className="w-5 h-5"
            name={`stretch_${item.moment}_${item.id}`}
          />
        </label>
      </div>
    </div>
  );
});

StretchItem.displayName = 'StretchItem';

export default StretchItem;
