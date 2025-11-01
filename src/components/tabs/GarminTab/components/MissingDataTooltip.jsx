import React from 'react';
import { HelpCircle } from 'lucide-react';

/**
 * 🟡 FIX #18 : Composant réutilisable pour afficher des tooltips explicatifs sur données manquantes
 * Distingue entre "pas de données" et "données non parsées"
 */
export function MissingDataTooltip({ 
  children, 
  message = "Aucune donnée disponible. Cette métrique nécessite une synchronisation avec votre montre Garmin.",
  isParsed = true,
  position = 'top'
}) {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const tooltipRef = React.useRef(null);

  // Position tooltip selon prop
  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-t-transparent border-b-transparent border-l-transparent'
  };

  return (
    <div 
      className="relative inline-flex items-center group"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      ref={tooltipRef}
    >
      {children}
      {showTooltip && (
        <div
          className={`absolute ${positionClasses[position]} z-50 pointer-events-none`}
          style={{ minWidth: '200px', maxWidth: '300px' }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl">
            <div className="flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-slate-300">
                <p className="mb-1">{message}</p>
                {!isParsed && (
                  <p className="text-slate-400 italic">
                    Note: Données présentes mais non parsées correctement.
                  </p>
                )}
              </div>
            </div>
            <div className={`absolute ${arrowClasses[position]} w-0 h-0 border-4`} />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Wrapper simplifié pour afficher "—" avec tooltip
 */
export function MissingValue({ message, isParsed = true, position = 'top' }) {
  return (
    <MissingDataTooltip message={message} isParsed={isParsed} position={position}>
      <span className="text-slate-500 cursor-help">—</span>
    </MissingDataTooltip>
  );
}
