import React, { useCallback, useDeferredValue, useEffect, useMemo, useState, startTransition } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { getRecapDateWindow } from '../../utils/sport/recapMuscleLoadEngine';
import { RECAP_VIEW_PERIODS } from '../../utils/sport/recapViewPeriods';
import { useRecapSynthesisCoach } from '../../hooks/useRecapSynthesisCoach';
import { useRecapCrossCoachNutrition } from '../../hooks/useRecapCrossCoachNutrition';
import { useRecapCrossCoachGarmin } from '../../hooks/useRecapCrossCoachGarmin';
import { useRecapTabMetrics } from '../../hooks/useRecapTabMetrics';
import DateHelper from '../../utils/dateHelper';
import RecapShellLayout from '../sport/recap/shell/RecapShellLayout';
import RecapTabSkeleton, { RecapContentSkeleton } from '../sport/recap/shell/RecapTabSkeleton';
import RecapSnapshotView from '../sport/recap/views/RecapSnapshotView';
import RecapAnalyseView from '../sport/recap/views/RecapAnalyseView';
import RecapCorpsView from '../sport/recap/views/RecapCorpsView';
import RecapTendancesView from '../sport/recap/views/RecapTendancesView';
import RecapSessionsView from '../sport/recap/views/RecapSessionsView';
import { isAdminUser } from '../../utils/accessControl';
import { useGarminData } from '../../hooks/useGarminData';
import {
  buildGarminCardioById,
  computeRunningVolumeTotals,
  mergeRunningSessionsWithGarmin
} from '../../utils/sport/runningVolumeTruth';
import {
  RECAP_VIEW_IDS,
  readStoredRecapView,
  RECAP_ACTIVE_VIEW_LS
} from '../../utils/sport/recapViewConfig';

const PERIOD_STORAGE_KEY = 'sport.recap.periodView';

function RecapPeriodPendingBar({ visible }) {
  if (!visible) return null;
  return (
    <div
      className="mb-3 flex items-center gap-2 rounded-lg border border-teal-500/25 bg-teal-950/30 px-3 py-2 text-[11px] text-teal-200/90"
      role="status"
      aria-live="polite"
    >
      <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-400" />
      Mise à jour des métriques…
    </div>
  );
}

/**
 * Sous-onglet Sport — Récap musculaire (navigation latérale + 5 vues).
 */
