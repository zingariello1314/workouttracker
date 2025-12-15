import React, { memo, useCallback, useMemo } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import StatCard from '../enhanced/StatCard';
import AnimatedProgressBar from '../enhanced/AnimatedProgressBar';
import PremiumBadge from '../enhanced/PremiumBadge';
import { AnimatedDonutChart } from '../../charts/index';
import '../../../styles/sidebar-visual-enhancements.css';

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

  // Données pour les graphiques donut de réussite
  const successMetrics = useMemo(() => {
    const projects = creativityData.projects;
    const sessions = creativityData.recentSessions;

    // Taux de completion des projets
    const completionRate = projects.length > 0 ? 
      (projects.reduce((sum, p) => sum + p.progress, 0) / projects.length) : 0;

    // Taux de régularité (sessions cette semaine vs objectif)
    const weeklyObjective = 5; // 5 sessions par semaine
    const regularityRate = Math.min(100, (recentSessionsCount / weeklyObjective) * 100);

    // Taux de satisfaction moyen
    const satisfactionRate = sessions.length > 0 ? 
      (sessions.reduce((sum, s) => sum + (s.satisfaction || 0), 0) / sessions.length / 5) * 100 : 0;

    // Taux de diversité des projets (types différents)
    const uniqueTypes = new Set(projects.map(p => p.type)).size;
    const maxTypes = 7; // writing, art, music, video, photo, design, craft
    const diversityRate = Math.min(100, (uniqueTypes / maxTypes) * 100);

    return {
      completion: {
        value: Math.round(completionRate),
        label: 'Avancement',
        color: '#10B981',
        icon: '🎯',
        description: `${Math.round(completionRate)}% d'avancement moyen`
      },
      regularity: {
        value: Math.round(regularityRate),
        label: 'Régularité',
        color: '#3B82F6',
        icon: '📅',
        description: `${recentSessionsCount}/${weeklyObjective} sessions cette semaine`
      },
      satisfaction: {
        value: Math.round(satisfactionRate),
        label: 'Satisfaction',
        color: '#F59E0B',
        icon: '⭐',
        description: `${(satisfactionRate/20).toFixed(1)}/5 étoiles moyennes`
      },
      diversity: {
        value: Math.round(diversityRate),
        label: 'Diversité',
        color: '#8B5CF6',
        icon: '🎨',
        description: `${uniqueTypes} types de projets différents`
      }
    };
  }, [creativityData, recentSessionsCount]);

  // Navigation vers la page d'accueil avec positionnement sur les projets créatifs (Requirement 9.4)
  const handleNavigateToCreativity = useCallback(async () => {
    if (!navigation?.setActiveTab) return;
    
    try {
      const target = {
        tab: 'homepage',
        subtab: 'creative-projects',
        moduleId: 'creative-projects',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      };

      await deepLinkService.navigateToModule(target, navigation.setActiveTab);
    } catch (error) {
      console.error('[CreativityProjectsModule] Erreur navigation créativité:', error);
    }
  }, [navigation]);

  // Navigation vers un projet spécifique
  const handleNavigateToProject = useCallback(async (projectId) => {
    if (!navigation?.setActiveTab) return;
    
    try {
      const target = {
        tab: 'homepage',
        subtab: 'creative-projects',
        moduleId: `creative-project-${projectId}`,
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      };

      await deepLinkService.navigateToModule(target, navigation.setActiveTab);
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
          {/* Inspiration du jour - VERSION ENRICHIE */}
          <div className="stat-card-premium" style={{ 
            marginBottom: '16px',
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            borderLeft: '4px solid var(--sidebar-purple)'
          }}>
            <div className="stat-header">
              <span className="stat-icon" style={{ color: 'var(--sidebar-purple)' }}>💡</span>
              <PremiumBadge type="info" value="Inspiration" icon="✨" />
            </div>
            <div className="sidebar-text-primary" style={{ 
              fontSize: '0.85rem',
              fontStyle: 'italic',
              lineHeight: '1.4',
              marginBottom: '4px',
              textAlign: 'center'
            }}>
              "{dailyInspiration.text}"
            </div>
            <div className="sidebar-text-secondary" style={{ 
              fontSize: '0.75rem',
              textAlign: 'center',
              opacity: 0.8
            }}>
              — {dailyInspiration.author}
            </div>
          </div>

          {/* Projets créatifs en cours - VERSION ENRICHIE */}
          {activeProjects.length === 0 ? (
            <div className="empty-state-attractive">
              <div className="empty-illustration">🎭</div>
              <div className="empty-message">Aucun projet créatif en cours</div>
              <button 
                className="empty-action-button"
                onClick={handleNavigateToCreativity}
              >
                Créer mon premier projet
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <div className="sidebar-text-primary" style={{ 
                fontSize: '0.8rem',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sidebar-cyan)'
              }}>
                Projets en cours ({activeProjects.length})
              </div>
              <div className="sidebar-content-dense" style={{ gridTemplateColumns: '1fr' }}>
                {activeProjects.slice(0, 2).map(project => (
                  <div 
                    key={project.id} 
                    className="stat-card-premium clickable"
                    onClick={() => handleNavigateToProject(project.id)}
                    style={{ padding: '12px' }}
                  >
                    <div className="stat-header">
                      <span className="stat-icon" style={{ color: getProgressColor(project.progress) }}>
                        {getProjectTypeIcon(project.type)}
                      </span>
                      <PremiumBadge 
                        type={project.progress >= 80 ? 'success' : project.progress >= 60 ? 'warning' : 'info'}
                        value={`${project.progress}%`}
                      />
                    </div>
                    <div className="stat-value" style={{ 
                      fontSize: '0.9rem',
                      color: getProgressColor(project.progress),
                      marginBottom: '4px'
                    }}>
                      {project.name}
                    </div>
                    <div className="stat-title" style={{ marginBottom: '8px' }}>
                      {project.totalSessions} sessions • {formatRelativeDate(project.lastSession)}
                    </div>
                    <AnimatedProgressBar
                      value={project.progress}
                      color={getProgressColor(project.progress)}
                      showValue={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Métriques de réussite avec graphiques donut - NOUVEAU */}
          <div style={{ marginBottom: '16px' }}>
            <div className="sidebar-text-primary" style={{ 
              fontSize: '0.8rem',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--sidebar-magenta)'
            }}>
              Métriques de Réussite
            </div>
            
            {/* Graphiques donut en grille 2x2 */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '12px',
              marginBottom: '12px'
            }}>
              {Object.entries(successMetrics).map(([key, metric]) => (
                <div 
                  key={key}
                  className="stat-card-premium clickable"
                  onClick={handleNavigateToCreativity}
                  style={{ 
                    padding: '12px',
                    textAlign: 'center',
                    position: 'relative'
                  }}
                >
                  {/* Graphique donut */}
                  <div style={{ 
                    height: '80px',
                    marginBottom: '8px',
                    position: 'relative'
                  }}>
                    <AnimatedDonutChart
                      data={[
                        { name: metric.label, value: metric.value, color: metric.color },
                        { name: 'Restant', value: 100 - metric.value, color: 'rgba(255, 255, 255, 0.1)' }
                      ]}
                      centerValue={`${metric.value}%`}
                      centerLabel=""
                      size={70}
                      strokeWidth={6}
                      animationDuration={1000}
                      showTooltip={false}
                    />
                  </div>
                  
                  {/* Informations */}
                  <div style={{ fontSize: '0.75rem', fontWeight: '600', marginBottom: '2px' }}>
                    {metric.icon} {metric.label}
                  </div>
                  <div style={{ 
                    fontSize: '0.65rem', 
                    color: 'rgba(255, 255, 255, 0.7)',
                    lineHeight: '1.2'
                  }}>
                    {metric.description}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sessions récentes - VERSION COMPACTE */}
          {creativityData.recentSessions.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div className="sidebar-text-primary" style={{ 
                fontSize: '0.8rem',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--sidebar-orange)'
              }}>
                Sessions récentes
              </div>
              <div className="sidebar-content-dense">
                <StatCard
                  title="Cette semaine"
                  value={recentSessionsCount}
                  icon="📝"
                  color="var(--sidebar-green)"
                  onClick={handleNavigateToCreativity}
                />

                <StatCard
                  title="Temps total"
                  value={formatDuration(
                    creativityData.recentSessions.reduce((total, session) => total + session.duration, 0)
                  )}
                  icon="⏱️"
                  color="var(--sidebar-blue)"
                  onClick={handleNavigateToCreativity}
                />
              </div>
            </div>
          )}

          {/* Navigation vers Créativité - VERSION ENRICHIE */}
          <button 
            className="sidebar-action-button clickable"
            onClick={handleNavigateToCreativity}
            style={{ 
              width: '100%',
              background: 'var(--sidebar-premium-gradient-2)',
              border: 'none'
            }}
          >
            <span className="sidebar-action-icon">🎨</span>
            <span>Voir mes projets créatifs</span>
            <span className="sidebar-action-arrow">→</span>
          </button>
        </div>
      )}
    </section>
  );
});

CreativityProjectsModule.displayName = 'CreativityProjectsModule';

export default CreativityProjectsModule;