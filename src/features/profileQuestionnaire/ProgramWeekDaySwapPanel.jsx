import React, { useCallback, useMemo, useState } from 'react';
import { QUIZ_SCHEDULE_DAY_ORDER } from './trainingScheduleFromQuiz';

function swapScheduleDays(schedule, dayA, dayB) {
  if (!schedule?.[dayA] || !schedule?.[dayB]) return schedule;
  const next = { ...schedule };
  const a = { ...next[dayA] };
  const b = { ...next[dayB] };
  const aActive = Boolean(a.active);
  const bActive = Boolean(b.active);
  next[dayA] = { ...b, active: aActive };
  next[dayB] = { ...a, active: bActive };
  return next;
}

/**
 * Permutation manuelle des jours actifs (programme quiz).
 */
const ProgramWeekDaySwapPanel = ({ program, onUpdateProgram }) => {
  const schedule = program?.schedule;
  const [dayA, setDayA] = useState('');
  const [dayB, setDayB] = useState('');
  const [message, setMessage] = useState('');

  const activeDays = useMemo(
    () => QUIZ_SCHEDULE_DAY_ORDER.filter((d) => schedule?.[d]?.active),
    [schedule]
  );

  const replanHint = program?.quizGenerationMeta?.replanSummaryFr;

  const applySwap = useCallback(() => {
    if (!dayA || !dayB || dayA === dayB) {
      setMessage('Choisis deux jours différents.');
      return;
    }
    if (!schedule?.[dayA]?.active || !schedule?.[dayB]?.active) {
      setMessage('Les deux jours doivent être des séances actives.');
      return;
    }
    if (typeof onUpdateProgram !== 'function') return;
    const nextSchedule = swapScheduleDays(schedule, dayA, dayB);
    onUpdateProgram({
      ...program,
      schedule: nextSchedule,
      updatedAt: new Date().toISOString(),
      weekDaySwapNote: `Contenu échangé : ${dayA} ↔ ${dayB}`
    });
    setMessage(`Séances permutées (${dayA} ↔ ${dayB}).`);
    setDayA('');
    setDayB('');
  }, [dayA, dayB, onUpdateProgram, program, schedule]);

  if (!activeDays.length || activeDays.length < 2) return null;

  return (
    <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 p-4 space-y-3">
      <p className="text-xs uppercase tracking-wide text-violet-300/90">Calendrier — permuter les jours</p>
      {replanHint ? <p className="text-xs text-slate-400">Suggestion coach : {replanHint}</p> : null}
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-xs text-slate-300">
          Jour A
          <select
            className="mt-1 block w-full min-w-[7rem] rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm"
            value={dayA}
            onChange={(e) => setDayA(e.target.value)}
          >
            <option value="">—</option>
            {activeDays.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-300">
          Jour B
          <select
            className="mt-1 block w-full min-w-[7rem] rounded border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm"
            value={dayB}
            onChange={(e) => setDayB(e.target.value)}
          >
            <option value="">—</option>
            {activeDays.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={applySwap}
          className="rounded-lg border border-violet-500/50 bg-violet-600/25 px-3 py-1.5 text-xs font-medium text-violet-50 hover:bg-violet-600/40"
        >
          Permuter
        </button>
      </div>
      {message ? <p className="text-xs text-emerald-200/90">{message}</p> : null}
    </div>
  );
};

export default ProgramWeekDaySwapPanel;
