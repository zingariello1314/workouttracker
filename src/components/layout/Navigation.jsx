import React from 'react';
import { useWorkout } from '../../context/WorkoutContext';

const Navigation = () => {
  const { activeTab, setActiveTab } = useWorkout();

  const tabs = [
    { id: 'today', label: "Aujourd'hui", icon: '📅' },
    { id: 'progress', label: 'Suivi Corporel', icon: '📸' },
    { id: 'calendar', label: 'Calendrier', icon: '🗓️' },
    { id: 'charts', label: 'Graphiques', icon: '📊' },
    { id: 'stats', label: 'Statistiques', icon: '📈' },
    { id: 'exercises', label: 'Exercices', icon: '💪' },
    { id: 'history', label: 'Historique', icon: '📋' }
  ];

  return (
    <nav className="bg-slate-800/90 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 overflow-x-auto py-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-lg font-medium 
                transition-all duration-200 whitespace-nowrap flex-shrink-0
                ${activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25 transform scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50 hover:scale-102'
                }
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;