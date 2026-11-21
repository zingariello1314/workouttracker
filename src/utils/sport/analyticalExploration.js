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
      setCount: Number(day.setCount) || Number(day.sets) || 0,
      minutes: Number(day.minutes) || Number(day.durationMinutes) || 0,
      pushReps: Number(day.pushReps) || 0,
      pullReps: Number(day.pullReps) || 0,
      muscleKeys: Array.isArray(day.muscleKeys)
        ? day.muscleKeys
        : Array.isArray(day.muscles)
          ? day.muscles
          : []
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
    ),
    hypothesis(
      'set_volume_differs',
      near.every((d) => d.setCount > 0) &&
        Math.max(...near.map((d) => d.setCount)) - Math.min(...near.map((d) => d.setCount)) >= 3
        ? 'supported'
        : near.every((d) => d.setCount === 0)
          ? 'method_unavailable'
          : 'rejected',
      near.map((d) => `${d.date}: ${d.setCount || '?'} séries`).join(' ; ')
    ),
    hypothesis(
      'duration_differs',
      near.every((d) => d.minutes > 0) &&
        Math.max(...near.map((d) => d.minutes)) - Math.min(...near.map((d) => d.minutes)) >= 15
        ? 'supported'
        : near.every((d) => d.minutes === 0)
          ? 'method_unavailable'
          : 'rejected',
      near.map((d) => `${d.date}: ${d.minutes || '?'} min`).join(' ; ')
    ),
    hypothesis(
      'muscle_composition_differs',
      near.every((d) => d.muscleKeys.length > 0) &&
        new Set(near.map((d) => [...d.muscleKeys].sort().join('|'))).size >= 2
        ? 'supported'
        : near.every((d) => d.muscleKeys.length === 0)
          ? 'method_unavailable'
          : 'rejected',
      near.map((d) => `${d.date}: ${(d.muscleKeys || []).join(',') || 'n/a'}`).join(' ; ')
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
    nearDays: near,
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
const TAXONOMY_FAMILIES = new Set([
  'emergence',
  'repertoire',
  'exercise_progress',
  'session_demand',
  'program_structure',
  'rhythm',
  'volume',
  'return',
  'format',
  'trajectory',
  'now',
  'other'
]);

function muscleFamilyOf(row) {
  const raw = row?.muscleGroup || row?.muscleFamily || row?.family || null;
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  if (!key || TAXONOMY_FAMILIES.has(key) || key.startsWith('disc_')) return null;
  return String(raw).trim();
}

function significantGap(row) {
  const gap = Number(row?.gapDays);
  if (!Number.isFinite(gap) || gap <= 0) return false;
  const habitual = Number(
    row?.habitualGapDays ?? row?.usualGapDays ?? row?.cadenceDays ?? row?.habitualCadenceDays
  );
  // Interruption appréciée vs cadence habituelle documentée ; sinon seuil de sécurité ≥ 14 j.
  if (Number.isFinite(habitual) && habitual > 0) {
    return gap >= Math.max(habitual * 1.5, habitual + 7);
  }
  return gap >= 14;
}

function lookupInto(source, keys) {
  if (!source) return null;
  for (const key of keys) {
    if (key == null || key === '') continue;
    const k = String(key);
    const v =
      source instanceof Map
        ? source.get(k) ?? source.get(k.toLowerCase())
        : source[k] ?? source[k.toLowerCase()];
    if (v != null && v !== '') return v;
  }
  return null;
}

/**
 * Index exercice → groupe musculaire depuis un catalogue / snapshot / programme.
 * Ne retient jamais une étiquette de taxonomie éditoriale (emergence, repertoire…).
 * @param {...Array<object>} lists — objets { id|exerciseId, name, muscleGroup|muscle|group }
 */
export function buildExerciseMuscleIndex(...lists) {
  const index = new Map();
  lists.flat().forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const raw = item.muscleGroup || item.muscleFamily || item.muscle || item.group || null;
    const muscle = muscleFamilyOf({ muscleGroup: raw });
    if (!muscle) return;
    [item.id, item.exerciseId, item.storageId].forEach((id) => {
      if (id != null && id !== '') index.set(String(id), muscle);
    });
    if (item.name) index.set(String(item.name).trim().toLowerCase(), muscle);
  });
  return index;
}

