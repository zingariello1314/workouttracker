/**
 * Exploration multi-passes. Le premier constat ne suffit pas.
 * Aucune conclusion n'est fabriquée pour remplir une famille.
 */

export const COVERAGE = Object.freeze({
  NO_DATA: 'no_data',
  NO_PHENOMENON: 'no_phenomenon',
  METHOD_UNAVAILABLE: 'method_unavailable',
  UNDER_EXPLORED: 'under_explored',
  CONCLUDED: 'concluded'
});

function hypothesis(id, status, detail) {
  return { id, status, detail };
}

export function exploreVolumeChange(input = {}) {
  const now = Number(input.repsNow);
  const then = Number(input.repsThen);
  if (!Number.isFinite(now) || !Number.isFinite(then)) {
    return {
      coverage: COVERAGE.NO_DATA,
      hypotheses: [],
      retained: [],
      conclusion: null
    };
  }
  if (now === then) {
    return {
      coverage: COVERAGE.NO_PHENOMENON,
      hypotheses: [hypothesis('volume_change', 'rejected', 'les deux fenêtres portent le même volume')],
      retained: [],
      conclusion: null
    };
  }
  const direction = now > then ? 'increase' : 'decrease';
  const hypotheses = [];
  const sessionsNow = Number(input.sessionsNow);
  const sessionsThen = Number(input.sessionsThen);
  if (Number.isFinite(sessionsNow) && Number.isFinite(sessionsThen)) {
    const sessionDelta = sessionsNow - sessionsThen;
    const sessionExplains =
      sessionDelta !== 0 &&
      ((direction === 'increase' && sessionDelta > 0) || (direction === 'decrease' && sessionDelta < 0));
    hypotheses.push(
      hypothesis(
        direction === 'increase' ? 'more_sessions' : 'fewer_sessions',
        sessionExplains ? 'supported' : sessionsNow === sessionsThen ? 'rejected' : 'unsupported_direction',
        `${sessionsThen} séances puis ${sessionsNow}`
      )
    );
  } else {
    hypotheses.push(hypothesis('session_count_change', 'method_unavailable', 'nombre de séances absent'));
  }
  const perNow = Number(input.repsPerSessionNow);
  const perThen = Number(input.repsPerSessionThen);
  if (Number.isFinite(perNow) && Number.isFinite(perThen)) {
    const contentDelta = perNow - perThen;
    const contentExplains =
      contentDelta !== 0 &&
      ((direction === 'increase' && contentDelta > 0) || (direction === 'decrease' && contentDelta < 0));
    hypotheses.push(
      hypothesis(
        direction === 'increase' ? 'more_reps_per_session' : 'fewer_reps_per_session',
        contentExplains ? 'supported' : perNow === perThen ? 'rejected' : 'unsupported_direction',
        `${perThen} puis ${perNow} répétitions par séance`
      )
    );
  } else {
    hypotheses.push(hypothesis('reps_per_session_change', 'method_unavailable', 'volume par séance absent'));
  }
  if (input.repertoireChanged === true) {
    hypotheses.push(hypothesis('repertoire_change', 'supported', 'le répertoire observé change'));
  } else if (input.repertoireChanged === false) {
    hypotheses.push(hypothesis('repertoire_change', 'rejected', 'le répertoire observé ne change pas'));
  } else {
    hypotheses.push(hypothesis('repertoire_change', 'method_unavailable', 'répertoire non comparé'));
  }
  if (input.formatChanged === true) {
    hypotheses.push(hypothesis('format_change', 'supported', 'le format de séries change'));
  } else if (input.formatChanged === false) {
    hypotheses.push(hypothesis('format_change', 'rejected', 'le format de séries ne change pas'));
  } else {
    hypotheses.push(hypothesis('format_change', 'method_unavailable', 'format non comparé'));
  }
  const retained = hypotheses.filter((row) => row.status === 'supported');
  const unavailable = hypotheses.filter((row) => row.status === 'method_unavailable');
  let coverage = COVERAGE.CONCLUDED;
  if (retained.length === 0 && unavailable.length === hypotheses.length) {
    coverage = COVERAGE.METHOD_UNAVAILABLE;
  } else if (retained.length === 0) {
    coverage = COVERAGE.UNDER_EXPLORED;
  } else if (unavailable.length > 0 && retained.length === 1 && hypotheses.length > 2) {
    coverage = COVERAGE.UNDER_EXPLORED;
  }
  const directionLabel = direction === 'increase' ? 'hausse' : 'baisse';
  const conclusion =
    coverage === COVERAGE.CONCLUDED
      ? `La ${directionLabel} de volume s'explique par ${retained.map((row) => row.detail).join(' ; ')}.`
      : null;
  return { coverage, hypotheses, retained, conclusion, direction };
}

/**
 * Passe 3 — journées à volume proche : chercher ce qui diffère.
 */
