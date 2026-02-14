import React, { memo, useCallback, useState, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { useQuietQuestEngine } from '../../../hooks/useQuietQuestEngine';
import { getHeureDisplay } from '../../../utils/quests';
import { emitSidebarEvent, SIDEBAR_EVENTS, useSidebarEvents } from '../../../utils/sidebarEvents';
import deepLinkService from '../../../services/navigation/DeepLinkService';
import AnimatedProgressBar from '../enhanced/AnimatedProgressBar';
import PremiumBadge from '../enhanced/PremiumBadge';
import StatCard from '../enhanced/StatCard';
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
    deleteQuest,
    dailyPerformances = [],
    todayDate,
    prayerLocation,
  } = useQuietQuestEngine();

  // États locaux pour les périodes de statistiques configurables individuellement
  const [completionRatePeriod, setCompletionRatePeriod] = useState('7d');
  const [streakPeriod, setStreakPeriod] = useState('30d');
  const [xpPeriod, setXpPeriod] = useState('30d');

  // Récupération des quêtes du jour (todayDate mis à jour après minuit)
  const todayQuests = useMemo(() => {
    try {
      if (!getQuestsForDate || !todayDate) return [];
      return getQuestsForDate(todayDate) || [];
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur chargement quêtes:', error);
      return [];
    }
  }, [getQuestsForDate, todayDate]);

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

    // XP sur la période (source : dailyPerformances.xpTotal, mis à jour par le moteur)
    const xpData = getPeriodData(xpPeriod);
    const totalXPPeriod = xpData.reduce((sum, d) => sum + (d.xpTotal ?? d.xpEarned ?? 0), 0);

    return {
      completionRate: avgCompletionRate,
      currentStreak,
      totalXPPeriod
    };
  }, [dailyPerformances, completionRatePeriod, streakPeriod, xpPeriod]);

  // Gestion du toggle des quêtes avec synchronisation
  const handleQuestToggle = useCallback(async (questId) => {
    try {
      await toggleQuestValidation(questId, todayDate, { origin: 'interactive-quests' });
    } catch (error) {
      console.error('[InteractiveQuestsModule] Erreur toggle quête:', error);
    }
  }, [toggleQuestValidation, todayDate]);

  // Synchroniser les toggles effectués depuis l'onglet Quêtes ou ailleurs
  const handleExternalQuestToggle = useCallback((data) => {
    if (!data || !data.questId || !data.date) return;
    // Ignorer les événements déjà issus de ce module ou d'une synchro précédente
    if (data.origin === 'interactive-quests' || data.origin === 'sync-from-tab') return;
    // Rejouer le toggle dans ce moteur avec une origine spécifique pour éviter les boucles
    toggleQuestValidation(data.questId, data.date, { origin: 'sync-from-tab' });
  }, [toggleQuestValidation]);

  useSidebarEvents(SIDEBAR_EVENTS.QUEST_COMPLETED, handleExternalQuestToggle);
  useSidebarEvents(SIDEBAR_EVENTS.QUEST_UPDATED, handleExternalQuestToggle);

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
    <section className={`sidebar-section sidebar-section-enhanced sidebar-module-interactive-quests ${isExpanded ? 'expanded' : ''}`}>
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
              {todayQuests.map((quest, index) => {
                const isCompleted = isQuestCompletedOnDate ? 
                  isQuestCompletedOnDate(quest.id, todayDate) : false;
                
                return (
                  <div 
                    key={`interactive-quest-${String(quest.id)}-${index}`} 
                    className={`stat-card-premium interactive-quest-card ${isCompleted ? 'completed' : ''}`}
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
                      {deleteQuest && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteQuest(quest.id);
                          }}
                          className="ml-auto p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          title="Supprimer la quête"
                          aria-label={`Supprimer ${quest.nom}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <div className="sidebar-quest-info">
                      <div className="stat-value" style={{ 
                        fontSize: '0.9rem', 
                        marginBottom: '4px',
                        textDecoration: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.7 : 1
                      }}>
                        {(() => {
                          const h = getHeureDisplay(quest, todayDate, prayerLocation);
                          return h ? <span className="text-amber-400/90 text-[10px] font-mono mr-1.5">{h}</span> : null;
                        })()}
                        {quest.nom}
                      </div>
                      <div className="stat-title">{quest.categorie}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bouton Créer Quête - horizontal */}
          <div className="sidebar-actions-grid sidebar-actions-grid-single">
            <button 
              type="button"
              className="sidebar-action-button sidebar-action-button-horizontal"
              onClick={handleCreateQuest}
            >
              <span className="sidebar-action-icon">➕</span>
              <span>Créer</span>
            </button>
          </div>

          {/* Statistiques : 2 carrés côte à côte + 1 rectangle en dessous, largeur maîtrisée */}
          <div className="sidebar-quests-stats-row">
            <div className="sidebar-quests-stats-grid">
              <div className="stat-card-premium stat-card-square">
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
                <div className="stat-period-row">
                  <span className="stat-period-label">Pér.</span>
                  <select
                    value={completionRatePeriod}
                    onChange={(e) => setCompletionRatePeriod(e.target.value)}
                    className="sidebar-period-selector-compact"
                    aria-label="Période taux de réussite"
                  >
                    {periodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="stat-card-premium stat-card-square">
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
                <div className="stat-period-row">
                  <span className="stat-period-label">Fen.</span>
                  <select
                    value={streakPeriod}
                    onChange={(e) => setStreakPeriod(e.target.value)}
                    className="sidebar-period-selector-compact"
                    aria-label="Fenêtre série"
                  >
                    {periodOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="stat-card-premium stat-card-wide">
                <div className="stat-header">
                  <span className="stat-icon" style={{ color: 'var(--sidebar-magenta)' }}>💎</span>
                  <span className="stat-trend">⚡</span>
                </div>
              <div className="stat-value" style={{ color: 'var(--sidebar-magenta)' }}>
                {userData.currentXP != null ? userData.currentXP.toLocaleString() : '0'}
              </div>
              <div className="stat-title">XP actuel</div>
              <div className="stat-period-row">
                <span className="stat-period-label">Sur période</span>
                <select
                  value={xpPeriod}
                  onChange={(e) => setXpPeriod(e.target.value)}
                  className="sidebar-period-selector-compact"
                  aria-label="Période XP"
                >
                  {periodOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="stat-period-xp-sub">
                {statistics.totalXPPeriod.toLocaleString()} XP
              </div>
              </div>
            </div>
          </div>

          {/* Navigation vers Quêtes - espacement clair au-dessus */}
          <button 
            className="sidebar-action-button sidebar-action-button-spaced clickable"
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
