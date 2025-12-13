import React, { memo, useCallback } from 'react';

/**
 * PatrimonyEvolutionModule - PATTERN LEGACY
 * Refactorisé pour suivre exactement le même pattern que les modules legacy
 */
const PatrimonyEvolutionModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Pas d'état local, pas de useEffect - PATTERN LEGACY
  // Utiliser directement les props comme les modules legacy
  
  /**
   * Navigation handler
   */
  const handleNavigation = useCallback(() => {
    if (!navigation) return;
    
    // Navigation logic here
    console.log('Navigation depuis PatrimonyEvolutionModule');
  }, [navigation]);

  // Données par défaut pour éviter l'affichage vide
  const defaultData = {
    value1: 42,
    value2: 'Exemple',
    value3: 100
  };

  // Utiliser les vraies données si disponibles, sinon les données par défaut
  const displayData = data?.moduleData || defaultData;

  return (
    <section className={`sidebar-section ${isExpanded ? 'expanded' : ''}`}>
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">💰</span>
          Évolution Patrimoine
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      
      {isExpanded && (
        <div className="sidebar-section-content">
          <div className="sidebar-data-grid">
            {/* Contenu du module */}
            <div className="sidebar-data-card clickable" onClick={handleNavigation}>
              <span className="sidebar-data-icon">📊</span>
              <div className="sidebar-data-value">{displayData.value1}</div>
              <div className="sidebar-data-label">Métrique 1</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            <div className="sidebar-data-card clickable" onClick={handleNavigation}>
              <span className="sidebar-data-icon">📈</span>
              <div className="sidebar-data-value">{displayData.value2}</div>
              <div className="sidebar-data-label">Métrique 2</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            <div className="sidebar-data-card clickable" onClick={handleNavigation}>
              <span className="sidebar-data-icon">⭐</span>
              <div className="sidebar-data-value">{displayData.value3}%</div>
              <div className="sidebar-data-label">Métrique 3</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

PatrimonyEvolutionModule.displayName = 'PatrimonyEvolutionModule';

export default PatrimonyEvolutionModule;
