import React from 'react';
import { formatDistance } from '../utils/garminFormatters';

/**
 * Fonction helper pour afficher une grille de métriques (extrait de GarminDailyMetrics)
 * Extrait pour éviter redéfinition à chaque render
 */
export function renderMetricsGrid(metrics) {
  // 🔴 FIX : Helper pour extraire valeur numérique même si objet
  const extractNumeric = (val, defaultVal = 0) => {
    if (val === null || val === undefined) return defaultVal;
    if (typeof val === 'number') {
      if (isNaN(val) || !isFinite(val)) return defaultVal;
      return val;
    }
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
  
  const cal = metrics.calories || {};
  const hrData = metrics.heartRate || {};
  
  // 🔴 FIX : Extraire valeurs numériques pour éviter objets
  const calTotal = extractNumeric(typeof cal === 'object' && 'total' in cal ? cal.total : cal.total);
  const calActive = extractNumeric(typeof cal === 'object' && 'active' in cal ? cal.active : cal.active);
  const calResting = extractNumeric(typeof cal === 'object' && 'resting' in cal ? cal.resting : cal.resting);
  const hrResting = extractNumeric(typeof hrData === 'object' && 'resting' in hrData ? hrData.resting : hrData.resting);
  
  return (
    <>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">Pas</div>
        <div className="text-white text-lg">{extractNumeric(metrics.steps)}</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">Distance</div>
        <div className="text-white text-lg">{formatDistance(extractNumeric(metrics.distance))}</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">Calories totales</div>
        <div className="text-white text-lg">{calTotal}</div>
        <div className="text-slate-400 text-xs mt-1">Actives: {calActive} • Repos: {calResting}</div>
      </div>
      <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
        <div className="text-slate-400 text-xs">FC repos</div>
        <div className="text-white text-lg">{hrResting} bpm</div>
      </div>
      {(() => {
        // PHASE 3.1 : Gérer nouveau format (dict avec current) et ancien format (int)
        const bb = metrics.bodyBattery;
        let bodyBatteryValue = null;
        if (bb !== undefined && bb !== null) {
          if (typeof bb === 'object' && bb.current !== undefined) {
            bodyBatteryValue = extractNumeric(bb.current);
          } else if (typeof bb === 'number') {
            bodyBatteryValue = extractNumeric(bb);
          }
        }
        return bodyBatteryValue !== null && typeof bodyBatteryValue === 'number' && bodyBatteryValue > 0 && (
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
            stressValue = extractNumeric(s.average);
          } else if (typeof s === 'number') {
            stressValue = extractNumeric(s);
          }
        }
        return stressValue !== null && typeof stressValue === 'number' && (
          <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
            <div className="text-slate-400 text-xs">Stress</div>
            <div className="text-white text-lg">{stressValue}</div>
          </div>
        );
      })()}
    </>
  );
}

