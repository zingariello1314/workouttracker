/**
 * P3.4 — Métriques et découvertes avant/après révision structurelle.
 *
 * Ne affirme jamais la causalité : succession temporelle seulement.
 * Publication seulement si modification structurelle datée + observations comparables.
 *
 * @module recapProgramRevisionP34
 */

import DateHelper from '../dateHelper';
import {
  DAY_PLAN_PROOF,
  REVISION_MUTATION_KIND,
  REVISION_RELIABILITY,
  describeJournalCoverage,
  diffProgramStructures,
  getProgramRevisionLog,
  resolveHistoricalDayPlanFromJournal
} from '../programRevisionJournalP34';
import { buildPlanRealizationMatrix, PLAN_SOURCE } from './recapProgramAdherenceProgression';
import { CONTENT_CLASS } from './recapDiscoveryContentClass';

export const P34_KINDS = Object.freeze({
  STRUCTURAL_DIFF: 'disc_program_revision_structural',
  FREQUENCY_SHIFT: 'disc_program_revision_frequency',
  EXERCISE_CHURN: 'disc_program_revision_exercise_churn',
  BEFORE_AFTER_OBS: 'disc_program_revision_before_after_obs',
  INSUFFICIENT: 'disc_program_revision_insufficient',
  JOURNAL_LIMIT: 'disc_program_revision_journal_limit'
});

const MIN_OBS_DAYS_EACH_SIDE = 5;
const MIN_CALENDAR_DAYS_EACH_SIDE = 7;
const MIN_COVERAGE_RATIO = 0.35;
const MIN_STRUCTURAL_DELTA = 1;

export const COMPARABILITY_LEVEL = Object.freeze({
  SOLID: 'solid',
  LIMITED: 'limited',
  INSUFFICIENT: 'insufficient'
});

function enumerateYmds(start, end) {
  if (!start || !end || start > end) return [];
  const out = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = DateHelper.addDays(cur, 1);
  }
  return out;
}

function countActivityDays(workoutData, start, end) {
  const checked = workoutData?.checkedExercises || {};
  const dates = new Set();
  for (const key of Object.keys(checked)) {
    if (checked[key] !== true) continue;
    const ymd = key.slice(0, 10);
    if (ymd >= start && ymd <= end) dates.add(ymd);
  }
  return dates.size;
}

function calendarSpanDays(start, end) {
  if (!start || !end || start > end) return 0;
  return enumerateYmds(start, end).length;
}

/**
 * 5 jours actifs ≠ preuve suffisante seule.
 * Niveaux : solid | limited | insufficient — formulation adaptée.
 */
export function assessBeforeAfterComparability({
  beforeActivityDays,
  afterActivityDays,
  beforeCalendarDays,
  afterCalendarDays,
  snapshotDaysBefore,
  snapshotDaysAfter,
  interveningStructuralRevisions = 0
} = {}) {
  const limits = [];
  if (interveningStructuralRevisions > 0) {
    limits.push('intervening_structural_revisions');
  }
  const beforeCov =
    beforeCalendarDays > 0 ? beforeActivityDays / beforeCalendarDays : 0;
  const afterCov = afterCalendarDays > 0 ? afterActivityDays / afterCalendarDays : 0;

  const activityOk =
    beforeActivityDays >= MIN_OBS_DAYS_EACH_SIDE &&
    afterActivityDays >= MIN_OBS_DAYS_EACH_SIDE;
  const calendarOk =
    beforeCalendarDays >= MIN_CALENDAR_DAYS_EACH_SIDE &&
    afterCalendarDays >= MIN_CALENDAR_DAYS_EACH_SIDE;
  const coverageOk = beforeCov >= MIN_COVERAGE_RATIO && afterCov >= MIN_COVERAGE_RATIO;
  const spanBalance =
    beforeCalendarDays > 0 &&
    afterCalendarDays > 0 &&
    Math.max(beforeCalendarDays, afterCalendarDays) /
      Math.min(beforeCalendarDays, afterCalendarDays) <=
      2;

  if (!activityOk) {
    limits.push('activity_days_below_threshold');
    return {
      level: COMPARABILITY_LEVEL.INSUFFICIENT,
      observationsComparable: false,
      limits,
      beforeCoverage: beforeCov,
      afterCoverage: afterCov
    };
  }
  if (interveningStructuralRevisions > 0) {
    return {
      level: COMPARABILITY_LEVEL.LIMITED,
      observationsComparable: true,
      limits,
      beforeCoverage: beforeCov,
      afterCoverage: afterCov,
      note: 'other_revisions_between_windows'
    };
  }
  if (calendarOk && coverageOk && spanBalance) {
    return {
      level: COMPARABILITY_LEVEL.SOLID,
      observationsComparable: true,
      limits: [],
      beforeCoverage: beforeCov,
      afterCoverage: afterCov
    };
  }
  limits.push(
    !calendarOk
      ? 'calendar_span_short'
      : !coverageOk
        ? 'coverage_thin'
        : 'span_imbalanced'
  );
  return {
    level: COMPARABILITY_LEVEL.LIMITED,
    observationsComparable: true,
    limits,
    beforeCoverage: beforeCov,
    afterCoverage: afterCov
  };
}

