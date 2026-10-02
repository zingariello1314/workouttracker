import React, { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useState, startTransition } from 'react';
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
const RecapSnapshotView = lazy(() => import('../sport/recap/views/RecapSnapshotView'));
const RecapAnalyseView = lazy(() => import('../sport/recap/views/RecapAnalyseView'));
const RecapCorpsView = lazy(() => import('../sport/recap/views/RecapCorpsView'));
const RecapTendancesView = lazy(() => import('../sport/recap/views/RecapTendancesView'));
const RecapSessionsView = lazy(() => import('../sport/recap/views/RecapSessionsView'));
const RecapGradesView = lazy(() => import('../sport/recap/views/RecapGradesView'));
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

const RECAP_BODY_MAP_VIEW_LS = 'sport.recap.bodyMapView';

const PERIOD_STORAGE_KEY = 'sport.recap.periodView';

function RecapLoadingLabel({ view, mode }) {
  const refresh = mode === 'refresh';
  const names = {
    analyse: 'l’analyse',
    snapshot: 'le snapshot',
    corps: 'le corps',
    tendances: 'les tendances',
    sessions: 'les séances'
  };
  const name = names[view] || 'cette vue';
  return (
    <div
      className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-[#0F4C5C]/45 bg-black/80 px-6"
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-teal-400/25 border-t-teal-300" />
      <p className="text-sm font-semibold text-teal-50">
        {refresh ? `Mise à jour de ${name}…` : `Chargement de ${name}…`}
      </p>
      <p className="max-w-sm text-center text-xs leading-relaxed text-slate-400">
        {refresh
          ? 'Seul ce qui a changé est recalculé.'
          : 'Cette vue se prépare. Les autres restent indépendantes.'}
      </p>
    </div>
  );
}

const loadedRecapChunks = new Set();

const VIEW_CHUNK_LOADERS = {
  snapshot: () => import('../sport/recap/views/RecapSnapshotView'),
  analyse: () => import('../sport/recap/views/RecapAnalyseView'),
  corps: () => import('../sport/recap/views/RecapCorpsView'),
  tendances: () => import('../sport/recap/views/RecapTendancesView'),
  sessions: () => import('../sport/recap/views/RecapSessionsView')
};

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

  /** Carte corporelle : vue face à chaque ouverture de l’onglet Récap. */
  useEffect(() => {
    try {
      localStorage.setItem(RECAP_BODY_MAP_VIEW_LS, 'frontLow');
    } catch {
      /* ignore */
    }
  }, []);

  const [activeView, setActiveView] = useState(() => readStoredRecapView());
  const isGradesView = activeView === RECAP_VIEW_IDS.GRADES;
  const [chunkReady, setChunkReady] = useState(() => {
    const stored = readStoredRecapView();
    return loadedRecapChunks.has(stored) ? { [stored]: true } : {};
  });

  useEffect(() => {
    if (isGradesView) return undefined;
    const load = VIEW_CHUNK_LOADERS[activeView];
    if (!load || chunkReady[activeView]) return undefined;
    let cancelled = false;
    load()
      .then(() => {
        loadedRecapChunks.add(activeView);
        if (!cancelled) {
          setChunkReady((prev) => (prev[activeView] ? prev : { ...prev, [activeView]: true }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChunkReady((prev) => (prev[activeView] ? prev : { ...prev, [activeView]: true }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeView, isGradesView, chunkReady]);

  const snapshotForRecap = useMemo(() => getCurrentData(), [data, getCurrentData]);
  const nutritionPartialForRecap = useRecapCrossCoachNutrition({ enabled: !isGradesView });

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

  const handlePeriodChange = useCallback((next) => {
    startTransition(() => setPeriod(next));
  }, []);

  const periodWindow = useMemo(() => getRecapDateWindow(deferredPeriod), [deferredPeriod]);

  const garminRangeForRecap = useMemo(() => {
    const end = periodWindow.end;
    if (!end) return { startYmd: null, endYmd: null };
    const lookback90 = DateHelper.addDays(end, -89);
    if (!periodWindow.start) {
      return { startYmd: DateHelper.addDays(end, -365), endYmd: end };
    }
    return {
      startYmd: periodWindow.start <= lookback90 ? periodWindow.start : lookback90,
      endYmd: end
    };
  }, [periodWindow.start, periodWindow.end]);

  const garminPartialForRecap = useRecapCrossCoachGarmin({
    startYmd: garminRangeForRecap.startYmd,
    endYmd: garminRangeForRecap.endYmd,
    enabled: !isGradesView,
    manualWalkByDate: snapshotForRecap?.enduranceData?.manualDailyWalkByDate ?? null
  });

  const { loadAllData, dbReady } = useGarminData();
  const [garminBundle, setGarminBundle] = useState(null);

  useEffect(() => {
    if (!dbReady || !isAuthenticated) {
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
  }, [dbReady, loadAllData, isAuthenticated]);

  const {
    contentReady,
    loadMode,
    recapAssessment,
    recapState,
    enduranceDigest,
    enrichment,
    programCoachAnalysis
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
    garminPartialInput: garminPartialForRecap,
    garminDataForMetrics: garminBundle,
    periodWindow,
    programs,
    enabled: !isGradesView
  });

  const synthesisCoach = useRecapSynthesisCoach({
    snapshot: snapshotForRecap,
    assessment: isGradesView ? null : recapAssessment ?? null,
    activeProgram: activeProgram ?? null,
    profileQuestionnaireRaw: currentUser?.profileQuestionnaire
  });

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

  useEffect(() => {
    const handler = (event) => {
      const view = event.detail?.view;
      if (view && Object.values(RECAP_VIEW_IDS).includes(view)) {
        setActiveView(view);
      }
    };
    window.addEventListener('sport:recap-view', handler);
    return () => window.removeEventListener('sport:recap-view', handler);
  }, []);

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

  const viewContent = useMemo(() => {
    switch (activeView) {
      case RECAP_VIEW_IDS.GRADES:
        return <RecapGradesView />;
      case RECAP_VIEW_IDS.ANALYSE:
        return (
          <RecapAnalyseView
            assessment={recapAssessment}
            synthesisCoach={synthesisCoach}
            profileQuestionnaireRaw={currentUser?.profileQuestionnaire}
            enrichment={enrichment}
            recapState={recapState}
            programCoachAnalysis={programCoachAnalysis}
            activeProgram={activeProgram}
            period={deferredPeriod}
            garminData={garminBundle}
            periodWindow={periodWindow}
            isAdmin={isAdmin}
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
            periodWindow={periodWindow}
            garminData={garminBundle}
          />
        );
      case RECAP_VIEW_IDS.SESSIONS:
        return (
          <RecapSessionsView
            digest={enduranceDigest}
            enrichment={enrichment}
            period={deferredPeriod}
            periodWindow={periodWindow}
            snapshot={snapshotForRecap}
            getExerciseNameById={getExerciseNameById}
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
    requestOpenEnduranceSubTab,
    snapshotForRecap,
    getExerciseNameById,
    periodWindow,
    programCoachAnalysis,
    garminBundle,
    activeProgram
  ]);

  return (
    <RecapShellLayout
      activeView={activeView}
      onViewChange={setActiveView}
      period={period}
      onPeriodChange={handlePeriodChange}
      scoreLevel={!isGradesView && contentReady ? recapAssessment?.level0to100 : undefined}
      scoreTier={!isGradesView && contentReady ? recapAssessment?.tier : undefined}
      showTopMetrics={!isGradesView && contentReady}
    >
      {isGradesView || (contentReady && chunkReady[activeView]) ? (
        <Suspense fallback={isGradesView ? null : <RecapContentSkeleton />}>{viewContent}</Suspense>
      ) : (
        <RecapLoadingLabel view={activeView} mode={loadMode} />
      )}
    </RecapShellLayout>
  );
};

export default RecapTab;
