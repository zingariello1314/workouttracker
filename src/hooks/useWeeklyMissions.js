import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for managing weekly missions
 * Handles localStorage operations and day organization
 */
const useWeeklyMissions = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

  // Get current week dates
  const getCurrentWeekDates = useCallback(() => {
    const today = new Date();
    const currentDay = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

    return DAYS.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return {
        dayName: day,
        date: date.toISOString().split('T')[0],
        isToday: date.toDateString() === today.toDateString()
      };
    });
  }, []);

  // Fetch missions from localStorage
  const fetchMissions = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      const weekDates = getCurrentWeekDates();
      const allMissions = weekDates.map(({ dayName, date, isToday }) => {
        const storageKey = `mission_${date}`;
        const stored = localStorage.getItem(storageKey);
        const dayMissions = stored ? JSON.parse(stored) : [];

        return {
          dayName,
          date,
          isToday,
          missions: dayMissions.map(mission => ({
            ...mission,
            completed: localStorage.getItem(`mission_${mission.id}_${dayName}`) === 'true'
          }))
        };
      });

      setMissions(allMissions);
      setLoading(false);
    } catch (err) {
      setError('Erreur lors du chargement des missions');
      setLoading(false);
    }
  }, [getCurrentWeekDates]);

  // Toggle mission completion
  const toggleMission = useCallback((missionId, dayName) => {
    try {
      const key = `mission_${missionId}_${dayName}`;
      const currentState = localStorage.getItem(key) === 'true';
      localStorage.setItem(key, (!currentState).toString());
      fetchMissions();
    } catch (err) {
      setError('Erreur lors de la mise à jour de la mission');
    }
  }, [fetchMissions]);

  // Add new mission
  const addMission = useCallback((missionData) => {
    try {
      const { date, name, benefit, targetValue, unit, xp } = missionData;
      const storageKey = `mission_${date}`;
      const stored = localStorage.getItem(storageKey);
      const existingMissions = stored ? JSON.parse(stored) : [];

      const newMission = {
        id: Date.now(),
        name,
        benefit,
        targetValue,
        unit,
        date,
        xp: xp || 10,
        completed: false,
        createdAt: new Date().toISOString()
      };

      existingMissions.push(newMission);
      localStorage.setItem(storageKey, JSON.stringify(existingMissions));
      fetchMissions();

      return newMission;
    } catch (err) {
      setError('Erreur lors de l\'ajout de la mission');
      throw err;
    }
  }, [fetchMissions]);

  // Delete mission
  const deleteMission = useCallback((missionId, date) => {
    try {
      const storageKey = `mission_${date}`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;

      const missions = JSON.parse(stored);
      const filtered = missions.filter(m => m.id !== missionId);
      localStorage.setItem(storageKey, JSON.stringify(filtered));

      // Clean up completion state
      const dayName = missions.find(m => m.id === missionId)?.dayName;
      if (dayName) {
        localStorage.removeItem(`mission_${missionId}_${dayName}`);
      }

      fetchMissions();
    } catch (err) {
      setError('Erreur lors de la suppression de la mission');
    }
  }, [fetchMissions]);

  // Get missions for specific day
  const getMissionsForDay = useCallback((dayName) => {
    return missions.find(m => m.dayName === dayName) || { missions: [] };
  }, [missions]);

  // Get completion stats
  const getStats = useCallback(() => {
    const allMissions = missions.flatMap(day => day.missions);
    const completed = allMissions.filter(m => m.completed).length;
    const total = allMissions.length;
    const totalXP = allMissions.filter(m => m.completed).reduce((sum, m) => sum + (m.xp || 0), 0);

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalXP
    };
  }, [missions]);

  // Load data on mount
  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  return {
    missions,
    loading,
    error,
    toggleMission,
    addMission,
    deleteMission,
    getMissionsForDay,
    getStats,
    refresh: fetchMissions
  };
};

export default useWeeklyMissions;
