import React, { forwardRef } from 'react';

/**
 * Composant de saisie de plage de dates.
 * Actuellement basé sur deux champs <input type="date"> pour limiter le bundle.
 * Peut évoluer vers un véritable calendrier sans toucher ForceRangeDialog.
 */
const ForceRangeCalendar = forwardRef(function ForceRangeCalendar(
  {
    start,
    end,
    min,
    max,
    onChangeStart,
    onChangeEnd
  },
  startInputRef
) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="force-start-date">Date de début</label>
        <input
          id="force-start-date"
          type="date"
          ref={startInputRef}
          value={start}
          min={min}
          max={max}
          onChange={(event) => onChangeStart?.(event.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
        />
      </div>
      <div>
        <label className="block text-sm text-slate-300 mb-1" htmlFor="force-end-date">Date de fin</label>
        <input
          id="force-end-date"
          type="date"
          value={end}
          min={min}
          max={max}
          onChange={(event) => onChangeEnd?.(event.target.value)}
          className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-white"
        />
      </div>
    </div>
  );
});

export default ForceRangeCalendar;







