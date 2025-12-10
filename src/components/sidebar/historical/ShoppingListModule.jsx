import React, { memo } from 'react';

/**
 * Module de liste de courses (Position 11)
 * Placeholder pour la tâche 11 - À implémenter
 */
const ShoppingListModule = memo(({ 
  moduleId, 
  moduleType, 
  navigationTarget,
  navigation 
}) => {
  return (
    <div className="sidebar-section historical-module shopping-list-module">
      <div className="sidebar-section-header">
        <h3 className="sidebar-section-title">
          🛒 Liste Courses
        </h3>
        <span className="sidebar-module-badge">Nouveau</span>
      </div>
      
      <div className="sidebar-section-content">
        <div className="module-placeholder">
          <p>Module de liste de courses</p>
          <small>À implémenter dans la tâche 11</small>
        </div>
      </div>
    </div>
  );
});

ShoppingListModule.displayName = 'ShoppingListModule';

export default ShoppingListModule;