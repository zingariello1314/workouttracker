import React, { useEffect, useRef, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import HomePage from './HomePage';
import DashboardTab from './tabs/DashboardTab';
import Header from './layout/Header';
import Navigation from './layout/Navigation';
import SidebarPremium from './sidebar/SidebarPremium';
// AnimatedBackground n'est plus importé ici - on utilise celui de App.jsx pour éviter le rechargement

/**
 * HomePageScrollTransition - Scroll naturel entre HomePage et Dashboard
 * 
 * SOLUTION SIMPLIFIÉE : 
 * - Navigation par clic depuis navtab → toujours directe (comme les autres onglets)
 * - Scroll manuel depuis home → détection et transition fluide
 */
const HomePageScrollTransition = () => {
  const { activeTab, setActiveTab } = useWorkout();
  const containerRef = useRef(null);
  const homePageRef = useRef(null);
  const dashboardRef = useRef(null);
  
  // État pour contrôler le scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Refs pour éviter les conflits
  const isScrollingRef = useRef(false);
  
  // Utiliser sessionStorage pour persister l'onglet précédent entre montages/démontages
  const getPreviousTab = () => {
    return sessionStorage.getItem('previousTab') || null;
  };
  
  const setPreviousTab = (tab) => {
    if (tab) {
      sessionStorage.setItem('previousTab', tab);
    } else {
      sessionStorage.removeItem('previousTab');
    }
  };
  
  // Initialiser le scroll selon l'onglet actif
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const viewportHeight = window.innerHeight;
    const previousTab = getPreviousTab();
    
    if (activeTab === 'dashboard') {
      // Si on vient d'un autre onglet (pas home/dashboard), navigation directe
      if (previousTab && previousTab !== 'home' && previousTab !== 'dashboard') {
        // Navigation directe depuis un autre onglet (comme "sport")
        isScrollingRef.current = true;
        container.scrollTo({ top: viewportHeight, behavior: 'auto' });
        setScrollProgress(1); // Forcer scrollProgress à 1 pour afficher header/sidebar
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 50);
      } else if (previousTab === 'home') {
        // On vient de home → scroll smooth (navigation depuis home fonctionne bien)
        isScrollingRef.current = true;
        container.scrollTo({ top: viewportHeight, behavior: 'smooth' });
        setScrollProgress(1); // Forcer scrollProgress à 1 pour afficher header/sidebar
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 800);
      } else {
        // Cas par défaut : s'assurer que le scroll est correct
        const currentScroll = container.scrollTop;
        if (currentScroll < viewportHeight * 0.5) {
          isScrollingRef.current = true;
          container.scrollTo({ top: viewportHeight, behavior: 'auto' });
          setScrollProgress(1); // Forcer scrollProgress à 1 pour afficher header/sidebar
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 50);
        } else {
          // Le scroll est déjà correct, mettre scrollProgress à 1
          setScrollProgress(1);
        }
      }
    } else if (activeTab === 'home') {
      // Navigation vers home : toujours smooth (fonctionne bien depuis dashboard)
      isScrollingRef.current = true;
      container.scrollTo({ top: 0, behavior: 'smooth' });
      setScrollProgress(0); // Forcer scrollProgress à 0 pour masquer header/sidebar
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 500);
    }
    
    // Sauvegarder l'onglet actuel comme précédent pour la prochaine navigation
    setPreviousTab(activeTab);
  }, [activeTab]);

  // Gérer le scroll manuel (uniquement pour la transition depuis home)
  useEffect(() => {
    if (activeTab !== 'home' && activeTab !== 'dashboard') return;

    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Ignorer pendant les transitions programmées
      if (isScrollingRef.current) return;

      const scrollTop = container.scrollTop;
      const viewportHeight = window.innerHeight;
      
      const progress = Math.min(Math.max(scrollTop / viewportHeight, 0), 1);
      setScrollProgress(progress);
      
      // Émettre un événement pour informer App.jsx du scrollProgress pour dashboard
      // Cela permet de contrôler l'opacité du fond animé global
      window.dispatchEvent(new CustomEvent('dashboard-scroll-progress', { 
        detail: { progress, activeTab } 
      }));
      
      // Détection du scroll manuel : changer activeTab selon la position
      // Seuil plus strict pour éviter les changements trop fréquents
      if (scrollTop > viewportHeight * 0.6) {
        // On est clairement sur le dashboard
        if (activeTab !== 'dashboard') {
          setActiveTab('dashboard');
        }
      } else if (scrollTop < viewportHeight * 0.05) {
        // On est clairement sur home
        if (activeTab !== 'home') {
          setActiveTab('home');
        }
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [activeTab, setActiveTab]);
  
  // Émettre le scrollProgress initial et à chaque changement
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('dashboard-scroll-progress', { 
      detail: { progress: scrollProgress, activeTab } 
    }));
  }, [scrollProgress, activeTab]);

  // Ne pas démonter le composant même si on n'est pas sur home/dashboard
  // Cela permet de garder le fond animé monté et éviter le rechargement
  // On masque juste le contenu avec display: none
  const isVisible = activeTab === 'home' || activeTab === 'dashboard';

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-y-auto overflow-x-hidden homepage-scroll-container"
      style={{ 
        zIndex: 1000,
        scrollBehavior: 'smooth',
        // Masquer le contenu si on n'est pas sur home/dashboard, mais garder le composant monté
        display: isVisible ? 'block' : 'none',
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      {/* Le fond animé est géré par App.jsx pour éviter le rechargement */}
      {/* On émet un événement 'dashboard-scroll-progress' pour informer App.jsx du scrollProgress */}
      {/* Le fond animé global dans App.jsx reste monté en permanence et ajuste son opacité selon scrollProgress */}

      {/* Conteneur avec les deux pages empilées verticalement */}
      <div>
        {/* HomePage */}
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

        {/* Dashboard */}
        <div 
          ref={dashboardRef}
          className="w-full flex flex-col relative z-10"
          style={{ 
            minHeight: '100vh',
            position: 'relative'
          }}
        >
          {/* Header et Navigation - Visibles uniquement quand on est sur le dashboard (scrollProgress > 0.3) */}
          {/* Masquer progressivement quand on scroll vers home */}
          {scrollProgress > 0.3 && (
            <div
              style={{
                opacity: scrollProgress < 0.5 ? (scrollProgress - 0.3) / 0.2 : 1,
                transition: 'opacity 0.2s ease-out',
                pointerEvents: scrollProgress < 0.3 ? 'none' : 'auto'
              }}
            >
              <Header />
              <Navigation />
            </div>
          )}
          
          {/* Sidebar Premium - Masquer progressivement quand on scroll vers home */}
          {scrollProgress > 0.3 && (
            <div 
              style={{ 
                position: 'fixed', 
                left: 0, 
                top: '116px', 
                bottom: 0, 
                width: '300px', 
                zIndex: 60,
                opacity: scrollProgress < 0.5 ? (scrollProgress - 0.3) / 0.2 : 1,
                transition: 'opacity 0.2s ease-out',
                pointerEvents: scrollProgress < 0.3 ? 'none' : 'auto'
              }}
            >
              <SidebarPremium />
            </div>
          )}
          
          {/* Layout avec contenu du Dashboard */}
          {/* Padding et margin basés sur scrollProgress pour transition fluide */}
          <div 
            className="flex-1 relative" 
            style={{ 
              paddingTop: scrollProgress > 0.3 ? '116px' : '0',
              transition: 'padding-top 0.2s ease-out'
            }}
          >
            <div 
              style={{ 
                marginLeft: scrollProgress > 0.3 ? '300px' : '0',
                transition: 'margin-left 0.2s ease-out'
              }}
            >
              <DashboardTab />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePageScrollTransition;
