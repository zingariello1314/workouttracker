import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  parsePositiveInt,
  resolvePushupSessionTotalReps
} from '../../../../services/endurance/pushupSessionUtils';

/**
 * Séries × reps + total (auto-calculé, modifiable).
 */
export default function PushupSessionSetsFields({ formState, setFormState, plannedHint }) {
  const total = useMemo(() => resolvePushupSessionTotalReps(formState), [formState]);

  const patch = (key, value) => {
    setFormState((prev) => {
      const next = { ...prev, [key]: value };
      const sets = parsePositiveInt(next.setCount);
      const per = parsePositiveInt(next.repsPerSet);
      if (sets > 0 && per > 0) {
        next.count = String(sets * per);
      }
      return next;
    });
  };

  return (
    <div className="rounded-xl border border-violet-500/25 bg-slate-900/40 p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-violet-100">Séries × reps</span>
        {plannedHint ? (
          <span className="text-[11px] text-slate-400">Prévu défi : {plannedHint}</span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Séries</label>
          <input
            type="number"
            min={1}
            value={formState.setCount ?? ''}
            onChange={(e) => patch('setCount', e.target.value)}
            className="w-full px-3 py-2 bg-black border border-slate-600/50 rounded-lg text-white text-sm"
            placeholder="Ex: 20"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Reps / série</label>
          <input
            type="number"
            min={1}
            value={formState.repsPerSet ?? ''}
            onChange={(e) => patch('repsPerSet', e.target.value)}
            className="w-full px-3 py-2 bg-black border border-slate-600/50 rounded-lg text-white text-sm"
            placeholder="Ex: 5"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Total reps</label>
          <input
            type="number"
            min={1}
            value={formState.count ?? ''}
            onChange={(e) => patch('count', e.target.value)}
            className="w-full px-3 py-2 bg-black border border-slate-600/50 rounded-lg text-white text-sm"
            placeholder={total > 0 ? String(total) : 'Ex: 100'}
          />
        </div>
      </div>
      <p className="text-[10px] text-slate-500 leading-relaxed">
        Renseigne séries et reps (ex. 10×10) ou le total seul. Le total alimente le calendrier, Aujourd’hui et le
        Récap.
      </p>
    </div>
  );
}

PushupSessionSetsFields.propTypes = {
  formState: PropTypes.object.isRequired,
  setFormState: PropTypes.func.isRequired,
  plannedHint: PropTypes.string
};
