import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';

const Navigation = () => {
  const { activeTab, setActiveTab } = useWorkout();
  const t = useTranslation();

  // ✅ Regrouper tous les onglets d'entraînement sous un méta-onglet "Sport"
  const sportTabs = useMemo(
    () => [
      { id: 'today',          labelKey: 'nav.today',          icon: '📅' },
      { id: 'data-entry',     labelKey: 'nav.dataEntry',      icon: '✏️' },
      { id: 'program',        labelKey: 'nav.program',        icon: '🎯' },
      { id: 'nutrition',      labelKey: 'nav.nutrition',      icon: '🥗' },
      { id: 'exercises',      labelKey: 'nav.exercises',      icon: '💪' },
      { id: 'progress',       labelKey: 'nav.progress',       icon: '📸' },
      { id: 'endurance',      labelKey: 'nav.endurance',      icon: '🏃' },
      { id: 'calendar',       labelKey: 'nav.calendar',       icon: '🗓️' },
      { id: 'history',        labelKey: 'nav.history',        icon: '📊' },
      { id: 'charts',         labelKey: 'nav.charts',         icon: '📊' },
      { id: 'stats',          labelKey: 'nav.stats',          icon: '📈' },
      { id: 'predictions',    labelKey: 'nav.predictions',    icon: '🔮' },
      { id: 'smart-balancing',labelKey: 'nav.smartBalancing', icon: '🧠' },
      { id: 'garmin',         labelKey: 'nav.garmin',         icon: '⌚' }
    ],
    []
  );

  const sportSubTabs = useMemo(
    () => sportTabs.map((tab) => tab.id),
    [sportTabs]
  );

  // ✅ Navigation principale : Accueil / Sport / Quêtes / Apprentissage / Livres / Paramètres
  const tabs = useMemo(
    () => [
    { id: 'home', labelKey: 'nav.home', icon: '🏠' },
      { id: 'sport', labelKey: 'nav.sport', icon: '🏋️' },
      { id: 'quests', labelKey: 'nav.quests', icon: '⚡' },
      { id: 'apprentissage', labelKey: 'nav.apprentissage', icon: '📖' },
    { id: 'books', labelKey: 'nav.books', icon: '📚' },
    { id: 'settings', labelKey: 'nav.settings', icon: '⚙️' }
    ],
    []
  );

  const handleClick = (tabId) => {
    if (tabId === 'sport') {
      // Pour l'instant, le cœur du sport reste l'onglet "Aujourd'hui"
      setActiveTab('today');
      return;
    }
    if (tabId === 'home') {
      setActiveTab('home');
      return;
    }
    setActiveTab(tabId);
  };

  const isTabActive = (tabId) => {
    if (tabId === 'home') {
      return activeTab === 'home';
    }
    if (tabId === 'sport') {
      return sportSubTabs.includes(activeTab);
    }
    return activeTab === tabId;
  };

  return (
    <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Barre principale : Sport / Quêtes / Livres / Paramètres */}
        <div className="flex gap-0.5 sm:gap-1 py-2 sm:py-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleClick(tab.id)}
              className={`
                flex items-center space-x-1 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium 
                transition-all duration-200 whitespace-nowrap text-xs flex-shrink-0
                ${isTabActive(tab.id)
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }
              `}
            >
              <span className="text-sm">{tab.icon}</span>
              <span className="hidden lg:inline text-xs">{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>

        {/* Sous-barre Sport : visible uniquement quand on est dans une vue sport */}
        {sportSubTabs.includes(activeTab) && (
          <div className="flex gap-1 sm:gap-1.5 pb-2 sm:pb-3 overflow-x-auto scrollbar-hide">
            {sportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium
                  transition-all duration-200 whitespace-nowrap flex-shrink-0
                  ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-slate-900 shadow-sm shadow-blue-500/30'
                      : 'text-slate-200/80 bg-slate-800/70 border border-slate-600/60 hover:bg-slate-700/80 hover:text-white'
                  }
                `}
              >
                <span className="text-xs">{tab.icon}</span>
                <span>{t(tab.labelKey)}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;