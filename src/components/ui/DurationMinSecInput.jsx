import React, { useEffect, useState } from 'react';
import {
  parseMinSecPart,
  splitStoredMinutes,
  splitTotalSeconds,
  storedMinutesToTotalSeconds,
  totalSecondsToStoredMinutes
} from '../../utils/sport/durationInputUtils';

const inputClass =
  'w-full px-3 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-center tabular-nums focus:outline-none focus:border-purple-500 transition-colors';

/**
 * Deux champs distincts : minutes + secondes.
 * @param {'seconds'|'minutes'} storageUnit — 'seconds' : value = total sec ; 'minutes' : value = min décimales
 */
export default function DurationMinSecInput({
  value,
  onChange,
  storageUnit = 'seconds',
  minutesLabel = 'Min',
  secondsLabel = 'Sec',
  disabled = false,
  className = ''
}) {
  const toParts = (v) =>
    storageUnit === 'minutes' ? splitStoredMinutes(v) : splitTotalSeconds(v);

  const initial = toParts(value);
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [seconds, setSeconds] = useState(String(initial.seconds));

  useEffect(() => {
    const parts = toParts(value);
    setMinutes(String(parts.minutes));
    setSeconds(String(parts.seconds));
  }, [value, storageUnit]);

  const emitChange = (nextMin, nextSec) => {
    const totalSec = parseMinSecPart(nextMin, nextSec);
    if (storageUnit === 'minutes') {
      onChange?.(totalSecondsToStoredMinutes(totalSec));
    } else {
      onChange?.(totalSec);
    }
  };

  const handleMinutes = (e) => {
    const next = e.target.value;
    setMinutes(next);
    emitChange(next, seconds);
  };

  const handleSeconds = (e) => {
    let next = e.target.value.replace(/\D/g, '');
    if (next !== '') {
      const n = parseInt(next, 10);
      if (n > 59) next = '59';
    }
    setSeconds(next);
    emitChange(minutes, next);
  };

  const previewSec =
    storageUnit === 'minutes'
      ? storedMinutesToTotalSeconds(value)
      : Math.max(0, Math.round(Number(value) || 0));

  return (
    <div className={className}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">{minutesLabel}</label>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={minutes}
            onChange={handleMinutes}
            disabled={disabled}
            placeholder="0"
            className={inputClass}
            aria-label={minutesLabel}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">{secondsLabel}</label>
          <input
            type="number"
            min={0}
            max={59}
            step={1}
            inputMode="numeric"
            value={seconds}
            onChange={handleSeconds}
            disabled={disabled}
            placeholder="0"
            className={inputClass}
            aria-label={secondsLabel}
          />
        </div>
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        Total :{' '}
        <span className="text-slate-300 tabular-nums">
          {previewSec > 0 ? `${previewSec} s` : '0 s'}
        </span>
        {storageUnit === 'minutes' && previewSec > 0 ? (
          <span className="text-slate-500"> ({totalSecondsToStoredMinutes(previewSec)} min enregistrées)</span>
        ) : null}
      </p>
    </div>
  );
}
