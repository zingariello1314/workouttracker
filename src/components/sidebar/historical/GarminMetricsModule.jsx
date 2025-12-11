import React, { memo, useState, useEffect, useCallback } from 'react';
import { useGarminData } from '../../../hooks/useGarminData';
import '../../../styles/garmin-metrics-module.css';

/**
 * Module de métriques Garmin (Position 5)
 * Affiche les métriques Garmin du jour avec navigation vers Sport > Aujourd'hui
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
const GarminMetricsModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation,
  data = {}, // Valeur par défaut pour éviter les erreurs
  isExpanded = true // Toujours affiché par défaut pour les modules historiques
}) => {
  const { loadDataForTab, dbReady } = useGarminData();
  const [todayMetrics, setTodayMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [error, setError] = useState(null);

  // Date du jour au format YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  /**
   * Charge les métriques Garmin du jour
   */
  const loadTodayMetrics = useCallback(async () => {
    if (!dbReady) return;

    try {
      setIsLoading(true);
      setError(null);

      // Charger les données pour l'onglet metrics avec la date d'aujourd'hui
      const garminData = await loadDataForTab('metrics', today, 'all', null, null);
      
      if (garminData && garminData.dailyMetrics && garminData.dailyMetrics[today]) {
        const metrics = garminData.dailyMetrics[today];
        setTodayMetrics(metrics);
        setLastSync(new Date());
      } else {
        setTodayMetrics(null);
      }
    } catch (err) {
      console.error('[GarminMetricsModule] Erreur lors du chargement des métriques:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [dbReady, today, loadDataForTab]);

  // Utiliser les données passées via props si disponibles, sinon charger depuis la DB
  useEffect(() => {
    console.log('[GarminMetricsModule] useEffect - data:', data);
    console.log('[GarminMetricsModule] useEffect - data.sport:', data?.sport);
    console.log('[GarminMetricsModule] useEffect - hasGarminData:', data?.sport?.hasGarminData);
    console.log('[GarminMetricsModule] useEffect - todayMetrics:', data?.sport?.todayMetrics);
    console.log('[GarminMetricsModule] useEffect - dbReady:', dbReady);
    
    if (data?.sport?.hasGarminData && data?.sport?.todayMetrics) {
      // Utiliser les données déjà chargées
      console.log('[GarminMetricsModule] Utilisation des données via props');
      setTodayMetrics(data.sport.todayMetrics);
      setLastSync(new Date());
      setIsLoading(false);
      setError(null);
    } else if (data?.sport && !data.sport.hasGarminData) {
      // Pas de données Garmin disponibles
      console.log('[GarminMetricsModule] Pas de données Garmin disponibles');
      setTodayMetrics(null);
      setIsLoading(false);
      setError(null);
    } else if (dbReady) {
      // Charger les données depuis la DB
      console.log('[GarminMetricsModule] Chargement depuis la DB');
      loadTodayMetrics();
    } else {
      // FIX CHIRURGICAL: Toujours afficher du contenu, même en mode démo
      console.log('[GarminMetricsModule] En attente des données - affichage démo');
      setIsLoading(false);
      setTodayMetrics(null); // Cela déclenchera l'affichage des données démo
    }
  }, [data, dbReady, loadTodayMetrics]);

  // Mise à jour temps réel toutes les 5 minutes (seulement si pas de données via props)
  useEffect(() => {
    if (!dbReady || (data?.sport?.hasGarminData && data?.sport?.todayMetrics)) return;

    const interval = setInterval(() => {
      loadTodayMetrics();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [dbReady, loadTodayMetrics, data]);

  /**
   * Navigation vers Sport > sous-onglet Aujourd'hui
   */
  const handleNavigateToSport = useCallback(() => {
    if (!navigation) return;

    const target = {
      tab: 'sport',
      subtab: 'today',
      moduleId: 'garmin-today-module',
      scrollBehavior: 'smooth',
      highlightDuration: 2000
    };

    navigation.navigateToModule(target);
  }, [navigation]);

  /**
   * Formate les calories pour l'affichage
   */
  const formatCalories = (calories) => {
    if (!calories) return { active: 0, resting: 0, total: 0 };
    
    if (typeof calories === 'number') {
      return { active: 0, resting: calories, total: calories };
    }
    
    return {
      active: calories.active || 0,
      resting: calories.resting || 0,
      total: calories.total || calories.active + calories.resting || 0
    };
  };

  /**
   * Formate la fréquence cardiaque pour l'affichage
   */
  const formatHeartRate = (heartRate) => {
    if (!heartRate) return { resting: null, max: null, average: null };
    
    return {
      resting: heartRate.resting || heartRate.rest || null,
      max: heartRate.max || heartRate.maximum || null,
      average: heartRate.avg || heartRate.average || null
    };
  };

  /**
   * Détermine si les données de sommeil sont disponibles
   */
  const hasSleepData = (metrics) => {
    return metrics && (
      metrics.sleep || 
      metrics.sleepDuration || 
      metrics.sleepQuality ||
      (metrics.wellness && (metrics.wellness.sleep || metrics.wellness.sleepDuration))
    );
  };

  /**
   * Formate les données de sommeil
   */
  const formatSleepData = (metrics) => {
    if (!hasSleepData(metrics)) return null;

    const sleep = metrics.sleep || metrics.wellness?.sleep || {};
    const duration = sleep.duration || metrics.sleepDuration || sleep.totalSleep || 0;
    const quality = sleep.quality || metrics.sleepQuality || 'unknown';

    return {
      duration: Math.round(duration / 60), // Convertir en heures si en minutes
      quality,
      deepSleep: sleep.deepSleep || sleep.deep || 0
    };
  };

  if (isLoading) {
    return (
      <div className="sidebar-section historical-module garmin-metrics-module">
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            ⌚ Métriques Garmin
          </h3>
          <span className="sidebar-module-badge">Nouveau</span>
        </div>
        
        {isExpanded && (
          <div className="sidebar-section-content">
            <div className="garmin-loading">
              <div className="loading-spinner" aria-hidden="true"></div>
              <span>Chargement des métriques...</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="sidebar-section historical-module garmin-metrics-module">
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            ⌚ Métriques Garmin
          </h3>
          <span className="sidebar-module-badge error">Erreur</span>
        </div>
        
        {isExpanded && (
          <div className="sidebar-section-content">
            <div className="garmin-error">
              <div className="error-icon" aria-hidden="true">⚠️</div>
              <div className="error-content">
                <p>Erreur de chargement</p>
                <small>{error}</small>
                <button 
                  onClick={loadTodayMetrics}
                  className="retry-button"
                  type="button"
                >
                  Réessayer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!todayMetrics) {
    // Créer des données de démonstration pour le développement
    const demoMetrics = {
      calories: { active: 650, resting: 1350, total: 2000 },
      bodyBattery: 78,
      steps: 7500,
      heartRate: { resting: 62, max: 158, avg: 115 },
      sleep: { duration: 450, quality: 'good' }
    };

    // En mode développement OU si pas de données Garmin, utiliser les données de démo
    if (process.env.NODE_ENV === 'development' || !data?.sport?.hasGarminData) {
      console.log('[GarminMetricsModule] Utilisation des données de démonstration');
      const calories = formatCalories(demoMetrics.calories);
      const heartRate = formatHeartRate(demoMetrics.heartRate);
      const sleepData = formatSleepData(demoMetrics);
      const bodyBattery = demoMetrics.bodyBattery;
      const steps = demoMetrics.steps;

      return (
        <div className="sidebar-section historical-module garmin-metrics-module">
          <div className="sidebar-section-header">
            <h3 className="sidebar-section-title">
              ⌚ Métriques Garmin
            </h3>
            <div className="header-actions">
              <span className="sidebar-module-badge demo">Démo</span>
            </div>
          </div>
          
          {isExpanded && (
            <div className="sidebar-section-content">
            {/* Calories */}
            <div className="metric-group calories-group">
              <div className="metric-header">
                <span className="metric-icon">🔥</span>
                <span className="metric-label">Calories</span>
              </div>
              <div className="metric-values">
                <div className="metric-item">
                  <span className="metric-value">{calories.active.toLocaleString()}</span>
                  <span className="metric-unit">actives</span>
                </div>
                <div className="metric-separator">+</div>
                <div className="metric-item">
                  <span className="metric-value">{calories.resting.toLocaleString()}</span>
                  <span className="metric-unit">repos</span>
                </div>
                <div className="metric-separator">=</div>
                <div className="metric-item total">
                  <span className="metric-value">{calories.total.toLocaleString()}</span>
                  <span className="metric-unit">total</span>
                </div>
              </div>
            </div>

            {/* Body Battery et Pas */}
            <div className="metrics-row">
              <div className="metric-group body-battery-group">
                <div className="metric-header">
                  <span className="metric-icon">🔋</span>
                  <span className="metric-label">Body Battery</span>
                </div>
                <div className="metric-value-large">
                  <span className="value">{bodyBattery}</span>
                  <span className="unit">%</span>
                </div>
                <div className={`battery-bar ${bodyBattery >= 75 ? 'high' : bodyBattery >= 50 ? 'medium' : 'low'}`}>
                  <div 
                    className="battery-fill" 
                    style={{ width: `${Math.max(0, Math.min(100, bodyBattery))}%` }}
                  ></div>
                </div>
              </div>

              <div className="metric-group steps-group">
                <div className="metric-header">
                  <span className="metric-icon">👟</span>
                  <span className="metric-label">Pas</span>
                </div>
                <div className="metric-value-large">
                  <span className="value">{steps.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Fréquence Cardiaque */}
            <div className="metric-group heart-rate-group">
              <div className="metric-header">
                <span className="metric-icon">❤️</span>
                <span className="metric-label">Fréquence Cardiaque</span>
              </div>
              <div className="heart-rate-values">
                {heartRate.resting && (
                  <div className="hr-item">
                    <span className="hr-label">Repos</span>
                    <span className="hr-value">{heartRate.resting} bpm</span>
                  </div>
                )}
                {heartRate.average && (
                  <div className="hr-item">
                    <span className="hr-label">Moyenne</span>
                    <span className="hr-value">{heartRate.average} bpm</span>
                  </div>
                )}
                {heartRate.max && (
                  <div className="hr-item">
                    <span className="hr-label">Max</span>
                    <span className="hr-value">{heartRate.max} bpm</span>
                  </div>
                )}
              </div>
            </div>

            {/* Sommeil */}
            {sleepData && (
              <div className="metric-group sleep-group">
                <div className="metric-header">
                  <span className="metric-icon">😴</span>
                  <span className="metric-label">Sommeil</span>
                </div>
                <div className="sleep-values">
                  <div className="sleep-item">
                    <span className="sleep-label">Durée</span>
                    <span className="sleep-value">{sleepData.duration}h</span>
                  </div>
                  {sleepData.quality !== 'unknown' && (
                    <div className="sleep-item">
                      <span className="sleep-label">Qualité</span>
                      <span className={`sleep-quality ${sleepData.quality}`}>
                        {sleepData.quality === 'excellent' ? '⭐⭐⭐⭐' :
                         sleepData.quality === 'good' ? '⭐⭐⭐' :
                         sleepData.quality === 'fair' ? '⭐⭐' : '⭐'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bouton de navigation */}
            <div className="navigation-section">
              <button 
                onClick={handleNavigateToSport}
                className="nav-button sport"
                type="button"
                aria-label="Naviguer vers l'onglet Sport, sous-onglet Aujourd'hui"
              >
                <span className="nav-icon">🏃‍♂️</span>
                <span className="nav-text">Voir dans Sport</span>
                <span className="nav-arrow">→</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    // En production, afficher le message "pas de données"
    return (
      <div className="sidebar-section historical-module garmin-metrics-module">
        <div className="sidebar-section-header">
          <h3 className="sidebar-section-title">
            ⌚ Métriques Garmin
          </h3>
          <span className="sidebar-module-badge">Nouveau</span>
        </div>
        
        {isExpanded && (
          <div className="sidebar-section-content">
            <div className="garmin-no-data">
              <div className="no-data-icon" aria-hidden="true">📊</div>
              <div className="no-data-content">
                <p>Aucune donnée aujourd'hui</p>
                <small>Synchronisez votre montre Garmin</small>
                <button 
                  onClick={handleNavigateToSport}
                  className="nav-button sport"
                  type="button"
                >
                  Aller à Sport
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const calories = formatCalories(todayMetrics.calories);
  const heartRate = formatHeartRate(todayMetrics.heartRate);
  const sleepData = formatSleepData(todayMetrics);
  const bodyBattery = todayMetrics.bodyBattery || todayMetrics.wellness?.bodyBattery || null;
  const steps = todayMetrics.steps || todayMetrics.wellness?.steps || 0;

  return (
    <div className="sidebar-section historical-module garmin-metrics-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          ⌚ Métriques Garmin
        </h3>
        <div className="header-actions">
          <span className="sidebar-module-badge">Nouveau</span>
          {lastSync && (
            <span className="last-sync" title={`Dernière mise à jour: ${lastSync.toLocaleTimeString()}`}>
              🔄
            </span>
          )}
        </div>
      </div>
      
      <div className="sidebar-section-content">
        {/* Calories */}
        <div className="metric-group calories-group">
          <div className="metric-header">
            <span className="metric-icon">🔥</span>
            <span className="metric-label">Calories</span>
          </div>
          <div className="metric-values">
            <div className="metric-item">
              <span className="metric-value">{calories.active.toLocaleString()}</span>
              <span className="metric-unit">actives</span>
            </div>
            <div className="metric-separator">+</div>
            <div className="metric-item">
              <span className="metric-value">{calories.resting.toLocaleString()}</span>
              <span className="metric-unit">repos</span>
            </div>
            <div className="metric-separator">=</div>
            <div className="metric-item total">
              <span className="metric-value">{calories.total.toLocaleString()}</span>
              <span className="metric-unit">total</span>
            </div>
          </div>
        </div>

        {/* Body Battery et Pas */}
        <div className="metrics-row">
          {bodyBattery !== null && (
            <div className="metric-group body-battery-group">
              <div className="metric-header">
                <span className="metric-icon">🔋</span>
                <span className="metric-label">Body Battery</span>
              </div>
              <div className="metric-value-large">
                <span className="value">{bodyBattery}</span>
                <span className="unit">%</span>
              </div>
              <div className={`battery-bar ${bodyBattery >= 75 ? 'high' : bodyBattery >= 50 ? 'medium' : 'low'}`}>
                <div 
                  className="battery-fill" 
                  style={{ width: `${Math.max(0, Math.min(100, bodyBattery))}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="metric-group steps-group">
            <div className="metric-header">
              <span className="metric-icon">👟</span>
              <span className="metric-label">Pas</span>
            </div>
            <div className="metric-value-large">
              <span className="value">{steps.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Fréquence Cardiaque */}
        <div className="metric-group heart-rate-group">
          <div className="metric-header">
            <span className="metric-icon">❤️</span>
            <span className="metric-label">Fréquence Cardiaque</span>
          </div>
          <div className="heart-rate-values">
            {heartRate.resting && (
              <div className="hr-item">
                <span className="hr-label">Repos</span>
                <span className="hr-value">{heartRate.resting} bpm</span>
              </div>
            )}
            {heartRate.average && (
              <div className="hr-item">
                <span className="hr-label">Moyenne</span>
                <span className="hr-value">{heartRate.average} bpm</span>
              </div>
            )}
            {heartRate.max && (
              <div className="hr-item">
                <span className="hr-label">Max</span>
                <span className="hr-value">{heartRate.max} bpm</span>
              </div>
            )}
          </div>
        </div>

        {/* Sommeil (conditionnel) */}
        {sleepData && (
          <div className="metric-group sleep-group">
            <div className="metric-header">
              <span className="metric-icon">😴</span>
              <span className="metric-label">Sommeil</span>
            </div>
            <div className="sleep-values">
              <div className="sleep-item">
                <span className="sleep-label">Durée</span>
                <span className="sleep-value">{sleepData.duration}h</span>
              </div>
              {sleepData.quality !== 'unknown' && (
                <div className="sleep-item">
                  <span className="sleep-label">Qualité</span>
                  <span className={`sleep-quality ${sleepData.quality}`}>
                    {sleepData.quality === 'excellent' ? '⭐⭐⭐⭐' :
                     sleepData.quality === 'good' ? '⭐⭐⭐' :
                     sleepData.quality === 'fair' ? '⭐⭐' : '⭐'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bouton de navigation */}
        <div className="navigation-section">
          <button 
            onClick={handleNavigateToSport}
            className="nav-button sport"
            type="button"
            aria-label="Naviguer vers l'onglet Sport, sous-onglet Aujourd'hui"
          >
            <span className="nav-icon">🏃‍♂️</span>
            <span className="nav-text">Voir dans Sport</span>
            <span className="nav-arrow">→</span>
          </button>
        </div>
      </div>
    </div>
  );
});

GarminMetricsModule.displayName = 'GarminMetricsModule';

export default GarminMetricsModule;