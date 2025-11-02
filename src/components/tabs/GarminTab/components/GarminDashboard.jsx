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
    log.debug('Props:', {
      hasDailyMetrics: !!dailyMetrics,
      dateKeys: dailyMetrics ? Object.keys(dailyMetrics).sort() : [],
      selectedDate,
      sampleMetrics: dailyMetrics && Object.keys(dailyMetrics).length > 0 ? dailyMetrics[Object.keys(dailyMetrics)[0]] : null
    });
  }, [dailyMetrics, selectedDate]);

  const dateKeys = Object.keys(dailyMetrics).sort();
  const displayDate = selectedDate || dateKeys[dateKeys.length - 1];
  const d = dailyMetrics[displayDate] || {};
  const calories = d.calories || {};
  const hr = d.heartRate || {};

  // Debug log pour calories (seulement en développement)
  React.useEffect(() => {
    if (displayDate && d) {
      log.debug(`Metrics for ${displayDate}:`, {
        steps: d.steps,
        distance: d.distance,
        calories: d.calories,
        caloriesTotal: calories.total,
        caloriesActive: calories.active,
        caloriesResting: calories.resting,
        heartRate: d.heartRate
      });
    }
  }, [displayDate, d, calories]);

  // Données de comparaison si mode activé
  const compareData = comparisonMode && compareDate ? dailyMetrics[compareDate] || {} : null;
  const compareCalories = compareData?.calories || {};
  const compareHR = compareData?.heartRate || {};

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
    
    const diff = compareValue !== null && typeof value === 'number' && typeof compareValue === 'number' 
      ? value - compareValue 
      : null;
    const diffDisplay = diff !== null && typeof diff === 'number' ? (
      <div className={`text-xs mt-1 ${diff > 0 ? 'text-green-400' : diff < 0 ? 'text-red-400' : 'text-slate-400'}`}>
        {diff > 0 ? '+' : ''}{diff} {typeof value === 'number' ? '(vs comparée)' : ''}
      </div>
    ) : null;

    return (
      <div className={`bg-gradient-to-br ${colors} border rounded-lg p-3`}>
        <div className={`text-${colorType}-300 text-xs mb-1`}>{label}</div>
        <div className="text-white text-xl font-bold">{value}</div>
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
              {renderMetricCard('Pas', d.steps ?? 0, 'blue', compareData?.steps ?? 0)}
              {renderMetricCard('Distance', formatDistance(d.distance), 'blue', formatDistance(compareData?.distance))}
              {renderMetricCard('Calories', calories.total ?? 0, 'orange', compareCalories.total ?? 0)}
              {renderMetricCard('FC Repos', hr.resting ?? 0, 'red', compareHR.resting ?? 0)}
            </div>
          </div>
          {/* Colonne 2 : Date de comparaison */}
          <div>
            <h4 className="text-slate-300 font-medium mb-3 text-sm">{compareDate}</h4>
            <div className="grid grid-cols-2 gap-3">
              {renderMetricCard('Pas', compareData?.steps ?? 0, 'blue')}
              {renderMetricCard('Distance', formatDistance(compareData?.distance), 'blue')}
              {renderMetricCard('Calories', compareCalories.total ?? 0, 'orange')}
              {renderMetricCard('FC Repos', compareHR.resting ?? 0, 'red')}
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
          <div className="text-white text-2xl font-bold">{d.steps ?? 0}</div>
          <div className="text-blue-400 text-xs mt-2">Distance: {formatDistance(d.distance)}</div>
        </div>

        {/* Carte Calories */}
        <div className="bg-gradient-to-br from-orange-800/60 to-orange-900/60 border border-orange-700 rounded-lg p-4">
          <div className="text-orange-300 text-xs mb-1">Calories</div>
          <div className="text-white text-2xl font-bold">{calories.total ?? 0}</div>
          <div className="text-orange-400 text-xs mt-2">
            Actives: {calories.active ?? 0} • Repos: {calories.resting ?? 0}
          </div>
        </div>

        {/* Carte FC */}
        <div className="bg-gradient-to-br from-red-800/60 to-red-900/60 border border-red-700 rounded-lg p-4">
          <div className="text-red-300 text-xs mb-1">FC Repos</div>
          <div className="text-white text-2xl font-bold">{hr.resting ?? 0}</div>
          <div className="text-red-400 text-xs mt-2">
            Max: {hr.max ?? 0} • Moy: {hr.avg ?? 0}
          </div>
        </div>

        {/* Carte Sommeil */}
        {d.sleep && d.sleep.duration > 0 && (
          <div className="bg-gradient-to-br from-indigo-800/60 to-indigo-900/60 border border-indigo-700 rounded-lg p-4">
            <div className="text-indigo-300 text-xs mb-1">Sommeil</div>
            <div className="text-white text-2xl font-bold">
              {formatSleepDuration(d.sleep.duration)}
            </div>
            {d.sleep.quality > 0 && (
              <div className="text-indigo-400 text-xs mt-2">Qualité: {d.sleep.quality}/100</div>
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
        {d.spo2 !== undefined && d.spo2 !== null && (
          <div className="bg-gradient-to-br from-cyan-800/60 to-cyan-900/60 border border-cyan-700 rounded-lg p-4">
            <div className="text-cyan-300 text-xs mb-1">SpO2</div>
            <div className="text-white text-2xl font-bold">{d.spo2}%</div>
            <div className={`text-xs mt-2 ${
              d.spo2 >= 95 ? 'text-green-400' :
              d.spo2 >= 90 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {d.spo2 >= 95 ? 'Normal' : d.spo2 >= 90 ? 'Acceptable' : 'Faible'}
            </div>
          </div>
        )}

        {/* Carte Minutes Intensives */}
        {d.intensityMinutes && (
          <div className="bg-gradient-to-br from-yellow-800/60 to-yellow-900/60 border border-yellow-700 rounded-lg p-4">
            <div className="text-yellow-300 text-xs mb-1">Intensité</div>
            <div className="text-white text-2xl font-bold">{d.intensityMinutes.total ?? 0} min</div>
            <div className="text-yellow-400 text-xs mt-2">
              Modérée: {d.intensityMinutes.moderate ?? 0} • Soutenue: {d.intensityMinutes.vigorous ?? 0} (x2)
            </div>
          </div>
        )}
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

