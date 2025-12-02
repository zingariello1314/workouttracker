/**
 * Composant ApprentissageTab - Onglet Apprentissage
 * Système de gestion de l'apprentissage avec 3 sous-onglets : Matières, Sessions, Trophées
 */

import React, { useState } from 'react';
import { useTranslation } from '../../utils/translations';
import MatièresView from '../apprentissage/MatièresView';
import SessionsView from '../apprentissage/SessionsView';
import TrophéesView from '../apprentissage/TrophéesView';

const ApprentissageTab = () => {
  const t = useTranslation();
  
  // Sous-onglet actif (matieres par défaut)
  const [currentSubView, setCurrentSubView] = useState('matieres');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation sous-onglets */}
      <div className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {subViews.map((subView) => (
              <button
                key={subView.id}
                onClick={() => switchToSubView(subView.id)}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-lg font-medium
                  transition-all duration-200 whitespace-nowrap flex-shrink-0
                  ${
                    currentSubView === subView.id
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }
                `}
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
        {renderSubView()}
      </div>
    </div>
  );
};

export default ApprentissageTab;

