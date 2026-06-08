import React, { useId, useMemo, useState, useCallback } from 'react';

function formatTooltipDate(ymd) {
  if (!ymd) return '';
  const s = String(ymd).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return s;
  }
}

/**
 * Courbe ordonnée : un point par séance (ordre chronologique).
 * seriesA / seriesB : { date, value, label? }[]
 */
const SessionSeriesLineChart = ({
  seriesA = [],
  seriesB = null,
  metaA = { label: 'Valeur', color: '#38bdf8' },
  metaB = null,
  height = 180,
  valueFormatA = (v) => String(v),
  valueFormatB = (v) => String(v),
  emptyMessage = 'Pas assez de données.',
  interactive = true
}) => {
  const gradId = useId().replace(/:/g, '');
  const dual = Boolean(seriesB?.length && metaB);
  const [tip, setTip] = useState(null);

  const layout = useMemo(() => {
    const ptsA = Array.isArray(seriesA) ? seriesA : [];
    const ptsB = dual && seriesB.length === ptsA.length ? seriesB : [];
    const n = ptsA.length;
    const width = 720;
    const pad = { top: 14, right: dual ? 22 : 12, bottom: 28, left: 22 };

    if (n < 1) return { empty: true };

    const maxA = Math.max(1, ...ptsA.map((p) => Number(p.value) || 0));
    const maxB = dual ? Math.max(1, ...ptsB.map((p) => Number(p.value) || 0)) : 1;
    const innerW = width - pad.left - pad.right;
    const innerH = height - pad.top - pad.bottom;
    const xAt = (i) => pad.left + (n <= 1 ? innerW / 2 : (i / Math.max(1, n - 1)) * innerW);
    const yA = (v) => pad.top + (1 - (Number(v) || 0) / maxA) * innerH;
    const yB = (v) => pad.top + (1 - (Number(v) || 0) / maxB) * innerH;

    let dA = '';
    ptsA.forEach((p, i) => {
      const x = xAt(i);
      const y = yA(p.value);
      dA += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    let dB = '';
    if (dual && ptsB.length === n) {
      ptsB.forEach((p, i) => {
        const x = xAt(i);
        const y = yB(p.value);
        dB += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
      });
    }

    const pointsA = ptsA.map((p, i) => ({
      x: xAt(i),
      y: yA(p.value),
      v: Number(p.value) || 0,
      date: String(p.date || ''),
      label: p.label || String(p.date || '').slice(5)
    }));
    const pointsB = ptsB.map((p, i) => ({
      x: xAt(i),
      y: yB(p.value),
      v: Number(p.value) || 0,
      date: String(p.date || '')
    }));

    const labelEvery = n > 24 ? Math.ceil(n / 8) : n > 12 ? 2 : 1;
    const labelIndices = [];
    for (let i = 0; i < n; i += labelEvery) labelIndices.push(i);
    if (n > 1 && labelIndices[labelIndices.length - 1] !== n - 1) labelIndices.push(n - 1);

    return {
      empty: false,
      width,
      height,
      pad,
      n,
      dA,
      dB,
      maxA,
      maxB,
      dual,
      pointsA,
      pointsB,
      labelIndices
    };
  }, [seriesA, seriesB, dual, metaB, height]);

  const showTipAtIndex = useCallback(
    (e, index) => {
      if (!layout || layout.empty || !interactive) return;
      const { pointsA: pa, pointsB: pb, dual: d } = layout;
      const p = pa[index];
      if (!p) return;
      const lines = [{ label: metaA.label, value: valueFormatA(p.v), color: metaA.color }];
      if (d && pb[index]) {
        lines.push({ label: metaB.label, value: valueFormatB(pb[index].v), color: metaB.color });
      }
      setTip({
        clientX: e.clientX,
        clientY: e.clientY,
        dateDisplay: formatTooltipDate(p.date),
        lines,
        index
      });
    },
    [layout, interactive, metaA, metaB, valueFormatA, valueFormatB]
  );

  if (!layout || layout.empty) {
    return (
      <div className="rounded-lg border border-[#0F4C5C]/40 bg-black py-8 text-center text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  const { width, height: h, pad, n, dA, dB, pointsA, pointsB, dual: isDual, labelIndices } = layout;
  const hitRadius = n > 60 ? 8 : 12;

  return (
    <div className="relative w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${h}`} className="w-full min-w-[320px]" style={{ height: h }}>
        <defs>
          <linearGradient id={`gradA-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metaA.color} stopOpacity="0.25" />
            <stop offset="100%" stopColor={metaA.color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={pad.left}
            x2={width - pad.right}
            y1={pad.top + t * (h - pad.top - pad.bottom)}
            y2={pad.top + t * (h - pad.top - pad.bottom)}
            stroke="#0F4C5C"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
        ))}
        {dA && (
          <path d={dA} fill="none" stroke={metaA.color} strokeWidth="2" strokeLinejoin="round" />
        )}
        {isDual && dB && (
          <path d={dB} fill="none" stroke={metaB.color} strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" />
        )}
        {pointsA.map((p, i) => (
          <circle
            key={`a-${i}`}
            cx={p.x}
            cy={p.y}
            r={n <= 40 ? 3.5 : 2.5}
            fill={metaA.color}
            className={interactive ? 'cursor-pointer' : ''}
            onMouseEnter={interactive ? (e) => showTipAtIndex(e, i) : undefined}
            onMouseMove={interactive ? (e) => setTip((prev) => (prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : null)) : undefined}
            onMouseLeave={interactive ? () => setTip(null) : undefined}
          />
        ))}
        {labelIndices.map((i) => {
          const p = pointsA[i];
          if (!p) return null;
          return (
            <text
              key={`lbl-${i}`}
              x={p.x}
              y={h - 6}
              textAnchor="middle"
              className="fill-slate-500 text-[9px]"
            >
              {p.label}
            </text>
          );
        })}
      </svg>
      <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded" style={{ background: metaA.color }} />
          {metaA.label}
        </span>
        {isDual && metaB && (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-0.5 w-4 rounded border-b border-dashed"
              style={{ borderColor: metaB.color }}
            />
            {metaB.label}
          </span>
        )}
      </div>
      {tip && (
        <div
          className="pointer-events-none fixed z-[200] rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs text-white shadow-xl"
          style={{ left: tip.clientX + 12, top: tip.clientY - 8 }}
        >
          <div className="mb-1 font-medium text-slate-300">{tip.dateDisplay}</div>
          {tip.lines.map((ln) => (
            <div key={ln.label} className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: ln.color }} />
              <span>
                {ln.label}: <span className="font-semibold text-white">{ln.value}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      {interactive && pointsA.map((p, i) => (
        <div
          key={`hit-${i}`}
          role="presentation"
          className="absolute"
          style={{
            left: `${(p.x / width) * 100}%`,
            top: 0,
            width: hitRadius * 2,
            height: h,
            marginLeft: -hitRadius,
            pointerEvents: 'none'
          }}
        />
      ))}
    </div>
  );
};

export default SessionSeriesLineChart;
