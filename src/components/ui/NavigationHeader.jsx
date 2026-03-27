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
    <header className="relative z-10 flex flex-row md:flex-row md:justify-between md:items-center px-3 pt-1 pb-2 md:p-8 gap-2 md:gap-0 flex-shrink-0">
      {/* Logo et informations */}
      <div className="flex flex-col items-center justify-start flex-shrink-0 -ml-0 md:-ml-8 mr-1 md:mr-8 mt-0 md:-mt-24" role="banner">
        <img 
          src="/logo.png" 
          alt="Momentum application logo" 
          className="w-8 h-8 md:w-24 md:h-24 rounded-xl md:rounded-2xl opacity-95 drop-shadow-2xl translate-y-0 md:translate-y-[55px]"
          role="img"
        />
      </div>

      {/* Navigation en une seule ligne – version simplifiée */}
      <nav
        className="w-full md:w-auto flex items-center md:justify-end overflow-visible"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-4 md:flex md:flex-nowrap gap-1.5 md:gap-0 md:space-x-2 text-white text-xs md:text-base font-medium w-full md:w-auto px-0.5">
          {/* Accueil */}
          <button 
            onClick={() => navigateToTab('home')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Home page"
          >
            {t('nav.home')}
          </button>
          {/* Dashboard */}
          <button 
            onClick={() => navigateToTab('dashboard')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Dashboard"
          >
            {t('nav.dashboard')}
          </button>
          {/* Sport regroupe tous les onglets d'entraînement (Today, Saisie, Programme, etc.) */}
          <button 
            onClick={() => navigateToTab('today')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Sport section"
          >
            {t('nav.sport')}
          </button>
          {/* QuietQuest – Quêtes */}
          <button 
            onClick={() => navigateToTab('quests')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Quests section"
          >
            {t('nav.quests')}
          </button>
          {/* Apprentissage */}
          <button 
            onClick={() => navigateToTab('apprentissage')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Learning section"
          >
            {t('nav.apprentissage')}
          </button>
          {/* Livres */}
          <button 
            onClick={() => navigateToTab('books')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Books section"
          >
            {t('nav.books')}
          </button>
          {/* Finance */}
          <button 
            onClick={() => navigateToTab('finance')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Finance section"
          >
            {t('nav.finance')}
          </button>
          {/* Paramètres */}
          <button 
            onClick={() => navigateToTab('settings')}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
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
