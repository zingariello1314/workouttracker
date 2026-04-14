import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../utils/translations';
import { useWorkout } from '../../context/WorkoutContext';
import BodyMap from '../sport/recap/BodyMap';
import RecapIntensityLegend from '../sport/recap/RecapIntensityLegend';
import {
  computeRecapMuscleState,
  CARDIO_BLEND,
  DECAY_LAMBDA_PER_DAY
} from '../../utils/sport/recapMuscleLoadEngine';
import { buildRecapEnduranceDigest } from '../../utils/sport/recapPageDigest';
import RecapMuscleZonesPanel from '../sport/recap/RecapMuscleZonesPanel';
import RecapEnduranceDigestPanel from '../sport/recap/RecapEnduranceDigestPanel';

const PERIOD_STORAGE_KEY = 'sport.recap.periodView';

const PERIODS = [
  { id: 'today', labelKey: 'recap.period.today' },
  { id: '7d', labelKey: 'recap.period.7d' },
  { id: '30d', labelKey: 'recap.period.30d' },
  { id: '3m', labelKey: 'recap.period.3m' },
  { id: '6m', labelKey: 'recap.period.6m' },
  { id: '1y', labelKey: 'recap.period.1y' },
  { id: '2y', labelKey: 'recap.period.2y' },
  { id: 'all', labelKey: 'recap.period.all' }
];

/**
 * Sous-onglet Sport — Récap : carte 3D, légende d’intensité, détail par zone, digest endurance.
 * Modèle 3D : /models/anatomy_study_basemesh_human_male_body.glb
 */
const RecapTab = () => {
  const t = useTranslation();
  const { data, getCurrentData, getExerciseNameById } = useWorkout();
  const [period, setPeriod] = useState(() => {
    try {
      const stored = localStorage.getItem(PERIOD_STORAGE_KEY);
      if (stored && PERIODS.some((p) => p.id === stored)) return stored;
    } catch {
      /* ignore */
    }
    return 'today';
  });

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_STORAGE_KEY, period);
    } catch {
      /* ignore */
    }
  }, [period]);

  const recapState = useMemo(() => {
    const snapshot = getCurrentData();
    return computeRecapMuscleState(snapshot, period, getExerciseNameById, new Date());
  }, [data, getCurrentData, getExerciseNameById, period]);

  const enduranceDigest = useMemo(() => {
    const snapshot = getCurrentData();
    return buildRecapEnduranceDigest(snapshot, recapState.window);
  }, [data, getCurrentData, recapState.window]);

  const dominantLabel = t(`recap.muscleGroup.${recapState.dominantGroup}`, recapState.dominantGroup);
  const cardioPct = Math.round(CARDIO_BLEND * 100);
  const vt = recapState.volumeTotals || {
    strengthReps: 0,
    isoSeconds: 0,
    enduranceMinutes: 0,
    totalExerciseMinutes: 0
  };
  const totalMinRounded = Math.round(Number(vt.totalExerciseMinutes) || 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-slate-100">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">{t('recap.title')}</h1>
        <p className="text-sm text-slate-400 mt-1">{t('recap.subtitle')}</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              period === p.id
                ? 'bg-emerald-600/90 border-emerald-400 text-white shadow-md'
                : 'bg-slate-800/70 border-slate-600 text-slate-300 hover:border-slate-500'
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-400 mb-4 max-w-3xl leading-relaxed">
        {t('recap.loadSummary', {
          lambda: String(DECAY_LAMBDA_PER_DAY),
          cardioPct: String(cardioPct)
        })}
      </p>
      <p className="text-xs text-amber-200/90 mb-6 font-medium">
        {t('recap.dominant', { label: dominantLabel })}
      </p>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <section className="rounded-xl border border-slate-700/80 bg-slate-900/30 p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-slate-200">{t('recap.bodyMapHeading')}</h2>
            <div className="text-right text-[11px] leading-tight text-slate-400 max-w-[min(100%,220px)]">
              <div className="font-semibold text-emerald-300/95 tabular-nums">
                {t('recap.bodyMapStats.reps', { n: Math.round(vt.strengthReps || 0) })}
              </div>
              <div className="text-slate-500 mt-0.5">
                {t('recap.bodyMapStats.iso', { s: Math.round(vt.isoSeconds || 0) })}
              </div>
              <div className="text-sky-200/90 tabular-nums mt-0.5">
                {t('recap.bodyMapStats.minutes', { m: totalMinRounded })}
              </div>
            </div>
          </div>
          <BodyMap
            muscleColors={recapState.meshColors}
            uniformBodyColor={recapState.uniformBodyColor}
          />
        </section>

        <section className="rounded-xl border border-slate-700/80 bg-slate-900/30 p-4 backdrop-blur-sm">
          <h2 className="text-sm font-semibold text-slate-200 mb-3">{t('recap.legendHeading')}</h2>
          <RecapIntensityLegend />
          <p className="text-xs text-slate-500 mt-4 pt-3 border-t border-slate-700/60">
            {t('recap.periodNote', { label: t(`recap.period.${period}`) })}
          </p>
        </section>
      </div>

      <div className="mt-10 space-y-10">
        <RecapMuscleZonesPanel recapState={recapState} t={t} />
        <RecapEnduranceDigestPanel digest={enduranceDigest} t={t} />
      </div>
    </div>
  );
};

export default RecapTab;
