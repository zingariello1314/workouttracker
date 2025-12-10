import React, { memo } from 'react';

/**
 * Module de session de lecture active (Position 13)
 * Placeholder pour la tâche 13 - À implémenter
 */
const ActiveReadingSessionModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module active-reading-session-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          📖 Session Lecture Active
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de session de lecture active</p>
          <small>À implémenter dans la tâche 13</small>
        </div>
      </div>
    </div>
  );
});

ActiveReadingSessionModule.displayName = 'ActiveReadingSessionModule';

export default ActiveReadingSessionModule;