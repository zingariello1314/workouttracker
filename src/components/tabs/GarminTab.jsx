import React from 'react';
import { useGarminData } from '../../hooks/useGarminData';
import SyncControls from './GarminTab/components/SyncControls';
import GarminDashboard from './GarminTab/components/GarminDashboard';
import GarminActivities from './GarminTab/components/GarminActivities';
import GarminDailyMetrics from './GarminTab/components/GarminDailyMetrics';
import GarminHeartRateChart from './GarminTab/components/charts/GarminHeartRateChart';
import GarminHeartRateTimeSeriesChart from './GarminTab/components/charts/GarminHeartRateTimeSeriesChart';
import GarminBodyBatteryChart from './GarminTab/components/charts/GarminBodyBatteryChart';
import GarminStressChart from './GarminTab/components/charts/GarminStressChart';
import GarminSleepChart from './GarminTab/components/charts/GarminSleepChart';
import GarminRespirationChart from './GarminTab/components/charts/GarminRespirationChart';
import GarminActivityHeatmap from './GarminTab/components/charts/GarminActivityHeatmap';
import GarminCorrelationCharts from './GarminTab/components/charts/GarminCorrelationCharts';
import TimeNavigation from './GarminTab/components/TimeNavigation';
import AdvancedStatistics from './GarminTab/components/AdvancedStatistics';
import AutoSyncSettings from './GarminTab/components/AutoSyncSettings';
import PDFExport from './GarminTab/components/PDFExport';
import GarminErrorBoundary from './GarminTab/components/ErrorBoundary';
import { useGarminSync } from './GarminTab/hooks/useGarminSync';
import { useGarminImport } from './GarminTab/hooks/useGarminImport';
import { useToast } from './GarminTab/components/Toast';
import { GarminProvider } from './GarminTab/context/GarminContext';
import { ARIA_LABELS } from './GarminTab/constants';

