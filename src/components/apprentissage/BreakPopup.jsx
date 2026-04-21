/**
 * Composant BreakPopup - Popup pour proposer une pause après une session
 * Charte : fond noir, contour vert.
 */

import React from 'react';

const BreakPopup = React.memo(({ timer, onStartBreak, onSkipBreak }) => {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-md animate-[overlayFadeIn_0.3s_ease-out]"
      style={{ willChange: 'opacity' }}
    >
      <div
        className="bg-black border-2 border-emerald-500/80 rounded-2xl p-10 max-w-md w-full mx-4 shadow-2xl shadow-emerald-500/15 animate-[popupSlideIn_0.4s_cubic-bezier(0.16,1,0.3,1)]"
        style={{ willChange: 'transform, opacity', transform: 'translateZ(0)' }}
      >
        <div className="text-center">
          <div className="text-5xl mb-4">🍫</div>
          <h3 className="text-2xl font-bold text-emerald-300 uppercase tracking-wide mb-2">
            TEMPS DE PAUSE
          </h3>
          <div className="text-xl font-semibold text-emerald-100 mb-4">
            {timer.breakDuration / 60} MIN
          </div>
          <p className="text-emerald-200/70 mb-6">Repose-toi bien !</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              type="button"
              onClick={onStartBreak}
              className="rounded-lg border-2 border-emerald-400 bg-emerald-500/15 px-4 py-2 font-bold uppercase tracking-wide text-emerald-50 hover:bg-emerald-500/25"
            >
              DÉMARRER PAUSE
            </button>
            <button
              type="button"
              onClick={onSkipBreak}
              className="rounded-lg border border-emerald-600/60 bg-black px-4 py-2 font-bold uppercase tracking-wide text-emerald-200 hover:border-emerald-400"
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
