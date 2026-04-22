import React, { useEffect, useMemo, useState } from 'react';
import { Layers } from 'lucide-react';
import { evaluateRunningTrophies } from '../../../services/endurance/runningTrophiesService';
import { evaluateWalkingTrophies } from '../../../services/endurance/walkingTrophiesService';
import { evaluatePushupTrophies } from '../../../services/endurance/pushupTrophiesService';
import { evaluateSimpleEnduranceTrophies } from '../../../services/endurance/simpleEnduranceTrophiesService';
import { useGarminData } from '../../../hooks/useGarminData';
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

function ProgressBar({ pct }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div className="h-full bg-[#0F4C5C]" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

export default function RecapEnduranceTrophiesCompact({ sessions = {}, onOpenCategory = null }) {
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
          activities: loaded?.activities || {}
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
  }, [dbReady, loadAllData]);

  const runningEval = useMemo(
    () =>
      evaluateRunningTrophies({
        runningSessions: sessions?.running || [],
        garminById
      }),
    [sessions?.running, garminById]
  );
  const walkingEval = useMemo(
    () => evaluateWalkingTrophies(sessions?.running || [], walkingSupplemental),
    [sessions?.running, walkingSupplemental]
  );
  const pushupsEval = useMemo(
    () => evaluatePushupTrophies({ sessions: sessions?.pushups || [] }),
    [sessions?.pushups]
  );
  const jumpropeEval = useMemo(
    () => evaluateSimpleEnduranceTrophies({ activityType: 'jumprope', sessions: sessions?.jumprope || [] }),
    [sessions?.jumprope]
  );
  const gainageEval = useMemo(
    () => evaluateSimpleEnduranceTrophies({ activityType: 'gainage', sessions: sessions?.gainage || [] }),
    [sessions?.gainage]
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
    <div className="rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="rounded-lg bg-[#0F4C5C]/25 p-2">
          <Layers className="h-4 w-4 text-sky-300" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">Trophees Defis</h3>
          <p className="text-[11px] text-teal-200/75">
            {global.unlocked}/{global.total} debloques
          </p>
        </div>
      </div>
      <div className="mb-3">
        <ProgressBar pct={globalPct} />
        <p className="mt-1 text-[10px] text-teal-300/65">
          {global.unlockedLevels}/{global.totalLevels} paliers debloques
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {categories.map((c) => {
          const pct = c.stats.total ? (c.stats.unlocked / c.stats.total) * 100 : 0;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpenCategory?.(c.id)}
              className="rounded-lg border border-[#0F4C5C]/45 bg-black p-2 text-left transition hover:border-[#1E7FA3]/75 hover:bg-[#0F4C5C]/10"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-white">{c.label}</span>
                <span className="text-xs font-semibold text-sky-200">
                  {c.stats.unlocked}/{c.stats.total}
                </span>
              </div>
              <div className="mt-1">
                <ProgressBar pct={pct} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

