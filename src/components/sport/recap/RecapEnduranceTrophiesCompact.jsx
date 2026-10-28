import React, { useEffect, useMemo, useState } from 'react';
import { evaluateRunningTrophies } from '../../../services/endurance/runningTrophiesService';
import { evaluateWalkingTrophies } from '../../../services/endurance/walkingTrophiesService';
import { evaluatePushupTrophies } from '../../../services/endurance/pushupTrophiesService';
import { evaluateSimpleEnduranceTrophies } from '../../../services/endurance/simpleEnduranceTrophiesService';
import { useGarminData } from '../../../hooks/useGarminData';
import { useWorkout } from '../../../context/WorkoutContext';
import { buildAllTimeWalkingFromSteps } from '../../../utils/sport/walkingFromSteps';

function summarize(results = []) {
  const total = results.length;
  const unlocked = results.filter((r) => (r.levels || []).some((lvl) => Boolean(lvl?.unlocked))).length;
  const unlockedLevels = results.reduce(
    (sum, r) => sum + (r.levels || []).filter((lvl) => Boolean(lvl?.unlocked)).length,
    0
  );
  const totalLevels = results.reduce((sum, r) => sum + (r.levels || []).length, 0);
  return { total, unlocked, unlockedLevels, totalLevels };
}

const TROPHY_TONES = ['var(--a5)', 'var(--a2)', 'var(--a3)', 'var(--a1)', 'var(--d)'];

export default function RecapEnduranceTrophiesCompact({ sessions = {}, onOpenCategory = null }) {
  const { data: workoutData } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [garminById, setGarminById] = useState(() => new Map());
  const [walkingSupplemental, setWalkingSupplemental] = useState({ walkKmAllTime: 0, stepsAllTime: 0 });

  useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;
    (async () => {
      try {
        const loaded = await loadAllData();
        if (cancelled) return;
        const cardio = Array.isArray(loaded?.activities?.cardio) ? loaded.activities.cardio : [];
        const byId = new Map();
        cardio.forEach((act) => {
          const id = act?.garminId ?? act?.id;
          if (id == null) return;
          byId.set(String(id), act);
        });
        setGarminById(byId);
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
        if (!cancelled) {
          setGarminById(new Map());
          setWalkingSupplemental({ walkKmAllTime: 0, stepsAllTime: 0 });
        }
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
        garminById,
        workoutAggregate: workoutData
      }),
    [sessions?.running, garminById, workoutData]
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
      { id: 'running', label: 'Course', stats: summarize(runningEval?.results || []) },
      { id: 'walking', label: 'Marche', stats: summarize(walkingEval?.results || []) },
      { id: 'pushups', label: 'Pompes', stats: summarize(pushupsEval?.results || []) },
      { id: 'jumprope', label: 'Corde', stats: summarize(jumpropeEval?.results || []) },
      { id: 'gainage', label: 'Gainage', stats: summarize(gainageEval?.results || []) }
    ],
    [runningEval?.results, walkingEval?.results, pushupsEval?.results, jumpropeEval?.results, gainageEval?.results]
  );

  const global = useMemo(
    () =>
      categories.reduce(
        (acc, c) => ({
          total: acc.total + c.stats.total,
          unlocked: acc.unlocked + c.stats.unlocked,
          unlockedLevels: acc.unlockedLevels + c.stats.unlockedLevels,
          totalLevels: acc.totalLevels + c.stats.totalLevels
        }),
        { total: 0, unlocked: 0, unlockedLevels: 0, totalLevels: 0 }
      ),
    [categories]
  );
  const globalPct = global.total ? (global.unlocked / global.total) * 100 : 0;

  return (
    <div className="trp">
      <div>
        <div className="th2">
          <span className="ico" />
          <h3>Trophees Defis</h3>
        </div>
        <div className="big">
          <em>{global.unlocked}</em>/{global.total} debloques
        </div>
        <div className="gz">
          <i style={{ '--w': `${globalPct}%`, '--c': 'var(--a1)' }} />
        </div>
        <div className="cap">
          {global.unlockedLevels}/{global.totalLevels} paliers debloques
        </div>
      </div>
      <div className="trl">
        {categories.map((c, index) => {
          const pct = c.stats.total ? (c.stats.unlocked / c.stats.total) * 100 : 0;
          const tone = TROPHY_TONES[index % TROPHY_TONES.length];
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpenCategory?.(c.id)}
              className={c.stats.unlocked ? '' : 'z'}
              style={{ '--c': tone }}
            >
              <div className="r">
                <span>{c.label}</span>
                <b>
                  {c.stats.unlocked}/{c.stats.total}
                </b>
              </div>
              <div className="gz">
                <i style={{ '--w': `${pct}%`, '--c': tone }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