/**
 * Trouve les révisions structurelles recorded dans la fenêtre (ou juste avant).
 */
export function listStructuralRevisionsInScope(workoutData, window) {
  const log = getProgramRevisionLog(workoutData);
  const start = window?.start;
  const end = window?.end;
  return (log.revisions || []).filter((r) => {
    if (r.mutationKind !== REVISION_MUTATION_KIND.STRUCTURAL) return false;
    if (r.reliability === REVISION_RELIABILITY.UNCERTAIN) return false;
    const ymd = r.applicableFromYmd || String(r.applicableFrom || '').slice(0, 10);
    if (!ymd) return false;
    if (end && ymd > end) return false;
    // Inclure révisions jusqu’à 30j avant le début pour comparer « autour »
    if (start) {
      const early = DateHelper.addDays(start, -30);
      if (ymd < early) return false;
    }
    return true;
  });
}

export function buildRevisionBeforeAfterMetrics(workoutData, revision, { window = null } = {}) {
  const log = getProgramRevisionLog(workoutData);
  const ymd = revision.applicableFromYmd || String(revision.applicableFrom || '').slice(0, 10);
  if (!ymd) {
    return { ok: false, reason: 'no_revision_date' };
  }

  const prev =
    (log.revisions || []).find((r) => r.revisionId === revision.previousRevisionId) ||
    [...(log.revisions || [])]
      .filter(
        (r) =>
          String(r.programId) === String(revision.programId) &&
          r.revisionId !== revision.revisionId &&
          (r.applicableFromYmd || '') < ymd
      )
      .sort((a, b) => String(a.applicableFrom).localeCompare(String(b.applicableFrom)))
      .pop();

  if (!prev) {
    return {
      ok: false,
      reason: 'no_previous_revision',
      revisionId: revision.revisionId,
      revisionYmd: ymd
    };
  }

  const diff = diffProgramStructures(prev, revision);
  if (!diff.structuralChange) {
    return { ok: false, reason: 'no_structural_change', diff, revisionYmd: ymd };
  }

  const beforeEnd = DateHelper.addDays(ymd, -1);
  const beforeStart = DateHelper.addDays(beforeEnd, -(MIN_OBS_DAYS_EACH_SIDE * 2 - 1));
  const afterStart = ymd;
  const afterEnd = DateHelper.addDays(ymd, MIN_OBS_DAYS_EACH_SIDE * 2 - 1);

  const winStart = window?.start || beforeStart;
  const winEnd = window?.end || afterEnd;
  const beforeObsStart = beforeStart < winStart ? winStart : beforeStart;
  const beforeObsEnd = beforeEnd > winEnd ? winEnd : beforeEnd;
  const afterObsStart = afterStart < winStart ? winStart : afterStart;
  const afterObsEnd = afterEnd > winEnd ? winEnd : afterEnd;

  const beforeDays = countActivityDays(workoutData, beforeObsStart, beforeObsEnd);
  const afterDays = countActivityDays(workoutData, afterObsStart, afterObsEnd);
  const beforeCal = calendarSpanDays(beforeObsStart, beforeObsEnd);
  const afterCal = calendarSpanDays(afterObsStart, afterObsEnd);

  const intervening = (log.revisions || []).filter((r) => {
    if (r.revisionId === revision.revisionId || r.revisionId === prev.revisionId) return false;
    if (r.mutationKind !== REVISION_MUTATION_KIND.STRUCTURAL) return false;
    const ry = r.applicableFromYmd || String(r.applicableFrom || '').slice(0, 10);
    return ry && ry > beforeObsStart && ry < afterObsEnd;
  }).length;

  const matrixBefore =
    beforeObsStart <= beforeObsEnd
      ? buildPlanRealizationMatrix({
          workoutData,
          window: { start: beforeObsStart, end: beforeObsEnd }
        })
      : null;
  const matrixAfter =
    afterObsStart <= afterObsEnd
      ? buildPlanRealizationMatrix({
          workoutData,
          window: { start: afterObsStart, end: afterObsEnd }
        })
      : null;

  const snapBefore = (matrixBefore?.days || []).filter((d) => d.planSource === PLAN_SOURCE.SNAPSHOT)
    .length;
  const snapAfter = (matrixAfter?.days || []).filter((d) => d.planSource === PLAN_SOURCE.SNAPSHOT)
    .length;
  const plannedNotRealizedBefore = (matrixBefore?.days || []).reduce(
    (n, d) => n + (d.notRealizedExercises?.length || 0),
    0
  );
  const plannedNotRealizedAfter = (matrixAfter?.days || []).reduce(
    (n, d) => n + (d.notRealizedExercises?.length || 0),
    0
  );

  const comparability = assessBeforeAfterComparability({
    beforeActivityDays: beforeDays,
    afterActivityDays: afterDays,
    beforeCalendarDays: beforeCal,
    afterCalendarDays: afterCal,
    snapshotDaysBefore: snapBefore,
    snapshotDaysAfter: snapAfter,
    interveningStructuralRevisions: intervening
  });

  return {
    ok: true,
    revisionId: revision.revisionId,
    programId: revision.programId,
    revisionYmd: ymd,
    diff,
    beforeWindow: { start: beforeObsStart, end: beforeObsEnd },
    afterWindow: { start: afterObsStart, end: afterObsEnd },
    beforeActivityDays: beforeDays,
    afterActivityDays: afterDays,
    beforeCalendarDays: beforeCal,
    afterCalendarDays: afterCal,
    snapshotDaysBefore: snapBefore,
    snapshotDaysAfter: snapAfter,
    plannedNotRealizedBefore,
    plannedNotRealizedAfter,
    interveningStructuralRevisions: intervening,
    comparabilityLevel: comparability.level,
    observationsComparable: comparability.observationsComparable,
    causalityClaimAllowed: false,
    limits: comparability.limits,
    coverage: {
      before: comparability.beforeCoverage,
      after: comparability.afterCoverage
    }
  };
}

