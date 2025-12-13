import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';

/**
 * GlobalPerformanceModule - Module Performance Globale (Position 19)
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Fonctionnalités:
 * - Calcul du score de productivité quotidien
 * - Évaluation de l'équilibre vie/travail/loisirs
 * - Génération de recommandations IA basées sur patterns
 * - Navigation vers la page d'accueil avec focus performance
 * - Affichage des scores avec visualisations
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */
const GlobalPerformanceModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation,
  moduleId = 'global-performance-19',
  moduleType = 'historical',
  navigationTarget = {
    tab: 'homepage',
    moduleId: 'performance-dashboard'
  }
}) => {
  // État pour la recommandation IA
  const [currentRecommendation, setCurrentRecommendation] = useState(0);

  // Calcul du score de productivité quotidien
  const productivityScore = useMemo(() => {
    const {
      quests = { completed: 0, total: 0 },
      sport = { todayWorkouts: 0, workoutTime: 0 },
      learning = { pagesRead: 0, readingTime: 0, studyTime: 0 },
      finance = { budgetRespected: false, planningTime: 0 },
      nutrition = { caloriesGoalMet: false, mealPrepTime: 0 },
      today = { dailyTasks: 0 }
    } = data;

    let score = 0;
    let maxScore = 0;

    // Quêtes (30% du score)
    if (quests.total > 0) {
      score += (quests.completed / quests.total) * 30;
    }
    maxScore += 30;

    // Sport (20% du score)
    if (sport.todayWorkouts > 0) {
      score += Math.min(sport.todayWorkouts * 10, 20);
    }
    maxScore += 20;

    // Apprentissage (25% du score)
    const learningScore = Math.min(
      (learning.pagesRead * 0.2) + (learning.studyTime * 0.3), 
      25
    );
    score += learningScore;
    maxScore += 25;

    // Finance (15% du score)
    if (finance.budgetRespected) score += 10;
    if (finance.planningTime > 0) score += 5;
    maxScore += 15;

    // Nutrition (10% du score)
    if (nutrition.caloriesGoalMet) score += 5;
    if (nutrition.mealPrepTime > 0) score += 5;
    maxScore += 10;

    return Math.round((score / maxScore) * 100) || 0;
  }, [data]);

  // Évaluation de l'équilibre vie/travail/loisirs
  const lifeBalance = useMemo(() => {
    const {
      sport = { workoutTime: 0 },
      learning = { readingTime: 0, studyTime: 0 },
      finance = { planningTime: 0 },
      nutrition = { mealPrepTime: 0 }
    } = data;

    const totalTime = sport.workoutTime + learning.readingTime + learning.studyTime + 
                     finance.planningTime + nutrition.mealPrepTime;

    if (totalTime === 0) {
      return { work: 33, life: 33, leisure: 34, status: 'À ajuster' };
    }

    // Calcul des pourcentages
    const work = Math.round(((learning.studyTime + finance.planningTime) / totalTime) * 100);
    const leisure = Math.round(((sport.workoutTime + learning.readingTime) / totalTime) * 100);
    const life = Math.round((nutrition.mealPrepTime / totalTime) * 100);

    // Détermination du statut d'équilibre
    const maxDiff = Math.max(work, leisure, life) - Math.min(work, leisure, life);
    const status = maxDiff < 20 ? 'Équilibré' : maxDiff < 40 ? 'Acceptable' : 'À ajuster';

    return { work, life, leisure, status };
  }, [data]);

  // Génération de recommandations IA basées sur patterns
  const aiRecommendations = useMemo(() => {
    const recommendations = [];

    // Recommandations basées sur le score de productivité
    if (productivityScore < 30) {
      recommendations.push(
        "🎯 Commencez par une quête simple pour relancer votre élan",
        "📚 15 minutes de lecture peuvent transformer votre journée",
        "💪 Un exercice rapide booste votre énergie et motivation"
      );
    } else if (productivityScore < 60) {
      recommendations.push(
        "🚀 Vous êtes sur la bonne voie ! Ajoutez une activité physique",
        "📊 Planifiez 10 minutes pour organiser vos finances",
        "🧠 Une session d'apprentissage courte optimiserait votre journée"
      );
    } else if (productivityScore < 80) {
      recommendations.push(
        "⭐ Excellent rythme ! Maintenez cette cadence",
        "🎨 Ajoutez une activité créative pour l'équilibre",
        "🍎 Pensez à votre nutrition pour soutenir cette performance"
      );
    } else {
      recommendations.push(
        "🏆 Performance exceptionnelle ! Vous êtes un modèle",
        "🌟 Partagez vos stratégies avec d'autres",
        "🎯 Fixez-vous un défi encore plus ambitieux"
      );
    }

    // Recommandations basées sur l'équilibre
    if (lifeBalance.status === 'À ajuster') {
      if (lifeBalance.work > 50) {
        recommendations.push("⚖️ Accordez-vous plus de temps pour les loisirs");
      }
      if (lifeBalance.leisure > 50) {
        recommendations.push("💼 Un peu plus de travail productif équilibrerait votre journée");
      }
      if (lifeBalance.life < 10) {
        recommendations.push("🏠 N'oubliez pas de prendre soin de vous au quotidien");
      }
    }

    return recommendations;
  }, [productivityScore, lifeBalance]);

  // Métriques rapides dérivées du score
  const quickMetrics = useMemo(() => {
    const objectivesScore = Math.min(100, productivityScore + 10);
    const energyScore = Math.max(0, productivityScore - 5);
    
    return {
      objectives: objectivesScore,
      energy: energyScore
    };
  }, [productivityScore]);

  // Navigation vers la page d'accueil avec focus performance
  const handleNavigation = useCallback(async () => {
    try {
      if (deepLinkService?.navigateToModule) {
        await deepLinkService.navigateToModule(
          {
            ...navigationTarget,
            scrollBehavior: 'smooth',
            highlightDuration: 2000
          },
          navigation?.setActiveTab
        );
      } else if (navigation?.setActiveTab) {
        navigation.setActiveTab(navigationTarget.tab);
      }
    } catch (error) {
      console.error('[GlobalPerformanceModule] Erreur navigation:', error);
      // Fallback navigation
      if (navigation?.setActiveTab) {
        navigation.setActiveTab(navigationTarget.tab);
      }
    }
  }, [navigationTarget, navigation]);

  // Gestion du rafraîchissement des recommandations
  const handleRefreshRecommendation = useCallback(() => {
    setCurrentRecommendation(prev => (prev + 1) % aiRecommendations.length);
    
    // Émettre événement pour indiquer l'interaction
    window.dispatchEvent(new CustomEvent('sidebar:performance:recommendation:refreshed', {
      detail: { moduleId, timestamp: Date.now() }
    }));
  }, [aiRecommendations.length, moduleId]);

  // Écoute des événements de mise à jour
  useEffect(() => {
    const handlePerformanceUpdate = () => {
      // Force re-render when performance data updates
      setCurrentRecommendation(prev => prev);
    };

    window.addEventListener('sidebar:performance:updated', handlePerformanceUpdate);
    window.addEventListener('historical:performance:updated', handlePerformanceUpdate);

    return () => {
      window.removeEventListener('sidebar:performance:updated', handlePerformanceUpdate);
      window.removeEventListener('historical:performance:updated', handlePerformanceUpdate);
    };
  }, []);

  return (
    <section 
      className={`sidebar-section ${isExpanded ? 'expanded' : ''} cursor-pointer`}
      onClick={handleNavigation}
      data-module-id={moduleId}
      data-module-type={moduleType}
    >
      <header 
        className="sidebar-section-header"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon">📊</span>
          Performance Globale
        </h2>
        <span 
          className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`}
          aria-hidden="true"
        >
          ▼
        </span>
      </header>
      
      {isExpanded && (
        <div className="sidebar-section-content" onClick={(e) => e.stopPropagation()}>
          {/* Score de productivité principal */}
          <div className="sidebar-data-grid">
            <div className="sidebar-data-card featured">
              <span className="sidebar-data-icon">🎯</span>
              <div className="sidebar-data-value">{productivityScore}%</div>
              <div className="sidebar-data-label">Score Productivité</div>
              <div className="sidebar-data-progress">
                <div 
                  className="sidebar-data-progress-bar" 
                  style={{ width: `${productivityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Équilibre vie/travail/loisirs */}
          <div className="sidebar-balance-section">
            <div className="sidebar-balance-header">
              <span className="sidebar-balance-icon">⚖️</span>
              <span className="sidebar-balance-title">Équilibre de vie</span>
              <span className={`sidebar-balance-status ${lifeBalance.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {lifeBalance.status}
              </span>
            </div>
            
            <div className="sidebar-balance-bars">
              <div className="sidebar-balance-item">
                <span className="sidebar-balance-label">Travail</span>
                <div className="sidebar-balance-bar">
                  <div 
                    className="sidebar-balance-fill work" 
                    style={{ width: `${lifeBalance.work}%` }}
                  />
                </div>
                <span className="sidebar-balance-value">{lifeBalance.work}%</span>
              </div>
              
              <div className="sidebar-balance-item">
                <span className="sidebar-balance-label">Vie</span>
                <div className="sidebar-balance-bar">
                  <div 
                    className="sidebar-balance-fill life" 
                    style={{ width: `${lifeBalance.life}%` }}
                  />
                </div>
                <span className="sidebar-balance-value">{lifeBalance.life}%</span>
              </div>
              
              <div className="sidebar-balance-item">
                <span className="sidebar-balance-label">Loisirs</span>
                <div className="sidebar-balance-bar">
                  <div 
                    className="sidebar-balance-fill leisure" 
                    style={{ width: `${lifeBalance.leisure}%` }}
                  />
                </div>
                <span className="sidebar-balance-value">{lifeBalance.leisure}%</span>
              </div>
            </div>
          </div>

          {/* Recommandation IA */}
          {aiRecommendations.length > 0 && (
            <div className="sidebar-ai-section">
              <div className="sidebar-ai-header">
                <span className="sidebar-ai-icon">🤖</span>
                <span className="sidebar-ai-title">IA Coach</span>
                <button 
                  className="sidebar-ai-refresh"
                  onClick={handleRefreshRecommendation}
                  aria-label="Nouvelle recommandation"
                >
                  🔄
                </button>
              </div>
              <div className="sidebar-ai-recommendation">
                {aiRecommendations[currentRecommendation]}
              </div>
            </div>
          )}

          {/* Métriques rapides */}
          <div className="sidebar-data-grid">
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">🎯</span>
              <div className="sidebar-data-value">{quickMetrics.objectives}%</div>
              <div className="sidebar-data-label">Objectifs</div>
            </div>

            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">⚡</span>
              <div className="sidebar-data-value">{quickMetrics.energy}%</div>
              <div className="sidebar-data-label">Énergie</div>
            </div>
          </div>

          {/* Navigation vers dashboard */}
          <div className="sidebar-navigation-hint">
            <span className="sidebar-navigation-icon">📊</span>
            <span>Voir le dashboard complet</span>
            <span className="sidebar-navigation-arrow">→</span>
          </div>
        </div>
      )}
    </section>
  );
});

GlobalPerformanceModule.displayName = 'GlobalPerformanceModule';

export default GlobalPerformanceModule;
