import React, { memo } from 'react';

/**
 * Module de progression de lecture (Position 3)
 * Placeholder pour la tâche 8 - À implémenter
 */
const ReadingProgressModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module reading-progress-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          📚 Progression Lecture
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de progression de lecture</p>
          <small>À implémenter dans la tâche 8</small>
        </div>
      </div>
    </div>
  );
});

ReadingProgressModule.displayName = 'ReadingProgressModule';

export default ReadingProgressModule;