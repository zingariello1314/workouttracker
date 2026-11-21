/**
 * Source commune des lectures de programme.
 * Le programme actuel n'est jamais appliqué à une séance passée.
 * Version, prescription, exécution et statut temporel restent séparés.
 */

export const PLAN_PROVENANCE = Object.freeze({
  HISTORICAL: 'historical_snapshot',
  RECONSTRUCTED: 'reconstructed',
  CURRENT_ONLY: 'current_only',
  UNKNOWN: 'unknown'
});

export const SESSION_STATUS = Object.freeze({
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished',
  CANCELLED: 'cancelled'
});

export const DAY_STATUS = Object.freeze({
  OPEN: 'open',
  CLOSED: 'closed'
});

function parseScheme(text) {
  const raw = String(text || '').trim();
  const matched = raw.match(/(\d+)\s*[×xX*]\s*(\d+)/);
  if (matched) {
    const sets = Number(matched[1]);
    const repsPerSet = Number(matched[2]);
    return { sets, repsPerSet, total: sets * repsPerSet };
  }
  const total = parseInt(raw, 10);
  if (Number.isFinite(total) && total > 0) return { sets: null, repsPerSet: null, total };
  return { sets: null, repsPerSet: null, total: null };
}

export function matchPrescription(planned, performed) {
  const scheme = parseScheme(planned?.series || planned?.scheme);
  const plannedReps = Number.isFinite(Number(planned?.plannedReps))
    ? Number(planned.plannedReps)
    : scheme.total;
  const done = Math.max(0, Number(performed?.reps) || 0);
  const matched = plannedReps == null ? null : Math.min(plannedReps, done);
  const overshoot = plannedReps == null ? null : Math.max(0, done - plannedReps);
  const omitted = plannedReps == null ? null : Math.max(0, plannedReps - done);
  const recordedSets = performed?.setsRecorded === true ? Number(performed.setCount) : null;
  const formatRespected =
    scheme.sets != null && recordedSets != null
      ? recordedSets === scheme.sets && done === scheme.total
      : null;
  return {
    planItemId: planned?.id == null ? null : String(planned.id),
    plannedReps,
    performedReps: done,
    matchedReps: matched,
    overshootReps: overshoot,
    omittedReps: omitted,
    plannedSets: scheme.sets != null ? scheme.sets : Number(planned?.sets) || null,
    performedSets: recordedSets,
    formatRespected,
    sameVolumeDifferentFormat:
      scheme.total != null && done === scheme.total && formatRespected === false,
    muscleGroup: planned?.muscleGroup || null,
    exposure: 'prescription'
  };
}

function coverageConclusion({ plannedTotal, performedTotal, work, muscleCoverage }) {
  const absent = muscleCoverage.filter((row) => row.status === 'absent' && row.planned > 0);
  const upper = muscleCoverage.filter(
    (row) =>
      row.planned > 0 &&
      !/jambe/i.test(row.group) &&
      (row.status === 'completed' || row.status === 'partial') &&
      row.performed >= row.planned * 0.8
  );
  const legs = absent.find((row) => /jambe/i.test(row.group));
  if (legs && upper.length) {
    const detail = upper
      .map((row) => `${row.group} ${row.performed}/${row.planned}`)
      .join(', ');
    return `Le travail prévu du haut du corps a été largement réalisé (${detail}). Le travail prévu pour les jambes ne l'a pas été (${legs.performed}/${legs.planned}). ${performedTotal} répétitions réalisées sur ${plannedTotal} prévues ne résument pas cette répartition.`;
  }
  const omittedItems = muscleCoverage.filter((row) => row.status === 'absent').length;
  if (omittedItems === 1 && work.omittedPlannedReps > 0) {
    return `${work.plannedMatchedReps} répétitions prévues sont couvertes et ${work.omittedPlannedReps} ne le sont pas. Une omission ponctuelle n'est pas une habitude.`;
  }
  if (plannedTotal <= 0) return null;
  const ratio = Math.round((work.plannedMatchedReps / plannedTotal) * 100);
  return `${ratio} % du travail prévu est couvert (${work.plannedMatchedReps} répétitions appariées). ${work.additionalReps} répétitions s'ajoutent. ${work.omittedPlannedReps} répétitions prévues restent non couvertes. Le travail ajouté ne remplace pas une prescription absente.`;
}

