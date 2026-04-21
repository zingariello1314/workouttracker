/**
 * Graphiques 7 jours : quêtes, lecture, sport (Garmin).
 */

import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { BarChart3 } from 'lucide-react';

const chartWrap =
  'rounded-lg border border-slate-700/50 bg-slate-950/40 p-3 min-w-0 overflow-hidden';

const QuestTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-white capitalize">{d.fullLabel}</div>
      {d.questTotal > 0 ? (
        <p className="mt-1 text-slate-300">
          Quêtes : {d.questCompleted}/{d.questTotal} ({d.questRate} %)
        </p>
      ) : (
        <p className="mt-1 text-slate-500">Aucune quête ce jour-là</p>
      )}
    </div>
  );
};

const ReadingTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-white capitalize">{d.fullLabel}</div>
      <p className="mt-1 text-slate-300">
        {d.readingMinutes} min · {d.readingPages} p. · {d.readingPagesPerHour || 0} p/h
      </p>
      <p className="text-slate-500">
        Livres: {Array.isArray(d.readingBooks) && d.readingBooks.length > 0 ? d.readingBooks.join(', ') : '—'}
      </p>
    </div>
  );
};

/** Évite width/height -1 de Recharts quand le parent n’a pas encore de largeur (flex / onglet caché). */
function ResponsiveChartShell({ children }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(0);
  const height = 200;
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const measure = () => {
      const w = el.getBoundingClientRect().width;
      setWidth(Math.max(0, Math.floor(w)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={wrapRef} className="h-[200px] w-full min-h-[200px] min-w-0">
      {width > 2 ? (
        <ResponsiveContainer width={width} height={height} debounce={32}>
          {children}
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center text-[10px] text-slate-600" aria-hidden>
          …
        </div>
      )}
    </div>
  );
}

const SportTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-slate-600 bg-slate-900/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-white capitalize">{d.fullLabel}</div>
      <p className="mt-1 text-slate-300">
        Intensité : {d.sportIntensity} min · {d.sportSteps.toLocaleString('fr-FR')} pas
      </p>
      <p className="text-slate-500">{d.sportActivities} activité(s) enregistrée(s)</p>
      <p className="text-slate-500">
        Reps: {d.sportReps} · Exos: {d.sportCheckedExercises} · Endurance: {d.sportEnduranceSessions} · Défis: {d.sportValidatedChallenges}
      </p>
    </div>
  );
};

const MomentumWeekCharts = ({ chartData, weekRangeLabel }) => {
  const hasAnySport = useMemo(
    () => chartData.some((d) => d.sportIntensity > 0 || d.sportSteps > 0 || d.sportActivities > 0),
    [chartData]
  );

  if (!chartData.length) return null;

  return (
    <div className="border-t border-slate-700/50 pt-5 mt-5 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-cyan-400/90" aria-hidden />
        <h4 className="text-sm font-semibold text-white">Vue hebdomadaire</h4>
        <span className="text-xs text-slate-500">{weekRangeLabel}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <div className={chartWrap}>
          <p className="text-xs font-medium text-purple-300/90 mb-2">Taux de complétion des quêtes (%)</p>
          <ResponsiveChartShell>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.35)" />
              <XAxis dataKey="shortLabel" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} width={32} axisLine={{ stroke: '#475569' }} />
              <Tooltip content={<QuestTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
              <Bar dataKey="questRate" fill="#a78bfa" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveChartShell>
        </div>

        <div className={chartWrap}>
          <p className="text-xs font-medium text-indigo-300/90 mb-2">Lecture (minutes / jour)</p>
          <ResponsiveChartShell>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.35)" />
              <XAxis dataKey="shortLabel" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} width={36} axisLine={{ stroke: '#475569' }} allowDecimals={false} />
              <Tooltip content={<ReadingTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
              <Bar dataKey="readingMinutes" fill="#818cf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveChartShell>
        </div>

        <div className={chartWrap}>
          <p className="text-xs font-medium text-rose-300/90 mb-2">Sport — intensité (min) & pas (k)</p>
          <ResponsiveChartShell>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(71,85,105,0.35)" />
              <XAxis dataKey="shortLabel" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={{ stroke: '#475569' }} />
              <YAxis yAxisId="left" tick={{ fill: '#94a3b8', fontSize: 10 }} width={32} axisLine={{ stroke: '#475569' }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                width={36}
                axisLine={{ stroke: '#475569' }}
              />
              <Tooltip content={<SportTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
              <Bar yAxisId="left" dataKey="sportIntensity" name="Intensité" fill="#fb7185" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar yAxisId="right" dataKey="stepsK" name="Pas (k)" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveChartShell>
          {!hasAnySport ? (
            <p className="text-[11px] text-slate-500 mt-2">Aucune donnée Garmin sur cette période — synchronise ta montre.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MomentumWeekCharts;
