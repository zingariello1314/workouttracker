/**
 * 🔴 FIX #71-80: Hook pour gérer les filtres avancés et la recherche
 * 🔴 FIX #51-60: Documentation JSDoc complète
 */
import { useMemo, useCallback } from 'react';

/**
 * Hook pour filtrer et rechercher des activités Garmin
 * Optimisé avec useMemo pour éviter recalculs inutiles
 * 
 * @param {Object} activities - Objet contenant les activités par type
 * @param {Array} activities.swimming - Liste des activités de natation
 * @param {Array} activities.jumpRope - Liste des activités de corde à sauter
 * @param {Array} activities.cardio - Liste des activités cardio
 * @param {string} searchTerm - Terme de recherche (nom, date, métriques)
 * @param {Object} filters - Objet de filtres
 * @param {string} filters.type - Type d'activité ('all', 'swimming', 'jumpRope', 'cardio')
 * @param {string|null} filters.startDate - Date de début (YYYY-MM-DD)
 * @param {string|null} filters.endDate - Date de fin (YYYY-MM-DD)
 * @param {number|null} filters.minDistance - Distance minimum (km)
 * @param {number|null} filters.maxDistance - Distance maximum (km)
 * @param {number|null} filters.minDuration - Durée minimum (minutes)
 * @param {number|null} filters.maxDuration - Durée maximum (minutes)
 * @param {number|null} filters.minCalories - Calories minimum
 * @param {number|null} filters.maxCalories - Calories maximum
 * @returns {Object} { filteredActivities, totalFilteredCount }
 * @returns {Object} returns.filteredActivities - Activités filtrées par type
 * @returns {number} returns.totalFilteredCount - Nombre total d'activités filtrées
 * 
 * @example
 * const { filteredActivities, totalFilteredCount } = useAdvancedFilters(
 *   activities,
 *   'natation',
 *   { type: 'swimming', minDistance: 1.0 }
 * );
 */
export function useAdvancedFilters(activities, searchTerm, filters) {
  const filteredActivities = useMemo(() => {
    let result = {
      swimming: [...(activities.swimming || [])],
      jumpRope: [...(activities.jumpRope || [])],
      cardio: [...(activities.cardio || [])]
    };

    // Filtre par type
    if (filters.type && filters.type !== 'all') {
      const otherTypes = ['swimming', 'jumpRope', 'cardio'].filter(t => t !== filters.type);
      otherTypes.forEach(type => {
        result[type] = [];
      });
    }

    // Appliquer tous les filtres à chaque type
    ['swimming', 'jumpRope', 'cardio'].forEach(type => {
      result[type] = result[type].filter(activity => {
        // Filtre par date
        if (filters.startDate) {
          const actDate = new Date(activity.date);
          const startDate = new Date(filters.startDate);
          if (actDate < startDate) return false;
        }
        if (filters.endDate) {
          const actDate = new Date(activity.date);
          const endDate = new Date(filters.endDate);
          if (actDate > endDate) return false;
        }

        // Filtre par distance
        if (filters.minDistance !== null && filters.minDistance !== undefined) {
          if (!activity.distance || activity.distance < filters.minDistance) return false;
        }
        if (filters.maxDistance !== null && filters.maxDistance !== undefined) {
          if (!activity.distance || activity.distance > filters.maxDistance) return false;
        }

        // Filtre par durée (convertir en minutes)
        const durationMinutes = activity.duration ? Math.round(activity.duration / 60) : 0;
        if (filters.minDuration !== null && filters.minDuration !== undefined) {
          if (durationMinutes < filters.minDuration) return false;
        }
        if (filters.maxDuration !== null && filters.maxDuration !== undefined) {
          if (durationMinutes > filters.maxDuration) return false;
        }

        // Filtre par calories
        const calories = typeof activity.calories === 'object' 
          ? (activity.calories?.total || activity.calories?.active || 0)
          : (activity.calories || 0);
        if (filters.minCalories !== null && filters.minCalories !== undefined) {
          if (calories < filters.minCalories) return false;
        }
        if (filters.maxCalories !== null && filters.maxCalories !== undefined) {
          if (calories > filters.maxCalories) return false;
        }

        return true;
      });
    });

    // Recherche par terme
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      ['swimming', 'jumpRope', 'cardio'].forEach(type => {
        result[type] = result[type].filter(activity => {
          // Recherche dans le nom
          const activityName = (activity.activityName || activity.name || '').toLowerCase();
          if (activityName.includes(searchLower)) return true;

          // Recherche dans la date
          const activityDate = (activity.date || '').toLowerCase();
          if (activityDate.includes(searchLower)) return true;

          // Recherche dans les métriques (distance, durée, calories)
          const distance = String(activity.distance || '').toLowerCase();
          if (distance.includes(searchLower)) return true;

          const duration = String(Math.round((activity.duration || 0) / 60)).toLowerCase();
          if (duration.includes(searchLower)) return true;

          const calories = String(
            typeof activity.calories === 'object' 
              ? (activity.calories?.total || activity.calories?.active || 0)
              : (activity.calories || 0)
          ).toLowerCase();
          if (calories.includes(searchLower)) return true;

          return false;
        });
      });
    }

    return result;
  }, [activities, searchTerm, filters]);

  const totalFilteredCount = useMemo(() => {
    return filteredActivities.swimming.length + 
           filteredActivities.jumpRope.length + 
           filteredActivities.cardio.length;
  }, [filteredActivities]);

  return {
    filteredActivities,
    totalFilteredCount
  };
}

