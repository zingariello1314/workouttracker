import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../../utils/translations';
import { useAuth } from '../../context/AuthContext';
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
import RecapDailyTrendChartsBlock from '../sport/recap/RecapDailyTrendChartsBlock';
import RecapEnduranceDigestPanel from '../sport/recap/RecapEnduranceDigestPanel';
import GarminRunningStatsCard from '../garmin/GarminRunningStatsCard';
import GarminWalkingStatsCard from '../garmin/GarminWalkingStatsCard';
import RecapStrengthStatsCard from '../sport/recap/RecapStrengthStatsCard';
import RecapEnduranceTrophiesCompact from '../sport/recap/RecapEnduranceTrophiesCompact';
import { RECAP_VIEW_PERIODS } from '../../utils/sport/recapViewPeriods';
import { buildPerformanceScore } from '../../utils/exercisePerformanceUtils';
import { computeRecapUserAssessment } from '../../utils/sport/recapUserAssessment';
import RecapUserAssessmentPanel from '../sport/recap/RecapUserAssessmentPanel';
import RecapCrossCoachPanel from '../sport/recap/RecapCrossCoachPanel';
import RecapQuizHistoryPanel from '../sport/recap/RecapQuizHistoryPanel';
import { useRecapSynthesisCoach } from '../../hooks/useRecapSynthesisCoach';
import { useRecapCrossCoachNutrition } from '../../hooks/useRecapCrossCoachNutrition';
import { useRecapCrossCoachGarmin } from '../../hooks/useRecapCrossCoachGarmin';
import DateHelper from '../../utils/dateHelper';

const PERIOD_STORAGE_KEY = 'sport.recap.periodView';

/**
 * Sous-onglet Sport — Récap : carte 3D, légende d’intensité, détail par zone, digest endurance.
 * Modèle 3D : /models/ecorche-muscles-decoupes.glb
 */
