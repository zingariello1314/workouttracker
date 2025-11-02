/**
 * 🔴 FIX #39: Utilitaires pour l'accessibilité (a11y)
 * Fonctions helper pour améliorer l'accessibilité de l'onglet Garmin
 */
import { useCallback } from 'react';

/**
 * Gère la navigation au clavier pour les graphiques
 * Permet de naviguer entre les points de données avec les flèches
 */
export function useKeyboardNavigation(dataLength, onNavigate) {
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        onNavigate(-1); // Point précédent
        break;
      case 'ArrowRight':
        event.preventDefault();
        onNavigate(1); // Point suivant
        break;
      case 'Home':
        event.preventDefault();
        onNavigate(-dataLength); // Premier point
        break;
      case 'End':
        event.preventDefault();
        onNavigate(dataLength); // Dernier point
        break;
      default:
        break;
    }
  }, [dataLength, onNavigate]);

  return { handleKeyDown };
}

/**
 * Crée une description accessible pour un graphique
 */
export function createChartDescription(chartType, dataLength, dateRange) {
  const descriptions = {
    heartRate: `Graphique de la fréquence cardiaque montrant ${dataLength} point(s) de données`,
    bodyBattery: `Graphique du niveau de batterie corporelle montrant ${dataLength} point(s) de données`,
    stress: `Graphique du niveau de stress montrant ${dataLength} point(s) de données`,
    sleep: `Graphique du sommeil montrant ${dataLength} point(s) de données`,
    respiration: `Graphique de la respiration montrant ${dataLength} point(s) de données`
  };
  
  const baseDescription = descriptions[chartType] || `Graphique montrant ${dataLength} point(s) de données`;
  
  if (dateRange) {
    return `${baseDescription} pour la période ${dateRange}`;
  }
  
  return baseDescription;
}

/**
 * Attributs ARIA standards pour les graphiques
 */
export function getChartAriaAttributes(chartId, description, title) {
  return {
    role: 'img',
    'aria-labelledby': `${chartId}-title`,
    'aria-describedby': `${chartId}-description`,
    tabIndex: 0, // Permet la navigation clavier
    ...(title && { 'aria-label': title })
  };
}

/**
 * Attributs ARIA pour les boutons interactifs
 */
export function getButtonAriaAttributes(label, disabled, loading) {
  return {
    'aria-label': label,
    'aria-disabled': disabled || loading,
    ...(loading && { 'aria-busy': true })
  };
}

