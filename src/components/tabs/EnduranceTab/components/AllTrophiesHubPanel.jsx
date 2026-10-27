import React, { useEffect, useMemo, useState } from 'react';
import { Trophy } from 'lucide-react';
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
    <div className="meter">
      <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
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

  return (
    <div>
      <section className="thead">
        <div>
          <div className="kicker">Défis / Trophées</div>
          <h2>
            Tous mes
            <br />
            <span>trophées</span>
          </h2>
          <p>Suivi global et par discipline de tous les trophées Défis.</p>
        </div>
        <div>
          <span className="lab">Progression globale</span>
          <div className="xp num">
            {totals.all.unlocked}
            <span style={{ fontSize: '0.4em', color: 'var(--bone-3)' }}>/{totals.all.total}</span>
          </div>
          <div className="tstat">
            <div>
              <span className="lab">Débloqués</span>
              <b className="num">{globalProgress.toFixed(0)}%</b>
              <ProgressBar value={globalProgress} />
            </div>
            <div>
              <span className="lab">Paliers</span>
              <b className="num">
                {totals.all.unlockedLevels}
                <i>/{totals.all.totalLevels}</i>
              </b>
              <div className="tiny">paliers débloqués</div>
            </div>
          </div>
        </div>
      </section>

      <div className="defis-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={subTab === 'overview'} onClick={() => setSubTab('overview')}>
          Vue globale
        </button>
        {totals.merged.map((c) => (
          <button key={c.id} type="button" role="tab" aria-selected={subTab === c.id} onClick={() => setSubTab(c.id)}>
            {c.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' ? (
        <div className="tgrid">
          {totals.merged.map((c) => {
            const pct = c.stats.total ? (c.stats.unlocked / c.stats.total) * 100 : 0;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => onOpenCategoryTrophies?.(c.id)}
                className="box tro"
                style={{ textAlign: 'left', cursor: 'pointer', color: 'inherit', font: 'inherit' }}
              >
                <div className="top">
                  <h3>{c.label}</h3>
                  <Trophy style={{ width: 18, height: 18, color: 'var(--accent)' }} />
                </div>
                <div>
                  <b className="num" style={{ font: '800 44px/1 var(--f-disp)', display: 'block' }}>
                    {c.stats.unlocked}
                    <span style={{ fontSize: 15, color: 'var(--bone-3)', marginLeft: 5 }}>/{c.stats.total}</span>
                  </b>
                  <ProgressBar value={pct} />
                  <div className="tiny num">{c.stats.unlockedLevels}/{c.stats.totalLevels} paliers</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : currentCategory ? (
        <article className="box tro">
          <div className="top">
            <h3>{currentCategory.label}</h3>
            <span className="pill">
              {currentCategory.stats.unlocked}/{currentCategory.stats.total} trophées
            </span>
          </div>
          <div>
            <ProgressBar value={categoryProgress} />
            <div className="tiny num">
              {currentCategory.stats.unlockedLevels}/{currentCategory.stats.totalLevels} paliers débloqués
            </div>
          </div>
        </article>
      ) : null}
    </div>
  );
}
