import React, { lazy, Suspense, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from 'react';
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
  sessions: () => import('../sport/recap/views/RecapSessionsView'),
  grades: () => import('../sport/recap/views/RecapGradesView')
};

function prefetchRecapChunks() {
  Object.entries(VIEW_CHUNK_LOADERS).forEach(([id, load]) => {
    if (loadedRecapChunks.has(id)) return;
    load()
      .then(() => {
        loadedRecapChunks.add(id);
      })
      .catch(() => {
        loadedRecapChunks.add(id);
      });
  });
}

prefetchRecapChunks();

const SnapshotPane = React.memo(function SnapshotPane(props) {
  return <RecapSnapshotView {...props} />;
});
const AnalysePane = React.memo(function AnalysePane(props) {
  return <RecapAnalyseView {...props} />;
});
const CorpsPane = React.memo(function CorpsPane(props) {
  return <RecapCorpsView {...props} />;
});
const TendancesPane = React.memo(function TendancesPane(props) {
  return <RecapTendancesView {...props} />;
});
const SessionsPane = React.memo(function SessionsPane(props) {
  return <RecapSessionsView {...props} />;
});
const GradesPane = React.memo(function GradesPane({ paneActive = true }) {
  return <RecapGradesView paneActive={paneActive} />;
});

let sessionGarminBundle = null;

/**
 * Sous-onglet Sport — Récap musculaire (navigation latérale + 5 vues).
 * `isActive` : keep-alive peut laisser l’arbre monté hors écran ; alors on coupe
 * les pipelines metrics/Garmin cross-coach (flag `enabled` déjà prévu) sans toucher aux calculs.
 */
