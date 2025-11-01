import React from 'react';
import { formatDistance } from '../utils/garminFormatters';

/**
 * Fonction helper pour afficher une grille de métriques (extrait de GarminDailyMetrics)
 * Extrait pour éviter redéfinition à chaque render
 */
export function renderMetricsGrid(metrics) {
  const cal = metrics.calories || {};
  const hrData = metrics.heartRate || {};
  return (
    <>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">Pas</div>
        <div className="text-white text-lg">{metrics.steps ?? 0}</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">Distance</div>
        <div className="text-white text-lg">{formatDistance(metrics.distance)}</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">Calories totales</div>
        <div className="text-white text-lg">{cal.total ?? 0}</div>
        <div className="text-slate-400 text-xs mt-1">Actives: {cal.active ?? 0} • Repos: {cal.resting ?? 0}</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">FC repos</div>
        <div className="text-white text-lg">{hrData.resting ?? 0} bpm</div>
      </div>
      {(() => {
        // PHASE 3.1 : Gérer nouveau format (dict avec current) et ancien format (int)
        const bb = metrics.bodyBattery;
        let bodyBatteryValue = null;
        if (bb !== undefined && bb !== null) {
          if (typeof bb === 'object' && bb.current !== undefined) {
            bodyBatteryValue = bb.current;
          } else if (typeof bb === 'number') {
            bodyBatteryValue = bb;
          }
        }
        return bodyBatteryValue !== null && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Body Battery</div>
            <div className="text-white text-lg">{bodyBatteryValue}/100</div>
          </div>
        );
      })()}
      {(() => {
        // PHASE 3.2 : Gérer nouveau format (dict avec average/max) et ancien format (int)
        const s = metrics.stress;
        let stressValue = null;
        if (s !== undefined && s !== null) {
          if (typeof s === 'object' && s.average !== undefined) {
            stressValue = s.average;
          } else if (typeof s === 'number') {
            stressValue = s;
          }
        }
        return stressValue !== null && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Stress</div>
            <div className="text-white text-lg">{stressValue}</div>
          </div>
        );
      })()}
    </>
  );
}

