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
import GarminRunningStatsCard from '../garmin/GarminRunningStatsCard';
import GarminWalkingStatsCard from '../garmin/GarminWalkingStatsCard';
import RecapStrengthStatsCard from '../sport/recap/RecapStrengthStatsCard';
import RecapEnduranceTrophiesCompact from '../sport/recap/RecapEnduranceTrophiesCompact';
import { RECAP_VIEW_PERIODS } from '../../utils/sport/recapViewPeriods';

const PERIOD_STORAGE_KEY = 'sport.recap.periodView';

/**
 * Sous-onglet Sport — Récap : carte 3D, légende d’intensité, détail par zone, digest endurance.
 * Modèle 3D : /models/ecorche-muscles-decoupes.glb
 */
const RecapTab = () => {
  const t = useTranslation();
  const { data, getCurrentData, getExerciseNameById, requestOpenEnduranceSubTab } = useWorkout();
  const [period, setPeriod] = useState(() => {
    try {
      const stored = localStorage.getItem(PERIOD_STORAGE_KEY);
      if (stored && RECAP_VIEW_PERIODS.some((p) => p.id === stored)) return stored;
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
  const enduranceSessions = useMemo(() => {
    const snapshot = getCurrentData();
    const src = snapshot?.enduranceData?.sessions || {};
    return {
      running: Array.isArray(src.running) ? src.running : [],
      pushups: Array.isArray(src.pushups) ? src.pushups : [],
      jumprope: Array.isArray(src.jumprope) ? src.jumprope : [],
      gainage: Array.isArray(src.gainage) ? src.gainage : []
    };
  }, [data, getCurrentData]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 text-slate-100">
      <header className="mb-6 rounded-xl border border-[#0F4C5C]/50 bg-black px-4 py-3">
        <h1 className="text-2xl font-bold text-white tracking-tight">{t('recap.title')}</h1>
        <p className="text-sm text-teal-200/80 mt-1">{t('recap.subtitle')}</p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6">
        {RECAP_VIEW_PERIODS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPeriod(p.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              period === p.id
                ? 'bg-[#0F5C45]/90 border-[#0F5C45] text-white shadow-md shadow-black/30'
                : 'bg-black border-[#0F4C5C]/55 text-teal-100/90 hover:border-[#0F5C45]/70'
            }`}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
        <div className="space-y-4">
          <GarminRunningStatsCard
            variant="embedded"
            period={period}
            onPeriodChange={setPeriod}
            showPeriodSelector={false}
          />
          <GarminWalkingStatsCard
            variant="embedded"
            period={period}
            onPeriodChange={setPeriod}
            showPeriodSelector={false}
          />
        </div>
        <div className="space-y-4">
          <RecapStrengthStatsCard
            variant="embedded"
            period={period}
            onPeriodChange={setPeriod}
            showPeriodSelector={false}
          />
          <RecapEnduranceTrophiesCompact
            sessions={enduranceSessions}
            onOpenCategory={(categoryId) => {
              if (!categoryId) return;
              requestOpenEnduranceSubTab?.(categoryId);
            }}
          />
        </div>
      </div>

      <p className="text-xs text-teal-200/70 mb-4 max-w-3xl leading-relaxed">
        {t('recap.loadSummary', {
          lambda: String(DECAY_LAMBDA_PER_DAY),
          cardioPct: String(cardioPct)
        })}
      </p>
      <p className="text-xs text-amber-200/90 mb-6 font-medium">
        {t('recap.dominant', { label: dominantLabel })}
      </p>

      <div className="grid gap-8 lg:grid-cols-2 items-start">
        <section className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-teal-100">{t('recap.bodyMapHeading')}</h2>
            <div className="text-right text-[11px] leading-tight text-teal-200/60 max-w-[min(100%,220px)]">
              <div className="font-semibold text-emerald-300/95 tabular-nums">
                {t('recap.bodyMapStats.reps', { n: Math.round(vt.strengthReps || 0) })}
              </div>
              <div className="text-teal-700 mt-0.5">
                {t('recap.bodyMapStats.iso', { s: Math.round(vt.isoSeconds || 0) })}
              </div>
              <div className="text-teal-200/90 tabular-nums mt-0.5">
                {t('recap.bodyMapStats.minutes', { m: totalMinRounded })}
              </div>
            </div>
          </div>
          <BodyMap
            muscleColors={recapState.meshColors}
            uniformBodyColor={recapState.uniformBodyColor}
          />
        </section>

        <section className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4">
          <h2 className="text-sm font-semibold text-teal-100 mb-3">{t('recap.legendHeading')}</h2>
          <RecapIntensityLegend />
          <p className="text-xs text-teal-700 mt-4 pt-3 border-t border-[#0F4C5C]/40">
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
