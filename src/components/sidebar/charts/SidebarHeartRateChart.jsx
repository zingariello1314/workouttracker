import React, { memo, useCallback, useRef, useEffect, useState, Suspense } from 'react';
import GarminChartErrorBoundary from './GarminChartErrorBoundary';
import {
  MissingDataFallback,
  LoadingErrorFallback,
  LoadingWithTimeout
} from './GarminChartFallbacks';
import { garminDataErrorHandler, GarminErrorType } from '../../../utils/garminDataErrorHandler';
import '../../../styles/garmin-chart-fallbacks.css';

// Import du composant principal utilisé dans l'onglet Garmin
const GarminHeartRateTimeSeriesChart = React.lazy(() => import('../../tabs/GarminTab/components/charts/GarminHeartRateTimeSeriesChart'));

/**
 * SidebarHeartRateChart - Wrapper simplifié utilisant directement GarminHeartRateTimeSeriesChart
 * Utilise exactement le même composant que l'onglet Garmin pour une cohérence parfaite
 * 
 * Requirements: 1.1, 2.1, 2.2, 3.3, 4.1
 * - Graphique FC identique à l'onglet Garmin (1.1, 2.2)
 * - Styles cohérents (2.1)
 * - Navigation vers Sport (3.3)
 * - Contraintes de hauteur pour sidebar (4.1)
 */
