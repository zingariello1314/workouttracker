import React, { memo } from 'react';

/**
 * Module de performance globale (Position 19)
 * Placeholder pour la tâche 16 - À implémenter
 */
const GlobalPerformanceModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module global-performance-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          📊 Performance Globale
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de performance globale</p>
          <small>À implémenter dans la tâche 16</small>
        </div>
      </div>
    </div>
  );
});

GlobalPerformanceModule.displayName = 'GlobalPerformanceModule';

export default GlobalPerformanceModule;