/**
 * CircuitEditor — éditeur partagé pour créer / modifier un circuit.
 *
 * Utilisé depuis :
 *   - `ProgramDetailView` (sous chaque jour : "Ajouter un circuit").
 *   - Hub `Défis > Circuits` (création/édition globale + assignation programme/jour).
 *
 * Style aligné sur la charte sport (PushupTrophiesPanel / EnduranceCalendarModernPanel) :
 *   - modale `rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6`
 *   - inputs `rounded-xl border border-[#0F4C5C]/50 bg-black ... focus:ring-[#0F5C45]/40`
 *   - bouton primaire `border-[#0F5C45]/60 bg-[#0F5C45]/20`
 *   - palette teal/emerald/amber alignée
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Save,
  Clock,
  Repeat,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import {
  generateCircuitSlotId,
  normalizeCircuitDefinition
} from '../../utils/circuits/circuitDefinitionUtils';

const PROGRAM_WEEK_DAYS = [
  { id: 'lundi', label: 'Lundi' },
  { id: 'mardi', label: 'Mardi' },
  { id: 'mercredi', label: 'Mercredi' },
  { id: 'jeudi', label: 'Jeudi' },
  { id: 'vendredi', label: 'Vendredi' },
  { id: 'samedi', label: 'Samedi' },
  { id: 'dimanche', label: 'Dimanche' }
];

const buildExerciseIndex = () => {
  const out = [];
  Object.entries(exerciseDatabase).forEach(([key, ex]) => {
    out.push({
      key,
      name: ex.name || key,
      category: ex.category || '',
      primaryMuscles: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [],
      secondaryMuscles: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : [],
      equipment: ex.equipment || '',
      variations: Array.isArray(ex.variations) ? ex.variations : []
    });
  });
  out.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return out;
};

const buildMuscleList = (index) => {
  const set = new Set();
  index.forEach((it) => {
    it.primaryMuscles.forEach((m) => set.add(m));
  });
  return ['', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'))];
};

const matchesQuery = (item, q) => {
  if (!q) return true;
  const haystack = `${item.name} ${item.category} ${item.equipment} ${item.primaryMuscles.join(' ')} ${item.secondaryMuscles.join(' ')} ${item.variations.join(' ')}`.toLowerCase();
  return haystack.includes(q.toLowerCase());
};

const matchesMuscle = (item, muscle) => {
  if (!muscle) return true;
  const m = muscle.toLowerCase();
  return (
    item.primaryMuscles.some((x) => x.toLowerCase() === m)
    || item.secondaryMuscles.some((x) => x.toLowerCase() === m)
  );
};

const inputBase =
  'w-full rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40';
const inputSmall =
  'w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-2.5 py-1.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40';
const labelText = 'mb-1 block text-xs font-medium text-teal-700';

const CircuitEditor = ({
  initialDefinition = null,
  programs = [],
  onSave,
  onCancel,
  onAssignToDay,
  defaultAssignment = null
}) => {
  const exerciseIndex = useMemo(() => buildExerciseIndex(), []);
  const muscleList = useMemo(() => buildMuscleList(exerciseIndex), [exerciseIndex]);

  const [name, setName] = useState(initialDefinition?.name || '');
  const [targetRounds, setTargetRounds] = useState(String(initialDefinition?.targetRounds || 3));
  const [restBetween, setRestBetween] = useState(String(initialDefinition?.restBetweenRoundsSec ?? 60));
  const [notes, setNotes] = useState(initialDefinition?.notes || '');
  const [items, setItems] = useState(
    Array.isArray(initialDefinition?.items)
      ? initialDefinition.items.map((it) => ({ ...it, slotId: it.slotId || generateCircuitSlotId() }))
      : []
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState('');
  const [editingSlotIdx, setEditingSlotIdx] = useState(null);
  const [assignProgramId, setAssignProgramId] = useState(defaultAssignment?.programId || '');
  const [assignDay, setAssignDay] = useState(defaultAssignment?.dayName || '');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialDefinition) {
      setName(initialDefinition.name || '');
      setTargetRounds(String(initialDefinition.targetRounds || 3));
      setRestBetween(String(initialDefinition.restBetweenRoundsSec ?? 60));
      setNotes(initialDefinition.notes || '');
      setItems(
        Array.isArray(initialDefinition.items)
          ? initialDefinition.items.map((it) => ({ ...it, slotId: it.slotId || generateCircuitSlotId() }))
          : []
      );
    }
  }, [initialDefinition?.id]);

  const filteredPicker = useMemo(() => {
    return exerciseIndex
      .filter((it) => matchesMuscle(it, pickerMuscle))
      .filter((it) => matchesQuery(it, pickerQuery))
      .slice(0, 80);
  }, [exerciseIndex, pickerMuscle, pickerQuery]);

  const muscleSummary = useMemo(() => {
    const set = new Set();
    items.forEach((it) => {
      const found = exerciseDatabase[it.exerciseKey];
      (found?.primaryMuscles || []).forEach((m) => set.add(m));
    });
    return Array.from(set);
  }, [items]);

  const addItem = (exercise) => {
    const slot = {
      slotId: generateCircuitSlotId(),
      exerciseKey: exercise.key,
      exerciseName: exercise.name,
      mode: 'reps',
      targetReps: 12,
      targetDurationSec: null,
      notes: ''
    };
    setItems((prev) => [...prev, slot]);
    setPickerOpen(false);
    setPickerQuery('');
  };

  const updateItem = (idx, patch) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const moveItem = (idx, dir) => {
    setItems((prev) => {
      const next = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= next.length) return prev;
      const tmp = next[newIdx];
      next[newIdx] = next[idx];
      next[idx] = tmp;
      return next;
    });
  };

  const handleSave = async () => {
    setError('');
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Donnez un nom au circuit (ex. "Circuit abdos lundi").');
      return;
    }
    if (items.length === 0) {
      setError('Ajoutez au moins un exercice au circuit.');
      return;
    }
    const tr = Number(targetRounds);
    if (!Number.isFinite(tr) || tr <= 0) {
      setError('Le nombre de tours cibles doit être un entier positif.');
      return;
    }

    const definition = normalizeCircuitDefinition({
      id: initialDefinition?.id,
      name: trimmedName,
      targetRounds: tr,
      restBetweenRoundsSec: Number(restBetween) || 0,
      notes,
      primaryMuscles: muscleSummary,
      items,
      createdAt: initialDefinition?.createdAt
    });

    try {
      const saved = await onSave?.(definition);
      const finalDef = saved || definition;
      if (assignProgramId && assignDay && typeof onAssignToDay === 'function') {
        await onAssignToDay(assignProgramId, assignDay, finalDef.id);
      }
      onCancel?.();
    } catch (e) {
      console.error('[CircuitEditor] Sauvegarde échouée:', e);
      setError('Impossible de sauvegarder le circuit.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center overflow-y-auto bg-black/80 px-2 py-6 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={initialDefinition ? 'Modifier le circuit' : 'Créer un circuit'}
    >
      <div className="relative w-full max-w-3xl rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5 shadow-2xl shadow-black/60 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
              <Repeat className="h-6 w-6 text-sky-300" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {initialDefinition ? 'Modifier le circuit' : 'Créer un circuit'}
              </h2>
              <p className="mt-1 text-xs text-teal-200/80">
                Un circuit = N tours d'exercices à enchaîner. Chaque tour cible donne 100 XP, palier 3× cible = 250 XP.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#0F4C5C]/55 bg-black p-2 text-teal-100 hover:border-sky-500/40"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-xl border border-red-500/45 bg-red-950/30 px-3 py-2 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-1">
            <label className={labelText}>Nom du circuit</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Circuit core EMOM"
              className={inputBase}
              maxLength={80}
            />
          </div>
          <div className="sm:col-span-1">
            <label className={`${labelText} flex items-center gap-1`}>
              <Layers size={11} /> Tours cibles
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={targetRounds}
              onChange={(e) => setTargetRounds(e.target.value)}
              className={inputBase}
            />
          </div>
          <div>
            <label className={`${labelText} flex items-center gap-1`}>
              <Clock size={11} /> Repos entre tours (s)
            </label>
            <input
              type="number"
              min={0}
              max={600}
              value={restBetween}
              onChange={(e) => setRestBetween(e.target.value)}
              className={inputBase}
            />
          </div>
          <div className="sm:col-span-2">
            <label className={labelText}>Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tempo, focus, restrictions…"
              rows={2}
              className={inputBase}
              maxLength={500}
            />
          </div>
        </div>

        {muscleSummary.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-teal-200/80">Muscles ciblés :</span>
            {muscleSummary.map((m) => (
              <span
                key={m}
                className="rounded-full border border-[#0F5C45]/60 bg-[#0F5C45]/15 px-2 py-0.5 text-teal-100"
              >
                {m}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">
            Exercices du circuit ({items.length})
          </h3>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/20 px-3 py-1.5 text-xs font-semibold text-teal-50 hover:border-[#0F5C45]/80 hover:bg-[#0F5C45]/30"
          >
            <Plus size={14} /> Ajouter un exercice
          </button>
        </div>

        {items.length === 0 ? (
          <p className="mt-2 rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40 px-4 py-6 text-center text-xs text-teal-200/70">
            Aucun exercice — utilisez « Ajouter un exercice » pour piocher dans la banque.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {items.map((item, idx) => {
              const isOpen = editingSlotIdx === idx;
              return (
                <li
                  key={item.slotId}
                  className="rounded-xl border border-[#0F4C5C]/45 bg-slate-950/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <GripVertical size={12} className="text-teal-200/40" />
                      <span className="rounded-md border border-[#0F5C45]/55 bg-[#0F5C45]/15 px-2 py-0.5 text-xs font-semibold text-teal-100">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{item.exerciseName}</p>
                        <p className="text-[11px] text-teal-200/70">
                          {item.mode === 'duration'
                            ? `${item.targetDurationSec || 0} s`
                            : `${item.targetReps || 0} reps`}
                          {item.notes ? ` · ${item.notes}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, -1)}
                        disabled={idx === 0}
                        className="rounded-lg border border-[#0F4C5C]/50 bg-black p-1.5 text-teal-100 hover:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Monter"
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, +1)}
                        disabled={idx === items.length - 1}
                        className="rounded-lg border border-[#0F4C5C]/50 bg-black p-1.5 text-teal-100 hover:border-sky-500/40 disabled:cursor-not-allowed disabled:opacity-30"
                        title="Descendre"
                      >
                        <ChevronDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSlotIdx(isOpen ? null : idx)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#0F4C5C]/50 bg-black px-2 py-1 text-xs text-teal-100 hover:border-sky-500/40"
                      >
                        {isOpen ? 'Fermer' : 'Régler'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded-lg border border-red-500/40 bg-black p-1.5 text-red-200 hover:border-red-400/70 hover:bg-red-950/40"
                        title="Retirer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <div className="sm:col-span-1">
                        <label className={labelText}>Type</label>
                        <select
                          value={item.mode}
                          onChange={(e) => {
                            const mode = e.target.value === 'duration' ? 'duration' : 'reps';
                            updateItem(idx, {
                              mode,
                              targetReps: mode === 'reps' ? item.targetReps || 12 : null,
                              targetDurationSec:
                                mode === 'duration' ? item.targetDurationSec || 30 : null
                            });
                          }}
                          className={inputSmall}
                        >
                          <option value="reps">Répétitions</option>
                          <option value="duration">Temps (sec)</option>
                        </select>
                      </div>
                      {item.mode === 'reps' ? (
                        <div>
                          <label className={`${labelText} inline-flex items-center gap-1`}>
                            <Repeat size={10} /> Reps
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={500}
                            value={item.targetReps ?? ''}
                            onChange={(e) =>
                              updateItem(idx, { targetReps: Number(e.target.value) || 0 })
                            }
                            className={inputSmall}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className={`${labelText} inline-flex items-center gap-1`}>
                            <Clock size={10} /> Durée (s)
                          </label>
                          <input
                            type="number"
                            min={5}
                            max={3600}
                            value={item.targetDurationSec ?? ''}
                            onChange={(e) =>
                              updateItem(idx, { targetDurationSec: Number(e.target.value) || 0 })
                            }
                            className={inputSmall}
                          />
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <label className={labelText}>Notes (optionnel)</label>
                        <input
                          type="text"
                          value={item.notes || ''}
                          onChange={(e) => updateItem(idx, { notes: e.target.value })}
                          placeholder="ex. tempo lent, sans pause…"
                          maxLength={120}
                          className={inputSmall}
                        />
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {Array.isArray(programs) && programs.length > 0 && typeof onAssignToDay === 'function' && (
          <div className="mt-5 rounded-xl border border-[#0F4C5C]/55 bg-slate-950/40 p-3">
            <p className="text-xs font-semibold text-white">
              Assigner à un programme / jour <span className="font-normal text-teal-200/70">(optionnel)</span>
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelText}>Programme</label>
                <select
                  value={assignProgramId}
                  onChange={(e) => setAssignProgramId(e.target.value)}
                  className={inputSmall}
                >
                  <option value="">— Aucun —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelText}>Jour</label>
                <select
                  value={assignDay}
                  onChange={(e) => setAssignDay(e.target.value)}
                  disabled={!assignProgramId}
                  className={`${inputSmall} disabled:opacity-50`}
                >
                  <option value="">— Choisir un jour —</option>
                  {PROGRAM_WEEK_DAYS.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#0F4C5C]/55 bg-black px-4 py-2 text-sm text-teal-100 hover:border-sky-500/40"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#0F5C45]/60 bg-[#0F5C45]/20 px-4 py-2 text-sm font-semibold text-teal-50 hover:border-[#0F5C45]/80 hover:bg-[#0F5C45]/30"
          >
            <Save size={14} /> Enregistrer le circuit
          </button>
        </div>

        {pickerOpen && (
          <div className="absolute inset-0 z-10 flex items-stretch justify-center overflow-y-auto bg-black/95 px-2 py-6 sm:items-center">
            <div className="w-full max-w-2xl rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <h3 className="text-base font-semibold text-white">
                  Choisir un exercice de la banque
                </h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="rounded-lg border border-[#0F4C5C]/55 bg-black p-2 text-teal-100 hover:border-sky-500/40"
                  aria-label="Fermer le sélecteur"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="relative sm:col-span-2">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    type="search"
                    value={pickerQuery}
                    onChange={(e) => setPickerQuery(e.target.value)}
                    placeholder="Nom, muscle, équipement…"
                    className="w-full rounded-xl border border-[#0F4C5C]/50 bg-black py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                    autoFocus
                  />
                </div>
                <select
                  value={pickerMuscle}
                  onChange={(e) => setPickerMuscle(e.target.value)}
                  className="rounded-xl border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
                >
                  <option value="">Tous muscles</option>
                  {muscleList.filter(Boolean).map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3 max-h-[55vh] overflow-y-auto rounded-xl border border-[#0F4C5C]/40 bg-slate-950/40">
                {filteredPicker.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-teal-200/70">
                    Aucun exercice ne correspond à ces critères.
                  </p>
                ) : (
                  <ul className="divide-y divide-[#0F4C5C]/30">
                    {filteredPicker.map((it) => (
                      <li key={it.key}>
                        <button
                          type="button"
                          onClick={() => addItem(it)}
                          className="flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-white transition hover:bg-[#0F4C5C]/15"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{it.name}</p>
                            <p className="truncate text-[11px] text-teal-200/70">
                              {it.category}
                              {it.primaryMuscles.length > 0 ? ` · ${it.primaryMuscles.join(', ')}` : ''}
                              {it.equipment ? ` · ${it.equipment}` : ''}
                            </p>
                          </div>
                          <Plus size={14} className="shrink-0 text-sky-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CircuitEditor;
