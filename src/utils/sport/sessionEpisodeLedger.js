/**
 * Mission 19/20 — représentation canonique des occurrences / séances / épisodes de reprise.
 * Source : catalogue de séances (population CLASSIC_SESSION) — pas un second agrégateur de volume.
 * Les métriques de volume général (STRENGTH_INCLUSIVE) restent dans measureRecapWindow /
 * canonicalAnalyticalPopulations ; ce ledger consomme les occurrences déjà classées.
 * (Constante locale pour éviter un import circulaire avec canonicalAnalyticalPopulations.)
 */

import { inferMuscleGroupsForExercise } from './recapMuscleInference';

export const LEDGER_POPULATION_ID = 'classic_session_catalog';

function ymd(d) {
  return String(d || '').slice(0, 10);
}

/**
 * Digest court des participants — stable, discriminant, sans IDs bruts 9+ chiffres
 * (évite le rejet editorial raw_exercise_id sur les clés d’épisode).
 */
function participantDigest(ids = []) {
  const payload = ids.join('+') || 'empty';
  let h = 2166136261;
  for (let i = 0; i < payload.length; i++) {
    h ^= payload.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

/**
 * Identité d’épisode stable : date de reprise + digest des participants.
 * Indépendante de la prose ; discrimine deux reprises le même jour.
 * Les IDs bruts restent dans metrics.namedMoves / proofIds, pas dans l’identité publique.
 */
export function stableReturnEpisodeId(events = [], returnDate = null) {
  const date = ymd(returnDate || events[0]?.returnDate || events[0]?.date);
  const ids = [
    ...new Set(
      (events || [])
        .map((e) => String(e.exerciseId || e.name || '').trim())
        .filter(Boolean)
    )
  ].sort();
  return `return_episode|${date || 'na'}|p:${participantDigest(ids)}|n:${ids.length}`;
}

/**
 * Continuité d’épisode : un enrichissement tardif de participants ne doit pas
 * inventer un phénomène disjoint si le chevauchement est majoritaire.
 */
export function resolveContinuousEpisodeId(
  events = [],
  returnDate = null,
  priorPhenomena = null
) {
  const freshId = stableReturnEpisodeId(events, returnDate);
  const date = ymd(returnDate || events[0]?.returnDate || events[0]?.date);
  const ids = [
    ...new Set(
      (events || [])
        .map((e) => String(e.exerciseId || e.name || '').trim())
        .filter(Boolean)
    )
  ].sort();
  if (!date || !ids.length || !priorPhenomena || typeof priorPhenomena !== 'object') {
    return { episodeId: freshId, continued: false, aliases: [], overlapRatio: 1 };
  }
  let best = null;
  Object.entries(priorPhenomena).forEach(([id, phen]) => {
    if (!String(id).startsWith(`return_episode|${date}|`)) return;
    const priorIds = [
      ...new Set(
        [
          ...(phen.participantIds || []),
          ...(phen.confirmedParticipants || []),
          ...((phen.proofIds || [])
            .map((p) => String(p).replace(/^ex:/, ''))
            .filter((p) => p && !p.startsWith('return:') && !p.startsWith('confirm:')))
        ].map(String)
      )
    ];
    if (!priorIds.length) return;
    const priorSet = new Set(priorIds);
    const inter = ids.filter((x) => priorSet.has(x)).length;
    const union = new Set([...ids, ...priorIds]).size;
    const ratio = union ? inter / union : 0;
    if (ratio < 0.5) return;
    if (!best || ratio > best.overlapRatio) {
      best = { episodeId: id, continued: true, aliases: [freshId], overlapRatio: ratio };
    }
  });
  if (!best) return { episodeId: freshId, continued: false, aliases: [], overlapRatio: 1 };
  if (best.episodeId !== freshId) {
    best.aliases = [...new Set([...(best.aliases || []), freshId])];
  }
  return best;
}

/**
 * Occurrences exercice×date dérivées du catalogue de séances.
 * Un jour = une entrée catalogue ; plusieurs exercices y coexistent (même séance calendaire).
 * @returns {Array<{
 *   occurrenceId: string,
 *   date: string,
 *   sessionKey: string,
 *   exerciseId: string,
 *   name: string,
 *   reps: number|null,
 *   muscles: string[]
 * }>}
 */
export function buildOccurrenceLedgerFromCatalog(catalog = []) {
  const out = [];
  (catalog || []).forEach((session) => {
    const date = ymd(session?.date);
    if (!date) return;
    const sessionKey = `session:${date}`;
    const muscles = Array.isArray(session.muscles) ? session.muscles.map(String) : [];
    (session.exercises || []).forEach((ex) => {
      const exerciseId = String(ex?.id || ex?.exerciseId || '').trim();
      if (!exerciseId) return;
      const reps = Number(ex?.reps);
      const name = String(ex?.name || '').trim() || exerciseId;
      // Mission 20 — muscles par mouvement (pas l’union journalière [0]).
      const perMove = inferMuscleGroupsForExercise({ name, id: exerciseId }) || [];
      out.push({
        occurrenceId: `occ:${date}|ex:${exerciseId}`,
        date,
        sessionKey,
        exerciseId,
        name,
        reps: Number.isFinite(reps) ? reps : null,
        muscles: perMove.length ? perMove.map(String) : muscles
      });
    });
  });
  return out.sort((a, b) => a.date.localeCompare(b.date) || a.exerciseId.localeCompare(b.exerciseId));
}

/**
 * Événements de reprise (interruption significative) à partir du ledger — sans cartes.
 * @returns {Array<object>} format compatible exploreCollectiveReturn
 */
export function buildReturnEventsFromLedger(occurrences = [], { minGapDays = 14 } = {}) {
  const byEx = new Map();
  (occurrences || []).forEach((row) => {
    if (!row?.exerciseId || !row?.date) return;
    const list = byEx.get(row.exerciseId) || [];
    list.push(row);
    byEx.set(row.exerciseId, list);
  });

  const events = [];
  byEx.forEach((rows, exerciseId) => {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const dates = [...new Set(sorted.map((r) => r.date))];
    for (let i = 1; i < dates.length; i += 1) {
      const before = dates[i - 1];
      const after = dates[i];
      const gapDays = Math.round(
        (new Date(`${after}T12:00:00`) - new Date(`${before}T12:00:00`)) / 86400000
      );
      if (!Number.isFinite(gapDays) || gapDays < minGapDays) continue;
      const beforeOcc = sorted.filter((r) => r.date === before).sort((a, b) => (b.reps || 0) - (a.reps || 0))[0];
      const afterOcc = sorted.filter((r) => r.date === after).sort((a, b) => (b.reps || 0) - (a.reps || 0))[0];
      const later = dates.slice(i + 1);
      const confirmationDates = later.filter((d) => d > after);
      // Cadence habituelle hors gap courant
      const intervals = [];
      for (let j = 1; j < i; j += 1) {
        const g = Math.round(
          (new Date(`${dates[j]}T12:00:00`) - new Date(`${dates[j - 1]}T12:00:00`)) / 86400000
        );
        if (g > 0 && g < gapDays) intervals.push(g);
      }
      const habitual =
        intervals.length >= 3
          ? [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length / 2)]
          : null;
      events.push({
        exerciseId,
        name: afterOcc?.name || beforeOcc?.name || exerciseId,
        date: after,
        returnDate: after,
        lastBefore: before,
        gapBefore: before,
        gapDays,
        confirmationDates,
        dates: [after, ...confirmationDates],
        prevReps: beforeOcc?.reps ?? null,
        currentReps: afterOcc?.reps ?? null,
        habitualCadenceDays: habitual,
        sessionKey: afterOcc?.sessionKey || `session:${after}`,
        sessionFamilyId: null,
        muscleGroup: null,
        muscleGroups: afterOcc?.muscles || beforeOcc?.muscles || [],
        family: null,
        gapProvenByConsolidation: gapDays >= 21,
        mechanism: gapDays >= 21 ? 'ledger_significant_gap' : 'ledger_gap',
        sourceKind: 'session_episode_ledger',
        coSessionExerciseIds: sorted
          .filter((r) => r.date === after && r.exerciseId !== exerciseId)
          .map((r) => r.exerciseId)
      });
    }
  });
  return events;
}

/**
 * Épisode collectif candidat : cluster de reprises le même jour.
 */
export function clusterLedgerReturnEpisodes(returnEvents = [], { window = null } = {}) {
  const byDate = new Map();
  (returnEvents || []).forEach((e) => {
    const d = ymd(e.returnDate || e.date);
    if (!d) return;
    if (!byDate.has(d)) byDate.set(d, []);
    byDate.get(d).push(e);
  });
  return [...byDate.entries()]
    .map(([date, rows]) => ({
      episodeId: stableReturnEpisodeId(rows, date),
      date,
      size: rows.length,
      events: rows,
      inWindow:
        !window ||
        ((!window.start || date >= window.start) && (!window.end || date <= window.end)),
      confirmationInWindow: rows.some((e) =>
        (e.confirmationDates || []).some(
          (c) =>
            (!window?.start || c >= window.start) && (!window?.end || c <= window.end)
        )
      )
    }))
    .sort((a, b) => {
      const aw = (a.inWindow ? 2 : 0) + (a.confirmationInWindow ? 1 : 0);
      const bw = (b.inWindow ? 2 : 0) + (b.confirmationInWindow ? 1 : 0);
      if (bw !== aw) return bw - aw;
      return b.size - a.size || b.date.localeCompare(a.date);
    });
}

/**
 * Niveaux de qualification pour un épisode (participants / confirmation / niveaux).
 */
export function qualifyEpisodeLevels(events = []) {
  const participants = events || [];
  const withConfirm = participants.filter((e) => (e.confirmationDates || []).length > 0);
  const withRef = participants.filter(
    (e) => Number.isFinite(Number(e.prevReps)) && Number(e.prevReps) > 0
  );
  const recovered = withRef.filter(
    (e) => Number.isFinite(Number(e.currentReps)) && Number(e.currentReps) >= Number(e.prevReps) * 0.9
  );
  const partial = withRef.filter(
    (e) => Number.isFinite(Number(e.currentReps)) && Number(e.currentReps) < Number(e.prevReps) * 0.9
  );
  const unevaluable = participants.filter(
    (e) => !Number.isFinite(Number(e.prevReps)) || Number(e.prevReps) <= 0
  );
  return {
    participantCount: participants.length,
    confirmationCount: withConfirm.length,
    documentedPriorCount: withRef.length,
    recoveredCount: recovered.length,
    partialCount: partial.length,
    unevaluableCount: unevaluable.length,
    participants: participants.map((e) => e.name || e.exerciseId),
    recovered: recovered.map((e) => e.name || e.exerciseId),
    partial: partial.map((e) => e.name || e.exerciseId),
    unevaluable: unevaluable.map((e) => e.name || e.exerciseId)
  };
}
