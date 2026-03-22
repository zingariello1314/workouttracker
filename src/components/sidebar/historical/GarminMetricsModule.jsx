import { memo, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import { HeartRateZonesChart, SleepPhasesChart, StressLevelChart } from '../../charts/index';
import { useRealGarminData } from '../../../hooks/useRealGarminData';
import SidebarHeartRateChart from '../charts/SidebarHeartRateChart';
import { garminDataErrorHandler, GarminErrorType } from '../../../utils/garminDataErrorHandler';
import logger from '../../../utils/logger';

const garminModLog = logger.module('GarminMetricsModule');

/**
 * Module de métriques Garmin (Position 5)
 * Affiche les métriques Garmin du jour avec navigation vers Sport > Aujourd'hui
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 1.5
 * - Optimisations de performance ajoutées (1.5, 3.5)
 */
const GarminMetricsModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation,
  showHeartRateChart = true,
  chartHeight = 280,
  compactMode = true
}) => {

  // État pour la gestion du basculement entre zones statiques et graphique temporel
  const [showTemporalChart, setShowTemporalChart] = useState(showHeartRateChart);
  const [selectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  
  // États pour la gestion d'erreurs (Requirements 1.4, 1.5)
  const [moduleError, setModuleError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isDegradedMode, setIsDegradedMode] = useState(false);
  const maxRetries = 3;

  // Hook optimisé pour les données Garmin avec mémorisation (Requirements 1.5, 3.5)
  const garminDataConfig = useMemo(() => ({
    selectedDate,
    enableTimeSeriesData: true, // Toujours activer pour avoir le graphique
    optimizeForSidebar: true
  }), [selectedDate]);

  const { garminData, loading, error, refreshData } = useRealGarminData(garminDataConfig);

  // Gestionnaire d'erreurs du module (Requirements 1.4, 1.5)
  const handleModuleError = useCallback((error, context = 'unknown') => {
    console.error('[GarminMetricsModule] Erreur:', error, 'Contexte:', context);
    
    const garminError = garminDataErrorHandler.createError(
      GarminErrorType.INVALID_FORMAT,
      error.message || 'Erreur du module Garmin',
      undefined,
      { originalError: error, context, timestamp: Date.now() }
    );
    
    setModuleError(garminError);
    
    // Activer le mode dégradé en cas d'erreurs répétées
    if (retryCount >= 2) {
      setIsDegradedMode(true);
    }
  }, [retryCount]);

  // Fonction de retry pour le module
  const handleModuleRetry = useCallback(() => {
    if (retryCount >= maxRetries) {
      console.warn('[GarminMetricsModule] Nombre maximum de tentatives atteint');
      return;
    }

    garminModLog.debug(`[GarminMetricsModule] Tentative de retry ${retryCount + 1}/${maxRetries}`);
    
    setModuleError(null);
    setRetryCount(prev => prev + 1);
    
    // Retry des données
    refreshData();
  }, [retryCount, maxRetries, refreshData]);

  // Reset des erreurs quand les données changent
  useEffect(() => {
    if (garminData && !error) {
      setModuleError(null);
      setRetryCount(0);
    }
  }, [garminData, error]);

  // Métriques avec mémorisation optimisée (Requirements 1.5, 3.5)
  const metrics = useMemo(() => {
    if (garminData?.hasData) {
      return garminData.todayMetrics;
    }
    
    // Fallback optimisé avec mémorisation
    const fallbackData = data?.sport?.todayMetrics || data?.garmin || {};
    return {
      calories: fallbackData.calories || { active: 0, resting: 0, total: 0 },
      bodyBattery: fallbackData.bodyBattery || null,
      steps: fallbackData.steps || 0,
      heartRate: fallbackData.heartRate || { resting: null, average: null, max: null },
      sleep: fallbackData.sleep || null
    };
  }, [garminData?.hasData, garminData?.todayMetrics, data?.sport?.todayMetrics, data?.garmin]);

  // Le rafraîchissement est maintenant géré par useRealGarminData

  /**
   * Extrait une valeur numérique d'un objet complexe ou d'une valeur primitive
   */
  const extractNumericValue = (value, defaultValue = 0) => {
    if (value === null || value === undefined) return defaultValue;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    if (typeof value === 'object' && value !== null) {
      // Essayer différentes propriétés communes
      return value.current || value.value || value.total || value.average || value.avg || defaultValue;
    }
    return defaultValue;
  };

  /**
   * Navigation vers Sport > sous-onglet Aujourd'hui (Requirement 3.4)
   */
  const handleNavigateToSport = useCallback(async () => {
    if (!navigation?.setActiveTab) return;

    try {
      const target = {
        tab: 'sport',
        subtab: 'aujourdhui',
        moduleId: 'garmin-today-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      };

      await deepLinkService.navigateToModule(target, navigation.setActiveTab);
    } catch (error) {
      console.error('[GarminMetricsModule] Erreur navigation vers Sport:', error);
    }
  }, [navigation]);

  /**
   * Formate les calories pour l'affichage
   */
  const formatCalories = (calories) => {
    if (!calories) return { active: 0, resting: 0, total: 0 };
    
    if (typeof calories === 'number') {
      return { active: 0, resting: calories, total: calories };
    }
    
    // Extraire les valeurs numériques des objets complexes
    const extractValue = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null) {
        return val.current || val.value || val.total || 0;
      }
      return 0;
    };
    
    const active = extractValue(calories.active);
    const resting = extractValue(calories.resting);
    
    return {
      active,
      resting,
      total: calories.total || active + resting || 0
    };
  };

  /**
   * Formate la fréquence cardiaque pour l'affichage
   */
  const formatHeartRate = (heartRate) => {
    if (!heartRate) return { resting: null, max: null, average: null };
    
    // Extraire les valeurs numériques des objets complexes
    const extractValue = (val) => {
      if (typeof val === 'number') return val;
      if (typeof val === 'object' && val !== null) {
        return val.current || val.value || val.average || val.avg || null;
      }
      return val;
    };
    
    return {
      resting: extractValue(heartRate.resting || heartRate.rest),
      max: extractValue(heartRate.max || heartRate.maximum),
      average: extractValue(heartRate.avg || heartRate.average)
    };
  };

  /**
   * Formate la durée de sommeil pour l'affichage
   * Gère automatiquement la conversion heures/minutes
   */
  const formatSleepDuration = (minutes) => {
    // Debug: Log des données de sommeil reçues
    garminModLog.debug('[GarminMetricsModule] formatSleepDuration - données reçues:', {
      minutes,
      type: typeof minutes,
      isNumber: typeof minutes === 'number',
      isValid: !isNaN(minutes) && minutes > 0
    });
    
    if (!minutes || minutes === 0 || isNaN(minutes)) return '0min';
    
    // Convertir en nombre si c'est une string
    const numMinutes = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
    
    garminModLog.debug('[GarminMetricsModule] Valeur convertie:', numMinutes);
    
    // AMÉLIORATION: Détecter si c'est probablement en heures
    // Cas 1: Valeurs décimales entre 1 et 24 (ex: 12.27 heures)
    // Cas 2: Valeurs entières entre 4 et 20 (plage élargie de sommeil en heures)
    // Cas 3: Valeurs très petites (ex: 0.2 = 12 minutes en heures)
    const isLikelyHours = (
      (numMinutes > 1 && numMinutes < 24 && numMinutes % 1 !== 0) || // Décimales
      (numMinutes >= 4 && numMinutes <= 20 && numMinutes < 60) ||    // Entières dans plage sommeil élargie
      (numMinutes < 1 && numMinutes > 0)                             // Très petites valeurs
    );
    
    if (isLikelyHours) {
      garminModLog.debug('[GarminMetricsModule] 🕐 Détection format heures:', numMinutes);
      const convertedMinutes = numMinutes * 60;
      garminModLog.debug('[GarminMetricsModule] ⏰ Conversion heures->minutes:', numMinutes, '->', convertedMinutes);
      
      // Récursion avec la valeur convertie
      const hours = Math.floor(convertedMinutes / 60);
      const mins = Math.round(convertedMinutes % 60);
      
      garminModLog.debug('[GarminMetricsModule] 📊 Calcul final (après conversion):', { hours, mins });
      
      if (hours === 0) return `${mins}min`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}min`;
    }
    
    // Traitement normal pour les minutes
    const hours = Math.floor(numMinutes / 60);
    const mins = Math.round(numMinutes % 60);
    
    garminModLog.debug('[GarminMetricsModule] 📊 Calcul final (minutes):', { hours, mins });
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  // Mémorisation des valeurs formatées pour optimiser les performances (Requirement 1.5)
  const formattedMetrics = useMemo(() => ({
    calories: formatCalories(metrics.calories),
    heartRate: formatHeartRate(metrics.heartRate),
    bodyBattery: extractNumericValue(metrics.bodyBattery, null),
    steps: extractNumericValue(metrics.steps, 0),
    sleepData: metrics.sleep
  }), [metrics.calories, metrics.heartRate, metrics.bodyBattery, metrics.steps, metrics.sleep]);

  const { calories, heartRate, bodyBattery, steps, sleepData } = formattedMetrics;

  // Debug: Log des données de sommeil complètes
  useEffect(() => {
    garminModLog.debug('[GarminMetricsModule] État des données:', {
      hasGarminData: !!garminData,
      garminDataHasData: garminData?.hasData,
      fallbackData: data?.sport?.todayMetrics || data?.garmin || {},
      sleepData,
      sleepDataDuration: sleepData?.duration,
      sleepDataDurationType: typeof sleepData?.duration
    });
    
    if (sleepData) {
      garminModLog.debug('[GarminMetricsModule] Données de sommeil détaillées:', {
        sleepData,
        duration: sleepData.duration,
        durationType: typeof sleepData.duration,
        quality: sleepData.quality,
        source: garminData ? 'garminData' : 'fallback'
      });
    }
  }, [sleepData, garminData, data]);

  // Affichage conditionnel des données de sommeil (Requirement 3.2, 3.3)
  const shouldShowSleep = useMemo(() => {
    return sleepData && sleepData.duration && sleepData.duration > 0;
  }, [sleepData]);

  // Mesure du temps de rendu initial du module avec optimisations (Requirements 1.5, 3.5)
  const [moduleRenderTime, setModuleRenderTime] = useState(0);
  const moduleRenderStartRef = useRef(null);
  const moduleFrameRequestRef = useRef(null);
  
  useEffect(() => {
    moduleRenderStartRef.current = performance.now();
    
    // Utiliser requestAnimationFrame pour mesurer après le rendu complet
    if (moduleFrameRequestRef.current) {
      cancelAnimationFrame(moduleFrameRequestRef.current);
    }
    
    moduleFrameRequestRef.current = requestAnimationFrame(() => {
      if (moduleRenderStartRef.current) {
        const duration = performance.now() - moduleRenderStartRef.current;
        setModuleRenderTime(duration);
        
        // Log si le rendu dépasse le seuil de 200ms (Requirement 3.5)
        if (duration > 200) {
          console.warn(`[GarminMetricsModule] Rendu initial lent: ${duration.toFixed(2)}ms > 200ms`);
          
          // Activer automatiquement le mode dégradé si le rendu est très lent
          if (duration > 500 && !isDegradedMode) {
            console.warn(`[GarminMetricsModule] Activation automatique du mode dégradé`);
            setIsDegradedMode(true);
          }
        }
      }
    });
    
    return () => {
      if (moduleFrameRequestRef.current) {
        cancelAnimationFrame(moduleFrameRequestRef.current);
      }
    };
  }, [garminData, isExpanded, isDegradedMode]);

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">⌚</span>
          Métriques Garmin
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      
      {isExpanded && (
        <div className="sidebar-section-content">
          {/* Résumé rapide des métriques */}
          <div className="sidebar-data-grid">
            {/* Calories */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
              <span className="sidebar-data-icon">🔥</span>
              <div className="sidebar-data-value">
                {typeof calories.active === 'object' ? 0 : calories.active} + {typeof calories.resting === 'object' ? 0 : calories.resting}
              </div>
              <div className="sidebar-data-label">Calories</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            {/* Body Battery */}
            {bodyBattery !== null && (
              <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
                <span className="sidebar-data-icon">🔋</span>
                <div className="sidebar-data-value">
                  {typeof bodyBattery === 'object' ? 'N/A' : bodyBattery}%
                </div>
                <div className="sidebar-data-label">Body Battery</div>
                <div className="sidebar-data-hint">Voir détails</div>
              </div>
            )}

            {/* Pas */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
              <span className="sidebar-data-icon">👟</span>
              <div className="sidebar-data-value">
                {typeof steps === 'object' ? 0 : (steps || 0).toLocaleString()}
              </div>
              <div className="sidebar-data-label">Pas</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            {/* Fréquence Cardiaque */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
              <span className="sidebar-data-icon">❤️</span>
              <div className="sidebar-data-value">
                {typeof (heartRate.resting || heartRate.average) === 'object' 
                  ? 'N/A' 
                  : (heartRate.resting || heartRate.average || 'N/A')
                } bpm
              </div>
              <div className="sidebar-data-label">FC Repos</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            {/* Données de sommeil conditionnelles (Requirements 3.2, 3.3) */}
            {shouldShowSleep && (
              <div className="sidebar-data-card clickable" onClick={handleNavigateToSport}>
                <span className="sidebar-data-icon">😴</span>
                <div className="sidebar-data-value">
                  {formatSleepDuration(sleepData.duration)}
                </div>
                <div className="sidebar-data-label">Sommeil</div>
                <div className="sidebar-data-hint">
                  {sleepData.quality ? `Qualité: ${sleepData.quality}` : 'Voir détails'}
                </div>
              </div>
            )}
          </div>

          {/* Graphiques avancés Garmin - Utilisation des vraies données */}
          <div className="garmin-charts-section">
            {/* Indicateur de chargement avec timeout */}
            {loading && (
              <div className="charts-loading-state">
                <div className="loading-spinner">⏳</div>
                <div className="loading-message">
                  {isDegradedMode ? 'Chargement simplifié...' : 'Chargement des données Garmin...'}
                </div>
                {isDegradedMode && (
                  <div className="degraded-mode-hint">Mode performance activé</div>
                )}
              </div>
            )}

            {/* Indicateur d'erreur avec retry intelligent */}
            {(error || moduleError) && (
              <div className="charts-error-state">
                <div className="error-icon">⚠️</div>
                <div className="error-message">
                  {moduleError ? 
                    garminDataErrorHandler.createUserFriendlyMessage(moduleError) : 
                    `Erreur: ${error}`
                  }
                </div>
                <div className="error-actions">
                  {retryCount < maxRetries ? (
                    <button 
                      onClick={moduleError ? handleModuleRetry : refreshData} 
                      className="retry-button"
                      title={`Tentative ${retryCount + 1}/${maxRetries}`}
                    >
                      🔄 Réessayer ({retryCount + 1}/{maxRetries})
                    </button>
                  ) : (
                    <div className="max-retries-info">
                      <span className="max-retries-message">Nombre maximum de tentatives atteint</span>
                      <button 
                        onClick={() => setIsDegradedMode(true)}
                        className="degraded-mode-button"
                        title="Activer le mode dégradé"
                      >
                        ⚡ Mode simplifié
                      </button>
                    </div>
                  )}
                </div>
                {moduleError?.details?.suggestion && (
                  <div className="error-suggestion">
                    💡 {moduleError.details.suggestion}
                  </div>
                )}
              </div>
            )}

            {/* Graphiques avec vraies données */}
            {!loading && !error && garminData && (
              <>
                {/* Contrôles de basculement entre zones statiques et graphique temporel */}
                {showHeartRateChart && (garminData.heartRateZones?.length > 0 || garminData.heartRateTimeSeries?.length > 0) && (
                  <div className="chart-toggle-controls">
                    <div className="toggle-buttons">
                      <button
                        className={`toggle-btn ${!showTemporalChart ? 'active' : ''}`}
                        onClick={() => setShowTemporalChart(false)}
                        title="Afficher les zones FC statiques"
                      >
                        📊 Zones
                      </button>
                      <button
                        className={`toggle-btn ${showTemporalChart ? 'active' : ''}`}
                        onClick={() => setShowTemporalChart(true)}
                        title="Afficher le graphique FC temporel"
                      >
                        📈 Graphique
                      </button>
                    </div>
                  </div>
                )}

                {/* Graphique FC temporel - SEUL GRAPHIQUE (7 jours comme dans l'onglet Garmin) */}
                {showHeartRateChart && showTemporalChart && (
                  <div className="chart-container sidebar-optimized">
                    <div className="chart-header" style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: '8px',
                      padding: '0 4px'
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        Fréquence Cardiaque 7j
                      </h4>
                      <button 
                        onClick={() => {
                          garminModLog.debug('[GarminMetricsModule] Bouton Sync cliqué');
                          // Forcer le rechargement des données
                          refreshData();
                          // Émettre des événements pour déclencher la synchronisation
                          window.dispatchEvent(new CustomEvent('garmin:refresh:request', {
                            detail: { source: 'sidebar-sync-button', timestamp: Date.now() }
                          }));
                          window.dispatchEvent(new CustomEvent('garmin:data:updated', {
                            detail: { source: 'sidebar-sync-button', timestamp: Date.now() }
                          }));
                        }}
                        className="sync-button"
                        style={{
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#2563EB';
                          e.target.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = '#3B82F6';
                          e.target.style.transform = 'scale(1)';
                        }}
                        title="Synchroniser les données Garmin"
                      >
                        🔄 Sync
                      </button>
                    </div>
                    <SidebarHeartRateChart
                      garminData={garminData}
                      selectedDate={selectedDate}
                      height={isDegradedMode ? Math.min(chartHeight, 200) : chartHeight}
                      compactMode={compactMode}
                      colors={{ red: '#EF4444' }}
                      className="garmin-hr-temporal-chart"
                      containerWidth={null}
                      onNavigateToSport={handleNavigateToSport}
                      onDataPointClick={(data, index, event) => {
                        if (process.env.NODE_ENV === 'development') {
                          garminModLog.debug('[GarminMetricsModule] Point FC cliqué:', {
                            time: data.time,
                            bpm: data.bpm,
                            isReal: data.isReal,
                            isActivity: data.isActivity
                          });
                        }
                      }}
                      showNavigationHint={true}
                      onError={handleModuleError}
                      onRetry={handleModuleRetry}
                      enableDegradedMode={true}
                      maxRetries={maxRetries}
                      loadingTimeout={isDegradedMode ? 5000 : 10000}
                      performanceThreshold={isDegradedMode ? 300 : 1000}
                      enableLazyLoading={true}
                    />
                  </div>
                )}

                {/* Graphique des zones cardiaques (existant) - Requirement 3.4 */}
                {(!showHeartRateChart || !showTemporalChart) && garminData.heartRateZones && garminData.heartRateZones.length > 0 && (
                  <div className="chart-container">
                    <HeartRateZonesChart
                      data={garminData.heartRateZones}
                      title="Zones de Fréquence Cardiaque"
                      height={140}
                      maxHeartRate={garminData.maxHeartRate || 190}
                      userAge={garminData.userAge || 30}
                      className="garmin-hr-zones-chart"
                    />
                  </div>
                )}

                {/* Graphique des phases de sommeil */}
                {garminData.sleepPhases && garminData.sleepPhases.length > 0 && (
                  <div className="chart-container">
                    <SleepPhasesChart
                      data={garminData.sleepPhases}
                      title="Phases de Sommeil"
                      height={140}
                      sleepObjective={garminData.sleepObjective || 480}
                      className="garmin-sleep-phases-chart"
                    />
                  </div>
                )}

                {/* Graphique des niveaux de stress */}
                {garminData.stressLevels && garminData.stressLevels.length > 0 && (
                  <div className="chart-container">
                    <StressLevelChart
                      data={garminData.stressLevels}
                      title="Niveaux de Stress"
                      height={140}
                      className="garmin-stress-chart"
                    />
                  </div>
                )}

                {/* Message si pas de données graphiques */}
                {(!garminData.heartRateZones?.length && !garminData.sleepPhases?.length && !garminData.stressLevels?.length && !garminData.heartRateTimeSeries?.length) && (
                  <div className="charts-empty-state">
                    <div className="empty-state-icon">📊</div>
                    <div className="empty-state-message">
                      Graphiques détaillés disponibles avec plus de données Garmin
                    </div>
                    <div className="empty-state-hint">
                      Portez votre montre régulièrement pour voir les analyses avancées
                    </div>
                    {garminData.dataDate && (
                      <div className="data-date-info">
                        Dernières données: {garminData.dataDate}
                      </div>
                    )}
                  </div>
                )}

                {/* Informations de performance du module en mode développement (Requirements 1.5, 3.5) */}
                {process.env.NODE_ENV === 'development' && moduleRenderTime > 0 && (
                  <div className="mt-2 p-2 bg-slate-900/20 border border-slate-700/30 rounded text-xs text-slate-500">
                    <div className="flex justify-between items-center">
                      <span>Performance Module:</span>
                      <div className="flex gap-2">
                        <span className={moduleRenderTime > 200 ? 'text-yellow-400' : 'text-green-400'}>
                          {moduleRenderTime.toFixed(1)}ms
                        </span>
                        {isDegradedMode && <span className="text-orange-400">Mode dégradé</span>}
                        {retryCount > 0 && <span className="text-red-400">Retry: {retryCount}</span>}
                      </div>
                    </div>
                    {moduleRenderTime > 200 && (
                      <div className="mt-1 text-yellow-400">
                        ⚠️ Rendu lent détecté - considérez le mode dégradé
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* État vide par défaut */}
            {!loading && !error && !garminData && (
              <div className="charts-empty-state">
                <div className="empty-state-icon">📊</div>
                <div className="empty-state-message">
                  Aucune donnée Garmin disponible
                </div>
                <div className="empty-state-hint">
                  Connectez votre montre Garmin pour voir les analyses
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
});

GarminMetricsModule.displayName = 'GarminMetricsModule';

export default GarminMetricsModule;