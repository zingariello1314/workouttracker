import React, { useEffect, useMemo, useState } from 'react';
import { Layers, Trophy } from 'lucide-react';
import { evaluateRunningTrophies } from '../../../../services/endurance/runningTrophiesService';
import { evaluateWalkingTrophies } from '../../../../services/endurance/walkingTrophiesService';
import { evaluatePushupTrophies } from '../../../../services/endurance/pushupTrophiesService';
import { evaluateSimpleEnduranceTrophies } from '../../../../services/endurance/simpleEnduranceTrophiesService';
import { useGarminData } from '../../../../hooks/useGarminData';
import { useWorkout } from '../../../../context/WorkoutContext';
import { buildAllTimeWalkingFromSteps } from '../../../../utils/sport/walkingFromSteps';

function summarize(results = []) {
  const total = results.length;
  const unlocked = results.filter((r) => {
    const levels = Array.isArray(r?.levels) ? r.levels : [];
    return levels.some((lvl) => Boolean(lvl?.unlocked));
  }).length;
  const unlockedLevels = results.reduce((sum, r) => {
    const levels = Array.isArray(r?.levels) ? r.levels : [];
    return sum + levels.filter((lvl) => Boolean(lvl?.unlocked)).length;
  }, 0);
  const totalLevels = results.reduce((sum, r) => sum + (Array.isArray(r?.levels) ? r.levels.length : 0), 0);
  return { total, unlocked, unlockedLevels, totalLevels };
}

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full bg-[#0F4C5C]" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export default function AllTrophiesHubPanel({
  sessions = {},
  garminRunningById = new Map(),
  onOpenCategoryTrophies = null
}) {
  const [subTab, setSubTab] = useState('overview');
  const { data: workoutData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [walkingSupplemental, setWalkingSupplemental] = useState({ walkKmAllTime: 0, stepsAllTime: 0 });

  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadAllData();
        if (cancelled) return;
        const computed = buildAllTimeWalkingFromSteps({
          dailyMetrics: loaded?.dailyMetrics || {},
          activities: loaded?.activities || {},
          manualStepsByDate: workoutData?.enduranceData?.manualDailyWalkByDate
        });
        setWalkingSupplemental({
          walkKmAllTime: Number(computed?.totalWalkingKm) || 0,
          stepsAllTime: Number(computed?.totalSteps) || 0
        });
      } catch {
        if (!cancelled) setWalkingSupplemental({ walkKmAllTime: 0, stepsAllTime: 0 });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dbReady, loadAllData, workoutData?.enduranceData?.manualDailyWalkByDate]);

  const runningEval = useMemo(
    () =>
      evaluateRunningTrophies({
        runningSessions: sessions?.running || [],
        garminById: garminRunningById || new Map(),
        workoutAggregate: workoutData
      }),
    [sessions?.running, garminRunningById, workoutData]
  );
  const walkingEval = useMemo(
    () => evaluateWalkingTrophies(sessions?.running || [], walkingSupplemental),
    [sessions?.running, walkingSupplemental]
  );
  const pushupsEval = useMemo(
    () => evaluatePushupTrophies({ sessions: sessions?.pushups || [], workoutAggregate: workoutData }),
    [sessions?.pushups, workoutData]
  );
  const jumpropeEval = useMemo(
    () =>
      evaluateSimpleEnduranceTrophies({
        activityType: 'jumprope',
        sessions: sessions?.jumprope || [],
        workoutAggregate: workoutData
      }),
    [sessions?.jumprope, workoutData]
  );
  const gainageEval = useMemo(
    () =>
      evaluateSimpleEnduranceTrophies({
        activityType: 'gainage',
        sessions: sessions?.gainage || [],
        workoutAggregate: workoutData
      }),
    [sessions?.gainage, workoutData]
  );

  const categories = useMemo(
    () => [
      { id: 'running', label: 'Course', results: runningEval?.results || [] },
      { id: 'walking', label: 'Marche', results: walkingEval?.results || [] },
      { id: 'pushups', label: 'Pompes', results: pushupsEval?.results || [] },
      { id: 'jumprope', label: 'Corde', results: jumpropeEval?.results || [] },
      { id: 'gainage', label: 'Gainage', results: gainageEval?.results || [] }
    ],
    [runningEval?.results, walkingEval?.results, pushupsEval?.results, jumpropeEval?.results, gainageEval?.results]
  );

  const totals = useMemo(() => {
    const merged = categories.map((c) => ({ ...c, stats: summarize(c.results) }));
    const all = merged.reduce(
      (acc, c) => ({
        total: acc.total + c.stats.total,
        unlocked: acc.unlocked + c.stats.unlocked,
        unlockedLevels: acc.unlockedLevels + c.stats.unlockedLevels,
        totalLevels: acc.totalLevels + c.stats.totalLevels
      }),
      { total: 0, unlocked: 0, unlockedLevels: 0, totalLevels: 0 }
    );
    return { merged, all };
  }, [categories]);

  const currentCategory = totals.merged.find((c) => c.id === subTab);
  const categoryProgress = currentCategory?.stats?.total
    ? (currentCategory.stats.unlocked / currentCategory.stats.total) * 100
    : 0;
  const globalProgress = totals.all.total ? (totals.all.unlocked / totals.all.total) * 100 : 0;

  const subButton = (active) =>
    `rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
      active ? 'border-[#0F5C45]/75 bg-[#0F5C45]/25 text-white' : 'border-[#0F4C5C]/50 bg-black text-teal-100 hover:border-[#0F5C45]/60'
    }`;

  return (
    <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-[#0F4C5C]/25 p-3">
            <Layers className="h-7 w-7 text-sky-300" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white">Tous mes trophées</h3>
            <p className="mt-1 text-sm text-teal-200/80">
              Suivi global et par discipline de tous les trophées Défis.
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-center">
          <div className="text-xs uppercase tracking-wide text-sky-200/80">Progression globale</div>
          <div className="text-3xl font-bold text-white tabular-nums">
            {totals.all.unlocked}/{totals.all.total}
          </div>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-[#0F4C5C]/45 bg-black p-4">
        <div className="flex items-center justify-between text-xs text-teal-200/80">
          <span>Débloqués</span>
          <span>{globalProgress.toFixed(0)}%</span>
        </div>
        <ProgressBar value={globalProgress} />
        <div className="text-[11px] text-teal-300/65">
          {totals.all.unlockedLevels}/{totals.all.totalLevels} paliers débloqués
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => setSubTab('overview')} className={subButton(subTab === 'overview')}>
          Vue globale
        </button>
        {totals.merged.map((c) => (
          <button key={c.id} type="button" onClick={() => setSubTab(c.id)} className={subButton(subTab === c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {totals.merged.map((c) => {
            const pct = c.stats.total ? (c.stats.unlocked / c.stats.total) * 100 : 0;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => onOpenCategoryTrophies?.(c.id)}
                className="rounded-xl border border-[#0F4C5C]/45 bg-black p-4 text-left transition hover:border-[#1E7FA3]/70 hover:bg-[#0F4C5C]/10"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-white">{c.label}</div>
                  <Trophy className="h-4 w-4 text-sky-300" />
                </div>
                <div className="text-xl font-bold text-white tabular-nums">
                  {c.stats.unlocked}/{c.stats.total}
                </div>
                <div className="mt-2">
                  <ProgressBar value={pct} />
                </div>
                <div className="mt-1 text-[11px] text-teal-300/65">
                  {c.stats.unlockedLevels}/{c.stats.totalLevels} paliers
                </div>
              </button>
            );
          })}
        </div>
      ) : currentCategory ? (
        <div className="rounded-xl border border-[#0F4C5C]/45 bg-black p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-lg font-semibold text-white">{currentCategory.label}</div>
            <div className="text-sm text-teal-200/80">
              {currentCategory.stats.unlocked}/{currentCategory.stats.total} trophées
            </div>
          </div>
          <ProgressBar value={categoryProgress} />
          <div className="mt-2 text-xs text-teal-300/70">
            {currentCategory.stats.unlockedLevels}/{currentCategory.stats.totalLevels} paliers débloqués
          </div>
        </div>
      ) : null}
    </div>
  );
}

