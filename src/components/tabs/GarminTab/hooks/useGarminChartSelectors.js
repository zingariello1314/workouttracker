import { useMemo } from 'react';
import { useGarminSelectors } from './useGarminSelectors';
import { useGarminContext } from '../context/GarminContext';
import { useFilteredDates } from './useFilteredDates';
import { DATE_RANGE } from '../constants';
import { useGarminDerivedDataset } from './useGarminDerivedDataset';

/**
 * Hook pour obtenir les selectors de graphiques Garmin
 * 
 * Utilise `useGarminDerivedDataset` pour centraliser le calcul et garantir
 * la cohérence entre UI, exports JSON et PDF.
 */
export const useGarminChartSelectors = () => {
  const {
    allDailyMetrics: dailyMetrics,
    activitiesByType,
    periodFilter,
    customRange,
    selectedDate
  } = useGarminSelectors();

  const { colors } = useGarminContext();

  const {
    filteredDates,
    displayInfo,
    selectedDate: effectiveSelectedDate
  } = useFilteredDates(
    dailyMetrics,
    selectedDate,
    periodFilter,
    customRange?.start || null,
    customRange?.end || null,
    DATE_RANGE.ACTIVITIES_DAYS
  );

  // Utiliser le hook centralisé pour obtenir le dataset dérivé
  const derivedDataset = useGarminDerivedDataset({
    dates: filteredDates,
    anchorDate: selectedDate || effectiveSelectedDate,
    displayInfo
  });

  // Extraire chartData et selectors depuis le dataset dérivé
  const chartData = useMemo(() => {
    // Le dataset dérivé contient déjà chartData (via buildGarminChartDataset)
    // On extrait les propriétés nécessaires pour compatibilité ascendante
    return {
      heartRateTrend: derivedDataset.heartRateTrend,
      heartRateTimeSeries: derivedDataset.heartRateTimeSeries,
      bodyBatteryTrend: derivedDataset.bodyBatteryTrend,
      stressTrend: derivedDataset.stressTrend,
      sleepTrend: derivedDataset.sleepTrend,
      respirationTrend: derivedDataset.respirationTrend,
      activityHeatmap: derivedDataset.activityHeatmap,
      correlation: derivedDataset.correlation
    };
  }, [derivedDataset]);

  const selectors = useMemo(() => {
    // Les selectors sont déjà calculés dans le dataset dérivé
    return derivedDataset.selectors || null;
  }, [derivedDataset]);

  const selectedDailyMetrics = useMemo(() => (
    selectedDate ? dailyMetrics[selectedDate] || null : null
  ), [selectedDate, dailyMetrics]);

  return {
    dailyMetrics,
    activitiesByType,
    periodFilter,
    customRange,
    selectedDate,
    selectedDailyMetrics,
    colors,
    filteredDates,
    displayInfo,
    effectiveSelectedDate,
    chartData,
    selectors
  };
};

export default useGarminChartSelectors;

