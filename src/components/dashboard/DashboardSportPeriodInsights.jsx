import { useEffect, useMemo, useState } from 'react';
import { Activity, Dumbbell, Footprints, Target } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';
import { useGarminData } from '../../hooks/useGarminData';
import { buildRecapStrengthCompareModel } from '../../utils/sport/recapStrengthPeriodStats';
import { getRecapDateWindow } from '../../utils/sport/recapMuscleLoadEngine';
import { RECAP_VIEW_PERIODS, readStoredRecapViewPeriod } from '../../utils/sport/recapViewPeriods';
import {
  summarizeCardioLoadInWindow,
  summarizeStrengthLoadInWindow,
  computeCardioVsStrengthShares
} from '../../utils/sport/sportPeriodInsights';

const DASHBOARD_SPORT_INSIGHTS_LS = 'dashboard.sportInsights.period';

const MUSCLE_LABEL_FR = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  biceps: 'Biceps',
  triceps: 'Triceps',
  legs: 'Jambes',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  calves: 'Mollets',
  tibialis_anterior: 'Tibial antérieur',
  core: 'Gainage / core',
  full_body: 'Corps entier'
};

function muscleLabel(key) {
  return MUSCLE_LABEL_FR[key] || key;
}

/**
 * @param {{
 *   variant?: 'standalone' | 'embeddedInStrength',
 *   period?: string,
 *   onPeriodChange?: (id: string) => void
 * }} props
 */
