import React from 'react';
import PropTypes from 'prop-types';
import { formatDistance, formatSleepDuration } from '../utils/garminFormatters';
import GanttChart from './GanttChart';
import AdvancedStatistics from './AdvancedStatistics';
import logger from '../../../../utils/logger';

const log = logger.component('GarminDashboard');

/**
 * Composant Dashboard pour afficher les métriques quotidiennes principales
 */
export default function GarminDashboard({ 
  dailyMetrics, 
  selectedDate, 
  comparisonMode, 
  compareDate,
  activities = { swimming: [], jumpRope: [], cardio: [] }, 
  periodFilter = 'all', 
  customStartDate = null, 
  customEndDate = null 
}) {
  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune métrique disponible. Synchronisez vos données Garmin.
      </div>
    );
  }

  // Debug log (seulement en développement)
  React.useEffect(() => {
    // 🔴 FIX : Éviter de logger des objets complexes qui pourraient causer des problèmes
    const sampleDate = dailyMetrics && Object.keys(dailyMetrics).length > 0 ? Object.keys(dailyMetrics)[0] : null;
    const sampleMetrics = sampleDate ? dailyMetrics[sampleDate] : null;
    // Nettoyer les objets complexes pour éviter problèmes de sérialisation
    const cleanedSample = sampleMetrics ? {
      steps: sampleMetrics.steps,
      distance: sampleMetrics.distance,
      calories: sampleMetrics.calories,
      heartRate: sampleMetrics.heartRate ? {
        resting: sampleMetrics.heartRate.resting,
        max: sampleMetrics.heartRate.max,
        avg: sampleMetrics.heartRate.avg
      } : null,
      hasBodyBattery: !!sampleMetrics.bodyBattery,
      hasStress: !!sampleMetrics.stress,
      hasPerformance: !!sampleMetrics.performance,
      hasHeartRateZones: !!sampleMetrics.heartRateZones
    } : null;
    
    log.debug('Props:', {
      hasDailyMetrics: !!dailyMetrics,
      dateKeys: dailyMetrics ? Object.keys(dailyMetrics).sort() : [],
      selectedDate,
      sampleMetrics: cleanedSample
    });
  }, [dailyMetrics, selectedDate]);

  const dateKeys = Object.keys(dailyMetrics).sort();
  const displayDate = selectedDate || dateKeys[dateKeys.length - 1];
  const d = dailyMetrics[displayDate] || {};
  
  // Helper pour extraire une valeur numérique d'un objet ou valeur
  // Gère récursivement les cas où même les sous-propriétés sont des objets
  // GARANTIT toujours un retour numérique (jamais un objet)
  const extractNumeric = (val, defaultVal = 0) => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'number') {
      // Vérifier que ce n'est pas NaN ou Infinity
      if (isNaN(val) || !isFinite(val)) return defaultVal;
      return val;
    }
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? defaultVal : parsed;
    }
    if (typeof val === 'object') {
      // Si c'est un objet, chercher une valeur numérique (récursif)
      // Ordre de priorité : value > average/avg > total > max > min
      if ('value' in val) {
        const extracted = extractNumeric(val.value, defaultVal);
        if (typeof extracted === 'number' && !isNaN(extracted) && isFinite(extracted)) return extracted;
      }
      if ('average' in val) {
        const extracted = extractNumeric(val.average, defaultVal);
        if (typeof extracted === 'number' && !isNaN(extracted) && isFinite(extracted)) return extracted;
      }
      if ('avg' in val) {
        const extracted = extractNumeric(val.avg, defaultVal);
        if (typeof extracted === 'number' && !isNaN(extracted) && isFinite(extracted)) return extracted;
      }
      if ('total' in val) {
        const extracted = extractNumeric(val.total, defaultVal);
        if (typeof extracted === 'number' && !isNaN(extracted) && isFinite(extracted)) return extracted;
      }
      if ('max' in val) {
        const extracted = extractNumeric(val.max, defaultVal);
        if (typeof extracted === 'number' && !isNaN(extracted) && isFinite(extracted)) return extracted;
      }
      if ('min' in val) {
        const extracted = extractNumeric(val.min, defaultVal);
        if (typeof extracted === 'number' && !isNaN(extracted) && isFinite(extracted)) return extracted;
      }
      // Si aucun champ numérique trouvé, logger un avertissement et retourner default
      console.warn('[GarminDashboard] extractNumeric: objet sans valeur numérique trouvée:', val);
    }
    // GARANTIE : toujours retourner un nombre
    return typeof defaultVal === 'number' ? defaultVal : 0;
  };
  
  // 🔴 FIX : Extraire les valeurs numériques de calories, éviter les objets
  // S'assurer que calories est toujours un objet avec des nombres, jamais d'objets imbriqués
  const rawCalories = d.calories || {};
  const calories = {
    total: extractNumeric(
      typeof rawCalories === 'object' && rawCalories !== null && 'total' in rawCalories ? rawCalories.total :
      typeof rawCalories === 'object' && rawCalories !== null && 'average' in rawCalories ? rawCalories.average :
      typeof rawCalories === 'number' ? rawCalories : 
      typeof rawCalories === 'object' && rawCalories !== null ? rawCalories.total : 0
    ),
    active: extractNumeric(
      typeof rawCalories === 'object' && rawCalories !== null && 'active' in rawCalories ? rawCalories.active : 
      typeof rawCalories === 'object' && rawCalories !== null ? rawCalories.active : 0
    ),
    resting: extractNumeric(
      typeof rawCalories === 'object' && rawCalories !== null && 'resting' in rawCalories ? rawCalories.resting :
      typeof rawCalories === 'object' && rawCalories !== null ? rawCalories.resting : 0
    )
  };
  
  // 🔴 FIX : Extraire les valeurs numériques de heartRate, éviter les objets
  // S'assurer que hr est toujours un objet avec des nombres, jamais d'objets imbriqués
  const rawHR = d.heartRate || {};
  const hr = {
    resting: extractNumeric(
      typeof rawHR === 'object' && rawHR !== null && 'resting' in rawHR ? rawHR.resting :
      typeof rawHR === 'object' && rawHR !== null && 'average' in rawHR ? rawHR.average :
      typeof rawHR === 'number' ? rawHR :
      typeof rawHR === 'object' && rawHR !== null ? rawHR.resting : 0
    ),
    max: extractNumeric(
      typeof rawHR === 'object' && rawHR !== null && 'max' in rawHR ? rawHR.max :
      typeof rawHR === 'object' && rawHR !== null ? rawHR.max : 0
    ),
    avg: extractNumeric(
      typeof rawHR === 'object' && rawHR !== null && 'avg' in rawHR ? rawHR.avg :
      typeof rawHR === 'object' && rawHR !== null && 'average' in rawHR ? rawHR.average :
      typeof rawHR === 'object' && rawHR !== null ? rawHR.avg : 0
    )
  };

  // Debug log pour calories (seulement en développement)
  React.useEffect(() => {
    if (displayDate && d) {
      // 🔴 FIX : Éviter de logger des objets complexes
      const cleanedHeartRate = d.heartRate ? {
        resting: d.heartRate.resting,
        max: d.heartRate.max,
        avg: d.heartRate.avg
      } : null;
      
      // 🔴 FIX : Nettoyer calories aussi pour éviter objets dans logs
      const cleanedCalories = d.calories ? {
        total: extractNumeric(typeof d.calories === 'object' && 'total' in d.calories ? d.calories.total : d.calories.total),
        active: extractNumeric(typeof d.calories === 'object' && 'active' in d.calories ? d.calories.active : d.calories.active),
        resting: extractNumeric(typeof d.calories === 'object' && 'resting' in d.calories ? d.calories.resting : d.calories.resting)
      } : null;
      
      log.debug(`Metrics for ${displayDate}:`, {
        steps: extractNumeric(d.steps),
        distance: extractNumeric(d.distance),
        calories: cleanedCalories,
        caloriesTotal: calories.total,
        caloriesActive: calories.active,
        caloriesResting: calories.resting,
        heartRate: cleanedHeartRate
      });
    }
  }, [displayDate, d, calories]);

  // Données de comparaison si mode activé
  const compareData = comparisonMode && compareDate ? dailyMetrics[compareDate] || {} : null;
  
  // 🔴 FIX : Extraire les valeurs numériques pour comparaison aussi
  const rawCompareCalories = compareData?.calories || {};
  const compareCalories = {
    total: extractNumeric(
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null && 'total' in rawCompareCalories ? rawCompareCalories.total :
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null && 'average' in rawCompareCalories ? rawCompareCalories.average :
      typeof rawCompareCalories === 'number' ? rawCompareCalories :
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null ? rawCompareCalories.total : 0
    ),
    active: extractNumeric(
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null && 'active' in rawCompareCalories ? rawCompareCalories.active :
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null ? rawCompareCalories.active : 0
    ),
    resting: extractNumeric(
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null && 'resting' in rawCompareCalories ? rawCompareCalories.resting :
      typeof rawCompareCalories === 'object' && rawCompareCalories !== null ? rawCompareCalories.resting : 0
    )
  };
  
  const rawCompareHR = compareData?.heartRate || {};
  const compareHR = {
    resting: extractNumeric(
      typeof rawCompareHR === 'object' && rawCompareHR !== null && 'resting' in rawCompareHR ? rawCompareHR.resting :
      typeof rawCompareHR === 'object' && rawCompareHR !== null && 'average' in rawCompareHR ? rawCompareHR.average :
      typeof rawCompareHR === 'number' ? rawCompareHR :
      typeof rawCompareHR === 'object' && rawCompareHR !== null ? rawCompareHR.resting : 0
    ),
    max: extractNumeric(
      typeof rawCompareHR === 'object' && rawCompareHR !== null && 'max' in rawCompareHR ? rawCompareHR.max :
      typeof rawCompareHR === 'object' && rawCompareHR !== null ? rawCompareHR.max : 0
    ),
    avg: extractNumeric(
      typeof rawCompareHR === 'object' && rawCompareHR !== null && 'avg' in rawCompareHR ? rawCompareHR.avg :
      typeof rawCompareHR === 'object' && rawCompareHR !== null && 'average' in rawCompareHR ? rawCompareHR.average :
      typeof rawCompareHR === 'object' && rawCompareHR !== null ? rawCompareHR.avg : 0
    )
  };

  // Helper pour afficher une carte de métrique avec comparaison
  const renderMetricCard = (label, value, colorType, compareValue = null) => {
    const colorClasses = {
      blue: 'from-blue-800/60 to-blue-900/60 border-blue-700',
      orange: 'from-orange-800/60 to-orange-900/60 border-orange-700',
      red: 'from-red-800/60 to-red-900/60 border-red-700',
      green: 'from-green-800/60 to-green-900/60 border-green-700',
      purple: 'from-purple-800/60 to-purple-900/60 border-purple-700',
      indigo: 'from-indigo-800/60 to-indigo-900/60 border-indigo-700',
      cyan: 'from-cyan-800/60 to-cyan-900/60 border-cyan-700',
      yellow: 'from-yellow-800/60 to-yellow-900/60 border-yellow-700'
    };
    const colors = colorClasses[colorType] || colorClasses.blue;
    
    // 🔴 FIX : Utiliser extractNumeric() pour garantir une valeur numérique
    const numericValue = extractNumeric(value);
    const numericCompareValue = compareValue !== null ? extractNumeric(compareValue) : null;
    
    // 🔴 FIX : Pour les strings (comme formatDistance), ne pas utiliser extractNumeric
    let displayValue;
    if (typeof value === 'string') {
      displayValue = value;
    } else {
      displayValue = numericValue;
    }
    
    const diff = numericCompareValue !== null 
      ? numericValue - numericCompareValue 
      : null;
    const diffDisplay = diff !== null && typeof diff === 'number' && !isNaN(diff) ? (
      <div className={`text-xs mt-1 ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
        {diff > 0 ? '+' : ''}{diff} (vs comparée)
      </div>
    ) : null;

    return (
      <div className={`bg-gradient-to-br ${colors} border rounded-lg p-3`}>
        <div className={`text-${colorType}-300 text-xs mb-1`}>{label}</div>
        <div className="text-white text-xl font-bold">{displayValue}</div>
        {diffDisplay}
      </div>
    );
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">📊 Dashboard - {displayDate}</h3>
        {comparisonMode && compareDate && (
          <div className="text-sm text-purple-300">
            Comparaison avec <span className="font-semibold text-white">{compareDate}</span>
          </div>
        )}
      </div>
      
      {/* Mode Comparaison - Deux colonnes */}
      {comparisonMode && compareDate && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Colonne 1 : Date sélectionnée */}
          <div>
            <h4 className="text-slate-300 font-medium mb-3 text-sm">{displayDate}</h4>
            <div className="grid grid-cols-2 gap-3">
              {renderMetricCard('Pas', extractNumeric(d.steps), 'blue', extractNumeric(compareData?.steps))}
              {renderMetricCard('Distance', formatDistance(extractNumeric(d.distance)), 'blue', formatDistance(extractNumeric(compareData?.distance)))}
              {renderMetricCard('Calories', extractNumeric(calories.total), 'orange', extractNumeric(compareCalories.total))}
              {renderMetricCard('FC Repos', extractNumeric(hr.resting), 'red', extractNumeric(compareHR.resting))}
            </div>
          </div>
          {/* Colonne 2 : Date de comparaison */}
          <div>
            <h4 className="text-slate-300 font-medium mb-3 text-sm">{compareDate}</h4>
            <div className="grid grid-cols-2 gap-3">
              {renderMetricCard('Pas', extractNumeric(compareData?.steps), 'blue')}
              {renderMetricCard('Distance', formatDistance(extractNumeric(compareData?.distance)), 'blue')}
              {renderMetricCard('Calories', extractNumeric(compareCalories.total), 'orange')}
              {renderMetricCard('FC Repos', extractNumeric(compareHR.resting), 'red')}
            </div>
          </div>
        </div>
      )}

      {/* Vue normale */}
      {!comparisonMode && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Carte Pas */}
        <div className="bg-gradient-to-br from-blue-800/60 to-blue-900/60 border border-blue-700 rounded-lg p-4">
          <div className="text-blue-300 text-xs mb-1">Pas</div>
          <div className="text-white text-2xl font-bold">{extractNumeric(d.steps)}</div>
          <div className="text-blue-400 text-xs mt-2">Distance: {formatDistance(extractNumeric(d.distance))}</div>
        </div>

        {/* Carte Calories */}
        <div className="bg-gradient-to-br from-orange-800/60 to-orange-900/60 border border-orange-700 rounded-lg p-4">
          <div className="text-orange-300 text-xs mb-1">Calories</div>
          <div className="text-white text-2xl font-bold">{extractNumeric(calories.total)}</div>
          <div className="text-orange-400 text-xs mt-2">
            Actives: {extractNumeric(calories.active)} • Repos: {extractNumeric(calories.resting)}
          </div>
        </div>

        {/* Carte FC */}
        <div className="bg-gradient-to-br from-red-800/60 to-red-900/60 border border-red-700 rounded-lg p-4">
          <div className="text-red-300 text-xs mb-1">FC Repos</div>
          <div className="text-white text-2xl font-bold">{extractNumeric(hr.resting)}</div>
          <div className="text-red-400 text-xs mt-2">
            Max: {extractNumeric(hr.max)} • Moy: {extractNumeric(hr.avg)}
          </div>
        </div>

        {/* Carte Sommeil */}
        {d.sleep && d.sleep.duration > 0 && (
          <div className="bg-gradient-to-br from-indigo-800/60 to-indigo-900/60 border border-indigo-700 rounded-lg p-4">
            <div className="text-indigo-300 text-xs mb-1">Sommeil</div>
            <div className="text-white text-2xl font-bold">
              {formatSleepDuration(d.sleep.duration)}
            </div>
            {extractNumeric(d.sleep.quality) > 0 && (
              <div className="text-indigo-400 text-xs mt-2">Qualité: {extractNumeric(d.sleep.quality)}/100</div>
            )}
          </div>
        )}

        {/* Carte Body Battery */}
        {(() => {
          // PHASE 3.1 : Gérer nouveau format (dict avec current) et ancien format (int)
          let bodyBatteryValue = null;
          if (d.bodyBattery !== undefined && d.bodyBattery !== null) {
            if (typeof d.bodyBattery === 'object' && d.bodyBattery.current !== undefined) {
              bodyBatteryValue = d.bodyBattery.current;
            } else if (typeof d.bodyBattery === 'number') {
              bodyBatteryValue = d.bodyBattery;
            }
          }
          return bodyBatteryValue !== null && (
            <div className="bg-gradient-to-br from-green-800/60 to-green-900/60 border border-green-700 rounded-lg p-4">
              <div className="text-green-300 text-xs mb-1">Body Battery</div>
              <div className="text-white text-2xl font-bold">{bodyBatteryValue}/100</div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    bodyBatteryValue >= 70 ? 'bg-green-400' :
                    bodyBatteryValue >= 50 ? 'bg-yellow-400' :
                    bodyBatteryValue >= 30 ? 'bg-orange-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${bodyBatteryValue}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Carte Stress */}
        {(() => {
          // PHASE 3.2 : Gérer nouveau format (dict avec average/max) et ancien format (int)
          let stressValue = null;
          if (d.stress !== undefined && d.stress !== null) {
            if (typeof d.stress === 'object' && d.stress.average !== undefined) {
              stressValue = d.stress.average;
            } else if (typeof d.stress === 'number') {
              stressValue = d.stress;
            }
          }
          return stressValue !== null && (
            <div className="bg-gradient-to-br from-purple-800/60 to-purple-900/60 border border-purple-700 rounded-lg p-4">
              <div className="text-purple-300 text-xs mb-1">Stress</div>
              <div className="text-white text-2xl font-bold">{stressValue}</div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stressValue <= 25 ? 'bg-green-400' :
                    stressValue <= 50 ? 'bg-yellow-400' :
                    stressValue <= 75 ? 'bg-orange-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(stressValue * 2, 100)}%` }}
                />
              </div>
            </div>
          );
        })()}

        {/* Carte SpO2 */}
        {d.spo2 !== undefined && d.spo2 !== null && (() => {
          const spo2Value = extractNumeric(d.spo2);
          return spo2Value > 0 && (
            <div className="bg-gradient-to-br from-cyan-800/60 to-cyan-900/60 border border-cyan-700 rounded-lg p-4">
              <div className="text-cyan-300 text-xs mb-1">SpO2</div>
              <div className="text-white text-2xl font-bold">{spo2Value}%</div>
              <div className={`text-xs mt-2 ${
                spo2Value >= 95 ? 'text-green-400' :
                spo2Value >= 90 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {spo2Value >= 95 ? 'Normal' : spo2Value >= 90 ? 'Acceptable' : 'Faible'}
              </div>
            </div>
          );
        })()}

        {/* Carte Minutes Intensives */}
        {d.intensityMinutes && (() => {
          const total = extractNumeric(d.intensityMinutes.total);
          const moderate = extractNumeric(d.intensityMinutes.moderate);
          const vigorous = extractNumeric(d.intensityMinutes.vigorous);
          return total > 0 || moderate > 0 || vigorous > 0 ? (
            <div className="bg-gradient-to-br from-yellow-800/60 to-yellow-900/60 border border-yellow-700 rounded-lg p-4">
              <div className="text-yellow-300 text-xs mb-1">Intensité</div>
              <div className="text-white text-2xl font-bold">{total} min</div>
              <div className="text-yellow-400 text-xs mt-2">
                Modérée: {moderate} • Soutenue: {vigorous} (x2)
              </div>
            </div>
          ) : null;
        })()}
        </div>
      )}

      {/* 🔴 FIX #81-87: Gantt Chart */}
      {activities && (
        <div className="mt-6">
          <GanttChart
            activities={activities}
            startDate={customStartDate}
            endDate={customEndDate}
          />
        </div>
      )}

      {/* 🔴 FIX #71-80: Statistiques avancées */}
      <div className="mt-6">
        <AdvancedStatistics
          dailyMetrics={dailyMetrics}
          selectedDate={selectedDate}
          periodFilter={periodFilter}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
        />
      </div>
    </div>
  );
}

// 🔴 FIX : Validation PropTypes (seulement en développement)
if (process.env.NODE_ENV === 'development') {
  GarminDashboard.propTypes = {
    dailyMetrics: PropTypes.objectOf(PropTypes.object).isRequired,
    selectedDate: PropTypes.string,
    comparisonMode: PropTypes.bool,
    compareDate: PropTypes.string,
    activities: PropTypes.shape({
      swimming: PropTypes.array,
      jumpRope: PropTypes.array,
      cardio: PropTypes.array
    }),
    periodFilter: PropTypes.oneOf(['all', 'week', 'month', 'year', 'custom']),
    customStartDate: PropTypes.string,
    customEndDate: PropTypes.string
  };
}

