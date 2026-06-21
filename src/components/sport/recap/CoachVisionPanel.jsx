import React from 'react';
import { Sparkles } from 'lucide-react';
import CoachMetricText from './CoachMetricText';

const KPI_ACCENTS = {
  violet: 'border-violet-400/30 bg-violet-500/10 text-violet-100',
  cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
  teal: 'border-teal-400/30 bg-teal-500/10 text-teal-100',
  sky: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
  amber: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  lime: 'border-lime-400/30 bg-lime-500/10 text-lime-100'
};

function KpiPill({ label, value, note, accent = 'teal' }) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-lg border px-3 py-2 sm:min-w-[7rem] ${KPI_ACCENTS[accent] || KPI_ACCENTS.teal}`}
    >
      <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="mt-0.5 text-lg font-bold tabular-nums leading-none text-white">{value}</span>
      {note ? <span className="mt-1 truncate text-[9px] leading-tight text-slate-400">{note}</span> : null}
    </div>
  );
}

export default function CoachVisionPanel({ report, fallbackText, periodLabel }) {
  const kpis = report?.kpis || [];
  const lead = report?.lead;
  const paragraphs =
    report?.paragraphs?.length > 0
      ? report.paragraphs
      : report?.text
        ? report.text.split('\n\n').filter(Boolean)
        : fallbackText
          ? [fallbackText]
          : [];

  if (!paragraphs.length && !lead && !kpis.length) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#0F4C5C]/70 bg-black shadow-[0_0_32px_-8px_rgba(45,212,191,0.15)]">
      <div className="border-b border-[#0F4C5C]/50 bg-gradient-to-r from-teal-950/40 via-black to-black px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/50">
            <Sparkles size={15} className="text-teal-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-white">Vision coach</h3>
            {periodLabel ? <p className="text-[10px] text-teal-600/90">{periodLabel}</p> : null}
          </div>
        </div>

        {kpis.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {kpis.map((k) => (
              <KpiPill key={k.id} label={k.label} value={k.value} note={k.note} accent={k.accent} />
            ))}
          </div>
        ) : null}
      </div>

      <div className="space-y-3 px-4 py-4 sm:px-5">
        {lead ? (
          <p className="text-sm font-medium leading-relaxed text-slate-100">
            <CoachMetricText text={lead} />
          </p>
        ) : null}

        {paragraphs.map((para, i) => (
          <p key={i} className="text-xs leading-[1.65] text-slate-300/95 sm:text-[13px]">
            <CoachMetricText text={para} />
          </p>
        ))}
      </div>
    </section>
  );
}
