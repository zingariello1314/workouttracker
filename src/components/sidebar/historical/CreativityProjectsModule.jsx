import React, { memo } from 'react';

/**
 * Module de créativité et projets (Position 17)
 * Placeholder pour la tâche 15 - À implémenter
 */
const CreativityProjectsModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module creativity-projects-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          🎨 Créativité & Projets
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de créativité et projets</p>
          <small>À implémenter dans la tâche 15</small>
        </div>
      </div>
    </div>
  );
});

CreativityProjectsModule.displayName = 'CreativityProjectsModule';

export default CreativityProjectsModule;