export function buildP34RevisionMetricsPack({ snapshot, window } = {}) {
  const coverage = describeJournalCoverage(snapshot);
  const revisions = listStructuralRevisionsInScope(snapshot, window);
  const analyses = revisions.map((r) => buildRevisionBeforeAfterMetrics(snapshot, r, { window }));

  // Couverture reconstitution sur la fenêtre (échantillon)
  const dates = window?.start && window?.end ? enumerateYmds(window.start, window.end) : [];
  let demonstrated = 0;
  let probable = 0;
  let nonReco = 0;
  for (const d of dates.slice(0, 60)) {
    const r = resolveHistoricalDayPlanFromJournal(snapshot, d);
    if (r.proof === DAY_PLAN_PROOF.DEMONSTRATED) demonstrated += 1;
    else if (r.proof === DAY_PLAN_PROOF.PROBABLE) probable += 1;
    else nonReco += 1;
  }

  return {
    coverage,
    structuralRevisionCount: revisions.length,
    analyses,
    dayProofSample: {
      sampled: Math.min(dates.length, 60),
      demonstrated,
      probable,
      nonReconstructible: nonReco
    }
  };
}

function fmtInt(n) {
  return String(Math.round(Number(n) || 0));
}

/**
 * Découvertes P3.4 — strictes, pas une carte par édition.
 */
