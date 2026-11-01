/**
 * F2 — Contrats des fenêtres temporelles (rôles W / C / H / E).
 *
 * Une découverte peut s’appuyer sur un historique long sans présenter cet
 * historique comme la période sélectionnée par l’utilisateur.
 */

import { getRecapDateWindow, isDateInRecapWindow } from './recapMuscleLoadEngine';
import { inclusiveCalendarSpanDays, addCalendarDays } from './garminRunningPeriodStats';

/** Rôles de fenêtre. */
export const WINDOW_ROLE = Object.freeze({
  PRIMARY: 'primaryWindow',
  COMPARISON: 'comparisonWindow',
  HISTORICAL: 'historicalContextWindow',
  EVENT: 'eventWindow'
});

export const WINDOW_ROLE_LABEL_FR = Object.freeze({
  [WINDOW_ROLE.PRIMARY]: 'Fenêtre principale (période sélectionnée)',
  [WINDOW_ROLE.COMPARISON]: 'Fenêtre de comparaison',
  [WINDOW_ROLE.HISTORICAL]: 'Contexte historique (interprétation, pas sujet)',
  [WINDOW_ROLE.EVENT]: 'Fenêtre d’événements fondateurs'
});

/** Horizons historiques fixes déjà utilisés dans le moteur (audit, pas suppression). */
export const FIXED_HISTORICAL_HORIZONS = Object.freeze({
  HABIT_BASELINE_DAYS: 30,
  JOURNEY_CONTEXT_DAYS: 91,
  QUARTER_PROFILE: 'quarter',
  IDENTITY_LOOKBACK_DAYS: 126
});

/**
 * Décrit une fenêtre avec métadonnées de contrat.
 * @param {{ start: string|null, end: string }} window
 * @param {string} role WINDOW_ROLE.*
 * @param {{ source?: string, reason?: string, eligibleDays?: number|null }} [meta]
 */
export function describeContractWindow(window, role, meta = {}) {
  const start = window?.start ?? null;
  const end = window?.end ?? null;
  const spanDays =
    start && end ? inclusiveCalendarSpanDays(start, end) : end && !start ? null : 0;
  return {
    role,
    roleLabelFr: WINDOW_ROLE_LABEL_FR[role] || role,
    start,
    end,
    inclusiveBounds: true,
    spanDays,
    eligibleDays: meta.eligibleDays ?? null,
    source: meta.source || null,
    reason: meta.reason || null
  };
}

/**
 * Fenêtre primaire depuis l’id de période Recap.
 */
export function primaryWindowForPeriod(period, ref = new Date()) {
  const w = getRecapDateWindow(period, ref);
  return describeContractWindow(w, WINDOW_ROLE.PRIMARY, {
    source: `getRecapDateWindow(${period})`,
    reason: 'Période sélectionnée par l’utilisateur'
  });
}

/**
 * Fenêtre précédente de même durée calendaire (si start connu).
 */
export function previousEqualLengthWindow(primary) {
  const start = primary?.start;
  const end = primary?.end;
  if (!start || !end) return null;
  const span = inclusiveCalendarSpanDays(start, end);
  if (!span || span < 1) return null;
  const prevEnd = addCalendarDays(start, -1);
  const prevStart = addCalendarDays(prevEnd, -(span - 1));
  return describeContractWindow(
    { start: prevStart, end: prevEnd },
    WINDOW_ROLE.COMPARISON,
    {
      source: 'previous_equal_length',
      reason: 'Période précédente de même durée calendaire'
    }
  );
}

/**
 * Contexte journey (−91 j. jusqu’à end) — ne doit pas être présenté comme 3 mois sélectionnés.
 */
export function journeyHistoricalWindow(endYmd) {
  if (!endYmd) return null;
  const start = addCalendarDays(endYmd, -(FIXED_HISTORICAL_HORIZONS.JOURNEY_CONTEXT_DAYS));
  return describeContractWindow(
    { start, end: endYmd },
    WINDOW_ROLE.HISTORICAL,
    {
      source: 'journey_91d',
      reason: 'Contexte de parcours pour interpréter la période primaire'
    }
  );
}

/**
 * true si une date d’événement est dans la fenêtre primaire.
 */
export function eventDateInPrimary(eventYmd, primaryWindow) {
  if (!eventYmd || !primaryWindow) return false;
  return isDateInRecapWindow(eventYmd, primaryWindow);
}

/**
 * Règles de publication : un fait hors primary ne peut être « observation de période »
 * que s’il est tagué historical / comparison.
 */
export function assertFactRoleAllowed(factYmd, primaryWindow, role) {
  const inPrimary = eventDateInPrimary(factYmd, primaryWindow);
  if (inPrimary) {
    return { ok: true, role: role || WINDOW_ROLE.PRIMARY };
  }
  if (role === WINDOW_ROLE.HISTORICAL || role === WINDOW_ROLE.COMPARISON) {
    return { ok: true, role };
  }
  return {
    ok: false,
    reason: 'fact_outside_primary_without_historical_or_comparison_role',
    factYmd,
    primary: { start: primaryWindow?.start, end: primaryWindow?.end }
  };
}

/**
 * Comparabilité sommaire de deux fenêtres (durées / couverture).
 */
export function assessWindowComparability(a, b, { coveredA = null, coveredB = null } = {}) {
  const spanA = a?.spanDays ?? (a?.start && a?.end ? inclusiveCalendarSpanDays(a.start, a.end) : null);
  const spanB = b?.spanDays ?? (b?.start && b?.end ? inclusiveCalendarSpanDays(b.start, b.end) : null);
  const equalLength = spanA != null && spanB != null && spanA === spanB;
  const coverageGap =
    coveredA != null && coveredB != null ? Math.abs(coveredA - coveredB) : null;
  return {
    equalCalendarLength: equalLength,
    spanA,
    spanB,
    coverageGap,
    comparableAsEqualLength: equalLength,
    note: equalLength
      ? 'Durées calendaires égales — vérifier aussi la couverture de données'
      : 'Durées inégales — ne pas présenter comme fenêtres équivalentes'
  };
}

/** Aujourd’hui = rolling 24h (convention produit existante). */
export function todayWindowMode() {
  return {
    mode: 'rolling-24h',
    note:
      'getRecapDateWindow(today) utilise les dernières 24 h glissantes, pas minuit→maintenant. ' +
      'La nuit rattachée au jour civil (wake morning) est un contrat distinct.'
  };
}