export function assessPlannedVsPerformed({
  date = null,
  planProvenance,
  dayStatus = DAY_STATUS.CLOSED,
  sessionStatus = SESSION_STATUS.FINISHED,
  postponed = false,
  planned = [],
  performed = []
}) {
  if (
    planProvenance === PLAN_PROVENANCE.UNKNOWN ||
    planProvenance === PLAN_PROVENANCE.CURRENT_ONLY
  ) {
    return {
      date,
      planProvenance,
      abstained: true,
      reason:
        planProvenance === PLAN_PROVENANCE.CURRENT_ONLY
          ? 'current_program_not_applied_backward'
          : 'plan_unknown',
      work: null,
      muscleCoverage: [],
      conclusion: null
    };
  }
  const canCallOmission =
    dayStatus === DAY_STATUS.CLOSED &&
    (sessionStatus === SESSION_STATUS.FINISHED || sessionStatus === SESSION_STATUS.CANCELLED) &&
    !postponed;
  const performedById = new Map((performed || []).map((row) => [String(row.id), row]));
  const plannedIds = new Set((planned || []).map((row) => String(row.id)));
  const matches = (planned || []).map((item) => {
    const hit = performedById.get(String(item.id)) || { reps: 0, setsRecorded: false };
    const row = matchPrescription(item, hit);
    if (postponed && (hit.reps || 0) === 0) {
      return { ...row, status: 'postponed', omittedReps: 0 };
    }
    if (!canCallOmission && (hit.reps || 0) === 0) {
      return { ...row, status: 'not_yet_due', omittedReps: 0, pendingReps: row.plannedReps };
    }
    if ((hit.reps || 0) <= 0) return { ...row, status: 'omitted' };
    if ((row.omittedReps || 0) > 0) return { ...row, status: 'partial' };
    if ((row.overshootReps || 0) > 0) return { ...row, status: 'overshoot' };
    if (row.formatRespected === false) return { ...row, status: 'format_changed' };
    return { ...row, status: 'matched' };
  });
  const added = (performed || [])
    .filter((row) => !plannedIds.has(String(row.id)) && (Number(row.reps) || 0) > 0)
    .map((row) => ({
      id: String(row.id),
      reps: Number(row.reps) || 0,
      muscleGroup: row.muscleGroup || null,
      exposure: 'added'
    }));
  const work = {
    plannedMatchedReps: matches.reduce((sum, row) => sum + (row.matchedReps || 0), 0),
    additionalReps:
      matches.reduce((sum, row) => sum + (row.overshootReps || 0), 0) +
      added.reduce((sum, row) => sum + row.reps, 0),
    omittedPlannedReps: matches.reduce((sum, row) => sum + (row.omittedReps || 0), 0),
    substitutedReps: 0
  };
  const plannedTotal = matches.reduce((sum, row) => sum + (row.plannedReps || 0), 0);
  const performedTotal = (performed || []).reduce((sum, row) => sum + (Number(row.reps) || 0), 0);
  const groups = new Map();
  matches.forEach((row) => {
    const key = row.muscleGroup || 'unknown';
    const group = groups.get(key) || {
      group: key,
      planned: 0,
      performed: 0,
      indirect: 0,
      exposure: 'prescription'
    };
    group.planned += row.plannedReps || 0;
    group.performed += Math.min(row.performedReps || 0, row.plannedReps || row.performedReps || 0);
    groups.set(key, group);
  });
  added.forEach((row) => {
    if (!row.muscleGroup) return;
    const group = groups.get(row.muscleGroup);
    if (group) group.indirect += row.reps;
    else {
      groups.set(row.muscleGroup, {
        group: row.muscleGroup,
        planned: 0,
        performed: 0,
        indirect: row.reps,
        exposure: 'added'
      });
    }
  });
  const muscleCoverage = [...groups.values()].map((group) => ({
    ...group,
    status:
      group.planned <= 0
        ? 'not_planned'
        : group.performed <= 0
          ? 'absent'
          : group.performed >= group.planned
            ? 'completed'
            : 'partial'
  }));
  return {
    date,
    planProvenance,
    abstained: false,
    limit:
      planProvenance === PLAN_PROVENANCE.RECONSTRUCTED
        ? 'partial_reconstruction_not_historical_proof'
        : null,
    dayStatus,
    sessionStatus,
    postponed: Boolean(postponed),
    omissionCallable: canCallOmission,
    matches,
    added,
    work,
    plannedTotal,
    performedTotal,
    completionRatio: plannedTotal > 0 ? work.plannedMatchedReps / plannedTotal : null,
    muscleCoverage,
    conclusion: coverageConclusion({ plannedTotal, performedTotal, work, muscleCoverage })
  };
}

export function planProvenanceOf(plan) {
  if (!plan) return PLAN_PROVENANCE.UNKNOWN;
  const exercises = Array.isArray(plan.exercises) ? plan.exercises : [];
  if (!exercises.length) return PLAN_PROVENANCE.UNKNOWN;
  if (
    plan.provenance === PLAN_PROVENANCE.HISTORICAL ||
    plan.planCompareEligible === true ||
    (plan.frozen === true && plan.status === 'historical_frozen')
  ) {
    return PLAN_PROVENANCE.HISTORICAL;
  }
  if (plan.provisional === true || plan.status === 'provisional_forecast') {
    return PLAN_PROVENANCE.RECONSTRUCTED;
  }
  return PLAN_PROVENANCE.UNKNOWN;
}

function repsFor(snapshot, date, id) {
  const key = `${date}_${id}`;
  if (snapshot?.checkedExercises?.[key] !== true) return 0;
  const count = parseInt(String(snapshot?.reps?.[key] ?? ''), 10);
  return Number.isFinite(count) && count > 0 ? count : 0;
}