const RecapTab = () => {
  const t = useTranslation();
  const { currentUser } = useAuth();
  const {
    data,
    getCurrentData,
    getExerciseNameById,
    requestOpenEnduranceSubTab,
    activeProgram,
    getTodayWorkout,
    isGymMode
  } = useWorkout();

  const getWorkoutForDateForRecap = useMemo(
    () => (typeof getTodayWorkout === 'function' ? (d) => getTodayWorkout(d, isGymMode) : undefined),
    [getTodayWorkout, isGymMode]
  );

  const snapshotForRecap = useMemo(() => getCurrentData(), [data, getCurrentData]);

  const recapWindowEnd = DateHelper.getTodayLocal();
  const recapWindowStart = DateHelper.addDays(recapWindowEnd, -27);
  const nutritionPartialForRecap = useRecapCrossCoachNutrition({ enabled: true });
  const garminPartialForRecap = useRecapCrossCoachGarmin({
    startYmd: recapWindowStart,
    endYmd: recapWindowEnd,
    enabled: true
  });

  const recapAssessment = useMemo(
    () =>
      computeRecapUserAssessment({
        snapshot: snapshotForRecap,
        activeProgram,
        profileQuestionnaireRaw: currentUser?.profileQuestionnaire,
        getExerciseNameById,
        getWorkoutForDate: getWorkoutForDateForRecap,
        isGymMode,
        nutritionPartial: nutritionPartialForRecap,
        garminPartial: garminPartialForRecap
      }),
    [
      snapshotForRecap,
      activeProgram,
      currentUser?.profileQuestionnaire,
      getExerciseNameById,
      getWorkoutForDateForRecap,
      isGymMode,
      nutritionPartialForRecap,
      garminPartialForRecap
    ]
  );

  const synthesisCoach = useRecapSynthesisCoach({
    snapshot: snapshotForRecap,
    assessment: recapAssessment,
    activeProgram: activeProgram ?? null,
    profileQuestionnaireRaw: currentUser?.profileQuestionnaire
  });

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

  const performanceRecap = useMemo(() => {
    const snapshot = getCurrentData();
    const records = Array.isArray(snapshot?.exerciseMaxRecords) ? snapshot.exerciseMaxRecords : [];
    const history = Array.isArray(snapshot?.exerciseMaxHistory) ? snapshot.exerciseMaxHistory : [];
    const staleCount = records.filter((r) => {
      const d = r?.recordedAt ? new Date(r.recordedAt) : null;
      if (!d || Number.isNaN(d.getTime())) return false;
      const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
      return days > 45;
    }).length;
    const byDiscipline = records.reduce((acc, r) => {
      const key = String(r.trainingDiscipline || 'general');
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const latest = history
      .slice()
      .sort((a, b) => String(b.recordedAt || '').localeCompare(String(a.recordedAt || '')))
      .slice(0, 5);

    const top10ByCurrentMax = records
      .slice()
      .sort((a, b) => buildPerformanceScore(b) - buildPerformanceScore(a))
      .slice(0, 10);

    const progressionByExercise = new Map();
    history.forEach((entry) => {
      const id = String(entry?.exerciseId || '');
      if (!id) return;
      if (!progressionByExercise.has(id)) progressionByExercise.set(id, []);
      progressionByExercise.get(id).push(entry);
    });

    let bestProgression = null;
    progressionByExercise.forEach((entries, exerciseId) => {
      const sorted = entries
        .slice()
        .sort((a, b) => String(a.recordedAt || '').localeCompare(String(b.recordedAt || '')));
      if (sorted.length < 2) return;
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const firstScore = buildPerformanceScore(first);
      const lastScore = buildPerformanceScore(last);
      const delta = lastScore - firstScore;
      if (!(delta > 0)) return;
      const pct = firstScore > 0 ? (delta / firstScore) * 100 : 100;
      const candidate = {
        exerciseId,
        exerciseName: last.exerciseName || first.exerciseName || exerciseId,
        first,
        last,
        delta,
        pct
      };
      if (!bestProgression || candidate.pct > bestProgression.pct) {
        bestProgression = candidate;
      }
    });

    const bestRepsRecord = history
      .filter((e) => Number(e?.reps) > 0)
      .slice()
      .sort((a, b) => Number(b.reps || 0) - Number(a.reps || 0))[0] || null;

    const bestWeightRecord = history
      .filter((e) => Number(e?.weightKg) > 0)
      .slice()
      .sort((a, b) => Number(b.weightKg || 0) - Number(a.weightKg || 0))[0] || null;

    const bestOverallRecord = history
      .slice()
      .sort((a, b) => buildPerformanceScore(b) - buildPerformanceScore(a))[0] || null;

    return {
      totalRecords: records.length,
      totalTests: history.length,
      staleCount,
      byDiscipline,
      latest,
      top10ByCurrentMax,
      bestProgression,
      bestRepsRecord,
      bestWeightRecord,
      bestOverallRecord
    };
  }, [data, getCurrentData]);

  const formatPerfValue = (entry) => {
    if (!entry) return '-';
    if (entry.performanceType === 'weight_reps') return `${entry.weightKg} kg × ${entry.reps} reps`;
    if (entry.performanceType === 'duration') return `${entry.durationSec} sec`;
    return `${entry.reps} reps`;
  };

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

      <div className="mb-8">
        <RecapUserAssessmentPanel
          assessment={recapAssessment}
          snapshot={snapshotForRecap}
          profileQuestionnaireRaw={currentUser?.profileQuestionnaire}
          currentUser={currentUser}
        />
      </div>

      <div className="mb-8">
        <RecapQuizHistoryPanel profileQuestionnaireRaw={currentUser?.profileQuestionnaire} />
      </div>

      <div className="mb-8">
        <RecapCrossCoachPanel synthesisCoach={synthesisCoach} />
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
        <section className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <h2 className="text-sm font-semibold text-teal-100">Performances & max enregistrés</h2>
              <p className="text-xs text-teal-700 mt-1">
                Suivi global de tes records depuis Défis et Aujourd&apos;hui.
              </p>
            </div>
            <button
              type="button"
              onClick={() => requestOpenEnduranceSubTab?.('performance')}
              className="rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/25 px-3 py-1.5 text-xs font-medium text-white"
            >
              Ouvrir Défis &gt; Performances
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">Max</div>
              <div className="text-xl font-bold text-white">{performanceRecap.totalRecords}</div>
            </div>
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">Tests</div>
              <div className="text-xl font-bold text-white">{performanceRecap.totalTests}</div>
            </div>
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">À retester</div>
              <div className="text-xl font-bold text-amber-300">{performanceRecap.staleCount}</div>
            </div>
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">Disciplines suivies</div>
              <div className="text-xl font-bold text-white">{Object.keys(performanceRecap.byDiscipline).length}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">Meilleure évolution</div>
              {performanceRecap.bestProgression ? (
                <>
                  <div className="text-sm font-semibold text-white mt-1">
                    {performanceRecap.bestProgression.exerciseName}
                  </div>
                  <div className="text-xs text-emerald-300">
                    +{Math.round(performanceRecap.bestProgression.pct)}%
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 mt-1">Pas assez d’historique</div>
              )}
            </div>
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">Record reps</div>
              {performanceRecap.bestRepsRecord ? (
                <>
                  <div className="text-sm font-semibold text-white mt-1">
                    {performanceRecap.bestRepsRecord.exerciseName}
                  </div>
                  <div className="text-xs text-sky-300">
                    {performanceRecap.bestRepsRecord.reps} reps
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 mt-1">—</div>
              )}
            </div>
            <div className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
              <div className="text-xs text-slate-400">Record poids</div>
              {performanceRecap.bestWeightRecord ? (
                <>
                  <div className="text-sm font-semibold text-white mt-1">
                    {performanceRecap.bestWeightRecord.exerciseName}
                  </div>
                  <div className="text-xs text-fuchsia-300">
                    {performanceRecap.bestWeightRecord.weightKg} kg
                  </div>
                </>
              ) : (
                <div className="text-sm text-slate-500 mt-1">—</div>
              )}
            </div>
          </div>

          {performanceRecap.bestOverallRecord ? (
            <div className="rounded-lg border border-[#0F4C5C]/35 bg-black px-3 py-2 text-sm mb-4">
              <span className="text-slate-400">Meilleure perf globale : </span>
              <span className="text-white font-medium">
                {performanceRecap.bestOverallRecord.exerciseName}
              </span>
              <span className="text-slate-300"> · {formatPerfValue(performanceRecap.bestOverallRecord)}</span>
            </div>
          ) : null}

          <div className="rounded-lg border border-[#0F4C5C]/35 bg-black p-3 mb-4">
            <div className="text-sm font-semibold text-white mb-2">Top 10 exos avec max enregistré</div>
            {performanceRecap.top10ByCurrentMax.length > 0 ? (
              <div className="space-y-1.5">
                {performanceRecap.top10ByCurrentMax.map((entry, idx) => (
                  <div
                    key={`top-max-${entry.id || entry.exerciseId || idx}`}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="text-slate-300 truncate">
                      #{idx + 1} · {entry.exerciseName}
                    </span>
                    <span className="text-white font-medium shrink-0">{formatPerfValue(entry)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Aucun max enregistré pour le moment.</p>
            )}
          </div>

          {performanceRecap.latest.length > 0 ? (
            <div className="space-y-2">
              {performanceRecap.latest.map((entry) => (
                <div key={entry.id} className="rounded-lg border border-[#0F4C5C]/35 bg-black px-3 py-2 text-sm">
                  <div className="font-medium text-white">{entry.exerciseName}</div>
                  <div className="text-slate-300">{formatPerfValue(entry)}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(entry.recordedAt).toLocaleDateString('fr-FR')} · {entry.trainingDiscipline}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Aucun max enregistré pour le moment.</p>
          )}
        </section>
        <RecapMuscleZonesPanel recapState={recapState} t={t} />
        <RecapDailyTrendChartsBlock />
        <RecapEnduranceDigestPanel digest={enduranceDigest} t={t} />
      </div>
    </div>
  );
};

export default RecapTab;
