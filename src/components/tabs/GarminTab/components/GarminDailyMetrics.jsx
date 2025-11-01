import React from 'react';
import { formatHeartRate, formatDistance, formatSleepDuration } from '../utils/garminFormatters';
import { renderMetricsGrid } from './GarminDailyMetricsHelpers';
import { MissingValue } from './MissingDataTooltip';

/**
 * Composant pour afficher les métriques quotidiennes détaillées
 */
export default function GarminDailyMetrics({ dailyMetrics, selectedDate, setSelectedDate, comparisonMode, compareDate }) {
  if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6 text-center text-slate-400">
        Aucune métrique quotidienne disponible.
      </div>
    );
  }

  // 🟡 FIX #22: Memoization des clés de dates triées
  const dateKeys = React.useMemo(() => Object.keys(dailyMetrics).sort(), [dailyMetrics]);
  
  // 🟡 FIX #22: Memoization de la date d'affichage
  const displayDate = React.useMemo(() => 
    selectedDate || (dateKeys.length > 0 ? dateKeys[dateKeys.length - 1] : null),
    [selectedDate, dateKeys]
  );
  
  // 🟡 FIX #22: Memoization des métriques de la date sélectionnée
  const d = React.useMemo(() => dailyMetrics[displayDate] || {}, [dailyMetrics, displayDate]);
  const calories = React.useMemo(() => d.calories || {}, [d.calories]);
  const hr = React.useMemo(() => d.heartRate || {}, [d.heartRate]);
  
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
  const tableData = React.useMemo(() => {
    return dateKeys.map((dk) => {
      const dm = dailyMetrics[dk] || {};
      const cal = dm.calories || {};
      const hrRow = dm.heartRate || {};
      const sleep = dm.sleep;
      const sleepStr = sleep && sleep.duration ? formatSleepDuration(sleep.duration) : null;
      const intensityStr = dm.intensityMinutes ? `${dm.intensityMinutes.total || 0} min` : null;
      
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
                  <td className="px-2 py-1 border-b border-slate-700">{row.dm.steps ?? 0}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{formatDistance(row.dm.distance)}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{row.cal.total ?? 0}</td>
                  <td className="px-2 py-1 border-b border-slate-700">{row.hrRow.resting ?? 0} bpm</td>
                  <td className="px-2 py-1 border-b border-slate-700">{row.hrRow.max ?? 0} bpm</td>
                  <td className="px-2 py-1 border-b border-slate-700">{row.hrRow.avg ?? 0} bpm</td>
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
                        const value = typeof bb === 'object' && bb.current !== undefined ? bb.current : (typeof bb === 'number' ? bb : null);
                        return value !== null ? `${value}/100` : <MissingValue message="Body Battery non disponible pour cette date." />;
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
                        const value = typeof s === 'object' && s.average !== undefined ? s.average : (typeof s === 'number' ? s : null);
                        return value !== null ? value : <MissingValue message="Stress non disponible pour cette date." />;
                      })()}
                    </td>
                  )}
                  {hasSpO2 && (
                    <td className="px-2 py-1 border-b border-slate-700">
                      {row.dm.spo2 !== undefined && row.dm.spo2 !== null 
                        ? `${row.dm.spo2}%` 
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
          <div className="text-white text-lg">{d.steps ?? 0}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Distance (km)</div>
          <div className="text-white text-lg">{formatDistance(d.distance)}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Étages</div>
          <div className="text-white text-lg">{d.floors ?? 0}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Calories totales</div>
          <div className="text-white text-lg">{calories.total ?? 0}</div>
          <div className="text-slate-400 text-xs mt-1">Actives: {calories.active ?? 0} • Repos: {calories.resting ?? 0}</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">FC repos</div>
          <div className="text-white text-lg">{hr.resting ?? 0} bpm</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">FC max</div>
          <div className="text-white text-lg">{hr.max ?? 0} bpm</div>
        </div>
        {(hr.avg || hr.avg === 0) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">FC moyenne</div>
            <div className="text-white text-lg">{hr.avg ?? 0} bpm</div>
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
            {d.sleep.quality > 0 && (
              <div className="text-slate-400 text-xs mt-1">Qualité: {d.sleep.quality}/100</div>
            )}
            {(d.sleep.deepSleep || d.sleep.lightSleep || d.sleep.remSleep) && (
              <div className="text-slate-400 text-xs mt-1">
                {d.sleep.deepSleep && <span>Profond: {Math.floor(d.sleep.deepSleep)}h{Math.round((d.sleep.deepSleep % 1) * 60)}m</span>}
                {d.sleep.lightSleep && <span className="ml-2">Léger: {Math.floor(d.sleep.lightSleep)}h{Math.round((d.sleep.lightSleep % 1) * 60)}m</span>}
                {d.sleep.remSleep && <span className="ml-2">REM: {Math.floor(d.sleep.remSleep)}h{Math.round((d.sleep.remSleep % 1) * 60)}m</span>}
              </div>
            )}
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
              {d.respiration.awake && (d.respiration.awake.min || d.respiration.awake.max || d.respiration.awake.avg) && (
                <div>
                  <div className="text-slate-300 text-xs mb-2 font-medium">Éveillé</div>
                  <div className="flex gap-3 flex-wrap">
                    {d.respiration.awake.min && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Min</span>
                        <div className="text-white text-sm font-semibold">{d.respiration.awake.min}</div>
                      </div>
                    )}
                    {d.respiration.awake.avg && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Moy</span>
                        <div className="text-white text-sm font-semibold">{d.respiration.awake.avg}</div>
                      </div>
                    )}
                    {d.respiration.awake.max && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Max</span>
                        <div className="text-white text-sm font-semibold">{d.respiration.awake.max}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {d.respiration.sleep && (d.respiration.sleep.min || d.respiration.sleep.max || d.respiration.sleep.avg) && (
                <div>
                  <div className="text-slate-300 text-xs mb-2 font-medium">Sommeil</div>
                  <div className="flex gap-3 flex-wrap">
                    {d.respiration.sleep.min && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Min</span>
                        <div className="text-white text-sm font-semibold">{d.respiration.sleep.min}</div>
                      </div>
                    )}
                    {d.respiration.sleep.avg && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Moy</span>
                        <div className="text-white text-sm font-semibold">{d.respiration.sleep.avg}</div>
                      </div>
                    )}
                    {d.respiration.sleep.max && (
                      <div className="bg-slate-900/60 border border-slate-600 rounded px-2 py-1">
                        <span className="text-slate-400 text-xs">Max</span>
                        <div className="text-white text-sm font-semibold">{d.respiration.sleep.max}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {d.intensityMinutes && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Minutes intensives</div>
            <div className="text-white text-lg">{d.intensityMinutes.total ?? 0} min</div>
            <div className="text-slate-400 text-xs mt-1">
              Modérée: {d.intensityMinutes.moderate ?? 0} • Soutenue: {d.intensityMinutes.vigorous ?? 0} (x2)
            </div>
          </div>
        )}
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

