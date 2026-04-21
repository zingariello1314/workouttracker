/**
 * Composant EndSessionPopup - Popup pour les options après fin de session
 * Charte : fond noir, contour vert.
 */

import React from 'react';

const EndSessionPopup = React.memo(({ timer, onContinue, onFinish }) => {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md"
      style={{ animation: 'overlayFadeIn 0.3s ease-out', willChange: 'opacity' }}
    >
      <div
        className="bg-black border-2 border-emerald-500/80 rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/15"
        style={{ animation: 'popupSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)', willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-emerald-300 uppercase tracking-wide mb-2">
            SESSION TERMINÉE
          </h3>
          {timer.currentSubject && (
            <div className="text-lg font-semibold text-emerald-100/90 mb-6">
              {timer.currentSubject.name}
            </div>
          )}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              type="button"
              onClick={onContinue}
              className="rounded-lg border-2 border-emerald-400 bg-emerald-500/15 px-4 py-2 font-bold uppercase tracking-wide text-emerald-50 hover:bg-emerald-500/25"
            >
              CONTINUER
            </button>
            <button
              type="button"
              onClick={onFinish}
              className="rounded-lg border border-emerald-600/60 bg-black px-4 py-2 font-bold uppercase tracking-wide text-emerald-200 hover:border-emerald-400"
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