const RecapTab = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const {
    data,
    getCurrentData,
    getExerciseNameById,
    requestOpenEnduranceSubTab,
    activeProgram,
    getTodayWorkout,
    isGymMode,
    programs
  } = useWorkout();

  const getWorkoutForDateForRecap = useMemo(
    () => (typeof getTodayWorkout === 'function' ? (d) => getTodayWorkout(d, isGymMode) : undefined),
    [getTodayWorkout, isGymMode]
  );

  /** Aligné calendrier : programme actif, mode maison pour le décompte planifié. */
  const getTodayWorkoutForCompletion = useMemo(
    () => (typeof getTodayWorkout === 'function' ? (d) => getTodayWorkout(d, false) : undefined),
    [getTodayWorkout]
  );

  const isAdmin = isAdminUser(currentUser);

  const snapshotForRecap = useMemo(() => getCurrentData(), [data, getCurrentData]);
  const nutritionPartialForRecap = useRecapCrossCoachNutrition({ enabled: true });

  const [period, setPeriod] = useState(() => {
    try {
      const stored = localStorage.getItem(PERIOD_STORAGE_KEY);
      if (stored && RECAP_VIEW_PERIODS.some((p) => p.id === stored)) return stored;
    } catch {
      /* ignore */
    }
    return 'today';
  });

  const deferredPeriod = useDeferredValue(period);
  const isPeriodStale = period !== deferredPeriod;

  const handlePeriodChange = useCallback((next) => {
    startTransition(() => setPeriod(next));
  }, []);

  const periodWindow = useMemo(() => getRecapDateWindow(deferredPeriod), [deferredPeriod]);

  const garminPartialForRecap = useRecapCrossCoachGarmin({
    startYmd: periodWindow.start ?? DateHelper.addDays(periodWindow.end, -365),
    endYmd: periodWindow.end,
    enabled: true
  });

  const { loadAllData, dbReady } = useGarminData();
  const [garminBundle, setGarminBundle] = useState(null);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
      setGarminBundle(null);
      return undefined;
    }
    let cancelled = false;
    loadAllData()
      .then((bundle) => {
        if (!cancelled) setGarminBundle(bundle);
      })
      .catch(() => {
        if (!cancelled) setGarminBundle(null);
      });
    return () => {
      cancelled = true;
    };
  }, [dbReady, loadAllData, isAuthenticated, data]);

  const {
    computing: metricsComputing,
    recapAssessment,
    recapState,
    enduranceDigest,
    enrichment
  } = useRecapTabMetrics({
    snapshot: snapshotForRecap,
    deferredPeriod,
    activeProgram,
    profileQuestionnaireRaw: currentUser?.profileQuestionnaire,
    getExerciseNameById,
    getWorkoutForDateForRecap,
    getTodayWorkoutForCompletion,
    isGymMode,
    isAdmin,
    isAuthenticated,
    nutritionPartialForRecap,
    garminPartialForRecap,
    periodWindow,
    programs
  });

  const synthesisCoach = useRecapSynthesisCoach({
    snapshot: snapshotForRecap,
    assessment: recapAssessment ?? null,
    activeProgram: activeProgram ?? null,
    profileQuestionnaireRaw: currentUser?.profileQuestionnaire
  });

  const [activeView, setActiveView] = useState(() => readStoredRecapView());

  useEffect(() => {
    try {
      localStorage.setItem(PERIOD_STORAGE_KEY, period);
    } catch {
      /* ignore */
    }
  }, [period]);

  useEffect(() => {
    try {
      localStorage.setItem(RECAP_ACTIVE_VIEW_LS, activeView);
    } catch {
      /* ignore */
    }
  }, [activeView]);

  const runningKm = useMemo(() => {
    const stored = snapshotForRecap?.enduranceData?.sessions?.running || [];
    const garminById = buildGarminCardioById(garminBundle?.activities?.cardio);
    const merged = mergeRunningSessionsWithGarmin(stored, garminById);
    return computeRunningVolumeTotals(merged, garminById, { period: deferredPeriod }).totalKm;
  }, [snapshotForRecap, garminBundle, deferredPeriod]);

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

  const showMetricsSkeleton = metricsComputing && !enrichment;

  const viewContent = useMemo(() => {
    if (showMetricsSkeleton) {
      return <RecapContentSkeleton />;
    }

    switch (activeView) {
      case RECAP_VIEW_IDS.ANALYSE:
        return (
          <RecapAnalyseView
            assessment={recapAssessment}
            synthesisCoach={synthesisCoach}
            profileQuestionnaireRaw={currentUser?.profileQuestionnaire}
            enrichment={enrichment}
            recapState={recapState}
          />
        );
      case RECAP_VIEW_IDS.CORPS:
        return (
          <RecapCorpsView
            recapState={recapState}
            period={deferredPeriod}
            enduranceSessions={enduranceSessions}
            enrichment={enrichment}
            onOpenEnduranceCategory={(id) => requestOpenEnduranceSubTab?.(id)}
          />
        );
      case RECAP_VIEW_IDS.TENDANCES:
        return (
          <RecapTendancesView
            period={deferredPeriod}
            onPeriodChange={handlePeriodChange}
            enrichment={enrichment}
          />
        );
      case RECAP_VIEW_IDS.SESSIONS:
        return (
          <RecapSessionsView
            digest={enduranceDigest}
            enrichment={enrichment}
            period={deferredPeriod}
            onOpenEndurance={(id) => requestOpenEnduranceSubTab?.(id)}
          />
        );
      case RECAP_VIEW_IDS.SNAPSHOT:
      default:
        return (
          <RecapSnapshotView
            assessment={recapAssessment}
            recapState={recapState}
            runningKm={runningKm}
            period={deferredPeriod}
            currentUser={currentUser}
            enrichment={enrichment}
          />
        );
    }
  }, [
    activeView,
    showMetricsSkeleton,
    recapAssessment,
    synthesisCoach,
    currentUser,
    recapState,
    deferredPeriod,
    enduranceSessions,
    enduranceDigest,
    runningKm,
    enrichment,
    handlePeriodChange,
    requestOpenEnduranceSubTab
  ]);

  return (
    <RecapShellLayout
      activeView={activeView}
      onViewChange={setActiveView}
      period={period}
      onPeriodChange={handlePeriodChange}
      scoreLevel={recapAssessment?.level0to100}
      scoreTier={recapAssessment?.tier}
    >
      <RecapPeriodPendingBar visible={isPeriodStale || (metricsComputing && !isPeriodStale)} />
      <div
        className={
          isPeriodStale || metricsComputing ? 'pointer-events-none opacity-70 transition-opacity' : ''
        }
      >
        {viewContent}
      </div>
    </RecapShellLayout>
  );
};

export default RecapTab;
