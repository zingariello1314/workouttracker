import React, { useMemo } from 'react';
import { Calendar, X } from 'lucide-react';
import { useFormatters } from '../../../utils/translations/formatters-hook';
import { EXERCISE_FAMOUS_RECORDS } from '../../../data/performanceBenchmarks/exerciseFamousRecords';

function formatDurationSec(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`;
  if (m > 0 && s > 0) return `${m} min ${s} s`;
  if (m > 0) return `${m} min`;
  return `${s} s`;
}

function formatHoldValue(seconds) {
  const n = Math.round(Number(seconds) || 0);
  if (n >= 60) {
    const m = Math.floor(n / 60);
    const s = n % 60;
    return s > 0 ? `${m} min ${s} s` : `${m} min`;
  }
  return `${n} s`;
}

export default function RecapBenchmarkInsightDetailModal({
  insight,
  onClose,
  onOpenCalendarDay,
  t
}) {
  const tr = t || ((k, d) => d);
  const { formatDate: formatLocaleDate } = useFormatters();
  const drill = insight?.drillDown;
  if (!insight || !drill) return null;

  const isHold = drill.metric === 'hold_seconds';
  const famousRows = useMemo(() => {
    const key = drill.benchmarkKey;
    if (!key) return [];
    return EXERCISE_FAMOUS_RECORDS[key] || [];
  }, [drill.benchmarkKey]);

  const userValue = drill.value ?? drill.timeSec ?? null;
  const dateLabel = drill.dateYmd
    ? formatLocaleDate(new Date(`${drill.dateYmd}T12:00:00`), {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="benchmark-detail-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-teal-500/35 bg-slate-950 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 id="benchmark-detail-title" className="text-base font-semibold text-sky-50">
              {tr('recap.benchmark.detailTitle', 'Détail du repère')}
            </h3>
            {dateLabel ? (
              <p className="mt-1 text-sm text-slate-400">{dateLabel}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label={tr('common.close', 'Fermer')}
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-4 text-sm leading-relaxed text-slate-200">{insight.text}</p>

        {drill.kind === 'strength' || drill.kind === 'progression' ? (
          <div className="mb-4 space-y-3">
            {drill.exerciseName ? (
              <p className="text-sm font-medium text-violet-200">{drill.exerciseName}</p>
            ) : null}
            {drill.schemeLabel ? (
              <p className="text-xs text-slate-400">{drill.schemeLabel}</p>
            ) : null}
            {drill.kind === 'progression' && drill.prevDate ? (
              <p className="text-xs text-slate-400">
                {tr('recap.benchmark.progressionFrom', 'Comparé à la séance du')}{' '}
                {formatLocaleDate(new Date(`${drill.prevDate}T12:00:00`), {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </p>
            ) : null}
            {Array.isArray(drill.sets) && drill.sets.length > 0 ? (
              <div className="overflow-hidden rounded-lg border border-slate-700/60">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/80 text-xs uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">{tr('recap.benchmark.set', 'Série')}</th>
                      <th className="px-3 py-2">
                        {isHold ? tr('recap.benchmark.duration', 'Durée') : tr('recap.benchmark.reps', 'Reps')}
                      </th>
                      <th className="px-3 py-2">{tr('recap.benchmark.weight', 'Charge')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drill.sets.map((set, idx) => (
                      <tr key={idx} className="border-t border-slate-800/80">
                        <td className="px-3 py-2 text-slate-300">{idx + 1}</td>
                        <td className="px-3 py-2 font-medium text-sky-100">
                          {isHold
                            ? set.holdSeconds != null
                              ? formatHoldValue(set.holdSeconds)
                              : formatHoldValue(set.reps)
                            : (set.reps ?? '—')}
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {set.weight != null && Number(set.weight) > 0
                            ? `${set.weight} kg`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : drill.totalReps > 0 ? (
              <p className="text-sm text-slate-300">
                {isHold
                  ? tr('recap.benchmark.totalHold', 'Maintien enregistré')
                  : tr('recap.benchmark.totalReps', 'Total enregistré')}{' '}
                :{' '}
                <span className="font-semibold text-sky-100">
                  {isHold ? formatHoldValue(drill.totalReps) : drill.totalReps}
                </span>
                {drill.setCount ? ` (${drill.setCount} séries)` : ''}
              </p>
            ) : null}
            {userValue > 0 && drill.kind === 'strength' ? (
              <p className="text-xs text-teal-300/90">
                {isHold
                  ? `${tr('recap.benchmark.bestSet', 'Meilleur maintien')} : ${formatHoldValue(userValue)}`
                  : `${tr('recap.benchmark.bestSet', 'Meilleure série')} : ${userValue} reps`}
              </p>
            ) : null}
          </div>
        ) : null}

        {drill.kind === 'running' ? (
          <div className="mb-4 space-y-2 text-sm text-slate-300">
            {drill.label ? (
              <p>
                <span className="text-slate-400">{tr('recap.benchmark.distance', 'Distance')} :</span>{' '}
                {drill.label}
              </p>
            ) : null}
            {drill.timeSec ? (
              <p>
                <span className="text-slate-400">{tr('recap.benchmark.time', 'Temps')} :</span>{' '}
                {formatDurationSec(drill.timeSec)}
              </p>
            ) : null}
            {drill.distanceKm ? (
              <p>
                <span className="text-slate-400">{tr('recap.benchmark.recordedKm', 'Km enregistrés')} :</span>{' '}
                {Math.round(drill.distanceKm * 100) / 100} km
              </p>
            ) : null}
          </div>
        ) : null}

        {famousRows.length > 0 ? (
          <div className="mb-4 rounded-lg border border-amber-500/25 bg-amber-950/15 p-3">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-200/90">
              {tr('recap.benchmark.publicRecords', 'Repères publics')}
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {famousRows.map((row, idx) => {
                const ahead =
                  userValue != null &&
                  row.seconds != null &&
                  Number.isFinite(userValue) &&
                  userValue >= row.seconds;
                return (
                  <li key={idx} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-slate-400">{row.scope}</span>
                    <span className={ahead ? 'text-teal-300' : 'text-slate-200'}>
                      {row.value}
                      {row.holder && row.holder !== '—' ? ` (${row.holder})` : ''}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {drill.dateYmd && typeof onOpenCalendarDay === 'function' ? (
          <button
            type="button"
            onClick={() => {
              onOpenCalendarDay(drill.dateYmd, 'calendar-day-exercise-detail');
              onClose?.();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/40 bg-teal-950/30 px-4 py-2.5 text-sm font-medium text-teal-100 transition hover:bg-teal-900/40"
          >
            <Calendar size={16} aria-hidden />
            {tr('recap.benchmark.openCalendar', 'Voir ce jour dans le calendrier')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
