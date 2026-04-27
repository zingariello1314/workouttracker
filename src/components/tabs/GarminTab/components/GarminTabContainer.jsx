import React from 'react';
import { useGarminData } from '../../../../hooks/useGarminData';
import { useGarminSync } from '../hooks/useGarminSync';
import { useGarminImport } from '../hooks/useGarminImport';
import { useToast } from './Toast';
import useUIMetricsTelemetry from '../hooks/useUIMetricsTelemetry';
import useKeyboardShortcut from '../hooks/useKeyboardShortcut';
import TelemetryCoordinator from '../utils/TelemetryCoordinator';
import { updateUIMetricsStore } from '../utils/uiMetricsStore';
import { startMaintenance, stopMaintenance } from '../services/storage/IndexedDBMaintenanceService';
import { usePrefetchAdjacentDays } from '../hooks/usePrefetchAdjacentDays';
import { registerServiceWorker } from '../utils/serviceWorkerManager';
import { startScheduler, stopScheduler, recordManualTrigger, getHistory, getStats, addListener, TRIGGER_TYPES, RESULT_TYPES } from '../services/sync/AutoSyncScheduler';
import { ARIA_LABELS } from '../constants';
import { KEYBOARD_SHORTCUTS, KEYBOARD_OPTIONS, createKeyboardShortcut } from '../constants/keyboard';
import { isBrowser } from '../../../../utils/isBrowser';
import { getActivitiesStabilityKey, getDailyMetricsStabilityKey } from '../utils/dataStability';
import { useTranslation } from '../../../../utils/translations';
import { useAuth } from '../../../../context/AuthContext';
import { isAdminUser } from '../../../../utils/accessControl';
import { useGarminSourceSettings } from '../hooks/useGarminSourceSettings';

// Constante locale (était dans GarminTab.jsx)
const FORCED_HISTORY_DISPLAY_LIMIT = 200;

// Constantes pour prefetch (réutilisées depuis GarminTab.jsx)
const TAB_PREFETCHERS = {
  dashboard: [() => import('../components/GarminDashboard')],
  activities: [() => import('../components/GarminActivities')],
  metrics: [
    () => import('../components/AdvancedStatistics'),
    () => import('../components/GarminDailyMetrics')
  ],
  charts: [
    () => import('../components/charts/GarminHeartRateTimeSeriesChart'),
    () => import('../components/charts/GarminHeartRateChart'),
    () => import('../components/charts/GarminBodyBatteryChart'),
    () => import('../components/charts/GarminStressChart'),
    () => import('../components/charts/GarminSleepChart'),
    () => import('../components/charts/GarminRespirationChart'),
    () => import('../components/charts/GarminActivityHeatmap'),
    () => import('../components/charts/GarminCorrelationCharts')
  ]
};

const UTILITY_PREFETCHERS = [
  () => import('../components/sections/UtilitiesSection'),
  () => import('../components/DebugPanel')
];

const TAB_ITEMS = Object.freeze([
  {
    id: 'dashboard',
    label: '📊 Dashboard',
    ariaLabel: ARIA_LABELS.TAB_DASHBOARD,
    panelId: 'garmin-dashboard-panel'
  },
  {
    id: 'activities',
    label: '🏃 Activités',
    ariaLabel: ARIA_LABELS.TAB_ACTIVITIES,
    panelId: 'garmin-activities-panel'
  },
  {
    id: 'metrics',
    label: '📈 Métriques',
    ariaLabel: ARIA_LABELS.TAB_METRICS,
    panelId: 'garmin-metrics-panel'
  },
  {
    id: 'charts',
    label: '📊 Graphiques',
    ariaLabel: ARIA_LABELS.TAB_CHARTS,
    panelId: 'garmin-charts-panel'
  },
  {
    id: 'settings',
    label: '⚙️ Parametres',
    ariaLabel: 'Onglet Parametres Garmin',
    panelId: 'garmin-settings-panel'
  }
]);

