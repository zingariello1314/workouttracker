import React from 'react';

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
        <div className="text-slate-400 text-xs">Distance (km)</div>
        <div className="text-white text-lg">{metrics.distance ?? 0}</div>
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
      {(metrics.bodyBattery !== undefined && metrics.bodyBattery !== null) && (
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Body Battery</div>
          <div className="text-white text-lg">{metrics.bodyBattery}/100</div>
        </div>
      )}
      {(metrics.stress !== undefined && metrics.stress !== null) && (
        <div className="bg-slate-800/60 border border-slate-700 rounded p-3">
          <div className="text-slate-400 text-xs">Stress</div>
          <div className="text-white text-lg">{metrics.stress}</div>
        </div>
      )}
    </>
  );
}

