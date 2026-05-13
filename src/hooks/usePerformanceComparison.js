import { useState, useEffect, useCallback, useMemo } from 'react';
import { XP_DB_NAME, applyQuietQuestMetaDbUpgrade } from '../services/xp/xpDbGateway.js';
import { STORE_QQ_HOOK_PERFORMANCE_HISTORY } from '../services/xp/quietQuestHookStores.js';

/**
 * Custom hook for performance comparison (today vs yesterday)
 * Calculates metrics and determines improvement/decline
 */
const usePerformanceComparison = () => {
  const [todayData, setTodayData] = useState(null);
  const [yesterdayData, setYesterdayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize IndexedDB
  const initDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(XP_DB_NAME);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        applyQuietQuestMetaDbUpgrade(event);
      };
    });
  }, []);

  // Fetch performance data for a specific date
  const fetchPerformanceForDate = useCallback(async (date) => {
    try {
      const db = await initDB();
      const transaction = db.transaction([STORE_QQ_HOOK_PERFORMANCE_HISTORY], 'readonly');
      const store = transaction.objectStore(STORE_QQ_HOOK_PERFORMANCE_HISTORY);
      const index = store.index('date');
      const request = index.get(date);

      return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => resolve(null);
      });
    } catch (err) {
      return null;
    }
  }, [initDB]);

  // Fetch today and yesterday data
  const fetchComparisonData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const todayStr = today.toISOString().split('T')[0];
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const [todayPerf, yesterdayPerf] = await Promise.all([
        fetchPerformanceForDate(todayStr),
        fetchPerformanceForDate(yesterdayStr)
      ]);

      setTodayData(todayPerf);
      setYesterdayData(yesterdayPerf);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des données de comparaison');
      setLoading(false);
    }
  }, [fetchPerformanceForDate]);

  // Calculate percentage change
  const calculateChange = useCallback((current, previous) => {
    if (!previous || previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  }, []);

  // Determine change class
  const getChangeClass = useCallback((change) => {
    if (change > 0) return 'improvement';
    if (change < 0) return 'decline';
    return 'stable';
  }, []);

  // Get arrow direction
  const getArrow = useCallback((change) => {
    if (change > 0) return '↑';
    if (change < 0) return '↓';
    return '→';
  }, []);

  // Calculate general metrics comparison
  const generalMetrics = useMemo(() => {
    if (!todayData || !yesterdayData) {
      return {
        volume: { current: '0', previous: '0', change: '0%', changeClass: 'neutral', arrow: '→', class: 'stable' },
        intensity: { current: '0%', previous: '0%', change: '0%', changeClass: 'neutral', arrow: '→', class: 'stable' },
        restTime: { current: '0s', previous: '0s', change: '0%', changeClass: 'neutral', arrow: '→', class: 'stable' },
        duration: { current: '0min', previous: '0min', change: '0%', changeClass: 'neutral', arrow: '→', class: 'stable' }
      };
    }

    const volumeChange = calculateChange(todayData.volume || 0, yesterdayData.volume || 0);
    const intensityChange = calculateChange(todayData.intensity || 0, yesterdayData.intensity || 0);
    const restChange = calculateChange(todayData.restTime || 0, yesterdayData.restTime || 0);
    const durationChange = calculateChange(todayData.duration || 0, yesterdayData.duration || 0);

    return {
      volume: {
        current: `${todayData.volume || 0} reps`,
        previous: `${yesterdayData.volume || 0} reps`,
        change: `${volumeChange > 0 ? '+' : ''}${volumeChange}%`,
        changeClass: volumeChange > 0 ? 'positive' : volumeChange < 0 ? 'negative' : 'neutral',
        arrow: getArrow(volumeChange),
        class: getChangeClass(volumeChange)
      },
      intensity: {
        current: `${todayData.intensity || 0}%`,
        previous: `${yesterdayData.intensity || 0}%`,
        change: `${intensityChange > 0 ? '+' : ''}${intensityChange}%`,
        changeClass: intensityChange > 0 ? 'positive' : intensityChange < 0 ? 'negative' : 'neutral',
        arrow: getArrow(intensityChange),
        class: getChangeClass(intensityChange)
      },
      restTime: {
        current: `${todayData.restTime || 0}s`,
        previous: `${yesterdayData.restTime || 0}s`,
        change: `${restChange > 0 ? '+' : ''}${restChange}%`,
        changeClass: restChange < 0 ? 'positive' : restChange > 0 ? 'negative' : 'neutral',
        arrow: getArrow(-restChange),
        class: getChangeClass(-restChange)
      },
      duration: {
        current: `${todayData.duration || 0}min`,
        previous: `${yesterdayData.duration || 0}min`,
        change: `${durationChange > 0 ? '+' : ''}${durationChange}%`,
        changeClass: durationChange > 0 ? 'positive' : durationChange < 0 ? 'negative' : 'neutral',
        arrow: getArrow(durationChange),
        class: getChangeClass(durationChange)
      }
    };
  }, [todayData, yesterdayData, calculateChange, getArrow, getChangeClass]);

  // Calculate per-exercise comparisons
  const exerciseComparisons = useMemo(() => {
    if (!todayData?.exercises || !yesterdayData?.exercises) return [];

    const exerciseMap = new Map();

    // Collect all exercises
    todayData.exercises.forEach(ex => {
      exerciseMap.set(ex.name, { today: ex, yesterday: null });
    });

    yesterdayData.exercises.forEach(ex => {
      if (exerciseMap.has(ex.name)) {
        exerciseMap.get(ex.name).yesterday = ex;
      } else {
        exerciseMap.set(ex.name, { today: null, yesterday: ex });
      }
    });

    // Calculate comparisons
    return Array.from(exerciseMap.entries()).map(([name, { today, yesterday }]) => {
      const todayValue = today?.current || 0;
      const yesterdayValue = yesterday?.current || 0;
      const change = calculateChange(todayValue, yesterdayValue);

      return {
        name,
        icon: getExerciseIcon(name),
        current: `${todayValue} ${today?.unit || 'reps'}`,
        previous: `${yesterdayValue} ${yesterday?.unit || 'reps'}`,
        change: `${change > 0 ? '+' : ''}${change}%`,
        changeClass: change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral',
        arrow: getArrow(change),
        class: getChangeClass(change)
      };
    });
  }, [todayData, yesterdayData, calculateChange, getArrow, getChangeClass]);

  // Get exercise icon
  const getExerciseIcon = (name) => {
    const iconMap = {
      'pompes': '💪',
      'tractions': '🏋️',
      'squats': '🦵',
      'abdos': '🔥',
      'dips': '💪',
      'burpees': '⚡',
      'planche': '🧘'
    };
    return iconMap[name.toLowerCase()] || '💪';
  };

  // Calculate overall performance class
  const overallClass = useMemo(() => {
    const improvements = Object.values(generalMetrics).filter(m => m.class === 'improvement').length;
    const total = Object.keys(generalMetrics).length;

    if (improvements >= total * 0.75) return 'excellent';
    if (improvements >= total * 0.5) return 'good';
    if (improvements >= total * 0.25) return 'average';
    return 'needs-work';
  }, [generalMetrics]);

  // Load data on mount
  useEffect(() => {
    fetchComparisonData();
  }, [fetchComparisonData]);

  return {
    comparisons: {
      general: generalMetrics,
      exercises: exerciseComparisons,
      overallClass
    },
    loading,
    error,
    refresh: fetchComparisonData
  };
};

export default usePerformanceComparison;
