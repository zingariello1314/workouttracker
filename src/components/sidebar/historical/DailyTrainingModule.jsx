import React, { memo } from 'react';

/**
 * Module d'entraînement du jour (Position 15)
 * Placeholder pour la tâche 14 - À implémenter
 */
const DailyTrainingModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module daily-training-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          🏋️ Entraînement du Jour
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module d'entraînement du jour</p>
          <small>À implémenter dans la tâche 14</small>
        </div>
      </div>
    </div>
  );
});

DailyTrainingModule.displayName = 'DailyTrainingModule';

export default DailyTrainingModule;