/**
 * Synthèse compacte de séance pour l’UI Feedback (PC / Mobile).
 * Aucune durée inventée ; valeurs inconnues → null (affichage « — »).
 */

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

/**
 * @param {object|null|undefined} sessionData
 * @returns {{
 *   hasSession: boolean,
 *   sessionDate: string|null,
 *   sessionTitle: string|null,
 *   focusLabel: string|null,
 *   exerciseCount: number|null,
 *   totalReps: number|null,
 *   durationMinutes: number|null,
 *   durationKind: 'measured'|'unknown',
 *   isPartialVsPlan: boolean,
 *   plannedExerciseCount: number|null
 * }}
 */
export function buildSessionFeedbackSummary(sessionData) {
  if (!isPlainObject(sessionData)) {
    return {
      hasSession: false,
      sessionDate: null,
      sessionTitle: null,
      focusLabel: null,
      exerciseCount: null,
      totalReps: null,
      durationMinutes: null,
      durationKind: 'unknown',
      isPartialVsPlan: false,
      plannedExerciseCount: null
    };
  }

  const ctx = isPlainObject(sessionData.sportContext) ? sessionData.sportContext : null;

  const sessionDate =
    typeof sessionData.date === 'string' && sessionData.date
      ? sessionData.date
      : ctx?.dateStr || null;

  const sessionTitle =
    (typeof sessionData.sessionTitle === 'string' && sessionData.sessionTitle) ||
    ctx?.sessionTitle ||
    null;
  const focusLabel =
    (typeof sessionData.focusLabel === 'string' && sessionData.focusLabel) ||
    ctx?.focusLabel ||
    null;

  let exerciseCount = null;
  if (typeof sessionData.totalExercises === 'number' && sessionData.totalExercises > 0) {
    exerciseCount = sessionData.totalExercises;
  } else if (ctx?.recordedExerciseCount != null && ctx.recordedExerciseCount > 0) {
    exerciseCount = ctx.recordedExerciseCount;
  } else if (Array.isArray(sessionData.exercises) && sessionData.exercises.length > 0) {
    exerciseCount = sessionData.exercises.length;
  }
  // tableau vide ou 0 → null (inconnu / pas de travail résolu), pas « 0 » trompeur

  let totalReps = null;
  if (typeof sessionData.totalReps === 'number' && sessionData.totalReps > 0) {
    totalReps = sessionData.totalReps;
  } else if (ctx?.totalReps != null && ctx.totalReps > 0) {
    totalReps = ctx.totalReps;
  } else if (Array.isArray(sessionData.exercises) && sessionData.exercises.length > 0) {
    const sum = sessionData.exercises.reduce((s, ex) => s + (parseInt(ex?.reps, 10) || 0), 0);
    if (sum > 0) totalReps = sum;
  }

  let durationMinutes = null;
  const durationKind =
    sessionData.durationKind === 'measured' || ctx?.durationKind === 'measured'
      ? 'measured'
      : 'unknown';
  const rawDuration =
    typeof sessionData.duration === 'number' ? sessionData.duration : ctx?.measuredDurationMinutes;
  if (
    durationKind === 'measured' &&
    typeof rawDuration === 'number' &&
    Number.isFinite(rawDuration) &&
    rawDuration > 0
  ) {
    durationMinutes = Math.round(rawDuration);
  }

  const isPartialVsPlan =
    sessionData.isPartialVsPlan === true || ctx?.isPartialVsPlan === true;
  const plannedExerciseCount =
    typeof sessionData.plannedExerciseCount === 'number'
      ? sessionData.plannedExerciseCount
      : ctx?.plannedExerciseCount ?? null;

  const hasSession = Boolean(
    sessionDate ||
      sessionTitle ||
      (exerciseCount != null && exerciseCount > 0) ||
      (totalReps != null && totalReps > 0) ||
      durationMinutes != null
  );

  return {
    hasSession,
    sessionDate,
    sessionTitle,
    focusLabel,
    exerciseCount,
    totalReps,
    durationMinutes,
    durationKind,
    isPartialVsPlan,
    plannedExerciseCount
  };
}

/**
 * @param {number|null|undefined} durationMinutes
 * @returns {string|null}
 */
export function formatSessionDurationLabel(durationMinutes) {
  if (durationMinutes == null || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    return null;
  }
  return `${Math.round(durationMinutes)} min`;
}

/**
 * Titre compact : « Séance du 23 novembre · Haut du corps »
 */
export function formatSessionFeedbackHeadline(summary, { locale = 'fr-FR' } = {}) {
  if (!summary?.hasSession) return null;
  const parts = [];
  if (summary.sessionDate) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(summary.sessionDate);
    if (m) {
      const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      const label = d.toLocaleDateString(locale, { day: 'numeric', month: 'long' });
      parts.push(`Séance du ${label}`);
    } else {
      parts.push(`Séance du ${summary.sessionDate}`);
    }
  } else {
    parts.push('Séance');
  }
  const subtitle = summary.sessionTitle || summary.focusLabel;
  if (subtitle) parts.push(subtitle);
  return parts.join(' · ');
}
