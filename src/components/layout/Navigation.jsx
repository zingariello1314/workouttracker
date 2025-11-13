import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';

const Navigation = () => {
  const { activeTab, setActiveTab } = useWorkout();

  const tabs = [
    { id: 'home', label: 'Accueil', icon: '🏠' },
    { id: 'today', label: "Aujourd'hui", icon: '📅' },
    { id: 'data-entry', label: 'Saisie', icon: '✏️' },
    { id: 'progress', label: 'Suivi Corporel', icon: '📸' },
    { id: 'endurance', label: 'Endurance', icon: '🏃' },
    { id: 'calendar', label: 'Calendrier', icon: '🗓️' },
    { id: 'program', label: 'Programme', icon: '🎯' },
    { id: 'nutrition', label: 'Nutrition', icon: '🥗' },
    { id: 'charts', label: 'Graphiques', icon: '📊' },
    { id: 'stats', label: 'Statistiques', icon: '📈' },
    { id: 'exercises', label: 'Exercices', icon: '💪' },
    { id: 'history', label: 'Historique', icon: '📊' },
    { id: 'predictions', label: 'Prédictions', icon: '🔮' },
    { id: 'garmin', label: 'Garmin', icon: '⌚' },
    { id: 'smart-balancing', label: 'Équilibrage IA', icon: '🧠' },
    { id: 'settings', label: 'Paramètres', icon: '⚙️' }
  ];

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
              <span className="hidden lg:inline text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;