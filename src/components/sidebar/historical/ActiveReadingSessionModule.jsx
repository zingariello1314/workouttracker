/**
 * ActiveReadingSessionModule - Module Session Lecture Active (Position 13)
 * 
 * Fonctionnalités:
 * - Affichage du livre en cours avec progression
 * - Affichage du timer de session actuelle
 * - Affichage des objectifs pages/temps du jour avec progression
 * - Navigation vers Livres > module session avec positionnement exact
 * - Mise à jour automatique des statistiques
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import React, { memo, useCallback, useEffect, useState } from 'react';
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp,
  Play,
  Pause,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import deepLinkService from '../../../services/navigation/DeepLinkService';

/**
 * Composant principal ActiveReadingSessionModule - PATTERN LEGACY
 */
const ActiveReadingSessionModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation,
  todayDate,
  embedded = false
}) => {
  // État local pour le timer actif (si une session est en cours)
  const [activeTimer, setActiveTimer] = useState(null);

  // Écouter les événements de timer depuis SessionRecorderModule
  useEffect(() => {
    const handleTimerUpdate = (event) => {
      setActiveTimer(event.detail);
    };

    const handleTimerStop = () => {
      setActiveTimer(null);
    };

    window.addEventListener('reading:timer:update', handleTimerUpdate);
    window.addEventListener('reading:timer:stop', handleTimerStop);
    window.addEventListener('historical:session:stopped', handleTimerStop);

    return () => {
      window.removeEventListener('reading:timer:update', handleTimerUpdate);
      window.removeEventListener('reading:timer:stop', handleTimerStop);
      window.removeEventListener('historical:session:stopped', handleTimerStop);
    };
  }, []);

  /**
   * Navigation vers Livres > module session (timer, livre en cours, CTA principal)
   */
  const handleNavigation = useCallback(async () => {
    if (!navigation?.setActiveTab) return;
    
    try {
      await deepLinkService.navigateToModule({
        tab: 'books',
        subtab: 'reading',
        moduleId: 'reading-session-module',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      }, navigation.setActiveTab);
    } catch (error) {
      console.error('Erreur de navigation vers module session:', error);
      navigation.setActiveTab('books');
    }
  }, [navigation]);

  /** Livres > Statistiques (progression du jour, objectifs) */
  const handleStatsProgression = useCallback(() => {
    if (typeof navigation?.toBooks === 'function') {
      navigation.toBooks({ tab: 'statistics', section: 'progression', date: todayDate });
    } else {
      handleNavigation();
    }
  }, [navigation, todayDate, handleNavigation]);

  /** Livres > Statistiques > sessions */
  const handleStatsSessions = useCallback(() => {
    if (typeof navigation?.toBooks === 'function') {
      navigation.toBooks({ tab: 'statistics', section: 'sessions' });
    } else {
      handleNavigation();
    }
  }, [navigation, handleNavigation]);

  /** Livres > Bibliothèque > fiche du livre (sélectionner le livre pour afficher sa fiche) */
  const handleBookFicheClick = useCallback((bookId) => {
    if (typeof navigation?.toBooks === 'function' && bookId != null) {
      navigation.toBooks({ bookId, subtab: 'library' });
    } else {
      handleNavigation();
    }
  }, [navigation, handleNavigation]);

  // Extraire les données du module
  const moduleData = data?.activeReadingSession || {};
  const currentBook = moduleData.currentBook || null;
  const dailyGoals = moduleData.dailyGoals || { pages: 20, minutes: 30 };
  const todayProgress = moduleData.todayProgress || { pages: 0, minutes: 0 };
  const sessionTimer = activeTimer || moduleData.sessionTimer || null;

  // Calculer les pourcentages de progression
  const pagesProgress = dailyGoals.pages > 0 ? Math.min((todayProgress.pages / dailyGoals.pages) * 100, 100) : 0;
  const timeProgress = dailyGoals.minutes > 0 ? Math.min((todayProgress.minutes / dailyGoals.minutes) * 100, 100) : 0;

  // Formater le temps
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Données par défaut si aucune session active
  const hasActiveSession = currentBook || sessionTimer;
  const hasData = moduleData.hasData !== false;

  const content = (
        <div className="sidebar-section-content">
          {!hasData ? (
            // État de chargement ou pas de données - cliquable → Sessions
            <div className="sidebar-data-grid">
              <div className="sidebar-data-card clickable" onClick={handleNavigation} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigation(); } }} role="button" tabIndex={0} aria-label="Aucune session. Cliquer pour aller aux sessions de lecture" title="Aller aux sessions">
                <span className="sidebar-data-icon">📚</span>
                <div className="sidebar-data-value">--</div>
                <div className="sidebar-data-label">Aucune session</div>
                <div className="sidebar-data-hint">Démarrez une lecture</div>
              </div>
            </div>
          ) : (
            <div className="sidebar-data-grid">
              {/* Livre en cours → clic = fiche du livre (Bibliothèque) */}
              {currentBook ? (
                <div 
                  className="sidebar-data-card clickable" 
                  onClick={() => handleBookFicheClick(currentBook.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleBookFicheClick(currentBook.id); } }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Livre en cours: ${currentBook.title}. Cliquer pour ouvrir la fiche du livre`}
                  title="Ouvrir la fiche du livre"
                >
                  <span className="sidebar-data-icon">📚</span>
                  <div className="sidebar-data-value">{currentBook.title}</div>
                  <div className="sidebar-data-label">
                    {currentBook.currentPage || 0}/{currentBook.totalPages || '?'} pages
                  </div>
                  <div className="sidebar-data-hint">
                    {currentBook.progress ? `${Math.round(currentBook.progress)}% terminé` : 'Voir la fiche'}
                  </div>
                </div>
              ) : (
                <div className="sidebar-data-card clickable" onClick={handleNavigation}>
                  <span className="sidebar-data-icon">📖</span>
                  <div className="sidebar-data-value">Aucun livre</div>
                  <div className="sidebar-data-label">Session inactive</div>
                  <div className="sidebar-data-hint">Commencer une lecture</div>
                </div>
              )}

              {/* Timer de session actuelle - cliquable → Sessions */}
              {sessionTimer ? (
                <div 
                  className="sidebar-data-card clickable" 
                  onClick={handleNavigation}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNavigation(); } }}
                  role="button"
                  tabIndex={0}
                  aria-label="Session en cours. Cliquer pour aller au module de lecture"
                  title="Aller aux sessions"
                >
                  <span className="sidebar-data-icon">
                    {sessionTimer.isActive ? '⏱️' : '⏸️'}
                  </span>
                  <div className="sidebar-data-value">{formatTime(sessionTimer.elapsed)}</div>
                  <div className="sidebar-data-label">
                    {sessionTimer.isActive ? 'Session en cours' : 'Session en pause'}
                  </div>
                  <div className="sidebar-data-hint">
                    {sessionTimer.isActive ? 'Lecture active' : 'En pause'}
                  </div>
                </div>
              ) : (
                <div className="sidebar-data-card clickable" onClick={handleNavigation}>
                  <span className="sidebar-data-icon">⏱️</span>
                  <div className="sidebar-data-value">00:00</div>
                  <div className="sidebar-data-label">Pas de timer</div>
                  <div className="sidebar-data-hint">Démarrer une session</div>
                </div>
              )}

              {/* Objectif pages du jour → Livres > Statistiques */}
              <div className="sidebar-data-card clickable" onClick={handleStatsProgression} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStatsProgression(); } }} role="button" tabIndex={0} aria-label={`Pages aujourd'hui ${todayProgress.pages}/${dailyGoals.pages}. Voir la progression`} title="Voir la progression du jour">
                <span className="sidebar-data-icon">
                  {pagesProgress >= 100 ? '✅' : '📄'}
                </span>
                <div className="sidebar-data-value">
                  {todayProgress.pages}/{dailyGoals.pages}
                </div>
                <div className="sidebar-data-label">Pages aujourd'hui</div>
                <div className="sidebar-data-hint">
                  {pagesProgress >= 100 ? 'Objectif atteint!' : `${Math.round(pagesProgress)}% de l'objectif`}
                </div>
              </div>

              {/* Objectif temps du jour → Livres > Statistiques */}
              <div className="sidebar-data-card clickable" onClick={handleStatsProgression} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStatsProgression(); } }} role="button" tabIndex={0} aria-label={`Temps aujourd'hui ${todayProgress.minutes}/${dailyGoals.minutes} min. Voir la progression`} title="Voir la progression du jour">
                <span className="sidebar-data-icon">
                  {timeProgress >= 100 ? '✅' : '⏰'}
                </span>
                <div className="sidebar-data-value">
                  {todayProgress.minutes}/{dailyGoals.minutes}min
                </div>
                <div className="sidebar-data-label">Temps aujourd'hui</div>
                <div className="sidebar-data-hint">
                  {timeProgress >= 100 ? 'Objectif atteint!' : `${Math.round(timeProgress)}% de l'objectif`}
                </div>
              </div>

              {/* Progression globale → Livres > Statistiques */}
              <div className="sidebar-data-card clickable" onClick={handleStatsProgression} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStatsProgression(); } }} role="button" tabIndex={0} aria-label="Progression globale. Voir les statistiques" title="Voir les statistiques">
                <span className="sidebar-data-icon">📊</span>
                <div className="sidebar-data-value">
                  {Math.round((pagesProgress + timeProgress) / 2)}%
                </div>
                <div className="sidebar-data-label">Progression globale</div>
                <div className="sidebar-data-hint">Voir statistiques</div>
              </div>

              {/* Sessions cette semaine → Livres > Statistiques > sessions */}
              <div className="sidebar-data-card clickable" onClick={handleStatsSessions} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleStatsSessions(); } }} role="button" tabIndex={0} aria-label={`${moduleData.weeklyStats?.sessionsCount || 0} sessions cette semaine. Voir le détail`} title="Voir les sessions de lecture">
                <span className="sidebar-data-icon">📈</span>
                <div className="sidebar-data-value">
                  {moduleData.weeklyStats?.sessionsCount || 0}
                </div>
                <div className="sidebar-data-label">Sessions cette semaine</div>
                <div className="sidebar-data-hint">
                  {moduleData.weeklyStats?.totalPages || 0} pages lues
                </div>
              </div>
            </div>
          )}

          {/* Navigation vers le module session */}
          <div className="navigation-section">
            <button 
              onClick={handleNavigation}
              className="nav-button"
              type="button"
              aria-label="Naviguer vers le module de session de lecture"
            >
              <span className="nav-icon">📖</span>
              <span className="nav-text">Aller aux Sessions</span>
              <span className="nav-arrow">→</span>
            </button>
          </div>
        </div>
  );

  if (embedded) {
    return isExpanded ? content : null;
  }

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
          <span className="sidebar-section-icon" aria-hidden="true">📖</span>
          Session Lecture Active
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      {isExpanded && content}
    </section>
  );
});

ActiveReadingSessionModule.displayName = 'ActiveReadingSessionModule';

export default ActiveReadingSessionModule;