export function assessHistoricalPlans(snapshot, window, today) {
  const plans = snapshot?.calendarDayPlanSnapshots || {};
  const start = window?.start;
  const end = window?.end;
  if (!start || !end) return [];
  return Object.keys(plans)
    .filter((date) => date >= start && date <= end)
    .sort()
    .map((date) => {
      const plan = plans[date];
      const provenance = planProvenanceOf(plan);
      const planned = (plan?.exercises || []).map((exercise) => ({
        id: String(exercise.storageId || exercise.id || exercise.originalId),
        series: exercise.series || null,
        plannedReps: Number.isFinite(Number(exercise.plannedReps))
          ? Number(exercise.plannedReps)
          : null,
        muscleGroup: exercise.muscleGroup || null
      }));
      const performed = [];
      const seen = new Set();
      planned.forEach((item) => {
        const ids = [item.id];
        const source = (plan.exercises || []).find(
          (exercise) => String(exercise.storageId || exercise.id || exercise.originalId) === item.id
        );
        if (source?.originalId) ids.push(String(source.originalId));
        if (source?.storageId) ids.push(String(source.storageId));
        let reps = 0;
        ids.forEach((id) => {
          reps = Math.max(reps, repsFor(snapshot, date, id));
        });
        seen.add(item.id);
        performed.push({ id: item.id, reps, setsRecorded: false });
      });
      Object.keys(snapshot?.reps || {}).forEach((key) => {
        if (!key.startsWith(`${date}_`)) return;
        if (snapshot?.checkedExercises?.[key] !== true) return;
        const id = key.slice(date.length + 1);
        if (seen.has(id)) return;
        const reps = parseInt(String(snapshot.reps[key]), 10) || 0;
        if (reps <= 0) return;
        seen.add(id);
        performed.push({ id, reps, setsRecorded: false });
      });
      const postponed = /report|postpon/i.test(
        `${plan?.status || ''} ${plan?.dailyVariationNote || ''}`
      );
      const anyReps = performed.some((row) => row.reps > 0);
      const dayStatus = date === today ? DAY_STATUS.OPEN : DAY_STATUS.CLOSED;
      const sessionStatus = anyReps
        ? dayStatus === DAY_STATUS.OPEN
          ? SESSION_STATUS.IN_PROGRESS
          : SESSION_STATUS.FINISHED
        : dayStatus === DAY_STATUS.OPEN
          ? SESSION_STATUS.PLANNED
          : SESSION_STATUS.CANCELLED;
      return assessPlannedVsPerformed({
        date,
        planProvenance: provenance,
        dayStatus,
        sessionStatus,
        postponed,
        planned,
        performed
      });
    });
}

export function programPracticeCard(assessments) {
  const usable = (assessments || []).filter(
    (row) => row && !row.abstained && row.planProvenance === PLAN_PROVENANCE.HISTORICAL
  );
  if (!usable.length) {
    const abstained = (assessments || []).filter((row) => row?.abstained);
    return {
      card: null,
      abstentions: abstained.map((row) => ({ date: row.date, reason: row.reason }))
    };
  }
  const planned = usable.reduce((sum, row) => sum + (row.plannedTotal || 0), 0);
  const matched = usable.reduce((sum, row) => sum + (row.work?.plannedMatchedReps || 0), 0);
  const added = usable.reduce((sum, row) => sum + (row.work?.additionalReps || 0), 0);
  const omitted = usable.reduce((sum, row) => sum + (row.work?.omittedPlannedReps || 0), 0);
  const formatChanged = usable.some((row) =>
    (row.matches || []).some((item) => item.sameVolumeDifferentFormat)
  );
  const sample = usable.find((row) => row.conclusion) || usable[0];
  const body = [
    `${usable.length} jour${usable.length > 1 ? 's' : ''} avec un plan historiquement prouvé.`,
    planned > 0
      ? `${matched} répétitions prévues sont couvertes sur ${planned}. ${added} s'ajoutent. ${omitted} prévues ne sont pas couvertes.`
      : null,
    formatChanged
      ? 'Un même volume peut couvrir la prescription sans respecter le format de séries.'
      : null,
    sample.conclusion
  ]
    .filter(Boolean)
    .join(' ');
  return {
    card: {
      kind: 'disc_program_practice',
      title: 'Le programme prouvé et la séance réalisée ne se confondent pas',
      body,
      evidence: usable
        .slice(0, 4)
        .map((row) => `${row.date} ${row.work?.plannedMatchedReps || 0}/${row.plannedTotal || 0}`)
        .join(' · '),
      metrics: {
        producer: 'plannedVsPerformedAssessment',
        dates: usable.map((row) => row.date),
        plannedReps: planned,
        matchedReps: matched,
        additionalReps: added,
        omittedReps: omitted
      }
    },
    abstentions: (assessments || [])
      .filter((row) => row?.abstained || row?.planProvenance === PLAN_PROVENANCE.RECONSTRUCTED)
      .map((row) => ({
        date: row.date,
        reason: row.abstained ? row.reason : row.limit || 'partial_reconstruction_not_historical_proof'
      }))
  };
}
