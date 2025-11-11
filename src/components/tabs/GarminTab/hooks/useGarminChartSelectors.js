import { useMemo } from 'react';
import { useGarminSelectors } from './useGarminSelectors';
import { useGarminContext } from '../context/GarminContext';
import { useFilteredDates } from './useFilteredDates';
import { DATE_RANGE } from '../constants';
import { buildGarminChartDataset } from '../utils/chartDataBuilders';

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

  const chartData = useMemo(() => (
    buildGarminChartDataset({
      dailyMetrics,
      activities: activitiesByType,
      filteredDates,
      selectedDate,
      effectiveSelectedDate,
      displayInfo
    })
  ), [dailyMetrics, activitiesByType, filteredDates, selectedDate, effectiveSelectedDate, displayInfo]);

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
    chartData
  };
};

export default useGarminChartSelectors;