const RecapTab = ({ isActive = true }) => {
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
    if (!isActive) return undefined;
    try {
      localStorage.setItem(RECAP_BODY_MAP_VIEW_LS, 'frontLow');
    } catch {
      /* ignore */
    }
    return undefined;
  }, [isActive]);

  const [activeView, setActiveView] = useState(() => readStoredRecapView());
  const isGradesView = activeView === RECAP_VIEW_IDS.GRADES;
  const liveMetricsEnabled = Boolean(isActive);
  const [chunkReady, setChunkReady] = useState(() => {
    const ready = {};
    loadedRecapChunks.forEach((id) => {
      ready[id] = true;
    });
    return ready;
  });
  const visitedRef = useRef(new Set());
  const panePropsRef = useRef({});
  visitedRef.current.add(activeView);

  useEffect(() => {
    let cancelled = false;
    const loads = Object.entries(VIEW_CHUNK_LOADERS).map(([id, load]) =>
      load()
        .then(() => {
          loadedRecapChunks.add(id);
        })
        .catch(() => {
          loadedRecapChunks.add(id);
        })
    );
    Promise.all(loads).then(() => {
      if (cancelled) return;
      setChunkReady((prev) => {
        const next = { ...prev };
        let changed = false;
        loadedRecapChunks.forEach((id) => {
          if (!next[id]) {
            next[id] = true;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const snapshotForRecap = useMemo(() => getCurrentData(), [data, getCurrentData]);
  const nutritionPartialForRecap = useRecapCrossCoachNutrition({ enabled: liveMetricsEnabled });

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

  const openEndurance = useCallback((id) => {
    requestOpenEnduranceSubTab?.(id);
  }, [requestOpenEnduranceSubTab]);

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
    enabled: liveMetricsEnabled,
    manualWalkByDate: snapshotForRecap?.enduranceData?.manualDailyWalkByDate ?? null,
    manualSleepByDate: snapshotForRecap?.manualSleepByDate ?? null
  });

  const { loadAllData, dbReady } = useGarminData();
  const [garminBundle, setGarminBundle] = useState(() => sessionGarminBundle);

  useEffect(() => {
    if (!isActive || !dbReady || !isAuthenticated) {
      return undefined;
    }
    let cancelled = false;
    loadAllData()
      .then((bundle) => {
        if (cancelled || !bundle) return;
        sessionGarminBundle = bundle;
        setGarminBundle(bundle);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isActive, dbReady, loadAllData, isAuthenticated]);

  const {
    contentReady,
    cacheReady,
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
    enabled: liveMetricsEnabled
  });

  const synthesisCoach = useRecapSynthesisCoach({
    snapshot: snapshotForRecap,
    assessment: !isActive ? null : recapAssessment ?? null,
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

  const hasMetrics = Boolean(recapState || recapAssessment || enrichment || enduranceDigest);

  const buildPaneProps = (id) => {
    if (id === RECAP_VIEW_IDS.ANALYSE) {
      return {
        assessment: recapAssessment,
        synthesisCoach,
        profileQuestionnaireRaw: currentUser?.profileQuestionnaire,
        enrichment,
        recapState,
        programCoachAnalysis,
        activeProgram,
        period: deferredPeriod,
        garminData: garminBundle,
        periodWindow,
        isAdmin
      };
    }
    if (id === RECAP_VIEW_IDS.CORPS) {
      return {
        recapState,
        period: deferredPeriod,
        enduranceSessions,
        enrichment,
        onOpenEnduranceCategory: openEndurance
      };
    }
    if (id === RECAP_VIEW_IDS.TENDANCES) {
      return {
        period: deferredPeriod,
        onPeriodChange: handlePeriodChange,
        enrichment,
        periodWindow,
        garminData: garminBundle
      };
    }
    if (id === RECAP_VIEW_IDS.SESSIONS) {
      return {
        digest: enduranceDigest,
        enrichment,
        period: deferredPeriod,
        periodWindow,
        snapshot: snapshotForRecap,
        getExerciseNameById,
        onOpenEndurance: openEndurance
      };
    }
    return {
      assessment: recapAssessment,
      recapState,
      runningKm,
      period: deferredPeriod,
      currentUser,
      enrichment
    };
  };

  const propsEpoch = `${deferredPeriod}:${hasMetrics}:${Boolean(garminBundle)}:${Boolean(recapAssessment)}:${Boolean(enrichment)}`;
  const propsEpochRef = useRef(propsEpoch);
  const propsEpochChanged = propsEpochRef.current !== propsEpoch;
  propsEpochRef.current = propsEpoch;

  if (activeView === RECAP_VIEW_IDS.ANALYSE && !visitedRef.current.has(RECAP_VIEW_IDS.ANALYSE)) {
    visitedRef.current.add(RECAP_VIEW_IDS.ANALYSE);
  }

  visitedRef.current.forEach((id) => {
    if (id === RECAP_VIEW_IDS.GRADES) return;
    if (id === activeView || propsEpochChanged || !panePropsRef.current[id]) {
      panePropsRef.current[id] = buildPaneProps(id);
    }
  });

  const renderPane = (id) => {
    const props = panePropsRef.current[id];
    if (id === RECAP_VIEW_IDS.GRADES) {
      return <GradesPane paneActive={isActive && id === activeView} />;
    }
    if (!props) return null;
    if (id === RECAP_VIEW_IDS.ANALYSE) return <AnalysePane {...props} />;
    if (id === RECAP_VIEW_IDS.CORPS) {
      return <CorpsPane {...props} sceneActive={isActive && id === activeView} />;
    }
    if (id === RECAP_VIEW_IDS.TENDANCES) return <TendancesPane {...props} />;
    if (id === RECAP_VIEW_IDS.SESSIONS) {
      return <SessionsPane {...props} paneActive={isActive && id === activeView} />;
    }
    return <SnapshotPane {...props} />;
  };

  const activeNeedsMetrics =
    activeView !== RECAP_VIEW_IDS.GRADES && activeView !== RECAP_VIEW_IDS.ANALYSE;
  const waitingFirstMetrics = activeNeedsMetrics && cacheReady && !hasMetrics;

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
      {waitingFirstMetrics ? (
        <RecapLoadingLabel view={activeView} mode={loadMode} />
      ) : (
        [...visitedRef.current].map((id) => {
          const visible = id === activeView;
          const ready = Boolean(chunkReady[id]);
          if (!visible && !ready) return null;
          if (
            id !== RECAP_VIEW_IDS.GRADES &&
            id !== RECAP_VIEW_IDS.ANALYSE &&
            !hasMetrics
          ) {
            return null;
          }
          const shrink = id !== RECAP_VIEW_IDS.TENDANCES;
          const park = !visible;
          return (
            <div
              key={id}
              aria-hidden={park || undefined}
              className={[shrink ? 'rb-fit' : '', park ? 'rb-park' : ''].filter(Boolean).join(' ') || undefined}
            >
              <div className={shrink ? 'rb-scale' : undefined}>
                {ready ? (
                  <Suspense fallback={<RecapLoadingLabel view={id} mode={loadMode} />}>
                    {renderPane(id)}
                  </Suspense>
                ) : (
                  <RecapLoadingLabel view={id} mode={loadMode} />
                )}
              </div>
            </div>
          );
        })
      )}
    </RecapShellLayout>
  );
};

export default RecapTab;
