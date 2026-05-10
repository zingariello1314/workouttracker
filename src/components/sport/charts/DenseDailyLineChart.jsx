import React, { useId, useMemo, useState, useCallback } from 'react';

function formatTooltipDate(ymd) {
  if (ymd == null) return '';
  const s = String(ymd).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return String(ymd);
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  try {
    return dt.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return s;
  }
}

/**
 * Graphique ligne : un ou deux jeux de points (échelles Y indépendantes).
 * Séries attendues : tableau de `{ date: 'YYYY-MM-DD', value: number }`.
 */
const DenseDailyLineChart = ({
  seriesA = [],
  seriesB = null,
  metaA = { label: 'Valeur', color: '#14b8a6' },
  metaB = null,
  height = 200,
  valueFormatA = (v) => String(Math.round(v * 10) / 10),
  valueFormatB = (v) => String(Math.round(v)),
  emptyMessage = 'Pas encore assez de données.',
  showTopLabels = false,
  /** Infobulle au survol des points */
  interactive = true
}) => {
  const gradId = useId().replace(/:/g, '');
  const dual = Boolean(seriesB && Array.isArray(seriesB) && seriesB.length && metaB);

  const [tip, setTip] = useState(null);

  const layout = useMemo(() => {
    const ptsA = Array.isArray(seriesA) ? seriesA : [];
    const ptsB = dual && seriesB.length === seriesA.length ? seriesB : [];
    const n = ptsA.length;
    const width = 720;
    const pad = { top: 16, right: dual ? 24 : 14, bottom: 32, left: 24 };

    if (n < 1) {
      return { empty: true };
    }

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

    const labelEvery = n > 45 ? Math.ceil(n / 12) : n > 20 ? 3 : 1;
    const labelIndices = [];
    for (let i = 0; i < n; i += labelEvery) labelIndices.push(i);
    if (n > 1 && labelIndices[labelIndices.length - 1] !== n - 1) labelIndices.push(n - 1);

    const areaA = `${dA} L ${xAt(n - 1)} ${height - pad.bottom} L ${xAt(0)} ${height - pad.bottom} Z`;
    let areaB = '';
    if (dB) {
      areaB = `${dB} L ${xAt(n - 1)} ${height - pad.bottom} L ${xAt(0)} ${height - pad.bottom} Z`;
    }

    const pointsA = ptsA.map((p, i) => ({
      x: xAt(i),
      y: yA(p.value),
      v: Number(p.value) || 0,
      date: String(p.date || '')
    }));
    const pointsB = ptsB.map((p, i) => ({
      x: xAt(i),
      y: yB(p.value),
      v: Number(p.value) || 0,
      date: String(p.date || '')
    }));

    return {
      empty: false,
      width,
      height,
      pad,
      n,
      xAt,
      dA,
      dB,
      areaA,
      areaB,
      maxA,
      maxB,
      ticks: ptsA.map((p, i) => ({ i, x: xAt(i), short: String(p.date).slice(5), fullDate: String(p.date || '') })),
      labelIndices,
      dual,
      pointsA,
      pointsB
    };
  }, [seriesA, seriesB, dual, metaB, height, seriesA?.length]);

  const showTipAtIndex = useCallback(
    (e, index) => {
      if (!layout || layout.empty || !interactive) return;
      const { pointsA: pa, pointsB: pb, dual: d } = layout;
      const p = pa[index];
      if (!p) return;
      const lines = [
        {
          label: metaA.label,
          value: valueFormatA(p.v),
          color: metaA.color
        }
      ];
      if (d && pb[index]) {
        lines.push({
          label: metaB.label,
          value: valueFormatB(pb[index].v),
          color: metaB.color
        });
      }
      setTip({
        clientX: e.clientX,
        clientY: e.clientY,
        dateDisplay: formatTooltipDate(p.date || pa[index]?.date),
        lines,
        index
      });
    },
    [
      interactive,
      layout,
      metaA.label,
      metaA.color,
      metaB,
      valueFormatA,
      valueFormatB
    ]
  );

  const moveTip = useCallback((e) => {
    setTip((prev) => (prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : null));
  }, []);

  const clearTip = useCallback(() => setTip(null), []);

  if (!layout || layout.empty) {
    return (
      <div className="rounded-lg border border-[#0F4C5C]/40 bg-black py-8 text-center text-sm text-slate-500">{emptyMessage}</div>
    );
  }

  const {
    width,
    height: h,
    pad,
    n,
    xAt,
    dA,
    dB,
    areaA,
    areaB,
    maxA,
    maxB,
    ticks,
    labelIndices,
    dual: isDual,
    pointsA,
    pointsB
  } = layout;
  const minH = 160;
  const svgH = Math.max(h, minH);

  const hitRadius = n > 100 ? 9 : n > 50 ? 11 : 14;
  const showDotsAlways = n <= 70;

  return (
    <div className="relative w-full overflow-x-auto rounded-xl border border-[#0F4C5C]/35 bg-gradient-to-b from-[#020617] to-black p-2.5" onMouseLeave={clearTip}>
      <svg
        viewBox={`0 0 ${width} ${svgH}`}
        className="min-w-[320px] w-full h-auto rounded-lg border border-[#0F4C5C]/40 bg-black/90"
        style={{ minHeight: minH }}
      >
        <defs>
          <linearGradient id={`${gradId}-denseAreaA`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={metaA.color} stopOpacity="0.26" />
            <stop offset="100%" stopColor={metaA.color} stopOpacity="0.02" />
          </linearGradient>
          {isDual && metaB ? (
            <linearGradient id={`${gradId}-denseAreaB`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={metaB.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={metaB.color} stopOpacity="0.02" />
            </linearGradient>
          ) : null}
        </defs>
        {showTopLabels ? (
          <>
            <text x={pad.left + 2} y={13} fontSize="9" fill="#64748b">
              {metaA.label} · max {valueFormatA(maxA)}
            </text>
            {isDual && metaB ? (
              <text x={width - pad.right - 2} y={13} fontSize="9" fill="#64748b" textAnchor="end">
                {metaB.label} · max {valueFormatB(maxB)}
              </text>
            ) : null}
          </>
        ) : null}

        <line
          x1={pad.left}
          y1={h - pad.bottom}
          x2={width - pad.right}
          y2={h - pad.bottom}
          stroke="#334155"
          strokeWidth="1"
        />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="#334155" strokeWidth="1" />
        {isDual ? (
          <line
            x1={width - pad.right}
            y1={pad.top}
            x2={width - pad.right}
            y2={h - pad.bottom}
            stroke="#475569"
            strokeWidth="1"
          />
        ) : null}

        {areaA ? <path d={areaA} fill={`url(#${gradId}-denseAreaA)`} stroke="none" /> : null}
        {dA ? (
          <path
            d={dA}
            fill="none"
            stroke={metaA.color}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
        {isDual && dB && metaB ? (
          <>
            {areaB ? <path d={areaB} fill={`url(#${gradId}-denseAreaB)`} stroke="none" /> : null}
            <path
              d={dB}
              fill="none"
              stroke={metaB.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="5 4"
              opacity="0.95"
            />
          </>
        ) : null}

        {interactive &&
          Array.from({ length: n }, (_, i) => (
            <g key={`hit-${i}`}>
              <circle
                cx={xAt(i)}
                cy={pointsA[i].y}
                r={hitRadius}
                fill="transparent"
                className="cursor-crosshair"
                pointerEvents="all"
                onMouseEnter={(e) => showTipAtIndex(e, i)}
                onMouseMove={moveTip}
              />
              {isDual && pointsB[i] ? (
                <circle
                  cx={xAt(i)}
                  cy={pointsB[i].y}
                  r={hitRadius}
                  fill="transparent"
                  className="cursor-crosshair"
                  pointerEvents="all"
                  onMouseEnter={(e) => showTipAtIndex(e, i)}
                  onMouseMove={moveTip}
                />
              ) : null}
            </g>
          ))}

        {pointsA.map((p, idx) =>
          showDotsAlways || tip?.index === idx ? (
            <circle
              key={`pa-${idx}`}
              cx={p.x}
              cy={p.y}
              r={tip?.index === idx ? 3.6 : 1.8}
              fill={metaA.color}
              fillOpacity={tip?.index === idx ? 1 : 0.85}
              stroke="#020617"
              strokeWidth={tip?.index === idx ? 1 : 0}
              pointerEvents="none"
            />
          ) : null
        )}
        {isDual &&
          pointsB.map((p, idx) =>
            showDotsAlways || tip?.index === idx ? (
              <circle
                key={`pb-${idx}`}
                cx={p.x}
                cy={p.y}
                r={tip?.index === idx ? 3.2 : 1.6}
                fill={metaB.color}
                fillOpacity={tip?.index === idx ? 1 : 0.75}
                stroke="#020617"
                strokeWidth={tip?.index === idx ? 1 : 0}
                pointerEvents="none"
              />
            ) : null
          )}

        {ticks
          .filter((t) => labelIndices.includes(t.i))
          .map((t) => (
            <text
              key={`lbl-${t.i}`}
              x={t.x}
              y={svgH - 10}
              fontSize="8"
              fill="#475569"
              textAnchor="middle"
              transform={ticks.length > 24 ? `rotate(-40 ${t.x} ${svgH - 10})` : undefined}
              pointerEvents="none"
            >
              {t.short}
            </text>
          ))}
      </svg>

      {interactive && tip && (
        <div
          role="tooltip"
          className="fixed z-[500] pointer-events-none max-w-[260px] rounded-lg border border-[#0F5C45]/60 bg-[#020617]/95 px-3 py-2 shadow-2xl shadow-black/70 backdrop-blur-sm"
          style={{
            left: tip.clientX + 12,
            top: tip.clientY + 12,
            transform: 'translate(0, 0)'
          }}
        >
          <div className="border-b border-[#0F4C5C]/45 pb-1.5 text-xs font-semibold capitalize leading-snug text-teal-100">
            {tip.dateDisplay}
          </div>
          <div className="mt-2 space-y-1.5">
            {tip.lines.map((line) => (
              <div key={line.label} className="flex items-baseline gap-2 text-[11px]">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: line.color }} />
                <span className="text-slate-400">{line.label}</span>
                <span className="ml-auto font-semibold tabular-nums text-white">{line.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isDual && metaB ? (
        <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-6 rounded" style={{ background: metaA.color }} />
            {metaA.label}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-6 rounded" style={{ background: metaB.color }} />
            {metaB.label}
          </span>
          {interactive ? <span className="text-slate-600">Survolez la courbe pour le détail par jour.</span> : null}
        </div>
      ) : interactive ? (
        <p className="mt-1.5 text-[10px] text-slate-600">Survol : date et valeur du jour.</p>
      ) : null}
    </div>
  );
};

export default DenseDailyLineChart;
