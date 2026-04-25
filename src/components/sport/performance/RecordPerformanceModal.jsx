import React, { useMemo, useState } from 'react';
import { exerciseDatabase } from '../../../data/exerciseDatabase';
import { inferTrainingDiscipline } from '../../../utils/programUtils';

const makeDbExerciseId = (key) =>
  `db_${String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()}`;

const inferDefaultType = (discipline) => {
  if (discipline === 'muscu') return 'weight_reps';
  if (discipline === 'endurance' || discipline === 'boxe') return 'duration';
  return 'reps';
};

const RecordPerformanceModal = ({
  isOpen,
  onClose,
  onSubmit,
  title = 'Enregistrer un max',
  initialExerciseId = '',
  lockExerciseSelection = false
}) => {
  const [query, setQuery] = useState('');
  const [exerciseId, setExerciseId] = useState('');
  const [performanceType, setPerformanceType] = useState('reps');
  const [reps, setReps] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [durationSec, setDurationSec] = useState('');
  const [notes, setNotes] = useState('');
  const [addToTodayReps, setAddToTodayReps] = useState(true);

  const exerciseOptions = useMemo(() => {
    const entries = Object.entries(exerciseDatabase).map(([key, ex]) => {
      const id = makeDbExerciseId(key);
      const name = ex.name || key;
      const trainingDiscipline = inferTrainingDiscipline({
        name,
        category: ex.category,
        equipment: ex.equipment,
        rawEquipment: ex.equipment
      });
      return {
        id,
        key,
        name,
        category: ex.category || '',
        equipment: ex.equipment || '',
        trainingDiscipline
      };
    });
    entries.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return entries;
  }, []);

  const selectedExercise = useMemo(
    () => exerciseOptions.find((ex) => ex.id === exerciseId) || null,
    [exerciseOptions, exerciseId]
  );

  React.useEffect(() => {
    if (!isOpen) return;
    if (!initialExerciseId) return;
    const target = exerciseOptions.find((ex) => ex.id === initialExerciseId);
    if (!target) return;
    setExerciseId(target.id);
    setPerformanceType(inferDefaultType(target.trainingDiscipline));
  }, [isOpen, initialExerciseId, exerciseOptions]);

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exerciseOptions;
    return exerciseOptions.filter((ex) =>
      `${ex.name} ${ex.category} ${ex.equipment}`.toLowerCase().includes(q)
    );
  }, [exerciseOptions, query]);

  const canSubmit = useMemo(() => {
    if (!selectedExercise) return false;
    if (performanceType === 'reps') return Number(reps) > 0;
    if (performanceType === 'weight_reps') return Number(weightKg) > 0 && Number(reps) > 0;
    if (performanceType === 'duration') return Number(durationSec) > 0;
    return false;
  }, [selectedExercise, performanceType, reps, weightKg, durationSec]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-xl border border-[#0F4C5C]/70 bg-[#050A12]">
        <div className="flex items-center justify-between border-b border-[#0F4C5C]/45 p-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#0F4C5C]/55 px-2 py-1 text-xs text-slate-300 hover:text-white"
          >
            Fermer
          </button>
        </div>

        <div className="space-y-4 p-4 overflow-y-auto max-h-[calc(90vh-7rem)]">
          {!lockExerciseSelection && (
            <>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-white"
                placeholder="Rechercher un exercice"
              />

              <div className="max-h-52 overflow-y-auto rounded-lg border border-[#0F4C5C]/40">
                {filteredOptions.slice(0, 120).map((ex) => (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      setExerciseId(ex.id);
                      const nextType = inferDefaultType(ex.trainingDiscipline);
                      setPerformanceType(nextType);
                    }}
                    className={`w-full border-b border-[#0F4C5C]/20 px-3 py-2 text-left ${
                      exerciseId === ex.id ? 'bg-[#0F5C45]/25 text-white' : 'text-slate-300 hover:bg-[#0F4C5C]/12'
                    }`}
                  >
                    <div className="text-sm font-medium">{ex.name}</div>
                    <div className="text-xs text-slate-400">{[ex.category, ex.equipment].filter(Boolean).join(' · ')}</div>
                  </button>
                ))}
              </div>
            </>
          )}

          {selectedExercise && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">
                  Type de performance
                  <select
                    value={performanceType}
                    onChange={(e) => setPerformanceType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                  >
                    <option value="reps">Max reps</option>
                    <option value="weight_reps">Poids + reps</option>
                    <option value="duration">Durée (sec)</option>
                  </select>
                </label>
                <label className="text-xs text-slate-400">
                  Discipline détectée
                  <input
                    value={selectedExercise.trainingDiscipline}
                    readOnly
                    className="mt-1 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                  />
                </label>
              </div>

              {(performanceType === 'reps' || performanceType === 'weight_reps') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">
                    Répétitions
                    <input
                      type="number"
                      min="1"
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                    />
                  </label>
                  {performanceType === 'weight_reps' && (
                    <label className="text-xs text-slate-400">
                      Poids (kg)
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={weightKg}
                        onChange={(e) => setWeightKg(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                      />
                    </label>
                  )}
                </div>
              )}

              {performanceType === 'duration' && (
                <label className="text-xs text-slate-400 block">
                  Durée (secondes)
                  <input
                    type="number"
                    min="1"
                    value={durationSec}
                    onChange={(e) => setDurationSec(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                  />
                </label>
              )}

              <label className="text-xs text-slate-400 block">
                Notes (optionnel)
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                />
              </label>

              <label className="flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={addToTodayReps}
                  onChange={(e) => setAddToTodayReps(e.target.checked)}
                />
                Ajouter ces reps au total du jour
              </label>
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#0F4C5C]/45 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-slate-300 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              onSubmit({
                exerciseId: selectedExercise.id,
                exerciseName: selectedExercise.name,
                trainingDiscipline: selectedExercise.trainingDiscipline,
                performanceType,
                reps: performanceType === 'duration' ? null : Number(reps || 0),
                weightKg: performanceType === 'weight_reps' ? Number(weightKg || 0) : null,
                durationSec: performanceType === 'duration' ? Number(durationSec || 0) : null,
                notes: notes || '',
                addToTodayReps
              });
            }}
            className="rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordPerformanceModal;
