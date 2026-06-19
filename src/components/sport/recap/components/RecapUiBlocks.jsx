import React from 'react';

const ACCENTS = {
  emerald: 'border-emerald-500/35 bg-emerald-950/20 text-emerald-300',
  amber: 'border-amber-500/35 bg-amber-950/20 text-amber-300',
  sky: 'border-sky-500/35 bg-sky-950/20 text-sky-300',
  teal: 'border-teal-500/35 bg-teal-950/20 text-teal-300',
  violet: 'border-violet-500/35 bg-violet-950/20 text-violet-300',
  rose: 'border-rose-500/35 bg-rose-950/20 text-rose-300',
  slate: 'border-slate-500/35 bg-slate-950/20 text-slate-300'
};

export default function RecapKpiCard({ label, value, note, accent = 'teal', className = '' }) {
  return (
    <div className={`rounded-xl border px-3 py-3 ${ACCENTS[accent] || ACCENTS.teal} ${className}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-[22px] font-bold tabular-nums leading-none text-white">{value}</div>
      {note ? <div className="mt-1.5 text-[10px] leading-snug text-slate-400">{note}</div> : null}
    </div>
  );
}

export function RecapSection({ title, subtitle, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-[#0F4C5C]/55 bg-black/60 px-4 py-3 ${className}`}>
      {title ? (
        <h2 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-teal-200/80">{title}</h2>
      ) : null}
      {subtitle ? <p className="mb-2 text-[10px] text-slate-500 leading-snug">{subtitle}</p> : null}
      {children}
    </section>
  );
}

/**
 * Barres horizontales simples (feedbacks, justifications, adhérence jour).
 */
export function RecapHorizontalBars({ rows, maxValue, emptyLabel }) {
  if (!rows?.length) {
    return emptyLabel ? <p className="text-xs text-slate-500">{emptyLabel}</p> : null;
  }
  const max = maxValue ?? Math.max(...rows.map((r) => r.value || 0), 1);
  return (
    <ul className="space-y-2">
      {rows.map((row) => {
        const pct = max > 0 ? Math.round(((row.value || 0) / max) * 100) : 0;
        return (
          <li key={row.key || row.label}>
            <div className="mb-0.5 flex items-center justify-between gap-2 text-[11px]">
              <span className="truncate text-slate-400">{row.label}</span>
              <span className="shrink-0 tabular-nums font-medium text-slate-200">{row.display ?? row.value}</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/80 ring-1 ring-[#0F4C5C]/35">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${pct}%`,
                  backgroundColor: row.color || '#2dd4bf',
                  boxShadow: `0 0 8px ${row.color || '#2dd4bf'}66`
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Donut CSS pour répartition musculaire ou push/pull. */
export function RecapDonutChart({ segments, size = 88, centerLabel, centerSub }) {
  const total = segments.reduce((a, s) => a + (s.value || 0), 0);
  if (total <= 0) {
    return <p className="text-xs text-slate-500">—</p>;
  }
  let acc = 0;
  const stops = segments.map((s) => {
    const pct = (s.value / total) * 100;
    const start = acc;
    acc += pct;
    return `${s.color} ${start}% ${acc}%`;
  });
  const gradient = `conic-gradient(${stops.join(', ')})`;
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: gradient,
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.45)'
        }}
      >
        <div
          className="absolute inset-[22%] flex flex-col items-center justify-center rounded-full bg-black/90 text-center"
        >
          {centerLabel ? (
            <span className="text-sm font-bold tabular-nums text-white leading-none">{centerLabel}</span>
          ) : null}
          {centerSub ? <span className="mt-0.5 text-[9px] text-slate-500">{centerSub}</span> : null}
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-1">
        {segments.map((s) => (
          <li key={s.key || s.label} className="flex items-center justify-between gap-2 text-[11px]">
            <span className="flex items-center gap-1.5 truncate text-slate-400">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
            <span className="shrink-0 tabular-nums text-slate-200">{s.display ?? s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function RecapChallengePills({ challenges, t }) {
  if (!challenges?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {challenges.slice(0, 6).map((ch) => (
        <span
          key={ch.id ?? ch.title ?? ch.name}
          className="inline-flex items-center rounded-full border border-amber-500/40 bg-amber-950/30 px-2.5 py-1 text-[10px] font-medium text-amber-100"
        >
          {ch.title || ch.name || t('recap.enrichment.challenge', 'Défi')}
        </span>
      ))}
    </div>
  );
}
