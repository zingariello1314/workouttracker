import React from 'react';
import { useGarminData } from '../../hooks/useGarminData';
import SyncControls from './GarminTab/components/SyncControls';
import GarminDashboard from './GarminTab/components/GarminDashboard';
import GarminActivities from './GarminTab/components/GarminActivities';
import GarminDailyMetrics from './GarminTab/components/GarminDailyMetrics';
import GarminHeartRateChart from './GarminTab/components/charts/GarminHeartRateChart';
import GarminBodyBatteryChart from './GarminTab/components/charts/GarminBodyBatteryChart';
import GarminStressChart from './GarminTab/components/charts/GarminStressChart';
import GarminSleepChart from './GarminTab/components/charts/GarminSleepChart';
import GarminRespirationChart from './GarminTab/components/charts/GarminRespirationChart';
import GarminActivityHeatmap from './GarminTab/components/charts/GarminActivityHeatmap';
import GarminCorrelationCharts from './GarminTab/components/charts/GarminCorrelationCharts';
import TimeNavigation from './GarminTab/components/TimeNavigation';
import { useGarminSync } from './GarminTab/hooks/useGarminSync';
import { useGarminImport } from './GarminTab/hooks/useGarminImport';

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
  const { loadAllData, dbReady } = useGarminData();
  const { importToEndurance } = useGarminImport();

  const { syncNow, backfill, fetchStatus, loading, baseUrl } = useGarminSync(
    setGarminData,
    setStatus,
    importToEndurance
  );

  // Charger les données depuis IndexedDB au montage
  React.useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Charger les données depuis IndexedDB dès que la DB est prête
  React.useEffect(() => {
    if (dbReady) {
      loadAllData().then((loaded) => {
        if (loaded && (Object.keys(loaded.dailyMetrics || {}).length > 0 ||
            (loaded.activities?.swimming?.length > 0 ||
             loaded.activities?.jumpRope?.length > 0 ||
             loaded.activities?.cardio?.length > 0))) {
          setGarminData({
            activities: {
              swimming: loaded.activities.swimming || [],
              jumpRope: loaded.activities.jumpRope || [],
              cardio: loaded.activities.cardio || []
            },
            dailyMetrics: loaded.dailyMetrics || {}
          });
          const dates = Object.keys(loaded.dailyMetrics || {}).sort();
          if (dates.length > 0) setSelectedDate(dates[dates.length - 1]);
          console.log('[GarminTab] Loaded from IndexedDB:', {
            swimming: loaded.activities.swimming?.length || 0,
            jumpRope: loaded.activities.jumpRope?.length || 0,
            cardio: loaded.activities.cardio?.length || 0,
            dailyMetrics: Object.keys(loaded.dailyMetrics || {}).length,
            sampleDate: Object.keys(loaded.dailyMetrics || {})[0],
            sampleMetrics: loaded.dailyMetrics ? loaded.dailyMetrics[Object.keys(loaded.dailyMetrics)[0]] : null,
            sampleActivity: loaded.activities?.swimming?.[0] || loaded.activities?.jumpRope?.[0] || loaded.activities?.cardio?.[0] || null
          });
        }
      }).catch(err => {
        console.error('[GarminTab] Error loading from IndexedDB:', err);
      });
    }
  }, [dbReady, loadAllData]);

  const handleBackfill = React.useCallback(() => {
    if (startDate && endDate) {
      backfill(startDate, endDate, setSelectedDate);
    }
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

  return (
    <div className="max-w-7xl mx-auto p-4">
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
        />

        {/* Statut serveur */}
        {baseUrl && (
          <div className="mt-4 text-sm text-slate-400">
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
        {garminData && (
          <div className="mt-6 border-b border-slate-700">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'activities'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                🏃 Activités
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'metrics'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                📈 Métriques
              </button>
              <button
                onClick={() => setActiveTab('charts')}
                className={`px-4 py-2 font-medium transition-colors ${
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
        {garminData && (
          <div className="mt-6">
            {activeTab === 'dashboard' && (
              <GarminDashboard
                dailyMetrics={garminData.dailyMetrics}
                selectedDate={selectedDate}
                comparisonMode={comparisonMode}
                compareDate={compareDate}
              />
            )}

            {activeTab === 'activities' && (
              <GarminActivities
                activities={garminData.activities}
                selectedDate={selectedDate}
              />
            )}

            {activeTab === 'metrics' && (
              <GarminDailyMetrics
                dailyMetrics={garminData.dailyMetrics}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                comparisonMode={comparisonMode}
                compareDate={compareDate}
              />
            )}

            {activeTab === 'charts' && (
              <div className="space-y-6">
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
      </div>
    </div>
  );
};

export default GarminTab;

