/**
 * 🍞 TOAST PROVIDER
 * 
 * Context Provider pour le système de notifications toast global.
 * Permet d'utiliser les toasts dans toute l'application.
 * 
 * @module ToastProvider
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from './Toast';
import { TOAST_TYPES } from './Toast';

const ToastContext = createContext(null);

/**
 * Hook pour utiliser le système de toast
 * 
 * @returns {Object} Objet contenant les fonctions de toast et le container
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Provider du système de toast
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composants enfants
 * @param {number} props.maxToasts - Nombre maximum de toasts affichés simultanément (défaut: 3)
 */
export const ToastProvider = ({ children, maxToasts = 3 }) => {
  const [toasts, setToasts] = useState([]);

  /**
   * Affiche un toast
   * 
   * @param {string} message - Message à afficher
   * @param {string} type - Type de toast (success, error, warning, info)
   * @param {Object|null} details - Détails optionnels (titre, suggestions)
   * @returns {string} ID du toast créé
   */
  const showToast = useCallback((message, type = TOAST_TYPES.INFO, details = null) => {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    setToasts(prev => {
      // Limiter le nombre de toasts affichés
      const newToasts = [...prev, { id, message, type, details }];
      if (newToasts.length > maxToasts) {
        // Retirer les plus anciens
        return newToasts.slice(-maxToasts);
      }
      return newToasts;
    });
    
    return id;
  }, [maxToasts]);

  /**
   * Supprime un toast
   * 
   * @param {string} id - ID du toast à supprimer
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Affiche un toast de succès
   * 
   * @param {string} message - Message de succès
   */
  const showSuccess = useCallback((message) => {
    return showToast(message, TOAST_TYPES.SUCCESS);
  }, [showToast]);

  /**
   * Affiche un toast d'erreur
   * 
   * @param {string} message - Message d'erreur
   * @param {Object|null} details - Détails optionnels (titre, suggestions)
   */
  const showError = useCallback((message, details = null) => {
    return showToast(message, TOAST_TYPES.ERROR, details);
  }, [showToast]);

  /**
   * Affiche un toast d'avertissement
   * 
   * @param {string} message - Message d'avertissement
   * @param {Object|null} details - Détails optionnels
   */
  const showWarning = useCallback((message, details = null) => {
    return showToast(message, TOAST_TYPES.WARNING, details);
  }, [showToast]);

  /**
   * Affiche un toast d'information
   * 
   * @param {string} message - Message d'information
   */
  const showInfo = useCallback((message) => {
    return showToast(message, TOAST_TYPES.INFO);
  }, [showToast]);

  /**
   * Composant container pour afficher les toasts
   */
  const ToastContainer = () => (
    <div 
      className="fixed top-4 right-4 z-[9999] space-y-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            id={toast.id}
            message={toast.message}
            type={toast.type}
            onClose={removeToast}
            details={toast.details}
          />
        </div>
      ))}
    </div>
  );

  const value = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
    ToastContainer
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export default ToastProvider;