/**
 * Container logique pour GarminTab
 * 
 * Responsabilités :
 * - Gestion de l'état (state, refs)
 * - Appels aux hooks (useGarminData, useGarminSync, etc.)
 * - Logique métier (callbacks, effets)
 * - Orchestration des services
 * 
 * Ne contient PAS de JSX (délégué à GarminTabView)
 */
export function useGarminTabContainer(options = {}) {
  const t = useTranslation();
  const {
    onForcedRangeRecorded: externalOnForcedRangeRecorded = null
  } = options;

  // Authentification : utilisé uniquement pour adapter le rendu selon l'état de connexion
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = isAdminUser(currentUser);

  // ==================== ÉTAT LOCAL ====================
  const [status, setStatus] = React.useState(null);
  const [garminData, setGarminData] = React.useState(null);
  const [showRaw, setShowRaw] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState(() => {
    try {
      return localStorage.getItem('garmin.activeSubTab') || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [compareDate, setCompareDate] = React.useState(null);
  const [forcedRangesHistory, setForcedRangesHistory] = React.useState([]);
  const [periodFilter, setPeriodFilter] = React.useState('all');
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  const [showDebugPanel, setShowDebugPanel] = React.useState(false);
  const sourceSettings = useGarminSourceSettings({
    currentUser,
    isAuthenticated,
    isAdmin
  });

  // ==================== RÉFS ====================
  const prevLoadingRef = React.useRef(false);
  const prevGarminDataRef = React.useRef(null);
  /** Dernière valeur de garminData (pour fusionner les chargements partiels par onglet sans stale closure) */
  const garminDataRef = React.useRef(null);
  const autoSyncExecutedRef = React.useRef(false);
  const prefetchedTabsRef = React.useRef(new Set());

  React.useEffect(() => {
    garminDataRef.current = garminData;
  }, [garminData]);

  // ==================== HOOKS EXTERNES ====================
  const {
    loadAllData,
    loadDataForTab,
    dbReady,
    getLastSyncDate,
    deleteMockActivities,
    loadForcedRangesHistory,
    clearForcedRangesHistory,
    loadDataByRange
  } = useGarminData();

  const { importToEndurance } = useGarminImport();
  const { showToast, ToastContainer } = useToast();

  useUIMetricsTelemetry('GarminTab');

  // ==================== CALLBACKS ====================
  const handleForcedRangeRecorded = React.useCallback((entry) => {
    if (!entry) return;
    setForcedRangesHistory((prev) => {
      const existsIndex = prev.findIndex((item) => {
        if (item.id && entry.id) {
          return item.id === entry.id;
        }
        return (
          item.triggeredAt === entry.triggeredAt &&
          item.mode === entry.mode &&
          item.start === entry.start &&
          item.end === entry.end
        );
      });
      const filtered = existsIndex >= 0 ? prev.filter((_, idx) => idx !== existsIndex) : prev;
      return [entry, ...filtered].slice(0, FORCED_HISTORY_DISPLAY_LIMIT);
    });
    externalOnForcedRangeRecorded?.(entry);
  }, [externalOnForcedRangeRecorded]);

  const refreshForcedRangesHistory = React.useCallback(async () => {
    if (!dbReady) return;
    try {
      const history = await loadForcedRangesHistory(FORCED_HISTORY_DISPLAY_LIMIT);
      setForcedRangesHistory(history);
    } catch (err) {
      console.warn('[GarminTabContainer] Erreur lors du chargement de l\'historique des forçages', err);
    }
  }, [dbReady, loadForcedRangesHistory]);

  const handleClearForcedHistory = React.useCallback(async () => {
    try {
      await clearForcedRangesHistory();
      setForcedRangesHistory([]);
    } catch (err) {
      console.error('[GarminTabContainer] Erreur lors de la suppression de l\'historique des forçages', err);
    }
  }, [clearForcedRangesHistory]);

  // ==================== SYNC HOOK ====================
  const {
    syncNow,
    backfill,
    fetchStatus,
    loading,
    baseUrl,
    clearCache,
    cacheMeta,
    setLastSourceMeta,
    resetCircuit,
    getNetworkStatsSnapshot,
    getUIMetricsSnapshot,
    refreshDiagnostics
  } = useGarminSync(
    setGarminData,
    setStatus,
    importToEndurance,
    {
      onForcedRangeRecorded: handleForcedRangeRecorded
    }
  );

  const syncNowWithActiveSource = React.useCallback(
    (request = {}) => syncNow(sourceSettings.buildSyncRequest(request)),
    [syncNow, sourceSettings]
  );

  // ==================== DEBUG PANEL ====================
  const [networkStats, setNetworkStats] = React.useState(() => 
    getNetworkStatsSnapshot ? getNetworkStatsSnapshot() : null
  );
  const [uiMetrics, setUiMetrics] = React.useState(() => 
    getUIMetricsSnapshot ? getUIMetricsSnapshot() : null
  );
  const [serverDebug, setServerDebug] = React.useState(null);

  const announceDebugPanelChange = React.useCallback((isOpen, source = 'manual') => {
    const sourceLabels = {
      shortcut: 'raccourci clavier',
      button: 'bouton de diagnostic',
      'panel-close': 'fermeture panneau',
      'panel-refresh': 'rafraîchissement',
      'server-debug': 'snapshot serveur',
      manual: 'action utilisateur'
    };
    const label = sourceLabels[source] || source;
    const message = isOpen
      ? `Panneau de diagnostic ouvert (${label}).`
      : `Panneau de diagnostic fermé (${label}).`;

    updateUIMetricsStore((store) => {
      const entry = {
        timestamp: Date.now(),
        message,
        ok: isOpen,
        source
      };

      const history = Array.isArray(store.history) ? [entry, ...store.history] : [entry];
      store.history = history.slice(0, 20);

      return {
        lastStatusMessage: entry.message,
        lastStatusOk: isOpen,
        lastStatusError: isOpen ? null : store.lastStatusError ?? null
      };
    });
  }, []);

  const handleToggleDebugPanel = React.useCallback(
    (nextState = null, origin = 'manual') => {
      setShowDebugPanel((previous) => {
        const resolved = nextState === null ? !previous : Boolean(nextState);
        if (resolved !== previous) {
          announceDebugPanelChange(resolved, origin);
        }
        return resolved;
      });
    },
    [announceDebugPanelChange]
  );

  const handleRefreshDiagnostics = React.useCallback(async () => {
    if (!refreshDiagnostics) {
      return;
    }
    try {
      const data = await refreshDiagnostics();
      setServerDebug(data);
    } catch (error) {
      console.warn('[GarminTabContainer] refreshDiagnostics failed', error);
    } finally {
      if (getNetworkStatsSnapshot) {
        setNetworkStats(getNetworkStatsSnapshot());
      }
      if (getUIMetricsSnapshot) {
        setUiMetrics(getUIMetricsSnapshot());
      }
    }
  }, [refreshDiagnostics, getNetworkStatsSnapshot, getUIMetricsSnapshot]);

  // ==================== KEYBOARD SHORTCUT ====================
  // ✅ Tâche 15 : Utiliser constantes centralisées pour raccourcis clavier
  const debugPanelHandler = React.useCallback(
    () => handleToggleDebugPanel(null, 'shortcut'),
    [handleToggleDebugPanel]
  );

  const debugPanelShortcut = React.useMemo(
    () => createKeyboardShortcut(KEYBOARD_SHORTCUTS.DEBUG_PANEL, debugPanelHandler),
    [debugPanelHandler]
  );

  useKeyboardShortcut(
    [debugPanelShortcut],
    KEYBOARD_OPTIONS.DEFAULT
  );

  // ==================== TELEMETRY ====================
  // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
  React.useEffect(() => {
    if (!isBrowser()) {
      return;
    }
    TelemetryCoordinator.start();
    return () => {
      TelemetryCoordinator.stop();
    };
  }, []);

  // ==================== EFFETS ====================
  // Charger l'historique des forçages
  React.useEffect(() => {
    if (!dbReady) return;
    let cancelled = false;
    loadForcedRangesHistory(FORCED_HISTORY_DISPLAY_LIMIT)
      .then((history) => {
        if (!cancelled && Array.isArray(history)) {
          setForcedRangesHistory(history);
        }
      })
      .catch((err) => {
        console.warn('[GarminTabContainer] Impossible de charger l\'historique des forçages', err);
      });

    return () => {
      cancelled = true;
    };
  }, [dbReady, loadForcedRangesHistory]);

  // Rafraîchir diagnostics quand DebugPanel s'ouvre
  React.useEffect(() => {
    if (showDebugPanel) {
      handleRefreshDiagnostics();
    }
  }, [showDebugPanel, handleRefreshDiagnostics]);

  // Charger les données depuis IndexedDB au montage
  // ✅ Micro-optimisation : Support AbortController pour annulation async
  React.useEffect(() => {
    let aborted = false;
    
    const loadStatus = async () => {
      try {
        await fetchStatus();
      } catch (error) {
        if (!aborted) {
          console.warn('[GarminTabContainer] Erreur fetchStatus (non bloquant)', error);
        }
      }
    };
    
    loadStatus();
    
    return () => {
      aborted = true;
    };
  }, [fetchStatus]);

  // Charger les données optimisées selon l'onglet actif
  React.useEffect(() => {
    if (!dbReady) return;
    
    let cancelled = false;
    
    loadDataForTab(activeTab, selectedDate, periodFilter, customStartDate, customEndDate)
      .then((loaded) => {
        if (cancelled) return;
        
        if (loaded) {
          const loadedDaily = loaded.dailyMetrics || {};
          // Ne pas écraser tout l'historique des métriques avec une plage partielle (Activités ±7j,
          // Métriques 90j, Graphiques avec filtre) : sinon dateKeys se réduit et la navigation
          // « jour suivant » se bloque alors qu'IndexedDB contient toute la synchro.
          const shouldMergeDailyMetrics =
            activeTab === 'activities' ||
            activeTab === 'metrics' ||
            (activeTab === 'charts' && periodFilter && periodFilter !== 'all');

          const prevDaily = garminDataRef.current?.dailyMetrics || {};
          const mergedForDates = shouldMergeDailyMetrics
            ? { ...prevDaily, ...loadedDaily }
            : loadedDaily;

          setGarminData({
            activities: {
              swimming: loaded.activities?.swimming || [],
              jumpRope: loaded.activities?.jumpRope || [],
              cardio: loaded.activities?.cardio || []
            },
            dailyMetrics: mergedForDates
          });
          
          const dates = Object.keys(mergedForDates).sort((a, b) => a.localeCompare(b));
          
          if (dates.length > 0 && !selectedDate) {
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            const validDates = dates.filter(date => {
              const dateObj = new Date(date + 'T00:00:00');
              const todayObj = new Date(todayLocal + 'T00:00:00');
              return dateObj <= todayObj;
            });
            
            const datesToUse = validDates.length > 0 ? validDates : dates;
            const todayIndex = datesToUse.indexOf(todayLocal);
            
            if (todayIndex !== -1) {
              setSelectedDate(todayLocal);
            } else {
              setSelectedDate(todayLocal);
              if (datesToUse.length > 0) {
                console.log(`[GarminTabContainer] ${t('garmin.messages.todayNotInData', { today: todayLocal, latestDate: datesToUse[datesToUse.length - 1] })}`);
              }
            }
          } else if (dates.length === 0 && !selectedDate) {
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            setSelectedDate(todayLocal);
            console.log(`[GarminTabContainer] Aucune donnée disponible. Sélection de aujourd'hui (${todayLocal}) pour permettre la synchronisation.`);
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[GarminTabContainer] Error loading from storage:', err);
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, [dbReady, loadDataForTab, activeTab, selectedDate, periodFilter, customStartDate, customEndDate]);

  // ✅ Démarrage du service de maintenance IndexedDB
  React.useEffect(() => {
    if (!dbReady) return;

    // Démarrer la maintenance après un court délai pour ne pas impacter le chargement initial
    const maintenanceTimer = setTimeout(() => {
      startMaintenance({ force: false });
    }, 5000); // Attendre 5 secondes après le montage

    return () => {
      clearTimeout(maintenanceTimer);
      stopMaintenance();
    };
  }, [dbReady]);

  // ✅ Tâche 11 : Préchargement des jours adjacents (J±1)
  usePrefetchAdjacentDays({
    selectedDate,
    loadDataByRange: loadDataByRange || (async (startDate, endDate) => {
      // Fallback si loadDataByRange n'est pas disponible
      if (loadDataForTab) {
        await loadDataForTab('dashboard', startDate);
      }
    }),
    config: {
      initialDelay: 3000, // Attendre 3s après le chargement initial
      daysRange: 1, // J±1
      idleTimeout: 5000
    }
  });

  // ✅ Tâche 12 : Enregistrement du Service Worker pour offline fallback
  React.useEffect(() => {
    if (!dbReady) return;

    // Enregistrer le Service Worker après un court délai
    const swTimer = setTimeout(() => {
      registerServiceWorker().catch(err => {
        console.warn('[GarminTabContainer] Erreur enregistrement Service Worker (non bloquant)', err);
      });
    }, 2000); // Attendre 2s après le chargement initial

    return () => {
      clearTimeout(swTimer);
    };
  }, [dbReady]);

  // ✅ Tâche 13 : Scheduler AutoSync unifié
  const [autoSyncHistory, setAutoSyncHistory] = React.useState([]);
  const [autoSyncStats, setAutoSyncStats] = React.useState(null);
  const autoSyncAnnouncementRef = React.useRef(null);

  // Écouter les événements du scheduler
  React.useEffect(() => {
    const removeListener = addListener((event, data) => {
      if (event === 'trigger') {
        // Mettre à jour l'historique
        setAutoSyncHistory(prev => [data, ...prev].slice(0, 50));
        
        // Mettre à jour les stats
        setAutoSyncStats(getStats());
        
        // Annonce aria-live
        const triggerLabel = data.triggerType === TRIGGER_TYPES.SCHEDULED ? 'planifiée' 
          : data.triggerType === TRIGGER_TYPES.INTELLIGENT ? 'intelligente'
          : 'manuelle';
        const resultLabel = data.result === RESULT_TYPES.SUCCESS ? 'réussie'
          : data.result === RESULT_TYPES.ERROR ? 'échouée'
          : 'ignorée';
        
        const announcement = `Synchronisation automatique ${triggerLabel} ${resultLabel}. ${data.reason || ''}`;
        // Mettre à jour l'élément aria-live
        const ariaLiveElement = document.getElementById('autosync-announcement');
        if (ariaLiveElement) {
          ariaLiveElement.textContent = announcement;
          // Réinitialiser après un court délai pour permettre de nouvelles annonces
          setTimeout(() => {
            ariaLiveElement.textContent = '';
          }, 1000);
        }
      }
    });

    return removeListener;
  }, []);

  // Écouter les demandes de rafraîchissement
  React.useEffect(() => {
    const handleRefresh = () => {
      const history = getHistory(50);
      setAutoSyncHistory(history);
      setAutoSyncStats(getStats());
    };

    window.addEventListener('garmin-autosync-refresh', handleRefresh);
    return () => {
      window.removeEventListener('garmin-autosync-refresh', handleRefresh);
    };
  }, []);

  // Démarrer le scheduler
  React.useEffect(() => {
    if (!dbReady || loading) return;

    // Charger l'historique initial
    const loadHistory = async () => {
      const history = getHistory(50);
      setAutoSyncHistory(history);
      setAutoSyncStats(getStats());
    };
    loadHistory();

    // Démarrer le scheduler après un court délai
    const schedulerTimer = setTimeout(() => {
      startScheduler(
        syncNow, // Le scheduler gère l'enregistrement automatique
        getLastSyncDate,
        garminData
      );
    }, 2000); // Attendre 2s après le chargement initial

    return () => {
      clearTimeout(schedulerTimer);
      stopScheduler();
    };
  }, [dbReady, getLastSyncDate, syncNow, loading, garminData]);

  // Détecter fin de sync pour afficher toast
  React.useEffect(() => {
    if (prevLoadingRef.current && !loading) {
      setTimeout(() => {
        if (garminData && prevGarminDataRef.current) {
          const prevData = prevGarminDataRef.current;
          const newActivities = {
            swimming: (garminData.activities?.swimming?.length || 0) - (prevData.activities?.swimming?.length || 0),
            jumpRope: (garminData.activities?.jumpRope?.length || 0) - (prevData.activities?.jumpRope?.length || 0),
            cardio: (garminData.activities?.cardio?.length || 0) - (prevData.activities?.cardio?.length || 0)
          };
          const totalNewActivities = newActivities.swimming + newActivities.jumpRope + newActivities.cardio;
          const newMetrics = Object.keys(garminData.dailyMetrics || {}).length - 
                            Object.keys(prevData.dailyMetrics || {}).length;
          
          if (status?.ok && (totalNewActivities > 0 || newMetrics > 0)) {
            showToast(
              <div>
                <div className="font-semibold mb-1">✅ Synchronisation réussie</div>
                <div className="text-sm opacity-90">
                  {totalNewActivities > 0 && `${totalNewActivities} nouvelle${totalNewActivities > 1 ? 's' : ''} activité${totalNewActivities > 1 ? 's' : ''}`}
                  {totalNewActivities > 0 && newMetrics > 0 && ' • '}
                  {newMetrics > 0 && `${newMetrics} jour${newMetrics > 1 ? 's' : ''} de métriques`}
                </div>
              </div>,
              'success',
              4000
            );
          } else if (status?.ok) {
            showToast('✅ Synchronisation réussie (données à jour)', 'success', 3000);
          } else if (status?.error) {
            showToast(`❌ Erreur: ${status.error}`, 'error', 5000);
          }
        }
      }, 500);
    }
    prevLoadingRef.current = loading;
    if (garminData) {
      prevGarminDataRef.current = JSON.parse(JSON.stringify(garminData));
    }
  }, [loading, garminData, status, showToast]);

  // S'assurer que la date sélectionnée pointe toujours vers une journée disponible
  // ✅ Micro-optimisation : setSelectedDate est stable (setState), pas besoin dans dépendances
  React.useEffect(() => {
    if (!garminData?.dailyMetrics) {
      return;
    }
    const dateKeys = Object.keys(garminData.dailyMetrics).sort();
    if (dateKeys.length === 0) {
      return;
    }
    const latestDate = dateKeys[dateKeys.length - 1];
    if (!selectedDate || !garminData.dailyMetrics[selectedDate]) {
      setSelectedDate(latestDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garminData?.dailyMetrics, selectedDate]); // setSelectedDate retiré (stable)

  // Exposer clearCache globalement
  // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
  React.useEffect(() => {
    if (isBrowser()) {
      window.clearFrontendCache = clearCache;
    }
    return () => {
      if (isBrowser() && window.clearFrontendCache) {
        delete window.clearFrontendCache;
      }
    };
  }, [clearCache]);

  // Prefetch des modules selon l'onglet actif
  const prefetchTabModules = React.useCallback((tab) => {
    if (prefetchedTabsRef.current.has(tab)) {
      return;
    }
    const loaders = TAB_PREFETCHERS[tab];
    if (!loaders) {
      return;
    }
    prefetchedTabsRef.current.add(tab);
    loaders.forEach((load) => {
      load().catch(() => {
        // Ignorer silencieusement les erreurs de prefetch
      });
    });
  }, []);

  // Prefetch intelligent (onglet actif + idle callback)
  // ✅ Tâche 16 : Utiliser isBrowser() pour vérifications centralisées
  React.useEffect(() => {
    if (!isBrowser()) {
      return undefined;
    }

    prefetchTabModules(activeTab);

    UTILITY_PREFETCHERS.forEach((loader) => {
      loader().catch(() => {});
    });

    const idleCallback = window.requestIdleCallback || ((cb) => window.setTimeout(cb, 500));
    const cancelIdleCallback = window.cancelIdleCallback || window.clearTimeout;

    const idleHandle = idleCallback(() => {
      Object.keys(TAB_PREFETCHERS).forEach(prefetchTabModules);
    }, { timeout: 1500 });

    return () => {
      cancelIdleCallback(idleHandle);
    };
  }, [activeTab, prefetchTabModules]);

  React.useEffect(() => {
    try {
      localStorage.setItem('garmin.activeSubTab', activeTab);
    } catch {
      // Ignore storage errors
    }
  }, [activeTab]);

  // ==================== BACKFILL ====================
  const handleBackfill = React.useCallback(() => {
    if (!startDate || !endDate) {
      showToast('Veuillez sélectionner une plage de dates', 'error', 3000);
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (start > end) {
      showToast('La date de début doit être avant la date de fin', 'error', 3000);
      return;
    }
    
    if (days > 365) {
      showToast(
        `⚠️ Plage très large (${days} jours). Cela peut prendre plusieurs minutes.`,
        'warning',
        5000
      );
    } else if (days > 90) {
      showToast(
        `⚠️ Plage importante (${days} jours). Cela peut prendre 1-2 minutes.`,
        'warning',
        5000
      );
    }
    
    const sourcePayload = sourceSettings.buildSyncRequest({}).payload;
    backfill(
      startDate,
      endDate,
      setSelectedDate,
      sourcePayload ? { payload: sourcePayload } : undefined
    );
  }, [startDate, endDate, backfill, setSelectedDate, showToast, sourceSettings]);

  const handleBackfillWithActiveSource = React.useCallback(
    (start, end) => {
      if (!start || !end) return;
      const sourcePayload = sourceSettings.buildSyncRequest({}).payload;
      backfill(start, end, setSelectedDate, sourcePayload ? { payload: sourcePayload } : undefined);
    },
    [backfill, setSelectedDate, sourceSettings]
  );

  const verifySourceAccount = React.useCallback(
    async (source, options = {}) => {
      if (!source?.email || !source?.password) {
        return { ok: false, error: 'Source invalide: email ou mot de passe manquant.' };
      }
      try {
        const url = `${baseUrl}/api/garmin/source/verify`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            garminAuth: {
              profileId: source.id,
              label: source.label,
              email: source.email,
              password: source.password,
              tokenNamespace: source.tokenNamespace || source.id
            },
            lookbackDays: options.lookbackDays || 30
          })
        });
        const json = await response.json();
        return json && typeof json === 'object'
          ? json
          : { ok: false, error: 'Réponse serveur invalide.' };
      } catch (error) {
        return {
          ok: false,
          error: error?.message || 'Erreur réseau lors de la vérification Garmin.'
        };
      }
    },
    [baseUrl]
  );

  // ==================== MÉMOÏSATION ====================
  const colors = React.useMemo(() => ({
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    purple: '#8B5CF6',
    pink: '#EC4899',
    red: '#EF4444',
    green: '#10B981',
    yellow: '#FCD34D',
    orange: '#F59E0B',
    cyan: '#06B6D4',
    blue: '#3B82F6'
  }), []);

  // ✅ Optimisation : Utiliser clés de stabilité basées sur contenu pour éviter recalculs inutiles
  // Refs pour stocker les valeurs précédentes et leurs clés de stabilité
  const previousActivitiesRef = React.useRef(null);
  const previousActivitiesKeyRef = React.useRef(null);
  const previousMetricsRef = React.useRef(null);
  const previousMetricsKeyRef = React.useRef(null);

  const activitiesStabilityKey = React.useMemo(
    () => getActivitiesStabilityKey(
      isAuthenticated
        ? (garminData?.activities || { swimming: [], jumpRope: [], cardio: [] })
        : { swimming: [], jumpRope: [], cardio: [] }
    ),
    [isAuthenticated, garminData?.activities]
  );

  const memoizedActivities = React.useMemo(() => {
    const currentKey = activitiesStabilityKey;
    // Si la clé de stabilité n'a pas changé, retourner la valeur précédente (évite recalcul)
    if (previousActivitiesKeyRef.current === currentKey && previousActivitiesRef.current !== null) {
      return previousActivitiesRef.current;
    }
    // Clé changée ou première fois : calculer et stocker
    const newValue = isAuthenticated
      ? (garminData?.activities || { swimming: [], jumpRope: [], cardio: [] })
      : { swimming: [], jumpRope: [], cardio: [] };
    previousActivitiesKeyRef.current = currentKey;
    previousActivitiesRef.current = newValue;
    return newValue;
  }, [activitiesStabilityKey, garminData?.activities]);

  const metricsStabilityKey = React.useMemo(
    () => getDailyMetricsStabilityKey(
      isAuthenticated ? (garminData?.dailyMetrics || {}) : {}
    ),
    [isAuthenticated, garminData?.dailyMetrics]
  );

  const memoizedDailyMetrics = React.useMemo(() => {
    const currentKey = metricsStabilityKey;
    // Si la clé de stabilité n'a pas changé, retourner la valeur précédente (évite recalcul)
    if (previousMetricsKeyRef.current === currentKey && previousMetricsRef.current !== null) {
      return previousMetricsRef.current;
    }
    // Clé changée ou première fois : calculer et stocker
    const newValue = isAuthenticated ? (garminData?.dailyMetrics || {}) : {};
    previousMetricsKeyRef.current = currentKey;
    previousMetricsRef.current = newValue;
    return newValue;
  }, [metricsStabilityKey, garminData?.dailyMetrics]);

  const memoizedDateKeys = React.useMemo(
    () => Object.keys(memoizedDailyMetrics).sort((a, b) => a.localeCompare(b)),
    [memoizedDailyMetrics]
  );

  // ==================== RETOUR ====================

  // ✅ Vue "zéro partout" lorsqu'aucun utilisateur n'est connecté :
  // on masque complètement d'éventuelles données historiques et on fournit des structures vides.
  const effectiveGarminData = React.useMemo(() => {
    if (!isAuthenticated) {
      return {
        activities: {
          swimming: [],
          jumpRope: [],
          cardio: []
        },
        dailyMetrics: {}
      };
    }
    return garminData;
  }, [isAuthenticated, garminData]);
  return {
    // État
    status,
    garminData: effectiveGarminData,
    showRaw,
    setShowRaw,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    selectedDate,
    setSelectedDate,
    activeTab,
    setActiveTab,
    comparisonMode,
    setComparisonMode,
    compareDate,
    setCompareDate,
    forcedRangesHistory,
    periodFilter,
    setPeriodFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    showDebugPanel,
    handleToggleDebugPanel,
    
    // Sync
    syncNow: syncNowWithActiveSource,
    backfill: handleBackfill,
    backfillWithActiveSource: handleBackfillWithActiveSource,
    fetchStatus,
    loading,
    baseUrl,
    clearCache,
    cacheMeta,
    setLastSourceMeta,
    resetCircuit,
    
    // Debug
    networkStats,
    uiMetrics,
    serverDebug,
    handleRefreshDiagnostics,
    
    // Data
    dbReady,
    getLastSyncDate,
    deleteMockActivities,
    refreshForcedRangesHistory,
    handleClearForcedHistory,
    
    // Mémoïsés
    colors,
    memoizedActivities,
    memoizedDailyMetrics,
    memoizedDateKeys,
    
    // UI
    ToastContainer,
    
    // ✅ Tâche 13 : AutoSync
    autoSyncHistory,
    autoSyncStats,
    
    // Constantes
    tabItems: TAB_ITEMS,
    prefetchTabModules,
    
    // Callbacks pour Provider
    handleForcedRangeRecorded,
    sourceSettings,
    verifySourceAccount
  };
}

export default useGarminTabContainer;

