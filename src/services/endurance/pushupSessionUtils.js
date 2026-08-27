/**
 * Pompes : total reps, normalisation séries × reps, libellés calendrier / Récap.
 */

export function parsePositiveInt(value) {
  if (value === null || value === undefined || value === '') return 0;
  const n = parseInt(String(value).trim(), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Total reps d’une session (count prioritaire si > 0, sinon setCount × repsPerSet). */
export function resolvePushupSessionTotalReps(session) {
  if (!session || typeof session !== 'object') return 0;
  const direct = parsePositiveInt(session.count ?? session.reps);
  if (direct > 0) return direct;
  const sets = parsePositiveInt(session.setCount ?? session.sets);
  const per = parsePositiveInt(session.repsPerSet ?? session.reps_per_set);
  if (sets > 0 && per > 0) return sets * per;
  return 0;
}

/** Aligne count + champs séries pour persistance et défis. */
export function normalizePushupSessionFields(session = {}) {
  const next = { ...session };
  const setCount = parsePositiveInt(next.setCount ?? next.sets);
  const repsPerSet = parsePositiveInt(next.repsPerSet);
  let count = parsePositiveInt(next.count ?? next.reps);

  if (setCount > 0 && repsPerSet > 0) {
    next.setCount = setCount;
    next.repsPerSet = repsPerSet;
    if (count <= 0) count = setCount * repsPerSet;
  } else {
    delete next.setCount;
    delete next.repsPerSet;
  }

  if (count > 0) {
    next.count = count;
    next.reps = count;
  }

  return next;
}

export function formatPushupSessionBreakdown(session) {
  const total = resolvePushupSessionTotalReps(session);
  const sets = parsePositiveInt(session?.setCount ?? session?.sets);
  const per = parsePositiveInt(session?.repsPerSet);
  if (sets > 0 && per > 0) {
    return `${sets}×${per} (${total} reps)`;
  }
  return total > 0 ? `${total} reps` : '';
}

/** Heure saisie par l’utilisateur (pas une séance recollée depuis les grades). */
export function hasRecordedPushupSessionTime(session) {
  if (!session || session.recoveredFromWorkoutMirror) return false;
  return Boolean(String(session.time || '').trim());
}

/** Objectif défi : séries × reps planifiées si renseignées. */
export function resolvePushupChallengePlannedReps(challenge) {
  if (!challenge) return 0;
  const goalSets = parsePositiveInt(challenge.goalSetCount);
  const goalPer = parsePositiveInt(challenge.goalRepsPerSet);
  if (goalSets > 0 && goalPer > 0) return goalSets * goalPer;
  return parsePositiveInt(challenge.goalCount);
}

export function defaultPushupFormFromChallenge(challenge) {
  const goalSets = parsePositiveInt(challenge?.goalSetCount);
  const goalPer = parsePositiveInt(challenge?.goalRepsPerSet);
  const total = resolvePushupChallengePlannedReps(challenge);
  return {
    setCount: goalSets > 0 ? String(goalSets) : '',
    repsPerSet: goalPer > 0 ? String(goalPer) : '',
    count: total > 0 ? String(total) : '',
    duration: '',
    notes: '',
    congestion: 0,
    motivation: 0,
    sentimentAvant: 0,
    sentimentApres: 0
  };
}
