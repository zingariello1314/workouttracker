import React, { memo } from 'react';

/**
 * Module d'enregistrement de sessions (Position 1)
 * Placeholder pour la tâche 4 - À implémenter
 */
const SessionRecorderModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module session-recorder-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          📝 Enregistrer Session
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module d'enregistrement de sessions</p>
          <small>À implémenter dans la tâche 4</small>
        </div>
      </div>
    </div>
  );
});

SessionRecorderModule.displayName = 'SessionRecorderModule';

export default SessionRecorderModule;