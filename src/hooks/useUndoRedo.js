/**
 * Hook useUndoRedo - Système undo/redo pour actions destructives
 * Gère une stack d'actions avec limite pour améliorer l'UX
 */

import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 50;

/**
 * Hook pour gérer undo/redo
 * @param {Function} onUndo - Fonction appelée lors d'un undo
 * @param {Function} onRedo - Fonction appelée lors d'un redo
 * @returns {Object} - { undo, redo, canUndo, canRedo, pushAction, clearHistory }
 */
export const useUndoRedo = (onUndo, onRedo) => {
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoingRef = useRef(false);
  const isRedoingRef = useRef(false);

  /**
   * Ajouter une action à l'historique
   * @param {Object} action - { type, data, undoFn, redoFn }
   */
  const pushAction = useCallback((action) => {
    if (isUndoingRef.current || isRedoingRef.current) {
      return; // Ne pas ajouter d'action pendant undo/redo
    }

    setHistory((prev) => {
      // Supprimer les actions après l'index actuel (si on a fait undo)
      const newHistory = prev.slice(0, historyIndex + 1);
      
      // Ajouter la nouvelle action
      newHistory.push({
        ...action,
        timestamp: Date.now(),
      });

      // Limiter la taille de l'historique
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }

      return newHistory;
    });

    setHistoryIndex((prev) => {
      const newIndex = prev + 1;
      return newIndex >= MAX_HISTORY_SIZE ? MAX_HISTORY_SIZE - 1 : newIndex;
    });
  }, [historyIndex]);

  /**
   * Annuler la dernière action
   */
  const undo = useCallback(() => {
    if (historyIndex < 0 || history.length === 0) return;

    isUndoingRef.current = true;
    
    const action = history[historyIndex];
    
    try {
      if (action.undoFn) {
        action.undoFn(action.data);
      } else if (onUndo) {
        onUndo(action);
      }
      
      setHistoryIndex((prev) => prev - 1);
    } catch (error) {
      console.error('[UndoRedo] Erreur lors du undo:', error);
    } finally {
      isUndoingRef.current = false;
    }
  }, [history, historyIndex, onUndo]);

  /**
   * Refaire la dernière action annulée
   */
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    isRedoingRef.current = true;
    
    const nextIndex = historyIndex + 1;
    const action = history[nextIndex];
    
    try {
      if (action.redoFn) {
        action.redoFn(action.data);
      } else if (onRedo) {
        onRedo(action);
      }
      
      setHistoryIndex(nextIndex);
    } catch (error) {
      console.error('[UndoRedo] Erreur lors du redo:', error);
    } finally {
      isRedoingRef.current = false;
    }
  }, [history, historyIndex, onRedo]);

  /**
   * Vider l'historique
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setHistoryIndex(-1);
  }, []);

  const canUndo = historyIndex >= 0 && history.length > 0;
  const canRedo = historyIndex < history.length - 1;

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    pushAction,
    clearHistory,
    historyLength: history.length,
    currentIndex: historyIndex,
  };
};

export default useUndoRedo;

