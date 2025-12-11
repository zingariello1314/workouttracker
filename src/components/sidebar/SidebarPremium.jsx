import React, { memo } from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { useSidebarData } from '../../hooks/useSidebarData';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../hooks/useAuth';
import { measureSync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';
import ProfileCard3D from './ProfileCard3D';
import ModuleRenderer from './ModuleRenderer';
import '../../styles/sidebar-premium.css';
import '../../styles/module-alternation.css';

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
    today,      // Agrégation des activités du jour
    todayDate,  // Date du jour (format ISO)
    isLoading
  } = useSidebarData();

  // Hook de navigation
  const navigation = useNavigation();
  const { setActiveTab } = navigation; // Extraire setActiveTab pour les modules historiques

  // Hook d'authentification
  const { user } = useAuth();

  const sidebarRef = React.useRef(null);
  const observerRef = React.useRef(null);

  // Optimisation: Throttle pour limiter les calculs de position avec monitoring de performance
  const throttledUpdatePosition = React.useCallback(() => {
    if (!sidebarRef.current) return;

    // Utiliser requestAnimationFrame pour optimiser les performances
    requestAnimationFrame(() => {
      measureSync(SIDEBAR_OPERATIONS.SIDEBAR_REFRESH, () => {
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

  // Note: sectionProps removed - ghost sections have been deleted

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

      {/* Zone Scrollable - Modules avec alternance */}
      <div className="sidebar-content" id="sidebar-main-content">
        <ModuleRenderer
          sidebarProps={{
            // Fonctions de gestion des sections
            isSectionExpanded,
            toggleSection,
            
            // Navigation
            navigation,
            setActiveTab, // Ajouter setActiveTab pour les modules historiques
            
            // Données
            data: {
              metrics,
              quests,
              sport,
              finance,
              nutrition,
              learning,
              today
            },
            
            // Date
            todayDate,
            
            // État de chargement
            isLoading
          }}
          onModuleError={(error, moduleId) => {
            console.error(`Erreur dans le module ${moduleId}:`, error);
          }}
          className="sidebar-modules-alternated"
        />
      </div>
    </aside>
    </>
  );
});

SidebarPremium.displayName = 'SidebarPremium';

export default SidebarPremium;
