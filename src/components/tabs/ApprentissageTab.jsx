/**
 * Composant ApprentissageTab - Onglet Apprentissage
 * Système de gestion de l'apprentissage avec sous-onglets : Matières, Sessions, Trophées, Calendrier
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from '../../utils/translations';
import ErrorBoundary from '../ui/ErrorBoundary';

// Code splitting : Lazy load des vues pour améliorer les performances initiales
const MatièresView = lazy(() => import('../apprentissage/MatièresView'));
const SessionsView = lazy(() => import('../apprentissage/SessionsView'));
const TrophéesView = lazy(() => import('../apprentissage/TrophéesView'));
const ApprentissageCalendarView = lazy(() => import('../apprentissage/ApprentissageCalendarView'));
const ApprentissageXPBar = lazy(() => import('../apprentissage/ApprentissageXPBar'));

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center rounded-xl border-2 border-emerald-500/50 bg-black px-8 py-10">
      <div className="text-4xl mb-4 animate-spin">⚡</div>
      <div className="text-emerald-200/90 font-semibold uppercase tracking-wide">CHARGEMENT...</div>
    </div>
  </div>
);

const ApprentissageTab = () => {
  const t = useTranslation();
  
  // ✅ PHASE 1 : Persistance de l'état actif dans localStorage
  const [currentSubView, setCurrentSubView] = useState(() => {
    try {
      const saved = localStorage.getItem('apprentissage.activeSubView');
      if (saved === 'rubiks') return 'matieres';
      return saved || 'matieres';
    } catch (error) {
      console.warn('[ApprentissageTab] Erreur lecture localStorage:', error);
      return 'matieres';
    }
  });

  // ✅ PHASE 1 : Sauvegarder l'état actif dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('apprentissage.activeSubView', currentSubView);
    } catch (error) {
      console.warn('[ApprentissageTab] Erreur sauvegarde localStorage:', error);
    }
  }, [currentSubView]);

  // Émettre un événement lors du changement de sous-vue pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: currentSubView, isSubTab: true } 
    }));
  }, [currentSubView]);

  // Navigation sous-onglets
  const subViews = [
    { id: 'matieres', label: t('apprentissage.subTabs.matieres', 'Matières'), icon: '📚' },
    { id: 'sessions', label: t('apprentissage.subTabs.sessions', 'Sessions'), icon: '⏱️' },
    { id: 'trophees', label: t('apprentissage.subTabs.trophees', 'Trophées'), icon: '🏆' },
    { id: 'calendrier', label: t('apprentissage.subTabs.calendrier', 'Calendrier'), icon: '📆' }
  ];

  const switchToSubView = (subView) => {
    setCurrentSubView(subView);
  };

  const renderSubView = () => {
    switch (currentSubView) {
      case 'matieres':
        return <MatièresView />;
      case 'sessions':
        return <SessionsView />;
      case 'trophees':
        return <TrophéesView />;
      case 'calendrier':
        return <ApprentissageCalendarView />;
      default:
        return null;
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 min-h-screen">
        {/* Navigation sous-onglets */}
      <div className="sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {subViews.map((subView) => (
              <button
                key={subView.id}
                type="button"
                onClick={() => switchToSubView(subView.id)}
                data-subtab={subView.id}
                data-tab={subView.id === 'calendrier' ? 'learning-calendar' : undefined}
                className={`rounded-lg flex items-center space-x-2 whitespace-nowrap flex-shrink-0 border-2 px-4 py-2 text-sm font-semibold transition-all ${
                  currentSubView === subView.id
                    ? 'bg-emerald-500/15 border-emerald-400 text-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.18)]'
                    : 'bg-black border-emerald-600/50 text-emerald-200/90 hover:border-emerald-400/75 hover:bg-emerald-950/40'
                }`}
              >
                <span className="text-lg">{subView.icon}</span>
                <span>{subView.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu du sous-onglet avec ErrorBoundary */}
      <div className="py-6">
        {/* Barre XP Apprentissage */}
        <div className="max-w-7xl mx-auto px-4 mb-6">
          <Suspense fallback={<div className="h-24 bg-black border-2 border-emerald-500/40 rounded-xl animate-pulse" />}>
            <ApprentissageXPBar />
          </Suspense>
        </div>

        <ErrorBoundary
          context={{ currentSubView, tab: 'apprentissage' }}
          title={`Erreur dans ${currentSubView}`}
          message="Une erreur s'est produite dans ce sous-onglet. Vous pouvez réessayer ou changer de sous-onglet."
        >
          <Suspense fallback={<LoadingFallback />}>
            {renderSubView()}
          </Suspense>
        </ErrorBoundary>
      </div>
      </div>
    </div>
  );
};

export default ApprentissageTab;

