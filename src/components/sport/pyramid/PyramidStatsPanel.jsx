import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useWorkout } from '../../../context/WorkoutContext';
import {
  getPyramidStatsDateRange,
  buildDailyPyramidSeriesWithZeros,
  aggregatePyramidByExercise
} from '../../../services/trainingPatterns/pyramidStatsAggregate';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';

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
    return <div className="text-sm text-slate-500">Aucune donnée sur la période.</div>;
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
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[320px] w-full rounded-lg border border-[#0F4C5C]/45 bg-black">
        <text x={pad.l} y={14} fill="#94a3b8" fontSize="11">
          Violet = reps cumul · Cyan = séances pyramide (0 conservés)
        </text>
        {tickIdx.map((i) => (
          <text key={i} x={xAt(i)} y={height - 6} fill="#64748b" fontSize="9" textAnchor="middle">
            {String(pts[i]?.date || '').slice(5)}
          </text>
        ))}
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={height - pad.b} stroke="#334155" strokeWidth="1" />
        <line x1={pad.l} y1={height - pad.b} x2={width - pad.r} y2={height - pad.b} stroke="#334155" strokeWidth="1" />
        <path d={pathR} fill="none" stroke="#a78bfa" strokeWidth="2.2" />
        <path d={pathS} fill="none" stroke="#22d3ee" strokeWidth="2.2" />
      </svg>
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
    <div className="space-y-4">
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-5 w-5 text-violet-300" />
            Statistiques pyramides
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-200">
          <div className="flex flex-wrap gap-2">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRangeKey(r.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs ${
                  rangeKey === r.id
                    ? 'border-violet-500/70 bg-violet-900/35 text-white'
                    : 'border-[#0F4C5C]/50 bg-black text-slate-300'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="text-[11px] text-slate-500">
            Période : {startStr} → {endStr} · {daily.length} jour(s) affiché(s) (points à 0 inclus).
          </div>
          <DualLineChart series={daily} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="text-sm">Top reps (pyramides)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {leaders.topByReps.length === 0 ? (
              <div className="text-slate-500">Aucune séance enregistrée sur la période.</div>
            ) : (
              leaders.topByReps.map((row, i) => (
                <div key={row.exerciseId} className="flex justify-between gap-2 text-slate-200">
                  <span>
                    {i + 1}. {row.exerciseName}
                  </span>
                  <span className="font-mono text-violet-200">{row.value} reps</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="text-sm">Top séances pyramide (comptage)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-xs">
            {leaders.topBySessions.length === 0 ? (
              <div className="text-slate-500">Aucune séance enregistrée sur la période.</div>
            ) : (
              leaders.topBySessions.map((row, i) => (
                <div key={row.exerciseId} className="flex justify-between gap-2 text-slate-200">
                  <span>
                    {i + 1}. {row.exerciseName}
                  </span>
                  <span className="font-mono text-cyan-200">{row.value} séances</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PyramidStatsPanel;
