import { useMemo } from 'react';

/**
 * Hook pour calculer les dates filtrées à afficher selon selectedDate et periodFilter
 * @param {Object} dailyMetrics - Objet avec dates comme clés
 * @param {string} selectedDate - Date sélectionnée (YYYY-MM-DD)
 * @param {string} periodFilter - Filtre de période ('week', 'month', '3months', '6months', 'year', 'all', 'custom')
 * @param {string} customStartDate - Date de début personnalisée (pour periodFilter='custom')
 * @param {string} customEndDate - Date de fin personnalisée (pour periodFilter='custom')
 * @param {number} contextDays - Nombre de jours de contexte autour de selectedDate (défaut: 7)
 * @returns {Object} { filteredDates: string[], dateRange: { start: string, end: string }, displayInfo: string }
 */
export function useFilteredDates(dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, contextDays = 7) {
  return useMemo(() => {
    if (!dailyMetrics || Object.keys(dailyMetrics).length === 0) {
      return {
        filteredDates: [],
        dateRange: null,
        displayInfo: 'Aucune donnée'
      };
    }

    const allDates = Object.keys(dailyMetrics).sort();
    let filteredDates = [];
    let dateRange = null;
    let displayInfo = '';

    // Si periodFilter est défini, l'utiliser en priorité
    if (periodFilter && periodFilter !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (periodFilter) {
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(today.getDate() - 7);
          filteredDates = allDates.filter(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date >= weekAgo;
          });
          displayInfo = '7 derniers jours';
          break;

        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setDate(today.getDate() - 30);
          filteredDates = allDates.filter(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date >= monthAgo;
          });
          displayInfo = '30 derniers jours';
          break;

        case '3months':
          const threeMonthsAgo = new Date(today);
          threeMonthsAgo.setDate(today.getDate() - 90);
          filteredDates = allDates.filter(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date >= threeMonthsAgo;
          });
          displayInfo = '3 derniers mois';
          break;

        case '6months':
          const sixMonthsAgo = new Date(today);
          sixMonthsAgo.setDate(today.getDate() - 180);
          filteredDates = allDates.filter(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date >= sixMonthsAgo;
          });
          displayInfo = '6 derniers mois';
          break;

        case 'year':
          const yearAgo = new Date(today);
          yearAgo.setDate(today.getDate() - 365);
          filteredDates = allDates.filter(d => {
            const date = new Date(d);
            date.setHours(0, 0, 0, 0);
            return date >= yearAgo;
          });
          displayInfo = '1 an';
          break;

        case 'custom':
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            
            filteredDates = allDates.filter(d => {
              const date = new Date(d);
              date.setHours(0, 0, 0, 0);
              return date >= start && date <= end;
            });
            
            const startStr = new Date(customStartDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const endStr = new Date(customEndDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
            displayInfo = `${startStr} - ${endStr}`;
          } else {
            filteredDates = allDates;
            displayInfo = 'Toutes les dates';
          }
          break;

        default:
          filteredDates = allDates;
          displayInfo = 'Toutes les dates';
      }

      // Si selectedDate est défini et n'est pas dans filteredDates, l'ajouter
      if (selectedDate && !filteredDates.includes(selectedDate)) {
        filteredDates.push(selectedDate);
        filteredDates.sort();
      }
    } else if (selectedDate) {
      // Si pas de periodFilter mais selectedDate défini, afficher contexte autour
      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      const start = new Date(selected);
      start.setDate(start.getDate() - contextDays);

      const end = new Date(selected);
      end.setDate(end.getDate() + contextDays);

      filteredDates = allDates.filter(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date >= start && date <= end;
      });

      // S'assurer que selectedDate est inclus
      if (!filteredDates.includes(selectedDate)) {
        filteredDates.push(selectedDate);
        filteredDates.sort();
      }

      const startStr = new Date(start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      const endStr = new Date(end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
      displayInfo = `${startStr} - ${endStr}`;
    } else {
      // Pas de filtre, toutes les dates
      filteredDates = allDates;
      displayInfo = 'Toutes les dates';
    }

    // Calculer dateRange
    if (filteredDates.length > 0) {
      dateRange = {
        start: filteredDates[0],
        end: filteredDates[filteredDates.length - 1]
      };
    }

    return {
      filteredDates,
      dateRange,
      displayInfo,
      selectedDate: selectedDate || filteredDates[filteredDates.length - 1] // Date sélectionnée ou dernière
    };
  }, [dailyMetrics, selectedDate, periodFilter, customStartDate, customEndDate, contextDays]);
}

