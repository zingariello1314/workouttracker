import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';

/**
 * NavigationHeader - Header de navigation réutilisable
 * Affiche le logo et les boutons de navigation entre les différents onglets
 */
const NavigationHeader = () => {
  const { setActiveTab } = useWorkout();
  const t = useTranslation();

  const navigateToTab = (tabId) => {
    setTimeout(() => {
      setActiveTab(tabId);
    }, 200);
  };

  return (
    <header className="relative z-10 flex justify-between items-center p-8 flex-shrink-0">
      {/* Logo et informations */}
      <div className="flex flex-col items-center space-y-0.5 -ml-8 mr-8 -mt-24" role="banner">
        <img 
          src="/logo.png" 
          alt="Momentum application logo" 
          className="w-24 h-24 rounded-2xl opacity-95 drop-shadow-2xl"
          style={{ transform: 'translateY(55px)' }}
          role="img"
        />
      </div>

      {/* Navigation en une seule ligne – version simplifiée */}
      <nav className="flex items-center space-x-8" role="navigation" aria-label="Main navigation">
        <div className="flex space-x-2 text-white text-base font-medium">
          {/* Accueil */}
          <button 
            onClick={() => navigateToTab('home')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Home page"
          >
            {t('nav.home')}
          </button>
          {/* Sport regroupe tous les onglets d'entraînement (Today, Saisie, Programme, etc.) */}
          <button 
            onClick={() => navigateToTab('today')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Sport section"
          >
            {t('nav.sport')}
          </button>
          {/* QuietQuest – Quêtes */}
          <button 
            onClick={() => navigateToTab('quests')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Quests section"
          >
            {t('nav.quests')}
          </button>
          {/* Apprentissage */}
          <button 
            onClick={() => navigateToTab('apprentissage')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Learning section"
          >
            {t('nav.apprentissage')}
          </button>
          {/* Livres */}
          <button 
            onClick={() => navigateToTab('books')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Books section"
          >
            {t('nav.books')}
          </button>
          {/* Finance */}
          <button 
            onClick={() => navigateToTab('finance')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Finance section"
          >
            {t('nav.finance')}
          </button>
          {/* Paramètres */}
          <button 
            onClick={() => navigateToTab('settings')}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-4 py-3 rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Settings"
          >
            {t('nav.settings')}
          </button>
        </div>
      </nav>
    </header>
  );
};

export default NavigationHeader;