const SidebarHeartRateChart = memo(({ 
  garminData,
  selectedDate,
  height = 280,
  compactMode = true,
  colors = { red: '#EF4444' },
  className = '',
  onNavigateToSport = null,
  onDataPointClick = null,
  showNavigationHint = true,
  onError = null,
  onRetry = null,
  enableDegradedMode = true,
  maxRetries = 3,
  loadingTimeout = 10000,
  enableLazyLoading = true
}) => {
  // États simplifiés pour la gestion d'erreurs
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);

  // Gestion d'erreurs simplifiée
  const handleError = useCallback((error, context = 'unknown') => {
    console.error('[SidebarHeartRateChart] Erreur:', error, 'Contexte:', context);
    
    const garminError = garminDataErrorHandler.createError(
      GarminErrorType.INVALID_FORMAT,
      error.message || 'Erreur inconnue',
      undefined,
      { originalError: error, context, timestamp: Date.now() }
    );
    
    setError(garminError);
    
    if (onError) {
      onError(garminError);
    }
  }, [onError]);
  // Fonction de retry simplifiée
  const handleRetry = useCallback(() => {
    if (retryCount >= maxRetries) {
      console.warn('[SidebarHeartRateChart] Nombre maximum de tentatives atteint');
      return;
    }

    console.log(`[SidebarHeartRateChart] Tentative de retry ${retryCount + 1}/${maxRetries}`);
    
    setError(null);
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    
    if (onRetry) {
      onRetry(retryCount + 1);
    }
    
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [retryCount, maxRetries, onRetry]);

  // Reset des erreurs quand les données changent
  useEffect(() => {
    if (garminData && selectedDate) {
      setError(null);
      setRetryCount(0);
      setIsLoading(false);
    }
  }, [garminData, selectedDate]);

  // Vérifier si on a des données utilisables
  const hasUsableData = garminData && (
    (garminData.dailyMetrics && Object.keys(garminData.dailyMetrics).length > 0) ||
    (garminData.heartRateTimeSeries && garminData.heartRateTimeSeries.length > 0) ||
    garminData.dataSource === 'demo'
  );

  // Debug détaillé pour identifier le problème
  console.log('[SidebarHeartRateChart] 🔍 DIAGNOSTIC DÉTAILLÉ:', {
    hasGarminData: !!garminData,
    hasSelectedDate: !!selectedDate,
    selectedDate,
    hasUsableData,
    dataSource: garminData?.dataSource,
    dailyMetricsKeys: garminData?.dailyMetrics ? Object.keys(garminData.dailyMetrics) : [],
    heartRateTimeSeriesLength: garminData?.heartRateTimeSeries?.length || 0,
    error,
    isLoading
  });

  // Debug spécifique pour les données du jour sélectionné
  if (garminData?.dailyMetrics && selectedDate) {
    const dayData = garminData.dailyMetrics[selectedDate];
    console.log('[SidebarHeartRateChart] 🔍 DONNÉES DU JOUR:', {
      selectedDate,
      hasDayData: !!dayData,
      dayDataKeys: dayData ? Object.keys(dayData) : [],
      hasHeartRate: !!dayData?.heartRate,
      heartRateKeys: dayData?.heartRate ? Object.keys(dayData.heartRate) : [],
      timeSeriesLength: dayData?.heartRate?.timeSeries?.length || 0,
      restingHR: dayData?.heartRate?.resting,
      maxHR: dayData?.heartRate?.max,
      avgHR: dayData?.heartRate?.avg
    });

    // Si pas de données pour le jour sélectionné, essayer avec la date la plus récente
    if (!dayData && garminData.dailyMetrics) {
      const availableDates = Object.keys(garminData.dailyMetrics).sort();
      const latestDate = availableDates[availableDates.length - 1];
      console.log('[SidebarHeartRateChart] 🔍 FALLBACK DATE:', {
        availableDates,
        latestDate,
        latestDateData: !!garminData.dailyMetrics[latestDate]
      });
    }
  }

  // Gestion des états d'erreur et fallbacks
  if (isLoading) {
    return (
      <LoadingWithTimeout
        timeout={loadingTimeout}
        onTimeout={() => {
          const timeoutError = garminDataErrorHandler.createError(
            GarminErrorType.TIMEOUT_ERROR,
            'Délai de chargement dépassé',
            undefined,
            { timeout: loadingTimeout, context: 'chart-loading' }
          );
          handleError(timeoutError, 'loading-timeout');
        }}
        compactMode={compactMode}
        className={className}
      />
    );
  }
  
  if (error) {
    return (
      <LoadingErrorFallback
        error={error}
        onRetry={retryCount < maxRetries ? handleRetry : null}
        retryCount={retryCount}
        maxRetries={maxRetries}
        compactMode={compactMode}
        className={className}
      />
    );
  }
  
  if (!hasUsableData || !selectedDate) {
    return (
      <MissingDataFallback
        selectedDate={selectedDate}
        onSyncRequest={onRetry}
        compactMode={compactMode}
        className={className}
      />
    );
  }

  // Contrainte de hauteur stricte (Requirements 4.1)
  const constrainedHeight = Math.min(height, 300);
  
  return (
    <GarminChartErrorBoundary
      onError={(error, errorInfo) => {
        console.error('[SidebarHeartRateChart] Error Boundary:', error, errorInfo);
        if (onError) {
          const garminError = garminDataErrorHandler.createError(
            GarminErrorType.INVALID_FORMAT,
            `Erreur de rendu: ${error.message}`,
            undefined,
            { originalError: error, errorInfo, context: 'error-boundary' }
          );
          onError(garminError);
        }
      }}
      onRetry={handleRetry}
      maxRetries={maxRetries}
      compactMode={compactMode}
      showRetryButton={retryCount < maxRetries}
    >
      <div 
        ref={containerRef}
        className={`bg-slate-800/60 border border-slate-700 rounded-lg p-3 ${className}`}
        style={{ height: constrainedHeight }}
      >
        {/* Utilisation directe du composant Garmin pour une cohérence parfaite */}
        <Suspense fallback={
          <div className="flex items-center justify-center h-full text-slate-400">
            <div className="text-center">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-sm">Chargement du graphique...</div>
            </div>
          </div>
        }>
          <GarminHeartRateTimeSeriesChart
            dailyMetrics={garminData.dailyMetrics}
            selectedDate={(() => {
              // Fallback intelligent : utiliser la date la plus récente si la date sélectionnée n'a pas de données
              if (garminData?.dailyMetrics) {
                const dayData = garminData.dailyMetrics[selectedDate];
                if (dayData && (dayData.heartRate?.timeSeries?.length > 0 || dayData.heartRate?.resting)) {
                  return selectedDate;
                }
                
                // Pas de données pour la date sélectionnée, utiliser la date la plus récente
                const availableDates = Object.keys(garminData.dailyMetrics).sort();
                const latestDate = availableDates[availableDates.length - 1];
                console.log('[SidebarHeartRateChart] 🔄 FALLBACK: Utilisation de', latestDate, 'au lieu de', selectedDate);
                return latestDate;
              }
              return selectedDate;
            })()}
            colors={colors}
            activities={garminData.activities}
          />
        </Suspense>

        {/* Indication de navigation (Requirement 3.3) */}
        {showNavigationHint && onNavigateToSport && (
          <div className="mt-2 text-center">
            <button
              onClick={() => onNavigateToSport()}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors duration-200 flex items-center justify-center gap-1 w-full py-1 rounded hover:bg-slate-800/30"
              title="Voir les détails dans l'onglet Sport"
            >
              <span>📊</span>
              <span>Voir détails Sport</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-600">Double-clic</span>
            </button>
          </div>
        )}
      </div>
    </GarminChartErrorBoundary>
  );
});

SidebarHeartRateChart.displayName = 'SidebarHeartRateChart';

export default SidebarHeartRateChart;