const GarminTab = () => {
  const [status, setStatus] = React.useState(null);
  const [garminData, setGarminData] = React.useState(null);
  const [showRaw, setShowRaw] = React.useState(false);
  const [startDate, setStartDate] = React.useState('');
  const [endDate, setEndDate] = React.useState('');
  const [selectedDate, setSelectedDate] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState('dashboard'); // dashboard, activities, metrics, charts
  const [comparisonMode, setComparisonMode] = React.useState(false);
  const [compareDate, setCompareDate] = React.useState(null);
  const [periodFilter, setPeriodFilter] = React.useState('all');
  const [customStartDate, setCustomStartDate] = React.useState('');
  const [customEndDate, setCustomEndDate] = React.useState('');
  
  // 🟡 FIX #33: Suivre l'état précédent du loading pour détecter la fin de sync
  const prevLoadingRef = React.useRef(false);
  const prevGarminDataRef = React.useRef(null);
  const autoSyncExecutedRef = React.useRef(false); // 🟢 NOUVEAU : Éviter auto-sync multiple

  // Tous les hooks personnalisés dans un ordre constant
  const { loadAllData, loadDataForTab, dbReady, getLastSyncDate, deleteMockActivities } = useGarminData();
  const { importToEndurance } = useGarminImport();
  const { syncNow, backfill, fetchStatus, loading, baseUrl, clearCache } = useGarminSync(
    setGarminData,
    setStatus,
    importToEndurance
  );
  
  // 🔴 FIX : Exposer clearCache globalement pour permettre vidage depuis SyncControls
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.clearFrontendCache = clearCache;
    }
    return () => {
      if (typeof window !== 'undefined' && window.clearFrontendCache) {
        delete window.clearFrontendCache;
      }
    };
  }, [clearCache]);
  
  // 🟡 FIX #33: Toast pour feedback visuel - appelé après tous les autres hooks personnalisés
  const { showToast, ToastContainer } = useToast();

  // 🔴 FIX #2: Charger les données depuis IndexedDB au montage avec cleanup
  React.useEffect(() => {
    let cancelled = false;
    if (!cancelled) {
      fetchStatus();
    }
    return () => {
      cancelled = true;
    };
  }, [fetchStatus]);

  // 🔴 FIX #2 + #5: Charger les données optimisées selon l'onglet actif dès que la DB est prête
  React.useEffect(() => {
    if (!dbReady) return;
    
    let cancelled = false;
    
    // 🔴 FIX #5: Charger seulement les données nécessaires selon l'onglet actif
    loadDataForTab(activeTab, selectedDate, periodFilter, customStartDate, customEndDate)
      .then((loaded) => {
        if (cancelled) return;
        
        // Toujours mettre à jour les données, même si vides (pour réinitialiser l'état)
        if (loaded) {
          setGarminData({
            activities: {
              swimming: loaded.activities?.swimming || [],
              jumpRope: loaded.activities?.jumpRope || [],
              cardio: loaded.activities?.cardio || []
            },
            dailyMetrics: loaded.dailyMetrics || {}
          });
          // 🔴 FIX : Trier les dates chronologiquement (plus ancien → plus récent)
          const dates = Object.keys(loaded.dailyMetrics || {}).sort((a, b) => {
            // Comparaison numérique pour garantir tri chronologique correct
            return a.localeCompare(b);
          });
          
          if (dates.length > 0 && !selectedDate) {
            // 🔴 FIX : Obtenir "aujourd'hui" en date locale (pas UTC)
            // Utiliser la date locale pour éviter problèmes de fuseau horaire
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            
            // 🔴 FIX : Filtrer les dates mock potentielles (3 décembre si on est en novembre)
            // Ne garder que les dates qui sont dans le passé ou aujourd'hui
            const validDates = dates.filter(date => {
              const dateObj = new Date(date + 'T00:00:00');
              const todayObj = new Date(todayLocal + 'T00:00:00');
              // Ne pas inclure les dates futures (probablement des données mock)
              return dateObj <= todayObj;
            });
            
            // Utiliser les dates valides si disponibles, sinon toutes les dates
            const datesToUse = validDates.length > 0 ? validDates : dates;
            
            // 🔴 FIX : Toujours privilégier aujourd'hui si disponible, sinon la date la plus récente valide
            const todayIndex = datesToUse.indexOf(todayLocal);
            
            if (todayIndex !== -1) {
              // Aujourd'hui existe dans les données → le sélectionner
              setSelectedDate(todayLocal);
            } else {
              // 🔴 FIX : Si aujourd'hui n'existe pas, sélectionner quand même aujourd'hui
              // Cela permettra de déclencher une synchronisation si nécessaire
              setSelectedDate(todayLocal);
              
              // Si aujourd'hui n'est pas dans les dates, déclencher une sync automatique
              if (datesToUse.length > 0) {
                // Afficher un message informatif
                console.log(`[GarminTab] Aujourd'hui (${todayLocal}) n'est pas dans les données disponibles. La date la plus récente est ${datesToUse[datesToUse.length - 1]}. Synchronisation recommandée.`);
              }
            }
          } else if (dates.length === 0 && !selectedDate) {
            // 🔴 FIX : Si aucune date n'est disponible, sélectionner quand même aujourd'hui
            // Cela permettra de déclencher une synchronisation
            const now = new Date();
            const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            setSelectedDate(todayLocal);
            console.log(`[GarminTab] Aucune donnée disponible. Sélection de aujourd'hui (${todayLocal}) pour permettre la synchronisation.`);
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('[GarminTab] Loaded optimized data for tab:', {
              tab: activeTab,
              selectedDate,
              periodFilter,
              swimming: loaded.activities.swimming?.length || 0,
              jumpRope: loaded.activities.jumpRope?.length || 0,
              cardio: loaded.activities.cardio?.length || 0,
              dailyMetrics: Object.keys(loaded.dailyMetrics || {}).length
            });
          }
        }
      })
      .catch(err => {
        if (!cancelled) {
          console.error('[GarminTab] Error loading from storage:', err);
        }
      });
    
    return () => {
      cancelled = true;
    };
  }, [dbReady, loadDataForTab, activeTab, selectedDate, periodFilter, customStartDate, customEndDate]);

  // 🟢 NOUVEAU : Auto-sync intelligente - données toujours à jour si dernière sync > 1h
  React.useEffect(() => {
    if (!dbReady || autoSyncExecutedRef.current || loading) return;
    
    const checkAndAutoSync = async () => {
      try {
        const lastSyncDate = await getLastSyncDate();
        
        if (!lastSyncDate) {
          // Première fois : pas d'auto-sync, l'utilisateur doit faire un backfill ou sync manuel
          autoSyncExecutedRef.current = true;
          return;
        }
        
        // Vérifier si la dernière sync date de plus de 30 minutes
        // 🟢 NOUVEAU : Sync si > 30min pour avoir TOUTES les données à l'heure exacte
        // (calories, pas, FC, Body Battery, etc. bougent tout au long de la journée)
        // Délai minimum de 30min pour éviter les syncs trop fréquentes
        const lastSync = new Date(lastSyncDate);
        const now = new Date();
        const minutesSinceLastSync = (now - lastSync) / (1000 * 60);
        
        // 🔴 FIX : Obtenir "aujourd'hui" en date locale
        const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // 🔴 FIX : Vérifier si aujourd'hui est dans les données disponibles
        const hasTodayData = garminData?.dailyMetrics?.[todayLocal];
        
        // 🔴 FIX : Auto-sync si :
        // 1. Dernière sync > 30min
        // 2. OU si aujourd'hui n'est pas dans les données disponibles (même si dernière sync < 30min)
        if (minutesSinceLastSync > 30 || !hasTodayData) {
          if (!hasTodayData) {
            console.log(`[GarminTab] Auto-sync déclenchée car aujourd'hui (${todayLocal}) n'est pas dans les données disponibles`);
          } else {
            console.log(`[GarminTab] Auto-sync déclenchée pour données à jour (dernière sync: ${minutesSinceLastSync.toFixed(0)}min)`);
          }
          autoSyncExecutedRef.current = true;
          await syncNow();
        } else {
          // Dernière sync < 30min ET aujourd'hui est disponible : données déjà très fraîches, pas besoin de sync
          console.log(`[GarminTab] Données déjà fraîches (dernière sync: ${minutesSinceLastSync.toFixed(0)}min)`);
          autoSyncExecutedRef.current = true;
        }
      } catch (err) {
        console.error('[GarminTab] Error checking auto-sync:', err);
        autoSyncExecutedRef.current = true; // Ne pas bloquer en cas d'erreur
      }
    };
    
    // Attendre un peu pour laisser le chargement initial se terminer
    const timeout = setTimeout(() => {
      checkAndAutoSync();
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [dbReady, getLastSyncDate, syncNow, loading]);

  // 🟡 FIX #33: Détecter fin de sync pour afficher toast
  React.useEffect(() => {
    // Si loading passe de true à false, la sync vient de se terminer
    if (prevLoadingRef.current && !loading) {
      // Attendre un peu pour que les données soient mises à jour
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
      prevGarminDataRef.current = JSON.parse(JSON.stringify(garminData)); // Deep copy
    }
  }, [loading, garminData, status, showToast]);

  const handleBackfill = React.useCallback(() => {
    // 🟡 FIX #28: Validation des entrées backfill
    if (!startDate || !endDate) {
      alert('Veuillez sélectionner une plage de dates');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    
    if (start > end) {
      alert('La date de début doit être avant la date de fin');
      return;
    }
    
    if (days > 365) {
      const confirm = window.confirm(
        `⚠️ Plage très large (${days} jours). Cela peut prendre plusieurs minutes. Continuer?`
      );
      if (!confirm) return;
    }
    
    // Avertir si plage > 90 jours mais < 365
    if (days > 90 && days <= 365) {
      const confirm = window.confirm(
        `⚠️ Plage importante (${days} jours). Cela peut prendre 1-2 minutes. Continuer?`
      );
      if (!confirm) return;
    }
    
    backfill(startDate, endDate, setSelectedDate);
  }, [startDate, endDate, backfill, setSelectedDate]);

  const colors = {
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
  };

  // 🟢 FIX #32: Props communes pour Context API
  const commonChartProps = React.useMemo(() => ({
    dailyMetrics: garminData?.dailyMetrics || {},
    selectedDate,
    periodFilter,
    customStartDate,
    customEndDate,
    colors
  }), [garminData?.dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, colors]);

  return (
    <GarminErrorBoundary>
      <GarminProvider
        dailyMetrics={garminData?.dailyMetrics || {}}
        activities={garminData?.activities || { swimming: [], jumpRope: [], cardio: [] }}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        periodFilter={periodFilter}
        setPeriodFilter={setPeriodFilter}
        customStartDate={customStartDate}
        setCustomStartDate={setCustomStartDate}
        customEndDate={customEndDate}
        setCustomEndDate={setCustomEndDate}
        comparisonMode={comparisonMode}
        setComparisonMode={setComparisonMode}
        compareDate={compareDate}
        setCompareDate={setCompareDate}
        colors={colors}
      >
        <div className="max-w-7xl mx-auto p-4">
        {/* 🟡 FIX #33: Container pour les toasts */}
        <ToastContainer />
        
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-700 p-6">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Garmin Connect</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowRaw((v) => !v)}
              className="px-3 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm"
            >
              {showRaw ? 'Masquer JSON' : 'Voir JSON'}
            </button>
          </div>
        </div>

        {/* 🟡 FIX #15: Loading state visuel pendant la synchronisation */}
        {loading && (
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
                <p className="text-white font-medium">Synchronisation en cours...</p>
                <p className="text-slate-400 text-sm mt-2">Veuillez patienter</p>
              </div>
            </div>
          </div>
        )}

        {/* Statut serveur */}
        {baseUrl && (
          <div className="mb-4 text-sm text-slate-400">
            Serveur: {baseUrl}
          </div>
        )}

        {/* Navigation temporelle avancée */}
        {garminData && garminData.dailyMetrics && Object.keys(garminData.dailyMetrics).length > 0 && (
          <TimeNavigation
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            dateKeys={Object.keys(garminData.dailyMetrics).sort()}
            comparisonMode={comparisonMode}
            setComparisonMode={setComparisonMode}
            compareDate={compareDate}
            setCompareDate={setCompareDate}
            periodFilter={periodFilter}
            setPeriodFilter={setPeriodFilter}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
          />
        )}

        {/* Onglets de navigation */}
        {/* 🔴 FIX #39: ARIA labels et navigation clavier pour les tabs */}
        {garminData && (
          <div className="mt-6 border-b border-slate-700" role="tablist" aria-label="Navigation principale Garmin">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                role="tab"
                id="dashboard-tab"
                aria-selected={activeTab === 'dashboard'}
                aria-controls="garmin-dashboard-panel"
                aria-label={ARIA_LABELS.TAB_DASHBOARD}
                tabIndex={activeTab === 'dashboard' ? 0 : -1}
                className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'dashboard'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                role="tab"
                id="activities-tab"
                aria-selected={activeTab === 'activities'}
                aria-controls="garmin-activities-panel"
                aria-label={ARIA_LABELS.TAB_ACTIVITIES}
                tabIndex={activeTab === 'activities' ? 0 : -1}
                className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'activities'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                🏃 Activités
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                role="tab"
                id="metrics-tab"
                aria-selected={activeTab === 'metrics'}
                aria-controls="garmin-metrics-panel"
                aria-label={ARIA_LABELS.TAB_METRICS}
                tabIndex={activeTab === 'metrics' ? 0 : -1}
                className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'metrics'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                📈 Métriques
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                role="tab"
                id="charts-tab"
                aria-selected={activeTab === 'charts'}
                aria-controls="garmin-charts-panel"
                aria-label={ARIA_LABELS.TAB_CHARTS}
                tabIndex={activeTab === 'charts' ? 0 : -1}
                className={`px-4 py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  activeTab === 'charts'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                📊 Graphiques
              </button>
            </div>
          </div>
        )}

        {/* Contenu selon l'onglet actif */}
        {/* 🔴 FIX #39: ARIA panels pour accessibilité */}
        {garminData && (
          <div className="mt-6">
            {activeTab === 'dashboard' && (
              <div role="tabpanel" id="garmin-dashboard-panel" aria-labelledby="dashboard-tab">
                <GarminDashboard
                  dailyMetrics={garminData.dailyMetrics}
                  selectedDate={selectedDate}
                  comparisonMode={comparisonMode}
                  compareDate={compareDate}
                  activities={garminData.activities}
                  periodFilter={periodFilter}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                />
              </div>
            )}

            {activeTab === 'activities' && (
              <div role="tabpanel" id="garmin-activities-panel" aria-labelledby="activities-tab">
                <GarminActivities
                  activities={garminData.activities}
                  selectedDate={selectedDate}
                />
              </div>
            )}

            {activeTab === 'metrics' && (
              <div role="tabpanel" id="garmin-metrics-panel" aria-labelledby="metrics-tab">
                {/* 🔴 FIX #71-80: Statistiques avancées */}
                <AdvancedStatistics
                  dailyMetrics={garminData.dailyMetrics}
                  selectedDate={selectedDate}
                  periodFilter={periodFilter}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                />
                <div className="mt-6">
                  <GarminDailyMetrics
                    dailyMetrics={garminData.dailyMetrics}
                    selectedDate={selectedDate}
                    setSelectedDate={setSelectedDate}
                    comparisonMode={comparisonMode}
                    compareDate={compareDate}
                  />
                </div>
              </div>
            )}

            {activeTab === 'charts' && (
              <div role="tabpanel" id="garmin-charts-panel" aria-labelledby="charts-tab" className="space-y-6">
                {/* 🔴 FIX #8: Heart Rate Time Series Chart avec toutes les props */}
                {selectedDate && garminData.dailyMetrics[selectedDate]?.heartRate?.timeSeries?.length > 0 && (
                  <GarminHeartRateTimeSeriesChart
                    dailyMetrics={garminData.dailyMetrics}
                    selectedDate={selectedDate}
                    periodFilter={periodFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    colors={colors}
                  />
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <GarminHeartRateChart
                    dailyMetrics={garminData.dailyMetrics}
                    selectedDate={selectedDate}
                    periodFilter={periodFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    colors={colors}
                  />
                  <GarminBodyBatteryChart
                    dailyMetrics={garminData.dailyMetrics}
                    selectedDate={selectedDate}
                    periodFilter={periodFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    colors={colors}
                  />
                  <GarminStressChart
                    dailyMetrics={garminData.dailyMetrics}
                    selectedDate={selectedDate}
                    periodFilter={periodFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    colors={colors}
                  />
                  <GarminSleepChart
                    dailyMetrics={garminData.dailyMetrics}
                    selectedDate={selectedDate}
                    periodFilter={periodFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                    colors={colors}
                  />
                </div>
                <GarminRespirationChart
                  dailyMetrics={garminData.dailyMetrics}
                  selectedDate={selectedDate}
                  periodFilter={periodFilter}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  colors={colors}
                />
                <GarminActivityHeatmap
                  activities={garminData.activities}
                  dailyMetrics={garminData.dailyMetrics}
                  selectedDate={selectedDate}
                  periodFilter={periodFilter}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  colors={colors}
                />
                <GarminCorrelationCharts
                  dailyMetrics={garminData.dailyMetrics}
                  selectedDate={selectedDate}
                  periodFilter={periodFilter}
                  customStartDate={customStartDate}
                  customEndDate={customEndDate}
                  colors={colors}
                />
              </div>
            )}

            {/* Vue JSON brute */}
            {showRaw && (
              <div className="mt-6 bg-slate-900 text-slate-200 text-xs p-4 rounded border border-slate-700 overflow-x-auto">
                <pre>{JSON.stringify(garminData, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {/* Message si aucune donnée */}
        {!garminData && (
          <div className="mt-6 bg-slate-800/60 border border-slate-700 rounded-lg p-8 text-center text-slate-400">
            <p className="text-lg mb-2">Aucune donnée Garmin</p>
            <p className="text-sm">Synchronisez vos données Garmin pour commencer.</p>
          </div>
        )}

        {/* Séparateur visuel avant les contrôles de synchronisation */}
        <div className="mt-12 mb-8 border-t border-slate-700"></div>

        {/* Contrôles de synchronisation - Déplacés en bas */}
        <div className="space-y-6">
          {/* Contrôles de synchronisation */}
          <SyncControls
            status={status}
            loading={loading}
            syncNow={syncNow}
            backfill={handleBackfill}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            fetchStatus={fetchStatus}
            deleteMockActivities={deleteMockActivities}
            clearCache={clearCache}
          />

          {/* 🔴 FIX #81-87: Synchronisation automatique */}
          <AutoSyncSettings syncFunction={syncNow} />

          {/* 🔴 FIX #81-87: Export PDF */}
          <PDFExport
            garminData={garminData}
            selectedDate={selectedDate}
            periodFilter={periodFilter}
            customStartDate={customStartDate}
            customEndDate={customEndDate}
          />
        </div>
        </div>
        </div>
      </GarminProvider>
    </GarminErrorBoundary>
  );
};

export default GarminTab;

