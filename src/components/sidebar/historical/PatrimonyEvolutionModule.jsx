import React, { memo } from 'react';

/**
 * Module d'évolution du patrimoine (Position 9)
 * Placeholder pour la tâche 10 - À implémenter
 */
const PatrimonyEvolutionModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module patrimony-evolution-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          💰 Évolution Patrimoine
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module d'évolution du patrimoine</p>
          <small>À implémenter dans la tâche 10</small>
        </div>
      </div>
    </div>
  );
});

PatrimonyEvolutionModule.displayName = 'PatrimonyEvolutionModule';

export default PatrimonyEvolutionModule;