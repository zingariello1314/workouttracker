/**
 * Hook pour gérer les raccourcis clavier dans le module Apprentissage
 * Améliore l'accessibilité et l'ergonomie
 */

import { useEffect, useCallback } from 'react';

/**
 * Raccourcis clavier pour le module Apprentissage
 */
const SHORTCUTS = {
  // Timer
  SPACE: 'pause/resume',
  S: 'start',
  E: 'stop',
  
  // Navigation
  ARROW_LEFT: 'previous',
  ARROW_RIGHT: 'next',
  
  // Actions
  DELETE: 'delete',
  ESCAPE: 'cancel',
};

/**
 * Hook pour gérer les raccourcis clavier
 */
export const useKeyboardShortcuts = (handlers, enabled = true) => {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      // Ignorer si on est dans un input/textarea
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toUpperCase();
      const code = event.code;

      // Espace = Pause/Reprendre
      if (key === ' ' && handlers.onPauseResume) {
        event.preventDefault();
        handlers.onPauseResume();
        return;
      }

      // S = Start
      if (key === 'S' && handlers.onStart) {
        event.preventDefault();
        handlers.onStart();
        return;
      }

      // E = Stop/End
      if (key === 'E' && handlers.onStop) {
        event.preventDefault();
        handlers.onStop();
        return;
      }

      // Flèches = Navigation
      if (code === 'ArrowLeft' && handlers.onPrevious) {
        event.preventDefault();
        handlers.onPrevious();
        return;
      }

      if (code === 'ArrowRight' && handlers.onNext) {
        event.preventDefault();
        handlers.onNext();
        return;
      }

      // Delete = Supprimer
      if (key === 'DELETE' && handlers.onDelete) {
        event.preventDefault();
        handlers.onDelete();
        return;
      }

      // Escape = Annuler
      if (key === 'ESCAPE' && handlers.onCancel) {
        event.preventDefault();
        handlers.onCancel();
        return;
      }
    },
    [handlers, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
};

export default useKeyboardShortcuts;

