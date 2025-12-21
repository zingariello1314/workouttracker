/**
 * Cache et utilitaires pour les calculs de dates dans les graphiques
 * 
 * ✅ SOLUTION 1.10 : Cache des dates calculées pour optimiser les graphiques
 * 
 * Évite les recréations de dates et formats à chaque render.
 * Utilise un cache LRU simple pour les calculs fréquents.
 * 
 * @module utils/chartDateCache
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 1, Solution 1.10
 */

/**
 * Cache simple pour les formats de dates (limite: 100 entrées)
 */
const dateFormatCache = new Map();
const MAX_CACHE_SIZE = 100;

/**
 * Cache pour les clés de mois (format YYYY-MM)
 */
const monthKeyCache = new Map();

/**
 * Obtient la clé de mois depuis une date
 * 
 * ✅ SOLUTION 1.10 : Cache pour éviter recréation
 * 
 * @param {Date|string} date - Date à convertir
 * @returns {string} Clé de mois au format YYYY-MM
 */
export function getMonthKey(date) {
  if (!date) return null;
  
  // Normaliser en Date si string
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Vérifier si date valide
  if (isNaN(dateObj.getTime())) {
    return null;
  }
  
  // Créer clé de cache
  const cacheKey = `${dateObj.getFullYear()}-${dateObj.getMonth()}`;
  
  // Vérifier cache
  if (monthKeyCache.has(cacheKey)) {
    return monthKeyCache.get(cacheKey);
  }
  
  // Calculer clé de mois
  const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
  
  // Mettre en cache (limiter taille)
  if (monthKeyCache.size >= MAX_CACHE_SIZE) {
    // Supprimer la première entrée (FIFO simple)
    const firstKey = monthKeyCache.keys().next().value;
    monthKeyCache.delete(firstKey);
  }
  
  monthKeyCache.set(cacheKey, monthKey);
  return monthKey;
}

/**
 * Formate une date pour affichage (mois court + année)
 * 
 * ✅ SOLUTION 1.10 : Cache pour éviter recréation
 * 
 * @param {Date|string} date - Date à formater
 * @param {string} locale - Locale (défaut: 'fr-FR')
 * @returns {string} Date formatée
 */
export function formatMonthDate(date, locale = 'fr-FR') {
  if (!date) return '';
  
  // Normaliser en Date si string
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Vérifier si date valide
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  // Créer clé de cache
  const cacheKey = `${dateObj.getTime()}_${locale}`;
  
  // Vérifier cache
  if (dateFormatCache.has(cacheKey)) {
    return dateFormatCache.get(cacheKey);
  }
  
  // Formater date
  const formatted = dateObj.toLocaleString(locale, { month: 'short', year: 'numeric' });
  
  // Mettre en cache (limiter taille)
  if (dateFormatCache.size >= MAX_CACHE_SIZE) {
    // Supprimer la première entrée (FIFO simple)
    const firstKey = dateFormatCache.keys().next().value;
    dateFormatCache.delete(firstKey);
  }
  
  dateFormatCache.set(cacheKey, formatted);
  return formatted;
}

/**
 * Filtre les dépenses par mois de manière optimisée
 * 
 * ✅ SOLUTION 1.10 : Utilise cache pour clés de mois
 * 
 * @param {Array} depenses - Liste des dépenses
 * @param {string} monthKey - Clé de mois (YYYY-MM)
 * @returns {Array} Dépenses du mois
 */
export function filterDepensesByMonth(depenses, monthKey) {
  if (!Array.isArray(depenses) || !monthKey) {
    return [];
  }
  
  return depenses.filter(d => {
    if (!d.date) return false;
    const dMonthKey = getMonthKey(d.date);
    return dMonthKey === monthKey;
  });
}

/**
 * Génère un tableau de mois (3 derniers mois par défaut)
 * 
 * ✅ SOLUTION 1.10 : Optimisé avec cache de dates
 * 
 * @param {number} count - Nombre de mois (défaut: 3)
 * @param {Date} [fromDate] - Date de départ (défaut: aujourd'hui)
 * @returns {Array} Tableau d'objets { date, monthKey, formatted }
 */
export function generateMonthRange(count = 3, fromDate = new Date()) {
  const months = [];
  
  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(fromDate.getFullYear(), fromDate.getMonth() - i, 1);
    const monthKey = getMonthKey(date);
    const formatted = formatMonthDate(date);
    
    months.push({
      date,
      monthKey,
      formatted
    });
  }
  
  return months;
}

/**
 * Nettoie le cache (utile pour tests ou memory management)
 */
export function clearDateCache() {
  dateFormatCache.clear();
  monthKeyCache.clear();
}

/**
 * Obtient les statistiques du cache
 */
export function getCacheStats() {
  return {
    dateFormatCacheSize: dateFormatCache.size,
    monthKeyCacheSize: monthKeyCache.size,
    maxCacheSize: MAX_CACHE_SIZE
  };
}

