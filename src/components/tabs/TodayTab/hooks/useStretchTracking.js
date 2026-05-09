/**
 * 🧘 HOOK USE STRETCH TRACKING
 *
 * Hook personnalisé pour gérer le tracking des étirements.
 *
 * Granularité moderne : par **étirement individuel** (id stable + moment + date).
 * Une rétro-compat lecture-only est conservée pour la signature legacy `(moment)`
 * (utilisée par d'anciens composants), mais à l'écriture on bascule systématiquement
 * sur les clés item-individuel (`generateStretchItemKey`).
 *
 * @module useStretchTracking
 */

import { useCallback } from 'react';
import { useWorkout } from '../../../../context/WorkoutContext';
import {
  generateStretchKey,
  generateStretchItemKey
} from '../../../../utils/exerciseKeyGenerator';
import { getDateStr } from '../../../../utils/dateUtils';

/**
 * Hook pour gérer le tracking des étirements (lecture / écriture).
 *
 * @param {Object} [options]
 * @param {Date} [options.date] - Date à utiliser (défaut : currentDate du contexte)
 *
 * @returns {{
 *   toggleStretch:   (moment: string, stretchId?: string|number) => void,
 *   getStretchStatus:(moment: string, stretchId?: string|number) => {isChecked: boolean},
 *   getMomentSummary:(moment: string, stretchIds: Array<string|number>) => {checked: number, total: number, ratio: number, allChecked: boolean}
 * }}
 *
 * @example
 *   const { toggleStretch, getStretchStatus, getMomentSummary } = useStretchTracking();
 *   toggleStretch('matin', 9111);                       // toggle item individuel
 *   const { isChecked } = getStretchStatus('matin', 9111);
 *   const { allChecked } = getMomentSummary('matin', [9111, 9112, 9113]);
 */
export const useStretchTracking = (options = {}) => {
  const {
    currentDate,
    getCurrentData,
    updateTempStretchData
  } = useWorkout();

  const date = options.date || currentDate;
  const dateStr = getDateStr(date);

  /**
   * Toggle un étirement.
   *
   * Si `stretchId` est fourni → granularité fine (item individuel).
   * Sinon → fallback legacy (moment entier — déprécié, conservé pour compat).
   */
  const toggleStretch = useCallback((moment, stretchId = null) => {
    const currentData = getCurrentData();

    const key = stretchId != null
      ? generateStretchItemKey(date, moment, stretchId)
      : generateStretchKey(date, moment);

    const isCurrentlyChecked = currentData.checkedStretches?.[key] || false;

    const newData = {
      ...currentData,
      checkedStretches: {
        ...currentData.checkedStretches,
        [key]: !isCurrentlyChecked
      }
    };
    updateTempStretchData(newData);
  }, [date, getCurrentData, updateTempStretchData]);

  /**
   * Statut d'un étirement (legacy `moment` ou item individuel `moment + stretchId`).
   */
  const getStretchStatus = useCallback((moment, stretchId = null) => {
    const currentData = getCurrentData();

    const key = stretchId != null
      ? generateStretchItemKey(date, moment, stretchId)
      : generateStretchKey(date, moment);

    return { isChecked: currentData.checkedStretches?.[key] || false };
  }, [date, getCurrentData]);

  /**
   * Synthèse d'un moment : combien d'items cochés / total + ratio + allChecked.
   *
   * @param {string} moment
   * @param {Array<string|number>} stretchIds - Liste des IDs d'étirements de ce moment
   */
  const getMomentSummary = useCallback((moment, stretchIds = []) => {
    const currentData = getCurrentData();
    const total = stretchIds.length;
    if (total === 0) return { checked: 0, total: 0, ratio: 0, allChecked: false };

    let checked = 0;
    for (const id of stretchIds) {
      const key = generateStretchItemKey(date, moment, id);
      if (currentData.checkedStretches?.[key] === true) checked += 1;
    }
    return {
      checked,
      total,
      ratio: checked / total,
      allChecked: checked === total
    };
  }, [date, getCurrentData]);

  return {
    toggleStretch,
    getStretchStatus,
    getMomentSummary,
    // alias rétro-compat — laisse l'ancien nom dispo si du code le consomme encore
    getAllStretchesStatus: useCallback(() => {
      const moments = ['matin', 'midi', 'soir'];
      return moments.map((moment) => ({
        moment,
        ...getStretchStatus(moment)
      }));
    }, [getStretchStatus])
  };
};

export default useStretchTracking;