export function buildP34RevisionDiscoveries({ snapshot, window } = {}) {
  const pack = buildP34RevisionMetricsPack({ snapshot, window });
  const out = [];

  if (!pack.coverage.journalIntroducedAt && pack.coverage.revisionCount === 0) {
    out.push({
      kind: P34_KINDS.JOURNAL_LIMIT,
      nature: 'trajectory',
      family: 'program_revision',
      contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
      title: 'Historique de révisions de programme indisponible',
      body: 'Aucun journal P3.4 n’est encore enregistré pour cette copie : les versions applicables aux journées anciennes ne peuvent pas être démontrées. Les snapshots P3.3 déjà prouvés restent la seule preuve de plan figé.',
      evidence: 'journal_absent',
      weights: { importance: 0.3, reliability: 0.95, novelty: 0.2, fit: 0.5 },
      metrics: { ...pack.coverage, contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT }
    });
    return { discoveries: out, pack };
  }

  const usable = (pack.analyses || []).filter((a) => a.ok && a.diff?.structuralChange);
  if (!usable.length) {
    out.push({
      kind: P34_KINDS.INSUFFICIENT,
      nature: 'trajectory',
      family: 'program_revision',
      contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
      title: 'Pas assez de révisions structurelles comparables',
      body: `Le journal compte ${fmtInt(pack.coverage.revisionCount)} révision(s), mais aucune paire avant/après structurelle suffisamment documentée n’est publiable sur cette fenêtre.`,
      evidence: `revisions=${pack.coverage.revisionCount}`,
      weights: { importance: 0.32, reliability: 0.9, novelty: 0.22, fit: 0.5 },
      metrics: {
        revisionCount: pack.coverage.revisionCount,
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT
      }
    });
    return { discoveries: out, pack };
  }

  // Une seule carte « principale » : la révision structurelle la plus récente avec le plus de signal
  const ranked = [...usable].sort((a, b) => {
    const score = (x) =>
      (x.diff.added?.length || 0) +
      (x.diff.removed?.length || 0) +
      (x.diff.moved?.length || 0) +
      (x.diff.dayActivationChanges?.length || 0) +
      (x.observationsComparable ? 5 : 0);
    return score(b) - score(a) || String(b.revisionYmd).localeCompare(String(a.revisionYmd));
  });

  const top = ranked[0];
  const d = top.diff;
  const churn =
    (d.added?.length || 0) + (d.removed?.length || 0) + (d.moved?.length || 0);
  if (churn < MIN_STRUCTURAL_DELTA && !(d.dayActivationChanges?.length > 0)) {
    return { discoveries: out, pack };
  }

  const freqBit =
    d.plannedFrequencyBefore !== d.plannedFrequencyAfter
      ? ` Fréquence prévue : ${fmtInt(d.plannedFrequencyBefore)} → ${fmtInt(d.plannedFrequencyAfter)} jour(s) actifs/semaine.`
      : '';
  const addBit = d.added?.length
    ? ` Ajouts : ${d.added
        .slice(0, 3)
        .map((x) => x.name || x.id)
        .join(', ')}.`
    : '';
  const remBit = d.removed?.length
    ? ` Retraits : ${d.removed
        .slice(0, 3)
        .map((x) => x.name || x.id)
        .join(', ')}.`
    : '';
  const moveBit = d.moved?.length
    ? ` Déplacements : ${d.moved
        .slice(0, 2)
        .map((x) => `${x.name} (${x.fromDays?.join('/') }→${x.toDays?.join('/')})`)
        .join('; ')}.`
    : '';

  out.push({
    kind: P34_KINDS.STRUCTURAL_DIFF,
    nature: 'trajectory',
    family: 'program_revision',
    contentClass: CONTENT_CLASS.ANALYTICAL,
    title: 'Modification structurelle datée du programme',
    body: `Le ${top.revisionYmd}, une révision structurelle enregistrée change le plan (${fmtInt(churn)} mouvement(s) d’exercices).${freqBit}${addBit}${remBit}${moveBit} Ce constat décrit le changement de plan, pas une cause de progression.`,
    evidence: `rev=${top.revisionId} · Δfreq=${d.plannedFrequencyBefore}→${d.plannedFrequencyAfter}`,
    weights: { importance: 0.72, reliability: 0.88, novelty: 0.7, fit: 0.85 },
    metrics: {
      ...top,
      findingKind: P34_KINDS.STRUCTURAL_DIFF,
      causalityClaimAllowed: false
    }
  });

  if (d.plannedFrequencyBefore !== d.plannedFrequencyAfter) {
    out.push({
      kind: P34_KINDS.FREQUENCY_SHIFT,
      nature: 'trajectory',
      family: 'program_revision',
      contentClass: CONTENT_CLASS.DESCRIPTIVE,
      title: 'Fréquence hebdomadaire prévue modifiée',
      body: `Autour du ${top.revisionYmd}, le nombre de jours actifs prévus passe de ${fmtInt(d.plannedFrequencyBefore)} à ${fmtInt(d.plannedFrequencyAfter)}. Lecture descriptive du plan — pas d’inférence sur le volume réalisé.`,
      evidence: `${d.plannedFrequencyBefore}→${d.plannedFrequencyAfter}`,
      weights: { importance: 0.55, reliability: 0.9, novelty: 0.55, fit: 0.75 },
      metrics: {
        before: d.plannedFrequencyBefore,
        after: d.plannedFrequencyAfter,
        revisionYmd: top.revisionYmd,
        findingKind: P34_KINDS.FREQUENCY_SHIFT
      }
    });
  }

  if (top.comparabilityLevel === COMPARABILITY_LEVEL.SOLID) {
    out.push({
      kind: P34_KINDS.BEFORE_AFTER_OBS,
      nature: 'trajectory',
      family: 'program_revision',
      contentClass: CONTENT_CLASS.DESCRIPTIVE,
      title: 'Observations avant/après la révision (sans causalité)',
      body: `Fenêtre avant (${top.beforeWindow.start}→${top.beforeWindow.end}, ${fmtInt(top.beforeCalendarDays)} j. calendaires) : ${fmtInt(top.beforeActivityDays)} jour(s) actifs · ${fmtInt(top.snapshotDaysBefore)} snapshot(s) plan · ${fmtInt(top.plannedNotRealizedBefore)} créneau(x) prévus non réalisés. Après (${top.afterWindow.start}→${top.afterWindow.end}, ${fmtInt(top.afterCalendarDays)} j.) : ${fmtInt(top.afterActivityDays)} actif(s) · ${fmtInt(top.snapshotDaysAfter)} snapshot(s) · ${fmtInt(top.plannedNotRealizedAfter)} non réalisé(s). Comparabilité solide sur la couverture — succession temporelle seulement, aucune cause attribuée à la révision.`,
      evidence: `solid · act ${top.beforeActivityDays}/${top.afterActivityDays}`,
      weights: { importance: 0.52, reliability: 0.82, novelty: 0.45, fit: 0.72 },
      metrics: {
        ...top,
        findingKind: P34_KINDS.BEFORE_AFTER_OBS,
        causalityClaimAllowed: false
      }
    });
  } else if (top.comparabilityLevel === COMPARABILITY_LEVEL.LIMITED) {
    out.push({
      kind: P34_KINDS.BEFORE_AFTER_OBS,
      nature: 'trajectory',
      family: 'program_revision',
      contentClass: CONTENT_CLASS.DESCRIPTIVE,
      title: 'Lecture limitée avant/après la révision',
      body: `Des observations existent de part et d’autre du ${top.revisionYmd} (${fmtInt(top.beforeActivityDays)} / ${fmtInt(top.afterActivityDays)} jours actifs), mais la comparabilité est limitée (${(top.limits || []).join(', ') || 'couverture partielle'}). Formulation descriptive seulement — pas de conclusion sur l’effet de la révision.`,
      evidence: `limited · act ${top.beforeActivityDays}/${top.afterActivityDays}`,
      weights: { importance: 0.4, reliability: 0.7, novelty: 0.35, fit: 0.6 },
      metrics: {
        ...top,
        findingKind: P34_KINDS.BEFORE_AFTER_OBS,
        causalityClaimAllowed: false
      }
    });
  } else {
    out.push({
      kind: P34_KINDS.INSUFFICIENT,
      nature: 'trajectory',
      family: 'program_revision',
      contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
      title: 'Révision structurelle sans observations comparables',
      body: `Une révision du ${top.revisionYmd} est enregistrée, mais les fenêtres avant/après n’offrent pas une base comparable (activité, durée calendaire ou couverture insuffisante). Cinq jours actifs seuls ne suffisent pas sans contexte de couverture.`,
      evidence: `before=${top.beforeActivityDays} after=${top.afterActivityDays} · ${(top.limits || []).join(',')}`,
      weights: { importance: 0.34, reliability: 0.92, novelty: 0.25, fit: 0.55 },
      metrics: {
        ...top,
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        findingKind: P34_KINDS.INSUFFICIENT
      }
    });
  }

  return { discoveries: out, pack };
}
