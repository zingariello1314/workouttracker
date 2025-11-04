/**
 * 🔴 FIX #71-80: Composant de statistiques avancées
 * Affiche tendances, moyennes, records personnels pour toutes les métriques
 * 🔴 FIX #51-60: Documentation JSDoc complète
 */
import React from 'react';
import { ARIA_LABELS } from '../constants';

/**
 * Composant de statistiques avancées pour les métriques Garmin
 * Calcule et affiche : moyennes, min, max, tendances pour toutes les métriques
 * 
 * @param {Object} props - Props du composant
 * @param {Object} props.dailyMetrics - Métriques quotidiennes par date (YYYY-MM-DD)
 * @param {string|null} props.selectedDate - Date sélectionnée (non utilisé actuellement)
 * @param {string} props.periodFilter - Filtre de période ('all', 'week', 'month', etc.)
 * @param {string} props.customStartDate - Date de début personnalisée
 * @param {string} props.customEndDate - Date de fin personnalisée
 * @returns {JSX.Element} Composant de statistiques avec cards et filtres
 */
export default function AdvancedStatistics({ dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate }) {
  const [selectedMetric, setSelectedMetric] = React.useState('all');

  /**
   * Calcule les statistiques pour une période donnée
   * Optimisé avec useMemo pour éviter recalculs
   * 
   * @returns {Object|null} Objet contenant toutes les statistiques ou null si pas de données
   * @returns {Object} stats.heartRate - Statistiques FC (resting, max, avg avec avg/min/max/trend)
   * @returns {Object} stats.steps - Statistiques pas (avg/min/max/trend/total)
   * @returns {Object} stats.distance - Statistiques distance (avg/min/max/trend/total)
   * @returns {Object} stats.calories - Statistiques calories (total/active/resting avec avg/min/max/trend/sum)
   * @returns {Object} stats.bodyBattery - Statistiques Body Battery (avg/min/max/trend)
   * @returns {Object} stats.stress - Statistiques stress (avg/min/max/trend)
   * @returns {Object} stats.sleep - Statistiques sommeil (avg/min/max/trend/total)
   * @returns {Object} stats.period - Informations période (start/end/days)
   */
  const stats = React.useMemo(() => {
    if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) return null;

    const dates = Object.keys(dailyMetrics).sort();
    const metricsData = dates.map(date => dailyMetrics[date]);

    // 🔴 FIX : Helper pour extraire valeur numérique même si objet
    const extractNumericFromData = (val, defaultVal = 0) => {
      if (val === null || val === undefined) return defaultVal;
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? defaultVal : parsed;
      }
      if (typeof val === 'object') {
        if ('value' in val) return extractNumericFromData(val.value, defaultVal);
        if ('average' in val) return extractNumericFromData(val.average, defaultVal);
        if ('avg' in val) return extractNumericFromData(val.avg, defaultVal);
        if ('total' in val) return extractNumericFromData(val.total, defaultVal);
        if ('max' in val) return extractNumericFromData(val.max, defaultVal);
        if ('min' in val) return extractNumericFromData(val.min, defaultVal);
      }
      return defaultVal;
    };
    
    // Calculer statistiques globales
    const heartRateData = metricsData
      .map(d => d.heartRate)
      .filter(hr => hr && (hr.resting || hr.max || hr.avg))
      .map(hr => ({
        resting: extractNumericFromData(hr.resting),
        max: extractNumericFromData(hr.max),
        avg: extractNumericFromData(hr.avg)
      }));

    const stepsData = metricsData.map(d => extractNumericFromData(d.steps)).filter(s => s > 0);
    const distanceData = metricsData.map(d => extractNumericFromData(d.distance)).filter(d => d > 0);
    const caloriesData = metricsData
      .map(d => d.calories)
      .filter(c => c && (c.total || c.active || c.resting))
      .map(c => ({
        total: extractNumericFromData(c.total),
        active: extractNumericFromData(c.active),
        resting: extractNumericFromData(c.resting)
      }));

    const bodyBatteryData = metricsData
      .map(d => {
        if (typeof d.bodyBattery === 'object' && d.bodyBattery?.current) {
          return d.bodyBattery.current;
        } else if (typeof d.bodyBattery === 'number') {
          return d.bodyBattery;
        }
        return null;
      })
      .filter(bb => bb !== null);

    const stressData = metricsData
      .map(d => {
        if (typeof d.stress === 'object' && d.stress?.average) {
          return d.stress.average;
        } else if (typeof d.stress === 'number') {
          return d.stress;
        }
        return null;
      })
      .filter(s => s !== null);

    const sleepData = metricsData
      .map(d => d.sleep)
      .filter(s => s && s.duration)
      .map(s => s.duration);

    // Fonction helper pour calculer moyenne
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    // Fonction helper pour calculer min/max
    const min = (arr) => arr.length > 0 ? Math.min(...arr) : 0;
    const max = (arr) => arr.length > 0 ? Math.max(...arr) : 0;

    // Fonction helper pour calculer tendance (linéaire)
    const trend = (arr) => {
      if (arr.length < 2) return 0;
      const n = arr.length;
      const x = Array.from({ length: n }, (_, i) => i);
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = arr.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * arr[i], 0);
      const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      return slope;
    };

    return {
      heartRate: {
        resting: {
          avg: avg(heartRateData.map(hr => hr.resting)),
          min: min(heartRateData.map(hr => hr.resting)),
          max: max(heartRateData.map(hr => hr.resting)),
          trend: trend(heartRateData.map(hr => hr.resting))
        },
        max: {
          avg: avg(heartRateData.map(hr => hr.max)),
          min: min(heartRateData.map(hr => hr.max)),
          max: max(heartRateData.map(hr => hr.max)),
          trend: trend(heartRateData.map(hr => hr.max))
        },
        avg: {
          avg: avg(heartRateData.map(hr => hr.avg)),
          min: min(heartRateData.map(hr => hr.avg)),
          max: max(heartRateData.map(hr => hr.avg)),
          trend: trend(heartRateData.map(hr => hr.avg))
        }
      },
      steps: {
        avg: avg(stepsData),
        min: min(stepsData),
        max: max(stepsData),
        trend: trend(stepsData),
        total: stepsData.reduce((a, b) => a + b, 0)
      },
      distance: {
        avg: avg(distanceData),
        min: min(distanceData),
        max: max(distanceData),
        trend: trend(distanceData),
        total: distanceData.reduce((a, b) => a + b, 0)
      },
      calories: {
        total: {
          avg: avg(caloriesData.map(c => c.total)),
          min: min(caloriesData.map(c => c.total)),
          max: max(caloriesData.map(c => c.total)),
          trend: trend(caloriesData.map(c => c.total)),
          sum: caloriesData.reduce((sum, c) => sum + c.total, 0)
        },
        active: {
          avg: avg(caloriesData.map(c => c.active)),
          min: min(caloriesData.map(c => c.active)),
          max: max(caloriesData.map(c => c.active)),
          trend: trend(caloriesData.map(c => c.active)),
          sum: caloriesData.reduce((sum, c) => sum + c.active, 0)
        },
        resting: {
          avg: avg(caloriesData.map(c => c.resting)),
          min: min(caloriesData.map(c => c.resting)),
          max: max(caloriesData.map(c => c.resting)),
          trend: trend(caloriesData.map(c => c.resting)),
          sum: caloriesData.reduce((sum, c) => sum + c.resting, 0)
        }
      },
      bodyBattery: {
        avg: avg(bodyBatteryData),
        min: min(bodyBatteryData),
        max: max(bodyBatteryData),
        trend: trend(bodyBatteryData)
      },
      stress: {
        avg: avg(stressData),
        min: min(stressData),
        max: max(stressData),
        trend: trend(stressData)
      },
      sleep: {
        avg: avg(sleepData),
        min: min(sleepData),
        max: max(sleepData),
        trend: trend(sleepData),
        total: sleepData.reduce((a, b) => a + b, 0)
      },
      period: {
        start: dates[0],
        end: dates[dates.length - 1],
        days: dates.length
      }
    };
  }, [dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate]);

  if (!stats) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune donnée disponible pour calculer les statistiques.
      </div>
    );
  }

  const formatTrend = (trendValue) => {
    if (Math.abs(trendValue) < 0.01) return 'Stable';
    return trendValue > 0 ? '↗ En hausse' : '↘ En baisse';
  };

  const StatCard = ({ title, icon, children }) => (
    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{icon}</span>
        <h5 className="text-white font-semibold">{title}</h5>
      </div>
      {children}
    </div>
  );

  // 🔴 FIX : Helper pour extraire valeur numérique même si objet
  const extractNumeric = (val, defaultVal = 0) => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? defaultVal : parsed;
    }
    if (typeof val === 'object') {
      if ('value' in val) return extractNumeric(val.value, defaultVal);
      if ('average' in val) return extractNumeric(val.average, defaultVal);
      if ('avg' in val) return extractNumeric(val.avg, defaultVal);
      if ('total' in val) return extractNumeric(val.total, defaultVal);
      if ('max' in val) return extractNumeric(val.max, defaultVal);
      if ('min' in val) return extractNumeric(val.min, defaultVal);
      console.warn('[AdvancedStatistics] extractNumeric: objet sans valeur numérique:', val);
    }
    return defaultVal;
  };
  
  const MetricRow = ({ label, avg, min, max, trend, unit = '' }) => {
    // 🔴 FIX : Extraire valeurs numériques pour éviter objets
    const avgNum = extractNumeric(avg);
    const minNum = extractNumeric(min);
    const maxNum = extractNumeric(max);
    const trendNum = extractNumeric(trend);
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">{label}</span>
          <span className="text-white font-medium">{avgNum.toFixed(1)}{unit}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-slate-500">
            Min: <span className="text-slate-300">{minNum.toFixed(1)}{unit}</span>
          </div>
          <div className="text-slate-500">
            Max: <span className="text-slate-300">{maxNum.toFixed(1)}{unit}</span>
          </div>
          <div className="text-slate-500">
            {formatTrend(trendNum)}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" role="region" aria-label="Statistiques avancées Garmin">
      {/* En-tête */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold text-lg">📊 Statistiques Avancées</h3>
          <div className="text-slate-400 text-sm">
            Période: {stats.period.start} → {stats.period.end} ({stats.period.days} jour{stats.period.days > 1 ? 's' : ''})
          </div>
        </div>
      </div>

      {/* Sélecteur de métrique */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
        <label htmlFor="metric-selector" className="block text-slate-300 text-sm mb-2">
          Filtrer par métrique
        </label>
        <select
          id="metric-selector"
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label="Sélectionner une métrique à afficher"
        >
          <option value="all">Toutes les métriques</option>
          <option value="heartRate">Fréquence cardiaque</option>
          <option value="steps">Pas</option>
          <option value="distance">Distance</option>
          <option value="calories">Calories</option>
          <option value="bodyBattery">Body Battery</option>
          <option value="stress">Stress</option>
          <option value="sleep">Sommeil</option>
        </select>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Fréquence Cardiaque */}
        {(selectedMetric === 'all' || selectedMetric === 'heartRate') && (
          <StatCard title="Fréquence Cardiaque" icon="❤️">
            <MetricRow 
              label="Repos" 
              avg={stats.heartRate.resting.avg} 
              min={stats.heartRate.resting.min} 
              max={stats.heartRate.resting.max}
              trend={stats.heartRate.resting.trend}
              unit=" bpm"
            />
            <div className="mt-3 pt-3 border-t border-slate-700">
              <MetricRow 
                label="Moyenne" 
                avg={stats.heartRate.avg.avg} 
                min={stats.heartRate.avg.min} 
                max={stats.heartRate.avg.max}
                trend={stats.heartRate.avg.trend}
                unit=" bpm"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <MetricRow 
                label="Maximum" 
                avg={stats.heartRate.max.avg} 
                min={stats.heartRate.max.min} 
                max={stats.heartRate.max.max}
                trend={stats.heartRate.max.trend}
                unit=" bpm"
              />
            </div>
          </StatCard>
        )}

        {/* Pas */}
        {(selectedMetric === 'all' || selectedMetric === 'steps') && (
          <StatCard title="Pas" icon="👣">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Moyenne</span>
                <span className="text-white font-medium">{extractNumeric(stats.steps.avg).toFixed(0)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-slate-500">
                  Min: <span className="text-slate-300">{extractNumeric(stats.steps.min).toFixed(0)}</span>
                </div>
                <div className="text-slate-500">
                  Max: <span className="text-slate-300">{extractNumeric(stats.steps.max).toFixed(0)}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total période</span>
                  <span className="text-white font-semibold">{extractNumeric(stats.steps.total).toLocaleString()}</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatTrend(extractNumeric(stats.steps.trend))}
                </div>
              </div>
            </div>
          </StatCard>
        )}

        {/* Distance */}
        {(selectedMetric === 'all' || selectedMetric === 'distance') && (
          <StatCard title="Distance" icon="📍">
            <MetricRow 
              label="Quotidienne" 
              avg={stats.distance.avg} 
              min={stats.distance.min} 
              max={stats.distance.max}
              trend={stats.distance.trend}
              unit=" km"
            />
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total période</span>
                <span className="text-white font-semibold">{stats.distance.total.toFixed(2)} km</span>
              </div>
            </div>
          </StatCard>
        )}

        {/* Calories */}
        {(selectedMetric === 'all' || selectedMetric === 'calories') && (
          <StatCard title="Calories" icon="🔥">
            <MetricRow 
              label="Total" 
              avg={stats.calories.total.avg} 
              min={stats.calories.total.min} 
              max={stats.calories.total.max}
              trend={stats.calories.total.trend}
              unit=" kcal"
            />
            <div className="mt-3 pt-3 border-t border-slate-700">
              <MetricRow 
                label="Active" 
                avg={stats.calories.active.avg} 
                min={stats.calories.active.min} 
                max={stats.calories.active.max}
                trend={stats.calories.active.trend}
                unit=" kcal"
              />
            </div>
              <div className="mt-3 pt-3 border-t border-slate-700">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Total période</span>
                  <span className="text-white font-semibold">{extractNumeric(stats.calories.total.sum).toLocaleString()} kcal</span>
                </div>
              </div>
          </StatCard>
        )}

        {/* Body Battery */}
        {(selectedMetric === 'all' || selectedMetric === 'bodyBattery') && (
          <StatCard title="Body Battery" icon="🔋">
            <MetricRow 
              label="Niveau" 
              avg={stats.bodyBattery.avg} 
              min={stats.bodyBattery.min} 
              max={stats.bodyBattery.max}
              trend={stats.bodyBattery.trend}
              unit="/100"
            />
          </StatCard>
        )}

        {/* Stress */}
        {(selectedMetric === 'all' || selectedMetric === 'stress') && (
          <StatCard title="Stress" icon="😰">
            <MetricRow 
              label="Niveau" 
              avg={stats.stress.avg} 
              min={stats.stress.min} 
              max={stats.stress.max}
              trend={stats.stress.trend}
              unit="/100"
            />
          </StatCard>
        )}

        {/* Sommeil */}
        {(selectedMetric === 'all' || selectedMetric === 'sleep') && (
          <StatCard title="Sommeil" icon="😴">
            <MetricRow 
              label="Durée" 
              avg={stats.sleep.avg} 
              min={stats.sleep.min} 
              max={stats.sleep.max}
              trend={stats.sleep.trend}
              unit=" h"
            />
            <div className="mt-3 pt-3 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Total période</span>
                <span className="text-white font-semibold">{stats.sleep.total.toFixed(1)} h</span>
              </div>
            </div>
          </StatCard>
        )}
      </div>
    </div>
  );
}

