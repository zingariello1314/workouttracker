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
 * Étoiles 1–5 « ressenti du jour » : `stretchSessionEffortStars` (même clé que checkedStretches),
 * utilisées dans le calcul d’XP quand présentes ; supprimées si l’étirement est décoché.
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
 *   getStretchStatus:(moment: string, stretchId?: string|number) => {isChecked: boolean, sessionEffortStars: number|null},
 *   updateStretchSessionEffortStars:(moment: string, stretchId: string|number, starCount: number) => void,
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

    const nextStars = { ...(currentData.stretchSessionEffortStars || {}) };
    if (isCurrentlyChecked) delete nextStars[key];

    const newData = {
      ...currentData,
      checkedStretches: {
        ...currentData.checkedStretches,
        [key]: !isCurrentlyChecked
      },
      stretchSessionEffortStars: nextStars
    };
    updateTempStretchData(newData);
    options.onAfterStretchDataChange?.(newData);
  }, [date, getCurrentData, updateTempStretchData, options.onAfterStretchDataChange]);

  /**
   * Statut d'un étirement (legacy `moment` ou item individuel `moment + stretchId`).
   */
  const getStretchStatus = useCallback((moment, stretchId = null) => {
    const currentData = getCurrentData();

    const key = stretchId != null
      ? generateStretchItemKey(date, moment, stretchId)
      : generateStretchKey(date, moment);

    const rawStars =
      stretchId != null ? currentData.stretchSessionEffortStars?.[key] : undefined;
    const sn = Number(rawStars);
    const sessionEffortStars =
      Number.isFinite(sn) && sn >= 1 && sn <= 5 ? Math.round(sn) : null;

    return {
      isChecked: currentData.checkedStretches?.[key] || false,
      sessionEffortStars
    };
  }, [date, getCurrentData]);

  /**
   * @param {number} starCount — 1–5 ; hors plage ou NaN retire la note
   */
  const updateStretchSessionEffortStars = useCallback((moment, stretchId, starCount) => {
    const currentData = getCurrentData();
    const key = generateStretchItemKey(date, moment, stretchId);
    const next = { ...(currentData.stretchSessionEffortStars || {}) };
    const n = Math.round(Number(starCount));
    if (!Number.isFinite(n) || n < 1 || n > 5) {
      delete next[key];
    } else {
      next[key] = n;
    }
    updateTempStretchData({
      ...currentData,
      stretchSessionEffortStars: next
    });
  }, [date, getCurrentData, updateTempStretchData]);

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
    updateStretchSessionEffortStars,
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
