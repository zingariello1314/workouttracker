import React, { memo } from 'react';

/**
 * Module de quêtes interactives (Position 7)
 * Placeholder pour la tâche 12 - À implémenter
 */
const InteractiveQuestsModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module interactive-quests-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          🎯 Quêtes Interactives
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de quêtes interactives</p>
          <small>À implémenter dans la tâche 12</small>
        </div>
      </div>
    </div>
  );
});

InteractiveQuestsModule.displayName = 'InteractiveQuestsModule';

export default InteractiveQuestsModule;