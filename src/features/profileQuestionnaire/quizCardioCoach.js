/**
 * Alignement cardio enregistré vs jours cardio prévus (SPEC §7).
 */

import { collectEnduranceSessionDates } from '../../utils/sport/recapUserAssessment';

/**
 * @param {object} snapshot
 * @param {Record<string, object>} weekProfiles
 * @param {string[]} activeDayKeys
 * @param {object} answers
 */
export function assessCardioAlignment(snapshot, weekProfiles, activeDayKeys, answers) {
  const dedicated = activeDayKeys.filter((k) => weekProfiles?.[k]?.modality === 'cardio').length;
  const withAddon = activeDayKeys.filter(
    (k) => weekProfiles?.[k]?.modality === 'strength_plus_cardio'
  ).length;
  const plannedSlots = dedicated + withAddon;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 27);
  const startYmd = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
  const endYmd = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;

  const enduranceDays = new Set();
  collectEnduranceSessionDates(snapshot).forEach((d) => {
    if (d >= startYmd && d <= endYmd) enduranceDays.add(d);
  });

  const logged = enduranceDays.size;
  const desire = answers?.cardioTrainingDesire || 'moderate';

  if (plannedSlots === 0) {
    return { plannedSlots, loggedDays28: logged, aligned: true, warning: null };
  }

  let warning = null;
  if (logged > plannedSlots * 4 && (desire === 'minimal' || desire === 'light')) {
    warning =
      'Beaucoup de séances cardio/endurance enregistrées par rapport au plan — le prochain cycle garde la force prioritaire.';
  } else if (logged < Math.max(1, Math.floor(plannedSlots * 0.5)) && (desire === 'high' || desire === 'priority_hiit')) {
    warning =
      'Peu de cardio logué alors que tu vises un volume aérobie élevé — séances dédiées renforcées sur le prochain programme.';
  }

  return {
    plannedSlots,
    loggedDays28: logged,
    aligned: !warning,
    warning
  };
}
