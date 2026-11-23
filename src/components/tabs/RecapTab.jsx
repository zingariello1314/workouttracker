import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWorkout } from '../../context/WorkoutContext';
import { resolveRecapPeriodWindow } from '../../utils/sport/recapMuscleLoadEngine';
import { RECAP_VIEW_PERIODS } from '../../utils/sport/recapViewPeriods';
import { useRecapSynthesisCoach } from '../../hooks/useRecapSynthesisCoach';
import { useRecapCrossCoachNutrition } from '../../hooks/useRecapCrossCoachNutrition';
import { useRecapCrossCoachGarmin } from '../../hooks/useRecapCrossCoachGarmin';
import { readPublishedBundle, useRecapTabMetrics } from '../../hooks/useRecapTabMetrics';
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
import { analysisEditionKey } from '../../utils/sport/analysisEdition';
import {
  buildComparisonExport,
  buildEightPeriodAudit,
  buildPeriodAuditDossier,
  EIGHT_PERIODS,
  resolveAuditSource
} from '../../utils/sport/analysisPeriodExport';
import {
  PERIOD_EXPORT_TIMEOUT_MS,
  withTimeout
} from '../../utils/sport/analysisExportDownload';
import { computeRecapPeriodWorkerBundle } from '../../utils/sport/recapPeriodWorkerCompute';
import { RECAP_ADAPTIVE_WORKER_CONTRACT } from '../../utils/sport/recapAdaptiveWorkerContract';
import { tracePublication } from '../../utils/sport/publicationLifecycleTrace';
import {
  loadAnalyticalMemory,
  noteExposure,
  saveAnalyticalMemory,
  resolveAnalyticalMemoryProfile
} from '../../utils/sport/analyticalMemory';
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

  // F7.0 : ne plus double-différer (startTransition + useDeferredValue).
  // Le décalage faisait afficher « 7 days » avec une fenêtre 2 ans et retardait le cache hit.
  const deferredPeriod = period;

  const handlePeriodChange = useCallback((next) => {
    setPeriod(next);
  }, []);

  const openEndurance = useCallback((id) => {
    requestOpenEnduranceSubTab?.(id);
  }, [requestOpenEnduranceSubTab]);

  const { loadAllData, dbReady } = useGarminData();
  const [garminBundle, setGarminBundle] = useState(() => sessionGarminBundle);

  const periodWindow = useMemo(
    () => resolveRecapPeriodWindow(deferredPeriod, snapshotForRecap, garminBundle),
    [deferredPeriod, snapshotForRecap, garminBundle]
  );

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
    computing,
    recapAssessment,
    recapState,
    enduranceDigest,
    enrichment,
    programCoachAnalysis,
    analysisStatus,
    analysisPeriod
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
    enabled: liveMetricsEnabled,
    accountScope: currentUser?.id ? `u:${currentUser.id}` : isAuthenticated ? 'auth' : 'guest'
  });

  const synthesisCoach = useRecapSynthesisCoach({
    snapshot: snapshotForRecap,
    assessment: !isActive ? null : recapAssessment ?? null,
    activeProgram: activeProgram ?? null,
    profileQuestionnaireRaw: currentUser?.profileQuestionnaire
  });

  useEffect(() => {
    if (analysisStatus !== 'ready') return;
    if (recapAssessment?.insightsPublication?.status !== 'ready') return;
    tracePublication('render_committed', {
      period: deferredPeriod,
      windowStart: periodWindow?.start || null,
      windowEnd: periodWindow?.end || null,
      analysisEdition: analysisEditionKey(),
      workerContract: RECAP_ADAPTIVE_WORKER_CONTRACT,
      before: analysisStatus,
      after: 'react_commit',
      reason: 'react_commit_not_dom_proof'
    });
    if (activeView !== RECAP_VIEW_IDS.ANALYSE) return;
    const profile = resolveAnalyticalMemoryProfile(currentUser?.id);
    const memory = loadAnalyticalMemory(profile);
    const noted = noteExposure(memory, {
      kind: 'presented',
      editionKey: analysisEditionKey(),
      period: deferredPeriod,
      windowStart: periodWindow?.start || null,
      windowEnd: periodWindow?.end || null,
      at: new Date().toISOString()
    });
    if (noted.written) saveAnalyticalMemory(noted.memory);
  }, [analysisStatus, recapAssessment, deferredPeriod, periodWindow, activeView, currentUser?.id]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const publication = recapAssessment?.insightsPublication || null;
    const exportState = {
      selectedPeriod: deferredPeriod,
      analysisStatus,
      analysisPeriod,
      publicationPeriod: publication?.period || null,
      publicationStatus: publication?.status || null,
      windowStart: publication?.windowStart || periodWindow?.start || null,
      windowEnd: publication?.windowEnd || periodWindow?.end || null,
      edition: analysisEditionKey()
    };
    window.momentumAnalysisExportState = exportState;
    window.dispatchEvent(new CustomEvent('momentum:analysis-export-state', { detail: exportState }));

    const metricsFor = async (periodId, windowForPeriod) => {
      const calendarMod = await import('../../utils/sport/recapCalendarPeriodAnalytics');
      const measureMod = await import('../../utils/sport/recapPeriodMeasure');
      const calendar = windowForPeriod?.end
        ? calendarMod.buildRecapPeriodCalendarAnalytics({
            workoutData: snapshotForRecap,
            garminData: garminBundle,
            period: periodId,
            periodWindow: windowForPeriod,
            getExerciseNameById,
            recapState,
            phase: 'full'
          })
        : null;
      const measure = windowForPeriod?.end
        ? measureMod.measureRecapWindow({
            snapshot: snapshotForRecap,
            window: windowForPeriod,
            getExerciseNameById,
            garminData: garminBundle,
            recapState,
            periodId
          })
        : null;
      const banner = calendar?.periodStats
        ? {
            totalReps: calendar.periodStats.totalReps,
            trainingDays: calendar.periodStats.trainingDays,
            totalMinutes: calendar.periodStats.totalMinutes,
            otherExerciseMinutes: calendar.periodStats.otherExerciseMinutes,
            runningMinutes: calendar.periodStats.runningMinutes,
            totalKg: calendar.periodStats.totalKg,
            activeKcal: calendar.periodStats.activeKcal,
            longestStreak: calendar.periodStats.longestStreak
          }
        : null;
      const measured = measure
        ? {
            totalReps: measure.totalReps,
            trainingDays: measure.trainingDays,
            strengthDays: measure.strengthDays,
            minutes: measure.minutes,
            totalMinutes: measure.totalMinutes,
            runningMinutes: measure.runningMinutes,
            activeKcal: measure.activeKcal
          }
        : null;
      return { banner, measured };
    };

    const liveBundle = {
      analysisStatus,
      analysisPeriod,
      analysisEdition: analysisEditionKey(),
      packRole: 'published',
      recapAssessment,
      dataFingerprint:
        recapAssessment?.insightsPublication?.dataFingerprint ||
        recapAssessment?.dataFingerprint ||
        null
    };

    // Observation produit pour la console (sans recalcul) — n’écrit pas la mémoire.
    if (analysisStatus === 'ready' && recapAssessment?.insights) {
      window.__momentumLastProductObservation = {
        capturedAt: new Date().toISOString(),
        mode: 'product_last_run',
        bundle: {
          analysisStatus,
          analysisPeriod,
          analysisEdition: liveBundle.analysisEdition,
          packRole: 'published',
          dataFingerprint: liveBundle.dataFingerprint,
          insightsPublication: recapAssessment.insightsPublication || null,
          cardCount: ['shortTerm', 'mediumTerm', 'longTerm'].reduce(
            (n, col) => n + (recapAssessment.insights?.[col]?.length || 0),
            0
          ),
          reserveCount: recapAssessment.insights?.accessibleReserve?.length || 0,
          p6Counters: recapAssessment.periodDiscoveries?.p6?.counters || null,
          underexploration: recapAssessment.periodDiscoveries?.p6?.underexploration || null,
          pipelineSteps:
            recapAssessment.periodDiscoveries?.debug?.pipelineSteps ||
            recapAssessment.selectionDiagnostics?.pipelineSteps ||
            null
        },
        memoryUntouched: true
      };
    }

    const dossierFor = async (periodId, windowForPeriod, domCapture) => {
      const cached = readPublishedBundle({
        period: periodId,
        windowStart: windowForPeriod?.start || null,
        windowEnd: windowForPeriod?.end || null
      });
      const source = resolveAuditSource({
        requestedPeriod: periodId,
        requestedWindow: windowForPeriod,
        live: liveBundle,
        cached
      });
      if (source.refused) return source;
      const metrics = await metricsFor(periodId, source.bundle?.recapAssessment?.insightsPublication || windowForPeriod);
      const historyMod = await import('../../utils/sport/insightNoveltyStore');
      return buildPeriodAuditDossier({
        requestedPeriod: periodId,
        requestedWindow: windowForPeriod,
        bundle: source.bundle,
        provenance: source.provenance,
        banner: metrics.banner,
        measure: metrics.measured,
        snapshot: snapshotForRecap,
        history: historyMod.loadInsightHistory(),
        signature: historyMod.loadLastInsightSignature(),
        publicationTrace: Array.isArray(window.__f70iPub) ? window.__f70iPub.slice(-40) : null,
        domCapture
      });
    };

    window.momentumExportAnalysisDossier = async (opts = {}) => {
      const dossierMod = await import('../../utils/sport/analysisEnvironmentDossier');
      const requestedPeriod = opts.period || deferredPeriod;
      const requestedWindow =
        opts.window || (requestedPeriod === deferredPeriod ? periodWindow : resolveRecapPeriodWindow(requestedPeriod, snapshotForRecap, garminBundle));
      if (opts.comparePeriod) {
        const windowB =
          opts.compareWindow || resolveRecapPeriodWindow(opts.comparePeriod, snapshotForRecap, garminBundle);
        const dossierA = await dossierFor(requestedPeriod, requestedWindow, opts.domCapture || null);
        const dossierB = await dossierFor(opts.comparePeriod, windowB, opts.domCapture || null);
        const comparison = buildComparisonExport(dossierA, dossierB);
        if (opts.download !== false) {
          comparison.download = dossierMod.downloadAnalysisDossier(comparison, {
            filename: `momentum-analysis-comparison-${requestedPeriod}-vs-${opts.comparePeriod}-${comparison.capturedAt.replace(/[:.]/g, '-')}`
          });
        }
        return comparison;
      }
      const dossier = await dossierFor(requestedPeriod, requestedWindow, opts.domCapture || null);
      if (opts.download !== false && !dossier.refused) {
        dossier.download = dossierMod.downloadAnalysisDossier(dossier);
      }
      return dossier;
    };

    window.momentumExportEightPeriods = async (opts = {}) => {
      const dossierMod = await import('../../utils/sport/analysisEnvironmentDossier');
      const { buildAnalysisRunEnvelope } = await import('../../utils/sport/analysisRunEnvelope');
      const { freezeAnalyticalMemorySnapshot, loadAnalyticalMemory } = await import(
        '../../utils/sport/analyticalMemory'
      );
      const memProfile = resolveAnalyticalMemoryProfile(currentUser?.id);
      // Nouvelle campagne : figer mémoire + enveloppe de run (fingerprint unique)
      delete window.__momentumEightPeriodMemoryFreeze;
      window.__momentumEightPeriodMemoryFreeze = freezeAnalyticalMemorySnapshot(
        loadAnalyticalMemory(memProfile)
      );
      const nameMapForEnvelope = {};
      Object.keys(snapshotForRecap?.reps || {}).forEach((key) => {
        const id = key.slice(11);
        if (!id || nameMapForEnvelope[id]) return;
        nameMapForEnvelope[id] = getExerciseNameById?.(id) || '';
      });
      const runEnvelope = buildAnalysisRunEnvelope({
        snapshot: snapshotForRecap,
        activeProgram: activeProgram || null,
        garminData: garminBundle || null,
        garminPartial: garminPartialForRecap || null,
        nameMap: nameMapForEnvelope,
        analyticalMemory: window.__momentumEightPeriodMemoryFreeze,
        executionMode: 'export',
        analysisRunId: opts.analysisRunId || null
      });
      const exportFile = await buildEightPeriodAudit({
        periods: EIGHT_PERIODS,
        domCapture: opts.domCapture || null,
        onProgress: (detail) => {
          window.dispatchEvent(new CustomEvent('momentum:analysis-export-progress', { detail }));
        },
        loadPublished: async (periodId) => {
          const windowForPeriod = resolveRecapPeriodWindow(periodId, snapshotForRecap, garminBundle);
          const cached = readPublishedBundle({
            period: periodId,
            windowStart: windowForPeriod?.start || null,
            windowEnd: windowForPeriod?.end || null
          });
          const source = resolveAuditSource({
            requestedPeriod: periodId,
            requestedWindow: windowForPeriod,
            live: liveBundle,
            cached
          });
          if (source.refused) return null;
          const metrics = await metricsFor(periodId, source.bundle?.recapAssessment?.insightsPublication || windowForPeriod);
          return {
            bundle: {
              ...source.bundle,
              nameMap: nameMapForEnvelope,
              activeProgram: activeProgram || null,
              garminData: garminBundle || null
            },
            provenance: source.provenance,
            window: windowForPeriod,
            banner: metrics.banner,
            measure: metrics.measured,
            snapshot: {
              ...(snapshotForRecap || {}),
              activeProgram: activeProgram || snapshotForRecap?.activeProgram || null,
              garminData: garminBundle || snapshotForRecap?.garminData || null,
              nameMap: nameMapForEnvelope
            }
          };
        },
        computeMissing: async (periodId) => {
          const windowForPeriod = resolveRecapPeriodWindow(periodId, snapshotForRecap, garminBundle);
          const nameMap = {};
          Object.keys(snapshotForRecap?.reps || {}).forEach((key) => {
            const id = key.slice(11);
            if (!id || nameMap[id]) return;
            nameMap[id] = getExerciseNameById?.(id) || '';
          });
          // Mission 24 — même mémoire initiale figée pour toute la campagne 8 horizons
          const memProfile = resolveAnalyticalMemoryProfile(currentUser?.id);
          const { freezeAnalyticalMemorySnapshot, loadAnalyticalMemory } = await import(
            '../../utils/sport/analyticalMemory'
          );
          if (!window.__momentumEightPeriodMemoryFreeze) {
            window.__momentumEightPeriodMemoryFreeze = freezeAnalyticalMemorySnapshot(
              loadAnalyticalMemory(memProfile)
            );
          }
          const result = await withTimeout(
            computeRecapPeriodWorkerBundle(
              {
                period: periodId,
                windowStart: windowForPeriod?.start || null,
                windowEnd: windowForPeriod?.end || null,
                snapshot: snapshotForRecap,
                nameMap,
                garminData: garminBundle,
                garminPartial: garminPartialForRecap,
                activeProgram: activeProgram || null,
                programs: programs || [],
                profileQuestionnaireRaw: currentUser?.profileQuestionnaire || null,
                analyticalMemory: window.__momentumEightPeriodMemoryFreeze,
                isAuthenticated: Boolean(currentUser),
                isAdmin: isAdminUser(currentUser)
              },
              {
                yieldFn: () => new Promise((resolve) => setTimeout(resolve, 0))
              }
            ),
            PERIOD_EXPORT_TIMEOUT_MS,
            `period_${periodId}`
          );
          const publicationWindow = result.recapState?.window || windowForPeriod;
          const bundle = {
            analysisStatus: 'ready',
            analysisPeriod: periodId,
            analysisEdition: analysisEditionKey(),
            packRole: 'computed_not_rendered',
            workerTimings: result.workerTimings || null,
            recapAssessment: {
              ...result.assessment,
              insights: result.adaptive?.insights || null,
              periodDiscoveries: result.adaptive?.periodDiscoveries || null,
              insightsPublication: {
                status: 'ready',
                period: periodId,
                windowStart: publicationWindow?.start || null,
                windowEnd: publicationWindow?.end || null
              }
            }
          };
          const metrics = await metricsFor(periodId, publicationWindow);
          return {
            bundle: {
              ...bundle,
              nameMap: nameMapForEnvelope,
              activeProgram: activeProgram || null,
              garminData: garminBundle || null,
              analyticalMemoryOut: result.adaptive?.memoryUpdate?.memory || null
            },
            window: publicationWindow,
            banner: metrics.banner,
            measure: metrics.measured,
            snapshot: {
              ...(snapshotForRecap || {}),
              activeProgram: activeProgram || snapshotForRecap?.activeProgram || null,
              garminData: garminBundle || snapshotForRecap?.garminData || null,
              nameMap: nameMapForEnvelope
            },
            timings: result.workerTimings || null
          };
        }
      });
      exportFile.analysisRunId = runEnvelope.analysisRunId;
      exportFile.runEnvelope = runEnvelope;
      exportFile.analyticalMemorySnapshot = window.__momentumEightPeriodMemoryFreeze;
      exportFile.fingerprint = runEnvelope.fingerprint;
      // Mission 26 — persister la mémoire campagne dans le store profil (merge, pas purge).
      // Sans ceci : packPhenomena>0 et storePhenomena=0 → previousState=null au prochain run.
      try {
        const memProfile = resolveAnalyticalMemoryProfile(currentUser?.id);
        // Mission 27 — le dossier expose `memorySnapshot` (pas bundle.analyticalMemoryOut).
        const periodMemories = Object.values(exportFile.periods || {})
          .map(
            (d) =>
              d?.memorySnapshot ||
              d?.bundle?.analyticalMemoryOut ||
              d?.analyticalMemoryOut ||
              null
          )
          .filter(Boolean);
        const { loadAnalyticalMemory, saveAnalyticalMemory, freezeAnalyticalMemorySnapshot } =
          await import('../../utils/sport/analyticalMemory');
        let merged = freezeAnalyticalMemorySnapshot(
          window.__momentumEightPeriodMemoryFreeze || loadAnalyticalMemory(memProfile)
        );
        merged.profile = memProfile;
        periodMemories.forEach((mem) => {
          merged = {
            ...merged,
            profile: memProfile,
            phenomena: { ...(merged.phenomena || {}), ...(mem.phenomena || {}) },
            publications: [...(merged.publications || []), ...(mem.publications || [])].slice(-40),
            exposures: merged.exposures || mem.exposures || []
          };
        });
        const written = saveAnalyticalMemory(merged);
        const reread = loadAnalyticalMemory(memProfile);
        exportFile.analyticalMemoryPersisted = {
          profile: memProfile,
          phenomenonCount: Object.keys(merged.phenomena || {}).length,
          storePhenomenaAfterWrite: Object.keys(reread.phenomena || {}).length,
          periodMemorySnapshots: periodMemories.length,
          written: written === true,
          status: written ? 'saved_to_store' : 'save_returned_false'
        };
        window.__momentumEightPeriodMemoryFreeze = freezeAnalyticalMemorySnapshot(merged);
        exportFile.analyticalMemorySnapshot = window.__momentumEightPeriodMemoryFreeze;
      } catch (memErr) {
        exportFile.analyticalMemoryPersisted = {
          status: 'save_failed',
          error: String(memErr?.message || memErr)
        };
      }
      if (opts.download !== false) {
        const downloaded = dossierMod.downloadAnalysisDossier(exportFile, {
          filename: `momentum-analysis-eight-periods-${exportFile.capturedAt.replace(/[:.]/g, '-')}`
        });
        exportFile.download = downloaded;
      }
      return exportFile;
    };

    window.momentumExportPeriodComparison = async (opts = {}) => {
      const periodA = opts.periodA || opts.period || deferredPeriod;
      const periodB = opts.periodB || opts.comparePeriod;
      if (!periodB) {
        return { refused: true, reason: 'compare_period_missing' };
      }
      return window.momentumExportAnalysisDossier({
        ...opts,
        period: periodA,
        comparePeriod: periodB,
        compareWindow: opts.compareWindow || resolveRecapPeriodWindow(periodB, snapshotForRecap, garminBundle)
      });
    };

    window.momentumExportCompleteAudit = async (opts = {}) => {
      const { assembleCompleteAuditDossier } = await import('../../utils/sport/evaluation/completeAuditDossier');
      window.dispatchEvent(
        new CustomEvent('momentum:analysis-export-progress', {
          detail: { period: 'audit', phase: 'eight_periods', index: 1, total: 2 }
        })
      );
      const eightPeriodExport = await window.momentumExportEightPeriods({
        ...opts,
        download: false
      });
      window.dispatchEvent(
        new CustomEvent('momentum:analysis-export-progress', {
          detail: { period: 'audit', phase: 'assemble_zip', index: 2, total: 2 }
        })
      );
      const insights = liveBundle?.recapAssessment?.insights || recapAssessment?.insights || null;
      const p6 = liveBundle?.recapAssessment?.periodDiscoveries?.p6 || null;
      return assembleCompleteAuditDossier({
        eightPeriodExport,
        insights,
        measure: null,
        p6,
        snapshot: snapshotForRecap,
        download: opts.download !== false,
        includeLiveGames: opts.includeLiveGames !== false,
        domVerify: opts.domVerify || window.__momentumLastDomVerify || null
      });
    };

    window.momentumExportAuditIa = async (opts = {}) => {
      const { buildAuditIaMarkdown, buildAuditIaConcise } = await import(
        '../../utils/sport/evaluation/auditIaReport'
      );
      const { downloadTextFile } = await import('../../utils/sport/analysisExportDownload');
      const { snapshotFingerprint } = await import('../../utils/sport/analysisEnvironmentDossier');
      const insights = liveBundle?.recapAssessment?.insights || recapAssessment?.insights || null;
      const p6 = liveBundle?.recapAssessment?.periodDiscoveries?.p6 || null;
      let eightPeriodExport = opts.eightPeriodExport || null;
      if (
        opts.includeEightPeriods !== false &&
        opts.mode !== 'concise' &&
        typeof window.momentumExportEightPeriods === 'function'
      ) {
        window.dispatchEvent(
          new CustomEvent('momentum:analysis-export-progress', {
            detail: { period: 'audit_ia', phase: 'eight_periods', index: 1, total: 2 }
          })
        );
        eightPeriodExport = await window.momentumExportEightPeriods({
          ...opts,
          download: false
        });
      }
      const fp = snapshotForRecap
        ? snapshotFingerprint(snapshotForRecap, {
            activeProgram: activeProgram || null,
            garminData: garminBundle || garminPartialForRecap || null,
            manualSleepByDate: snapshotForRecap?.manualSleepByDate || null
          })
        : null;
      const mdOpts = {
        insights,
        p6,
        mission: undefined,
        eightPeriodExport,
        snapshotFingerprint: fp,
        underexploration: p6?.underexploration || null,
        domVerify: opts.domVerify || window.__momentumLastDomVerify || null
      };
      const md =
        opts.mode === 'concise'
          ? buildAuditIaConcise(mdOpts)
          : buildAuditIaMarkdown({ ...mdOpts, mode: 'detailed' });
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `momentum-AUDIT_IA-${opts.mode === 'concise' ? 'concise-' : ''}${stamp}.md`;
      if (opts.download === false) return { ok: true, markdown: md, filename, eightPeriodExport };
      const dl = downloadTextFile(filename, md, 'text/markdown');
      return { ok: dl?.ok !== false, download: { ...dl, filename }, markdown: md };
    };

    window.momentumCopyAuditIa = async (opts = {}) => {
      const result = await window.momentumExportAuditIa({ ...opts, download: false });
      if (!result?.markdown) return { ok: false, reason: 'empty' };
      try {
        await navigator.clipboard.writeText(result.markdown);
        return { ok: true, chars: result.markdown.length };
      } catch (error) {
        return { ok: false, reason: String(error?.message || error) };
      }
    };

    window.momentumExportAnalyticalAudit = async (opts = {}) => {
      const { buildAnalyticalAudit, validateAnalyticalAudit } = await import(
        '../../utils/sport/evaluation/buildAnalyticalAudit'
      );
      const { downloadAnalysisJson } = await import('../../utils/sport/analysisExportDownload');
      const { analysisEditionKey: editionKey } = await import('../../utils/sport/analysisEdition');
      const insights = liveBundle?.recapAssessment?.insights || recapAssessment?.insights || null;
      const p6 = liveBundle?.recapAssessment?.periodDiscoveries?.p6 || null;
      let eightPeriodExport = opts.eightPeriodExport || null;
      if (opts.includeEightPeriods !== false && typeof window.momentumExportEightPeriods === 'function') {
        window.dispatchEvent(
          new CustomEvent('momentum:analysis-export-progress', {
            detail: { period: 'analytical', phase: 'eight_periods', index: 1, total: 2 }
          })
        );
        eightPeriodExport = await window.momentumExportEightPeriods({
          ...opts,
          download: false
        });
      }
      const edition = editionKey();
      const editorialSlug =
        edition.match(/editorial=([^;]+)/)?.[1]?.replace(/[^a-z0-9.-]+/gi, '-') || 'edition';
      const runId =
        eightPeriodExport?.analysisRunId ||
        `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const memProfile = resolveAnalyticalMemoryProfile(currentUser?.id);
      const mem = loadAnalyticalMemory(memProfile);
      const packMem =
        eightPeriodExport?.analyticalMemorySnapshot ||
        eightPeriodExport?.runEnvelope?.memorySnapshot ||
        null;
      const phenFromPack = Object.keys(packMem?.phenomena || {}).length;
      const phenFromStore = Object.keys(mem?.phenomena || {}).length;
      const doc = buildAnalyticalAudit({
        eightPeriodExport,
        insights: eightPeriodExport?.periods ? null : insights,
        p6: eightPeriodExport?.periods ? null : p6,
        snapshot: {
          ...(snapshotForRecap || {}),
          activeProgram: activeProgram || null,
          garminData: garminBundle || null,
          nameMap: (() => {
            const map = {};
            Object.keys(snapshotForRecap?.reps || {}).forEach((key) => {
              const id = key.slice(11);
              if (id && !map[id]) map[id] = getExerciseNameById?.(id) || '';
            });
            return map;
          })()
        },
        activeProgram,
        gamesByPeriod: opts.gamesByPeriod || null,
        domVerify: opts.domVerify || window.__momentumLastDomVerify || null,
        underexploration: p6?.underexploration || null,
        currentPeriod: deferredPeriod || analysisPeriod || null,
        analysisRunId: eightPeriodExport?.analysisRunId || runId,
        computedAt: eightPeriodExport?.capturedAt || new Date().toISOString(),
        memorySummary: {
          status:
            phenFromPack || phenFromStore || (mem?.publications || []).length
              ? phenFromPack
                ? 'loaded_from_pack'
                : 'loaded'
              : 'empty_profile',
          profile: memProfile,
          phenomenonCount: phenFromPack || phenFromStore,
          publicationCount: (packMem?.publications || mem?.publications || []).length,
          exposureCount: (mem?.exposures || []).length,
          feedbackCount: (mem?.feedback || []).length,
          phenomenonIds: Object.keys(
            packMem?.phenomena || mem?.phenomena || {}
          ).slice(0, 40),
          sourcesCompared: {
            packPhenomena: phenFromPack,
            storePhenomena: phenFromStore,
            storeExposures: (mem?.exposures || []).length
          }
        }
      });
      const validation = validateAnalyticalAudit(doc);
      doc.diagnostics = {
        ...(doc.diagnostics || {}),
        // Mission 25 — ne pas confondre validité JSON et intégrité analytique
        schemaValidation: validation.schemaValidation || { ok: validation.ok, errors: validation.errors },
        integrityValidation: validation.integrityValidation || null,
        validation
      };
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `momentum-ANALYTICAL_AUDIT-${editorialSlug}-${stamp}.json`;
      if (opts.download === false) {
        return { ok: true, document: doc, validation, filename, analysisRunId: runId };
      }
      const dl = downloadAnalysisJson(doc, { filename });
      return {
        ok: dl?.ok !== false,
        download: { ...dl, filename },
        validation,
        schema: doc.schema,
        analysisRunId: runId,
        edition
      };
    };

    window.momentumExportReasoningTrace = async (opts = {}) => {
      const { buildAnalyticalReasoningTrace, buildBulkInspectionIndex } = await import(
        '../../utils/sport/evaluation/buildAnalyticalReasoningTrace'
      );
      const { downloadAnalysisJson } = await import('../../utils/sport/analysisExportDownload');
      const { analysisEditionKey: editionKey } = await import('../../utils/sport/analysisEdition');
      let eightPeriodExport = opts.eightPeriodExport || null;
      let analyticalAudit = opts.analyticalAudit || null;
      if (opts.includeEightPeriods !== false && typeof window.momentumExportEightPeriods === 'function') {
        window.dispatchEvent(
          new CustomEvent('momentum:analysis-export-progress', {
            detail: { period: 'reasoning', phase: 'eight_periods', index: 1, total: 2 }
          })
        );
        eightPeriodExport = await window.momentumExportEightPeriods({
          ...opts,
          download: false
        });
      }
      if (!analyticalAudit && typeof window.momentumExportAnalyticalAudit === 'function') {
        const auditResult = await window.momentumExportAnalyticalAudit({
          ...opts,
          eightPeriodExport,
          includeEightPeriods: false,
          download: false
        });
        analyticalAudit = auditResult?.document || null;
      }
      const runId =
        eightPeriodExport?.analysisRunId ||
        analyticalAudit?.manifest?.analysisRunId ||
        `trace-${Date.now().toString(36)}`;
      if (eightPeriodExport && !eightPeriodExport.analysisRunId) {
        eightPeriodExport = { ...eightPeriodExport, analysisRunId: runId };
      }
      const doc = buildAnalyticalReasoningTrace({
        eightPeriodExport,
        analyticalAudit,
        liveBundle,
        detailed: opts.detailed !== false,
        instrumentedRun: opts.instrumentedRun === true
      });
      doc.bulkInspectionIndex = buildBulkInspectionIndex(doc);
      const edition = editionKey();
      const editorialSlug =
        edition.match(/editorial=([^;]+)/)?.[1]?.replace(/[^a-z0-9.-]+/gi, '-') || 'edition';
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `momentum-ANALYTICAL_REASONING_TRACE-${editorialSlug}-${stamp}.json`;
      if (opts.download === false) {
        return { ok: true, document: doc, filename, analysisRunId: runId };
      }
      const dl = downloadAnalysisJson(doc, { filename });
      return {
        ok: dl?.ok !== false,
        download: { ...dl, filename },
        schema: doc.schema,
        analysisRunId: runId,
        sizeHints: doc.sizeHints,
        edition
      };
    };

    window.momentumVerifyEightPeriodsDom = async (opts = {}) => {
      const { verifyEightPeriodsAgainstDom } = await import(
        '../../utils/sport/evaluation/domEightPeriodVerify'
      );
      const initial = deferredPeriod;
      const report = await verifyEightPeriodsAgainstDom({
        initialPeriod: initial,
        setPeriod: (next) => setPeriod(next),
        getState: () => ({
          analysisStatus,
          analysisPeriod: analysisPeriod || deferredPeriod,
          selectedPeriod: deferredPeriod,
          insights: recapAssessment?.insights || null,
          edition: analysisEditionKey()
        }),
        onProgress: (detail) => {
          window.dispatchEvent(new CustomEvent('momentum:analysis-export-progress', { detail }));
        },
        ...opts
      });
      window.__momentumLastDomVerify = report;
      return report;
    };

    window.momentumInjectEvalArchive = async (payload) => {
      const mod = await import('../../utils/sport/evaluation/evalArchive');
      const next = {
        ...mod.emptyEvalArchive(),
        ...payload,
        updatedAt: new Date().toISOString()
      };
      mod.saveEvalArchiveToStorage(next);
      return { ok: true, edition: next.edition, hasReplay: Boolean(next.replay) };
    };

    return () => {
      delete window.momentumExportAnalysisDossier;
      delete window.momentumExportEightPeriods;
      delete window.momentumExportPeriodComparison;
      delete window.momentumExportCompleteAudit;
      delete window.momentumExportAuditIa;
      delete window.momentumCopyAuditIa;
      delete window.momentumExportAnalyticalAudit;
      delete window.momentumExportReasoningTrace;
      delete window.momentumVerifyEightPeriodsDom;
      delete window.momentumInjectEvalArchive;
      delete window.momentumAnalysisExportState;
    };
  }, [
    periodWindow,
    deferredPeriod,
    snapshotForRecap,
    garminBundle,
    garminPartialForRecap,
    getExerciseNameById,
    recapState,
    recapAssessment,
    enrichment,
    currentUser,
    activeProgram,
    programs,
    analysisStatus,
    analysisPeriod
  ]);

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
      const analysisLoading =
        analysisStatus === 'loading' ||
        (Boolean(computing) && analysisStatus !== 'ready' && analysisStatus !== 'refreshing');
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
        isAdmin,
        analysisLoading,
        analysisStatus: analysisStatus || (analysisLoading ? 'loading' : null),
        analysisPeriod: analysisPeriod || deferredPeriod
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

  // F7.0f : ne pas reconstruire toutes les vues à chaque flip `computing`.
  // Analyse suit le statut d’analyse ; les autres vues suivent métriques/période.
  const analyseEpoch = `${deferredPeriod}:${analysisStatus || ''}:${analysisPeriod || ''}:${Boolean(recapAssessment?.insightsPublication?.complete)}:${computing ? 1 : 0}`;
  const metricsEpoch = `${deferredPeriod}:${hasMetrics}:${Boolean(garminBundle)}:${Boolean(recapAssessment)}:${Boolean(enrichment)}`;
  const analyseEpochRef = useRef(analyseEpoch);
  const metricsEpochRef = useRef(metricsEpoch);
  const analyseEpochChanged = analyseEpochRef.current !== analyseEpoch;
  const metricsEpochChanged = metricsEpochRef.current !== metricsEpoch;
  analyseEpochRef.current = analyseEpoch;
  metricsEpochRef.current = metricsEpoch;

  if (activeView === RECAP_VIEW_IDS.ANALYSE && !visitedRef.current.has(RECAP_VIEW_IDS.ANALYSE)) {
    visitedRef.current.add(RECAP_VIEW_IDS.ANALYSE);
  }

  visitedRef.current.forEach((id) => {
    if (id === RECAP_VIEW_IDS.GRADES) return;
    const epochChanged =
      id === RECAP_VIEW_IDS.ANALYSE ? analyseEpochChanged : metricsEpochChanged;
    if (id === activeView || epochChanged || !panePropsRef.current[id]) {
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
