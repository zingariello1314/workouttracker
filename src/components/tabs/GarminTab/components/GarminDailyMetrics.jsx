import React from 'react';
import { formatHeartRate, formatDistance, formatSleepDuration } from '../utils/garminFormatters';
import { renderMetricsGrid } from './GarminDailyMetricsHelpers';
import { MissingValue } from './MissingDataTooltip';
import { areDailyMetricsPropsEqual } from '../../../../utils/chartComparison';

/**
 * Composant pour afficher les métriques quotidiennes détaillées
 */
function GarminDailyMetrics({
  dailyMetrics,
  dateKeys: dateKeysProp,
  selectedDate,
  setSelectedDate,
  comparisonMode,
  compareDate
}) {
  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune métrique quotidienne disponible.
      </div>
    );
  }

  // 🟡 FIX #22: Memoization des clés de dates triées
  const dateKeys = React.useMemo(() => {
    if (Array.isArray(dateKeysProp)) {
      return dateKeysProp;
    }
    return Object.keys(dailyMetrics).sort();
  }, [dateKeysProp, dailyMetrics]);
  
  // 🟡 FIX #22: Memoization de la date d'affichage
  // 🔴 FIX : Privilégier aujourd'hui si disponible, sinon la date la plus récente valide (pas future)
  const displayDate = React.useMemo(() => {
    if (selectedDate) return selectedDate;
    
    if (dateKeys.length > 0) {
      // 🔴 FIX : Obtenir "aujourd'hui" en date locale (pas UTC)
      const now = new Date();
      const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // 🔴 FIX : Filtrer les dates futures (probablement des données mock)
      const validDates = dateKeys.filter(date => {
        const dateObj = new Date(date + 'T00:00:00');
        const todayObj = new Date(todayLocal + 'T00:00:00');
        return dateObj <= todayObj;
      });
      
      // Utiliser les dates valides si disponibles
      const datesToUse = validDates.length > 0 ? validDates : dateKeys;
      
      // Chercher "aujourd'hui" dans les dates valides
      const todayIndex = datesToUse.indexOf(todayLocal);
      
      if (todayIndex !== -1) {
        return todayLocal;
      } else if (datesToUse.length > 0) {
        // Prendre la date la plus récente valide
        return datesToUse[datesToUse.length - 1];
      } else {
        // Fallback : prendre la première date
        return dateKeys[0];
      }
    }
    
    return null;
  }, [selectedDate, dateKeys]);
  
  // 🟡 FIX #22: Memoization des métriques de la date sélectionnée
  // 🔴 FIX : Extraire valeurs numériques pour éviter objets avec {average, min}
  const extractNumericForDisplay = (val, defaultVal = 0) => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) ? defaultVal : parsed;
    }
    if (typeof val === 'object') {
      if ('value' in val) return extractNumericForDisplay(val.value, defaultVal);
      if ('average' in val) return extractNumericForDisplay(val.average, defaultVal);
      if ('avg' in val) return extractNumericForDisplay(val.avg, defaultVal);
      if ('total' in val) return extractNumericForDisplay(val.total, defaultVal);
      if ('max' in val) return extractNumericForDisplay(val.max, defaultVal);
      if ('min' in val) return extractNumericForDisplay(val.min, defaultVal);
    }
    return defaultVal;
  };
  
  const d = React.useMemo(() => dailyMetrics[displayDate] || {}, [dailyMetrics, displayDate]);
  
  const rawCalories = d.calories || {};
  const calories = React.useMemo(() => ({
    total: extractNumericForDisplay(typeof rawCalories === 'object' && 'total' in rawCalories ? rawCalories.total : rawCalories.total),
    active: extractNumericForDisplay(typeof rawCalories === 'object' && 'active' in rawCalories ? rawCalories.active : rawCalories.active),
    resting: extractNumericForDisplay(typeof rawCalories === 'object' && 'resting' in rawCalories ? rawCalories.resting : rawCalories.resting)
  }), [d.calories]);
  
  const rawHR = d.heartRate || {};
  const hr = React.useMemo(() => ({
    resting: extractNumericForDisplay(typeof rawHR === 'object' && 'resting' in rawHR ? rawHR.resting : rawHR.resting),
    max: extractNumericForDisplay(typeof rawHR === 'object' && 'max' in rawHR ? rawHR.max : rawHR.max),
    avg: extractNumericForDisplay(typeof rawHR === 'object' && 'avg' in rawHR ? rawHR.avg :
                                 typeof rawHR === 'object' && 'average' in rawHR ? rawHR.average : rawHR.avg)
  }), [d.heartRate]);
  
  // 🟡 FIX #22: Memoization des colonnes conditionnelles (éviter recalculs dans le tableau)
  const hasBodyBattery = React.useMemo(() => 
    dateKeys.some(dk => {
      const bb = dailyMetrics[dk]?.bodyBattery;
      return bb !== undefined && bb !== null && (typeof bb === 'object' ? bb.current !== undefined : typeof bb === 'number');
    }),
    [dateKeys, dailyMetrics]
  );
  
  const hasStress = React.useMemo(() =>
    dateKeys.some(dk => {
      const s = dailyMetrics[dk]?.stress;
      return s !== undefined && s !== null && (typeof s === 'object' ? s.average !== undefined : typeof s === 'number');
    }),
    [dateKeys, dailyMetrics]
  );
  
  const hasSpO2 = React.useMemo(() =>
    dateKeys.some(dk => dailyMetrics[dk]?.spo2 !== undefined && dailyMetrics[dk]?.spo2 !== null),
    [dateKeys, dailyMetrics]
  );
  
  // 🟡 FIX #22: Memoization des données du tableau historique
  // 🔴 FIX : Extraire valeurs numériques pour éviter objets avec {average, min}
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
    }
    return defaultVal;
  };
  
  const tableData = React.useMemo(() => {
    return dateKeys.map((dk) => {
      const dm = dailyMetrics[dk] || {};
      const rawCal = dm.calories || {};
      const rawHR = dm.heartRate || {};
      
      // 🔴 FIX : Extraire valeurs numériques pour éviter objets imbriqués
      const calRaw = typeof rawCal === 'object' && rawCal !== null ? rawCal : {};
      const cal = {
        total: extractNumeric('total' in calRaw ? calRaw.total : calRaw.total),
        active: extractNumeric('active' in calRaw ? calRaw.active : calRaw.active),
        resting: extractNumeric('resting' in calRaw ? calRaw.resting : calRaw.resting)
      };
      
      const hrRaw = typeof rawHR === 'object' && rawHR !== null ? rawHR : {};
      const hrRow = {
        resting: extractNumeric('resting' in hrRaw ? hrRaw.resting : hrRaw.resting),
        max: extractNumeric('max' in hrRaw ? hrRaw.max : hrRaw.max),
        avg: extractNumeric('avg' in hrRaw ? hrRaw.avg : ('average' in hrRaw ? hrRaw.average : hrRaw.avg))
      };
      
      const sleep = dm.sleep;
      const sleepStr = sleep && sleep.duration ? formatSleepDuration(sleep.duration) : null;
      const intensityStr = dm.intensityMinutes ? `${extractNumeric(dm.intensityMinutes.total)} min` : null;
      
      return {
        date: dk,
        dm,
        cal,
        hrRow,
        sleep,
        sleepStr,
        intensityStr,
        isSelected: dk === displayDate
      };
    });
  }, [dateKeys, dailyMetrics, displayDate]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">📈 Métriques quotidiennes</h3>
        {dateKeys.length > 1 && (
          <select
            value={displayDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-200 text-sm"
          >
            {dateKeys.map((dk) => (
              <option key={dk} value={dk}>{dk}</option>
            ))}
          </select>
        )}
      </div>

      {/* Tableau historique (toutes les dates) */}
      {dateKeys.length > 1 && (
        <div className="mb-6 overflow-x-auto">
          <table className="min-w-full text-xs text-slate-300 border border-slate-700">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-2 py-2 text-left border-b border-slate-700">Date</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">Pas</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">Distance (km)</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">Calories</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">FC repos</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">FC max</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">FC moy</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">Sommeil</th>
                <th className="px-2 py-2 text-left border-b border-slate-700">Intensité</th>
                {hasBodyBattery && (
                  <th className="px-2 py-2 text-left border-b border-slate-700">Body Battery</th>
                )}
                {hasStress && (
                  <th className="px-2 py-2 text-left border-b border-slate-700">Stress</th>
                )}
                {hasSpO2 && (
                  <th className="px-2 py-2 text-left border-b border-slate-700">SpO2</th>
                )}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row) => (
                <tr
                  key={row.date}
                  className={`odd:bg-slate-800/40 cursor-pointer hover:bg-slate-700/40 ${row.isSelected ? 'bg-blue-900/30' : ''}`}
                  onClick={() => setSelectedDate(row.date)}
                >
                  <td className="px-2 py-1 border-b border-slate-700">{row.date}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{extractNumeric(row.dm.steps)}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{formatDistance(extractNumeric(row.dm.distance))}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{extractNumeric(row.cal.total)}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{extractNumeric(row.hrRow.resting)} bpm</td>
                  <td className="px-2 py-1 border-b border-slate-700">{extractNumeric(row.hrRow.max)} bpm</td>
                  <td className="px-2 py-1 border-b border-slate-700">{extractNumeric(row.hrRow.avg)} bpm</td>
                  <td className="px-2 py-1 border-b border-slate-700">
                    {row.sleepStr || <MissingValue message="Données de sommeil non disponibles. Cette métrique nécessite une synchronisation avec votre montre Garmin." />}
                  </td>
                  <td className="px-2 py-1 border-b border-slate-700">
                    {row.intensityStr || <MissingValue message="Minutes d'intensité non disponibles. Cette métrique nécessite une synchronisation avec votre montre Garmin." />}
                  </td>
                  {hasBodyBattery && (
                    <td className="px-2 py-1 border-b border-slate-700">
                      {(() => {
                        const bb = row.dm.bodyBattery;
                        if (bb === undefined || bb === null) {
                          return <MissingValue message="Body Battery non disponible. Cette métrique nécessite une synchronisation avec votre montre Garmin." />;
                        }
                        const value = typeof bb === 'object' && bb.current !== undefined ? extractNumeric(bb.current) : (typeof bb === 'number' ? extractNumeric(bb) : null);
                        return value !== null && typeof value === 'number' ? `${value}/100` : <MissingValue message="Body Battery non disponible pour cette date." />;
                      })()}
                    </td>
                  )}
                  {hasStress && (
                    <td className="px-2 py-1 border-b border-slate-700">
                      {(() => {
                        const s = row.dm.stress;
                        if (s === undefined || s === null) {
                          return <MissingValue message="Stress non disponible. Cette métrique nécessite une synchronisation avec votre montre Garmin." />;
                        }
                        const value = typeof s === 'object' && s.average !== undefined ? extractNumeric(s.average) : (typeof s === 'number' ? extractNumeric(s) : null);
                        return value !== null && typeof value === 'number' ? value : <MissingValue message="Stress non disponible pour cette date." />;
                      })()}
                    </td>
                  )}
                  {hasSpO2 && (
                    <td className="px-2 py-1 border-b border-slate-700">
                      {row.dm.spo2 !== undefined && row.dm.spo2 !== null 
                        ? `${extractNumeric(row.dm.spo2)}%` 
                        : <MissingValue message="SpO2 (Saturation en oxygène) non disponible. Cette métrique nécessite une synchronisation avec votre montre Garmin." />
                      }
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Mode Comparaison - Afficher les deux dates côte à côte */}
      {comparisonMode && compareDate && (
        <div className="mb-6 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
          <h5 className="text-purple-300 font-semibold mb-4">Mode Comparaison Activé</h5>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Colonne 1 : Date sélectionnée */}
            <div>
              <h6 className="text-white font-medium mb-3">📅 {displayDate}</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderMetricsGrid(d)}
              </div>
            </div>
            {/* Colonne 2 : Date de comparaison */}
            <div>
              <h6 className="text-white font-medium mb-3">📅 {compareDate}</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {renderMetricsGrid(dailyMetrics[compareDate] || {})}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Détails de la date sélectionnée */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Pas</div>
          <div className="text-white text-lg">{extractNumericForDisplay(d.steps)}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Distance (km)</div>
          <div className="text-white text-lg">{formatDistance(extractNumericForDisplay(d.distance))}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Étages</div>
          <div className="text-white text-lg">{extractNumericForDisplay(d.floors)}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Calories totales</div>
          <div className="text-white text-lg">{extractNumericForDisplay(calories.total)}</div>
          <div className="text-slate-400 text-xs mt-1">Actives: {extractNumericForDisplay(calories.active)} • Repos: {extractNumericForDisplay(calories.resting)}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">FC repos</div>
          <div className="text-white text-lg">{extractNumericForDisplay(hr.resting)} bpm</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">FC max</div>
          <div className="text-white text-lg">{extractNumericForDisplay(hr.max)} bpm</div>
        </div>
        {(extractNumericForDisplay(hr.avg) || extractNumericForDisplay(hr.avg) === 0) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">FC moyenne</div>
            <div className="text-white text-lg">{extractNumericForDisplay(hr.avg)} bpm</div>
          </div>
        )}
        {d.sleep && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3 md:col-span-2">
            <div className="text-slate-400 text-xs">Sommeil</div>
            <div className="text-white text-lg">
              {d.sleep.duration ? formatSleepDuration(d.sleep.duration) : (
                <MissingValue message="Durée de sommeil non disponible. Cette métrique nécessite une synchronisation avec votre montre Garmin." />
              )}
            </div>
            {(() => {
              const quality = extractNumericForDisplay(d.sleep.quality);
              return quality > 0 && (
                <div className="text-slate-400 text-xs mt-1">Qualité: {quality}/100</div>
              );
            })()}
            {(() => {
              const deepSleep = extractNumericForDisplay(d.sleep.deepSleep);
              const lightSleep = extractNumericForDisplay(d.sleep.lightSleep);
              const remSleep = extractNumericForDisplay(d.sleep.remSleep);
              return (deepSleep > 0 || lightSleep > 0 || remSleep > 0) && (
              <div className="text-slate-400 text-xs mt-1">
                  {deepSleep > 0 && <span>Profond: {Math.floor(deepSleep)}h{Math.round((deepSleep % 1) * 60)}m</span>}
                  {lightSleep > 0 && <span className="ml-2">Léger: {Math.floor(lightSleep)}h{Math.round((lightSleep % 1) * 60)}m</span>}
                  {remSleep > 0 && <span className="ml-2">REM: {Math.floor(remSleep)}h{Math.round((remSleep % 1) * 60)}m</span>}
              </div>
              );
            })()}
            {(d.sleep.bedTime || d.sleep.wakeTime) && (
              <div className="text-slate-400 text-xs mt-1">
                {d.sleep.bedTime && <span>Coucher: {d.sleep.bedTime}</span>}
                {d.sleep.wakeTime && <span className="ml-2">Lever: {d.sleep.wakeTime}</span>}
              </div>
            )}
          </div>
        )}
        {d.respiration && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3 md:col-span-2">
            <div className="text-slate-400 text-xs mb-3 font-semibold">Respiration (resp/min)</div>
            <div className="space-y-3">
              {d.respiration.awake && (() => {
                const awakeMin = extractNumericForDisplay(d.respiration.awake.min);
                const awakeMax = extractNumericForDisplay(d.respiration.awake.max);
                const awakeAvg = extractNumericForDisplay(d.respiration.awake.avg);
                return (awakeMin > 0 || awakeMax > 0 || awakeAvg > 0) && (
                <div>
                  <div className="text-slate-300 text-xs mb-2 font-medium">Éveillé</div>
                  <div className="flex gap-3 flex-wrap">
                      {awakeMin > 0 && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Min</span>
                          <div className="text-white text-sm font-semibold">{awakeMin}</div>
                      </div>
                    )}
                      {awakeAvg > 0 && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Moy</span>
                          <div className="text-white text-sm font-semibold">{awakeAvg}</div>
                      </div>
                    )}
                      {awakeMax > 0 && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Max</span>
                          <div className="text-white text-sm font-semibold">{awakeMax}</div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}
              {d.respiration.sleep && (() => {
                const sleepMin = extractNumericForDisplay(d.respiration.sleep.min);
                const sleepMax = extractNumericForDisplay(d.respiration.sleep.max);
                const sleepAvg = extractNumericForDisplay(d.respiration.sleep.avg);
                return (sleepMin > 0 || sleepMax > 0 || sleepAvg > 0) && (
                <div>
                  <div className="text-slate-300 text-xs mb-2 font-medium">Sommeil</div>
                  <div className="flex gap-3 flex-wrap">
                      {sleepMin > 0 && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Min</span>
                          <div className="text-white text-sm font-semibold">{sleepMin}</div>
                      </div>
                    )}
                      {sleepAvg > 0 && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Moy</span>
                          <div className="text-white text-sm font-semibold">{sleepAvg}</div>
                      </div>
                    )}
                      {sleepMax > 0 && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Max</span>
                          <div className="text-white text-sm font-semibold">{sleepMax}</div>
                      </div>
                    )}
                  </div>
                </div>
                );
              })()}
            </div>
          </div>
        )}
        {d.intensityMinutes && (() => {
          const total = extractNumericForDisplay(d.intensityMinutes.total);
          const moderate = extractNumericForDisplay(d.intensityMinutes.moderate);
          const vigorous = extractNumericForDisplay(d.intensityMinutes.vigorous);
          return (total > 0 || moderate > 0 || vigorous > 0) ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Minutes intensives</div>
              <div className="text-white text-lg">{total} min</div>
            <div className="text-slate-400 text-xs mt-1">
                Modérée: {moderate} • Soutenue: {vigorous} (x2)
              </div>
            </div>
          ) : null;
        })()}
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
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
              <div className="text-slate-400 text-xs">Body Battery</div>
              <div className="text-white text-lg">{bodyBatteryValue}/100</div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    bodyBatteryValue >= 70 ? 'bg-green-500' :
                    bodyBatteryValue >= 50 ? 'bg-yellow-500' :
                    bodyBatteryValue >= 30 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${bodyBatteryValue}%` }}
                />
              </div>
            </div>
          );
        })()}
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
            <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
              <div className="text-slate-400 text-xs">Stress</div>
              <div className="text-white text-lg">{stressValue}</div>
              <div className="mt-2 w-full bg-slate-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    stressValue <= 25 ? 'bg-green-500' :
                    stressValue <= 50 ? 'bg-yellow-500' :
                    stressValue <= 75 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(stressValue * 2, 100)}%` }}
                />
              </div>
            </div>
          );
        })()}
        {(d.spo2 !== undefined && d.spo2 !== null) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">SpO2 (Saturation O₂)</div>
            <div className="text-white text-lg">{d.spo2}%</div>
            <div className={`text-xs mt-1 ${
              d.spo2 >= 95 ? 'text-green-400' :
              d.spo2 >= 90 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {d.spo2 >= 95 ? 'Normal' : d.spo2 >= 90 ? 'Acceptable' : 'Faible'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(GarminDailyMetrics, areDailyMetricsPropsEqual);

