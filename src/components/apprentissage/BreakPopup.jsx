/**
 * Composant BreakPopup - Popup pour proposer une pause après une session
 */

import React from 'react';
import { TIMER_DEFAULTS } from '../../utils/apprentissageConstants';

const BreakPopup = React.memo(({ timer, onStartBreak, onSkipBreak }) => {
  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-[overlayFadeIn_0.3s_ease-out]"
      style={{ willChange: 'opacity' }}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-3 border-orange-500 rounded-[25px] p-12 max-w-md w-full mx-4 backdrop-blur-xl shadow-2xl animate-[popupSlideIn_0.4s_cubic-bezier(0.16,1,0.3,1)]"
        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🍫</div>
          <h3 className="text-2xl font-bold text-orange-400 uppercase tracking-wide mb-2">
            TEMPS DE PAUSE
          </h3>
          <div className="text-xl font-semibold text-slate-300 mb-4">
            {timer.breakDuration / 60} MIN
          </div>
          <p className="text-slate-400 mb-6">Repose-toi bien !</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={onStartBreak}
              className="px-6 py-3 bg-gradient-to-r from-orange-500/20 to-amber-500/20 border-2 border-orange-500 rounded-lg text-orange-400 font-bold uppercase tracking-wide hover:from-orange-500/30 hover:to-amber-500/30 hover:scale-105 transition-transform duration-200"
              style={{ willChange: 'transform' }}
            >
              DÉMARRER PAUSE
            </button>
            <button
              onClick={onSkipBreak}
              className="px-6 py-3 bg-slate-800/50 border-2 border-slate-600 rounded-lg text-slate-300 font-bold uppercase tracking-wide hover:bg-slate-700/50 hover:scale-105 transition-transform duration-200"
              style={{ willChange: 'transform' }}
            >
              PASSER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

BreakPopup.displayName = 'BreakPopup';

export default BreakPopup;

