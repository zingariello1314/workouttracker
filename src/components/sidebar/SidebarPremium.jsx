import React from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import '../../styles/sidebar-premium.css';

/**
 * Composant principal de la Sidebar Premium QuietQuest
 * Affiche toutes les informations vitales et actions rapides de l'utilisateur
 */
const SidebarPremium = () => {
  const {
    currentTime,
    expandedSections,
    systemStatus,
    isMobileOpen,
    toggleSection,
    isSectionExpanded,
    getFormattedTime,
    getFormattedDate,
  } = useSidebar();

  const sidebarRef = React.useRef(null);

  // Calculer dynamiquement la hauteur du header pour positionner la sidebar
  React.useEffect(() => {
    const updateSidebarPosition = () => {
      if (!sidebarRef.current) return;

      // Chercher le header et la navigation dans le DOM
      const header = document.querySelector('header');
      const navigation = document.querySelector('nav');
      
      let totalHeaderHeight = 0;
      
      if (header) {
        totalHeaderHeight += header.offsetHeight;
      }
      
      if (navigation) {
        totalHeaderHeight += navigation.offsetHeight;
      }

      // Appliquer la position calculée
      if (totalHeaderHeight > 0) {
        sidebarRef.current.style.top = `${totalHeaderHeight}px`;
        sidebarRef.current.style.height = `calc(100vh - ${totalHeaderHeight}px)`;
      } else {
        // Pas de header, la sidebar commence en haut
        sidebarRef.current.style.top = '0';
        sidebarRef.current.style.height = '100vh';
      }
    };

    // Mettre à jour au montage
    updateSidebarPosition();

    // Mettre à jour lors du redimensionnement
    window.addEventListener('resize', updateSidebarPosition);
    
    // Observer les changements dans le DOM (pour les sous-navigations qui apparaissent)
    const observer = new MutationObserver(updateSidebarPosition);
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    return () => {
      window.removeEventListener('resize', updateSidebarPosition);
      observer.disconnect();
    };
  }, []);

  return (
    <aside 
      ref={sidebarRef}
      className={`sidebar-premium ${isMobileOpen ? 'mobile-open' : ''}`}
      role="complementary"
      aria-label="Sidebar Premium QuietQuest"
    >
      {/* Zone Fixe - Horloge et Profil */}
      <div className="sidebar-clock-section">
        {/* Horloge */}
        <div className="sidebar-time-display" role="timer" aria-live="off">
          {getFormattedTime()}
        </div>
        
        {/* Date */}
        <div className="sidebar-date-display">
          {getFormattedDate('fr')}
        </div>
        
        {/* Carte Développeur 3D */}
        <div 
          className="sidebar-profile-card"
          onMouseMove={(e) => {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
          }}
          onMouseLeave={(e) => {
            const card = e.currentTarget;
            card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
          }}
        >
          <img 
            src="/logo.png" 
            alt="Avatar utilisateur" 
            className="sidebar-profile-avatar"
          />
          <div className="sidebar-profile-name">QuietQuest</div>
          <div className="sidebar-profile-title">Développeur Premium</div>
        </div>
        
        {/* Statuts Système (Grille 2x2) */}
        <div className="sidebar-system-status">
          {/* Statut Actif */}
          <div className="sidebar-status-item">
            <div className="sidebar-status-pulse" aria-label="Système actif"></div>
            <div className="sidebar-status-label">Système</div>
            <div className="sidebar-status-value">Actif</div>
          </div>
          
          {/* Mode Nuit */}
          <div className="sidebar-status-item">
            <div className="sidebar-status-icon" aria-hidden="true">
              {systemStatus.nightMode ? '🌙' : '☀️'}
            </div>
            <div className="sidebar-status-label">Mode</div>
            <div className="sidebar-status-value">
              {systemStatus.nightMode ? 'Nuit' : 'Jour'}
            </div>
          </div>
          
          {/* Connexion */}
          <div className="sidebar-status-item">
            <div className="sidebar-status-icon" aria-hidden="true">📡</div>
            <div className="sidebar-status-label">Connexion</div>
            <div className="sidebar-status-value">
              {systemStatus.connected ? 'En ligne' : 'Hors ligne'}
            </div>
          </div>
          
          {/* Focus */}
          <div className="sidebar-status-item">
            <div className="sidebar-status-icon" aria-hidden="true">🔋</div>
            <div className="sidebar-status-label">Focus</div>
            <div className="sidebar-status-value">
              {systemStatus.focusPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Zone Scrollable - Sections */}
      <div className="sidebar-content">
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
              <div className="sidebar-actions-grid">
                <button className="sidebar-action-button" aria-label="Démarrer une session focus">
                  <span className="sidebar-action-icon" aria-hidden="true">🎯</span>
                  <span className="sidebar-action-label">Focus</span>
                </button>
                
                <button className="sidebar-action-button" aria-label="Commencer une session de lecture">
                  <span className="sidebar-action-icon" aria-hidden="true">📚</span>
                  <span className="sidebar-action-label">Lire</span>
                </button>
                
                <button className="sidebar-action-button" aria-label="Démarrer une session sport">
                  <span className="sidebar-action-icon" aria-hidden="true">💪</span>
                  <span className="sidebar-action-label">Sport</span>
                </button>
                
                <button className="sidebar-action-button" aria-label="Voir les quêtes">
                  <span className="sidebar-action-icon" aria-hidden="true">🏆</span>
                  <span className="sidebar-action-label">Quêtes</span>
                </button>
              </div>
              
              {/* Ligne de 4 boutons secondaires */}
              <div className="sidebar-actions-secondary">
                <button className="sidebar-action-button-small" aria-label="Gérer les revenus">
                  <span className="sidebar-action-icon" aria-hidden="true">💰</span>
                  <span className="sidebar-action-label">Revenus</span>
                </button>
                
                <button className="sidebar-action-button-small" aria-label="Ajouter un film">
                  <span className="sidebar-action-icon" aria-hidden="true">🎬</span>
                  <span className="sidebar-action-label">Film</span>
                </button>
                
                <button className="sidebar-action-button-small" aria-label="Écrire dans le journal">
                  <span className="sidebar-action-icon" aria-hidden="true">📝</span>
                  <span className="sidebar-action-label">Journal</span>
                </button>
                
                <button className="sidebar-action-button-small" aria-label="Méditer">
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
              <div className="sidebar-metrics-grid">
                {/* XP */}
                <div className="sidebar-metric-card xp">
                  <span className="sidebar-metric-icon" aria-hidden="true">⭐</span>
                  <div className="sidebar-metric-value">12,450</div>
                  <div className="sidebar-metric-label">XP Total</div>
                </div>
                
                {/* Niveau */}
                <div className="sidebar-metric-card level">
                  <span className="sidebar-metric-icon" aria-hidden="true">🎖️</span>
                  <div className="sidebar-metric-value">42</div>
                  <div className="sidebar-metric-label">Niveau</div>
                </div>
                
                {/* Streak */}
                <div className="sidebar-metric-card streak">
                  <span className="sidebar-metric-icon" aria-hidden="true">🔥</span>
                  <div className="sidebar-metric-value">28</div>
                  <div className="sidebar-metric-label">Jours</div>
                </div>
                
                {/* Focus */}
                <div className="sidebar-metric-card focus">
                  <span className="sidebar-metric-icon" aria-hidden="true">⚡</span>
                  <div className="sidebar-metric-value">87%</div>
                  <div className="sidebar-metric-label">Focus</div>
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
              <span className="sidebar-section-badge">3</span>
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
              {/* Quête 1 */}
              <div className="sidebar-quest-item">
                <div className="sidebar-quest-header">
                  <span className="sidebar-quest-icon" aria-hidden="true">📚</span>
                  <div className="sidebar-quest-title">Lire 30 minutes</div>
                  <div className="sidebar-quest-percentage">75%</div>
                </div>
                <div className="sidebar-quest-progress">
                  <div 
                    className="sidebar-quest-progress-bar" 
                    style={{ width: '75%' }}
                    role="progressbar"
                    aria-valuenow={75}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
              
              {/* Quête 2 */}
              <div className="sidebar-quest-item">
                <div className="sidebar-quest-header">
                  <span className="sidebar-quest-icon" aria-hidden="true">💪</span>
                  <div className="sidebar-quest-title">Entraînement quotidien</div>
                  <div className="sidebar-quest-percentage">100%</div>
                </div>
                <div className="sidebar-quest-progress">
                  <div 
                    className="sidebar-quest-progress-bar" 
                    style={{ width: '100%' }}
                    role="progressbar"
                    aria-valuenow={100}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
              
              {/* Quête 3 */}
              <div className="sidebar-quest-item">
                <div className="sidebar-quest-header">
                  <span className="sidebar-quest-icon" aria-hidden="true">🎯</span>
                  <div className="sidebar-quest-title">Session focus 2h</div>
                  <div className="sidebar-quest-percentage">45%</div>
                </div>
                <div className="sidebar-quest-progress">
                  <div 
                    className="sidebar-quest-progress-bar" 
                    style={{ width: '45%' }}
                    role="progressbar"
                    aria-valuenow={45}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Section Sport & Santé */}
        <SportSection 
          isExpanded={isSectionExpanded('sport')}
          onToggle={() => toggleSection('sport')}
        />

        {/* Section Apprentissage */}
        <LearningSection 
          isExpanded={isSectionExpanded('learning')}
          onToggle={() => toggleSection('learning')}
        />

        {/* Section Livres */}
        <BooksSection 
          isExpanded={isSectionExpanded('books')}
          onToggle={() => toggleSection('books')}
        />

        {/* Section Finances */}
        <FinanceSection 
          isExpanded={isSectionExpanded('finance')}
          onToggle={() => toggleSection('finance')}
        />

        {/* Section Journal & Films */}
        <JournalSection 
          isExpanded={isSectionExpanded('journal')}
          onToggle={() => toggleSection('journal')}
        />

        {/* Section Session Focus */}
        <FocusSessionSection 
          isExpanded={isSectionExpanded('focusSession')}
          onToggle={() => toggleSection('focusSession')}
        />

        {/* Section Achievements */}
        <AchievementsSection 
          isExpanded={isSectionExpanded('achievements')}
          onToggle={() => toggleSection('achievements')}
        />

        {/* Section Focus RPG */}
        <FocusRPGSection 
          isExpanded={isSectionExpanded('focusRPG')}
          onToggle={() => toggleSection('focusRPG')}
        />

        {/* Section Objectifs du Jour */}
        <DailyGoalsSection 
          isExpanded={isSectionExpanded('dailyGoals')}
          onToggle={() => toggleSection('dailyGoals')}
        />

        {/* Section Notifications */}
        <NotificationsSection 
          isExpanded={isSectionExpanded('notifications')}
          onToggle={() => toggleSection('notifications')}
        />

        {/* Section Météo */}
        <WeatherSection 
          isExpanded={isSectionExpanded('weather')}
          onToggle={() => toggleSection('weather')}
        />

        {/* Section Motivation */}
        <MotivationSection 
          isExpanded={isSectionExpanded('motivation')}
          onToggle={() => toggleSection('motivation')}
        />

        {/* Section Récompenses */}
        <RewardsSection 
          isExpanded={isSectionExpanded('rewards')}
          onToggle={() => toggleSection('rewards')}
        />

        {/* Section Historique */}
        <HistorySection 
          isExpanded={isSectionExpanded('history')}
          onToggle={() => toggleSection('history')}
        />

        {/* Section Paramètres Rapides */}
        <QuickSettingsSection 
          isExpanded={isSectionExpanded('quickSettings')}
          onToggle={() => toggleSection('quickSettings')}
        />

        {/* Section Prédictions IA */}
        <AIPredictionsSection 
          isExpanded={isSectionExpanded('aiPredictions')}
          onToggle={() => toggleSection('aiPredictions')}
        />

        {/* Section Statistiques Globales */}
        <GlobalStatsSection 
          isExpanded={isSectionExpanded('globalStats')}
          onToggle={() => toggleSection('globalStats')}
        />
      </div>
    </aside>
  );
};

