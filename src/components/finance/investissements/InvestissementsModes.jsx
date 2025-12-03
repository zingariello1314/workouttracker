import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';

/**
 * Système de modes adaptatifs pour le module Investissements
 * Permet de basculer entre différentes vues selon les besoins
 */

const MODES = {
  OVERVIEW: 'overview',
  DETAIL: 'detail',
  SIMULATION: 'simulation',
  HISTORY: 'history'
};

const InvestissementsModes = ({ children, onModeChange, currentMode }) => {
  const t = useTranslation();
  const [mode, setMode] = useState(currentMode || MODES.OVERVIEW);

  const modes = useMemo(() => [
    {
      id: MODES.OVERVIEW,
      label: 'Vue d\'Ensemble',
      icon: '📊',
      description: 'Dashboard synthétique avec vue 360°'
    },
    {
      id: MODES.DETAIL,
      label: 'Détail Actif',
      icon: '🔍',
      description: 'Drill-down spécialisé par actif'
    },
    {
      id: MODES.SIMULATION,
      label: 'Simulation',
      icon: '🧪',
      description: 'Laboratoire scénarios avec sliders'
    },
    {
      id: MODES.HISTORY,
      label: 'Historique',
      icon: '📈',
      description: 'Analytics temporelles avec annotations'
    }
  ], []);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  return (
    <div className="investissements-modes">
      {/* Sélecteur de modes */}
      <div className="modes-selector flex gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700/50 mb-4">
        {modes.map(m => (
          <button
            key={m.id}
            onClick={() => handleModeChange(m.id)}
            className={`mode-button flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 flex-1
              ${mode === m.id
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white border border-transparent'
              }`}
            title={m.description}
          >
            <span className="text-lg">{m.icon}</span>
            <span className="text-sm font-medium">{m.label}</span>
          </button>
        ))}
      </div>

      {/* Contenu selon le mode */}
      <div className="mode-content">
        {children && typeof children === 'function' ? children(mode) : children}
      </div>
    </div>
  );
};

export default InvestissementsModes;
export { MODES };

