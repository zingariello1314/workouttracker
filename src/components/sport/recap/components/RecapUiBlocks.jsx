import React from 'react';

const ACCENT_VAR = {
  emerald: 'var(--a2)',
  amber: 'var(--d)',
  sky: 'var(--a5)',
  teal: 'var(--a2)',
  violet: 'var(--a1)',
  rose: 'var(--a4)',
  coral: 'var(--a3)',
  slate: 'var(--mu)'
};

const ICON_VAR = {
  pulse: 'var(--ic-pulse)',
  grid: 'var(--ic-grid)',
  act: 'var(--ic-act)',
  prog: 'var(--ic-prog)',
  road: 'var(--ic-road)',
  dumb: 'var(--ic-dumb)',
  flame: 'var(--ic-flame)',
  chat: 'var(--ic-chat)',
  steps: 'var(--ic-steps)',
  moon: 'var(--ic-moon)',
  target: 'var(--ic-target)'
};

function isZeroish(value) {
  if (value == null) return true;
  const s = String(value).trim();
  if (!s || s === '—' || s === '-') return true;
  if (/^0([\s.,]0+)?\s*%?$/i.test(s)) return true;
  return false;
}

export default function RecapKpiCard({
  label,
  value,
  note,
  accent = 'teal',
  icon,
  progress,
  className = ''
}) {
  const style = {
    '--a': ACCENT_VAR[accent] || ACCENT_VAR.teal
  };
  if (icon && ICON_VAR[icon]) style['--ic'] = ICON_VAR[icon];
  const zero = isZeroish(value);
  const showBar = progress != null && Number.isFinite(Number(progress));
  const pct = showBar ? Math.max(0, Math.min(100, Number(progress))) : 0;

  return (
    <article className={`kt ${className}`} style={style}>
      <div className="l">{label}</div>
      <div className={`n${zero ? ' z' : ''}`}>{value}</div>
      {showBar ? (
        <div className="gz">
          <i style={{ '--w': `${pct}%` }} />
        </div>
      ) : null}
      {note ? <div className="s">{note}</div> : null}
    </article>
  );
}

export function RecapSection({
  id,
  title,
  subtitle,
  children,
  className = '',
  panel = true,
  panelClassName = '',
  badge,
  action
}) {
  return (
    <section id={id} className={`rb-sec ${className}`.trim()}>
      {title ? (
        <div className="sh">
          <h2>{title}</h2>
          {subtitle ? <span>{subtitle}</span> : null}
          {badge != null && badge !== '' ? <span className="badge">{badge}</span> : null}
          {action || null}
        </div>
      ) : subtitle ? (
        <p className="sub">{subtitle}</p>
      ) : null}
      {panel ? <div className={`pnl ${panelClassName}`.trim()}>{children}</div> : children}
    </section>
  );
}

export function RecapStatusRow({ tone = 'd', children }) {
  const m =
    tone === 'a1'
      ? 'var(--a1)'
      : tone === 'a2'
        ? 'var(--a2)'
        : tone === 'a3'
          ? 'var(--a3)'
          : tone === 'a4'
            ? 'var(--a4)'
            : tone === 'a5'
              ? 'var(--a5)'
              : tone === 'mu'
                ? 'var(--mu)'
                : 'var(--d)';
  return (
    <div className="sr" style={{ '--m': m }}>
      <span>{children}</span>
    </div>
  );
}

/**
 * Barres horizontales simples (feedbacks, justifications, adhérence jour).
 */
export function RecapHorizontalBars({ rows, maxValue, emptyLabel }) {
  if (!rows?.length) {
    return emptyLabel ? <p className="emp">{emptyLabel}</p> : null;
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
            <div className="gz" style={{ '--a': row.color || 'var(--d)' }}>
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
    return <p className="emp">—</p>;
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
            <div className="bb">
              <i />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RecapChallengePills({ challenges, t, emptyLabel }) {
  if (!challenges?.length) {
    return <div className="chp">{emptyLabel || t?.('recap.enrichment.noChallenge', "Aucun défi d'endurance actif")}</div>;
  }
  return (
    <div className="chp-row">
      {challenges.slice(0, 6).map((ch) => (
        <span key={ch.id ?? ch.title ?? ch.name} className="chp">
          {ch.title || ch.name || t?.('recap.enrichment.challenge', 'Défi')}
        </span>
      ))}
    </div>
  );
}
