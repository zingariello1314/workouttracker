import React from 'react';

const ACCENT_VAR = {
  emerald: 'var(--d)',
  amber: 'var(--d)',
  sky: 'var(--a5)',
  teal: 'var(--d)',
  violet: 'var(--a1)',
  rose: 'var(--a4)',
  slate: 'var(--mu)'
};

export default function RecapKpiCard({ label, value, note, accent = 'teal', className = '' }) {
  return (
    <article className={`kt ${className}`} style={{ '--a': ACCENT_VAR[accent] || ACCENT_VAR.teal }}>
      <div className="l">{label}</div>
      <div className="n">{value}</div>
      {note ? <div className="s">{note}</div> : null}
    </article>
  );
}

export function RecapSection({ id, title, subtitle, children, className = '' }) {
  return (
    <section id={id} className={`rb-sec ${className}`}>
      {title ? (
        <div className="sh">
          <h2>{title}</h2>
          {subtitle ? <span>{subtitle}</span> : null}
        </div>
      ) : subtitle ? (
        <p className="sub">{subtitle}</p>
      ) : null}
      <div className="pnl">{children}</div>
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
    <ul className="rb-bars">
      {rows.map((row) => {
        const pct = max > 0 ? Math.round(((row.value || 0) / max) * 100) : 0;
        return (
          <li key={row.key || row.label}>
            <div className="rb-bar-top">
              <span>{row.label}</span>
              <b>{row.display ?? row.value}</b>
            </div>
            <div className="gz">
              <i style={{ '--w': `${pct}%`, '--c': row.color || 'var(--d)' }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** Donut CSS pour répartition musculaire ou push/pull. */
export function RecapDonutChart({ segments, size = 148, centerLabel, centerSub }) {
  const total = segments.reduce((a, s) => a + (s.value || 0), 0);
  if (total <= 0) {
    return <p className="text-xs text-slate-500">—</p>;
  }
  let acc = 0;
  const max = Math.max(...segments.map((s) => s.value || 0), 1);
  const stops = segments.map((s) => {
    const pct = (s.value / total) * 100;
    const start = acc;
    acc += pct;
    return `${s.color} ${start}% ${acc}%`;
  });
  const gradient = `conic-gradient(${stops.join(', ')})`;
  return (
    <div className="dnb">
      <div
        className="ring"
        style={{
          width: size,
          height: size,
          background: gradient
        }}
      >
        <div className="ctr">
          {centerLabel ? <b>{centerLabel}</b> : null}
          {centerSub ? <span>{centerSub}</span> : null}
        </div>
      </div>
      <div className="dl">
        {segments.map((s) => (
          <div key={s.key || s.label} className="rw" style={{ '--c': s.color, '--w': `${Math.round(((s.value || 0) / max) * 100)}%` }}>
            <span className="sw" style={{ background: s.color }} />
            <span className="nm">{s.label}</span>
            <b>{s.display ?? s.value}</b>
            <div className="bb"><i /></div>
          </div>
        ))}
      </div>
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
