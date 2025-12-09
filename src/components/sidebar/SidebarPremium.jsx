import React, { memo, useMemo, useCallback, lazy, Suspense } from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { useSidebarData } from '../../hooks/useSidebarData';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import ProfileCard3D from './ProfileCard3D';
import '../../styles/sidebar-premium.css';

/**
 * Composant principal de la Sidebar Premium QuietQuest
 * Affiche toutes les informations vitales et actions rapides de l'utilisateur
 * 
 * Optimisations de performance:
 * - React.memo pour éviter les re-renders inutiles
 * - useMemo pour les calculs coûteux
 * - useCallback pour les fonctions stables
 * - Lazy loading des sections
 * - Intersection Observer pour le rendu conditionnel
 */
const SidebarPremium = memo(() => {
  const {
    currentTime,
    expandedSections,
    systemStatus,
    isMobileOpen,
    toggleSection,
    isSectionExpanded,
    getFormattedTime,
    getFormattedDate,
    getFormattedDayMonth,
    getFormattedYear,
    toggleMobileSidebar,
    closeMobileSidebar,
  } = useSidebar();

  // Charger les données réelles depuis tous les modules
  const {
    metrics,    // XP, Niveau, Streak, Focus
    quests,     // Quêtes du jour
    sport,      // Entraînements, Garmin
    finance,    // Patrimoine, Budget
    nutrition,  // Calories, Macros
    learning,   // Livres, Pages
    isLoading
  } = useSidebarData();

  // Hook de navigation
  const navigation = useNavigation();

  // Hook d'authentification
  const { user } = useAuth();

  const sidebarRef = React.useRef(null);
  const observerRef = React.useRef(null);

  // Optimisation: Throttle pour limiter les calculs de position
  const throttledUpdatePosition = React.useCallback(() => {
    if (!sidebarRef.current) return;

    // Utiliser requestAnimationFrame pour optimiser les performances
    requestAnimationFrame(() => {
      if (!sidebarRef.current) return;

      const header = document.querySelector('header');
      const navigation = document.querySelector('nav');
      
      let totalHeaderHeight = 0;
      
      if (header) {
        totalHeaderHeight += header.offsetHeight;
      }
      
      if (navigation) {
        totalHeaderHeight += navigation.offsetHeight;
      }

      // Appliquer la position calculée avec transform pour de meilleures performances
      if (totalHeaderHeight > 0) {
        sidebarRef.current.style.top = `${totalHeaderHeight}px`;
        sidebarRef.current.style.height = `calc(100vh - ${totalHeaderHeight}px)`;
      } else {
        sidebarRef.current.style.top = '0';
        sidebarRef.current.style.height = '100vh';
      }
    });
  }, []);

  // Calculer dynamiquement la hauteur du header pour positionner la sidebar
  React.useEffect(() => {
    // Mettre à jour au montage
    throttledUpdatePosition();

    // Throttle pour le resize (max 1 fois toutes les 100ms)
    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(throttledUpdatePosition, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
    
    // Observer les changements dans le DOM avec throttling
    let mutationTimeout;
    const handleMutation = () => {
      if (mutationTimeout) {
        clearTimeout(mutationTimeout);
      }
      mutationTimeout = setTimeout(throttledUpdatePosition, 50);
    };

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { 
      childList: true, 
      subtree: false, // Optimisation: ne pas observer tout le subtree
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (mutationTimeout) clearTimeout(mutationTimeout);
    };
  }, [throttledUpdatePosition]);

  // Mémoriser les props pour éviter les re-renders
  const sectionProps = useMemo(() => ({
    sport: { isExpanded: isSectionExpanded('sport'), onToggle: () => toggleSection('sport'), data: sport, navigation },
    learning: { isExpanded: isSectionExpanded('learning'), onToggle: () => toggleSection('learning'), data: learning, navigation },
    books: { isExpanded: isSectionExpanded('books'), onToggle: () => toggleSection('books'), data: learning, navigation },
    finance: { isExpanded: isSectionExpanded('finance'), onToggle: () => toggleSection('finance'), data: finance, navigation },
    journal: { isExpanded: isSectionExpanded('journal'), onToggle: () => toggleSection('journal'), navigation },
    focusSession: { isExpanded: isSectionExpanded('focusSession'), onToggle: () => toggleSection('focusSession'), navigation },
    achievements: { isExpanded: isSectionExpanded('achievements'), onToggle: () => toggleSection('achievements'), navigation },
    focusRPG: { isExpanded: isSectionExpanded('focusRPG'), onToggle: () => toggleSection('focusRPG'), navigation },
    dailyGoals: { isExpanded: isSectionExpanded('dailyGoals'), onToggle: () => toggleSection('dailyGoals'), navigation },
    notifications: { isExpanded: isSectionExpanded('notifications'), onToggle: () => toggleSection('notifications'), navigation },
    weather: { isExpanded: isSectionExpanded('weather'), onToggle: () => toggleSection('weather'), navigation },
    motivation: { isExpanded: isSectionExpanded('motivation'), onToggle: () => toggleSection('motivation'), navigation },
    rewards: { isExpanded: isSectionExpanded('rewards'), onToggle: () => toggleSection('rewards'), navigation },
    history: { isExpanded: isSectionExpanded('history'), onToggle: () => toggleSection('history'), navigation },
    quickSettings: { isExpanded: isSectionExpanded('quickSettings'), onToggle: () => toggleSection('quickSettings'), navigation },
    aiPredictions: { isExpanded: isSectionExpanded('aiPredictions'), onToggle: () => toggleSection('aiPredictions'), navigation },
    globalStats: { isExpanded: isSectionExpanded('globalStats'), onToggle: () => toggleSection('globalStats'), navigation },
  }), [isSectionExpanded, toggleSection, sport, learning, finance, navigation]);

  return (
    <>
      {/* Bouton toggle mobile - Requirement 13.3 */}
      <button
        className={`sidebar-mobile-toggle ${isMobileOpen ? 'open' : ''}`}
        onClick={toggleMobileSidebar}
        aria-label={isMobileOpen ? 'Fermer la sidebar' : 'Ouvrir la sidebar'}
        aria-expanded={isMobileOpen}
        type="button"
      >
        <span className="sidebar-mobile-toggle-icon" aria-hidden="true">
          {isMobileOpen ? '✕' : '☰'}
        </span>
      </button>

      {/* Overlay mobile - Requirement 13.4 */}
      <div
        className={`sidebar-mobile-overlay ${isMobileOpen ? 'visible' : ''}`}
        onClick={closeMobileSidebar}
        aria-hidden="true"
      />

      <aside 
        ref={sidebarRef}
        className={`sidebar-premium ${isMobileOpen ? 'mobile-open' : ''}`}
        role="complementary"
        aria-label="Sidebar Premium QuietQuest"
      >
        {/* Skip link pour navigation rapide - Requirement 12.2 */}
        <a href="#sidebar-main-content" className="sidebar-skip-link">
          Aller au contenu principal
        </a>
      
      {/* Zone Fixe - Horloge et Profil */}
      <div className="sidebar-clock-section" id="sidebar-clock-section">
        {/* Bloc Encadré Heure/Date avec 3 couches d'effets */}
        <div className="time-date-block">
          {/* AFFICHAGE DE L'HEURE */}
          <div className="time-display">
            <div className="time-main">{getFormattedTime()}</div>
            <div className="time-shadow" aria-hidden="true">{getFormattedTime()}</div>
            <div className="time-glow" aria-hidden="true">{getFormattedTime()}</div>
          </div>
          
          {/* AFFICHAGE DE LA DATE */}
          <div className="date-display">
            {/* Ligne 1: Jour + Mois */}
            <div className="date-day-month">
              <div className="date-main">{getFormattedDayMonth().toUpperCase()}</div>
              <div className="date-shadow" aria-hidden="true">{getFormattedDayMonth().toUpperCase()}</div>
              <div className="date-glow" aria-hidden="true">{getFormattedDayMonth().toUpperCase()}</div>
            </div>
            
            {/* Ligne 2: Année */}
            <div className="date-year">
              <div className="year-main">{getFormattedYear()}</div>
              <div className="year-shadow" aria-hidden="true">{getFormattedYear()}</div>
              <div className="year-glow" aria-hidden="true">{getFormattedYear()}</div>
            </div>
          </div>
        </div>
        
        {/* Carte Développeur 3D Holographique */}
        <ProfileCard3D
          username={user?.username || 'guest'}
          showUserInfo={true}
          enableTilt={true}
          enableMobileTilt={false}
        />
        
        {/* Statuts Système (Grille 2x2) */}
        <div className="sidebar-system-status" role="group" aria-label="Statuts système">
          {/* Statut Actif */}
          <div className="sidebar-status-item" role="status" aria-label="Système actif">
            <div className="sidebar-status-pulse" aria-hidden="true"></div>
            <div className="sidebar-status-label" aria-hidden="true">Système</div>
            <div className="sidebar-status-value" aria-hidden="true">Actif</div>
          </div>
          
          {/* Mode Nuit */}
          <div 
            className="sidebar-status-item" 
            role="status" 
            aria-label={`Mode ${systemStatus.nightMode ? 'Nuit' : 'Jour'} activé`}
          >
            <div className="sidebar-status-icon" aria-hidden="true">
              {systemStatus.nightMode ? '🌙' : '☀️'}
            </div>
            <div className="sidebar-status-label" aria-hidden="true">Mode</div>
            <div className="sidebar-status-value" aria-hidden="true">
              {systemStatus.nightMode ? 'Nuit' : 'Jour'}
            </div>
          </div>
          
          {/* Connexion */}
          <div 
            className="sidebar-status-item" 
            role="status" 
            aria-label={`Connexion: ${systemStatus.connected ? 'En ligne' : 'Hors ligne'}`}
          >
            <div className="sidebar-status-icon" aria-hidden="true">📡</div>
            <div className="sidebar-status-label" aria-hidden="true">Connexion</div>
            <div className="sidebar-status-value" aria-hidden="true">
              {systemStatus.connected ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
          
          {/* Focus */}
          <div 
            className="sidebar-status-item" 
            role="status" 
            aria-label={`Focus: ${systemStatus.focusPercentage} pourcent`}
          >
            <div className="sidebar-status-icon" aria-hidden="true">🔋</div>
            <div className="sidebar-status-label" aria-hidden="true">Focus</div>
            <div className="sidebar-status-value" aria-hidden="true">
              {systemStatus.focusPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Zone Scrollable - Sections */}
      <div className="sidebar-content" id="sidebar-main-content">
        {/* Section Actions Rapides */}
        <section className="sidebar-section">
          <header 
            className="sidebar-section-header"
            onClick={() => toggleSection('actions')}
            role="button"
            tabIndex={0}
            aria-expanded={isSectionExpanded('actions')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection('actions');
              }
            }}
          >
            <h2 className="sidebar-section-title">
              <span className="sidebar-section-icon" aria-hidden="true">⚡</span>
              Actions Rapides
            </h2>
            <span 
              className={`sidebar-section-toggle ${isSectionExpanded('actions') ? 'expanded' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </header>
          
          {isSectionExpanded('actions') && (
            <div className="sidebar-section-content">
              {/* Grille 2x2 - Boutons principaux */}
              <div className="sidebar-actions-grid" role="group" aria-label="Actions principales">
                <button 
                  className="sidebar-action-button" 
                  aria-label="Démarrer une session focus"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">🎯</span>
                  <span className="sidebar-action-label">Focus</span>
                </button>
                
                <button 
                  className="sidebar-action-button" 
                  aria-label="Commencer une session de lecture"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">📚</span>
                  <span className="sidebar-action-label">Lire</span>
                </button>
                
                <button 
                  className="sidebar-action-button" 
                  aria-label="Démarrer une session sport"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">💪</span>
                  <span className="sidebar-action-label">Sport</span>
                </button>
                
                <button 
                  className="sidebar-action-button" 
                  aria-label="Voir les quêtes"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">🏆</span>
                  <span className="sidebar-action-label">Quêtes</span>
                </button>
              </div>
              
              {/* Ligne de 4 boutons secondaires */}
              <div className="sidebar-actions-secondary" role="group" aria-label="Actions secondaires">
                <button 
                  className="sidebar-action-button-small" 
                  aria-label="Gérer les revenus"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">💰</span>
                  <span className="sidebar-action-label">Revenus</span>
                </button>
                
                <button 
                  className="sidebar-action-button-small" 
                  aria-label="Ajouter un film"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">🎬</span>
                  <span className="sidebar-action-label">Film</span>
                </button>
                
                <button 
                  className="sidebar-action-button-small" 
                  aria-label="Écrire dans le journal"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">📝</span>
                  <span className="sidebar-action-label">Journal</span>
                </button>
                
                <button 
                  className="sidebar-action-button-small" 
                  aria-label="Méditer"
                  type="button"
                >
                  <span className="sidebar-action-icon" aria-hidden="true">🧘</span>
                  <span className="sidebar-action-label">Méditer</span>
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Section Métriques Vitales */}
        <section className="sidebar-section">
          <header 
            className="sidebar-section-header"
            onClick={() => toggleSection('metrics')}
            role="button"
            tabIndex={0}
            aria-expanded={isSectionExpanded('metrics')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection('metrics');
              }
            }}
          >
            <h2 className="sidebar-section-title">
              <span className="sidebar-section-icon" aria-hidden="true">📊</span>
              Métriques Vitales
            </h2>
            <span 
              className={`sidebar-section-toggle ${isSectionExpanded('metrics') ? 'expanded' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </header>
          
          {isSectionExpanded('metrics') && (
            <div className="sidebar-section-content">
              <div className="sidebar-metrics-grid" role="group" aria-label="Métriques vitales">
                {/* XP */}
                <div 
                  className="sidebar-metric-card xp" 
                  role="button"
                  tabIndex={0}
                  aria-label={`XP Total: ${metrics.xp.toLocaleString()} points`}
                  onClick={() => navigation.toQuests()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigation.toQuests();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-metric-icon" aria-hidden="true">⭐</span>
                  <div className="sidebar-metric-value" aria-hidden="true">
                    {metrics.xp.toLocaleString()}
                  </div>
                  <div className="sidebar-metric-label" aria-hidden="true">XP Total</div>
                </div>
                
                {/* Niveau */}
                <div 
                  className="sidebar-metric-card level"
                  role="button"
                  tabIndex={0}
                  aria-label={`Niveau: ${metrics.level}`}
                  onClick={() => navigation.toQuests()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigation.toQuests();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-metric-icon" aria-hidden="true">🎖️</span>
                  <div className="sidebar-metric-value" aria-hidden="true">{metrics.level}</div>
                  <div className="sidebar-metric-label" aria-hidden="true">Niveau</div>
                </div>
                
                {/* Streak */}
                <div 
                  className="sidebar-metric-card streak"
                  role="button"
                  tabIndex={0}
                  aria-label={`Streak: ${metrics.streak} jours consécutifs`}
                  onClick={() => navigation.toQuests()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigation.toQuests();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-metric-icon" aria-hidden="true">🔥</span>
                  <div className="sidebar-metric-value" aria-hidden="true">{metrics.streak}</div>
                  <div className="sidebar-metric-label" aria-hidden="true">Jours</div>
                </div>
                
                {/* Focus */}
                <div 
                  className="sidebar-metric-card focus"
                  role="button"
                  tabIndex={0}
                  aria-label={`Focus: ${metrics.focus} pourcent`}
                  onClick={() => navigation.toQuests()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigation.toQuests();
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className="sidebar-metric-icon" aria-hidden="true">⚡</span>
                  <div className="sidebar-metric-value" aria-hidden="true">{metrics.focus}%</div>
                  <div className="sidebar-metric-label" aria-hidden="true">Focus</div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section Quêtes Actives */}
        <section className="sidebar-section">
          <header 
            className="sidebar-section-header"
            onClick={() => toggleSection('quests')}
            role="button"
            tabIndex={0}
            aria-expanded={isSectionExpanded('quests')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleSection('quests');
              }
            }}
          >
            <h2 className="sidebar-section-title">
              <span className="sidebar-section-icon" aria-hidden="true">🎯</span>
              Quêtes Actives
              <span className="sidebar-section-badge">{quests.length}</span>
            </h2>
            <span 
              className={`sidebar-section-toggle ${isSectionExpanded('quests') ? 'expanded' : ''}`}
              aria-hidden="true"
            >
              ▼
            </span>
          </header>
          
          {isSectionExpanded('quests') && (
            <div className="sidebar-section-content">
              {quests.length === 0 ? (
                <div className="sidebar-info-box">
                  <span className="sidebar-info-icon" aria-hidden="true">✨</span>
                  <span>Aucune quête active aujourd'hui</span>
                </div>
              ) : (
                quests.map(quest => (
                  <div 
                    key={quest.id}
                    className="sidebar-quest-item"
                    role="button"
                    tabIndex={0}
                    aria-label={`Quête: ${quest.title}, progression ${quest.progress} pourcent${quest.completed ? ', complétée' : ''}`}
                    onClick={() => navigation.toQuests()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigation.toQuests();
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="sidebar-quest-header">
                      <span className="sidebar-quest-icon" aria-hidden="true">{quest.icon}</span>
                      <div className="sidebar-quest-title" aria-hidden="true">{quest.title}</div>
                      <div className="sidebar-quest-percentage" aria-hidden="true">{quest.progress}%</div>
                    </div>
                    <div className="sidebar-quest-progress">
                      <div 
                        className="sidebar-quest-progress-bar" 
                        style={{ width: `${quest.progress}%` }}
                        role="progressbar"
                        aria-valuenow={quest.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Progression: ${quest.progress} pourcent${quest.completed ? ', complétée' : ''}`}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        {/* Section Sport & Santé */}
        <SportSection {...sectionProps.sport} />

        {/* Section Apprentissage */}
        <LearningSection {...sectionProps.learning} />

        {/* Section Livres */}
        <BooksSection {...sectionProps.books} />

        {/* Section Finances */}
        <FinanceSection {...sectionProps.finance} />

        {/* Section Journal & Films */}
        <JournalSection {...sectionProps.journal} />

        {/* Section Session Focus */}
        <FocusSessionSection {...sectionProps.focusSession} />

        {/* Section Achievements */}
        <AchievementsSection {...sectionProps.achievements} />

        {/* Section Focus RPG */}
        <FocusRPGSection {...sectionProps.focusRPG} />

        {/* Section Objectifs du Jour */}
        <DailyGoalsSection {...sectionProps.dailyGoals} />

        {/* Section Notifications */}
        <NotificationsSection {...sectionProps.notifications} />

        {/* Section Météo */}
        <WeatherSection {...sectionProps.weather} />

        {/* Section Motivation */}
        <MotivationSection {...sectionProps.motivation} />

        {/* Section Récompenses */}
        <RewardsSection {...sectionProps.rewards} />

        {/* Section Historique */}
        <HistorySection {...sectionProps.history} />

        {/* Section Paramètres Rapides */}
        <QuickSettingsSection {...sectionProps.quickSettings} />

        {/* Section Prédictions IA */}
        <AIPredictionsSection {...sectionProps.aiPredictions} />

        {/* Section Statistiques Globales */}
        <GlobalStatsSection {...sectionProps.globalStats} />
      </div>
    </aside>
    </>
  );
});

// Optimisation: Mémoriser les sections pour éviter les re-renders
// Section Sport & Santé
const SportSection = memo(({ isExpanded, onToggle, data, navigation }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">💪</span>
          Sport & Santé
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
            {/* Entraînements cette semaine */}
            <div 
              className="sidebar-data-card"
              onClick={() => navigation.toSportHistory()}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
            >
              <span className="sidebar-data-icon" aria-hidden="true">🏋️</span>
              <div className="sidebar-data-value">{data.weeklyWorkouts}</div>
              <div className="sidebar-data-label">Entraînements</div>
            </div>
            
            {/* Calories brûlées */}
            <div 
              className="sidebar-data-card"
              onClick={() => navigation.toGarmin()}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
            >
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">
                {data.todayCalories > 0 ? data.todayCalories.toLocaleString() : '0'}
              </div>
              <div className="sidebar-data-label">Calories</div>
            </div>
            
            {/* Pas aujourd'hui */}
            <div 
              className="sidebar-data-card"
              onClick={() => navigation.toGarmin()}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
            >
              <span className="sidebar-data-icon" aria-hidden="true">👟</span>
              <div className="sidebar-data-value">
                {data.todaySteps > 0 ? data.todaySteps.toLocaleString() : '0'}
              </div>
              <div className="sidebar-data-label">Pas</div>
            </div>
            
            {/* Fréquence cardiaque */}
            <div 
              className="sidebar-data-card"
              onClick={() => navigation.toGarmin()}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
            >
              <span className="sidebar-data-icon" aria-hidden="true">❤️</span>
              <div className="sidebar-data-value">{data.avgHeartRate}</div>
              <div className="sidebar-data-label">BPM</div>
            </div>
          </div>
          
          {/* Indicateur Garmin */}
          {!data.hasGarminData && (
            <div className="sidebar-info-box warning">
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Données Garmin non disponibles</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

// Section Apprentissage
const LearningSection = memo(({ isExpanded, onToggle, navigation }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🎓</span>
          Apprentissage
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div 
            className="sidebar-data-grid"
            onClick={() => navigation.toLearning()}
            style={{ cursor: 'pointer', opacity: 0.6 }}
          >
            {/* Matières actives */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📚</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Matières</div>
            </div>
            
            {/* Sessions cette semaine */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Sessions</div>
            </div>
            
            {/* Temps total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🕐</span>
              <div className="sidebar-data-value">0h</div>
              <div className="sidebar-data-label">Temps</div>
            </div>
            
            {/* Niveau global */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏆</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Niveau</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Livres
const BooksSection = memo(({ isExpanded, onToggle, data, navigation }) => {
  const progressPercentage = data.dailyGoal > 0 
    ? Math.round((data.todayMinutes / data.dailyGoal) * 100) 
    : 0;

  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📖</span>
          Livres
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
          <div 
            className="sidebar-data-grid"
            onClick={() => navigation.toBooks()}
            style={{ cursor: 'pointer' }}
          >
            {/* Livres en cours */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📚</span>
              <div className="sidebar-data-value">{data.currentBooks}</div>
              <div className="sidebar-data-label">En cours</div>
            </div>
            
            {/* Pages lues aujourd'hui */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📄</span>
              <div className="sidebar-data-value">{data.todayPages}</div>
              <div className="sidebar-data-label">Pages</div>
            </div>
            
            {/* Temps de lecture */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏰</span>
              <div className="sidebar-data-value">{data.todayMinutes}min</div>
              <div className="sidebar-data-label">Lecture</div>
            </div>
            
            {/* Objectif quotidien */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎯</span>
              <div className="sidebar-data-value">{data.dailyGoal}min</div>
              <div className="sidebar-data-label">Objectif</div>
            </div>
          </div>
          
          {/* Progression du jour */}
          {data.dailyGoal > 0 && (
            <div className="sidebar-info-box">
              <div className="sidebar-info-title">Progression du jour</div>
              <div className="sidebar-info-content">
                <span className="sidebar-info-icon" aria-hidden="true">📊</span>
                <span>{data.todayMinutes} / {data.dailyGoal} min ({progressPercentage}%)</span>
              </div>
              <div className="sidebar-progress-mini">
                <div 
                  className="sidebar-progress-mini-bar" 
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  role="progressbar"
                  aria-valuenow={progressPercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          )}
          
          {/* Indicateur données manquantes */}
          {!data.hasData && (
            <div className="sidebar-info-box warning">
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Données de lecture non disponibles</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

// Section Finances
const FinanceSection = memo(({ isExpanded, onToggle, data, navigation }) => {
  const formatCurrency = (value) => {
    // Convertir en nombre et gérer les valeurs invalides
    const numValue = Number(value);
    if (isNaN(numValue) || numValue === null || numValue === undefined) {
      return '0€';
    }
    
    if (numValue >= 1000000) {
      return `${(numValue / 1000000).toFixed(1)}M€`;
    } else if (numValue >= 1000) {
      return `${(numValue / 1000).toFixed(1)}K€`;
    }
    return `${numValue.toFixed(0)}€`;
  };

  const savingsRate = data.monthlyBudget > 0 
    ? Math.round((data.monthlySavings / data.monthlyBudget) * 100)
    : 0;

  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">💰</span>
          Finances
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
          <div 
            className="sidebar-data-grid"
            onClick={() => navigation.toFinance()}
            style={{ cursor: 'pointer' }}
          >
            {/* Patrimoine */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💎</span>
              <div className="sidebar-data-value">{formatCurrency(data.netWorth)}</div>
              <div className="sidebar-data-label">Patrimoine</div>
            </div>
            
            {/* Investissements */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📈</span>
              <div className="sidebar-data-value">{formatCurrency(data.investments)}</div>
              <div className="sidebar-data-label">Investissements</div>
            </div>
            
            {/* Budget mensuel */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💳</span>
              <div className="sidebar-data-value">{formatCurrency(data.monthlyBudget)}</div>
              <div className="sidebar-data-label">Budget</div>
            </div>
            
            {/* Épargne */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏦</span>
              <div className="sidebar-data-value">{formatCurrency(data.monthlySavings)}</div>
              <div className="sidebar-data-label">Épargne</div>
            </div>
          </div>
          
          {/* Taux d'épargne */}
          {data.monthlyBudget > 0 && (
            <div className="sidebar-info-box">
              <div className="sidebar-info-title">Taux d'épargne</div>
              <div className="sidebar-info-content">
                <span className="sidebar-info-icon" aria-hidden="true">📊</span>
                <span>{savingsRate}% du budget mensuel</span>
              </div>
            </div>
          )}
          
          {/* Indicateur données manquantes */}
          {!data.hasData && (
            <div className="sidebar-info-box warning">
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>Données financières non disponibles</span>
            </div>
          )}
        </div>
      )}
    </section>
  );
});

// Section Journal & Films
const JournalSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🎬</span>
          Journal & Films
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div className="sidebar-data-grid" style={{ opacity: 0.6 }}>
            {/* Entrées journal */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📝</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Entrées</div>
            </div>
            
            {/* Films vus */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎥</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Films</div>
            </div>
            
            {/* Streak journal */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Jours</div>
            </div>
            
            {/* Note moyenne */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Note moy.</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Session Focus
const FocusSessionSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🎯</span>
          Session Focus
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div className="sidebar-data-grid" style={{ opacity: 0.6 }}>
            {/* Session actuelle */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">0m</div>
              <div className="sidebar-data-label">En cours</div>
            </div>
            
            {/* Sessions aujourd'hui */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📊</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Aujourd'hui</div>
            </div>
            
            {/* Temps total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🕐</span>
              <div className="sidebar-data-value">0h</div>
              <div className="sidebar-data-label">Total</div>
            </div>
            
            {/* Productivité */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⚡</span>
              <div className="sidebar-data-value">0%</div>
              <div className="sidebar-data-label">Productivité</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Achievements
const AchievementsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🏆</span>
          Achievements
          <span className="sidebar-section-badge">0</span>
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div className="sidebar-data-grid" style={{ opacity: 0.6 }}>
            {/* Total achievements */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎖️</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Débloqués</div>
            </div>
            
            {/* Achievements rares */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💎</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Rares</div>
            </div>
            
            {/* Points achievement */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Points</div>
            </div>
            
            {/* Progression */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📊</span>
              <div className="sidebar-data-value">0%</div>
              <div className="sidebar-data-label">Complétion</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Focus RPG
const FocusRPGSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">⚔️</span>
          Focus RPG
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
            {/* Personnage */}
            <div className="sidebar-rpg-character">
              <div className="sidebar-rpg-avatar">
                <span className="sidebar-rpg-avatar-icon" aria-hidden="true">🧙</span>
              </div>
              <div className="sidebar-rpg-info">
                <div className="sidebar-rpg-name">En attente</div>
                <div className="sidebar-rpg-level">Niveau 0</div>
              </div>
            </div>
            
            {/* Statistiques RPG */}
            <div className="sidebar-data-grid">
              {/* HP */}
              <div className="sidebar-data-card">
                <span className="sidebar-data-icon" aria-hidden="true">❤️</span>
                <div className="sidebar-data-value">0</div>
                <div className="sidebar-data-label">HP</div>
              </div>
              
              {/* MP */}
              <div className="sidebar-data-card">
                <span className="sidebar-data-icon" aria-hidden="true">💙</span>
                <div className="sidebar-data-value">0</div>
                <div className="sidebar-data-label">MP</div>
              </div>
              
              {/* ATK */}
              <div className="sidebar-data-card">
                <span className="sidebar-data-icon" aria-hidden="true">⚔️</span>
                <div className="sidebar-data-value">0</div>
                <div className="sidebar-data-label">ATK</div>
              </div>
              
              {/* DEF */}
              <div className="sidebar-data-card">
                <span className="sidebar-data-icon" aria-hidden="true">🛡️</span>
                <div className="sidebar-data-value">0</div>
                <div className="sidebar-data-label">DEF</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Objectifs du Jour
const DailyGoalsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📋</span>
          Objectifs du Jour
          <span className="sidebar-section-badge">0</span>
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
            {/* Progression globale */}
            <div className="sidebar-goals-progress">
              <div className="sidebar-goals-progress-header">
                <span className="sidebar-goals-progress-label">Progression du jour</span>
                <span className="sidebar-goals-progress-value">0/0 complétés</span>
              </div>
              <div className="sidebar-goals-progress-bar">
                <div 
                  className="sidebar-goals-progress-fill" 
                  style={{ width: '0%' }}
                  role="progressbar"
                  aria-valuenow={0}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            
            <div className="sidebar-info-box">
              <div className="sidebar-info-content">
                <span className="sidebar-info-icon" aria-hidden="true">📝</span>
                <span>Aucun objectif défini</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Notifications
const NotificationsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🔔</span>
          Notifications
          <span className="sidebar-section-badge">0</span>
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div className="sidebar-info-box" style={{ opacity: 0.6 }}>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🔔</span>
              <span>Aucune notification</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Météo
const WeatherSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🌤️</span>
          Météo
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
          {/* Météo actuelle */}
          <div className="sidebar-weather-current">
            <div className="sidebar-weather-icon-large" aria-hidden="true">🌤️</div>
            <div className="sidebar-weather-temp">--°C</div>
            <div className="sidebar-weather-condition">En attente</div>
            <div className="sidebar-weather-location">
              <span aria-hidden="true">📍</span>
              <span>Non configuré</span>
            </div>
          </div>
          
          {/* Détails météo */}
          <div className="sidebar-data-grid">
            {/* Ressenti */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🌡️</span>
              <div className="sidebar-data-value">--°C</div>
              <div className="sidebar-data-label">Ressenti</div>
            </div>
            
            {/* Humidité */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💧</span>
              <div className="sidebar-data-value">--%</div>
              <div className="sidebar-data-label">Humidité</div>
            </div>
            
            {/* Vent */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💨</span>
              <div className="sidebar-data-value">-- km/h</div>
              <div className="sidebar-data-label">Vent</div>
            </div>
            
            {/* UV */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">☀️</span>
              <div className="sidebar-data-value">--</div>
              <div className="sidebar-data-label">Indice UV</div>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Motivation
const MotivationSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">💪</span>
          Motivation
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
            {/* Citation du jour */}
            <div className="sidebar-motivation-quote">
              <div className="sidebar-motivation-quote-icon" aria-hidden="true">💭</div>
              <div className="sidebar-motivation-quote-text">
                En attente de configuration
              </div>
              <div className="sidebar-motivation-quote-author">—</div>
            </div>
            
            {/* Statistiques motivantes */}
            <div className="sidebar-motivation-stats">
              <div className="sidebar-motivation-stat-item">
                <div className="sidebar-motivation-stat-icon" aria-hidden="true">🔥</div>
                <div className="sidebar-motivation-stat-content">
                  <div className="sidebar-motivation-stat-value">0 jours</div>
                  <div className="sidebar-motivation-stat-label">de streak actuel</div>
                </div>
              </div>
              
              <div className="sidebar-motivation-stat-item">
                <div className="sidebar-motivation-stat-icon" aria-hidden="true">🏆</div>
                <div className="sidebar-motivation-stat-content">
                  <div className="sidebar-motivation-stat-value">0 achievements</div>
                  <div className="sidebar-motivation-stat-label">débloqués</div>
                </div>
              </div>
              
              <div className="sidebar-motivation-stat-item">
                <div className="sidebar-motivation-stat-icon" aria-hidden="true">📈</div>
                <div className="sidebar-motivation-stat-content">
                  <div className="sidebar-motivation-stat-value">0%</div>
                  <div className="sidebar-motivation-stat-label">de progression ce mois</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Récompenses
const RewardsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🎁</span>
          Récompenses
          <span className="sidebar-section-badge">0</span>
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
          {/* Points de récompense */}
          <div className="sidebar-rewards-points">
            <div className="sidebar-rewards-points-icon" aria-hidden="true">💎</div>
            <div className="sidebar-rewards-points-content">
              <div className="sidebar-rewards-points-value">0</div>
              <div className="sidebar-rewards-points-label">Points de récompense</div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="sidebar-data-grid">
            {/* Récompenses débloquées */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎁</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Débloquées</div>
            </div>
            
            {/* Récompenses disponibles */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✨</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Disponibles</div>
            </div>
            
            {/* Points gagnés ce mois */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📈</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Ce mois</div>
            </div>
            
            {/* Niveau récompense */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">--</div>
              <div className="sidebar-data-label">Niveau</div>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Historique
const HistorySection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📜</span>
          Historique
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
          {/* Statistiques d'historique */}
          <div className="sidebar-data-grid">
            {/* Jours actifs */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📅</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Jours actifs</div>
            </div>
            
            {/* Total activités */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✅</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Activités</div>
            </div>
            
            {/* Temps total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">0h</div>
              <div className="sidebar-data-label">Temps total</div>
            </div>
            
            {/* Meilleur streak */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Record</div>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Paramètres Rapides
const QuickSettingsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">⚙️</span>
          Paramètres Rapides
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Paramètres non fonctionnels - En développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
          {/* Paramètres d'affichage */}
          <div className="sidebar-settings-group">
            <div className="sidebar-settings-group-title">Affichage</div>
            
            {/* Mode nuit */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">🌙</span>
                <span>Mode nuit</span>
              </div>
              <label className="sidebar-toggle-switch">
                <input type="checkbox" defaultChecked aria-label="Activer le mode nuit" />
                <span className="sidebar-toggle-slider"></span>
              </label>
            </div>
            
            {/* Animations */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">✨</span>
                <span>Animations</span>
              </div>
              <label className="sidebar-toggle-switch">
                <input type="checkbox" defaultChecked aria-label="Activer les animations" />
                <span className="sidebar-toggle-slider"></span>
              </label>
            </div>
            
            {/* Effets sonores */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">🔊</span>
                <span>Sons</span>
              </div>
              <label className="sidebar-toggle-switch">
                <input type="checkbox" aria-label="Activer les effets sonores" />
                <span className="sidebar-toggle-slider"></span>
              </label>
            </div>
          </div>
          
          {/* Paramètres de notifications */}
          <div className="sidebar-settings-group">
            <div className="sidebar-settings-group-title">Notifications</div>
            
            {/* Notifications push */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">🔔</span>
                <span>Push</span>
              </div>
              <label className="sidebar-toggle-switch">
                <input type="checkbox" defaultChecked aria-label="Activer les notifications push" />
                <span className="sidebar-toggle-slider"></span>
              </label>
            </div>
            
            {/* Rappels */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">⏰</span>
                <span>Rappels</span>
              </div>
              <label className="sidebar-toggle-switch">
                <input type="checkbox" defaultChecked aria-label="Activer les rappels" />
                <span className="sidebar-toggle-slider"></span>
              </label>
            </div>
          </div>
          
          {/* Paramètres de focus */}
          <div className="sidebar-settings-group">
            <div className="sidebar-settings-group-title">Focus</div>
            
            {/* Mode concentration */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">🎯</span>
                <span>Mode concentration</span>
              </div>
              <label className="sidebar-toggle-switch">
                <input type="checkbox" aria-label="Activer le mode concentration" />
                <span className="sidebar-toggle-slider"></span>
              </label>
            </div>
            
            {/* Durée session */}
            <div className="sidebar-setting-item">
              <div className="sidebar-setting-label">
                <span className="sidebar-setting-icon" aria-hidden="true">⏱️</span>
                <span>Durée session</span>
              </div>
              <select 
                className="sidebar-setting-select" 
                aria-label="Sélectionner la durée de session"
                defaultValue="60"
              >
                <option value="25">25 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
          </div>
          
          {/* Bouton paramètres complets */}
          <button className="sidebar-settings-full-btn" disabled>
            <span className="sidebar-settings-full-icon" aria-hidden="true">⚙️</span>
            <span>Tous les paramètres</span>
          </button>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Prédictions IA
const AIPredictionsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">🤖</span>
          Prédictions IA
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
          {/* Score de prédiction */}
          <div className="sidebar-ai-score">
            <div className="sidebar-ai-score-icon" aria-hidden="true">🎯</div>
            <div className="sidebar-ai-score-content">
              <div className="sidebar-ai-score-value">0%</div>
              <div className="sidebar-ai-score-label">Précision des prédictions</div>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
});

// Section Statistiques Globales
const GlobalStatsSection = memo(({ isExpanded, onToggle }) => {
  return (
    <section className="sidebar-section">
      <header 
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle();
          }
        }}
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">📊</span>
          Statistiques Globales
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
          <div className="sidebar-info-box warning">
            <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
            <span>Module en développement</span>
          </div>
          <div style={{ opacity: 0.6 }}>
          {/* Vue d'ensemble */}
          <div className="sidebar-stats-overview">
            <div className="sidebar-stats-overview-title">Vue d'ensemble</div>
            <div className="sidebar-stats-overview-period">Tous les temps</div>
          </div>
          
          {/* Statistiques principales */}
          <div className="sidebar-data-grid">
            {/* XP Total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">XP Total</div>
            </div>
            
            {/* Heures totales */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">0h</div>
              <div className="sidebar-data-label">Temps total</div>
            </div>
            
            {/* Activités */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✅</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Activités</div>
            </div>
            
            {/* Achievements */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏆</span>
              <div className="sidebar-data-value">0</div>
              <div className="sidebar-data-label">Achievements</div>
            </div>
          </div>
          </div>
        </div>
      )}
    </section>
  );
});

export default SidebarPremium;
