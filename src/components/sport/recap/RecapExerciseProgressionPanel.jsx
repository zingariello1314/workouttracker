import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Search, TrendingDown, TrendingUp, Minus, ChevronRight } from 'lucide-react';
import DenseDailyLineChart from '../charts/DenseDailyLineChart';
import {
  collectDistinctExercisesInWindow,
  collectEnrichedExerciseHistory,
  analyzeExerciseProgressionHistory,
  buildExerciseChartSeries
} from '../../../utils/sport/recapExerciseProgressionAnalysis';

const STATUS_STYLES = {
  rising: {
    icon: TrendingUp,
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-200',
    badge: 'bg-emerald-500/20 text-emerald-100'
  },
  regression: {
    icon: TrendingDown,
    border: 'border-rose-500/40',
    bg: 'bg-rose-950/25',
    text: 'text-rose-200',
    badge: 'bg-rose-500/20 text-rose-100'
  },
  stall: {
    icon: Minus,
    border: 'border-amber-500/40',
    bg: 'bg-amber-950/25',
    text: 'text-amber-200',
    badge: 'bg-amber-500/20 text-amber-100'
  },
  single: {
    icon: Minus,
    border: 'border-slate-500/40',
    bg: 'bg-slate-950/30',
    text: 'text-slate-300',
    badge: 'bg-slate-500/20 text-slate-200'
  },
  insufficient: {
    icon: Minus,
    border: 'border-slate-500/40',
    bg: 'bg-slate-950/30',
    text: 'text-slate-400',
    badge: 'bg-slate-500/20 text-slate-300'
  }
};

function formatSessionLine(session) {
  if (session.isHold) {
    const sec = session.maxHoldSeconds || session.totalReps;
    const hold =
      sec >= 60
        ? `${Math.floor(sec / 60)} min${sec % 60 ? ` ${sec % 60} s` : ''}`
        : `${sec} s`;
    return session.schemeLabel ? `${session.schemeLabel} · ${hold}` : hold;
  }
  if (session.schemeLabel) return session.schemeLabel;
  if (session.avgWeight > 0) {
    return `${session.setCount}×${Math.round(session.totalReps / Math.max(1, session.setCount))} @ ~${Math.round(session.avgWeight)} kg`;
  }
  return `${session.totalReps} reps · ${session.setCount} série${session.setCount > 1 ? 's' : ''}`;
}

