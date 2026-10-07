import React, { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useAppLock } from '../../context/AppLockContext';
import { useTranslation } from '../../utils/translations';
import {
  getAppliedHomeLayout,
  HOME_NAV_TAB_LABELS,
  resolveHomeAccentHex,
  subscribeHomeAppearance
} from '../../utils/homeAppearancePreference';
import './homeNavAppearance.css';

const TAB_ARIA = {
  home: 'Navigate to Home page',
  dashboard: 'Navigate to Dashboard',
  today: 'Navigate to Sport section',
  quests: 'Navigate to Quests section',
  apprentissage: 'Navigate to Learning section',
  rubiks: "Navigate to Rubik's cube",
  books: 'Navigate to Books section',
  code: 'Navigate to Code section',
  finance: 'Navigate to Finance section',
  settings: 'Navigate to Settings'
};

/**
 * NavigationHeader - Header de navigation réutilisable
 * Sans config appliquée : rendu stock (inchangé).
 * Avec config : styles / ordre / disposition personnalisés.
 */
const NavigationHeader = ({ activeTabOverride = null, previewConfig = null } = {}) => {
  const { setActiveTab, activeTab } = useWorkout();
  const { isAuthenticated } = useAuth();
  const { lockReady, lockNow } = useAppLock();
  const t = useTranslation();
  const [applied, setApplied] = useState(() => getAppliedHomeLayout());

  useEffect(() => {
    if (previewConfig) return undefined;
    return subscribeHomeAppearance((store) => setApplied(store.active));
  }, [previewConfig]);

  const layout = previewConfig || applied;
  const currentTab = activeTabOverride ?? activeTab;

  const navigateToTab = (tabId) => {
    if (previewConfig) return;
    if (tabId === 'code') {
      const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('code.lastSubTab') : null;
      const next =
        stored === 'code-journal' || stored === 'code-calendar' || stored === 'code-stats'
          ? stored
          : 'code-calendar';
      setTimeout(() => setActiveTab(next), 200);
      return;
    }
    setTimeout(() => setActiveTab(tabId), 200);
  };

  const labelFor = (id) => {
    const map = {
      home: t('nav.home'),
      dashboard: t('nav.dashboard'),
      today: t('nav.sport'),
      quests: t('nav.quests'),
      apprentissage: t('nav.apprentissage'),
      rubiks: t('nav.rubiks'),
      books: t('nav.books'),
      code: t('nav.code'),
      finance: t('nav.finance'),
      settings: t('nav.settings')
    };
    return map[id] || HOME_NAV_TAB_LABELS[id] || id;
  };

  const isActive = (id) => {
    if (id === 'code') {
      return (
        currentTab === 'code' ||
        currentTab === 'code-journal' ||
        currentTab === 'code-calendar' ||
        currentTab === 'code-stats'
      );
    }
    if (id === 'today') {
      return [
        'today',
        'calendar',
        'recap',
        'program',
        'exercises',
        'nutrition',
        'endurance',
        'progress',
        'garmin',
        'charts',
        'performance-challenges',
        'sport-analytics',
        'data-entry'
      ].includes(currentTab);
    }
    return currentTab === id;
  };

  const stockButtonClass =
    'w-full md:w-auto bg-white/5 backdrop-blur-2xl border border-white/10 text-white px-2 py-2 md:px-4 md:py-3 rounded-xl md:rounded-2xl transition-all duration-500 hover:bg-white/15 hover:border-white/25 hover:shadow-2xl hover:shadow-white/10 hover:scale-105 whitespace-nowrap';

  const stockTabs = [
    'home',
    'dashboard',
    'today',
    'quests',
    'apprentissage',
    'rubiks',
    'books',
    'code',
    'finance',
    'settings'
  ];

  /* Config appliquée : nav ancrée en absolute à droite pour que wrap/colonne
     ne poussent pas la citation ni le footer. Stock : flux inchangé. */
  const anchoredNav = Boolean(layout);

  return (
    <header
      className={`relative z-10 flex flex-shrink-0 flex-row items-start gap-2 px-3 pt-1 pb-2 md:items-center md:gap-0 md:p-8 ${
        anchoredNav ? 'md:min-h-[7.5rem]' : 'md:justify-between'
      }`}
    >
      <div
        className="mt-0 flex flex-shrink-0 items-start gap-2 -ml-0 mr-1 md:-ml-8 md:-mt-24 md:mr-8"
        role="banner"
      >
        <div className="flex flex-col items-center justify-start">
          <img
            src="/logo.png"
            alt="Momentum application logo"
            className="h-8 w-8 rounded-xl opacity-95 drop-shadow-2xl md:h-24 md:w-24 md:translate-y-[55px] md:rounded-2xl"
            role="img"
          />
        </div>
        {isAuthenticated && lockReady && !previewConfig ? (
          <button
            type="button"
            onClick={lockNow}
            className="mt-1 shrink-0 rounded-xl border border-white/15 bg-white/5 p-2 text-slate-100 backdrop-blur-md transition hover:border-sky-400/40 hover:bg-white/10 hover:text-white md:mt-[60px] md:p-2.5"
            title={t('nav.lockApp')}
            aria-label={t('nav.lockAppAria')}
          >
            <Lock className="h-4 w-4 md:h-5 md:w-5" aria-hidden />
          </button>
        ) : null}
      </div>

      <nav
        className={
          anchoredNav
            ? 'absolute right-3 top-1 z-20 flex max-w-[min(100%-1.5rem,42rem)] justify-end overflow-visible md:right-8 md:top-6'
            : 'flex w-full items-center overflow-visible md:w-auto md:justify-end'
        }
        role="navigation"
        aria-label="Main navigation"
      >
        {layout ? (
          <div
            className="home-nav-root text-xs font-medium text-white md:text-base px-0.5"
            data-style={layout.navStyle || 'verre'}
            data-layout={layout.navLayout || 'row'}
            style={{ '--home-nav-ac': resolveHomeAccentHex(layout) }}
          >
            <div className="home-nav-list">
              {(layout.navOrder || stockTabs).map((id) => (
                <button
                  key={id}
                  type="button"
                  className="home-nav-btn"
                  data-active={isActive(id) ? 'true' : 'false'}
                  onClick={() => navigateToTab(id)}
                  aria-label={TAB_ARIA[id] || id}
                  aria-current={isActive(id) ? 'page' : undefined}
                >
                  {labelFor(id)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid w-full grid-cols-3 gap-1.5 px-0.5 text-xs font-medium text-white sm:grid-cols-4 md:flex md:w-auto md:flex-nowrap md:gap-0 md:space-x-2 md:text-base">
            {stockTabs.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateToTab(id)}
                className={stockButtonClass}
                aria-label={TAB_ARIA[id] || id}
              >
                {labelFor(id)}
              </button>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
};

export default NavigationHeader;
