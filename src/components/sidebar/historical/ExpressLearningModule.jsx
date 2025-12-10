import React, { memo } from 'react';

/**
 * Module d'apprentissage express (Position 21)
 * Placeholder pour la tâche 17 - À implémenter
 */
const ExpressLearningModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module express-learning-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          🧠 Apprentissage Express
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module d'apprentissage express</p>
          <small>À implémenter dans la tâche 17</small>
        </div>
      </div>
    </div>
  );
});

ExpressLearningModule.displayName = 'ExpressLearningModule';

export default ExpressLearningModule;