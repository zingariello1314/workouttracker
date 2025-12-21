import React, { useEffect, useRef, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import HomePage from './HomePage';
import DashboardTab from './tabs/DashboardTab';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import SidebarPremium from './sidebar/SidebarPremium';
import AnimatedBackground from './ui/AnimatedBackground';

/**
 * HomePageScrollTransition - Scroll naturel entre HomePage et Dashboard
 * Utilise une vraie scrollbar pour naviguer entre les deux pages
 */
const HomePageScrollTransition = () => {
  const { activeTab, setActiveTab } = useWorkout();
  const containerRef = useRef(null);
  const homePageRef = useRef(null);
  const dashboardRef = useRef(null);
  
  // État pour contrôler l'affichage du fond animé basé sur le scroll progressif
  const [showAnimatedBackground, setShowAnimatedBackground] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0); // 0 = home, 1 = dashboard

  // Gérer le scroll pour détecter sur quelle page on est et calculer le progrès
  useEffect(() => {
    if (activeTab !== 'home' && activeTab !== 'dashboard') return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const viewportHeight = window.innerHeight;
      
      // Calculer le progrès du scroll (0 = home, 1 = dashboard)
      const progress = Math.min(Math.max(scrollTop / viewportHeight, 0), 1);
      setScrollProgress(progress);
      
      // Activer le fond animé progressivement quand on dépasse 25% du scroll
      // Cela évite que le fond apparaisse trop tôt et permet une transition fluide
      if (progress > 0.25) {
        setShowAnimatedBackground(true);
      } else {
        setShowAnimatedBackground(false);
      }
      
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
    
    // Appeler handleScroll une fois pour initialiser l'état
    handleScroll();

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
      // Masquer le fond animé immédiatement quand on revient à home
      setShowAnimatedBackground(false);
      setScrollProgress(0);
    } else if (activeTab === 'dashboard') {
      // Scroll vers le bas (Dashboard) avec transition fluide
      const viewportHeight = window.innerHeight;
      container.scrollTo({ top: viewportHeight, behavior: 'smooth' });
      
      // Le fond sera activé progressivement par handleScroll quand scrollProgress > 0.25
      // Pas besoin de setTimeout, le handleScroll se déclenchera automatiquement pendant le scroll
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
      {/* Fond animé - affiché progressivement quand on scroll vers le dashboard */}
      {/* Le fond apparaît progressivement avec une transition d'opacité basée sur le scroll */}
      {showAnimatedBackground && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
            // Opacité progressive : 0% à 25% de scroll, puis augmente jusqu'à 100% à 50% de scroll
            opacity: scrollProgress < 0.25 
              ? 0 
              : scrollProgress < 0.5 
                ? (scrollProgress - 0.25) / 0.25 // Transition de 0 à 1 entre 25% et 50%
                : 1,
            transition: 'opacity 0.2s ease-out'
          }}
        >
          <AnimatedBackground />
        </div>
      )}

      {/* Conteneur avec les deux pages empilées verticalement */}
      <div>
        {/* HomePage - Prend toute la hauteur de la fenêtre */}
        <div 
          ref={homePageRef}
          className="w-full relative z-10"
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
          className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative z-10"
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
