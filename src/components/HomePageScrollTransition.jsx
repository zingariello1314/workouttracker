import React, { useEffect, useRef } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import HomePage from './HomePage';
import DashboardTab from './tabs/DashboardTab';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import SidebarPremium from './sidebar/SidebarPremium';

/**
 * HomePageScrollTransition - Scroll naturel entre HomePage et Dashboard
 * Utilise une vraie scrollbar pour naviguer entre les deux pages
 */
const HomePageScrollTransition = () => {
  const { activeTab, setActiveTab } = useWorkout();
  const containerRef = useRef(null);
  const homePageRef = useRef(null);
  const dashboardRef = useRef(null);

  // Gérer le scroll pour détecter sur quelle page on est
  useEffect(() => {
    if (activeTab !== 'home' && activeTab !== 'dashboard') return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = window.innerHeight;
      
      // Si on a scrollé plus de 50% de la hauteur de la fenêtre, on est sur le dashboard
      if (scrollTop > viewportHeight * 0.5) {
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        }
      } else {
        // Si on remonte au-dessus de 50%, on revient sur home
        if (activeTab === 'dashboard') {
          setActiveTab('home');
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, setActiveTab]);

  // Quand on change d'onglet depuis la navigation, ajuster le scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (activeTab === 'home') {
      // Scroll vers le haut (HomePage)
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (activeTab === 'dashboard') {
      // Scroll vers le bas (Dashboard)
      const viewportHeight = window.innerHeight;
      container.scrollTo({ top: viewportHeight, behavior: 'smooth' });
    }
  }, [activeTab]);

  // Si on n'est ni sur home ni sur dashboard, ne rien afficher
  if (activeTab !== 'home' && activeTab !== 'dashboard') {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-y-auto overflow-x-hidden homepage-scroll-container"
      style={{ 
        zIndex: 1000,
        scrollBehavior: 'smooth',
      }}
    >

      {/* Conteneur avec les deux pages empilées verticalement */}
      <div>
        {/* HomePage - Prend toute la hauteur de la fenêtre */}
        <div 
          ref={homePageRef}
          className="w-full"
          style={{ 
            minHeight: '100vh',
            maxHeight: '100vh',
            height: '100vh'
          }}
        >
          <HomePage />
        </div>

        {/* Dashboard - Commence juste en dessous */}
        <div 
          ref={dashboardRef}
          className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col"
          style={{ 
            minHeight: '100vh',
            position: 'relative'
          }}
        >
          {/* Header et Navigation - Visibles uniquement sur le Dashboard */}
          {activeTab === 'dashboard' && (
            <>
              {/* Header du site (avec logo, date, profil utilisateur) */}
              <Header />
              
              {/* Navigation entre onglets */}
              <Navigation />
            </>
          )}
          
          {/* Sidebar Premium - Positionnée en fixed juste sous le header/navigation */}
          {activeTab === 'dashboard' && (
            <div style={{ position: 'fixed', left: 0, top: '116px', bottom: 0, width: '300px', zIndex: 60 }}>
              <SidebarPremium />
            </div>
          )}
          
          {/* Layout avec contenu du Dashboard */}
          <div className="flex-1 relative" style={{ paddingTop: activeTab === 'dashboard' ? '116px' : '0' }}>
            {/* Contenu du Dashboard avec marge pour la sidebar */}
            <div style={{ marginLeft: activeTab === 'dashboard' ? '300px' : '0' }}>
              <DashboardTab />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageScrollTransition;
