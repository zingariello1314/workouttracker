/**
 * LearningButton - Bouton Apprentissage
 * Bouton pleine largeur avec icône et animation
 */

import React, { memo } from 'react';

const LearningButton = memo(({ 
  onClick, 
  isMenuOpen 
}) => {
  return (
    <button
      onClick={onClick}
      className={`learning-button ${isMenuOpen ? 'active' : ''}`}
      aria-label="Enregistrer une session d'apprentissage"
      aria-expanded={isMenuOpen}
    >
      <div className="learning-icon">🎓</div>
      Apprentissage
    </button>
  );
});

LearningButton.displayName = 'LearningButton';

export default LearningButton;