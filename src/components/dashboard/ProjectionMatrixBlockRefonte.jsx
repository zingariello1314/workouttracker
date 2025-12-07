/**
 * ProjectionMatrixBlockRefonte Component
 * Bloc Matrice de Projection - Version Refonte Complète
 * Design futuriste avec graphiques Canvas interactifs et simulateur temps réel
 */

import { useState, useEffect, useMemo } from 'react';
import XPEvolutionChart from './charts/XPEvolutionChart';
import ActivitiesBarChart from './charts/ActivitiesBarChart';
import ActivityHeatmap from './charts/ActivityHeatmap';
import '../../styles/projection-matrix-block.css';
import '../../styles/projection-matrix-block-patch.css';

const ProjectionMatrixBlockRefonte = ({ allData = {} }) => {
  // State
  const [currentLevel, setCurrentLevel] = useState(42);
  const [currentXP, setCurrentXP] = useState(7850);
  const [questsCompleted, setQuestsCompleted] = useState(145);
  const [dailyQuestsDone, setDailyQuestsDone] = useState(3);
  const [weeklyQuestsDone, setWeeklyQuestsDone] = useState(2);
  const [selectedMode, setSelectedMode] = useState('optimistic');
  const [activityData, setActivityData] = useState({});

  // Weekly Activities Data
  const weeklyActivities = [
    { name: 'Lecture', count: 29, percentage: 100, type: 'reading', xp: 1400, streak: 15 },
    { name: 'Sport', count: 22, percentage: 76, type: 'sport', xp: 1100, streak: 8 },
    { name: 'Apprentissage', count: 19, percentage: 66, type: 'learning', xp: 950, streak: 12 },
    { name: 'Ménage', count: 18, percentage: 62, type: 'household', xp: 800, streak: 6 },
    { name: 'Santé', count: 14, percentage: 48, type: 'health', xp: 700, streak: 9 },
    { name: 'Social', count: 11, percentage: 38, type: 'social', xp: 550, streak: 4 }
  ];

  // Monthly Trends Data
  const monthlyTrends = [
    { name: 'Lecture', change: 25, icon: '📚', type: 'reading', current: 28, previous: 22 },
    { name: 'Sport', change: -2, icon: '💪', type: 'sport', current: 22, previous: 23 },
    { name: 'Apprentissage', change: 18, icon: '🎓', type: 'learning', current: 19, previous: 16 },
    { name: 'Ménage', change: 12, icon: '🧹', type: 'household', current: 16, previous: 14 },
    { name: 'Santé', change: 35, icon: '❤️', type: 'health', current: 14, previous: 10 },
    { name: 'Social', change: -8, icon: '👥', type: 'social', current: 11, previous: 12 }
  ];

  // Quest Stats
  const questStats = {
    dailyCompleted: 18,
    weeklyCompleted: 7,
    monthlyCompleted: 28,
    totalXP: 5500,
    averageXP: 35.3,
    bestDay: 'Mardi',
    bestWeek: 'S32'
  };

  const totalQuests = 156;
  const topActivity = 'Lecture';
  const currentStreak = 23;

  // Calculate projections
  const projectionData = useMemo(() => {
    const xpPerDay = (dailyQuestsDone * 50) + (weeklyQuestsDone * 150 / 7);
    const xpNeededForNext = (currentLevel * 200) - (currentXP % (currentLevel * 200));
    const daysToNextLevel = Math.ceil(xpNeededForNext / (xpPerDay || 1));
    const nextLevelDate = new Date();
    nextLevelDate.setDate(nextLevelDate.getDate() + daysToNextLevel);
    
    const yearProjection = Math.floor(currentLevel + (365 * xpPerDay) / (currentLevel * 200));
    const efficiency = Math.min(100, (xpPerDay / 100) * 100);
    
    return {
      xpPerDay: xpPerDay.toFixed(1),
      daysToNext: daysToNextLevel,
      nextLevelDate: nextLevelDate.toLocaleDateString('fr-FR'),
      projectedLevel: yearProjection,
      efficiency: efficiency.toFixed(1)
    };
  }, [dailyQuestsDone, weeklyQuestsDone, currentLevel, currentXP]);

  // Toggle quest counters
  const toggleQuest = (type) => {
    if (type === 'daily') {
      setDailyQuestsDone(prev => (prev + 1) % 6);
    } else {
      setWeeklyQuestsDone(prev => (prev + 1) % 4);
    }
  };

  // Get activity color by type
  const getActivityColor = (type) => {
    const colors = {
      reading: '#3b82f6',
      sport: '#10b981',
      learning: '#8b5cf6',
      household: '#f59e0b',
      health: '#ef4444',
      social: '#ec4899'
    };
    return colors[type] || '#6b7280';
  };

  return (
    <div className="projection-matrix-card">
      {/* Background Glow Effect */}
      <div className="pm-background-glow"></div>
      
      {/* Animated Borders */}
      <div className="pm-border-top"></div>
      <div className="pm-border-bottom"></div>
      
      {/* Header */}
      <div className="pm-header">
        <div className="pm-header-left">
          <div className="pm-header-icon">
            🔮
          </div>
          <div>
            <h2 className="pm-title">PROJECTION MATRIX</h2>
            <p className="pm-subtitle">Calibrage Temps Réel • Prédiction Quantique</p>
          </div>
        </div>
        <div className="pm-neural-status">
          <div className="pm-status-dot"></div>
          <span>NEURAL LINK ACTIF</span>
        </div>
      </div>

      {/* Main Layout - 3 colonnes */}
      <div className="pm-main-layout">
        
        {/* Colonne Gauche */}
        <div className="pm-left-column">
          {/* Stats 2x2 */}
          <div className="pm-stats-grid">
            <div className="pm-stat-card pm-stat-level">
              <div className="pm-stat-value">Niv.{currentLevel}</div>
              <div className="pm-stat-label">Niveau</div>
            </div>
            <div className="pm-stat-card pm-stat-xp">
              <div className="pm-stat-value">{(currentXP / 1000).toFixed(1)}k</div>
              <div className="pm-stat-label">XP Total</div>
            </div>
            <div className="pm-stat-card pm-stat-quests">
              <div className="pm-stat-value">{questsCompleted}</div>
              <div className="pm-stat-label">Quêtes</div>
            </div>
            <div className="pm-stat-card pm-stat-efficiency">
              <div className="pm-stat-value">{projectionData.efficiency}%</div>
              <div className="pm-stat-label">Efficacité</div>
            </div>
          </div>

          {/* Simulateur */}
          <div className="pm-simulator">
            <h3 className="pm-simulator-title">
              ⚡ Simulateur Temps Réel
            </h3>
            <div className="pm-simulator-content">
              <div className="pm-quest-item">
                <span>Quêtes Journalières</span>
                <button 
                  onClick={() => toggleQuest('daily')} 
                  className="pm-quest-btn pm-daily"
                  aria-label={`Quêtes journalières: ${dailyQuestsDone} sur 5`}
                >
                  {dailyQuestsDone}/5
                </button>
              </div>
              <div className="pm-quest-item">
                <span>Quêtes Hebdomadaires</span>
                <button 
                  onClick={() => toggleQuest('weekly')} 
                  className="pm-quest-btn pm-weekly"
                  aria-label={`Quêtes hebdomadaires: ${weeklyQuestsDone} sur 3`}
                >
                  {weeklyQuestsDone}/3
                </button>
              </div>
              <div className="pm-simulator-stats">
                <div className="pm-stat-row">
                  <span>XP/Jour:</span>
                  <span className="pm-xp-per-day">{projectionData.xpPerDay}</span>
                </div>
                <div className="pm-stat-row">
                  <span>Prochain niveau:</span>
                  <span className="pm-days-to-next">{projectionData.daysToNext}j</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne Centre */}
        <div className="pm-center-column">
          {/* Contrôles IA */}
          <div className="pm-ai-control">
            <h4 className="pm-ai-title">🤖 CONTRÔLE IA</h4>
            <div className="pm-ai-modes">
              <button 
                className={`pm-mode-btn pm-secure ${selectedMode === 'secure' ? 'active' : ''}`}
                onClick={() => setSelectedMode('secure')}
              >
                <div className="pm-mode-name">🛡️ MODE SÉCURISÉ</div>
                <div className="pm-mode-desc">Prédictions fiables</div>
              </button>
              <button 
                className={`pm-mode-btn pm-optimistic ${selectedMode === 'optimistic' ? 'active' : ''}`}
                onClick={() => setSelectedMode('optimistic')}
              >
                <div className="pm-mode-name">⚡ MODE OPTIMISTE</div>
                <div className="pm-mode-desc">Configuration actuelle</div>
              </button>
              <button 
                className={`pm-mode-btn pm-extreme ${selectedMode === 'extreme' ? 'active' : ''}`}
                onClick={() => setSelectedMode('extreme')}
              >
                <div className="pm-mode-name">🔥 MODE EXTRÊME</div>
                <div className="pm-mode-desc">Défis maximaux</div>
              </button>
            </div>
          </div>
        </div>

        {/* Colonne Droite */}
        <div className="pm-right-column">
          {/* Graphique XP */}
          <div className="pm-xp-chart">
            <div className="pm-chart-header">
              <h4>📈 ÉVOLUTION XP - 30 JOURS</h4>
              <div className="pm-chart-trend">
                <span>+127% 🚀</span>
              </div>
            </div>
            
            <div className="pm-chart-container">
              <XPEvolutionChart
                data={[1200, 1500, 1800, 2100, 2400, 2800]}
                labels={['-20j', '-15j', '-10j', '-5j', 'Auj.']}
              />
            </div>
            
            <div className="pm-chart-metrics">
              <div className="pm-metric-item">
                <div className="pm-metric-label">Moyenne</div>
                <div className="pm-metric-value">2.3k/j</div>
              </div>
              <div className="pm-metric-item">
                <div className="pm-metric-label">Maximum</div>
                <div className="pm-metric-value">4.7k</div>
              </div>
              <div className="pm-metric-item">
                <div className="pm-metric-label">Minimum</div>
                <div className="pm-metric-value">890</div>
              </div>
              <div className="pm-metric-item">
                <div className="pm-metric-label">Aujourd'hui</div>
                <div className="pm-metric-value">3.2k</div>
              </div>
            </div>
          </div>

          {/* Graphiques inférieurs - 2 colonnes */}
          <div className="pm-bottom-charts">
            {/* Activités via Quêtes */}
            <div className="pm-skills-chart">
              <h4>🎯 ACTIVITÉS VIA QUÊTES</h4>
              
              {/* Métriques principales en haut */}
              <div className="pm-activities-top-metrics">
                <div className="pm-top-metric">
                  <div className="pm-top-value">{totalQuests}</div>
                  <div className="pm-top-label">Total Quêtes</div>
                  <div className="pm-top-subtitle">{questStats.totalXP} XP</div>
                </div>
                <div className="pm-top-metric">
                  <div className="pm-top-value">{currentStreak}j</div>
                  <div className="pm-top-label">Streak</div>
                  <div className="pm-top-subtitle">{questStats.bestDay}</div>
                </div>
                <div className="pm-top-metric">
                  <div className="pm-top-value">{topActivity}</div>
                  <div className="pm-top-label">Top Activité</div>
                  <div className="pm-top-subtitle">{weeklyActivities[0].xp} XP</div>
                </div>
              </div>
              
              {/* Graphique en barres */}
              <ActivitiesBarChart 
                activities={weeklyActivities}
                getActivityColor={getActivityColor}
              />
              
              {/* Statistiques détaillées */}
              <div className="pm-quest-stats">
                <div className="pm-stat-row">
                  <div className="pm-stat-item">
                    <span className="pm-stat-icon">📅</span>
                    <span className="pm-stat-text">Quotidiennes: {questStats.dailyCompleted}/5</span>
                  </div>
                  <div className="pm-stat-item">
                    <span className="pm-stat-icon">📆</span>
                    <span className="pm-stat-text">Hebdomadaires: {questStats.weeklyCompleted}/3</span>
                  </div>
                </div>
                <div className="pm-stat-row">
                  <div className="pm-stat-item">
                    <span className="pm-stat-icon">📊</span>
                    <span className="pm-stat-text">Moyenne: {questStats.averageXP} XP/quête</span>
                  </div>
                  <div className="pm-stat-item">
                    <span className="pm-stat-icon">🏆</span>
                    <span className="pm-stat-text">Meilleure semaine: {questStats.bestWeek}</span>
                  </div>
                </div>
              </div>
              
              {/* Tendances compactes */}
              <div className="pm-trends-compact">
                {monthlyTrends.slice(0, 4).map((trend, index) => (
                  <div key={index} className="pm-trend-compact">
                    <span className="pm-trend-icon-small">{trend.icon}</span>
                    <span className="pm-trend-name-small">{trend.name}</span>
                    <span className={`pm-trend-change-small ${trend.change > 0 ? 'positive' : 'negative'}`}>
                      {trend.change > 0 ? '+' : ''}{trend.change}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activité Matrix (Heatmap) */}
            <div className="pm-activity-chart">
              <ActivityHeatmap weeks={20} />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProjectionMatrixBlockRefonte;
