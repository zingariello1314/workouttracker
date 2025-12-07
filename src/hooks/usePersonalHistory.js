import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Custom hook for personal history and records
 * Handles historical data, trends, and chart generation
 */
const usePersonalHistory = () => {
  const [historyData, setHistoryData] = useState([]);
  const [currentPeriod, setCurrentPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize IndexedDB
  const initDB = useCallback(() => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('QuietQuestDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('performanceHistory')) {
          const store = db.createObjectStore('performanceHistory', { keyPath: 'id' });
          store.createIndex('date', 'date', { unique: true });
        }
      };
    });
  }, []);

  // Fetch all historical data
  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const db = await initDB();
      const transaction = db.transaction(['performanceHistory'], 'readonly');
      const store = transaction.objectStore('performanceHistory');
      const request = store.getAll();

      request.onsuccess = () => {
        const data = request.result || [];
        setHistoryData(data.sort((a, b) => new Date(b.date) - new Date(a.date)));
        setLoading(false);
      };

      request.onerror = () => {
        setError('Erreur lors du chargement de l\'historique');
        setLoading(false);
      };
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [initDB]);

  // Calculate personal records
  const personalRecords = useMemo(() => {
    if (!historyData.length) return [];

    const recordsMap = new Map();

    historyData.forEach(day => {
      if (!day.exercises) return;

      day.exercises.forEach(exercise => {
        const existing = recordsMap.get(exercise.name);
        if (!existing || exercise.current > existing.value) {
          recordsMap.set(exercise.name, {
            exercise: exercise.name,
            icon: getExerciseIcon(exercise.name),
            value: exercise.current,
            unit: exercise.unit,
            date: day.date,
            isNewRecord: day.date === historyData[0]?.date
          });
        }
      });
    });

    return Array.from(recordsMap.values());
  }, [historyData]);

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

  // Calculate trends
  const trends = useMemo(() => {
    if (!historyData.length) {
      return {
        bestStreak: { value: 0, period: 'jours' },
        overallProgress: { value: 0, class: 'neutral' },
        consistency: { value: 0, description: 'Aucune donnée' }
      };
    }

    // Calculate best streak
    let currentStreak = 0;
    let bestStreak = 0;
    let lastDate = null;

    historyData.forEach(day => {
      const date = new Date(day.date);
      if (lastDate) {
        const diffDays = Math.floor((lastDate - date) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          bestStreak = Math.max(bestStreak, currentStreak);
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }
      lastDate = date;
    });
    bestStreak = Math.max(bestStreak, currentStreak);

    // Calculate overall progress
    const recentData = historyData.slice(0, 7);
    const olderData = historyData.slice(7, 14);

    const recentAvg = recentData.reduce((sum, d) => sum + (d.volume || 0), 0) / recentData.length;
    const olderAvg = olderData.length > 0
      ? olderData.reduce((sum, d) => sum + (d.volume || 0), 0) / olderData.length
      : recentAvg;

    const progressPercent = olderAvg > 0
      ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
      : 0;

    // Calculate consistency
    const last30Days = historyData.filter(d => {
      const date = new Date(d.date);
      const now = new Date();
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    const consistencyPercent = Math.round((last30Days.length / 30) * 100);
    let consistencyDesc = 'Faible';
    if (consistencyPercent >= 80) consistencyDesc = 'Excellente';
    else if (consistencyPercent >= 60) consistencyDesc = 'Bonne';
    else if (consistencyPercent >= 40) consistencyDesc = 'Moyenne';

    return {
      bestStreak: { value: bestStreak, period: 'jours' },
      overallProgress: {
        value: progressPercent,
        class: progressPercent > 0 ? 'positive' : progressPercent < 0 ? 'negative' : 'neutral'
      },
      consistency: { value: consistencyPercent, description: consistencyDesc }
    };
  }, [historyData]);

  // Generate chart data for selected period
  const chartData = useMemo(() => {
    if (!historyData.length) {
      return {
        labels: [],
        volume: [],
        minutes: [],
        seconds: []
      };
    }

    const now = new Date();
    let dataPoints = [];
    let labels = [];

    if (currentPeriod === 'month') {
      // Last 4 weeks
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - (i * 7) - now.getDay() + 1);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekData = historyData.filter(d => {
          const date = new Date(d.date);
          return date >= weekStart && date <= weekEnd;
        });

        labels.push(`S${4 - i}`);
        dataPoints.push(weekData);
      }
    } else if (currentPeriod === 'quarter') {
      // Last 3 months
      for (let i = 2; i >= 0; i--) {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

        const monthData = historyData.filter(d => {
          const date = new Date(d.date);
          return date >= monthStart && date <= monthEnd;
        });

        labels.push(monthStart.toLocaleDateString('fr-FR', { month: 'short' }));
        dataPoints.push(monthData);
      }
    } else if (currentPeriod === 'year') {
      // Last 4 quarters
      for (let i = 3; i >= 0; i--) {
        const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - (i * 3), 1);
        const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - (i * 3) + 3, 0);

        const quarterData = historyData.filter(d => {
          const date = new Date(d.date);
          return date >= quarterStart && date <= quarterEnd;
        });

        labels.push(`T${4 - i}`);
        dataPoints.push(quarterData);
      }
    }

    // Calculate aggregated values
    const volume = dataPoints.map(data =>
      data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.volume || 0), 0) / data.length) : 0
    );

    const minutes = dataPoints.map(data =>
      data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.duration || 0), 0) / data.length) : 0
    );

    const seconds = dataPoints.map(data =>
      data.length > 0 ? Math.round(data.reduce((sum, d) => sum + (d.restTime || 0), 0) / data.length) : 0
    );

    return { labels, volume, minutes, seconds };
  }, [historyData, currentPeriod]);

  // Change period
  const changePeriod = useCallback((period) => {
    setCurrentPeriod(period);
  }, []);

  // Load data on mount
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    records: personalRecords,
    trends,
    chartData,
    currentPeriod,
    loading,
    error,
    changePeriod,
    refresh: fetchHistory
  };
};

export default usePersonalHistory;