export default function RecapExerciseProgressionPanel({
  snapshot,
  window,
  getExerciseNameById,
  periodLabel
}) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [listOpen, setListOpen] = useState(false);
  const containerRef = useRef(null);

  const exercises = useMemo(
    () => collectDistinctExercisesInWindow(snapshot, window, getExerciseNameById),
    [snapshot, window, getExerciseNameById]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises.slice(0, 12);
    return exercises.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 12);
  }, [exercises, query]);

  const selectedExercise = useMemo(
    () => exercises.find((e) => e.exerciseId === selectedId) || null,
    [exercises, selectedId]
  );

  const history = useMemo(() => {
    if (!selectedId || !snapshot) return [];
    return collectEnrichedExerciseHistory(snapshot, selectedId, window, getExerciseNameById);
  }, [selectedId, snapshot, window, getExerciseNameById]);

  const analysis = useMemo(() => analyzeExerciseProgressionHistory(history), [history]);
  const chart = useMemo(() => buildExerciseChartSeries(history), [history]);

  const statusStyle = STATUS_STYLES[analysis.status] || STATUS_STYLES.insufficient;
  const StatusIcon = statusStyle.icon;

  useEffect(() => {
    const onDoc = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setListOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  if (!exercises.length) return null;

  return (
    <section
      ref={containerRef}
      className="rounded-xl border border-[#0F4C5C]/55 bg-gradient-to-br from-slate-950/80 to-black overflow-hidden"
    >
      <div className="border-b border-[#0F4C5C]/35 px-4 py-3">
        <h3 className="text-sm font-bold text-white">Progression par exercice</h3>
        <p className="mt-0.5 text-[11px] text-slate-400 leading-relaxed">
          Recherchez un exercice réalisé sur la période{periodLabel ? ` (${periodLabel})` : ''} — reps,
          charge et interprétation.
        </p>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setListOpen(true);
            }}
            onFocus={() => setListOpen(true)}
            placeholder="Chercher un exercice…"
            className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black/60 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/50 focus:outline-none"
            aria-label="Rechercher un exercice"
            aria-expanded={listOpen}
            aria-autocomplete="list"
          />
          {listOpen && filtered.length > 0 ? (
            <ul
              className="absolute z-20 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[#0F4C5C]/55 bg-slate-950 shadow-xl"
              role="listbox"
            >
              {filtered.map((ex) => (
                <li key={ex.exerciseId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={selectedId === ex.exerciseId}
                    onClick={() => {
                      setSelectedId(ex.exerciseId);
                      setQuery(ex.name);
                      setListOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-teal-950/40"
                  >
                    <span className="truncate">{ex.name}</span>
                    <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                      {ex.sessionCount}× · {ex.totalReps} reps
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {!selectedExercise ? (
          <p className="rounded-lg border border-dashed border-[#0F4C5C]/35 px-3 py-6 text-center text-xs text-slate-500">
            {exercises.length} exercice{exercises.length > 1 ? 's' : ''} enregistré
            {exercises.length > 1 ? 's' : ''} — sélectionnez-en un pour voir la courbe et l&apos;analyse.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{selectedExercise.name}</p>
                <p className="text-[10px] text-slate-500">
                  {analysis.sessionCount} séance{analysis.sessionCount > 1 ? 's' : ''}
                  {analysis.dateRange
                    ? ` · ${analysis.dateRange.start} → ${analysis.dateRange.end}`
                    : ''}
                </p>
              </div>
              {analysis.headline ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle.badge}`}
                >
                  <StatusIcon size={12} />
                  {analysis.headline}
                </span>
              ) : null}
            </div>

            {analysis.detail ? (
              <div className={`rounded-lg border px-3 py-2.5 text-xs leading-relaxed ${statusStyle.border} ${statusStyle.bg} ${statusStyle.text}`}>
                {analysis.detail}
                {analysis.bullets?.length > 0 ? (
                  <ul className="mt-2 space-y-0.5 text-[11px] opacity-90">
                    {analysis.bullets.map((b) => (
                      <li key={b} className="flex gap-1.5">
                        <ChevronRight size={12} className="mt-0.5 shrink-0 opacity-60" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            {history.length >= 2 ? (
              <DenseDailyLineChart
                seriesA={chart.reps}
                seriesB={chart.hasWeight ? chart.weight : null}
                metaA={{
                  label: chart.isHold ? 'Maintien (s)' : 'Reps totales',
                  color: '#2dd4bf'
                }}
                metaB={
                  chart.hasWeight
                    ? { label: 'Charge moy. (kg)', color: '#fbbf24' }
                    : null
                }
                height={160}
                valueFormatA={(v) => (chart.isHold ? `${Math.round(v)} s` : String(Math.round(v)))}
                valueFormatB={(v) => `${Math.round(v * 10) / 10} kg`}
                emptyMessage="Pas assez de points pour tracer la courbe."
                yAxisLabel={chart.isHold ? 's' : 'reps'}
              />
            ) : null}

            <div className="rounded-lg border border-[#0F4C5C]/40 bg-black/50">
              <div className="border-b border-[#0F4C5C]/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
                Historique séances
              </div>
              <ul className="max-h-44 divide-y divide-[#0F4C5C]/20 overflow-y-auto text-[11px]">
                {[...history].reverse().map((s) => (
                  <li key={s.storageKey} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span className="tabular-nums text-slate-400">{s.dateYmd}</span>
                    <span className="min-w-0 truncate text-right font-medium text-teal-100">
                      {formatSessionLine(s)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
