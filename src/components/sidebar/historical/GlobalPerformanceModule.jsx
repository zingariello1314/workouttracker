import React, { memo, useCallback, useMemo, useState, useEffect } from 'react';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import StatCard from '../enhanced/StatCard';
import AnimatedProgressBar from '../enhanced/AnimatedProgressBar';
import PremiumBadge from '../enhanced/PremiumBadge';
import { PerformanceRadarChart } from '../../charts/index';
import '../../../styles/sidebar-visual-enhancements.css';

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

  // Évaluation de l'équilibre vie/travail/loisirs avec données radar
  const lifeBalance = useMemo(() => {
    const {
      sport = { workoutTime: 0, todayWorkouts: 0 },
      learning = { readingTime: 0, studyTime: 0, pagesRead: 0 },
      finance = { planningTime: 0, budgetRespected: false },
      nutrition = { mealPrepTime: 0, caloriesGoalMet: false },
      quests = { completed: 0, total: 0 },
      today = { dailyTasks: 0 }
    } = data;

    const totalTime = sport.workoutTime + learning.readingTime + learning.studyTime + 
                     finance.planningTime + nutrition.mealPrepTime;

    // Calcul des scores pour chaque dimension (0-100)
    const healthScore = Math.min(100, (sport.todayWorkouts * 25) + (nutrition.caloriesGoalMet ? 25 : 0) + 
                                      Math.min(sport.workoutTime * 2, 50));
    
    const workScore = Math.min(100, (learning.studyTime * 3) + (finance.planningTime * 2) + 
                              (finance.budgetRespected ? 30 : 0));
    
    const socialScore = Math.min(100, (quests.total > 0 ? (quests.completed / quests.total) * 80 : 0) + 20);
    
    const leisureScore = Math.min(100, (learning.readingTime * 2) + (sport.workoutTime * 1.5));
    
    const learningScore = Math.min(100, (learning.pagesRead * 2) + (learning.studyTime * 1.5));
    
    const creativityScore = Math.min(100, (today.dailyTasks * 10) + 
                                    (learning.readingTime > 0 ? 30 : 0) + 
                                    (quests.completed * 15));
    
    const productivityScore = Math.min(100, (quests.total > 0 ? (quests.completed / quests.total) * 60 : 0) + 
                                      (today.dailyTasks * 8) + 
                                      (finance.budgetRespected ? 20 : 0));
    
    const wellbeingScore = Math.min(100, (nutrition.caloriesGoalMet ? 40 : 0) + 
                                   (sport.workoutTime > 0 ? 30 : 0) + 
                                   (learning.readingTime > 0 ? 30 : 0));

    // Données pour le graphique radar
    const radarData = [
      { category: 'Santé', value: healthScore, icon: '💪', description: 'Sport et nutrition' },
      { category: 'Travail', value: workScore, icon: '💼', description: 'Productivité professionnelle' },
      { category: 'Social', value: socialScore, icon: '👥', description: 'Relations et quêtes' },
      { category: 'Loisirs', value: leisureScore, icon: '🎮', description: 'Détente et plaisir' },
      { category: 'Apprentissage', value: learningScore, icon: '📚', description: 'Développement personnel' },
      { category: 'Créativité', value: creativityScore, icon: '🎨', description: 'Expression créative' },
      { category: 'Productivité', value: productivityScore, icon: '⚡', description: 'Efficacité quotidienne' },
      { category: 'Bien-être', value: wellbeingScore, icon: '🌟', description: 'Équilibre personnel' }
    ];

    // Calcul de l'équilibre global
    const scores = [healthScore, workScore, socialScore, leisureScore, learningScore, creativityScore, productivityScore, wellbeingScore];
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const maxDiff = Math.max(...scores) - Math.min(...scores);
    
    const status = maxDiff < 20 ? 'Parfaitement équilibré' : 
                   maxDiff < 40 ? 'Bien équilibré' : 
                   maxDiff < 60 ? 'Acceptable' : 'À rééquilibrer';

    // Calcul des pourcentages pour l'affichage simple
    if (totalTime === 0) {
      return { 
        work: 33, life: 33, leisure: 34, status: 'À ajuster',
        radarData, avgScore: Math.round(avgScore), maxDiff: Math.round(maxDiff)
      };
    }

    const work = Math.round(((learning.studyTime + finance.planningTime) / totalTime) * 100);
    const leisure = Math.round(((sport.workoutTime + learning.readingTime) / totalTime) * 100);
    const life = Math.round((nutrition.mealPrepTime / totalTime) * 100);

    return { 
      work, life, leisure, status,
      radarData, avgScore: Math.round(avgScore), maxDiff: Math.round(maxDiff)
    };
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
          {/* Score de productivité principal - VERSION ENRICHIE */}
          <div className="stat-card-premium" style={{ marginBottom: '16px' }}>
            <div className="stat-header">
              <span className="stat-icon" style={{ color: 'var(--sidebar-gold)' }}>🎯</span>
              <PremiumBadge 
                type={productivityScore >= 80 ? 'success' : productivityScore >= 60 ? 'warning' : 'error'}
                value={`${productivityScore}%`}
                icon="⚡"
              />
            </div>
            <div className="stat-value" style={{ 
              color: productivityScore >= 80 ? 'var(--sidebar-green)' : 
                     productivityScore >= 60 ? 'var(--sidebar-yellow)' : 'var(--sidebar-red)',
              fontSize: '2rem'
            }}>
              {productivityScore}%
            </div>
            <div className="stat-title">Score de Productivité</div>
            <AnimatedProgressBar
              value={productivityScore}
              color={productivityScore >= 80 ? 'var(--sidebar-premium-gradient-3)' : 
                     productivityScore >= 60 ? 'var(--sidebar-premium-gradient-1)' : 'var(--sidebar-red)'}
              showValue={false}
            />
          </div>

          {/* Graphique radar d'équilibre de vie - NOUVEAU */}
          <div className="stat-card-premium" style={{ marginBottom: '16px' }}>
            <div className="stat-header">
              <span className="stat-icon" style={{ color: 'var(--sidebar-cyan)' }}>🎯</span>
              <PremiumBadge 
                type={lifeBalance.status === 'Parfaitement équilibré' || lifeBalance.status === 'Bien équilibré' ? 'success' : 
                      lifeBalance.status === 'Acceptable' ? 'warning' : 'error'}
                value={lifeBalance.status}
              />
            </div>
            <div className="stat-title" style={{ marginBottom: '8px' }}>Équilibre de Vie</div>
            
            {/* Métriques rapides */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginBottom: '12px',
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '6px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--sidebar-cyan)' }}>
                  {lifeBalance.avgScore}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Score moyen
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--sidebar-purple)' }}>
                  {lifeBalance.maxDiff}%
                </div>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                  Écart max
                </div>
              </div>
            </div>

            {/* Graphique radar */}
            <div style={{ marginTop: '12px' }}>
              <PerformanceRadarChart
                data={lifeBalance.radarData}
                title=""
                height={200}
                maxValue={100}
                fillOpacity={0.2}
                strokeWidth={2}
                formatValue={(value) => `${Math.round(value)}%`}
                className="life-balance-radar"
              />
            </div>

            {/* Légende des dimensions */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '4px', 
              marginTop: '8px',
              fontSize: '0.7rem'
            }}>
              {lifeBalance.radarData.slice(0, 6).map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '4px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  <span>{item.icon}</span>
                  <span>{item.category}</span>
                  <span style={{ 
                    marginLeft: 'auto', 
                    fontWeight: 'bold',
                    color: item.value >= 70 ? 'var(--sidebar-green)' : 
                           item.value >= 50 ? 'var(--sidebar-yellow)' : 'var(--sidebar-red)'
                  }}>
                    {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Équilibre temps simplifié - VERSION COMPACTE */}
          <div className="stat-card-premium" style={{ marginBottom: '16px' }}>
            <div className="stat-header">
              <span className="stat-icon" style={{ color: 'var(--sidebar-green)' }}>⚖️</span>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                Répartition temps
              </span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sidebar-text-secondary" style={{ minWidth: '45px', fontSize: '0.7rem' }}>
                  💼 {lifeBalance.work}%
                </span>
                <AnimatedProgressBar
                  value={lifeBalance.work}
                  color="var(--sidebar-blue)"
                  showValue={false}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sidebar-text-secondary" style={{ minWidth: '45px', fontSize: '0.7rem' }}>
                  🏠 {lifeBalance.life}%
                </span>
                <AnimatedProgressBar
                  value={lifeBalance.life}
                  color="var(--sidebar-green)"
                  showValue={false}
                />
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sidebar-text-secondary" style={{ minWidth: '45px', fontSize: '0.7rem' }}>
                  🎮 {lifeBalance.leisure}%
                </span>
                <AnimatedProgressBar
                  value={lifeBalance.leisure}
                  color="var(--sidebar-purple)"
                  showValue={false}
                />
              </div>
            </div>
          </div>

          {/* Recommandation IA - VERSION ENRICHIE */}
          {aiRecommendations.length > 0 && (
            <div className="stat-card-premium" style={{ marginBottom: '16px' }}>
              <div className="stat-header">
                <span className="stat-icon" style={{ color: 'var(--sidebar-magenta)' }}>🤖</span>
                <button 
                  className="badge-premium"
                  onClick={handleRefreshRecommendation}
                  aria-label="Nouvelle recommandation"
                  style={{ 
                    background: 'var(--sidebar-premium-gradient-2)',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '12px'
                  }}
                >
                  🔄
                </button>
              </div>
              <div className="stat-title" style={{ marginBottom: '8px' }}>IA Coach</div>
              <div className="sidebar-text-primary" style={{ 
                fontSize: '0.85rem',
                lineHeight: '1.4',
                fontStyle: 'italic',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '8px',
                borderRadius: '6px',
                borderLeft: '3px solid var(--sidebar-magenta)'
              }}>
                {aiRecommendations[currentRecommendation]}
              </div>
            </div>
          )}

          {/* Métriques rapides - VERSION ENRICHIE */}
          <div className="sidebar-content-dense">
            <StatCard
              title="Objectifs"
              value={`${quickMetrics.objectives}%`}
              icon="🎯"
              color="var(--sidebar-gold)"
              onClick={handleNavigation}
            />

            <StatCard
              title="Énergie"
              value={`${quickMetrics.energy}%`}
              icon="⚡"
              color="var(--sidebar-cyan)"
              onClick={handleNavigation}
            />
          </div>

          {/* Navigation vers dashboard - VERSION ENRICHIE */}
          <button 
            className="sidebar-action-button clickable"
            onClick={handleNavigation}
            style={{ width: '100%', marginTop: '12px' }}
          >
            <span className="sidebar-action-icon">📊</span>
            <span>Voir le dashboard complet</span>
            <span className="sidebar-action-arrow">→</span>
          </button>
        </div>
      )}
    </section>
  );
});

GlobalPerformanceModule.displayName = 'GlobalPerformanceModule';

export default GlobalPerformanceModule;
