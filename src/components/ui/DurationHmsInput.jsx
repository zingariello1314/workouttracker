import React, { useEffect, useState } from 'react';
import {
  formatHmsString,
  hmsStringToTotalSeconds,
  splitHmsString
} from '../../utils/sport/durationInputUtils';

const inputClass =
  'w-full px-3 py-3 bg-slate-900/50 border border-slate-600/50 rounded-xl text-white text-center tabular-nums focus:outline-none focus:border-purple-500 transition-colors';

/**
 * Heures + minutes + secondes — stockage « HH:MM:SS » (course à pied).
 */
export default function DurationHmsInput({
  value,
  onChange,
  hoursLabel = 'Heures',
  minutesLabel = 'Min',
  secondsLabel = 'Sec',
  disabled = false,
  className = ''
}) {
  const initial = splitHmsString(value);
  const [hours, setHours] = useState(String(initial.hours));
  const [minutes, setMinutes] = useState(String(initial.minutes));
  const [seconds, setSeconds] = useState(String(initial.seconds));

  useEffect(() => {
    const parts = splitHmsString(value);
    setHours(String(parts.hours));
    setMinutes(String(parts.minutes));
    setSeconds(String(parts.seconds));
  }, [value]);

  const emitChange = (nextH, nextM, nextS) => {
    const h = Math.max(0, parseInt(nextH, 10) || 0);
    const m = Math.max(0, parseInt(nextM, 10) || 0);
    const sRaw = String(nextS ?? '').replace(/\D/g, '');
    const s = sRaw === '' ? 0 : Math.min(59, Math.max(0, parseInt(sRaw, 10) || 0));
    onChange?.(formatHmsString(h, m, s));
  };

  const handleHours = (e) => {
    const next = e.target.value;
    setHours(next);
    emitChange(next, minutes, seconds);
  };

  const handleMinutes = (e) => {
    const next = e.target.value;
    setMinutes(next);
    emitChange(hours, next, seconds);
  };

  const handleSeconds = (e) => {
    let next = e.target.value.replace(/\D/g, '');
    if (next !== '') {
      const n = parseInt(next, 10);
      if (n > 59) next = '59';
    }
    setSeconds(next);
    emitChange(hours, minutes, next);
  };

  const previewSec = hmsStringToTotalSeconds(value);

  return (
    <div className={className}>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">{hoursLabel}</label>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            value={hours}
            onChange={handleHours}
            disabled={disabled}
            placeholder="0"
            className={inputClass}
            aria-label={hoursLabel}
          />
        </div>
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
      </p>
    </div>
  );
}
