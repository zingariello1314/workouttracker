/**
 * Utilitaires pour QuestsTab
 * 
 * ✅ PHASE 4 : Extraction des utilitaires
 * 
 * @module components/tabs/QuestsTab/utils
 */

/**
 * Formatage durée (ex : 90 → "1h30")
 * @param {number} minutes - Durée en minutes
 * @returns {string} Durée formatée
 */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0 min';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  if (!m) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
};
