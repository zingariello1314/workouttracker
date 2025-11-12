import React from 'react';
import { GarminProvider } from '../context/GarminContext';
import GarminErrorBoundary from './ErrorBoundary';
import GarminTabLayout from './layout/GarminTabLayout';
import TimeNavigation from './TimeNavigation';
import TabNavigation from './TabNavigation';
import SyncControls from './SyncControls';
import DashboardSection from './sections/DashboardSection';
import ActivitiesSection from './sections/ActivitiesSection';
import MetricsSection from './sections/MetricsSection';
import ChartsSection from './sections/ChartsSection';
import UtilitiesSection from './sections/UtilitiesSection';
import { GarminDebugPortal } from './GarminDebugPortal';

const GarminDashboard = React.lazy(() => import('./GarminDashboard'));
const GarminActivities = React.lazy(() => import('./GarminActivities'));
const GarminDailyMetrics = React.lazy(() => import('./GarminDailyMetrics'));
const AdvancedStatistics = React.lazy(() => import('./AdvancedStatistics'));
const DebugPanel = React.lazy(() => import('./DebugPanel'));

const SectionFallback = ({ label, minHeight = '240px' }) => (
  <div
    className="rounded-lg border border-slate-700 bg-slate-800/60 flex items-center justify-center text-slate-300 text-sm"
    style={{ minHeight }}
    role="status"
    aria-live="polite"
  >
    <div className="flex items-center gap-3">
      <span className="h-4 w-4 border-2 border-slate-600 border-t-blue-400 rounded-full animate-spin"></span>
      <span>Chargement {label}…</span>
    </div>
  </div>
);

/**
 * Composant de présentation pure pour GarminTab
 * 
 * Responsabilités :
 * - Rendu JSX uniquement
 * - Consomme les props du Container
 * - Pas de logique métier (déléguée au Container)
 * - Facilement testable (props en entrée, JSX en sortie)
 */
export function GarminTabView({
  // État
  status,
  garminData,
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
  syncNow,
  backfill,
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
  tabItems,
  prefetchTabModules,
  
  // Callbacks pour Provider
  handleForcedRangeRecorded
}) {
  return (
    <GarminErrorBoundary>
      <GarminProvider
        dailyMetrics={memoizedDailyMetrics}
        activities={memoizedActivities}
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
        forcedRangesHistory={forcedRangesHistory}
        addForcedRangeEntry={(entry) => {
          // Cette fonction sera gérée par le Container via le callback
          // Ici on laisse le Provider gérer l'état
        }}
        clearForcedRangesHistory={handleClearForcedHistory}
        cacheMeta={cacheMeta}
      >
        <GarminTabLayout
          loading={loading}
          baseUrl={baseUrl}
          showRaw={showRaw}
          onToggleRaw={() => setShowRaw((v) => !v)}
          toastContainer={<ToastContainer />}
        >
          {/* Navigation temporelle avancée */}
          {garminData && garminData.dailyMetrics && memoizedDateKeys.length > 0 && (
            <TimeNavigation
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              dateKeys={memoizedDateKeys}
              comparisonMode={comparisonMode}
              setComparisonMode={setComparisonMode}
              compareDate={compareDate}
              setCompareDate={setCompareDate}
              periodFilter={periodFilter}
              setPeriodFilter={setPeriodFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              setCustomStartDate={setCustomStartDate}
              setCustomEndDate={setCustomEndDate}
            />
          )}

          {/* Onglets de navigation */}
          {garminData && (
            <TabNavigation
              tabs={tabItems}
              activeTab={activeTab}
              onSelect={setActiveTab}
              ariaLabel="Navigation principale Garmin"
              onTabHover={prefetchTabModules}
              onTabFocus={prefetchTabModules}
            />
          )}

          {/* Contenu selon l'onglet actif */}
          {garminData && (
            <div className="mt-6">
              {activeTab === 'dashboard' && (
                <DashboardSection fallback={<SectionFallback label="du tableau de bord" minHeight="320px" />}>
                  <GarminDashboard />
                </DashboardSection>
              )}

              {activeTab === 'activities' && (
                <ActivitiesSection fallback={<SectionFallback label="des activités" minHeight="280px" />}>
                  <GarminActivities
                    activities={memoizedActivities}
                    selectedDate={selectedDate}
                  />
                </ActivitiesSection>
              )}

              {activeTab === 'metrics' && (
                <MetricsSection fallback={<SectionFallback label="des métriques" minHeight="360px" />}>
                  <AdvancedStatistics
                    dailyMetrics={memoizedDailyMetrics}
                    selectedDate={selectedDate}
                    periodFilter={periodFilter}
                    customStartDate={customStartDate}
                    customEndDate={customEndDate}
                  />
                  <div className="mt-6">
                    <GarminDailyMetrics
                      dailyMetrics={memoizedDailyMetrics}
                      dateKeys={memoizedDateKeys}
                      selectedDate={selectedDate}
                      setSelectedDate={setSelectedDate}
                      comparisonMode={comparisonMode}
                      compareDate={compareDate}
                    />
                  </div>
                </MetricsSection>
              )}

              {activeTab === 'charts' && (
                <ChartsSection fallback={<SectionFallback label="des graphiques" minHeight="620px" />} />
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

          {/* Contrôles de synchronisation */}
          <div className="space-y-6">
            <SyncControls
              status={status}
              loading={loading}
              syncNow={syncNow}
              backfill={backfill}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              fetchStatus={fetchStatus}
              deleteMockActivities={deleteMockActivities}
              garminData={garminData}
              onConfigureDelay={() => {
                const settingsElement = document.getElementById('autosync-settings');
                if (settingsElement) {
                  settingsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  settingsElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                  setTimeout(() => {
                    settingsElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                  }, 2000);
                }
              }}
              clearCache={clearCache}
              onOpenDebug={() => handleToggleDebugPanel(true, 'button')}
              forcedRangesHistory={forcedRangesHistory}
              onClearForcedHistory={handleClearForcedHistory}
              onRefreshForcedHistory={refreshForcedRangesHistory}
              cacheMeta={cacheMeta}
              onResetCircuit={resetCircuit}
              setForcedRangesHistory={(history) => {
                // Géré par le Container via le callback
              }}
              setLastSourceMeta={setLastSourceMeta}
              historyLimit={200}
            />

            <UtilitiesSection
              syncNow={syncNow}
              selectedDate={selectedDate}
              periodFilter={periodFilter}
              customStartDate={customStartDate}
              customEndDate={customEndDate}
              autoSyncHistory={autoSyncHistory}
              autoSyncStats={autoSyncStats}
              fallback={<SectionFallback label="des utilitaires" minHeight="160px" />}
            />
          </div>
        </GarminTabLayout>

        {/* Panneau de diagnostic via portail React */}
        <GarminDebugPortal isOpen={showDebugPanel}>
          <React.Suspense fallback={<SectionFallback label="du panneau de diagnostic" minHeight="240px" />}>
            <DebugPanel
              onClose={() => handleToggleDebugPanel(false, 'panel-close')}
              cacheMeta={cacheMeta}
              networkStats={networkStats}
              uiMetrics={uiMetrics}
              serverDebug={serverDebug}
              onRefresh={handleRefreshDiagnostics}
            />
          </React.Suspense>
        </GarminDebugPortal>
      </GarminProvider>
    </GarminErrorBoundary>
  );
}

export default GarminTabView;

