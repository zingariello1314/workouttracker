import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import { HeartRateZonesChart, SleepPhasesChart, StressLevelChart } from '../../charts/index';
import { useRealGarminData } from '../../../hooks/useRealGarminData';
import SidebarHeartRateChart from '../charts/SidebarHeartRateChart';

/**
 * Module de métriques Garmin (Position 5)
 * Affiche les métriques Garmin du jour avec navigation vers Sport > Aujourd'hui
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
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

  // Utiliser le hook pour récupérer les vraies données Garmin avec support des séries temporelles
  const { garminData, loading, error, refreshData } = useRealGarminData({
    selectedDate,
    enableTimeSeriesData: showTemporalChart, // Activer les données temporelles si le graphique est affiché
    optimizeForSidebar: true
  });

  // Utiliser les vraies données Garmin avec fallback sur les données passées en props
  const metrics = useMemo(() => {
    if (garminData && garminData.hasData) {
      return garminData.todayMetrics;
    }
    
    // Fallback sur les données passées en props
    const fallbackData = data?.sport?.todayMetrics || data?.garmin || {};
    return {
      calories: fallbackData.calories || { active: 0, resting: 0, total: 0 },
      bodyBattery: fallbackData.bodyBattery || null,
      steps: fallbackData.steps || 0,
      heartRate: fallbackData.heartRate || { resting: null, average: null, max: null },
      sleep: fallbackData.sleep || null
    };
  }, [garminData, data]);

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
    console.log('[GarminMetricsModule] formatSleepDuration - données reçues:', {
      minutes,
      type: typeof minutes,
      isNumber: typeof minutes === 'number',
      isValid: !isNaN(minutes) && minutes > 0
    });
    
    if (!minutes || minutes === 0 || isNaN(minutes)) return '0min';
    
    // Convertir en nombre si c'est une string
    const numMinutes = typeof minutes === 'string' ? parseFloat(minutes) : minutes;
    
    console.log('[GarminMetricsModule] Valeur convertie:', numMinutes);
    
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
      console.log('[GarminMetricsModule] 🕐 Détection format heures:', numMinutes);
      const convertedMinutes = numMinutes * 60;
      console.log('[GarminMetricsModule] ⏰ Conversion heures->minutes:', numMinutes, '->', convertedMinutes);
      
      // Récursion avec la valeur convertie
      const hours = Math.floor(convertedMinutes / 60);
      const mins = Math.round(convertedMinutes % 60);
      
      console.log('[GarminMetricsModule] 📊 Calcul final (après conversion):', { hours, mins });
      
      if (hours === 0) return `${mins}min`;
      if (mins === 0) return `${hours}h`;
      return `${hours}h ${mins}min`;
    }
    
    // Traitement normal pour les minutes
    const hours = Math.floor(numMinutes / 60);
    const mins = Math.round(numMinutes % 60);
    
    console.log('[GarminMetricsModule] 📊 Calcul final (minutes):', { hours, mins });
    
    if (hours === 0) return `${mins}min`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  const calories = formatCalories(metrics.calories);
  const heartRate = formatHeartRate(metrics.heartRate);
  const bodyBattery = extractNumericValue(metrics.bodyBattery, null);
  const steps = extractNumericValue(metrics.steps, 0);
  const sleepData = metrics.sleep;

  // Debug: Log des données de sommeil complètes
  useEffect(() => {
    console.log('[GarminMetricsModule] État des données:', {
      hasGarminData: !!garminData,
      garminDataHasData: garminData?.hasData,
      fallbackData: data?.sport?.todayMetrics || data?.garmin || {},
      sleepData,
      sleepDataDuration: sleepData?.duration,
      sleepDataDurationType: typeof sleepData?.duration
    });
    
    if (sleepData) {
      console.log('[GarminMetricsModule] Données de sommeil détaillées:', {
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
            {/* Indicateur de chargement */}
            {loading && (
              <div className="charts-loading-state">
                <div className="loading-spinner">⏳</div>
                <div className="loading-message">Chargement des données Garmin...</div>
              </div>
            )}

            {/* Indicateur d'erreur */}
            {error && (
              <div className="charts-error-state">
                <div className="error-icon">⚠️</div>
                <div className="error-message">Erreur: {error}</div>
                <button onClick={refreshData} className="retry-button">Réessayer</button>
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
                        📈 Temporel
                      </button>
                    </div>
                  </div>
                )}

                {/* Graphique FC temporel (nouveau) - Requirements 1.3, 2.3, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5 */}
                {showHeartRateChart && showTemporalChart && (
                  <div className="chart-container sidebar-optimized">
                    <SidebarHeartRateChart
                      garminData={garminData}
                      selectedDate={selectedDate}
                      height={chartHeight}
                      compactMode={compactMode}
                      colors={{ red: '#EF4444' }}
                      className="garmin-hr-temporal-chart"
                      containerWidth={null} // Laisse le composant mesurer automatiquement
                      onNavigateToSport={handleNavigateToSport} // Navigation vers Sport (Requirement 3.3)
                      onDataPointClick={(data, index, event) => {
                        // Log pour debug des interactions (Requirement 1.3)
                        console.log('[GarminMetricsModule] Point FC cliqué:', {
                          time: data.time,
                          bpm: data.bpm,
                          isReal: data.isReal,
                          isActivity: data.isActivity
                        });
                      }}
                      showNavigationHint={true} // Afficher l'indication de navigation (Requirement 3.3)
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