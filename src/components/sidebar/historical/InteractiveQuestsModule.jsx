import React, { memo, useCallback, useState, useMemo } from 'react';
import { useQuietQuestEngine, getTodayDateStr } from '../../../hooks/useQuietQuestEngine';
import { emitSidebarEvent, SIDEBAR_EVENTS } from '../../../utils/sidebarEvents';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import AnimatedProgressBar from '../enhanced/AnimatedProgressBar';
import PremiumBadge from '../enhanced/PremiumBadge';
import StatCard from '../enhanced/StatCard';
import PeriodSelector from '../enhanced/PeriodSelector';
import '../../../styles/sidebar-visual-enhancements.css';

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
    if (!navigation?.setActiveTab) return;
    
    try {
      const target = {
        tab: 'quests',
        subtab: 'quests',
        moduleId: 'quest-creation-form',
        scrollBehavior: 'smooth',
        highlightDuration: 3000
      };

      await deepLinkService.navigateToModule(target, navigation.setActiveTab);
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur navigation création:', error);
    }
  }, [navigation]);

  // Navigation vers l'onglet Quêtes
  const handleNavigateToQuests = useCallback(async () => {
    if (!navigation?.setActiveTab) return;
    
    try {
      const target = {
        tab: 'quests',
        subtab: 'today',
        moduleId: 'quests-today-view',
        scrollBehavior: 'smooth',
        highlightDuration: 2000
      };

      await deepLinkService.navigateToModule(target, navigation.setActiveTab);
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
          {/* Barre XP avec niveau et progression - VERSION ENRICHIE */}
          <div className="sidebar-content-dense">
            <StatCard
              title="Niveau Actuel"
              value={`Niv. ${xpProgress.level}`}
              icon="⭐"
              color="var(--sidebar-gold)"
            />
            <div className="stat-card-premium">
              <div className="stat-header">
                <span className="stat-icon" style={{ color: 'var(--sidebar-magenta)' }}>💎</span>
                <PremiumBadge 
                  type="xp" 
                  value={`${Math.round(xpProgress.progressPercentage)}%`}
                  icon="⚡"
                />
              </div>
              <AnimatedProgressBar
                value={xpProgress.progressPercentage}
                color="var(--sidebar-premium-gradient-1)"
                label="Progression XP"
                showValue={false}
              />
              <div className="stat-title">
                {xpProgress.xpInCurrentLevel.toLocaleString()} / {xpProgress.xpForNextLevel.toLocaleString()} XP
              </div>
            </div>
          </div>

          {/* Liste des quêtes du jour - VERSION ENRICHIE */}
          {todayQuests.length === 0 ? (
            <div className="empty-state-attractive">
              <div className="empty-illustration">🎯</div>
              <div className="empty-message">Aucune quête aujourd'hui</div>
              <button 
                className="empty-action-button"
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
                    className={`stat-card-premium quest-item ${isCompleted ? 'completed' : ''}`}
                    style={{ 
                      padding: '12px',
                      marginBottom: '8px',
                      background: isCompleted 
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)'
                        : 'var(--sidebar-bg-card)'
                    }}
                  >
                    <div className="stat-header">
                      <div 
                        className="sidebar-quest-checkbox"
                        onClick={() => handleQuestToggle(quest.id)}
                        role="button"
                        tabIndex={0}
                        aria-label={`${isCompleted ? 'Décocher' : 'Cocher'} la quête ${quest.nom}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: isCompleted 
                            ? 'var(--sidebar-premium-gradient-3)' 
                            : 'rgba(255, 255, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {isCompleted ? '✓' : '○'}
                      </div>
                      {quest.icone && (
                        <span className="stat-icon" style={{ color: 'var(--sidebar-cyan)' }}>
                          {quest.icone}
                        </span>
                      )}
                      <PremiumBadge 
                        type="xp" 
                        value={`${quest.xp || 0} XP`}
                        animated={false}
                      />
                    </div>
                    <div className="sidebar-quest-info">
                      <div className="stat-value" style={{ 
                        fontSize: '0.9rem', 
                        marginBottom: '4px',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.7 : 1
                      }}>
                        {quest.nom}
                      </div>
                      <div className="stat-title">{quest.categorie}</div>
                    </div>
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

          {/* Statistiques avec échelles configurables - VERSION ENRICHIE */}
          <div className="sidebar-content-dense">
            <div className="stat-card-premium">
              <div className="stat-header">
                <span className="stat-icon" style={{ color: 'var(--sidebar-green)' }}>📊</span>
                <span className="stat-trend">
                  {statistics.completionRate >= 80 ? '🔥' : statistics.completionRate >= 60 ? '📈' : '📉'}
                </span>
              </div>
              <div className="stat-value" style={{ color: 'var(--sidebar-green)' }}>
                {statistics.completionRate}%
              </div>
              <div className="stat-title">Taux de réussite</div>
              <PeriodSelector
                value={completionRatePeriod}
                onChange={setCompletionRatePeriod}
                options={periodOptions}
                label=""
                icon=""
              />
            </div>

            <div className="stat-card-premium">
              <div className="stat-header">
                <span className="stat-icon" style={{ color: 'var(--sidebar-orange)' }}>🔥</span>
                <PremiumBadge 
                  type="warning" 
                  value="jours"
                  animated={statistics.currentStreak > 0}
                />
              </div>
              <div className="stat-value" style={{ color: 'var(--sidebar-orange)' }}>
                {statistics.currentStreak}
              </div>
              <div className="stat-title">Série actuelle</div>
              <PeriodSelector
                value={streakPeriod}
                onChange={setStreakPeriod}
                options={periodOptions}
                label=""
                icon=""
              />
            </div>

            <div className="stat-card-premium">
              <div className="stat-header">
                <span className="stat-icon" style={{ color: 'var(--sidebar-magenta)' }}>💎</span>
                <span className="stat-trend">⚡</span>
              </div>
              <div className="stat-value" style={{ color: 'var(--sidebar-magenta)' }}>
                {statistics.totalXP.toLocaleString()}
              </div>
              <div className="stat-title">XP total</div>
              <PeriodSelector
                value={xpPeriod}
                onChange={setXpPeriod}
                options={periodOptions}
                label=""
                icon=""
              />
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