// Section Sport & Santé
const SportSection = ({ isExpanded, onToggle }) => {
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
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏋️</span>
              <div className="sidebar-data-value">5</div>
              <div className="sidebar-data-label">Entraînements</div>
            </div>
            
            {/* Calories brûlées */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">2,450</div>
              <div className="sidebar-data-label">Calories</div>
            </div>
            
            {/* Pas aujourd'hui */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">👟</span>
              <div className="sidebar-data-value">8,234</div>
              <div className="sidebar-data-label">Pas</div>
            </div>
            
            {/* Fréquence cardiaque */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">❤️</span>
              <div className="sidebar-data-value">72</div>
              <div className="sidebar-data-label">BPM</div>
            </div>
          </div>
          
          {/* Prochain entraînement */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Prochain entraînement</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🎯</span>
              <span>Jambes - Demain 18h00</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Apprentissage
const LearningSection = ({ isExpanded, onToggle }) => {
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
          <div className="sidebar-data-grid">
            {/* Matières actives */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📚</span>
              <div className="sidebar-data-value">3</div>
              <div className="sidebar-data-label">Matières</div>
            </div>
            
            {/* Sessions cette semaine */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">12</div>
              <div className="sidebar-data-label">Sessions</div>
            </div>
            
            {/* Temps total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🕐</span>
              <div className="sidebar-data-value">8.5h</div>
              <div className="sidebar-data-label">Temps</div>
            </div>
            
            {/* Niveau global */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏆</span>
              <div className="sidebar-data-value">15</div>
              <div className="sidebar-data-label">Niveau</div>
            </div>
          </div>
          
          {/* Prochaine session */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Session en cours</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">📖</span>
              <span>Mathématiques - 45 min</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Livres
const BooksSection = ({ isExpanded, onToggle }) => {
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
          <div className="sidebar-data-grid">
            {/* Livres en cours */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📚</span>
              <div className="sidebar-data-value">2</div>
              <div className="sidebar-data-label">En cours</div>
            </div>
            
            {/* Livres terminés */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✅</span>
              <div className="sidebar-data-value">24</div>
              <div className="sidebar-data-label">Terminés</div>
            </div>
            
            {/* Pages lues aujourd'hui */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📄</span>
              <div className="sidebar-data-value">45</div>
              <div className="sidebar-data-label">Pages</div>
            </div>
            
            {/* Temps de lecture */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏰</span>
              <div className="sidebar-data-value">1.5h</div>
              <div className="sidebar-data-label">Lecture</div>
            </div>
          </div>
          
          {/* Livre actuel */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Livre actuel</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">📕</span>
              <span>Atomic Habits - 67%</span>
            </div>
            <div className="sidebar-progress-mini">
              <div 
                className="sidebar-progress-mini-bar" 
                style={{ width: '67%' }}
                role="progressbar"
                aria-valuenow={67}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Finances
const FinanceSection = ({ isExpanded, onToggle }) => {
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
          <div className="sidebar-data-grid">
            {/* Patrimoine */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💎</span>
              <div className="sidebar-data-value">45.2K</div>
              <div className="sidebar-data-label">Patrimoine</div>
            </div>
            
            {/* Performance */}
            <div className="sidebar-data-card positive">
              <span className="sidebar-data-icon" aria-hidden="true">📈</span>
              <div className="sidebar-data-value">+12.5%</div>
              <div className="sidebar-data-label">Performance</div>
            </div>
            
            {/* Budget mensuel */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💳</span>
              <div className="sidebar-data-value">2,450€</div>
              <div className="sidebar-data-label">Budget</div>
            </div>
            
            {/* Épargne */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏦</span>
              <div className="sidebar-data-value">850€</div>
              <div className="sidebar-data-label">Épargne</div>
            </div>
          </div>
          
          {/* Alerte budget */}
          <div className="sidebar-info-box warning">
            <div className="sidebar-info-title">Alerte Budget</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">⚠️</span>
              <span>85% du budget utilisé</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Journal & Films
const JournalSection = ({ isExpanded, onToggle }) => {
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
          <div className="sidebar-data-grid">
            {/* Entrées journal */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📝</span>
              <div className="sidebar-data-value">156</div>
              <div className="sidebar-data-label">Entrées</div>
            </div>
            
            {/* Films vus */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎥</span>
              <div className="sidebar-data-value">42</div>
              <div className="sidebar-data-label">Films</div>
            </div>
            
            {/* Streak journal */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">14</div>
              <div className="sidebar-data-label">Jours</div>
            </div>
            
            {/* Note moyenne */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">4.2</div>
              <div className="sidebar-data-label">Note moy.</div>
            </div>
          </div>
          
          {/* Dernier film */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Dernier film</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🎬</span>
              <span>Inception - ⭐ 5/5</span>
            </div>
          </div>
          
          {/* Rappel journal */}
          <div className="sidebar-info-box reminder">
            <div className="sidebar-info-title">Rappel</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">✍️</span>
              <span>Écrire dans le journal</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Session Focus
const FocusSessionSection = ({ isExpanded, onToggle }) => {
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
          <div className="sidebar-data-grid">
            {/* Session actuelle */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">45m</div>
              <div className="sidebar-data-label">En cours</div>
            </div>
            
            {/* Sessions aujourd'hui */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📊</span>
              <div className="sidebar-data-value">3</div>
              <div className="sidebar-data-label">Aujourd'hui</div>
            </div>
            
            {/* Temps total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🕐</span>
              <div className="sidebar-data-value">2.5h</div>
              <div className="sidebar-data-label">Total</div>
            </div>
            
            {/* Productivité */}
            <div className="sidebar-data-card positive">
              <span className="sidebar-data-icon" aria-hidden="true">⚡</span>
              <div className="sidebar-data-value">92%</div>
              <div className="sidebar-data-label">Productivité</div>
            </div>
          </div>
          
          {/* Session en cours */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Session en cours</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">💻</span>
              <span>Développement - 45/60 min</span>
            </div>
            <div className="sidebar-progress-mini">
              <div 
                className="sidebar-progress-mini-bar" 
                style={{ width: '75%' }}
                role="progressbar"
                aria-valuenow={75}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
          
          {/* Statistiques de la semaine */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Cette semaine</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">📈</span>
              <span>18 sessions - 12.5h total</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Achievements
const AchievementsSection = ({ isExpanded, onToggle }) => {
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
          <span className="sidebar-section-badge">2</span>
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
            {/* Total achievements */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎖️</span>
              <div className="sidebar-data-value">47</div>
              <div className="sidebar-data-label">Débloqués</div>
            </div>
            
            {/* Achievements rares */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💎</span>
              <div className="sidebar-data-value">8</div>
              <div className="sidebar-data-label">Rares</div>
            </div>
            
            {/* Points achievement */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">2,450</div>
              <div className="sidebar-data-label">Points</div>
            </div>
            
            {/* Progression */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📊</span>
              <div className="sidebar-data-value">68%</div>
              <div className="sidebar-data-label">Complétion</div>
            </div>
          </div>
          
          {/* Achievements récents */}
          <div className="sidebar-achievement-list">
            <div className="sidebar-achievement-item">
              <span className="sidebar-achievement-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-achievement-info">
                <div className="sidebar-achievement-name">Streak Master</div>
                <div className="sidebar-achievement-desc">30 jours consécutifs</div>
              </div>
            </div>
            
            <div className="sidebar-achievement-item">
              <span className="sidebar-achievement-icon" aria-hidden="true">📚</span>
              <div className="sidebar-achievement-info">
                <div className="sidebar-achievement-name">Bookworm</div>
                <div className="sidebar-achievement-desc">25 livres terminés</div>
              </div>
            </div>
          </div>
          
          {/* Prochain achievement */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Prochain objectif</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🎯</span>
              <span>Focus Legend - 100h focus</span>
            </div>
            <div className="sidebar-progress-mini">
              <div 
                className="sidebar-progress-mini-bar" 
                style={{ width: '87%' }}
                role="progressbar"
                aria-valuenow={87}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Focus RPG
const FocusRPGSection = ({ isExpanded, onToggle }) => {
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
          {/* Personnage */}
          <div className="sidebar-rpg-character">
            <div className="sidebar-rpg-avatar">
              <span className="sidebar-rpg-avatar-icon" aria-hidden="true">🧙</span>
            </div>
            <div className="sidebar-rpg-info">
              <div className="sidebar-rpg-name">Focus Mage</div>
              <div className="sidebar-rpg-level">Niveau 42</div>
            </div>
          </div>
          
          {/* Statistiques RPG */}
          <div className="sidebar-data-grid">
            {/* HP */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">❤️</span>
              <div className="sidebar-data-value">850</div>
              <div className="sidebar-data-label">HP</div>
            </div>
            
            {/* MP */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💙</span>
              <div className="sidebar-data-value">620</div>
              <div className="sidebar-data-label">MP</div>
            </div>
            
            {/* ATK */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⚔️</span>
              <div className="sidebar-data-value">145</div>
              <div className="sidebar-data-label">ATK</div>
            </div>
            
            {/* DEF */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🛡️</span>
              <div className="sidebar-data-value">98</div>
              <div className="sidebar-data-label">DEF</div>
            </div>
          </div>
          
          {/* Barres de progression */}
          <div className="sidebar-rpg-bars">
            <div className="sidebar-rpg-bar-container">
              <div className="sidebar-rpg-bar-label">
                <span>XP</span>
                <span>12,450 / 15,000</span>
              </div>
              <div className="sidebar-rpg-bar xp">
                <div 
                  className="sidebar-rpg-bar-fill" 
                  style={{ width: '83%' }}
                  role="progressbar"
                  aria-valuenow={83}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            
            <div className="sidebar-rpg-bar-container">
              <div className="sidebar-rpg-bar-label">
                <span>Énergie</span>
                <span>87%</span>
              </div>
              <div className="sidebar-rpg-bar energy">
                <div 
                  className="sidebar-rpg-bar-fill" 
                  style={{ width: '87%' }}
                  role="progressbar"
                  aria-valuenow={87}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Équipement actif */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Équipement actif</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">⚔️</span>
              <span>Épée du Focus Éternel +5</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Objectifs du Jour
const DailyGoalsSection = ({ isExpanded, onToggle }) => {
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
          <span className="sidebar-section-badge">5</span>
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
          {/* Progression globale */}
          <div className="sidebar-goals-progress">
            <div className="sidebar-goals-progress-header">
              <span className="sidebar-goals-progress-label">Progression du jour</span>
              <span className="sidebar-goals-progress-value">3/5 complétés</span>
            </div>
            <div className="sidebar-goals-progress-bar">
              <div 
                className="sidebar-goals-progress-fill" 
                style={{ width: '60%' }}
                role="progressbar"
                aria-valuenow={60}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
          </div>
          
          {/* Liste des objectifs */}
          <div className="sidebar-goals-list">
            {/* Objectif 1 - Complété */}
            <div className="sidebar-goal-item completed">
              <input 
                type="checkbox" 
                className="sidebar-goal-checkbox" 
                checked 
                readOnly
                aria-label="Session focus 1h - Complété"
              />
              <div className="sidebar-goal-content">
                <div className="sidebar-goal-title">Session focus 1h</div>
                <div className="sidebar-goal-category">
                  <span className="sidebar-goal-icon" aria-hidden="true">🎯</span>
                  <span>Focus</span>
                </div>
              </div>
            </div>
            
            {/* Objectif 2 - Complété */}
            <div className="sidebar-goal-item completed">
              <input 
                type="checkbox" 
                className="sidebar-goal-checkbox" 
                checked 
                readOnly
                aria-label="Lire 30 pages - Complété"
              />
              <div className="sidebar-goal-content">
                <div className="sidebar-goal-title">Lire 30 pages</div>
                <div className="sidebar-goal-category">
                  <span className="sidebar-goal-icon" aria-hidden="true">📚</span>
                  <span>Lecture</span>
                </div>
              </div>
            </div>
            
            {/* Objectif 3 - Complété */}
            <div className="sidebar-goal-item completed">
              <input 
                type="checkbox" 
                className="sidebar-goal-checkbox" 
                checked 
                readOnly
                aria-label="Entraînement sport - Complété"
              />
              <div className="sidebar-goal-content">
                <div className="sidebar-goal-title">Entraînement sport</div>
                <div className="sidebar-goal-category">
                  <span className="sidebar-goal-icon" aria-hidden="true">💪</span>
                  <span>Sport</span>
                </div>
              </div>
            </div>
            
            {/* Objectif 4 - En cours */}
            <div className="sidebar-goal-item">
              <input 
                type="checkbox" 
                className="sidebar-goal-checkbox" 
                readOnly
                aria-label="Apprendre 1h - En cours"
              />
              <div className="sidebar-goal-content">
                <div className="sidebar-goal-title">Apprendre 1h</div>
                <div className="sidebar-goal-category">
                  <span className="sidebar-goal-icon" aria-hidden="true">🎓</span>
                  <span>Apprentissage</span>
                </div>
              </div>
            </div>
            
            {/* Objectif 5 - En cours */}
            <div className="sidebar-goal-item">
              <input 
                type="checkbox" 
                className="sidebar-goal-checkbox" 
                readOnly
                aria-label="Journal quotidien - En cours"
              />
              <div className="sidebar-goal-content">
                <div className="sidebar-goal-title">Journal quotidien</div>
                <div className="sidebar-goal-category">
                  <span className="sidebar-goal-icon" aria-hidden="true">📝</span>
                  <span>Journal</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Motivation */}
          <div className="sidebar-info-box positive">
            <div className="sidebar-info-title">Motivation</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🌟</span>
              <span>Excellent travail ! Continue !</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Notifications
const NotificationsSection = ({ isExpanded, onToggle }) => {
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
          <span className="sidebar-section-badge">4</span>
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
          {/* Liste des notifications */}
          <div className="sidebar-notifications-list">
            {/* Notification 1 - Non lue */}
            <div className="sidebar-notification-item unread">
              <div className="sidebar-notification-icon" aria-hidden="true">🏆</div>
              <div className="sidebar-notification-content">
                <div className="sidebar-notification-title">Nouveau Achievement</div>
                <div className="sidebar-notification-message">
                  Vous avez débloqué "Streak Master"
                </div>
                <div className="sidebar-notification-time">Il y a 5 min</div>
              </div>
              <div className="sidebar-notification-unread-dot" aria-label="Non lu"></div>
            </div>
            
            {/* Notification 2 - Non lue */}
            <div className="sidebar-notification-item unread">
              <div className="sidebar-notification-icon" aria-hidden="true">📚</div>
              <div className="sidebar-notification-content">
                <div className="sidebar-notification-title">Objectif atteint</div>
                <div className="sidebar-notification-message">
                  30 pages lues aujourd'hui
                </div>
                <div className="sidebar-notification-time">Il y a 1h</div>
              </div>
              <div className="sidebar-notification-unread-dot" aria-label="Non lu"></div>
            </div>
            
            {/* Notification 3 - Non lue */}
            <div className="sidebar-notification-item unread">
              <div className="sidebar-notification-icon" aria-hidden="true">💰</div>
              <div className="sidebar-notification-content">
                <div className="sidebar-notification-title">Alerte Budget</div>
                <div className="sidebar-notification-message">
                  85% du budget mensuel utilisé
                </div>
                <div className="sidebar-notification-time">Il y a 2h</div>
              </div>
              <div className="sidebar-notification-unread-dot" aria-label="Non lu"></div>
            </div>
            
            {/* Notification 4 - Lue */}
            <div className="sidebar-notification-item">
              <div className="sidebar-notification-icon" aria-hidden="true">🎯</div>
              <div className="sidebar-notification-content">
                <div className="sidebar-notification-title">Quête complétée</div>
                <div className="sidebar-notification-message">
                  Entraînement quotidien terminé
                </div>
                <div className="sidebar-notification-time">Il y a 3h</div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div className="sidebar-notifications-actions">
            <button className="sidebar-notification-action-btn">
              <span aria-hidden="true">✓</span>
              <span>Tout marquer comme lu</span>
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Météo
const WeatherSection = ({ isExpanded, onToggle }) => {
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
          {/* Météo actuelle */}
          <div className="sidebar-weather-current">
            <div className="sidebar-weather-icon-large" aria-hidden="true">☀️</div>
            <div className="sidebar-weather-temp">22°C</div>
            <div className="sidebar-weather-condition">Ensoleillé</div>
            <div className="sidebar-weather-location">
              <span aria-hidden="true">📍</span>
              <span>Paris, France</span>
            </div>
          </div>
          
          {/* Détails météo */}
          <div className="sidebar-data-grid">
            {/* Ressenti */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🌡️</span>
              <div className="sidebar-data-value">20°C</div>
              <div className="sidebar-data-label">Ressenti</div>
            </div>
            
            {/* Humidité */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💧</span>
              <div className="sidebar-data-value">65%</div>
              <div className="sidebar-data-label">Humidité</div>
            </div>
            
            {/* Vent */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">💨</span>
              <div className="sidebar-data-value">12 km/h</div>
              <div className="sidebar-data-label">Vent</div>
            </div>
            
            {/* UV */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">☀️</span>
              <div className="sidebar-data-value">5</div>
              <div className="sidebar-data-label">Indice UV</div>
            </div>
          </div>
          
          {/* Prévisions */}
          <div className="sidebar-weather-forecast">
            <div className="sidebar-weather-forecast-title">Prévisions 3 jours</div>
            <div className="sidebar-weather-forecast-list">
              {/* Demain */}
              <div className="sidebar-weather-forecast-item">
                <div className="sidebar-weather-forecast-day">Demain</div>
                <div className="sidebar-weather-forecast-icon" aria-hidden="true">⛅</div>
                <div className="sidebar-weather-forecast-temps">
                  <span className="sidebar-weather-forecast-high">24°</span>
                  <span className="sidebar-weather-forecast-low">16°</span>
                </div>
              </div>
              
              {/* Mercredi */}
              <div className="sidebar-weather-forecast-item">
                <div className="sidebar-weather-forecast-day">Mercredi</div>
                <div className="sidebar-weather-forecast-icon" aria-hidden="true">🌧️</div>
                <div className="sidebar-weather-forecast-temps">
                  <span className="sidebar-weather-forecast-high">19°</span>
                  <span className="sidebar-weather-forecast-low">14°</span>
                </div>
              </div>
              
              {/* Jeudi */}
              <div className="sidebar-weather-forecast-item">
                <div className="sidebar-weather-forecast-day">Jeudi</div>
                <div className="sidebar-weather-forecast-icon" aria-hidden="true">☀️</div>
                <div className="sidebar-weather-forecast-temps">
                  <span className="sidebar-weather-forecast-high">23°</span>
                  <span className="sidebar-weather-forecast-low">15°</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recommandation */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Recommandation</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🏃</span>
              <span>Parfait pour une sortie sport !</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Motivation
const MotivationSection = ({ isExpanded, onToggle }) => {
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
          {/* Citation du jour */}
          <div className="sidebar-motivation-quote">
            <div className="sidebar-motivation-quote-icon" aria-hidden="true">💭</div>
            <div className="sidebar-motivation-quote-text">
              "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte."
            </div>
            <div className="sidebar-motivation-quote-author">— Winston Churchill</div>
          </div>
          
          {/* Statistiques motivantes */}
          <div className="sidebar-motivation-stats">
            <div className="sidebar-motivation-stat-item">
              <div className="sidebar-motivation-stat-icon" aria-hidden="true">🔥</div>
              <div className="sidebar-motivation-stat-content">
                <div className="sidebar-motivation-stat-value">28 jours</div>
                <div className="sidebar-motivation-stat-label">de streak actuel</div>
              </div>
            </div>
            
            <div className="sidebar-motivation-stat-item">
              <div className="sidebar-motivation-stat-icon" aria-hidden="true">🏆</div>
              <div className="sidebar-motivation-stat-content">
                <div className="sidebar-motivation-stat-value">47 achievements</div>
                <div className="sidebar-motivation-stat-label">débloqués</div>
              </div>
            </div>
            
            <div className="sidebar-motivation-stat-item">
              <div className="sidebar-motivation-stat-icon" aria-hidden="true">📈</div>
              <div className="sidebar-motivation-stat-content">
                <div className="sidebar-motivation-stat-value">+15%</div>
                <div className="sidebar-motivation-stat-label">de progression ce mois</div>
              </div>
            </div>
          </div>
          
          {/* Objectif de la semaine */}
          <div className="sidebar-info-box positive">
            <div className="sidebar-info-title">Objectif de la semaine</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🎯</span>
              <span>Atteindre 20h de focus</span>
            </div>
            <div className="sidebar-progress-mini">
              <div 
                className="sidebar-progress-mini-bar" 
                style={{ width: '65%' }}
                role="progressbar"
                aria-valuenow={65}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <div className="sidebar-motivation-progress-text">13h / 20h complétées</div>
          </div>
          
          {/* Message motivant */}
          <div className="sidebar-motivation-message">
            <div className="sidebar-motivation-message-icon" aria-hidden="true">🌟</div>
            <div className="sidebar-motivation-message-text">
              Tu es sur la bonne voie ! Continue comme ça !
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Récompenses
const RewardsSection = ({ isExpanded, onToggle }) => {
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
          <span className="sidebar-section-badge">2</span>
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
          {/* Points de récompense */}
          <div className="sidebar-rewards-points">
            <div className="sidebar-rewards-points-icon" aria-hidden="true">💎</div>
            <div className="sidebar-rewards-points-content">
              <div className="sidebar-rewards-points-value">2,450</div>
              <div className="sidebar-rewards-points-label">Points de récompense</div>
            </div>
          </div>
          
          {/* Statistiques */}
          <div className="sidebar-data-grid">
            {/* Récompenses débloquées */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🎁</span>
              <div className="sidebar-data-value">12</div>
              <div className="sidebar-data-label">Débloquées</div>
            </div>
            
            {/* Récompenses disponibles */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✨</span>
              <div className="sidebar-data-value">2</div>
              <div className="sidebar-data-label">Disponibles</div>
            </div>
            
            {/* Points gagnés ce mois */}
            <div className="sidebar-data-card positive">
              <span className="sidebar-data-icon" aria-hidden="true">📈</span>
              <div className="sidebar-data-value">+450</div>
              <div className="sidebar-data-label">Ce mois</div>
            </div>
            
            {/* Niveau récompense */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⭐</span>
              <div className="sidebar-data-value">Gold</div>
              <div className="sidebar-data-label">Niveau</div>
            </div>
          </div>
          
          {/* Récompenses disponibles */}
          <div className="sidebar-rewards-available">
            <div className="sidebar-rewards-available-title">Récompenses disponibles</div>
            
            {/* Récompense 1 */}
            <div className="sidebar-reward-item">
              <div className="sidebar-reward-icon" aria-hidden="true">🎨</div>
              <div className="sidebar-reward-content">
                <div className="sidebar-reward-name">Thème Premium</div>
                <div className="sidebar-reward-cost">
                  <span className="sidebar-reward-cost-icon" aria-hidden="true">💎</span>
                  <span>500 points</span>
                </div>
              </div>
              <button className="sidebar-reward-claim-btn" aria-label="Réclamer Thème Premium">
                Réclamer
              </button>
            </div>
            
            {/* Récompense 2 */}
            <div className="sidebar-reward-item">
              <div className="sidebar-reward-icon" aria-hidden="true">🏆</div>
              <div className="sidebar-reward-content">
                <div className="sidebar-reward-name">Badge Exclusif</div>
                <div className="sidebar-reward-cost">
                  <span className="sidebar-reward-cost-icon" aria-hidden="true">💎</span>
                  <span>300 points</span>
                </div>
              </div>
              <button className="sidebar-reward-claim-btn" aria-label="Réclamer Badge Exclusif">
                Réclamer
              </button>
            </div>
          </div>
          
          {/* Prochaine récompense */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Prochaine récompense</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🎯</span>
              <span>Avatar Légendaire - 3,000 points</span>
            </div>
            <div className="sidebar-progress-mini">
              <div 
                className="sidebar-progress-mini-bar" 
                style={{ width: '82%' }}
                role="progressbar"
                aria-valuenow={82}
                aria-valuemin={0}
                aria-valuemax={100}
              ></div>
            </div>
            <div className="sidebar-motivation-progress-text">2,450 / 3,000 points</div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Historique
const HistorySection = ({ isExpanded, onToggle }) => {
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
          {/* Statistiques d'historique */}
          <div className="sidebar-data-grid">
            {/* Jours actifs */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">📅</span>
              <div className="sidebar-data-value">245</div>
              <div className="sidebar-data-label">Jours actifs</div>
            </div>
            
            {/* Total activités */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✅</span>
              <div className="sidebar-data-value">1,234</div>
              <div className="sidebar-data-label">Activités</div>
            </div>
            
            {/* Temps total */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">487h</div>
              <div className="sidebar-data-label">Temps total</div>
            </div>
            
            {/* Meilleur streak */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-data-value">45</div>
              <div className="sidebar-data-label">Record</div>
            </div>
          </div>
          
          {/* Activités récentes */}
          <div className="sidebar-history-recent">
            <div className="sidebar-history-recent-title">Activités récentes</div>
            
            {/* Activité 1 */}
            <div className="sidebar-history-item">
              <div className="sidebar-history-icon" aria-hidden="true">🎯</div>
              <div className="sidebar-history-content">
                <div className="sidebar-history-title">Session focus</div>
                <div className="sidebar-history-details">
                  <span>1h 30min</span>
                  <span className="sidebar-history-time">Il y a 2h</span>
                </div>
              </div>
            </div>
            
            {/* Activité 2 */}
            <div className="sidebar-history-item">
              <div className="sidebar-history-icon" aria-hidden="true">📚</div>
              <div className="sidebar-history-content">
                <div className="sidebar-history-title">Lecture</div>
                <div className="sidebar-history-details">
                  <span>45 pages</span>
                  <span className="sidebar-history-time">Il y a 4h</span>
                </div>
              </div>
            </div>
            
            {/* Activité 3 */}
            <div className="sidebar-history-item">
              <div className="sidebar-history-icon" aria-hidden="true">💪</div>
              <div className="sidebar-history-content">
                <div className="sidebar-history-title">Entraînement</div>
                <div className="sidebar-history-details">
                  <span>Jambes</span>
                  <span className="sidebar-history-time">Hier</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tendance */}
          <div className="sidebar-info-box positive">
            <div className="sidebar-info-title">Tendance</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">📈</span>
              <span>+25% d'activité ce mois</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Paramètres Rapides
const QuickSettingsSection = ({ isExpanded, onToggle }) => {
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
              <select className="sidebar-setting-select" aria-label="Sélectionner la durée de session">
                <option value="25">25 min</option>
                <option value="45">45 min</option>
                <option value="60" selected>60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
          </div>
          
          {/* Bouton paramètres complets */}
          <button className="sidebar-settings-full-btn">
            <span className="sidebar-settings-full-icon" aria-hidden="true">⚙️</span>
            <span>Tous les paramètres</span>
          </button>
        </div>
      )}
    </section>
  );
};

// Section Prédictions IA
const AIPredictionsSection = ({ isExpanded, onToggle }) => {
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
          {/* Score de prédiction */}
          <div className="sidebar-ai-score">
            <div className="sidebar-ai-score-icon" aria-hidden="true">🎯</div>
            <div className="sidebar-ai-score-content">
              <div className="sidebar-ai-score-value">92%</div>
              <div className="sidebar-ai-score-label">Précision des prédictions</div>
            </div>
          </div>
          
          {/* Prédictions */}
          <div className="sidebar-ai-predictions">
            <div className="sidebar-ai-predictions-title">Prédictions du jour</div>
            
            {/* Prédiction 1 - Positive */}
            <div className="sidebar-ai-prediction-item positive">
              <div className="sidebar-ai-prediction-header">
                <span className="sidebar-ai-prediction-icon" aria-hidden="true">📈</span>
                <div className="sidebar-ai-prediction-title">Productivité élevée</div>
                <div className="sidebar-ai-prediction-confidence">95%</div>
              </div>
              <div className="sidebar-ai-prediction-message">
                Conditions optimales pour une session focus entre 14h et 17h
              </div>
            </div>
            
            {/* Prédiction 2 - Neutre */}
            <div className="sidebar-ai-prediction-item">
              <div className="sidebar-ai-prediction-header">
                <span className="sidebar-ai-prediction-icon" aria-hidden="true">💪</span>
                <div className="sidebar-ai-prediction-title">Énergie modérée</div>
                <div className="sidebar-ai-prediction-confidence">87%</div>
              </div>
              <div className="sidebar-ai-prediction-message">
                Entraînement recommandé en fin d'après-midi
              </div>
            </div>
            
            {/* Prédiction 3 - Attention */}
            <div className="sidebar-ai-prediction-item warning">
              <div className="sidebar-ai-prediction-header">
                <span className="sidebar-ai-prediction-icon" aria-hidden="true">⚠️</span>
                <div className="sidebar-ai-prediction-title">Risque de fatigue</div>
                <div className="sidebar-ai-prediction-confidence">78%</div>
              </div>
              <div className="sidebar-ai-prediction-message">
                Prévoir une pause de 15 min toutes les heures
              </div>
            </div>
          </div>
          
          {/* Recommandations IA */}
          <div className="sidebar-ai-recommendations">
            <div className="sidebar-ai-recommendations-title">Recommandations</div>
            
            {/* Recommandation 1 */}
            <div className="sidebar-ai-recommendation-item">
              <span className="sidebar-ai-recommendation-icon" aria-hidden="true">🎯</span>
              <div className="sidebar-ai-recommendation-text">
                Commencer par les tâches complexes ce matin
              </div>
            </div>
            
            {/* Recommandation 2 */}
            <div className="sidebar-ai-recommendation-item">
              <span className="sidebar-ai-recommendation-icon" aria-hidden="true">📚</span>
              <div className="sidebar-ai-recommendation-text">
                Session de lecture optimale vers 20h
              </div>
            </div>
            
            {/* Recommandation 3 */}
            <div className="sidebar-ai-recommendation-item">
              <span className="sidebar-ai-recommendation-icon" aria-hidden="true">🧘</span>
              <div className="sidebar-ai-recommendation-text">
                Méditation recommandée avant le coucher
              </div>
            </div>
          </div>
          
          {/* Analyse basée sur */}
          <div className="sidebar-info-box">
            <div className="sidebar-info-title">Analyse basée sur</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">📊</span>
              <span>245 jours d'historique</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

// Section Statistiques Globales
const GlobalStatsSection = ({ isExpanded, onToggle }) => {
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
              <div className="sidebar-data-value">125K</div>
              <div className="sidebar-data-label">XP Total</div>
            </div>
            
            {/* Heures totales */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">⏱️</span>
              <div className="sidebar-data-value">1,247h</div>
              <div className="sidebar-data-label">Temps total</div>
            </div>
            
            {/* Activités */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">✅</span>
              <div className="sidebar-data-value">3,456</div>
              <div className="sidebar-data-label">Activités</div>
            </div>
            
            {/* Achievements */}
            <div className="sidebar-data-card">
              <span className="sidebar-data-icon" aria-hidden="true">🏆</span>
              <div className="sidebar-data-value">47</div>
              <div className="sidebar-data-label">Achievements</div>
            </div>
          </div>
          
          {/* Répartition par catégorie */}
          <div className="sidebar-stats-breakdown">
            <div className="sidebar-stats-breakdown-title">Répartition du temps</div>
            
            {/* Focus */}
            <div className="sidebar-stats-breakdown-item">
              <div className="sidebar-stats-breakdown-header">
                <span className="sidebar-stats-breakdown-icon" aria-hidden="true">🎯</span>
                <span className="sidebar-stats-breakdown-label">Focus</span>
                <span className="sidebar-stats-breakdown-value">487h</span>
              </div>
              <div className="sidebar-stats-breakdown-bar">
                <div 
                  className="sidebar-stats-breakdown-fill focus" 
                  style={{ width: '39%' }}
                  role="progressbar"
                  aria-valuenow={39}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            
            {/* Sport */}
            <div className="sidebar-stats-breakdown-item">
              <div className="sidebar-stats-breakdown-header">
                <span className="sidebar-stats-breakdown-icon" aria-hidden="true">💪</span>
                <span className="sidebar-stats-breakdown-label">Sport</span>
                <span className="sidebar-stats-breakdown-value">312h</span>
              </div>
              <div className="sidebar-stats-breakdown-bar">
                <div 
                  className="sidebar-stats-breakdown-fill sport" 
                  style={{ width: '25%' }}
                  role="progressbar"
                  aria-valuenow={25}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            
            {/* Lecture */}
            <div className="sidebar-stats-breakdown-item">
              <div className="sidebar-stats-breakdown-header">
                <span className="sidebar-stats-breakdown-icon" aria-hidden="true">📚</span>
                <span className="sidebar-stats-breakdown-label">Lecture</span>
                <span className="sidebar-stats-breakdown-value">268h</span>
              </div>
              <div className="sidebar-stats-breakdown-bar">
                <div 
                  className="sidebar-stats-breakdown-fill reading" 
                  style={{ width: '21%' }}
                  role="progressbar"
                  aria-valuenow={21}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
            
            {/* Apprentissage */}
            <div className="sidebar-stats-breakdown-item">
              <div className="sidebar-stats-breakdown-header">
                <span className="sidebar-stats-breakdown-icon" aria-hidden="true">🎓</span>
                <span className="sidebar-stats-breakdown-label">Apprentissage</span>
                <span className="sidebar-stats-breakdown-value">180h</span>
              </div>
              <div className="sidebar-stats-breakdown-bar">
                <div 
                  className="sidebar-stats-breakdown-fill learning" 
                  style={{ width: '15%' }}
                  role="progressbar"
                  aria-valuenow={15}
                  aria-valuemin={0}
                  aria-valuemax={100}
                ></div>
              </div>
            </div>
          </div>
          
          {/* Records personnels */}
          <div className="sidebar-stats-records">
            <div className="sidebar-stats-records-title">Records personnels</div>
            
            {/* Record 1 */}
            <div className="sidebar-stats-record-item">
              <span className="sidebar-stats-record-icon" aria-hidden="true">🔥</span>
              <div className="sidebar-stats-record-content">
                <div className="sidebar-stats-record-label">Plus long streak</div>
                <div className="sidebar-stats-record-value">45 jours</div>
              </div>
            </div>
            
            {/* Record 2 */}
            <div className="sidebar-stats-record-item">
              <span className="sidebar-stats-record-icon" aria-hidden="true">⚡</span>
              <div className="sidebar-stats-record-content">
                <div className="sidebar-stats-record-label">Plus longue session</div>
                <div className="sidebar-stats-record-value">4h 30min</div>
              </div>
            </div>
            
            {/* Record 3 */}
            <div className="sidebar-stats-record-item">
              <span className="sidebar-stats-record-icon" aria-hidden="true">📈</span>
              <div className="sidebar-stats-record-content">
                <div className="sidebar-stats-record-label">Meilleure semaine</div>
                <div className="sidebar-stats-record-value">42h focus</div>
              </div>
            </div>
          </div>
          
          {/* Comparaison */}
          <div className="sidebar-info-box positive">
            <div className="sidebar-info-title">Comparaison</div>
            <div className="sidebar-info-content">
              <span className="sidebar-info-icon" aria-hidden="true">🏆</span>
              <span>Top 5% des utilisateurs</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SidebarPremium;