export default function DashboardSportPeriodInsights({
  variant = 'standalone',
  period: periodProp,
  onPeriodChange
}) {
  const isEmbedded = variant === 'embeddedInStrength';
  const t = useTranslation();
  const { getCurrentData, getExerciseNameById } = useWorkout();
  const { dbReady, loadAllData } = useGarminData();
  const [activities, setActivities] = useState({ cardio: [], jumpRope: [] });
  const [dailyMetrics, setDailyMetrics] = useState({});
  const [standalonePeriod, setStandalonePeriod] = useState(() =>
    readStoredRecapViewPeriod(DASHBOARD_SPORT_INSIGHTS_LS, '30d')
  );

  const period = isEmbedded && periodProp != null ? periodProp : standalonePeriod;
  const setPeriod =
    isEmbedded && typeof onPeriodChange === 'function'
      ? onPeriodChange
      : isEmbedded
        ? () => {}
        : setStandalonePeriod;

  useEffect(() => {
    if (isEmbedded) return;
    try {
      window.localStorage.setItem(DASHBOARD_SPORT_INSIGHTS_LS, standalonePeriod);
    } catch {
      /* ignore */
    }
  }, [standalonePeriod, isEmbedded]);

  useEffect(() => {
    let alive = true;
    if (!dbReady) return;
    (async () => {
      try {
        const loaded = await loadAllData();
        if (!alive) return;
        setActivities({
          cardio: loaded?.activities?.cardio || [],
          jumpRope: loaded?.activities?.jumpRope || []
        });
        setDailyMetrics(loaded?.dailyMetrics || {});
      } catch {
        if (alive) {
          setActivities({ cardio: [], jumpRope: [] });
          setDailyMetrics({});
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [dbReady, loadAllData]);

  const snapshot = getCurrentData?.() || {};
  const refDate = new Date();

  const model = useMemo(
    () => buildRecapStrengthCompareModel(snapshot, period, getExerciseNameById, refDate, 8),
    [snapshot, period, getExerciseNameById]
  );

  const win = useMemo(() => getRecapDateWindow(period, refDate), [period]);
  const winAllTime = useMemo(() => getRecapDateWindow('all', refDate), [refDate]);

  const cardio = useMemo(
    () => summarizeCardioLoadInWindow(activities, snapshot?.enduranceData || {}, winAllTime, dailyMetrics),
    [activities, snapshot?.enduranceData, winAllTime, dailyMetrics]
  );

  const strength = useMemo(
    () => summarizeStrengthLoadInWindow(snapshot, winAllTime),
    [snapshot, winAllTime]
  );

  const shares = useMemo(
    () => computeCardioVsStrengthShares(cardio, strength),
    [cardio, strength]
  );

  const border = 'border-[#0F4C5C]/55';
  const labelCls = 'text-[10px] font-semibold uppercase tracking-wide text-teal-300/90';

  const inner = (
    <>
      {!isEmbedded ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Target className="h-4 w-4 text-teal-400 shrink-0" />
              Synthèse période (muscu & endurance)
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {RECAP_VIEW_PERIODS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                aria-pressed={period === p.id}
                className={`rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                  period === p.id
                    ? 'border-[#0F5C45] bg-[#0F5C45]/35 text-white'
                    : 'border-[#0F4C5C]/60 bg-black text-teal-200/90 hover:border-[#0F5C45]/60'
                }`}
              >
                {t(p.labelKey)}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-teal-300/90">
          <Target className="h-3.5 w-3.5 text-teal-400 shrink-0" />
          Synthèse période (muscu & endurance)
          <span className="font-normal normal-case text-teal-200/55">· même plage que ci-dessus</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className={`rounded-lg border ${border} bg-black/80 p-2`}>
          <div className={labelCls}>Top 3 groupes (reps estimées)</div>
          <ol className="mt-1 space-y-1 text-[11px] text-white">
            {(model.top3MuscleGroups || []).length === 0 ? (
              <li className="text-teal-300/55">—</li>
            ) : (
              (model.top3MuscleGroups || []).map((m, i) => (
                <li key={m.group} className="flex justify-between gap-2">
                  <span className="text-teal-100/90 truncate">
                    {i + 1}. {muscleLabel(m.group)}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{m.reps}</span>
                </li>
              ))
            )}
          </ol>
        </div>
        <div className={`rounded-lg border ${border} bg-black/80 p-2`}>
          <div className={labelCls}>Top 3 exercices (reps)</div>
          <ol className="mt-1 space-y-1 text-[11px] text-white">
            {(model.top3Exercises || []).length === 0 ? (
              <li className="text-teal-300/55">—</li>
            ) : (
              (model.top3Exercises || []).map((ex, i) => (
                <li key={String(ex.id)} className="flex justify-between gap-2">
                  <span className="text-teal-100/90 truncate" title={ex.name || ex.id}>
                    {i + 1}.{' '}
                    {ex.isEndurancePushups
                      ? 'Pompes (endurance)'
                      : ex.name && String(ex.name).trim()
                        ? ex.name
                        : `Ex. ${ex.id}`}
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">{Math.round(ex.reps)}</span>
                </li>
              ))
            )}
          </ol>
        </div>
      </div>

      <div className={`rounded-lg border ${border} bg-black/80 p-2 space-y-2`}>
        <div className={labelCls}>Jours cardio vs street (pondéré)</div>
        <div className="flex h-2 w-full overflow-hidden rounded-full bg-teal-950">
          <div
            className="h-full bg-teal-400/90 transition-all"
            style={{ width: `${shares.cardioPct}%` }}
            title={`Cardio ${shares.cardioPct}%`}
          />
          <div
            className="h-full bg-slate-600/90 transition-all"
            style={{ width: `${shares.strengthPct}%` }}
            title={`Muscu / street ${shares.strengthPct}%`}
          />
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-teal-100/85">
          <span className="inline-flex items-center gap-1">
            <Activity className="h-3 w-3 text-teal-400" /> Cardio {shares.cardioPct}%
          </span>
          <span className="inline-flex items-center gap-1">
            <Dumbbell className="h-3 w-3 text-slate-300" /> Street / muscu {shares.strengthPct}%
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] text-teal-200/80">
          <div className="flex items-center gap-1">
            <Footprints className="h-3 w-3 shrink-0" />
            Course {cardio.runKm.toFixed(1)} km → {shares.runPct}% du bloc cardio
          </div>
          <div>Marche {cardio.walkKm.toFixed(1)} km → {shares.walkPct}%</div>
          <div>Corde ~{Math.round(cardio.jumpMin)} min → {shares.jumpPct}%</div>
          <div>
            Jours cardio {shares.cardioDays} · jours street {shares.strengthDays}
          </div>
          <div>
            Difficulté cardio ~{shares.cardioAvgDifficulty05.toFixed(1)}/5
          </div>
          <div>
            Difficulté street ~{shares.strengthAvgDifficulty05.toFixed(1)}/5
          </div>
          <div className="text-teal-300/55">Calcul all-time (calendrier): pourcentage basé uniquement sur le nombre de jours actifs.</div>
        </div>
      </div>
    </>
  );

  if (isEmbedded) {
    return <div className="mt-3 space-y-3 border-t border-[#0F4C5C]/45 pt-3">{inner}</div>;
  }

  return <div className={`rounded-xl border-2 ${border} bg-black p-3 space-y-3`}>{inner}</div>;
}
