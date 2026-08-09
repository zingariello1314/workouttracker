import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  X,
  Plus,
  CheckCircle2,
  FolderOpen,
  Sparkles,
  Calendar,
  Dumbbell
} from 'lucide-react';
import { WorkoutContext } from '../../context/WorkoutContext';
import { useToast } from '../ui/Toast';
import {
  WEEK_DAYS,
  createEmptyBankProgramSchedule,
  appendExerciseBankKeyToProgramDay,
  appendStretchKeyToProgramDay,
  resolveExerciseBankKey
} from '../../utils/bankProgramMutations';
import { getDayName } from '../../utils/dateUtils';
import { STRETCH_MOMENTS } from '../../utils/stretchUtils';

const DAY_LABEL = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

const MOMENT_LABEL = { matin: 'Matin', midi: 'Midi', soir: 'Soir' };

/**
 * @param {{ payload: { kind:'exercise'; exercise:any } | { kind:'stretch'; stretchKey:string; stretchLabel?:string } | null }} props
 */
export default function BankAddToProgramModal({ payload, onClose }) {
  const { programs, activeProgram, addProgram, activateProgram, updateProgram } =
    useContext(WorkoutContext);
  const { showSuccess, showWarning, showError } = useToast();

  const [destination, setDestination] = useState('active');
  const [programIdOther, setProgramIdOther] = useState('');
  const [dayKey, setDayKey] = useState('lundi');
  const [moment, setMoment] = useState('soir');
  const [newProgramName, setNewProgramName] = useState('');
  const [activateAfterCreate, setActivateAfterCreate] = useState(true);
  const [spreadWeek, setSpreadWeek] = useState(false);

  const open = Boolean(payload);
  const isBulk = payload?.kind === 'bulk';
  const bulkHasStretch = isBulk && (payload.items || []).some((it) => it.kind === 'stretch');

  useEffect(() => {
    if (!payload) return;
    setDestination(activeProgram ? 'active' : programs?.length ? 'other' : 'new');
    setProgramIdOther(
      programs?.some((p) => p?.id === activeProgram?.id) ? String(activeProgram.id) : String(programs?.[0]?.id || '')
    );
    setDayKey(getDayName(new Date()) || 'lundi');
    setMoment('soir');
    setNewProgramName('');
    setActivateAfterCreate(true);
    setSpreadWeek(false);
  }, [payload, activeProgram, programs]);

  useEffect(() => {
    if (!open) return;
    const fn = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [open, onClose]);

  const titleLabel = useMemo(() => {
    if (!payload) return '';
    if (payload.kind === 'bulk') {
      const n = payload.items?.length || 0;
      return payload.label || `${n} élément${n > 1 ? 's' : ''}`;
    }
    if (payload.kind === 'stretch') return payload.stretchLabel || payload.stretchKey || 'Étirement';
    return payload.exercise?.name || 'Exercice';
  }, [payload]);

  const resolvedExerciseKey = useMemo(() => {
    if (!payload || payload.kind !== 'exercise') return null;
    return resolveExerciseBankKey(payload.exercise);
  }, [payload]);

  const persistProgram = useCallback(
    (nextProgram) => {
      updateProgram({ ...nextProgram, updatedAt: new Date().toISOString() });
    },
    [updateProgram]
  );

  const handleSubmit = () => {
    if (!payload) return;

    if (payload.kind === 'exercise' && !resolvedExerciseKey) {
      showError(
        "Impossible de lier cet exercice à la banque pour l'ajouter au programme. Essaie une entrée depuis la banque officielle."
      );
      return;
    }

    let target = null;

    if (destination === 'active') {
      target = activeProgram;
      if (!target) {
        showError("Tu n’as pas de programme actif. Choisis « Autre programme » ou « Nouveau ».");
        return;
      }
    } else if (destination === 'other') {
      target = programs?.find((p) => String(p.id) === String(programIdOther));
      if (!target) {
        showError('Choisis un programme dans la liste.');
        return;
      }
    } else {
      const name = newProgramName.trim();
      if (name.length < 2) {
        showError('Donne un nom au nouveau programme (2 caractères minimum).');
        return;
      }
      target = addProgram({
        name,
        description: '',
        duration: 4,
        exercises: [],
        schedule: createEmptyBankProgramSchedule()
      });
      if (!target?.id) {
        showError('Création du programme impossible.');
        return;
      }
      if (activateAfterCreate) {
        activateProgram(target.id);
      }
    }

    const dayIndex = WEEK_DAYS.indexOf(dayKey);

    const applyOne = (program, item, offset) => {
      const dk = spreadWeek
        ? WEEK_DAYS[(dayIndex + offset) % WEEK_DAYS.length]
        : dayKey;
      if (item.kind === 'stretch') {
        return appendStretchKeyToProgramDay(program, dk, moment, item.stretchKey, {
          duration: item.duration
        });
      }
      const exKey = item.exercise ? resolveExerciseBankKey(item.exercise) : null;
      if (!exKey) return { ok: false, error: 'no_key' };
      return appendExerciseBankKeyToProgramDay(program, dk, exKey, { series: item.series || '3×10' });
    };

    if (payload.kind === 'bulk') {
      const items = payload.items || [];
      if (items.length === 0) {
        showError('Aucun élément à ajouter.');
        return;
      }
      let program = target;
      let added = 0;
      let dupes = 0;
      let failed = 0;
      items.forEach((item, i) => {
        const r = applyOne(program, item, i);
        if (!r?.ok) {
          failed += 1;
          return;
        }
        program = r.program;
        if (r.duplicate) dupes += 1;
        else added += 1;
      });
      if (added === 0 && failed > 0) {
        showError('Impossible d’ajouter la sélection au programme.');
        return;
      }
      persistProgram(program);
      const spreadHint = spreadWeek ? ' · réparti sur la semaine' : '';
      showSuccess(
        `${added} ajouté${added > 1 ? 's' : ''}${dupes ? ` (${dupes} déjà présent${dupes > 1 ? 's' : ''})` : ''}${spreadHint} · ${target.name}.`
      );
    } else if (payload.kind === 'stretch') {
      const r = appendStretchKeyToProgramDay(target, dayKey, moment, payload.stretchKey, {
        duration: payload.duration
      });
      if (!r.ok) {
        showError('Impossible d’ajouter cet étirement (jour invalide).');
        return;
      }
      if (r.duplicate) {
        showWarning('Cet étirement est déjà prévu pour ce jour et ce créneau.');
        onClose?.();
        return;
      }
      persistProgram(r.program);
      showSuccess(`Étirement ajouté · ${DAY_LABEL[dayKey]} (${MOMENT_LABEL[moment]}).`);
    } else {
      const r = appendExerciseBankKeyToProgramDay(target, dayKey, resolvedExerciseKey, {
        series: payload.series || '3×10'
      });
      if (!r.ok) {
        showError('Impossible d’ajouter l’exercice.');
        return;
      }
      persistProgram(r.program);
      const todayKey = getDayName(new Date());
      const dayHint =
        dayKey !== todayKey
          ? ` Ouvre Aujourd’hui et va au ${DAY_LABEL[dayKey]} (flèches date) pour le voir.`
          : activeProgram?.id === target.id
            ? ' Visible dans Aujourd’hui pour ce jour.'
            : '';
      showSuccess(`Exercice ajouté · ${DAY_LABEL[dayKey]} · ${target.name}.${dayHint}`);
    }

    onClose?.();
  };

  if (!open || !payload) return null;

  return (
    <div
      className="fixed inset-0 z-[1400] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-add-program-title"
    >
      <button
        type="button"
        aria-label="Fermer"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[#0F4C5C]/90 bg-black shadow-[0_0_40px_-12px_rgba(15,76,92,0.85)]">
        <div className="flex items-start justify-between gap-3 border-b border-[#0F4C5C]/55 bg-[#041a13]/95 px-5 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-500/95">
              {payload.kind === 'stretch' ? (
                <Sparkles className="h-4 w-4 shrink-0 text-teal-400" />
              ) : (
                <Dumbbell className="h-4 w-4 shrink-0 text-sky-400" />
              )}
              Ajouter au programme
            </div>
            <h2 id="bank-add-program-title" className="mt-1 truncate text-lg font-semibold text-white">
              {titleLabel}
            </h2>
            <p className="mt-0.5 text-xs text-teal-800/95">
              Tes programmes personnels — les changements sont visibles sous « Mon programme » et dans l’onglet Programme sport.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#0F4C5C]/55 p-2 text-teal-500 transition hover:border-[#0F5C45]/65 hover:bg-[#0F5C45]/20 hover:text-teal-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] space-y-4 overflow-y-auto px-5 py-4">
          {/* Destination */}
          <div className="space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-teal-900">
              Où ajouter ?
            </span>
            <div className="grid gap-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0F4C5C]/55 bg-black px-3 py-2 transition hover:border-[#0F5C45]/50 has-[:checked]:border-[#0F5C45]/85 has-[:checked]:shadow-[inset_0_0_0_1px_rgba(15,92,69,0.35)]">
                <input
                  type="radio"
                  name="dest"
                  className="accent-teal-500"
                  checked={destination === 'active'}
                  onChange={() => setDestination('active')}
                  disabled={!activeProgram}
                />
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <div className="min-w-0 flex-1 text-sm">
                  <div className="font-medium text-white">Programme en cours</div>
                  <div className="truncate text-[11px] text-teal-800">
                    {activeProgram?.name || 'Aucun programme actif'}
                  </div>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0F4C5C]/55 bg-black px-3 py-2 transition hover:border-[#0F5C45]/50 has-[:checked]:border-[#0F5C45]/85 has-[:checked]:shadow-[inset_0_0_0_1px_rgba(15,92,69,0.35)]">
                <input
                  type="radio"
                  name="dest"
                  className="accent-teal-500"
                  checked={destination === 'other'}
                  onChange={() => setDestination('other')}
                  disabled={!(programs?.length > 0)}
                />
                <FolderOpen className="h-4 w-4 shrink-0 text-sky-400" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">Un autre de mes programmes</div>
                  {destination === 'other' && programs?.length > 0 && (
                    <select
                      value={programIdOther}
                      onChange={(e) => setProgramIdOther(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-1.5 text-xs text-teal-100 focus:border-teal-500 focus:outline-none"
                    >
                      {programs.map((p) => (
                        <option key={p.id} value={String(p.id)}>
                          {p.name || p.id}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#0F4C5C]/55 bg-black px-3 py-2 transition hover:border-[#0F5C45]/50 has-[:checked]:border-[#0F5C45]/85 has-[:checked]:shadow-[inset_0_0_0_1px_rgba(15,92,69,0.35)]">
                <input type="radio" name="dest" className="accent-teal-500" checked={destination === 'new'} onChange={() => setDestination('new')} />
                <Plus className="h-4 w-4 shrink-0 text-amber-400" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="text-sm font-medium text-white">Créer un nouveau programme</div>
                  {destination === 'new' && (
                    <>
                      <input
                        value={newProgramName}
                        onChange={(e) => setNewProgramName(e.target.value)}
                        placeholder="Nom du programme (ex. Haut du corps)"
                        className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-1.5 text-xs text-teal-100 placeholder:text-teal-900 focus:border-teal-500 focus:outline-none"
                      />
                      <label className="flex items-center gap-2 text-[11px] text-teal-800">
                        <input
                          type="checkbox"
                          className="accent-teal-500"
                          checked={activateAfterCreate}
                          onChange={(e) => setActivateAfterCreate(e.target.checked)}
                        />
                        Rendre ce programme actif après création
                      </label>
                    </>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* Jour + créneau (étirement) */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-teal-900">
                <Calendar className="h-3.5 w-3.5" />
                Jour
              </span>
              <select
                value={dayKey}
                onChange={(e) => setDayKey(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-teal-100 focus:border-teal-500 focus:outline-none"
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {DAY_LABEL[d]}
                  </option>
                ))}
              </select>
            </div>

            {(payload.kind === 'stretch' || bulkHasStretch) && (
              <div>
                <span className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-teal-900">
                  <Sparkles className="h-3.5 w-3.5" />
                  Créneau {isBulk ? '(étirements)' : ''}
                </span>
                <select
                  value={moment}
                  onChange={(e) => setMoment(e.target.value)}
                  className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-teal-100 focus:border-teal-500 focus:outline-none"
                >
                  {STRETCH_MOMENTS.map((m) => (
                    <option key={m} value={m}>
                      {MOMENT_LABEL[m]}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isBulk && (payload.items?.length || 0) > 1 && (
            <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#0F4C5C]/55 bg-black px-3 py-2.5 text-xs text-teal-200">
              <input
                type="checkbox"
                className="mt-0.5 accent-teal-500"
                checked={spreadWeek}
                onChange={(e) => setSpreadWeek(e.target.checked)}
              />
              <span>
                Répartir sur la semaine (un élément par jour à partir du jour choisi — exercices en
                liste du jour, étirements au créneau sélectionné).
              </span>
            </label>
          )}

          {isBulk && (
            <div className="rounded-xl border border-[#0F4C5C]/45 bg-black/80 px-3 py-2 text-[11px] text-slate-400">
              {(payload.items || []).map((it, i) => (
                <div key={`${it.kind}-${i}`} className="truncate">
                  {it.kind === 'stretch' ? '◎' : '◆'} {it.stretchLabel || it.exercise?.name || '—'}
                  {it.series ? ` · ${it.series}` : ''}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[#0F4C5C]/40 bg-black/95 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#0F4C5C]/50 px-3 py-2 text-sm text-teal-200 transition hover:bg-[#0F4C5C]/20"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg border border-[#0F5C45]/60 bg-[#0F5C45]/35 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-teal-950/40 transition hover:bg-[#0F5C45]/55"
          >
            <Plus className="h-4 w-4" />
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}
