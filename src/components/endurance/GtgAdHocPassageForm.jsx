import React, { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

function nowClockTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

/**
 * Saisie d'un passage GTG hors planning : une heure, les reps réellement faites.
 */
export default function GtgAdHocPassageForm({ exerciseIds = [], labelFor, disabled = false, onSubmit }) {
  const [time, setTime] = useState(nowClockTime);
  const [repsById, setRepsById] = useState({});
  const [error, setError] = useState('');

  const ids = useMemo(() => (Array.isArray(exerciseIds) ? exerciseIds : []), [exerciseIds]);

  if (!ids.length) return null;

  const submit = (event) => {
    event.preventDefault();
    const items = ids
      .map((exerciseId) => ({
        exerciseId,
        reps: Math.round(Number(String(repsById[exerciseId] ?? '').replace(',', '.')))
      }))
      .filter((item) => Number.isFinite(item.reps) && item.reps > 0);
    if (!time || !/^\d{2}:\d{2}$/.test(time)) {
      setError('Indique une heure valide.');
      return;
    }
    if (!items.length) {
      setError('Indique les reps d’au moins un exercice.');
      return;
    }
    setError('');
    onSubmit?.({ time, items });
    setRepsById({});
  };

  return (
    <form onSubmit={submit} className="mt-4 rounded-xl border border-dashed border-amber-500/40 bg-amber-950/10 p-3">
      <div className="mb-2 text-sm font-medium text-amber-100">Ajouter un passage hors planning</div>
      <p className="mb-3 text-[11px] leading-relaxed text-slate-400">
        Par exemple 23:42, 3 tractions, 6 dips, 10 pompes. Le passage est coché tout de suite et compte
        comme les mini-séries prévues : journal, XP, calendrier, export et récap.
      </p>
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-slate-400">
          Heure
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            disabled={disabled}
            className="mt-1 block rounded-lg border border-slate-600 bg-black px-2 py-1.5 font-mono text-sm text-white"
          />
        </label>
        {ids.map((id) => (
          <label key={id} className="text-[11px] text-slate-400">
            {labelFor(id)}
            <input
              type="number"
              min="0"
              inputMode="numeric"
              placeholder="reps"
              value={repsById[id] ?? ''}
              disabled={disabled}
              onChange={(e) => setRepsById((cur) => ({ ...cur, [id]: e.target.value }))}
              className="mt-1 block w-20 rounded-lg border border-slate-600 bg-black px-2 py-1.5 text-sm text-white"
            />
          </label>
        ))}
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg border border-amber-400/50 bg-amber-950/40 px-3 py-2 text-sm text-amber-100 hover:bg-amber-900/40 disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Enregistrer et cocher
        </button>
      </div>
      {error ? <p className="mt-2 text-[11px] text-rose-300">{error}</p> : null}
    </form>
  );
}
