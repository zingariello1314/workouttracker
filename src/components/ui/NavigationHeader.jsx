import React from 'react';
import { Lock } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useAppLock } from '../../context/AppLockContext';
import { useTranslation } from '../../utils/translations';

/**
 * NavigationHeader - Header de navigation réutilisable
 * Affiche le logo et les boutons de navigation entre les différents onglets
 */
const NavigationHeader = () => {
  const { setActiveTab } = useWorkout();
  const { isAuthenticated } = useAuth();
  const { lockReady, lockNow } = useAppLock();
  const t = useTranslation();

  const navigateToTab = (tabId) => {
    setTimeout(() => {
      setActiveTab(tabId);
    }, 200);
  };

  return (
    <header className="relative z-10 flex flex-row md:flex-row md:justify-between md:items-center px-3 pt-1 pb-2 md:p-8 gap-2 md:gap-0 flex-shrink-0">
      {/* Logo + verrou (même flux que l’écran Paramètres / Header : le PIN ne s’ouvre qu’après ce bouton) */}
      <div className="flex flex-shrink-0 items-start gap-2 -ml-0 md:-ml-8 mr-1 md:mr-8 mt-0 md:-mt-24" role="banner">
        <div className="flex flex-col items-center justify-start">
          <img
            src="/logo.png"
            alt="Momentum application logo"
            className="w-8 h-8 md:w-24 md:h-24 rounded-xl md:rounded-2xl opacity-95 drop-shadow-2xl translate-y-0 md:translate-y-[55px]"
            role="img"
          />
        </div>
        {isAuthenticated && lockReady ? (
          <button
            type="button"
            onClick={lockNow}
            className="mt-1 md:mt-[60px] shrink-0 rounded-xl border border-white/15 bg-white/5 p-2 text-slate-100 backdrop-blur-md transition hover:border-sky-400/40 hover:bg-white/10 hover:text-white md:p-2.5"
            title={t('nav.lockApp')}
            aria-label={t('nav.lockAppAria')}
          >
            <Lock className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      {/* Navigation en une seule ligne – version simplifiée */}
      <nav
        className="w-full md:w-auto flex items-center md:justify-end overflow-visible"
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:flex-nowrap gap-1.5 md:gap-0 md:space-x-2 text-white text-xs md:text-base font-medium w-full md:w-auto px-0.5">
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
          {/* Code (même ordre que la barre principale : avant Finance) */}
          <button
            onClick={() => {
              const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('code.lastSubTab') : null;
              const next =
                stored === 'code-journal' || stored === 'code-calendar' || stored === 'code-stats' ? stored : 'code-calendar';
              navigateToTab(next);
            }}
            className="w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap"
            aria-label="Navigate to Code section"
          >
            {t('nav.code')}
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
