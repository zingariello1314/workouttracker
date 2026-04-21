/**
 * Graphiques 7 jours : quêtes, lecture, sport (Garmin).
 * Chartes couleur alignées sur Quêtes (or), Livres (bleu), Sport (teal).
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

const questChartWrap =
  'rounded-lg border border-amber-500/35 bg-black p-3 min-w-0 overflow-hidden shadow-[0_0_20px_rgba(234,179,8,0.06)]';
const readingChartWrap =
  'rounded-lg border border-sky-500/40 bg-black p-3 min-w-0 overflow-hidden shadow-[0_0_20px_rgba(14,165,233,0.08)]';
const sportChartWrap =
  'rounded-lg border border-teal-600/45 bg-black p-3 min-w-0 overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.08)]';

const QuestTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-amber-600/50 bg-black/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-amber-50 capitalize">{d.fullLabel}</div>
      {d.questTotal > 0 ? (
        <p className="mt-1 text-amber-200/90">
          Quêtes : {d.questCompleted}/{d.questTotal} ({d.questRate} %)
        </p>
      ) : (
        <p className="mt-1 text-amber-200/50">Aucune quête ce jour-là</p>
      )}
    </div>
  );
};

const ReadingTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-sky-500/45 bg-black/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-sky-50 capitalize">{d.fullLabel}</div>
      <p className="mt-1 text-sky-200/90">
        {d.readingMinutes} min · {d.readingPages} p. · {d.readingPagesPerHour || 0} p/h
      </p>
      <p className="text-sky-300/60">
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
    <div className="rounded-lg border border-teal-600/50 bg-black/95 px-3 py-2 text-xs shadow-lg">
      <div className="font-semibold text-teal-50 capitalize">{d.fullLabel}</div>
      <p className="mt-1 text-teal-200/90">
        Intensité : {d.sportIntensity} min · {d.sportSteps.toLocaleString('fr-FR')} pas
      </p>
      <p className="text-teal-300/55">{d.sportActivities} activité(s) enregistrée(s)</p>
      <p className="text-teal-300/55">
        Reps: {d.sportReps} · Exos: {d.sportCheckedExercises} · Endurance: {d.sportEnduranceSessions} · Défis:{' '}
        {d.sportValidatedChallenges}
      </p>
    </div>
  );
};

const axisMuted = { fill: '#94a3b8', fontSize: 10 };
const gridQuest = 'rgba(245, 158, 11, 0.12)';
const gridReading = 'rgba(56, 189, 248, 0.12)';
const gridSport = 'rgba(45, 212, 191, 0.12)';

const MomentumWeekCharts = ({ chartData, weekRangeLabel }) => {
  const hasAnySport = useMemo(
    () => chartData.some((d) => d.sportIntensity > 0 || d.sportSteps > 0 || d.sportActivities > 0),
    [chartData]
  );

  if (!chartData.length) return null;

  return (
    <div className="border-t border-slate-800/60 pt-5 mt-5 min-w-0">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-teal-400/90" aria-hidden />
        <h4 className="text-sm font-semibold text-white">Vue hebdomadaire</h4>
        <span className="text-xs text-slate-500">{weekRangeLabel}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
        <div className={questChartWrap}>
          <p className="text-xs font-medium text-amber-200/95 mb-2">Taux de complétion des quêtes (%)</p>
          <ResponsiveChartShell>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridQuest} />
              <XAxis dataKey="shortLabel" tick={axisMuted} axisLine={{ stroke: 'rgba(245, 158, 11, 0.35)' }} />
              <YAxis domain={[0, 100]} tick={axisMuted} width={32} axisLine={{ stroke: 'rgba(245, 158, 11, 0.35)' }} />
              <Tooltip content={<QuestTooltip />} cursor={{ fill: 'rgba(251, 191, 36, 0.08)' }} />
              <Bar dataKey="questRate" fill="#fbbf24" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveChartShell>
        </div>

        <div className={readingChartWrap}>
          <p className="text-xs font-medium text-sky-200/95 mb-2">Lecture (minutes / jour)</p>
          <ResponsiveChartShell>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridReading} />
              <XAxis dataKey="shortLabel" tick={axisMuted} axisLine={{ stroke: 'rgba(56, 189, 248, 0.35)' }} />
              <YAxis tick={axisMuted} width={36} axisLine={{ stroke: 'rgba(56, 189, 248, 0.35)' }} allowDecimals={false} />
              <Tooltip content={<ReadingTooltip />} cursor={{ fill: 'rgba(56, 189, 248, 0.1)' }} />
              <Bar dataKey="readingMinutes" fill="#38bdf8" radius={[4, 4, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveChartShell>
        </div>

        <div className={sportChartWrap}>
          <p className="text-xs font-medium text-teal-200/95 mb-2">Sport — intensité (min) & pas (k)</p>
          <ResponsiveChartShell>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridSport} />
              <XAxis dataKey="shortLabel" tick={axisMuted} axisLine={{ stroke: 'rgba(45, 212, 191, 0.35)' }} />
              <YAxis yAxisId="left" tick={axisMuted} width={32} axisLine={{ stroke: 'rgba(45, 212, 191, 0.35)' }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={axisMuted}
                width={36}
                axisLine={{ stroke: 'rgba(45, 212, 191, 0.35)' }}
              />
              <Tooltip content={<SportTooltip />} cursor={{ fill: 'rgba(45, 212, 191, 0.08)' }} />
              <Bar yAxisId="left" dataKey="sportIntensity" name="Intensité" fill="#14b8a6" radius={[4, 4, 0, 0]} maxBarSize={22} />
              <Bar yAxisId="right" dataKey="stepsK" name="Pas (k)" fill="#2dd4bf" radius={[4, 4, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveChartShell>
          {!hasAnySport ? (
            <p className="text-[11px] text-teal-300/50 mt-2">Aucune donnée Garmin sur cette période — synchronise ta montre.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default MomentumWeekCharts;
