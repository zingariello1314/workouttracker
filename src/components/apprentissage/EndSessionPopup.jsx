/**
 * Composant EndSessionPopup - Popup pour les options après fin de session
 */

import React from 'react';

const EndSessionPopup = React.memo(({ timer, onContinue, onFinish }) => {
  return (
    <div 
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md" 
      style={{ animation: 'overlayFadeIn 0.3s ease-out', willChange: 'opacity' }}
    >
      <div 
        className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-3 border-emerald-500 rounded-[25px] p-12 max-w-md w-full mx-4 backdrop-blur-xl shadow-2xl" 
        style={{ animation: 'popupSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-emerald-400 uppercase tracking-wide mb-2">
            SESSION TERMINÉE
          </h3>
          {timer.currentSubject && (
            <div className="text-lg font-semibold text-slate-300 mb-6">
              {timer.currentSubject.name}
            </div>
          )}
          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={onContinue}
              className="gradient-button-premium gradient-button-premium-md rounded-lg font-bold uppercase tracking-wide"
            >
              CONTINUER
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg font-bold uppercase tracking-wide"
            >
              TERMINER
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

EndSessionPopup.displayName = 'EndSessionPopup';

export default EndSessionPopup;

