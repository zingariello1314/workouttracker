/**
 * Comparaison multidimensionnelle de séances.
 * Quatre issues. Pas de score reps × difficulté. Pas d'effort inventé.
 */

export const COMPARISON_OUTCOME = Object.freeze({
  DIMENSION_SUPERIORITY: 'dimension_superiority',
  GOAL_CONDITIONED: 'goal_conditioned',
  INCONCLUSIVE: 'inconclusive',
  DIFFERENT_NATURE: 'different_nature'
});

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function winner(a, b) {
  if (a == null || b == null || a === b) return null;
  return a > b ? 'a' : 'b';
}

export function loadsAreComparable(before, after) {
  if (!before?.recorded || !after?.recorded) {
    return { comparable: false, reason: 'load_unknown' };
  }
  if (before.value == null || after.value == null) {
    return { comparable: false, reason: 'load_unparsed' };
  }
  const modeA = before.mode || before.provenance || null;
  const modeB = after.mode || after.provenance || null;
  if ((modeA === 'per_arm' && modeB === 'total') || (modeA === 'total' && modeB === 'per_arm')) {
    return { comparable: false, reason: 'per_arm_vs_total' };
  }
  if ((before.assistance && !after.assistance) || (!before.assistance && after.assistance)) {
    return { comparable: false, reason: 'assistance_vs_resistance' };
  }
  if (before.variantId && after.variantId && String(before.variantId) !== String(after.variantId)) {
    return { comparable: false, reason: 'variant_change' };
  }
  if (before.unit && after.unit && before.unit !== after.unit) {
    return { comparable: false, reason: 'unit_mismatch' };
  }
  const reconstructed = (row) => {
    const provenance = String(row?.provenance || '');
    return provenance === 'replicated' || provenance === 'reconstructed' || provenance.startsWith('reconstructed');
  };
  if (reconstructed(before) || reconstructed(after)) {
    return { comparable: false, reason: 'reconstructed_load' };
  }
  return { comparable: true, reason: 'same_conditions' };
}

export function compareResistanceAtFormat(before, after) {
  const loads = loadsAreComparable(before?.load, after?.load);
  if (!loads.comparable) return { comparable: false, reason: loads.reason, change: null };
  const sameSets = before.setCount != null && before.setCount === after.setCount;
  const sameReps = before.reps != null && before.reps === after.reps;
  if (!sameSets || !sameReps) {
    return { comparable: true, reason: 'format_differs', change: 'format_or_volume_differs' };
  }
  if (after.load.value > before.load.value) {
    return { comparable: true, reason: 'same_format', change: 'load_up_same_format', delta: after.load.value - before.load.value };
  }
  if (after.load.value < before.load.value) {
    return { comparable: true, reason: 'same_format', change: 'load_down_same_format', delta: after.load.value - before.load.value };
  }
  return { comparable: true, reason: 'same_format', change: 'load_stable' };
}

function countNature(session) {
  const exercises = session?.exercises || [];
  let polyarticular = 0;
  let localized = 0;
  let other = 0;
  let resistanceRaises = session?.resistanceRaises || 0;
  exercises.forEach((exercise) => {
    if (exercise.orphan || exercise.standing === 'historical_orphan') return;
    const nature = exercise.movementNature || 'other';
    if (nature === 'polyarticular') polyarticular += 1;
    else if (nature === 'localized') localized += 1;
    else other += 1;
  });
  return { polyarticular, localized, other, resistanceRaises };
}

/**
 * @returns {{ outcome: string, ahead: object, limits: string[] }}
 */
export function compareSessionWork(sessionA, sessionB, { goal = null } = {}) {
  const a = {
    reps: num(sessionA?.reps),
    sets: num(sessionA?.recordedSetCount),
    ...countNature(sessionA)
  };
  const b = {
    reps: num(sessionB?.reps),
    sets: num(sessionB?.recordedSetCount),
    ...countNature(sessionB)
  };
  const limits = [];
  if (a.sets == null || b.sets == null) limits.push('recorded_sets_incomplete');
  if ((sessionA?.loadCoverage || 0) < 0.5 || (sessionB?.loadCoverage || 0) < 0.5) {
    limits.push('load_coverage_insufficient');
  }
  const ahead = {
    reps: winner(a.reps, b.reps),
    sets: winner(a.sets, b.sets),
    polyarticular: winner(a.polyarticular, b.polyarticular),
    localized: winner(a.localized, b.localized),
    resistanceRaises: winner(a.resistanceRaises, b.resistanceRaises)
  };
  const natureSplit =
    a.polyarticular >= 2 &&
    b.reps != null &&
    a.reps != null &&
    b.reps > a.reps &&
    b.localized >= a.localized &&
    a.polyarticular > b.polyarticular;
  if (natureSplit) {
    return {
      outcome: COMPARISON_OUTCOME.DIFFERENT_NATURE,
      ahead,
      profileA: a,
      profileB: b,
      limits,
      claim: 'Les deux séances n’ont pas la même nature de travail enregistrée.'
    };
  }
  const goalText = `${goal?.dimension || ''} ${goal?.focus || ''} ${goal?.label || goal?.text || ''}`.toLowerCase();
  const goalAxes = [
    { test: /résistance|resistance|charge|lest/, key: 'resistanceRaises', label: 'résistance' },
    { test: /polyarticulaire/, key: 'polyarticular', label: 'travail polyarticulaire' },
    { test: /localis/, key: 'localized', label: 'travail localisé' },
    { test: /\bvolume\b|répétitions?/, key: 'reps', label: 'volume' },
    { test: /s[eé]ries?|\bformat\b/, key: 'sets', label: 'format' }
  ];
  const goalAxis = goal ? goalAxes.find((axis) => axis.test.test(goalText)) : null;
  const goalValue = (profile, key) => (key === 'reps' ? profile.reps : key === 'sets' ? profile.sets : profile[key]);
  if (
    goalAxis &&
    ahead[goalAxis.key] &&
    goalValue(a, goalAxis.key) != null &&
    goalValue(b, goalAxis.key) != null
  ) {
    const side = ahead[goalAxis.key] === 'a' ? 'première' : 'seconde';
    return {
      outcome: COMPARISON_OUTCOME.GOAL_CONDITIONED,
      ahead,
      profileA: a,
      profileB: b,
      limits,
      goalAxis: goalAxis.label,
      claim: `Pour l’objectif documenté (${goalAxis.label}), la ${side} séance est devant sur cette dimension. Les autres mesures ne remplacent pas cet objectif.`
    };
  }
  const demonstrated = ['sets', 'resistanceRaises', 'polyarticular'].filter((key) => ahead[key]);
  const repsOnly = ahead.reps && demonstrated.length === 0 && limits.includes('load_coverage_insufficient');
  if (repsOnly) {
    return {
      outcome: COMPARISON_OUTCOME.INCONCLUSIVE,
      ahead,
      profileA: a,
      profileB: b,
      limits,
      claim: 'Le nombre de répétitions diffère, sans couverture suffisante pour dire quelle séance est la plus exigeante.'
    };
  }
  if (demonstrated.length > 0) {
    return {
      outcome: COMPARISON_OUTCOME.DIMENSION_SUPERIORITY,
      ahead,
      profileA: a,
      profileB: b,
      limits,
      claim: 'Une séance est devant sur une dimension observée, sans verdict global de difficulté.'
    };
  }
  return {
    outcome: COMPARISON_OUTCOME.INCONCLUSIVE,
    ahead,
    profileA: a,
    profileB: b,
    limits,
    claim: 'Les dimensions disponibles ne départagent pas les deux séances.'
  };
}

