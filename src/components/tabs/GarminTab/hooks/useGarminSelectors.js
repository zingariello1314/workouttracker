import { useMemo, useCallback } from 'react';
import { useGarminContext } from '../context/GarminContext';

const extractDateKey = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    return match ? match[0] : null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString().slice(0, 10);
  }

  if (typeof value === 'object') {
    const candidates = [
      value.date,
      value.day,
      value.start,
      value.startDate,
      value.startTimeLocal,
      value.startTimeGmt,
      value.summaryStartTimeGmt,
      value.summaryStartTimeLocal
    ];

    for (const candidate of candidates) {
      const key = extractDateKey(candidate);
      if (key) {
        return key;
      }
    }
  }

  return null;
};

const filterActivitiesByRange = (activities, range) => {
  if (!range || (!range.start && !range.end)) {
    return activities;
  }

  const startKey = range.start || null;
  const endKey = range.end || null;

  if (!startKey && !endKey) {
    return activities;
  }

  return activities.filter((activity) => {
    const activityDate = extractDateKey(activity);
    if (!activityDate) {
      return true;
    }
    if (startKey && activityDate < startKey) {
      return false;
    }
    if (endKey && activityDate > endKey) {
      return false;
    }
    return true;
  });
};

export const useGarminSelectors = () => {
  const {
    dailyMetrics = {},
    activities = {},
    selectedDate,
    comparisonMode,
    compareDate,
    periodFilter,
    customStartDate,
    customEndDate,
    cacheMeta
  } = useGarminContext();

  const dateKeys = useMemo(() => Object.keys(dailyMetrics).sort(), [dailyMetrics]);

  const latestDate = useMemo(() => {
    if (selectedDate) {
      return selectedDate;
    }
    return dateKeys.length > 0 ? dateKeys[dateKeys.length - 1] : null;
  }, [dateKeys, selectedDate]);

  const getDailyMetrics = useCallback(
    (date) => {
      if (!date) {
        return null;
      }
      return dailyMetrics[date] || null;
    },
    [dailyMetrics]
  );

  const currentMetrics = useMemo(() => getDailyMetrics(latestDate), [getDailyMetrics, latestDate]);

  const comparisonMetrics = useMemo(() => {
    if (!comparisonMode || !compareDate) {
      return null;
    }
    return getDailyMetrics(compareDate);
  }, [comparisonMode, compareDate, getDailyMetrics]);

  const activitiesByType = useMemo(
    () => ({
      swimming: activities?.swimming || [],
      jumpRope: activities?.jumpRope || [],
      cardio: activities?.cardio || []
    }),
    [activities]
  );

  const getActivitiesByType = useCallback(
    (type, options = {}) => {
      const list = activitiesByType[type] || [];
      if (!options.range) {
        return list;
      }
      return filterActivitiesByRange(list, options.range);
    },
    [activitiesByType]
  );

  const cacheSource = useMemo(() => {
    if (!cacheMeta) {
      return {
        source: null,
        degraded: false,
        ttlMs: null,
        timestamp: null,
        meta: null
      };
    }
    return {
      source: cacheMeta.source ?? null,
      degraded: Boolean(cacheMeta.degraded),
      ttlMs: cacheMeta.ttlMs ?? null,
      timestamp: cacheMeta.timestamp ?? null,
      circuit: cacheMeta.circuit ?? null,
      meta: cacheMeta
    };
  }, [cacheMeta]);

  return {
    allDailyMetrics: dailyMetrics,
    dateKeys,
    latestDate,
    currentMetrics,
    getDailyMetrics,
    comparisonMetrics,
    getActivitiesByType,
    activitiesByType,
    cacheSource,
    periodFilter,
    customRange: {
      start: customStartDate || null,
      end: customEndDate || null
    },
    comparisonMode,
    compareDate,
    selectedDate
  };
};

export default useGarminSelectors;

