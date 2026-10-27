import React, { useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import {
  getPyramidStatsDateRange,
  buildDailyPyramidSeriesWithZeros,
  aggregatePyramidByExercise
} from '../../../services/trainingPatterns/pyramidStatsAggregate';

const RANGES = [
  { id: 'week', label: '1 semaine' },
  { id: 'month', label: '1 mois' },
  { id: 'quarter', label: '3 mois' },
  { id: 'year', label: '1 an' },
  { id: 'all', label: 'All time' }
];

function DualLineChart({ series }) {
  const width = 720;
  const height = 220;
  const pad = { t: 18, r: 16, b: 28, l: 44 };
  const innerW = width - pad.l - pad.r;
  const innerH = height - pad.t - pad.b;
  const pts = Array.isArray(series) ? series : [];
  if (pts.length === 0) {
    return <div className="empty">Aucune donnée sur la période.</div>;
  }
  const maxR = Math.max(1, ...pts.map((p) => p.reps || 0));
  const maxS = Math.max(1, ...pts.map((p) => p.sessions || 0));
  const n = Math.max(1, pts.length - 1);
  const xAt = (i) => pad.l + (i / n) * innerW;
  const yR = (v) => pad.t + (1 - (v || 0) / maxR) * innerH;
  const yS = (v) => pad.t + (1 - (v || 0) / maxS) * innerH;
  const pathR = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yR(p.reps)}`).join(' ');
  const pathS = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yS(p.sessions)}`).join(' ');
  const tickIdx = [0, Math.floor(n / 2), n];
  return (
    <div className="tw">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart" style={{ minWidth: 320 }}>
        {tickIdx.map((i) => (
          <text key={i} x={xAt(i)} y={height - 6} textAnchor="middle">
            {String(pts[i]?.date || '').slice(5)}
          </text>
        ))}
        <line className="gr" x1={pad.l} y1={pad.t} x2={pad.l} y2={height - pad.b} />
        <line className="gr" x1={pad.l} y1={height - pad.b} x2={width - pad.r} y2={height - pad.b} />
        <path className="ln" d={pathR} />
        <path d={pathS} style={{ fill: 'none', stroke: 'var(--t-ef)', strokeWidth: 2.2, strokeDasharray: '5 4' }} />
      </svg>
      <div className="lgd">
        <span>
          <i />
          Reps cumul
        </span>
        <span>
          <i className="d" style={{ borderColor: 'var(--t-ef)' }} />
          Séances pyramide (0 conservés)
        </span>
      </div>
    </div>
  );
}

function LeaderList({ title, rows, unit, color }) {
  return (
    <div className="box pad">
      <h3 className="bt" style={{ color }}>{title}</h3>
      <div style={{ marginTop: 14 }}>
        {rows.length === 0 ? (
          <p className="tiny" style={{ margin: '10px 0 0' }}>Aucune séance enregistrée sur la période.</p>
        ) : (
          rows.map((row, i) => (
            <div
              key={row.exerciseId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '9px 0',
                borderTop: '1px solid var(--rule)',
                fontSize: 14
              }}
            >
              <b style={{ fontWeight: 600, minWidth: 0 }}>
                <span className="mono dim" style={{ fontSize: 12 }}>{i + 1}.</span> {row.exerciseName}
              </b>
              <span className="mono num" style={{ color }}>
                {row.value} {unit}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const PyramidStatsPanel = () => {
  const { getCurrentData, data } = useWorkout();
  const live = typeof getCurrentData === 'function' ? getCurrentData() : data;
  const log = Array.isArray(live?.pyramidSessionLog) ? live.pyramidSessionLog : [];
  const [rangeKey, setRangeKey] = useState('month');

  const { startStr, endStr } = useMemo(
    () => getPyramidStatsDateRange(rangeKey, new Date(), log),
    [rangeKey, log]
  );

  const daily = useMemo(
    () => buildDailyPyramidSeriesWithZeros(log, startStr, endStr),
    [log, startStr, endStr]
  );

  const leaders = useMemo(() => aggregatePyramidByExercise(log, startStr, endStr), [log, startStr, endStr]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <section>
        <div className="sec-h">
          <div>
            <h2>Statistiques pyramides</h2>
            <p>
              Période : {startStr} → {endStr} · {daily.length} jour(s) affiché(s) (points à 0 inclus).
            </p>
          </div>
          <div className="chips">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                className="chip"
                aria-pressed={rangeKey === r.id}
                onClick={() => setRangeKey(r.id)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <DualLineChart series={daily} />
      </section>

      <section className="split2">
        <LeaderList title="Top reps (pyramides)" rows={leaders.topByReps} unit="reps" color="var(--accent)" />
        <LeaderList title="Top séances pyramide (comptage)" rows={leaders.topBySessions} unit="séances" color="var(--t-ef)" />
      </section>
    </div>
  );
};

export default PyramidStatsPanel;
