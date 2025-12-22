/**
 * Composant ApprentissageTab - Onglet Apprentissage
 * Système de gestion de l'apprentissage avec 3 sous-onglets : Matières, Sessions, Trophées
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useTranslation } from '../../utils/translations';

// Code splitting : Lazy load des vues pour améliorer les performances initiales
const MatièresView = lazy(() => import('../apprentissage/MatièresView'));
const SessionsView = lazy(() => import('../apprentissage/SessionsView'));
const TrophéesView = lazy(() => import('../apprentissage/TrophéesView'));

// Composant de chargement
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="text-4xl mb-4 animate-spin">⚡</div>
      <div className="text-slate-400 font-semibold uppercase tracking-wide">CHARGEMENT...</div>
    </div>
  </div>
);

const ApprentissageTab = () => {
  const t = useTranslation();
  
  // Sous-onglet actif (matieres par défaut)
  const [currentSubView, setCurrentSubView] = useState('matieres');

  // Émettre un événement lors du changement de sous-vue pour la rotation des images de profil
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('tab-change', { 
      detail: { tab: currentSubView, isSubTab: true } 
    }));
  }, [currentSubView]);

  // Navigation sous-onglets
  const subViews = [
    { id: 'matieres', label: 'Matières', icon: '📚' },
    { id: 'sessions', label: 'Sessions', icon: '⏱️' },
    { id: 'trophees', label: 'Trophées', icon: '🏆' },
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
                className={`gradient-button-premium gradient-button-premium-md rounded-lg flex items-center space-x-2 whitespace-nowrap flex-shrink-0 ${
                  currentSubView === subView.id
                    ? 'gradient-button-premium-variant'
                    : ''
                }`}
              >
                <span className="text-lg">{subView.icon}</span>
                <span>{subView.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Contenu du sous-onglet */}
      <div className="py-6">
        <Suspense fallback={<LoadingFallback />}>
          {renderSubView()}
        </Suspense>
      </div>
      </div>
    </div>
  );
};

export default ApprentissageTab;