export function exploreNearEqualSessions(days = []) {
  const rows = (days || [])
    .map((day) => ({
      date: day.date,
      reps: Number(day.reps) || 0,
      challengeReps: Number(day.challengeReps) || 0,
      programReps: Number(day.programReps) || Math.max(0, (Number(day.reps) || 0) - (Number(day.challengeReps) || 0)),
      exerciseCount: Number(day.exerciseCount) || (day.exercises || []).length || 0,
      pushReps: Number(day.pushReps) || 0,
      pullReps: Number(day.pullReps) || 0
    }))
    .filter((day) => day.date && day.reps > 0)
    .sort((a, b) => b.reps - a.reps);
  if (rows.length < 2) {
    return { coverage: COVERAGE.NO_DATA, hypotheses: [], retained: [], conclusion: null };
  }
  const top = rows.slice(0, Math.min(3, rows.length));
  const max = top[0].reps;
  const near = top.filter((day) => max - day.reps <= Math.max(20, max * 0.08));
  if (near.length < 2) {
    return {
      coverage: COVERAGE.NO_PHENOMENON,
      hypotheses: [hypothesis('near_equal_volume', 'rejected', 'les volumes divergent trop')],
      retained: [],
      conclusion: null
    };
  }
  const hypotheses = [
    hypothesis(
      'challenge_share_differs',
      near.some((d) => d.challengeReps > 0) && near.some((d) => d.challengeReps === 0)
        ? 'supported'
        : near.every((d) => d.challengeReps > 0)
          ? 'rejected'
          : 'method_unavailable',
      near.map((d) => `${d.date}: ${d.challengeReps} complément`).join(' ; ')
    ),
    hypothesis(
      'repertoire_breadth_differs',
      Math.max(...near.map((d) => d.exerciseCount)) - Math.min(...near.map((d) => d.exerciseCount)) >= 2
        ? 'supported'
        : 'rejected',
      near.map((d) => `${d.date}: ${d.exerciseCount} mouvements`).join(' ; ')
    ),
    hypothesis(
      'push_pull_mix_differs',
      near.every((d) => d.pushReps + d.pullReps > 0) &&
        Math.max(...near.map((d) => d.pushReps / Math.max(1, d.reps))) -
          Math.min(...near.map((d) => d.pushReps / Math.max(1, d.reps))) >=
          0.12
        ? 'supported'
        : near.every((d) => d.pushReps + d.pullReps === 0)
          ? 'method_unavailable'
          : 'rejected',
      near.map((d) => `${d.date}: poussée ${d.pushReps}`).join(' ; ')
    )
  ];
  const retained = hypotheses.filter((row) => row.status === 'supported');
  const coverage =
    retained.length === 0
      ? hypotheses.every((h) => h.status === 'method_unavailable')
        ? COVERAGE.METHOD_UNAVAILABLE
        : COVERAGE.UNDER_EXPLORED
      : COVERAGE.CONCLUDED;
  return {
    coverage,
    hypotheses,
    retained,
    conclusion:
      coverage === COVERAGE.CONCLUDED
        ? `Des journées à volume proche (${near.map((d) => d.reps).join(', ')} répétitions) diffèrent par ${retained
            .map((row) => row.detail)
            .join(' ; ')}.`
        : null
  };
}

/**
 * Passe 3 — retours simultanés d'une même famille.
 */
export function exploreCollectiveReturn(events = []) {
  const rows = (events || []).filter((row) => row?.exerciseId || row?.name);
  if (rows.length < 3) {
    return {
      coverage: rows.length === 0 ? COVERAGE.NO_DATA : COVERAGE.UNDER_EXPLORED,
      hypotheses: [hypothesis('collective_return', 'method_unavailable', 'moins de trois retours')],
      retained: [],
      conclusion: null
    };
  }
  const dates = rows.map((row) => String(row.date || '').slice(0, 10)).filter(Boolean).sort();
  const spanDays =
    dates.length >= 2
      ? Math.round((new Date(`${dates[dates.length - 1]}T12:00:00`) - new Date(`${dates[0]}T12:00:00`)) / 86400000)
      : 0;
  const sameWindow = spanDays <= 14;
  const sameFamily = rows.every((row) => !row.family) || new Set(rows.map((row) => row.family || 'x')).size <= 2;
  const hypotheses = [
    hypothesis('simultaneous_return', sameWindow ? 'supported' : 'rejected', `fenêtre de ${spanDays} jours`),
    hypothesis('shared_family', sameFamily ? 'supported' : 'rejected', 'famille musculaire ou de mouvement')
  ];
  const retained = hypotheses.filter((row) => row.status === 'supported');
  const coverage = retained.length >= 2 ? COVERAGE.CONCLUDED : COVERAGE.UNDER_EXPLORED;
  return {
    coverage,
    hypotheses,
    retained,
    conclusion:
      coverage === COVERAGE.CONCLUDED
        ? `${rows.length} mouvements reviennent dans une fenêtre courte (${spanDays} jours) : la transformation est collective, pas une série de cas isolés.`
        : null
  };
}

export function exploreDiscovery(discovery) {
  const metrics = discovery?.metrics || {};
  if (discovery?.kind === 'disc_near_equal_sessions' || discovery?.kind === 'disc_session_compare') {
    const days = Array.isArray(metrics.days)
      ? metrics.days
      : Array.isArray(metrics.sessions)
        ? metrics.sessions
        : [];
    return exploreNearEqualSessions(days);
  }
  if (discovery?.kind === 'disc_collective_return' || discovery?.kind === 'disc_family_return') {
    return exploreCollectiveReturn(metrics.events || metrics.returns || []);
  }
  if (discovery?.kind !== 'disc_volume_shape' && discovery?.kind !== 'span_volume_vs_frequency') {
    return null;
  }
  const explored = exploreVolumeChange({
    repsNow: metrics.repsNow ?? metrics.totalReps,
    repsThen: metrics.repsThen ?? metrics.previousReps,
    sessionsNow: metrics.sessionsNow ?? metrics.trainingDays,
    sessionsThen: metrics.sessionsThen ?? metrics.previousTrainingDays,
    repsPerSessionNow: metrics.repsPerSessionNow,
    repsPerSessionThen: metrics.repsPerSessionThen,
    repertoireChanged: metrics.repertoireChanged,
    formatChanged: metrics.formatChanged
  });
  return explored;
}
