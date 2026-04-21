/**
 * 🔴 FIX #39: Composant wrapper pour accessibilité des graphiques
 * Fournit les attributs ARIA standards et la description accessible
 */
import React from 'react';
import { ARIA_LABELS } from '../../constants';

export function ChartWrapper({ 
  chartId, 
  chartType, 
  title, 
  dataLength, 
  dateRange,
  children 
}) {
  const chartLabels = {
    heartRate: ARIA_LABELS.HEART_RATE_CHART,
    bodyBattery: ARIA_LABELS.BODY_BATTERY_CHART,
    stress: ARIA_LABELS.STRESS_CHART,
    sleep: ARIA_LABELS.SLEEP_CHART,
    respiration: ARIA_LABELS.RESPIRATION_CHART
  };
  
  const ariaLabel = chartLabels[chartType] || `${title} chart`;
  const description = `${title} graphique montrant ${dataLength} point(s) de données${dateRange ? ` pour la période ${dateRange}` : ''}.`;
  
  return (
    <div 
      className="rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-6 shadow-md shadow-black/40"
      role="region"
      aria-label={ariaLabel}
      aria-describedby={`${chartId}-description`}
    >
      <div className="flex items-center justify-between mb-4">
        <h4 
          id={`${chartId}-title`} 
          className="text-teal-100 font-semibold"
        >
          {title}
        </h4>
      </div>
      <p id={`${chartId}-description`} className="sr-only">
        {description}
      </p>
      <div
        role="img"
        aria-labelledby={`${chartId}-title`}
        aria-describedby={`${chartId}-description`}
        tabIndex={0}
      >
        {children}
      </div>
    </div>
  );
}

