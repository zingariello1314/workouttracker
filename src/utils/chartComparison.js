/**
 * Utilitaires pour la comparaison optimisée des props de graphiques
 * 🟡 FIX #13: Fonctions helper pour React.memo avec comparaison efficace
 */

/**
 * Compare deux objets dailyMetrics de manière optimisée
 * Compare d'abord les clés, puis seulement les valeurs pour les dates communes
 */
export function compareFilteredDailyMetrics(
  prevMetrics,
  nextMetrics
) {
  const prevDates = Object.keys(prevMetrics || {}).sort();
  const nextDates = Object.keys(nextMetrics || {}).sort();
  
  // Comparaison rapide : même nombre de dates et mêmes clés
  if (prevDates.length !== nextDates.length) return false;
  if (JSON.stringify(prevDates) !== JSON.stringify(nextDates)) return false;
  
  // Comparer les valeurs pour chaque date
  // Utiliser une comparaison shallow mais suffisante pour détecter les changements
  for (const date of prevDates) {
    const prevValue = prevMetrics[date];
    const nextValue = nextMetrics[date];
    
    // Comparaison rapide par hash (JSON.stringify est acceptable pour petites structures)
    if (JSON.stringify(prevValue) !== JSON.stringify(nextValue)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Comparateur standard pour les props de graphiques Garmin
 */
export function areChartPropsEqual(prevProps, nextProps) {
  return (
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.periodFilter === nextProps.periodFilter &&
    prevProps.customStartDate === nextProps.customStartDate &&
    prevProps.customEndDate === nextProps.customEndDate &&
    // Comparaison optimisée des dailyMetrics (seulement les clés et valeurs pertinentes)
    compareFilteredDailyMetrics(
      prevProps.dailyMetrics,
      nextProps.dailyMetrics,
      prevProps.selectedDate,
      prevProps.periodFilter,
      prevProps.customStartDate,
      prevProps.customEndDate
    ) &&
    // Comparaison simple des colors (objets généralement stables)
    prevProps.colors === nextProps.colors
  );
}

/**
 * Compare deux tableaux de manière shallow (ordre strict)
 */
export function shallowArrayEqual(a = [], b = []) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Comparateur pour les props de GarminDailyMetrics
 */
export function areDailyMetricsPropsEqual(prevProps, nextProps) {
  const sameDateKeys =
    prevProps.dateKeys === nextProps.dateKeys ||
    shallowArrayEqual(prevProps.dateKeys, nextProps.dateKeys);

  return (
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.comparisonMode === nextProps.comparisonMode &&
    prevProps.compareDate === nextProps.compareDate &&
    prevProps.setSelectedDate === nextProps.setSelectedDate &&
    sameDateKeys &&
    compareFilteredDailyMetrics(prevProps.dailyMetrics, nextProps.dailyMetrics)
  );
}

/**
 * Comparateur pour les props de TimeNavigation
 */
export function areTimeNavigationPropsEqual(prevProps, nextProps) {
  const sameDateKeys =
    prevProps.dateKeys === nextProps.dateKeys ||
    shallowArrayEqual(prevProps.dateKeys, nextProps.dateKeys);

  return (
    prevProps.selectedDate === nextProps.selectedDate &&
    prevProps.comparisonMode === nextProps.comparisonMode &&
    prevProps.compareDate === nextProps.compareDate &&
    prevProps.periodFilter === nextProps.periodFilter &&
    prevProps.customStartDate === nextProps.customStartDate &&
    prevProps.customEndDate === nextProps.customEndDate &&
    sameDateKeys &&
    prevProps.setSelectedDate === nextProps.setSelectedDate &&
    prevProps.setComparisonMode === nextProps.setComparisonMode &&
    prevProps.setCompareDate === nextProps.setCompareDate &&
    prevProps.setPeriodFilter === nextProps.setPeriodFilter &&
    prevProps.setCustomStartDate === nextProps.setCustomStartDate &&
    prevProps.setCustomEndDate === nextProps.setCustomEndDate
  );
}

