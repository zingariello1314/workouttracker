import React, { useMemo, useState, useRef, useEffect } from 'react';
import { TrendingDown, TrendingUp, Minus, ChevronRight } from 'lucide-react';
import DenseDailyLineChart from '../charts/DenseDailyLineChart';
import {
  collectDistinctExercisesInWindow,
  collectEnrichedExerciseHistory,
  analyzeExerciseProgressionHistory,
  buildExerciseChartSeries
} from '../../../utils/sport/recapExerciseProgressionAnalysis';

const STATUS_STYLES = {
  rising: { icon: TrendingUp, tone: 'ok' },
  regression: { icon: TrendingDown, tone: 'bad' },
  stall: { icon: Minus, tone: 'warn' },
  single: { icon: Minus, tone: 'dim' },
  insufficient: { icon: Minus, tone: 'dim' }
};

function formatSessionLine(session, profile) {
  const pattern = profile?.pattern;
  const inferenceHint = profile?.isEstimated ? ' · estimé' : profile?.inferenceLabel === 'Séries saisies' ? '' : '';

  if (session.isHold) {
    const sec = session.maxHoldSeconds || session.totalReps;
    const hold =
      sec >= 60
        ? `${Math.floor(sec / 60)} min${sec % 60 ? ` ${sec % 60} s` : ''}`
        : `${sec} s`;
    if (pattern) return `${pattern}${inferenceHint}`;
    return session.schemeLabel ? `${session.schemeLabel} · ${hold}` : hold;
  }

  if (pattern && pattern.includes(' - ')) {
    const weightSuffix = session.avgWeight > 0 ? ` @ ~${Math.round(session.avgWeight)} kg` : '';
    return `${pattern.replace(/ - /g, ' / ')}${weightSuffix}${inferenceHint}`;
  }
  if (session.schemeLabel) return `${session.schemeLabel}${inferenceHint}`;
  if (session.avgWeight > 0) {
    return `${session.setCount}×${Math.round(session.totalReps / Math.max(1, session.setCount))} @ ~${Math.round(session.avgWeight)} kg${inferenceHint}`;
  }
  return `${session.totalReps} reps · ${session.setCount} série${session.setCount > 1 ? 's' : ''}${inferenceHint}`;
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

  const analysis = useMemo(
    () => analyzeExerciseProgressionHistory(history, snapshot, getExerciseNameById),
    [history, snapshot, getExerciseNameById]
  );
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
    <section ref={containerRef} className="rb-prog">
      <div className="sh">
        <h2>Progression par exercice</h2>
      </div>
      <div className="pnl">
        <p className="sbt">
          Recherchez un exercice réalisé sur la période{periodLabel ? ` (${periodLabel})` : ''} — reps,
          charge et interprétation.
        </p>
        <label className="sf">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setListOpen(true);
            }}
            onFocus={() => setListOpen(true)}
            placeholder="Chercher un exercice…"
            className="w-full"
            aria-label="Rechercher un exercice"
            aria-expanded={listOpen}
            aria-autocomplete="list"
          />
          {listOpen && filtered.length > 0 ? (
            <ul
              className="suggest"
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
        </label>

        {!selectedExercise ? (
          <p className="hint">
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
                <span className={`rb-chip ${statusStyle.tone}`}>
                  <StatusIcon size={12} />
                  {analysis.headline}
                </span>
              ) : null}
            </div>

            {analysis.setHabits?.metrics?.length > 0 ? (
              <div className="rb-chip-row">
                {analysis.setHabits.profileLabel ? (
                  <span className="rb-chip ok">{analysis.setHabits.profileLabel}</span>
                ) : null}
                {analysis.setHabits.metrics.map((m) => (
                  <span key={m.key} className="rb-chip dim">
                    {m.label} : <b>{m.value}</b>
                  </span>
                ))}
              </div>
            ) : null}

            {analysis.detail ? (
              <div className={`rb-note ${statusStyle.tone}`}>
                {analysis.detail}
                {analysis.bullets?.length > 0 ? (
                  <ul className="rb-note-list">
                    {analysis.bullets.map((b) => (
                      <li key={b}>
                        <ChevronRight size={12} aria-hidden />
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

            <div className="rb-hist">
              <div className="rb-hist-h">Historique séances</div>
              <ul className="rb-hist-list">
                {[...history].reverse().map((s) => {
                  const profile = analysis.setHabits?.sessionProfiles?.find(
                    (p) => p.storageKey === s.storageKey
                  );
                  return (
                    <li key={s.storageKey}>
                      <span className="rb-hist-d">{s.dateYmd}</span>
                      <div className="rb-hist-v">
                        <span>{formatSessionLine(s, profile)}</span>
                        {profile?.isEstimated && profile.inferenceLabel ? (
                          <em>{profile.inferenceLabel}</em>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
