import React from 'react';
import { ClipboardList } from 'lucide-react';
import { RecapHorizontalBars } from './components/RecapUiBlocks';

const TONE_BADGE = {
  good: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
  warn: 'border-amber-500/40 bg-amber-950/40 text-amber-200',
  bad: 'border-rose-500/40 bg-rose-950/40 text-rose-200',
  neutral: 'border-slate-500/40 bg-slate-900/40 text-slate-300'
};

function StructureKpiCard({ label, value, badge, tone = 'neutral' }) {
  return (
    <div className="rounded-lg border border-violet-500/25 bg-black/50 px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 flex flex-wrap items-baseline gap-2">
        <span className="text-lg font-bold tabular-nums text-white">{value}</span>
        {badge ? (
          <span
            className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase ${TONE_BADGE[tone] || TONE_BADGE.neutral}`}
          >
            {badge}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default function ProgramStructurePanel({ report, dowRows = [], periodLabel }) {
  if (!report) return null;

  const { title, intro, legAnalysis, ratioCommentary, bars, kpiCards, priority, statsRow } = report;

  return (
    <section className="space-y-4 rounded-xl border border-violet-500/35 bg-gradient-to-br from-violet-950/20 to-black p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <ClipboardList size={18} className="text-violet-300" />
        <h2 className="text-sm font-semibold text-violet-100">Structure du programme</h2>
        {title ? (
          <span className="rounded-full border border-violet-500/35 bg-violet-950/40 px-2 py-0.5 text-[10px] text-violet-200">
            {title}
          </span>
        ) : null}
        {periodLabel ? <span className="text-[10px] text-slate-500">· {periodLabel}</span> : null}
      </div>

      {intro ? <p className="text-xs leading-relaxed text-slate-200/95">{intro}</p> : null}

      {bars ? (
        <div className="space-y-2">
          <RecapHorizontalBars
            rows={[
              {
                key: 'push',
                label: 'Push',
                value: bars.push.pct,
                display: `${bars.push.pct} % · ${bars.push.reps} reps`,
                color: bars.push.color
              },
              {
                key: 'pull',
                label: 'Pull',
                value: bars.pull.pct,
                display: `${bars.pull.pct} % · ${bars.pull.reps} reps`,
                color: bars.pull.color
              }
            ]}
            maxValue={100}
          />
          {bars.ratio != null ? (
            <p className="text-[11px] text-slate-400">
              Ratio push/pull coché : <span className="font-semibold text-violet-200">{bars.ratio}</span>
              {bars.planRatio != null ? (
                <span className="text-slate-500"> · plan ~{bars.planRatio}</span>
              ) : null}
            </p>
          ) : null}
        </div>
      ) : null}

      {ratioCommentary ? (
        <p className="text-[11px] leading-relaxed text-slate-300/90">{ratioCommentary}</p>
      ) : null}

      {legAnalysis ? (
        <p className="text-[11px] leading-relaxed text-slate-300/90">{legAnalysis}</p>
      ) : null}

      {kpiCards?.length > 0 ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpiCards.map((c) => (
            <StructureKpiCard key={c.id} {...c} />
          ))}
        </div>
      ) : null}

      {priority?.text ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-950/25 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-amber-200/90">
            {priority.title || 'Priorité structurelle'}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-amber-50/95">{priority.text}</p>
        </div>
      ) : null}

      {(dowRows.length > 0 || statsRow) && (
        <div className="grid gap-3 border-t border-violet-500/20 pt-4 md:grid-cols-2">
          {dowRows.length > 0 ? (
            <div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Complétion par jour de semaine
              </p>
              <RecapHorizontalBars rows={dowRows} maxValue={100} />
            </div>
          ) : null}

          {statsRow ? (
            <div className="space-y-1.5 text-[11px] text-slate-300">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Push / pull · adhérence · course
              </p>
              {statsRow.pushPullRatio != null ? (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Push / pull</span>
                  <span className="tabular-nums text-violet-200">
                    {statsRow.pushPullRatio} — {statsRow.pushPct}% / {statsRow.pullPct}%
                  </span>
                </div>
              ) : null}
              {statsRow.adherencePct != null ? (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Adhérence exos</span>
                  <span className="tabular-nums text-emerald-300">{statsRow.adherencePct} %</span>
                </div>
              ) : null}
              {statsRow.globalPct != null && statsRow.globalPct !== statsRow.adherencePct ? (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Programme complet</span>
                  <span className="tabular-nums text-slate-400">{statsRow.globalPct} %</span>
                </div>
              ) : null}
              {statsRow.runningKm >= 1 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Course période</span>
                  <span className="tabular-nums text-sky-300">
                    {Math.round(statsRow.runningKm * 10) / 10} km
                    {statsRow.runningSessions ? ` · ${statsRow.runningSessions} sortie(s)` : ''}
                  </span>
                </div>
              ) : null}
              {statsRow.legReps >= 1 ? (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Reps jambes</span>
                  <span className="tabular-nums text-lime-300">{statsRow.legReps}</span>
                </div>
              ) : null}
              {statsRow.weeklyLoadKgReps != null ? (
                <div className="flex justify-between gap-2">
                  <span className="text-slate-500">Charge / sem.</span>
                  <span className="tabular-nums text-amber-200">
                    ~{Math.round(statsRow.weeklyLoadKgReps).toLocaleString('fr-FR')} kg×reps
                  </span>
                </div>
              ) : null}
              {statsRow.mostRegularExercises?.length > 0 ? (
                <div className="mt-2 border-t border-violet-500/15 pt-2">
                  <p className="mb-1 text-[10px] text-slate-500">Exos les plus réguliers</p>
                  <ul className="space-y-0.5 text-[10px] text-slate-300">
                    {statsRow.mostRegularExercises.map((ex) => (
                      <li key={ex.id}>
                        {ex.name} — ~{ex.regularityPct ?? ex.pct}%
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