/**
 * Cadence habituelle (médiane des jours entre deux apparitions), hors interruption lue.
 * null sans au moins 3 intervalles documentés avant l'interruption.
 */
export function habitualCadenceFromDates(dates = [], { excludeGapDays = null } = {}) {
  const sorted = [...new Set((dates || []).map((d) => String(d || '').slice(0, 10)).filter(Boolean))].sort();
  if (sorted.length < 4) return null;
  const intervals = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const d = Math.round(
      (new Date(`${sorted[i]}T12:00:00`) - new Date(`${sorted[i - 1]}T12:00:00`)) / 86400000
    );
    if (Number.isFinite(d) && d > 0) intervals.push(d);
  }
  const usable = excludeGapDays != null ? intervals.filter((d) => d < Number(excludeGapDays)) : intervals;
  if (usable.length < 3) return null;
  const s = [...usable].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round(((s[mid - 1] + s[mid]) / 2) * 10) / 10;
}

export function exploreCollectiveReturn(events = [], context = {}) {
  const muscleIndex =
    context.muscleByExercise ||
    (Array.isArray(context.exerciseCatalog) ? buildExerciseMuscleIndex(context.exerciseCatalog) : null);
  // Enrichissement : groupe musculaire (catalogue/snapshot) + cadence habituelle (fréquence connue).
  const keysOf = (row) => [row.exerciseId, row.storageId, String(row.name || '').trim().toLowerCase()];
  const enriched = (events || [])
    .filter((row) => row && (row.exerciseId || row.name))
    .map((row) => {
      const muscleGroup =
        muscleFamilyOf(row) || muscleFamilyOf({ muscleGroup: lookupInto(muscleIndex, keysOf(row)) });
      const cadenceRaw =
        row.habitualGapDays ??
        row.usualGapDays ??
        row.cadenceDays ??
        row.habitualCadenceDays ??
        lookupInto(context.cadenceByExercise, keysOf(row));
      const cadence = Number(cadenceRaw) > 0 ? Number(cadenceRaw) : null;
      return {
        ...row,
        muscleGroup: muscleGroup || null,
        family: muscleGroup || null,
        habitualCadenceDays: cadence
      };
    });
  // Un vrai retour exige une interruption significative — gap 0 / émergence pure ≠ retour.
  const rows = enriched.filter((row) => significantGap(row));
  if (rows.length < 3) {
    return {
      coverage: (events || []).length === 0 ? COVERAGE.NO_DATA : COVERAGE.UNDER_EXPLORED,
      hypotheses: [
        hypothesis(
          'collective_return',
          'method_unavailable',
          'moins de trois retours avec interruption significative (≥ 14 j, ou au-delà de la cadence habituelle quand elle est connue)'
        )
      ],
      retained: [],
      namedMoves: [],
      conclusion: null
    };
  }
  const dates = [...new Set(rows.map((row) => String(row.date || '').slice(0, 10)).filter(Boolean))].sort();
  const spanDays =
    dates.length >= 2
      ? Math.round((new Date(`${dates[dates.length - 1]}T12:00:00`) - new Date(`${dates[0]}T12:00:00`)) / 86400000)
      : 0;
  const sameWindow = spanDays <= 14;
  const families = [...new Set(rows.map((row) => muscleFamilyOf(row)).filter(Boolean))];
  // Une famille musculaire ne lie que si la majorité des retours la documente (≥ 2/3).
  const familyDocumented = rows.filter((row) => muscleFamilyOf(row)).length;
  const sameFamily =
    families.length >= 1 &&
    families.length <= 2 &&
    familyDocumented >= Math.max(2, Math.ceil(rows.length * (2 / 3)));
  const sessionKeys = rows.map((r) => r.sessionFamilyId || r.dayKey || null).filter(Boolean);
  const sharedSession =
    sessionKeys.length >= 2 && new Set(sessionKeys).size <= 2
      ? 'supported'
      : sessionKeys.length === 0
        ? 'method_unavailable'
        : 'rejected';
  const programVersion =
    context.programVersionChanged === true
      ? 'supported'
      : context.programVersionChanged === false
        ? 'rejected'
        : 'method_unavailable';
  const gaps = rows
    .map((r) => Number(r.gapDays))
    .filter((n) => Number.isFinite(n) && n > 0);
  const namedMoves = rows.map((r) => ({
    name: r.name || String(r.exerciseId),
    date: String(r.date || '').slice(0, 10) || null,
    gapDays: Number.isFinite(Number(r.gapDays)) ? Number(r.gapDays) : null,
    family: muscleFamilyOf(r),
    muscleGroup: muscleFamilyOf(r),
    exerciseId: r.exerciseId || null,
    habitualCadenceDays: r.habitualCadenceDays || null,
    gapVsCadence:
      r.habitualCadenceDays && Number(r.gapDays) > 0
        ? Math.round((Number(r.gapDays) / r.habitualCadenceDays) * 10) / 10
        : null
  }));
  const cadenceKnown = namedMoves.filter((m) => m.gapVsCadence != null);
  const hypotheses = [
    hypothesis('simultaneous_return', sameWindow ? 'supported' : 'rejected', `fenêtre de ${spanDays} jours`),
    hypothesis(
      'shared_family',
      sameFamily ? 'supported' : families.length === 0 ? 'method_unavailable' : 'rejected',
      families.join(', ') || 'familles musculaires non documentées'
    ),
    hypothesis('shared_session_family', sharedSession, 'appartenance à une famille de séances documentée'),
    hypothesis('program_version_link', programVersion, 'lien à une nouvelle version de programme')
  ];
  const retained = hypotheses.filter((row) => row.status === 'supported');
  // Une fenêtre courte seule ne suffit pas : il faut un lien réel (famille / séance / version)
  const linked = retained.some((h) => h.id !== 'simultaneous_return');
  const coverage =
    sameWindow && linked
      ? COVERAGE.CONCLUDED
      : COVERAGE.UNDER_EXPLORED;
  const nameList = namedMoves
    .map((m) => (m.gapDays != null && m.gapDays > 0 ? `${m.name} (après ${m.gapDays} j)` : m.name))
    .slice(0, 6)
    .join(', ');
  const dateLabel =
    dates.length === 1
      ? `autour du ${dates[0]}`
      : `entre le ${dates[0]} et le ${dates[dates.length - 1]} (${spanDays} jours)`;
  const conclusion =
    coverage === COVERAGE.CONCLUDED
      ? [
          `${rows.length} mouvements reviennent ${dateLabel} : ${nameList}${namedMoves.length > 6 ? '…' : ''}.`,
          retained.some((h) => h.id === 'shared_session_family')
            ? 'Ils appartiennent à une même famille de séances documentée.'
            : retained.some((h) => h.id === 'shared_family')
              ? `Ils se rattachent à des familles musculaires proches (${families.join(', ')}).`
              : retained.some((h) => h.id === 'program_version_link')
                ? 'Leur retour coïncide avec une évolution documentée du programme.'
                : null,
          gaps.length
            ? `Les interruptions documentées vont de ${Math.min(...gaps)} à ${Math.max(...gaps)} jours.`
            : null,
          cadenceKnown.length
            ? `Pour ${cadenceKnown.length} d'entre eux, l'interruption dépasse nettement leur cadence habituelle (${cadenceKnown
                .slice(0, 3)
                .map((m) => `${m.name} : ${m.gapDays} j pour une cadence d'environ ${m.habitualCadenceDays} j`)
                .join(' ; ')}).`
            : null,
          'La transformation est collective parce que ces retours sont liés, pas seulement simultanés.'
        ]
          .filter(Boolean)
          .join(' ')
      : sameWindow
        ? `${rows.length} mouvements réapparaissent dans une fenêtre courte (${spanDays} jours), mais le lien structurel (famille de séances, famille musculaire documentée ou version de programme) n'est pas encore démontré : la simultanéité seule ne prouve pas une transformation collective.`
        : null;
  return {
    coverage,
    hypotheses,
    retained,
    namedMoves,
    dates,
    spanDays,
    conclusion
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
