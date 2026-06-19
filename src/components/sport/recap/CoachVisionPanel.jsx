import React from 'react';
import { Sparkles } from 'lucide-react';

const KPI_ACCENTS = {
  violet: 'border-violet-400/30 bg-violet-500/10 text-violet-100',
  cyan: 'border-cyan-400/30 bg-cyan-500/10 text-cyan-100',
  teal: 'border-teal-400/30 bg-teal-500/10 text-teal-100',
  sky: 'border-sky-400/30 bg-sky-500/10 text-sky-100'
};

function KpiPill({ label, value, note, accent = 'teal' }) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col rounded-lg border px-3 py-2 ${KPI_ACCENTS[accent] || KPI_ACCENTS.teal}`}
    >
      <span className="truncate text-[9px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
      <span className="mt-0.5 text-lg font-bold tabular-nums leading-none text-white">{value}</span>
      {note ? <span className="mt-1 truncate text-[9px] leading-tight text-slate-400">{note}</span> : null}
    </div>
  );
}

function InsightBlock({ section, isFooter = false }) {
  const bullets = (section.bullets || []).slice(0, isFooter ? 3 : 2);

  if (isFooter) {
    return (
      <div className="rounded-lg border border-amber-500/35 bg-amber-950/30 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200/90">{section.title}</p>
        {section.summary ? (
          <p className="mt-1.5 text-sm font-medium text-amber-50/95">{section.summary}</p>
        ) : null}
        <ul className="mt-2 space-y-1.5">
          {bullets.map((line, i) => (
            <li key={i} className="text-xs leading-relaxed text-amber-100/85">
              {line}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="border-b border-[#0F4C5C]/40 py-3 last:border-b-0 last:pb-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-300/80">{section.title}</p>
      {section.summary ? (
        <p className="mt-1 text-sm leading-snug text-slate-100">{section.summary}</p>
      ) : null}
      {bullets.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {bullets.map((line, i) => (
            <li key={i} className="flex gap-2 text-xs leading-relaxed text-slate-300">
              <span className="mt-2 h-px w-3 shrink-0 bg-teal-500/50" aria-hidden />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function CoachVisionPanel({ report, fallbackText, periodLabel }) {
  const kpis = report?.kpis || [];
  const sections = report?.sections || [];
  const lead = report?.lead;
  const bodySections = sections.filter((s) => s.id !== 'program');
  const programSection = sections.find((s) => s.id === 'program');
  const hasStructure = lead || bodySections.length > 0 || programSection;

  if (!hasStructure && !fallbackText && !report?.text) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-xl border border-[#0F4C5C]/70 bg-black shadow-[0_0_32px_-8px_rgba(45,212,191,0.15)]">
      {/* En-tête */}
      <div className="border-b border-[#0F4C5C]/50 bg-gradient-to-r from-teal-950/40 via-black to-black px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-teal-500/30 bg-teal-950/50">
              <Sparkles size={15} className="text-teal-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white">Vision coach</h3>
              {periodLabel ? (
                <p className="text-[10px] text-teal-600/90">{periodLabel}</p>
              ) : null}
            </div>
          </div>
        </div>

        {lead ? (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-200">{lead}</p>
        ) : null}

        {kpis.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {kpis.map((k) => (
              <KpiPill key={k.id} label={k.label} value={k.value} note={k.note} accent={k.accent} />
            ))}
          </div>
        ) : null}
      </div>

      {/* Corps */}
      <div className="px-4 py-2 sm:px-5 sm:py-3">
        {hasStructure ? (
          <>
            {bodySections.map((section) => (
              <InsightBlock key={section.id} section={section} />
            ))}
            {programSection ? (
              <div className="mt-3 pt-1">
                <InsightBlock section={programSection} isFooter />
              </div>
            ) : null}
          </>
        ) : (
          <p className="py-3 text-xs leading-relaxed text-slate-300">{fallbackText || report?.text}</p>
        )}
      </div>
    </section>
  );
}
