import React, { memo } from 'react';

/**
 * Module de métriques Garmin (Position 5)
 * Placeholder pour la tâche 9 - À implémenter
 */
const GarminMetricsModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module garmin-metrics-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          ⌚ Métriques Garmin
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de métriques Garmin du jour</p>
          <small>À implémenter dans la tâche 9</small>
        </div>
      </div>
    </div>
  );
});

GarminMetricsModule.displayName = 'GarminMetricsModule';

export default GarminMetricsModule;