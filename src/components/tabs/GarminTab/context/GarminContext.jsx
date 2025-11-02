import React, { createContext, useContext } from 'react';
import logger from '../../../../utils/logger';

const log = logger.component('GarminContext');

/**
 * 🟢 FIX #32: Context API pour éviter props drilling
 * Fournit dailyMetrics, selectedDate, periodFilter, etc. à tous les composants Garmin
 */
const GarminContext = createContext(null);

export const useGarminContext = () => {
  const context = useContext(GarminContext);
  if (!context) {
    log.warn('useGarminContext doit être utilisé dans un GarminProvider');
    return {
      dailyMetrics: {},
      activities: { swimming: [], jumpRope: [], cardio: [] },
      selectedDate: null,
      setSelectedDate: () => {},
      periodFilter: 'all',
      setPeriodFilter: () => {},
      customStartDate: '',
      setCustomStartDate: () => {},
      customEndDate: '',
      setCustomEndDate: () => {},
      comparisonMode: false,
      setComparisonMode: () => {},
      compareDate: null,
      setCompareDate: () => {},
      colors: {}
    };
  }
  return context;
};

export const GarminProvider = ({ 
  children, 
  dailyMetrics = {},
  activities = { swimming: [], jumpRope: [], cardio: [] },
  selectedDate = null,
  setSelectedDate = () => {},
  periodFilter = 'all',
  setPeriodFilter = () => {},
  customStartDate = '',
  setCustomStartDate = () => {},
  customEndDate = '',
  setCustomEndDate = () => {},
  comparisonMode = false,
  setComparisonMode = () => {},
  compareDate = null,
  setCompareDate = () => {},
  colors = {}
}) => {
  const value = React.useMemo(() => ({
    dailyMetrics,
    activities,
    selectedDate,
    setSelectedDate,
    periodFilter,
    setPeriodFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    comparisonMode,
    setComparisonMode,
    compareDate,
    setCompareDate,
    colors
  }), [
    dailyMetrics,
    activities,
    selectedDate,
    setSelectedDate,
    periodFilter,
    setPeriodFilter,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    comparisonMode,
    setComparisonMode,
    compareDate,
    setCompareDate,
    colors
  ]);

  return (
    <GarminContext.Provider value={value}>
      {children}
    </GarminContext.Provider>
  );
};

