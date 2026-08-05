import React from 'react';
import {
  PRESCRIPTION_REP_OPTIONS,
  PRESCRIPTION_REP_RANGE_PRESETS,
  PRESCRIPTION_SET_OPTIONS,
  PRESCRIPTION_TIME_OPTIONS,
  seriesToEditorPrescription,
  applyEditorPrescriptionToExercise
} from '../../utils/prescriptionPickerUtils';

const REPS_SCOPES = {
  TOTAL: 'total',
  PER_HAND: 'per_hand',
  PER_SIDE: 'per_side'
};

const selectClass =
  'mt-1 w-full rounded border border-[#0F4C5C]/50 bg-black px-3 py-2 text-sm text-white';

/**
 * Saisie structurée séries × reps (listes) — remplace le champ texte libre.
 */
export default function ProgramPrescriptionPickers({ exercise, onExerciseChange }) {
  const p = seriesToEditorPrescription(exercise);

  const apply = (patch) => {
    onExerciseChange(applyEditorPrescriptionToExercise(exercise, patch));
  };

  return (
    <div className="rounded-lg border border-[#0F4C5C]/40 bg-[#0F4C5C]/10 p-3 space-y-3">
      <div className="text-xs font-semibold text-teal-200/90">Séries & reps</div>
      <p className="text-[11px] text-slate-500 leading-snug">
        Format uniforme : {exercise?.series || '—'}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs text-slate-400">
          Type
          <select
            value={p.volumeMode}
            onChange={(e) => {
              const mode = e.target.value;
              if (mode === 'seconds') {
                apply({ volumeMode: 'seconds', setCount: 3, repsMin: 30, repsMax: 30, useRange: false });
              } else if (mode === 'minutes') {
                apply({ volumeMode: 'minutes', setCount: 1, repsMin: 1, repsMax: 1, useRange: false });
              } else {
                apply({ volumeMode: 'reps', setCount: 3, repsMin: 10, repsMax: 10, useRange: false });
              }
            }}
            className={selectClass}
          >
            <option value="reps">Répétitions</option>
            <option value="seconds">Secondes</option>
            <option value="minutes">Minutes</option>
          </select>
        </label>

        <label className="block text-xs text-slate-400">
          Séries
          <select
            value={p.setCount}
            onChange={(e) => apply({ setCount: parseInt(e.target.value, 10) })}
            className={selectClass}
          >
            {PRESCRIPTION_SET_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>

      {p.volumeMode === 'reps' ? (
        <>
          <label className="block text-xs text-slate-400">
            Portée des reps
            <select
              value={p.repsScope}
              onChange={(e) => apply({ repsScope: e.target.value })}
              className={selectClass}
            >
              <option value={REPS_SCOPES.TOTAL}>Total (les deux côtés)</option>
              <option value={REPS_SCOPES.PER_HAND}>Par main / bras</option>
              <option value={REPS_SCOPES.PER_SIDE}>Par côté</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={p.useRange}
              onChange={(e) => {
                const useRange = e.target.checked;
                apply(
                  useRange
                    ? { useRange: true, repsMin: 8, repsMax: 12 }
                    : { useRange: false, repsMax: p.repsMin }
                );
              }}
              className="rounded border-[#0F4C5C]/50"
            />
            Plage de répétitions (ex. 10-12)
          </label>

          {p.useRange ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-xs text-slate-400">
                Reps min
                <select
                  value={p.repsMin}
                  onChange={(e) => {
                    const repsMin = parseInt(e.target.value, 10);
                    apply({ repsMin, repsMax: Math.max(repsMin, p.repsMax) });
                  }}
                  className={selectClass}
                >
                  {PRESCRIPTION_REP_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs text-slate-400">
                Reps max
                <select
                  value={p.repsMax}
                  onChange={(e) => {
                    const repsMax = parseInt(e.target.value, 10);
                    apply({ repsMax, repsMin: Math.min(p.repsMin, repsMax) });
                  }}
                  className={selectClass}
                >
                  {PRESCRIPTION_REP_OPTIONS.filter((n) => n >= p.repsMin).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <label className="block text-xs text-slate-400">
              Répétitions
              <select
                value={p.repsMin}
                onChange={(e) => {
                  const n = parseInt(e.target.value, 10);
                  apply({ repsMin: n, repsMax: n, useRange: false });
                }}
                className={selectClass}
              >
                {PRESCRIPTION_REP_OPTIONS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-slate-500 w-full">Plages fréquentes :</span>
            {PRESCRIPTION_REP_RANGE_PRESETS.map((preset) => (
              <button
                key={`${preset.min}-${preset.max}`}
                type="button"
                onClick={() =>
                  apply({
                    useRange: true,
                    repsMin: preset.min,
                    repsMax: preset.max
                  })
                }
                className="rounded border border-[#0F4C5C]/45 px-2 py-0.5 text-[10px] text-teal-200 hover:bg-[#0F4C5C]/25"
              >
                {preset.min}-{preset.max}
              </button>
            ))}
          </div>
        </>
      ) : (
        <label className="block text-xs text-slate-400">
          Durée {p.volumeMode === 'minutes' ? '(minutes)' : '(secondes)'}
          <select
            value={p.repsMin}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              apply({ repsMin: n, repsMax: n, useRange: false });
            }}
            className={selectClass}
          >
            {(p.volumeMode === 'minutes'
              ? [1, 2, 3, 5, 10, 15, 20, 30, 45, 60, 90]
              : PRESCRIPTION_TIME_OPTIONS
            ).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
