/**
 * Hook pour pré-calculer les domaines, ticks et autres métadonnées de graphiques.
 * 
 * Centralise la logique de calcul des domaines Y/X et des ticks pour éviter
 * les recalculs redondants dans chaque composant de graphique.
 * 
 * @module useChartData
 */

import { useMemo } from 'react';

/**
 * Calcule le domaine Y optimal avec marge pour une série de données numériques.
 * 
 * Fonction pure exportée pour réutilisation dans d'autres contextes.
 * 
 * @param {Array} data - Données du graphique
 * @param {Array<string>} dataKeys - Clés à extraire des données (ex: ['resting', 'max', 'avg'])
 * @param {Array<number>} defaultDomain - Domaine par défaut [min, max]
 * @param {number} marginPercent - Pourcentage de marge à ajouter (défaut: 10%)
 * @returns {Array<number>} Domaine [min, max]
 */
export function calculateYAxisDomain(data, dataKeys = [], defaultDomain = [0, 100], marginPercent = 0.1) {
  if (!Array.isArray(data) || data.length === 0) {
    return defaultDomain;
  }

  let minValue = Infinity;
  let maxValue = -Infinity;

  data.forEach(d => {
    dataKeys.forEach((key) => {
      const value = d[key];
      if (value !== null && value !== undefined && typeof value === 'number') {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
    });
  });

  if (minValue === Infinity || maxValue === -Infinity) {
    return defaultDomain;
  }

  const range = maxValue - minValue;
  const margin = Math.max(range * marginPercent, (defaultDomain[1] - defaultDomain[0]) * 0.05);
  const domainMin = Math.max(defaultDomain[0], Math.floor(minValue - margin));
  const domainMax = Math.min(defaultDomain[1], Math.ceil(maxValue + margin));

  return [domainMin, domainMax];
}

/**
 * Génère des ticks optimisés pour un axe Y.
 * 
 * Fonction pure exportée pour réutilisation dans d'autres contextes.
 * 
 * @param {Array<number>} domain - Domaine [min, max]
 * @param {number} maxTicks - Nombre maximum de ticks (défaut: 5)
 * @returns {Array<number>} Ticks
 */
export function generateYAxisTicks(domain, maxTicks = 5) {
  const [min, max] = domain;
  const range = max - min;
  const step = range / (maxTicks - 1);
  
  const ticks = [];
  for (let i = 0; i < maxTicks; i++) {
    ticks.push(Math.round(min + step * i));
  }
  
  return ticks;
}

/**
 * Hook pour obtenir les métadonnées pré-calculées d'un graphique.
 * 
 * @param {Object} params
 * @param {Object} params.selector - Selector du graphique (depuis useGarminChartSelectors)
 * @param {Object} params.precomputed - Données pré-calculées (depuis chartData)
 * @param {string} params.chartType - Type de graphique ('heartRate', 'bodyBattery', 'stress', 'sleep', 'respiration')
 * @param {Array<string>} params.dataKeys - Clés de données à extraire pour calcul du domaine
 * @param {Array<number>} params.defaultDomain - Domaine par défaut [min, max]
 * @returns {Object} Métadonnées du graphique (data, yAxisDomain, yAxisTicks, displayInfo, selectedDate)
 */
export const useChartData = ({
  selector = null,
  precomputed = null,
  chartType = 'heartRate',
  dataKeys = [],
  defaultDomain = [0, 100]
}) => {
  return useMemo(() => {
    // Priorité : selector > precomputed
    const source = selector ?? precomputed ?? {};
    
    // Extraire les données
    const data = Array.isArray(source.data) ? source.data : (precomputed?.data ?? []);
    
    // Extraire ou calculer le domaine Y
    let yAxisDomain = source.yAxisDomain;
    if (!yAxisDomain && data.length > 0 && dataKeys.length > 0) {
      // Calculer le domaine si non fourni
      yAxisDomain = calculateYAxisDomain(data, dataKeys, defaultDomain);
    } else if (!yAxisDomain) {
      yAxisDomain = defaultDomain;
    }
    
    // Générer les ticks Y
    const yAxisTicks = generateYAxisTicks(yAxisDomain);
    
    // Extraire les métadonnées
    const displayInfo = source.displayInfo ?? precomputed?.displayInfo ?? null;
    const selectedDate = source.selectedDate ?? precomputed?.selectedDate ?? null;
    const filteredDates = source.filteredDates ?? precomputed?.filteredDates ?? [];
    
    // Stats spécifiques selon le type de graphique
    const stats = source.stats ?? precomputed?.stats ?? null;
    const average = source.average ?? precomputed?.average ?? null;
    const avgAwake = source.avgAwake ?? precomputed?.avgAwake ?? null;
    const avgSleep = source.avgSleep ?? precomputed?.avgSleep ?? null;
    const averageDuration = source.averageDuration ?? precomputed?.averageDuration ?? null;
    
    return {
      data,
      yAxisDomain,
      yAxisTicks,
      displayInfo,
      selectedDate,
      filteredDates,
      stats,
      average,
      avgAwake,
      avgSleep,
      averageDuration,
      isEmpty: data.length === 0
    };
    // Note: chartType n'est pas utilisé dans le calcul mais peut être utile pour debug
    // On le garde dans les dépendances pour cohérence API, mais il n'affecte pas le résultat
  }, [selector, precomputed, dataKeys, defaultDomain]); // Retirer chartType des dépendances (non utilisé)
};

export default useChartData;

