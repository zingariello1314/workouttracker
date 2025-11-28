import React, { useMemo } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';

const Navigation = () => {
  const { activeTab, setActiveTab } = useWorkout();
  const t = useTranslation();

  // ✅ OPTIMISATION : Mémoriser les tabs avec traductions pour éviter recalculs
  const tabs = useMemo(() => [
    { id: 'home', labelKey: 'nav.home', icon: '🏠' },
    { id: 'today', labelKey: 'nav.today', icon: '📅' },
    { id: 'data-entry', labelKey: 'nav.dataEntry', icon: '✏️' },
    { id: 'progress', labelKey: 'nav.progress', icon: '📸' },
    { id: 'endurance', labelKey: 'nav.endurance', icon: '🏃' },
    { id: 'calendar', labelKey: 'nav.calendar', icon: '🗓️' },
    { id: 'program', labelKey: 'nav.program', icon: '🎯' },
    { id: 'nutrition', labelKey: 'nav.nutrition', icon: '🥗' },
    { id: 'charts', labelKey: 'nav.charts', icon: '📊' },
    { id: 'stats', labelKey: 'nav.stats', icon: '📈' },
    { id: 'exercises', labelKey: 'nav.exercises', icon: '💪' },
    { id: 'history', labelKey: 'nav.history', icon: '📊' },
    { id: 'predictions', labelKey: 'nav.predictions', icon: '🔮' },
    { id: 'garmin', labelKey: 'nav.garmin', icon: '⌚' },
    { id: 'smart-balancing', labelKey: 'nav.smartBalancing', icon: '🧠' },
    { id: 'coach', labelKey: 'nav.coach', icon: '👁️' },
    { id: 'settings', labelKey: 'nav.settings', icon: '⚙️' }
  ], []);

  return (
    <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex gap-0.5 sm:gap-1 py-2 sm:py-3 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-1 px-1.5 sm:px-3 py-1.5 sm:py-2 rounded-md font-medium 
                transition-all duration-200 whitespace-nowrap text-xs flex-shrink-0
                ${activeTab === tab.id
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
      </div>
    </nav>
  );
};

export default Navigation;