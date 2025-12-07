/**
 * Modes Adaptatifs - 4 modes contextuels avec transitions fluides
 * Stratégie | Tactique | Exécution | Analysis
 */

import { useState, useEffect, useCallback } from 'react';
import { BarChart3, Target, Zap, Activity, ChevronRight } from 'lucide-react';

const MODES = [
  {
    id: 'strategie',
    nom: 'Stratégie',
    icon: BarChart3,
    description: 'Vue d\'ensemble et planification long terme',
    color: 'purple'
  },
  {
    id: 'tactique',
    nom: 'Tactique',
    icon: Target,
    description: 'Planification de liste de courses',
    color: 'blue'
  },
  {
    id: 'execution',
    nom: 'Exécution',
    icon: Zap,
    description: 'Mode courses en magasin',
    color: 'green'
  },
  {
    id: 'analysis',
    nom: 'Analysis',
    icon: Activity,
    description: 'Analytics et performance',
    color: 'orange'
  }
];

const ModesAdaptatifs = ({ modeActuel, onChangeMode, children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [savedContexts, setSavedContexts] = useState({});

  // ==========================================================================
  // CONTEXT MANAGEMENT
  // ==========================================================================

  const saveContext = useCallback((mode, context) => {
    setSavedContexts(prev => ({
      ...prev,
      [mode]: {
        ...context,
        timestamp: Date.now()
      }
    }));

    // Persist to localStorage
    try {
      const key = `smartshopping_context_${mode}`;
      localStorage.setItem(key, JSON.stringify({
        ...context,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error saving context:', error);
    }
  }, []);

  const loadContext = useCallback((mode) => {
    // Try memory first
    if (savedContexts[mode]) {
      return savedContexts[mode];
    }

    // Try localStorage
    try {
      const key = `smartshopping_context_${mode}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const context = JSON.parse(stored);
        setSavedContexts(prev => ({
          ...prev,
          [mode]: context
        }));
        return context;
      }
    } catch (error) {
      console.error('Error loading context:', error);
    }

    return null;
  }, [savedContexts]);

  // ==========================================================================
  // MODE TRANSITION
  // ==========================================================================

  const handleModeChange = useCallback(async (newMode) => {
    if (newMode === modeActuel || isTransitioning) return;

    setIsTransitioning(true);

    // Animation sortie
    await new Promise(resolve => setTimeout(resolve, 200));

    // Changer mode
    onChangeMode(newMode);

    // Charger contexte
    loadContext(newMode);

    // Animation entrée
    await new Promise(resolve => setTimeout(resolve, 200));

    setIsTransitioning(false);
  }, [modeActuel, isTransitioning, onChangeMode, loadContext]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const currentMode = MODES.find(m => m.id === modeActuel);
  const Icon = currentMode?.icon || BarChart3;

  return (
    <div className="modes-adaptatifs">
      {/* Mode Selector */}
      <div className="mb-6 relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className={`p-2 bg-${currentMode?.color}-500/20 rounded-xl`}>
                  <Icon className={`w-6 h-6 text-${currentMode?.color}-400`} />
                </div>
                Mode: {currentMode?.nom}
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                {currentMode?.description}
              </p>
            </div>
          </div>

          {/* Mode Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {MODES.map(mode => {
              const ModeIcon = mode.icon;
              const isActive = mode.id === modeActuel;
              
              return (
                <button
                  key={mode.id}
                  onClick={() => handleModeChange(mode.id)}
                  disabled={isTransitioning}
                  className={`group relative overflow-hidden p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? `bg-gradient-to-br from-${mode.color}-500/20 to-${mode.color}-600/20 border-${mode.color}-500/50 shadow-lg shadow-${mode.color}-500/20`
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50'
                  } ${isTransitioning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="relative">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`p-2 rounded-lg ${
                        isActive ? `bg-${mode.color}-500/20` : 'bg-slate-700/50'
                      }`}>
                        <ModeIcon className={`w-6 h-6 ${
                          isActive ? `text-${mode.color}-400` : 'text-slate-400'
                        } transition-transform duration-300 ${
                          isActive ? 'rotate-12' : 'group-hover:rotate-12'
                        }`} />
                      </div>
                      <div className={`text-sm font-semibold ${
                        isActive ? `text-${mode.color}-400` : 'text-slate-400'
                      }`}>
                        {mode.nom}
                      </div>
                    </div>
                    
                    {isActive && (
                      <div className="absolute -top-1 -right-1">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Transition Indicator */}
          {isTransitioning && (
            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <div className="text-sm text-slate-400">Changement de mode...</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode Content with Transition */}
      <div
        className={`mode-content transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {children}
      </div>

      {/* Mode Info Bar */}
      <div className="mt-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <div className={`w-2 h-2 bg-${currentMode?.color}-400 rounded-full animate-pulse`}></div>
            <span>Mode actif: <span className="text-white font-semibold">{currentMode?.nom}</span></span>
          </div>
          
          {savedContexts[modeActuel] && (
            <div className="text-slate-500 text-xs">
              Contexte sauvegardé: {new Date(savedContexts[modeActuel].timestamp).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModesAdaptatifs;
