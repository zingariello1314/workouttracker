import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

/**
 * Rendu des specs produits par analysisVisualInsight (données structurées uniquement).
 */
export default function AnalysisVisualInsight({ spec }) {
  if (!spec?.kind || !Array.isArray(spec.series) || !spec.series.length) return null;

  if (spec.kind === 'volume_freq_content') {
    return <VolumeFreqContentChart spec={spec} />;
  }
  if (spec.kind === 'relative_concentration') {
    return <RelativeConcentrationChart spec={spec} />;
  }
  if (spec.kind === 'trajectory_sessions') {
    return <TrajectorySessionsChart spec={spec} />;
  }
  return null;
}

function ChartShell({ title, alt, children, note }) {
  return (
    <figure
      className="analysis-visual-insight mt-3 rounded-md border border-white/10 bg-black/25 p-2"
      data-analyse-visual={true}
      aria-label={alt || title}
    >
      {title ? <figcaption className="mb-1 text-[11px] uppercase tracking-wide text-slate-400">{title}</figcaption> : null}
      <div className="h-[140px] w-full">{children}</div>
      {note ? <p className="mt-1 text-[11px] text-slate-500">{note}</p> : null}
      {alt ? <p className="sr-only">{alt}</p> : null}
    </figure>
  );
}

function VolumeFreqContentChart({ spec }) {
  const data = useMemo(() => {
    return (spec.series || [])
      .filter((s) => s.id !== 'before' && s.id !== 'after' && s.value != null)
      .map((s) => ({
        name: s.label,
        value: s.value,
        fill: s.id === 'freq' ? '#34d399' : s.id === 'content' ? '#f87171' : '#a78bfa'
      }));
  }, [spec]);
  const before = spec.series.find((s) => s.id === 'before')?.value;
  const after = spec.series.find((s) => s.id === 'after')?.value;
  const freq = spec.series.find((s) => s.id === 'freq')?.value;
  const content = spec.series.find((s) => s.id === 'content')?.value;
  const net = spec.series.find((s) => s.id === 'net')?.value;
  const labelBefore = spec.meta?.windowLabels?.before || spec.series.find((s) => s.id === 'before')?.label;
  const labelAfter = spec.meta?.windowLabels?.after || spec.series.find((s) => s.id === 'after')?.label;
  const recon =
    freq != null && content != null && net != null
      ? `${freq >= 0 ? '+' : ''}${freq} ${(content >= 0 ? '+' : '') + content} = ${net >= 0 ? '+' : ''}${net}`
      : null;
  const windowBit =
    labelBefore && labelAfter && labelBefore !== 'Avant' && labelAfter !== 'Après'
      ? `${labelBefore} → ${labelAfter} · `
      : '';
  return (
    <ChartShell
      title={spec.title}
      alt={spec.alt}
      note={
        before != null && after != null
          ? `${windowBit}${Math.round(before)} → ${Math.round(after)} reps · ${recon || 'fréquence vs contenu'}${
              spec.meta?.reconciliationOk === false ? ' (écart de réconciliation)' : ''
            }`
          : spec.meta?.note
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
            formatter={(v) => [`${v >= 0 ? '+' : ''}${Math.round(v)} reps`, '']}
          />
          <ReferenceLine y={0} stroke="#475569" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function RelativeConcentrationChart({ spec }) {
  const data = useMemo(
    () =>
      (spec.series || []).map((s) => {
        const fraction =
          s.numerator != null && s.denominator != null
            ? `${Math.round(s.numerator)} / ${Math.round(s.denominator)}`
            : null;
        const popLabel =
          s.population === 'same_moves_nested_windows'
            ? 'mêmes mouvements'
            : s.population === 'all_reps_nested_windows'
              ? 'toutes reps'
              : s.population || null;
        return {
          name: s.id === 'moves' ? 'Mouvements nommés' : 'Volume total',
          value: s.value,
          fill: s.id === 'moves' ? '#c084fc' : '#38bdf8',
          detail: fraction,
          population: popLabel
        };
      }),
    [spec]
  );
  const fractionNote = data
    .filter((d) => d.detail)
    .map((d) => `${d.name} : ${d.detail}${d.population ? ` (${d.population})` : ''}`)
    .join(' · ');
  const note = [fractionNote, spec.meta?.note].filter(Boolean).join(' — ');
  return (
    <ChartShell title={spec.title} alt={spec.alt} note={note || null}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 48, left: 8, bottom: 4 }}>
          <XAxis type="number" domain={[0, 'dataMax']} tick={{ fill: '#64748b', fontSize: 10 }} unit="%" />
          <YAxis type="category" dataKey="name" width={110} tick={{ fill: '#94a3b8', fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
            formatter={(v, _n, ctx) => [
              `${v} %${ctx?.payload?.detail ? ` (${ctx.payload.detail})` : ''}${
                ctx?.payload?.population ? ` · ${ctx.payload.population}` : ''
              }`,
              ''
            ]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={18} label={{ position: 'right', fill: '#94a3b8', fontSize: 10, formatter: (_v, _i, entry) => entry?.detail || `${entry?.value ?? ''} %` }}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

function TrajectorySessionsChart({ spec }) {
  const data = useMemo(
    () =>
      (spec.series || []).map((s, i) => ({
        name: s.date ? String(s.date).slice(5) : s.label || `#${i + 1}`,
        value: s.missing ? null : s.value,
        highlight: s.highlight
      })),
    [spec]
  );
  return (
    <ChartShell title={spec.title} alt={spec.alt} note={spec.meta?.note}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} width={32} domain={['auto', 'auto']} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
            formatter={(v) => [`${v != null ? Math.round(v) : '—'} reps`, 'Séance']}
          />
          <Line
            type="linear"
            dataKey="value"
            stroke="#a78bfa"
            strokeWidth={2}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (cx == null || cy == null || payload?.value == null) return null;
              const atypical = payload.highlight === 'atypical';
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={atypical ? 5 : 3}
                  fill={atypical ? '#fbbf24' : '#c084fc'}
                  stroke={atypical ? '#f59e0b' : 'transparent'}
                />
              );
            }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}
