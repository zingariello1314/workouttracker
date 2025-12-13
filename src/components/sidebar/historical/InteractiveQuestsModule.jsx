import React, { memo, useCallback, useState, useMemo } from 'react';
import { useQuietQuestEngine, getTodayDateStr } from '../../../hooks/useQuietQuestEngine';
import { emitSidebarEvent, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';

/**
 * InteractiveQuestsModule - Module Quêtes Interactives (Position 7)
 * Structure identique aux anciens modules sidebar - PATTERN LEGACY
 * 
 * Fonctionnalités:
 * - Affichage des quêtes du jour avec checkboxes fonctionnelles
 * - Synchronisation temps réel avec l'onglet Quêtes
 * - Barre XP avec niveau et progression temps réel
 * - Bouton "Créer Quête" avec navigation précise
 * - Statistiques avec échelles de temps configurables individuellement
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */
const InteractiveQuestsModule = memo(({ 
  isExpanded,
  onToggle,
  data = {},
  navigation
}) => {
  // Hook QuietQuest pour les données et actions
  const {
    userData = { currentXP: 0, level: 1, xpForNextLevel: 2500 },
    getQuestsForDate,
    isQuestCompletedOnDate,
    toggleQuestValidation,
    dailyPerformances = []
  } = useQuietQuestEngine();

  // États locaux pour les périodes de statistiques configurables individuellement
  const [completionRatePeriod, setCompletionRatePeriod] = useState('7d');
  const [streakPeriod, setStreakPeriod] = useState('30d');
  const [xpPeriod, setXpPeriod] = useState('30d');

  // Récupération des quêtes du jour
  const todayQuests = useMemo(() => {
    try {
      if (!getQuestsForDate) return [];
      const today = getTodayDateStr();
      return getQuestsForDate(today) || [];
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur chargement quêtes:', error);
      return [];
    }
  }, [getQuestsForDate]);

  // Calcul de la progression XP
  const xpProgress = useMemo(() => {
    const { currentXP = 0, level = 1, xpForNextLevel = 2500 } = userData;
    
    // XP requis pour le niveau actuel (niveau 1 = 0 XP, niveau 2 = 2500 XP, etc.)
    const xpForCurrentLevel = (level - 1) * xpForNextLevel;
    const xpInCurrentLevel = Math.max(0, currentXP - xpForCurrentLevel);
    const progressPercentage = Math.min(100, (xpInCurrentLevel / xpForNextLevel) * 100);
    
    return {
      currentXP,
      level,
      xpInCurrentLevel,
      xpForNextLevel,
      progressPercentage
    };
  }, [userData]);

  // Calcul des statistiques par période
  const statistics = useMemo(() => {
    const getPeriodData = (period) => {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days + 1);
      const startDateStr = startDate.toISOString().slice(0, 10);
      
      return dailyPerformances.filter(perf => perf.date >= startDateStr);
    };

    // Taux de réussite
    const completionData = getPeriodData(completionRatePeriod);
    const avgCompletionRate = completionData.length > 0 
      ? Math.round(completionData.reduce((sum, d) => sum + (d.successRate || 0), 0) / completionData.length)
      : 0;

    // Série actuelle (streak)
    const streakData = getPeriodData(streakPeriod);
    let currentStreak = 0;
    const sortedStreakData = [...streakData].sort((a, b) => b.date.localeCompare(a.date));
    
    for (const perf of sortedStreakData) {
      if (perf.successRate > 0) {
        currentStreak++;
      } else {
        break;
      }
    }

    // XP total
    const xpData = getPeriodData(xpPeriod);
    const totalXP = xpData.reduce((sum, d) => sum + (d.xpEarned || 0), 0);

    return {
      completionRate: avgCompletionRate,
      currentStreak,
      totalXP
    };
  }, [dailyPerformances, completionRatePeriod, streakPeriod, xpPeriod]);

  // Gestion du toggle des quêtes avec synchronisation
  const handleQuestToggle = useCallback(async (questId) => {
    try {
      const today = getTodayDateStr();
      await toggleQuestValidation(questId, today);
      
      // Émettre événement pour synchronisation sidebar
      emitSidebarEvent(SIDEBAR_EVENTS.QUEST_COMPLETED, {
        questId,
        date: today,
        moduleId: 'interactive-quests'
      });
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur toggle quête:', error);
    }
  }, [toggleQuestValidation]);

  // Navigation vers création de quête
  const handleCreateQuest = useCallback(async () => {
    if (!navigation?.navigateToModule) return;
    
    try {
      await navigation.navigateToModule({
        tab: 'quests',
        subtab: 'quests',
        moduleId: 'quest-creation-form',
        scrollBehavior: 'smooth',
        highlightDuration: 3000
      });
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur navigation création:', error);
    }
  }, [navigation]);

  // Navigation vers l'onglet Quêtes
  const handleNavigateToQuests = useCallback(async () => {
    if (!navigation?.navigateToModule) return;
    
    try {
      await navigation.navigateToModule({
        tab: 'quests',
        subtab: 'today',
        moduleId: 'quests-today-view',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      });
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur navigation quêtes:', error);
    }
  }, [navigation]);

  // Options de période pour les sélecteurs
  const periodOptions = [
    { value: '7d', label: '7j' },
    { value: '30d', label: '30j' },
    { value: '90d', label: '90j' },
    { value: '365d', label: '1an' }
  ];

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
          <span className="sidebar-section-icon">🎯</span>
          Quêtes Interactives
          <span className="sidebar-section-badge">{todayQuests.length}</span>
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
          {/* Barre XP avec niveau et progression */}
          <div className="sidebar-data-grid">
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">⭐</span>
              <div className="sidebar-data-value">Niv. {xpProgress.level}</div>
              <div className="sidebar-data-label">Niveau actuel</div>
              <div className="sidebar-data-progress">
                <div 
                  className="sidebar-data-progress-bar" 
                  style={{ width: `${xpProgress.progressPercentage}%` }}
                />
              </div>
              <div className="sidebar-data-hint">
                {xpProgress.xpInCurrentLevel} / {xpProgress.xpForNextLevel} XP
              </div>
            </div>
          </div>

          {/* Liste des quêtes du jour */}
          {todayQuests.length === 0 ? (
            <div className="sidebar-info-box">
              <span className="sidebar-info-icon">🎯</span>
              <span>Aucune quête aujourd'hui</span>
              <button 
                className="sidebar-action-button-small"
                onClick={handleCreateQuest}
              >
                Créer ma première quête
              </button>
            </div>
          ) : (
            <div className="sidebar-quest-list">
              {todayQuests.map(quest => {
                const isCompleted = isQuestCompletedOnDate ? 
                  isQuestCompletedOnDate(quest.id, getTodayDateStr()) : false;
                
                return (
                  <div 
                    key={quest.id} 
                    className={`sidebar-quest-item ${isCompleted ? 'completed' : ''}`}
                  >
                    <div 
                      className="sidebar-quest-checkbox"
                      onClick={() => handleQuestToggle(quest.id)}
                      role="button"
                      tabIndex={0}
                      aria-label={`${isCompleted ? 'Décocher' : 'Cocher'} la quête ${quest.nom}`}
                    >
                      {isCompleted ? '✓' : '○'}
                    </div>
                    <div className="sidebar-quest-info">
                      <div className="sidebar-quest-name">{quest.nom}</div>
                      <div className="sidebar-quest-meta">
                        <span className="sidebar-quest-category">{quest.categorie}</span>
                        <span className="sidebar-quest-xp">{quest.xp || 0} XP</span>
                      </div>
                    </div>
                    {quest.icone && (
                      <span className="sidebar-quest-icon">{quest.icone}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton Créer Quête */}
          <div className="sidebar-actions-grid">
            <button 
              className="sidebar-action-button"
              onClick={handleCreateQuest}
            >
              <span className="sidebar-action-icon">➕</span>
              <span>Créer</span>
            </button>
          </div>

          {/* Statistiques avec échelles configurables */}
          <div className="sidebar-data-grid">
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">📊</span>
              <div className="sidebar-data-value">{statistics.completionRate}%</div>
              <div className="sidebar-data-label">Taux de réussite</div>
              <select 
                value={completionRatePeriod}
                onChange={(e) => setCompletionRatePeriod(e.target.value)}
                className="sidebar-data-selector"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">🔥</span>
              <div className="sidebar-data-value">{statistics.currentStreak}</div>
              <div className="sidebar-data-label">Série actuelle</div>
              <select 
                value={streakPeriod}
                onChange={(e) => setStreakPeriod(e.target.value)}
                className="sidebar-data-selector"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <div className="sidebar-data-hint">jours</div>
            </div>

            <div className="sidebar-data-card">
              <span className="sidebar-data-icon">💎</span>
              <div className="sidebar-data-value">{statistics.totalXP.toLocaleString()}</div>
              <div className="sidebar-data-label">XP total</div>
              <select 
                value={xpPeriod}
                onChange={(e) => setXpPeriod(e.target.value)}
                className="sidebar-data-selector"
              >
                {periodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Navigation vers Quêtes */}
          <button 
            className="sidebar-action-button clickable"
            onClick={handleNavigateToQuests}
          >
            <span className="sidebar-action-icon">🎯</span>
            <span>Voir toutes les quêtes</span>
            <span className="sidebar-action-arrow">→</span>
          </button>
        </div>
      )}
    </section>
  );
});

InteractiveQuestsModule.displayName = 'InteractiveQuestsModule';

export default InteractiveQuestsModule;
