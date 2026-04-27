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
import GarminSettingsSection from './sections/GarminSettingsSection';
import { GarminDebugPortal } from './GarminDebugPortal';
import { useTranslation } from '../../../../utils/translations';

const GarminDashboard = React.lazy(() => import('./GarminDashboard'));
const GarminActivities = React.lazy(() => import('./GarminActivities'));
const GarminDailyMetrics = React.lazy(() => import('./GarminDailyMetrics'));
const AdvancedStatistics = React.lazy(() => import('./AdvancedStatistics'));
const DebugPanel = React.lazy(() => import('./DebugPanel'));

/**
 * Composant de fallback pour Suspense (skeleton loading)
 * 
 * ✅ Optimisation : Mémoïsé pour éviter re-renders inutiles
 * 
 * @param {Object} props
 * @param {string} props.label - Label à afficher dans le message de chargement
 * @param {string} props.minHeight - Hauteur minimale du conteneur
 */
const SectionFallback = React.memo(({ label, minHeight = '240px' }) => {
  const t = useTranslation();
  const displayLabel = label || t('garmin.fallback.default');
  return (
    <div
      className="flex items-center justify-center rounded-lg border-2 border-[#0F4C5C]/55 bg-black text-sm text-teal-200"
      style={{ minHeight }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex items-center gap-3">
        <span 
          className="h-4 w-4 animate-spin rounded-full border-2 border-[#0F4C5C] border-t-sky-400" 
          aria-hidden="true"
        />
        <span>{t('garmin.fallback.loading', { label: displayLabel })}</span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison optimisée : ne re-render que si label ou minHeight change
  return prevProps.label === nextProps.label && prevProps.minHeight === nextProps.minHeight;
});

SectionFallback.displayName = 'SectionFallback';

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
  backfillWithActiveSource,
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
  handleForcedRangeRecorded,
  sourceSettings,
  verifySourceAccount
}) {
  const t = useTranslation();
  
  // ✅ Optimisation : Mémoïser tous les handlers pour éviter création fonctions inline
  const handleToggleRaw = React.useCallback(() => {
    setShowRaw((v) => !v);
  }, [setShowRaw]);

  const handleConfigureDelay = React.useCallback(() => {
    const settingsElement = document.getElementById('autosync-settings');
    if (settingsElement) {
      settingsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      settingsElement.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
      setTimeout(() => {
        settingsElement.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
      }, 2000);
    }
  }, []);

  const handleOpenDebug = React.useCallback(() => {
    handleToggleDebugPanel(true, 'button');
  }, [handleToggleDebugPanel]);

  const handleSetForcedRangesHistory = React.useCallback(() => {
    // Géré par le Container via le callback - no-op ici
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10">
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
        addForcedRangeEntry={React.useCallback((entry) => {
          // Cette fonction sera gérée par le Container via le callback
          // Ici on laisse le Provider gérer l'état
          handleForcedRangeRecorded?.(entry);
        }, [handleForcedRangeRecorded])}
        clearForcedRangesHistory={handleClearForcedHistory}
        cacheMeta={cacheMeta}
      >
        <GarminTabLayout
          loading={loading}
          baseUrl={baseUrl}
          showRaw={showRaw}
          onToggleRaw={handleToggleRaw}
          toastContainer={<ToastContainer />}
        >
          {/* Navigation temporelle — module séparé */}
          {garminData && garminData.dailyMetrics && memoizedDateKeys.length > 0 && (
            <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-3 shadow-md shadow-black/40">
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
            </div>
          )}

          {/* Onglets Garmin — module séparé */}
          {garminData && (
            <div className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-2 shadow-md shadow-black/40">
              <TabNavigation
                tabs={tabItems}
                activeTab={activeTab}
                onSelect={setActiveTab}
                ariaLabel={t('garmin.navigation.ariaLabel')}
                onTabHover={prefetchTabModules}
                onTabFocus={prefetchTabModules}
              />
            </div>
          )}

          {/* Contenu selon l'onglet actif */}
          {garminData && (
            <div className="space-y-6">
              {activeTab === 'dashboard' && (
                <DashboardSection fallback={<SectionFallback label={t('garmin.fallback.dashboard')} minHeight="320px" />}>
                  <GarminDashboard />
                </DashboardSection>
              )}

              {activeTab === 'activities' && (
                <ActivitiesSection fallback={<SectionFallback label={t('garmin.fallback.activities')} minHeight="280px" />}>
                  <GarminActivities
                    activities={memoizedActivities}
                    selectedDate={selectedDate}
                  />
                </ActivitiesSection>
              )}

              {activeTab === 'metrics' && (
                <MetricsSection fallback={<SectionFallback label={t('garmin.fallback.metrics')} minHeight="360px" />}>
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
                <ChartsSection fallback={<SectionFallback label={t('garmin.fallback.charts')} minHeight="620px" />} />
              )}

              {activeTab === 'settings' && (
                <GarminSettingsSection
                  loading={loading}
                  sources={sourceSettings?.sources || []}
                  activeSourceId={sourceSettings?.activeSourceId || null}
                  activeSource={sourceSettings?.activeSource || null}
                  onAddSource={sourceSettings?.addSource}
                  onRemoveSource={sourceSettings?.removeSource}
                  onSetActiveSource={sourceSettings?.setActiveSourceId}
                  onUpdateSource={sourceSettings?.updateSource}
                  onAddWatch={sourceSettings?.addWatchToSource}
                  onRemoveWatch={sourceSettings?.removeWatchFromSource}
                  onToggleWatch={sourceSettings?.toggleWatchEnabled}
                  onSyncNow={syncNow}
                  onBackfill={backfillWithActiveSource}
                  onVerifySource={verifySourceAccount}
                />
              )}

              {/* Vue JSON brute */}
              {showRaw && (
                <div className="mt-6 overflow-x-auto rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-4 text-xs text-teal-100 shadow-md shadow-black/40">
                  <pre>{JSON.stringify(garminData, null, 2)}</pre>
                </div>
              )}
            </div>
          )}

          {/* Message si aucune donnée */}
          {!garminData && (
            <div className="mt-6 rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-8 text-center text-teal-700 shadow-md shadow-black/40">
              <p className="mb-2 text-lg text-white">{t('garmin.empty.title')}</p>
              <p className="text-sm">{t('garmin.empty.message')}</p>
            </div>
          )}

          <div className="my-10 border-t border-[#0F4C5C]/30" aria-hidden="true" />

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
              onConfigureDelay={handleConfigureDelay}
              clearCache={clearCache}
              onOpenDebug={handleOpenDebug}
              forcedRangesHistory={forcedRangesHistory}
              onClearForcedHistory={handleClearForcedHistory}
              onRefreshForcedHistory={refreshForcedRangesHistory}
              cacheMeta={cacheMeta}
              onResetCircuit={resetCircuit}
              setForcedRangesHistory={handleSetForcedRangesHistory}
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
              fallback={<SectionFallback label={t('garmin.fallback.utilities')} minHeight="160px" />}
            />
          </div>
        </GarminTabLayout>

        {/* Panneau de diagnostic via portail React */}
        <GarminDebugPortal isOpen={showDebugPanel}>
          <React.Suspense fallback={<SectionFallback label={t('garmin.fallback.diagnostics')} minHeight="240px" />}>
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
      </div>
    </div>
  );
}

export default GarminTabView;

