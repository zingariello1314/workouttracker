/**
 * ReadingProgressModule - Module de progression lecture (Position 3)
 * Structure identique aux anciens modules sidebar
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React, { memo, useCallback } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';

/**
 * Composant principal ReadingProgressModule - PATTERN LEGACY
 */
const ReadingProgressModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Pas d'état local, pas de useEffect - PATTERN LEGACY
  // Utiliser directement les props comme les modules legacy
  const stats = data?.books?.stats || {
    sessions: 12,
    totalPages: 156,
    totalTime: 420, // en minutes
    avgSpeed: 22.3
  };

  // Handler de navigation
  const handleNavigateToBooks = useCallback(async () => {
    if (navigation?.setActiveTab) {
      try {
        await deepLinkService.navigateToModule({
          tab: 'books',
          subtab: 'reading',
          moduleId: 'reading-progress',
          scrollBehavior: 'smooth'
        }, navigation.setActiveTab);
      } catch (error) {
        console.error('Erreur de navigation vers Livres:', error);
        // Fallback
        navigation.setActiveTab('books');
      }
    }
  }, [navigation]);

  // Formatage du temps
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h${remainingMinutes}min` : `${hours}h`;
  };

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
          <span className="sidebar-section-icon">📚</span>
          Progression Lecture
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
            {/* Sessions */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToBooks}>
              <span className="sidebar-data-icon">📖</span>
              <div className="sidebar-data-value">{stats.sessions}</div>
              <div className="sidebar-data-label">Sessions</div>
              <div className="sidebar-data-hint">Voir sessions</div>
            </div>

            {/* Pages */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToBooks}>
              <span className="sidebar-data-icon">📄</span>
              <div className="sidebar-data-value">{stats.totalPages}</div>
              <div className="sidebar-data-label">Pages</div>
              <div className="sidebar-data-hint">Voir stats</div>
            </div>

            {/* Temps */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToBooks}>
              <span className="sidebar-data-icon">⏱️</span>
              <div className="sidebar-data-value">{formatTime(stats.totalTime)}</div>
              <div className="sidebar-data-label">Temps</div>
              <div className="sidebar-data-hint">Voir détails</div>
            </div>

            {/* Vitesse */}
            <div className="sidebar-data-card clickable" onClick={handleNavigateToBooks}>
              <span className="sidebar-data-icon">⚡</span>
              <div className="sidebar-data-value">{stats.avgSpeed} p/h</div>
              <div className="sidebar-data-label">Vitesse</div>
              <div className="sidebar-data-hint">Voir analyse</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

ReadingProgressModule.displayName = 'ReadingProgressModule';

export default ReadingProgressModule;