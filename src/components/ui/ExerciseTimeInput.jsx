import React, { useEffect, useState } from 'react';
import {
  clampInt,
  combineMinutesParts,
  combineSecondsParts,
  splitStoredMinutes,
  splitStoredSeconds
} from '../../utils/sport/exerciseTimeValueUtils';

const fieldClass =
  'w-14 px-2 py-1.5 bg-black/80 border border-[#0F4C5C]/50 rounded-lg text-white text-center tabular-nums text-sm focus:outline-none focus:border-cyan-500/70';

/**
 * Saisie temps double champ pour Aujourd'hui / calendrier.
 * @param {'min'|'sec'} unit — min → min+sec ; sec → sec+centièmes
 */
export default function ExerciseTimeInput({
  unit = 'sec',
  value,
  onChange,
  disabled = false,
  compact = true,
  className = ''
}) {
  const split = unit === 'min' ? splitStoredMinutes : splitStoredSeconds;
  const initial = split(value);
  const [primary, setPrimary] = useState(String(initial.primary || ''));
  const [secondary, setSecondary] = useState(
    initial.secondary > 0 ? String(initial.secondary) : ''
  );

  useEffect(() => {
    const parts = split(value);
    setPrimary(parts.primary > 0 ? String(parts.primary) : '');
    setSecondary(parts.secondary > 0 ? String(parts.secondary) : '');
  }, [value, unit]);

  const emit = (p, s) => {
    const combined =
      unit === 'min'
        ? combineMinutesParts(p, s)
        : combineSecondsParts(p, s);
    onChange?.(combined > 0 ? combined : '');
  };

  const onPrimary = (e) => {
    const next = e.target.value.replace(/\D/g, '');
    setPrimary(next);
    emit(next, secondary);
  };

  const onSecondary = (e) => {
    let next = e.target.value.replace(/\D/g, '');
    if (next !== '') {
      const max = unit === 'min' ? 59 : 99;
      const n = parseInt(next, 10);
      if (Number.isFinite(n) && n > max) next = String(max);
    }
    setSecondary(next);
    emit(primary, next);
  };

  const primaryLabel = unit === 'min' ? 'min' : 's';
  const secondaryLabel = unit === 'min' ? 's' : 'cs';

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={primary}
          onChange={onPrimary}
          disabled={disabled}
          placeholder="0"
          className={fieldClass}
          aria-label={primaryLabel}
        />
        <span className="text-[11px] text-teal-600/90">{primaryLabel}</span>
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          value={secondary}
          onChange={onSecondary}
          disabled={disabled}
          placeholder="0"
          className={fieldClass}
          aria-label={secondaryLabel}
        />
        <span className="text-[11px] text-teal-600/90">{secondaryLabel}</span>
      </div>
      {!compact ? (
        <span className="text-[10px] text-slate-500">
          {unit === 'min' ? 'Champ vide = 0' : 'Centièmes optionnels'}
        </span>
      ) : null}
    </div>
  );
}
