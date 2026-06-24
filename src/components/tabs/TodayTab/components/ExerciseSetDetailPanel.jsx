import React, { useCallback, useMemo, useState } from 'react';
import { Input } from '../../../ui/Input';
import { inferDefaultSetCount } from '../../../../utils/exerciseLoadVolume';
import {
  applyExerciseSetLog,
  getOrBuildExerciseSetLog
} from '../../../../utils/exerciseSetLogUtils';

/**
 * Saisie détaillée reps + charge par série (écrit exerciseSetLogs).
 */
export default function ExerciseSetDetailPanel({
  storageKey,
  exercise,
  getWorkoutData,
  onApply,
  perArm = false,
  onPerArmChange,
  isChecked,
  t
}) {
  const tr = t || ((k, d) => d);
  const [open, setOpen] = useState(false);

  const setCount = useMemo(() => Math.max(1, inferDefaultSetCount(exercise, 0)), [exercise]);

  const initialSets = useMemo(() => {
    if (!open || !storageKey) return [];
    const data = typeof getWorkoutData === 'function' ? getWorkoutData() : {};
    const log = getOrBuildExerciseSetLog(data, storageKey, exercise);
    const sets = log.sets || [];
    while (sets.length < setCount) {
      sets.push({ reps: 0, weight: sets[0]?.weight ?? null, weightMode: perArm ? 'perHand' : 'total' });
    }
    return sets.slice(0, setCount);
  }, [open, storageKey, exercise, getWorkoutData, setCount, perArm]);

  const [draftSets, setDraftSets] = useState(initialSets);

  const openPanel = useCallback(() => {
    const data = typeof getWorkoutData === 'function' ? getWorkoutData() : {};
    const log = getOrBuildExerciseSetLog(data, storageKey, exercise);
    let sets = [...(log.sets || [])];
    while (sets.length < setCount) {
      sets.push({ reps: 0, weight: sets[0]?.weight ?? null, weightMode: perArm ? 'perHand' : 'total' });
    }
    sets = sets.slice(0, setCount);
    setDraftSets(sets);
    setOpen(true);
  }, [getWorkoutData, storageKey, exercise, setCount, perArm]);

  const persist = useCallback(
    (sets) => {
      const data = typeof getWorkoutData === 'function' ? getWorkoutData() : {};
      const next = applyExerciseSetLog(data, storageKey, sets, { perArm });
      onApply?.(next);
    },
    [getWorkoutData, storageKey, perArm, onApply]
  );

  const updateSet = useCallback(
    (idx, field, raw) => {
      setDraftSets((prev) => {
        const next = prev.map((s, i) => {
          if (i !== idx) return s;
          if (field === 'reps') {
            const n = Math.max(0, Math.floor(Number(raw) || 0));
            return { ...s, reps: n };
          }
          if (field === 'weight') {
            const trimmed = String(raw).trim().replace(',', '.');
            const w = trimmed === '' ? null : parseFloat(trimmed);
            return { ...s, weight: Number.isFinite(w) && w > 0 ? w : null };
          }
          return s;
        });
        persist(next);
        return next;
      });
    },
    [persist]
  );

  if (!isChecked || !storageKey) return null;

  return (
    <div className="w-full min-w-0">
      {!open ? (
        <button
          type="button"
          onClick={openPanel}
          className="text-left text-xs text-teal-500 hover:text-teal-300 underline w-fit"
        >
          {tr('today.exercises.setDetailOpen', 'Détail par série (reps + charge)')}
        </button>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-[#0F4C5C]/40 bg-black/40 p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-teal-400">
              {tr('today.exercises.setDetailTitle', 'Séries détaillées')}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] text-slate-500 hover:text-slate-300 underline"
            >
              {tr('common.close', 'Fermer')}
            </button>
          </div>
          {draftSets.map((set, idx) => (
            <div key={`set-${idx}`} className="flex flex-wrap items-center gap-2">
              <span className="text-teal-700 text-xs font-medium w-6">S{idx + 1}</span>
              <Input
                type="number"
                min={0}
                value={set.reps > 0 ? String(set.reps) : ''}
                onChange={(e) => updateSet(idx, 'reps', e.target.value)}
                className="w-14 text-center text-sm bg-black border-[#0F4C5C]/50 text-white"
                size="sm"
                placeholder="reps"
              />
              <Input
                type="text"
                inputMode="decimal"
                value={set.weight != null ? String(set.weight).replace('.', ',') : ''}
                onChange={(e) => updateSet(idx, 'weight', e.target.value)}
                className="w-16 text-center text-sm bg-black border-[#0F4C5C]/50 text-white"
                size="sm"
                placeholder="kg"
              />
            </div>
          ))}
          {typeof onPerArmChange === 'function' && (
            <label className="flex items-center gap-2 text-[11px] text-teal-600 cursor-pointer">
              <input
                type="checkbox"
                checked={perArm}
                onChange={(e) => onPerArmChange(e.target.checked)}
              />
              {tr('today.exercises.weightPerArm', 'Poids par haltère')}
            </label>
          )}
        </div>
      )}
    </div>
  );
}
