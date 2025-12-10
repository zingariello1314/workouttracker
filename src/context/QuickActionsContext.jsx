/**
 * Context pour gérer les actions rapides de la sidebar
 * Gère notamment les sessions Pomodoro et les actions rapides
 * 
 * @module context/QuickActionsContext
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';

const QuickActionsContext = createContext();

/**
 * Provider pour les actions rapides
 */
export const QuickActionsProvider = ({ children }) => {
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(0);
  const [pomodoroInitialTime, setPomodoroInitialTime] = useState(0);
  const intervalRef = useRef(null);

  /**
   * Démarre une session Pomodoro
   * @param {number} minutes - Durée en minutes
   */
  const startPomodoroSession = useCallback((minutes = 25) => {
    // Arrêter le timer existant si présent
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    const seconds = minutes * 60;
    setPomodoroActive(true);
    setPomodoroTimeLeft(seconds);
    setPomodoroInitialTime(seconds);

    // Démarrer le timer
    intervalRef.current = setInterval(() => {
      setPomodoroTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setPomodoroActive(false);
          
          // Notification de fin
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('QuietQuest', {
              body: 'Session Pomodoro terminée ! 🎉',
              icon: '/logo.png'
            });
          }
          
          // Jouer un son si disponible
          try {
            const audio = new Audio('/sounds/pomodoro-complete.mp3');
            audio.play().catch(() => {
              // Ignorer si le son ne peut pas être joué
            });
          } catch (error) {
            // Ignorer les erreurs de son
          }
          
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  /**
   * Arrête la session Pomodoro en cours
   */
  const stopPomodoroSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setPomodoroActive(false);
    setPomodoroTimeLeft(0);
    setPomodoroInitialTime(0);
  }, []);

  /**
   * Met en pause la session Pomodoro
   */
  const pausePomodoroSession = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setPomodoroActive(false);
    }
  }, []);

  /**
   * Reprend la session Pomodoro
   */
  const resumePomodoroSession = useCallback(() => {
    if (pomodoroTimeLeft > 0 && !pomodoroActive) {
      setPomodoroActive(true);
      
      intervalRef.current = setInterval(() => {
        setPomodoroTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setPomodoroActive(false);
            
            // Notification de fin
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('QuietQuest', {
                body: 'Session Pomodoro terminée ! 🎉',
                icon: '/logo.png'
              });
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [pomodoroTimeLeft, pomodoroActive]);

  /**
   * Formate le temps restant en MM:SS
   */
  const formatTimeLeft = useCallback(() => {
    const minutes = Math.floor(pomodoroTimeLeft / 60);
    const seconds = pomodoroTimeLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [pomodoroTimeLeft]);

  /**
   * Calcule le pourcentage de progression
   */
  const getProgress = useCallback(() => {
    if (pomodoroInitialTime === 0) return 0;
    return ((pomodoroInitialTime - pomodoroTimeLeft) / pomodoroInitialTime) * 100;
  }, [pomodoroTimeLeft, pomodoroInitialTime]);

  // Cleanup à la destruction
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const value = {
    // État
    pomodoroActive,
    pomodoroTimeLeft,
    pomodoroInitialTime,
    
    // Actions
    startPomodoroSession,
    stopPomodoroSession,
    pausePomodoroSession,
    resumePomodoroSession,
    
    // Helpers
    formatTimeLeft,
    getProgress
  };

  return (
    <QuickActionsContext.Provider value={value}>
      {children}
    </QuickActionsContext.Provider>
  );
};

/**
 * Hook pour utiliser le contexte des actions rapides
 * @returns {Object} Contexte des actions rapides
 * @throws {Error} Si utilisé en dehors du provider
 */
export const useQuickActions = () => {
  const context = useContext(QuickActionsContext);
  if (!context) {
    throw new Error('useQuickActions must be used within QuickActionsProvider');
  }
  return context;
};

export default QuickActionsContext;
