import React from 'react';
import { Activity, Moon, Target } from 'lucide-react';

function ChallengeRow({ row }) {
  const pct = row.progressPct ?? 0;
  const isDone = row.status === 'completed';
  return (
    <div className="rounded-lg border border-slate-700/50 bg-black/40 px-3 py-2.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-100">{row.title}</p>
          {row.type ? <p className="text-[10px] text-slate-500">{row.type}</p> : null}
        </div>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${
            isDone
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
              : 'border-sky-500/40 bg-sky-950/40 text-sky-200'
          }`}
        >
          {isDone ? 'Validé' : `${pct} %`}
        </span>
      </div>
      {!isDone && pct > 0 ? (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full rounded-full bg-sky-500/80 transition-all" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

export default function RecapDenseInsightsPanel({ denseAnalytics, periodLabel }) {
  if (!denseAnalytics) return null;

  const { garminCalendar, sleepCorrelations, challengeRows } = denseAnalytics;
  const hasGarmin = garminCalendar?.totalSessions > 0;
  const hasSleep = sleepCorrelations?.length > 0;
  const hasChallenges = challengeRows?.length > 0;

  if (!hasGarmin && !hasSleep && !hasChallenges) return null;

  return (
    <section className="space-y-4 rounded-xl border border-slate-600/40 bg-gradient-to-br from-slate-950/50 to-black p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <Activity size={16} className="text-slate-300" />
        <h2 className="text-sm font-semibold text-slate-100">Calendrier · récup · défis</h2>
        {periodLabel ? <span className="text-[10px] text-slate-500">· {periodLabel}</span> : null}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {hasGarmin ? (
          <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-200/90">
              <Activity size={12} />
              Garmin calendrier
            </div>
            <p className="text-lg font-bold tabular-nums text-white">
              {garminCalendar.totalSessions}{' '}
              <span className="text-sm font-normal text-slate-400">activité(s)</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-300">
              ~{garminCalendar.totalMinutes} min · {garminCalendar.summaryLine}
            </p>
          </div>
        ) : null}

        {hasSleep ? (
          <div className="rounded-lg border border-indigo-500/25 bg-indigo-950/15 p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-indigo-200/80">
              <Moon size={12} />
              Sommeil → performance
            </div>
            <ul className="space-y-2 text-[11px] leading-relaxed text-slate-200/95">
              {sleepCorrelations.map((c) => (
                <li key={c.exerciseId}>
                  <span className="font-medium text-white">{c.name}</span> : ~{c.shortAvg} reps (nuits &lt;6,5 h) vs ~{c.okAvg}{' '}
                  reps (≥7 h) — <span className="text-amber-200/90">−{c.dropPct} %</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {hasChallenges ? (
          <div className="rounded-lg border border-sky-500/25 bg-sky-950/15 p-3 lg:col-span-1">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-sky-200/90">
              <Target size={12} />
              Défis
            </div>
            <div className="space-y-2">
              {challengeRows.map((row) => (
                <ChallengeRow key={row.id} row={row} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
