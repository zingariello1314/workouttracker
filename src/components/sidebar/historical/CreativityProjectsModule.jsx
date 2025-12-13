import React, { memo, useCallback, useMemo } from 'react';

/**
 * CreativityProjectsModule - Module Créativité & Projets (Position 17)
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Fonctionnalités:
 * - Affichage des projets créatifs en cours
 * - Affichage des sessions d'écriture/art récentes
 * - Rotation de l'inspiration du jour
 * - Navigation vers la page d'accueil avec positionnement
 * - Mise à jour automatique des projets
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */
const CreativityProjectsModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Données simulées pour les projets créatifs (en attendant l'intégration réelle)
  const creativityData = useMemo(() => {
    const projects = data?.creativity?.projects || [
      {
        id: 'project_1',
        name: 'Roman Fantasy',
        type: 'writing',
        progress: 65,
        lastSession: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Il y a 2 jours
        totalSessions: 12,
        status: 'active'
      },
      {
        id: 'project_2',
        name: 'Peinture Abstraite',
        type: 'art',
        progress: 30,
        lastSession: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Hier
        totalSessions: 5,
        status: 'active'
      },
      {
        id: 'project_3',
        name: 'Composition Musicale',
        type: 'music',
        progress: 80,
        lastSession: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // Il y a 5 jours
        totalSessions: 20,
        status: 'paused'
      }
    ];

    const recentSessions = data?.creativity?.recentSessions || [
      {
        id: 'session_1',
        projectId: 'project_1',
        projectName: 'Roman Fantasy',
        type: 'writing',
        duration: 90, // minutes
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        wordsWritten: 1200,
        satisfaction: 4
      },
      {
        id: 'session_2',
        projectId: 'project_2',
        projectName: 'Peinture Abstraite',
        type: 'art',
        duration: 120,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        satisfaction: 5
      }
    ];

    return { projects, recentSessions };
  }, [data]);

  // Inspiration du jour avec rotation
  const dailyInspiration = useMemo(() => {
    const inspirations = [
      { text: "L'art lave notre âme de la poussière du quotidien", author: "Pablo Picasso" },
      { text: "La créativité, c'est l'intelligence qui s'amuse", author: "Albert Einstein" },
      { text: "Chaque artiste a été d'abord un amateur", author: "Ralph Waldo Emerson" },
      { text: "L'imagination est plus importante que le savoir", author: "Albert Einstein" },
      { text: "L'art n'est pas ce que vous voyez, mais ce que vous faites voir aux autres", author: "Edgar Degas" },
      { text: "La créativité demande du courage", author: "Henri Matisse" },
      { text: "Tout enfant est un artiste. Le problème, c'est de rester un artiste en grandissant", author: "Pablo Picasso" }
    ];

    // Rotation basée sur le jour de l'année
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    return inspirations[dayOfYear % inspirations.length];
  }, []);

  // Calculer les statistiques des projets actifs
  const activeProjects = useMemo(() => {
    return creativityData.projects.filter(project => project.status === 'active');
  }, [creativityData.projects]);

  // Calculer les sessions récentes (7 derniers jours)
  const recentSessionsCount = useMemo(() => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return creativityData.recentSessions.filter(session => 
      new Date(session.date) >= sevenDaysAgo
    ).length;
  }, [creativityData.recentSessions]);

  // Navigation vers la page d'accueil avec positionnement sur les projets créatifs
  const handleNavigateToCreativity = useCallback(async () => {
    if (!navigation?.navigateToModule) return;
    
    try {
      await navigation.navigateToModule({
        tab: 'home',
        section: 'creativity-projects',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      });
    } catch (error) {
      console.error('[CreativityProjectsModule] Erreur navigation créativité:', error);
    }
  }, [navigation]);

  // Navigation vers un projet spécifique
  const handleNavigateToProject = useCallback(async (projectId) => {
    if (!navigation?.navigateToModule) return;
    
    try {
      await navigation.navigateToModule({
        tab: 'home',
        section: 'creativity-projects',
        projectId: projectId,
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      });
    } catch (error) {
      console.error('[CreativityProjectsModule] Erreur navigation projet:', error);
    }
  }, [navigation]);

  // Obtenir l'icône du type de projet
  const getProjectTypeIcon = (type) => {
    const icons = {
      writing: '✍️',
      art: '🎨',
      music: '🎵',
      video: '🎬',
      photo: '📸',
      design: '🎭',
      craft: '🛠️'
    };
    return icons[type] || '🎨';
  };

  // Obtenir la couleur de progression
  const getProgressColor = (percent) => {
    if (percent >= 80) return 'var(--sidebar-success)';
    if (percent >= 60) return 'var(--sidebar-gold)';
    if (percent >= 40) return 'var(--sidebar-cyan)';
    return 'var(--sidebar-orange)';
  };

  // Formater la durée
  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h${mins}min` : `${hours}h`;
  };

  // Formater la date relative
  const formatRelativeDate = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - new Date(date));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Hier';
    if (diffDays === 2) return 'Avant-hier';
    if (diffDays <= 7) return `Il y a ${diffDays} jours`;
    return `Il y a ${Math.ceil(diffDays / 7)} semaines`;
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
          <span className="sidebar-section-icon">🎨</span>
          Créativité & Projets
          {activeProjects.length > 0 && (
            <span className="sidebar-section-badge">{activeProjects.length}</span>
          )}
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
          {/* Inspiration du jour */}
          <div className="sidebar-inspiration-box">
            <div className="sidebar-inspiration-icon">💡</div>
            <div className="sidebar-inspiration-content">
              <div className="sidebar-inspiration-text">"{dailyInspiration.text}"</div>
              <div className="sidebar-inspiration-author">— {dailyInspiration.author}</div>
            </div>
          </div>

          {/* Projets créatifs en cours */}
          {activeProjects.length === 0 ? (
            <div className="sidebar-info-box">
              <span className="sidebar-info-icon">🎭</span>
              <span>Aucun projet créatif en cours</span>
              <button 
                className="sidebar-action-button-small"
                onClick={handleNavigateToCreativity}
              >
                Créer un projet
              </button>
            </div>
          ) : (
            <div className="sidebar-creative-projects">
              <div className="sidebar-subsection-title">Projets en cours</div>
              {activeProjects.slice(0, 2).map(project => (
                <div 
                  key={project.id} 
                  className="sidebar-creative-project clickable"
                  onClick={() => handleNavigateToProject(project.id)}
                >
                  <div className="sidebar-project-header">
                    <span className="sidebar-project-icon">
                      {getProjectTypeIcon(project.type)}
                    </span>
                    <div className="sidebar-project-info">
                      <div className="sidebar-project-name">{project.name}</div>
                      <div className="sidebar-project-meta">
                        {project.totalSessions} sessions • {formatRelativeDate(project.lastSession)}
                      </div>
                    </div>
                    <div className="sidebar-project-progress-text">
                      {project.progress}%
                    </div>
                  </div>
                  <div className="sidebar-project-progress">
                    <div 
                      className="sidebar-project-progress-bar" 
                      style={{ 
                        width: `${project.progress}%`,
                        backgroundColor: getProgressColor(project.progress)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sessions récentes */}
          {creativityData.recentSessions.length > 0 && (
            <div className="sidebar-recent-sessions">
              <div className="sidebar-subsection-title">Sessions récentes</div>
              <div className="sidebar-data-grid">
                <div className="sidebar-data-card clickable" onClick={handleNavigateToCreativity}>
                  <span className="sidebar-data-icon">📝</span>
                  <div className="sidebar-data-value">{recentSessionsCount}</div>
                  <div className="sidebar-data-label">Cette semaine</div>
                  <div className="sidebar-data-hint">
                    {creativityData.recentSessions.length} sessions au total
                  </div>
                </div>

                <div className="sidebar-data-card clickable" onClick={handleNavigateToCreativity}>
                  <span className="sidebar-data-icon">⏱️</span>
                  <div className="sidebar-data-value">
                    {formatDuration(
                      creativityData.recentSessions.reduce((total, session) => total + session.duration, 0)
                    )}
                  </div>
                  <div className="sidebar-data-label">Temps total</div>
                  <div className="sidebar-data-hint">
                    Moyenne: {formatDuration(
                      Math.round(creativityData.recentSessions.reduce((total, session) => total + session.duration, 0) / creativityData.recentSessions.length)
                    )}/session
                  </div>
                </div>

                <div className="sidebar-data-card clickable" onClick={handleNavigateToCreativity}>
                  <span className="sidebar-data-icon">⭐</span>
                  <div className="sidebar-data-value">
                    {(creativityData.recentSessions.reduce((total, session) => total + (session.satisfaction || 0), 0) / creativityData.recentSessions.length).toFixed(1)}
                  </div>
                  <div className="sidebar-data-label">Satisfaction</div>
                  <div className="sidebar-data-hint">
                    Sur 5 étoiles
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation vers Créativité */}
          <button 
            className="sidebar-action-button clickable"
            onClick={handleNavigateToCreativity}
          >
            <span className="sidebar-action-icon">🎨</span>
            <span>Voir mes projets</span>
            <span className="sidebar-action-arrow">→</span>
          </button>
        </div>
      )}
    </section>
  );
});

CreativityProjectsModule.displayName = 'CreativityProjectsModule';

export default CreativityProjectsModule;