function medianOf(values) {
  const sorted = values.filter((n) => n != null && Number.isFinite(n)).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function profileScale(days) {
  const medianReps = medianOf((days || []).map((day) => Number(day?.reps) || 0).filter((n) => n > 0));
  const medianSets = medianOf(
    (days || []).map((day) => day?.recordedSetCount).filter((n) => n != null && Number(n) > 0).map(Number)
  );
  return {
    medianReps,
    medianSets,
    repGapFloor: Math.max(8, Math.round((medianReps || 0) * 0.12)),
    setGapFloor: Math.max(2, medianSets != null ? Math.round(medianSets * 0.34) : 2)
  };
}

function comparisonMateriality(sessionA, sessionB, comparison, scale) {
  const repGap = Math.abs((sessionA?.reps || 0) - (sessionB?.reps || 0));
  const setGap =
    sessionA?.recordedSetCount != null && sessionB?.recordedSetCount != null
      ? Math.abs(sessionA.recordedSetCount - sessionB.recordedSetCount)
      : 0;
  const repFloor = scale?.repGapFloor || 8;
  const setFloor = scale?.setGapFloor || 2;
  if (comparison.outcome === COMPARISON_OUTCOME.DIFFERENT_NATURE) return 3;
  if (comparison.outcome === COMPARISON_OUTCOME.GOAL_CONDITIONED) return 3;
  if (comparison.outcome === COMPARISON_OUTCOME.DIMENSION_SUPERIORITY && (setGap >= setFloor || repGap >= repFloor)) {
    return 2;
  }
  if (comparison.outcome === COMPARISON_OUTCOME.INCONCLUSIVE && repGap >= repFloor) return 1;
  return 0;
}

export function chooseSessionComparison(days, { goal = null } = {}) {
  const scale = profileScale(days);
  const entryFloor = Math.max(8, Math.round((scale.medianReps || 0) * 0.2));
  const pool = (days || []).filter((day) => (day.reps || 0) >= entryFloor);
  const considered = [];
  let chosen = null;
  for (let i = 0; i < pool.length; i += 1) {
    for (let j = i + 1; j < pool.length; j += 1) {
      const comparison = compareSessionWork(pool[i], pool[j], { goal });
      const material = comparisonMateriality(pool[i], pool[j], comparison, scale);
      if (considered.length < 12 || material > 0) {
        considered.push({
          dateA: pool[i].date,
          dateB: pool[j].date,
          outcome: comparison.outcome,
          material,
          repA: pool[i].reps,
          repB: pool[j].reps
        });
      }
      if (!material) continue;
      if (!chosen || material > chosen.material) {
        chosen = { material, a: pool[i], b: pool[j], comparison };
      }
    }
  }
  return {
    chosen,
    consideredCount: considered.length,
    considered: considered.filter((row) => row.material > 0).slice(0, 8),
    skippedNearTies: considered.filter((row) => row.material === 0).length,
    materiality: scale
  };
}

export function decomposeUnusualSession(session, typical = null) {
  const exercises = (session?.exercises || []).filter((row) => row.standing !== 'historical_orphan' && !row.orphan);
  const orphanReps = (session?.exercises || [])
    .filter((row) => row.standing === 'historical_orphan' || row.orphan)
    .reduce((sum, row) => sum + (Number(row.reps) || 0), 0);
  const top = [...exercises].sort((a, b) => (b.reps || 0) - (a.reps || 0))[0] || null;
  const topShare = session?.reps > 0 && top ? top.reps / session.reps : null;
  const mechanisms = [];
  if (topShare != null && topShare >= 0.45 && top?.name) mechanisms.push('single_exercise');
  if (typical?.exerciseCount != null && exercises.length >= typical.exerciseCount + 2) mechanisms.push('more_movements');
  if (session?.recordedSetCount != null && typical?.recordedSetCount != null && session.recordedSetCount >= typical.recordedSetCount + 2) {
    mechanisms.push('more_sets');
  }
  const perSet = session?.recordedSetCount ? session.reps / session.recordedSetCount : null;
  if (perSet != null && typical?.repsPerSet != null && perSet >= typical.repsPerSet * 1.25) {
    mechanisms.push('more_reps_per_set');
  }
  if ((session?.loadRecordedCount || 0) > 0 && typical?.loadRecordedCount === 0) mechanisms.push('documented_load');
  const complementaryReps = exercises
    .filter((row) => row.id === 'complementary_endurance_pushups' || row.provenance === 'complementary_endurance')
    .reduce((sum, row) => sum + (Number(row.reps) || 0), 0);
  if (complementaryReps > 0) mechanisms.push('complementary_work');
  if (orphanReps > 0) mechanisms.push('orphan_residual');
  return {
    mechanisms,
    topExercise: top?.name || null,
    topShare,
    orphanReps,
    identifiedReps: (session?.reps || 0) - orphanReps
  };
}

export function collectResistanceProgressions(days) {
  const history = new Map();
  const rises = [];
  (days || []).forEach((day) => {
    (day.exercises || []).forEach((exercise) => {
      if (exercise.orphan || exercise.standing === 'historical_orphan') return;
      if (exercise.standing && exercise.standing !== 'identified') return;
      if (!exercise.setsRecorded || exercise.setCount == null) return;
      const id = String(exercise.id);
      const prev = history.get(id);
      if (prev) {
        const cmp = compareResistanceAtFormat(
          { setCount: prev.setCount, reps: prev.reps, load: prev.load },
          { setCount: exercise.setCount, reps: exercise.reps, load: exercise.load }
        );
        if (cmp.change === 'load_up_same_format' && exercise.name) {
          rises.push({
            exerciseId: id,
            name: exercise.name,
            fromDate: prev.date,
            toDate: day.date,
            fromValue: prev.load.value,
            toValue: exercise.load.value,
            unit: exercise.load.unit || 'kg',
            mode: exercise.load.mode || null,
            delta: cmp.delta,
            setCount: exercise.setCount,
            reps: exercise.reps
          });
        }
      }
      if (exercise.load?.recorded && exercise.load.value != null && exercise.load.provenance !== 'replicated') {
        history.set(id, { ...exercise, date: day.date });
      }
    });
  });
  return rises;
}

export function sessionComparisonProse(comparison, labelA, labelB) {
  const a = comparison.profileA;
  const b = comparison.profileB;
  const bits = [];
  if (comparison.ahead.sets === 'a') bits.push(`${labelA} compte ${a.sets} séries enregistrées, ${labelB} en compte ${b.sets}`);
  else if (comparison.ahead.sets === 'b') bits.push(`${labelB} compte ${b.sets} séries enregistrées, ${labelA} en compte ${a.sets}`);
  if (comparison.ahead.reps === 'b') bits.push(`${labelB} compte ${b.reps} répétitions, ${labelA} en compte ${a.reps}`);
  else if (comparison.ahead.reps === 'a') bits.push(`${labelA} compte ${a.reps} répétitions, ${labelB} en compte ${b.reps}`);
  if (a.polyarticular > b.polyarticular) bits.push(`${labelA} réunit ${a.polyarticular} mouvements polyarticulaires identifiés`);
  if (a.resistanceRaises > b.resistanceRaises) bits.push(`${labelA} documente ${a.resistanceRaises} hausse${a.resistanceRaises > 1 ? 's' : ''} de résistance`);
  const bitsText = bits
    .map((bit) => (bit ? bit.charAt(0).toUpperCase() + bit.slice(1) : ''))
    .join('. ');
  return `${comparison.claim} ${bitsText}.`.replace(/\s+/g, ' ').trim();
}
