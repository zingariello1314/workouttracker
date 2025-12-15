/**
 * ActivitySelector - Sélecteur d'activités
 * Boutons Sport, Livres et Apprentissage avec états visuels
 */

import React, { memo } from 'react';

const ActivitySelector = memo(({ 
  onSportClick, 
  onBooksClick, 
  onLearningClick,
  activeActivity 
}) => {
  return (
    <div className="activity-buttons-container">
      {/* Grille 2x1 pour Sport et Livres */}
      <div className="activity-buttons-grid">
        <button
          onClick={onSportClick}
          className={`activity-button ${activeActivity === 'sport' ? 'active' : ''}`}
          aria-label="Aller à l'onglet Sport"
        >
          <div className="activity-icon">🏃‍♂️</div>
          <div className="activity-label">Sport</div>
        </button>
        
        <button
          onClick={onBooksClick}
          className={`activity-button ${activeActivity === 'books' ? 'active' : ''}`}
          aria-label="Aller à l'onglet Livres"
        >
          <div className="activity-icon">📚</div>
          <div className="activity-label">Livres</div>
        </button>
      </div>
      
      {/* Bouton Apprentissage pleine largeur en dessous */}
      <button
        onClick={onLearningClick}
        className={`activity-button learning-button-full ${activeActivity === 'learning' ? 'active' : ''}`}
        aria-label="Aller à l'onglet Apprentissage"
      >
        <div className="activity-icon">🎓</div>
        <div className="activity-label">Apprentissage</div>
      </button>
    </div>
  );
});

ActivitySelector.displayName = 'ActivitySelector';

export default ActivitySelector;