import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';

const Navigation = () => {
  const { activeTab, setActiveTab } = useWorkout();
  const t = useTranslation();

  // ✅ Regrouper tous les onglets d'entraînement sous un méta-onglet "Sport"
  const sportTabs = useMemo(
    () => [
      { id: 'recap',          labelKey: 'nav.recap',          icon: '🧠' },
      { id: 'today',          labelKey: 'nav.today',          icon: '📅' },
      { id: 'data-entry',     labelKey: 'nav.dataEntry',      icon: '✏️' },
      { id: 'program',        labelKey: 'nav.program',        icon: '🎯' },
      { id: 'addiction-quit', labelKey: 'nav.addictionQuit',  icon: '🚭' },
      { id: 'nutrition',      labelKey: 'nav.nutrition',      icon: '🥗' },
      { id: 'exercises',      labelKey: 'nav.exercises',      icon: '💪' },
      { id: 'progress',       labelKey: 'nav.progress',       icon: '📸' },
      { id: 'endurance',      labelKey: 'nav.endurance',      icon: '🏃' },
      { id: 'calendar',       labelKey: 'nav.calendar',       icon: '🗓️' },
      { id: 'charts',         labelKey: 'nav.charts',         icon: '📊' },
      { id: 'performance-challenges', labelKey: 'nav.performanceChallenges', icon: '🏆' },
      {
        id: 'sport-analytics',
        labelKey: 'nav.sportAnalytics',
        icon: '📉',
      },
      { id: 'garmin',         labelKey: 'nav.garmin',         icon: '⌚' }
    ],
    []
  );

  const sportSubTabs = useMemo(
    () => sportTabs.map((tab) => tab.id),
    [sportTabs]
  );

  const codeTabs = useMemo(
    () => [
      { id: 'code-calendar', labelKey: 'nav.codeCalendar', icon: '📅' },
      { id: 'code-journal', labelKey: 'nav.codeJournal', icon: '📝' },
      { id: 'code-stats', labelKey: 'nav.codeStats', icon: '📈' },
    ],
    []
  );

  const codeSubTabs = useMemo(() => codeTabs.map((tab) => tab.id), [codeTabs]);

  // ✅ Navigation principale : Accueil / Dashboard / Sport / Quêtes / Apprentissage / Livres / Code / Finance / Paramètres
  const tabs = useMemo(
    () => [
    { id: 'home', labelKey: 'nav.home', icon: '🏠' },
    { id: 'dashboard', labelKey: 'nav.dashboard', icon: '📊' },
      { id: 'sport', labelKey: 'nav.sport', icon: '🏋️' },
      { id: 'quests', labelKey: 'nav.quests', icon: '⚡' },
      { id: 'apprentissage', labelKey: 'nav.apprentissage', icon: '📖' },
    { id: 'books', labelKey: 'nav.books', icon: '📚' },
    { id: 'code', labelKey: 'nav.code', icon: '💻' },
    { id: 'finance', labelKey: 'nav.finance', icon: '💰' },
    { id: 'settings', labelKey: 'nav.settings', icon: '⚙️' }
    ],
    []
  );

  const getLastCodeSubTab = () => {
    const stored = localStorage.getItem('code.lastSubTab');
    if (stored && codeSubTabs.includes(stored)) {
      return stored;
    }
    return 'code-calendar';
  };

  const getLastSportSubTab = () => {
    const stored = localStorage.getItem('sport.lastSubTab');
    const legacyToHub = {
      history: 'sport-analytics',
      stats: 'sport-analytics',
      predictions: 'sport-analytics',
      'smart-balancing': 'sport-analytics',
    };
    const id = legacyToHub[stored] || stored;
    if (id && sportSubTabs.includes(id)) {
      return id;
    }
    return 'today';
  };

  const handleClick = (tabId) => {
    if (tabId === 'code') {
      setActiveTab(getLastCodeSubTab());
      return;
    }
    if (tabId === 'sport') {
      // Aller au dernier sous-onglet Sport visité (fallback: Aujourd'hui)
      setActiveTab(getLastSportSubTab());
      return;
    }
    if (tabId === 'home') {
      setActiveTab('home');
      return;
    }
    if (tabId === 'dashboard') {
      setActiveTab('dashboard');
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
    if (tabId === 'code') {
      return codeSubTabs.includes(activeTab);
    }
    return activeTab === tabId;
  };

  return (
    <nav className="fixed top-16 left-0 right-0 z-40 border-b border-white/10" style={{
      background: 'transparent',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Barre principale : Sport / Quêtes / Livres / Paramètres */}
        <div className="flex gap-0.5 sm:gap-1 py-2 sm:py-3 overflow-x-auto scrollbar-hide" role="tablist" aria-label={t('nav.mainTabs')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleClick(tab.id)}
              role="tab"
              aria-selected={isTabActive(tab.id)}
              aria-current={isTabActive(tab.id) ? 'page' : undefined}
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
          <div className="flex gap-1 sm:gap-1.5 pb-2 sm:pb-3 overflow-x-auto scrollbar-hide" role="tablist" aria-label={t('nav.sportTabs')}>
            {sportTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  localStorage.setItem('sport.lastSubTab', tab.id);
                  setActiveTab(tab.id);
                }}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-current={activeTab === tab.id ? 'page' : undefined}
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

        {codeSubTabs.includes(activeTab) && (
          <div className="flex gap-1 sm:gap-1.5 pb-2 sm:pb-3 overflow-x-auto scrollbar-hide" role="tablist" aria-label={t('nav.codeTabs')}>
            {codeTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  localStorage.setItem('code.lastSubTab', tab.id);
                  setActiveTab(tab.id);
                }}
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-current={activeTab === tab.id ? 'page' : undefined}
                className={`
                  flex items-center space-x-1 px-2 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium
                  transition-all duration-200 whitespace-nowrap flex-shrink-0
                  ${
                    activeTab === tab.id
                      ? 'bg-rose-100 text-rose-950 shadow-sm shadow-rose-600/30'
                      : 'text-rose-100/85 bg-black/60 border border-rose-500/45 hover:bg-rose-950/40 hover:text-white'
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