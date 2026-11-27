import React, { memo, useCallback, useMemo } from 'react';
import { useSidebar } from '../../hooks/useSidebar';
import { useSidebarData } from '../../hooks/useSidebarData';
import { useNavigation } from '../../hooks/useNavigation';
import { useAuth } from '../../context/AuthContext';
import { measureSync, SIDEBAR_OPERATIONS } from '../../utils/performanceMonitor';
import { isDiagFlag } from '../../dev/todayDiagnostics/diagIsolation';
import ProfileCard3D from './ProfileCard3D';
import GradeArtCardOffer from './GradeArtCardOffer';
import ModuleRenderer from './ModuleRenderer';
import SpotifySidebarCard from './SpotifySidebarCard';
import SidebarClock from './SidebarClock';
import '../../styles/sidebar-premium.css';
import '../../styles/module-alternation.css';

/**
 * Sidebar Premium QuietQuest.
 *
 * P0.4 : l’horloge est isolée dans SidebarClock pour que le tick 1s ne
 * re-rende plus ModuleRenderer / ProfileCard3D / useSidebarData.
 */
const SidebarPremium = memo(() => {
  if (isDiagFlag('suspendSidebarPremium')) {
    return (
      <aside
        className="sidebar-premium sidebar-premium--diag-suspended"
        role="complementary"
        aria-label="Sidebar Premium suspendue (diagnostic)"
        data-diag-suspend="sidebar-premium"
      >
        <p style={{ padding: 12, opacity: 0.7, fontSize: 12 }}>
          SidebarPremium suspendue (diag). Aucune donnée métier n’est écrite.
        </p>
      </aside>
    );
  }

  return <SidebarPremiumBody />;
});

const SidebarPremiumBody = memo(() => {
  const {
    systemStatus,
    isMobileOpen,
    toggleSection,
    isSectionExpanded,
    toggleMobileSidebar,
    closeMobileSidebar,
  } = useSidebar();

  const {
    metrics,
    quests,
    sport,
    finance,
    nutrition,
    learning,
    shopping,
    today,
    todayDate,
    isLoading
  } = useSidebarData();

  const navigation = useNavigation();
  const { setActiveTab } = navigation;
  const { currentUser } = useAuth();

  const sidebarRef = React.useRef(null);

  const throttledUpdatePosition = useCallback(() => {
    if (!sidebarRef.current) return;

    requestAnimationFrame(() => {
      measureSync(SIDEBAR_OPERATIONS.SIDEBAR_REFRESH, () => {
        if (!sidebarRef.current) return;

        const isDashboard = document.body.classList.contains('dashboard-active');

        if (isDashboard) {
          sidebarRef.current.style.top = '127px';
          sidebarRef.current.style.height = 'calc(100vh - 127px)';
          return;
        }

        const header = document.querySelector('header');
        const navigationEl = document.querySelector('nav');

        let totalHeaderHeight = 0;

        if (header) {
          totalHeaderHeight += header.offsetHeight;
        }

        if (navigationEl) {
          totalHeaderHeight += navigationEl.offsetHeight;
        }

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

  React.useEffect(() => {
    throttledUpdatePosition();

    let resizeTimeout;
    const handleResize = () => {
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      resizeTimeout = setTimeout(throttledUpdatePosition, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });

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
      subtree: false,
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

  const sidebarData = useMemo(
    () => ({
      metrics,
      quests,
      sport,
      finance,
      nutrition,
      learning,
      shopping,
      today
    }),
    [metrics, quests, sport, finance, nutrition, learning, shopping, today]
  );

  const handleModuleError = useCallback((error, moduleId) => {
    console.error(`Erreur dans le module ${moduleId}:`, error);
  }, []);

  const sidebarProps = useMemo(
    () => ({
      isSectionExpanded,
      toggleSection,
      navigation,
      setActiveTab,
      data: sidebarData,
      todayDate,
      isLoading
    }),
    [
      isSectionExpanded,
      toggleSection,
      navigation,
      setActiveTab,
      sidebarData,
      todayDate,
      isLoading
    ]
  );

  return (
    <>
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
        data-sidebar-clock-isolated="1"
      >
        <a href="#sidebar-main-content" className="sidebar-skip-link">
          Aller au contenu principal
        </a>

        <div className="sidebar-clock-section" id="sidebar-clock-section">
          <SidebarClock />

          <ProfileCard3D
            username={currentUser?.username || 'guest'}
            showUserInfo={true}
            enableTilt={true}
            enableMobileTilt={false}
          />
          <GradeArtCardOffer />

          <div className="sidebar-system-status" role="group" aria-label="Statuts système">
            <div className="sidebar-status-item" role="status" aria-label="Système actif">
              <div className="sidebar-status-pulse" aria-hidden="true"></div>
              <div className="sidebar-status-label" aria-hidden="true">Système</div>
              <div className="sidebar-status-value" aria-hidden="true">Actif</div>
            </div>

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
          <div style={{ marginTop: '2cm' }}>
            <SpotifySidebarCard user={currentUser} />
          </div>
        </div>

        <div className="sidebar-content" id="sidebar-main-content">
          <ModuleRenderer
            sidebarProps={sidebarProps}
            onModuleError={handleModuleError}
            className="sidebar-modules-alternated"
          />
        </div>
      </aside>
    </>
  );
});

SidebarPremiumBody.displayName = 'SidebarPremiumBody';
SidebarPremium.displayName = 'SidebarPremium';

export default SidebarPremium;
