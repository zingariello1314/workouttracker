/**
 * Adhérence multidimensionnelle (Mission 7).
 * Vecteur de dimensions — jamais un score unique interchangeable.
 * Réutilise assessPlannedVsPerformed comme source de faits.
 */

import { assessPlannedVsPerformed, PLAN_PROVENANCE } from './plannedVsPerformedAssessment';

function ratio(num, den) {
  if (!den || den <= 0) return null;
  return Math.round((num / den) * 1000) / 1000;
}

/**
 * @param {object} assessment — sortie de assessPlannedVsPerformed
 * @returns {object} vecteur d’adhérence + dénominateurs + limites
 */
export function adherenceVectorFromAssessment(assessment) {
  if (!assessment || assessment.abstained) {
    return {
      schema: 'momentum.adherenceVector.v1',
      abstained: true,
      reason: assessment?.reason || 'assessment_missing',
      dimensions: {},
      limits: [assessment?.reason || 'no_assessment']
    };
  }
  const matches = assessment.matches || [];
  const muscle = assessment.muscleCoverage || [];
  const plannedExercises = matches.length;
  const realizedExercises = matches.filter((m) => (m.performedReps || 0) > 0).length;
  const plannedSets = matches.reduce((s, m) => s + (Number(m.plannedSets) || 0), 0);
  const performedSets = matches.reduce((s, m) => s + (Number(m.performedSets) || 0), 0);
  const groupsPlanned = muscle.filter((g) => g.planned > 0);
  const groupsFullyCovered = groupsPlanned.filter((g) => g.status === 'completed');
  const omittedGroups = groupsPlanned.filter((g) => g.status === 'absent');
  const omittedReps = assessment.work?.omittedPlannedReps || 0;
  const plannedTotal = assessment.plannedTotal || 0;
  const matchedReps = assessment.work?.plannedMatchedReps || 0;

  const dims = {
    reps: {
      label: 'adhérence_répétitions',
      numerator: matchedReps,
      denominator: plannedTotal,
      value: ratio(matchedReps, plannedTotal),
      note: 'répétitions appariées / prescrites — pas la difficulté globale'
    },
    sets: {
      label: 'adhérence_séries',
      numerator: performedSets,
      denominator: plannedSets || null,
      value: plannedSets > 0 ? ratio(performedSets, plannedSets) : null,
      note: plannedSets > 0 ? null : 'séries prescrites non documentées'
    },
    exercises: {
      label: 'adhérence_exercices',
      numerator: realizedExercises,
      denominator: plannedExercises,
      value: ratio(realizedExercises, plannedExercises)
    },
    muscleGroupsFullyCovered: {
      label: 'groupes_intégralement_couverts',
      numerator: groupsFullyCovered.length,
      denominator: groupsPlanned.length,
      value: ratio(groupsFullyCovered.length, groupsPlanned.length),
      note: '≠ proportion de charge ou de difficulté'
    },
    omissionConcentration: {
      label: 'concentration_des_omissions',
      numerator: omittedReps,
      denominator: plannedTotal,
      value: ratio(omittedReps, plannedTotal),
      byGroup: omittedGroups.map((g) => ({
        group: g.group,
        planned: g.planned,
        shareOfOmission: omittedReps > 0 ? ratio(g.planned, omittedReps) : null
      }))
    },
    additionalWork: {
      label: 'travail_hors_prescription',
      numerator: assessment.work?.additionalReps || 0,
      denominator: null,
      value: assessment.work?.additionalReps || 0
    }
  };

  const pattern = classifyOmissionPattern(assessment, dims);

  return {
    schema: 'momentum.adherenceVector.v1',
    abstained: false,
    date: assessment.date,
    planProvenance: assessment.planProvenance,
    omissionCallable: assessment.omissionCallable,
    dimensions: dims,
    pattern,
    conclusion: deepenAdherenceConclusion(assessment, dims, pattern),
    limits: [
      assessment.limit,
      'Les dimensions ne sont pas interchangeables',
      'Couverture musculaire ≠ charge réelle',
      'Inconnu ≠ zéro'
    ].filter(Boolean)
  };
}

export function classifyOmissionPattern(assessment, dims) {
  if (!assessment?.omissionCallable) {
    return { id: 'not_callable', label: 'omission_non_affirmable', certainty: 'n/a' };
  }
  const omitted = (assessment.muscleCoverage || []).filter((g) => g.status === 'absent' && g.planned > 0);
  const completed = (assessment.muscleCoverage || []).filter((g) => g.status === 'completed');
  const repsRatio = dims?.reps?.value;
  if (omitted.length === 0 && repsRatio != null && repsRatio >= 0.95) {
    return { id: 'complete', label: 'réalisation_quasi_complète', certainty: 'high' };
  }
  if (omitted.length === 1 && completed.length >= 1) {
    return {
      id: 'targeted_omission',
      label: 'omission_ciblée',
      group: omitted[0].group,
      certainty: 'high',
      note: 'Une composante absente, d’autres largement réalisées'
    };
  }
  if (omitted.length > 1 && repsRatio != null && repsRatio < 0.5) {
    return { id: 'broad_shortfall', label: 'écart_étendu', certainty: 'medium' };
  }
  if (repsRatio != null && repsRatio < 0.85 && omitted.length === 0) {
    return { id: 'uniform_reduction', label: 'réduction_diffuse', certainty: 'medium' };
  }
  return { id: 'mixed', label: 'profil_mixte', certainty: 'low' };
}

function deepenAdherenceConclusion(assessment, dims, pattern) {
  const base = assessment.conclusion || '';
  if (pattern.id === 'targeted_omission') {
    const g = pattern.group;
    const fully = dims.muscleGroupsFullyCovered;
    const reps = dims.reps;
    return [
      `L'écart au programme est concentré sur ${g}, et non une baisse uniforme de la réalisation.`,
      fully?.value != null
        ? `${Math.round(fully.value * 100)} % des groupes musculaires prévus sont intégralement couverts (${fully.numerator}/${fully.denominator}), tandis que l'adhérence volumétrique n'est que de ${reps?.value != null ? Math.round(reps.value * 100) : '?'} %.`
        : null,
      `Ces deux métriques ne sont pas interchangeables : la couverture de groupes ne mesure pas la charge omise.`,
      base || null
    ]
      .filter(Boolean)
      .join(' ');
  }
  if (pattern.id === 'complete') {
    return base || 'La séance suit de près la prescription documentée sur les dimensions mesurables.';
  }
  return base;
}

/**
 * Agrège plusieurs évaluations jour pour détecter récurrence d’omissions ciblées.
 * Mission 9 : chaque ligne porte dates, comptes, composantes conservées et statut
 * de récurrence (récurrente / répétée / exceptionnelle) — descriptif, sans intention.
 */
export function contextualizeOmissionsAcrossDays(assessments = [], { familyDayKeys = null } = {}) {
  // Dédoublonne par date (la dernière évaluation d’un même jour fait foi).
  const byDate = new Map();
  const noDate = [];
  (assessments || [])
    .filter((a) => a && !a.abstained && a.omissionCallable)
    .forEach((a) => {
      const d = a.date ? String(a.date).slice(0, 10) : null;
      if (d) byDate.set(d, a);
      else noDate.push(a);
    });
  const callable = [...byDate.entries()]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([, a]) => a)
    .concat(noDate);
  const opportunityDates = callable.map((a) => (a.date ? String(a.date).slice(0, 10) : null)).filter(Boolean);

  const byGroup = new Map();
  const ensure = (group) => {
    if (!byGroup.has(group)) {
      byGroup.set(group, {
        group,
        days: [],
        count: 0,
        presentDays: [],
        partialDays: [],
        conserved: new Map(),
        idx: []
      });
    }
    return byGroup.get(group);
  };
  callable.forEach((a, idx) => {
    const cov = a.muscleCoverage || [];
    const dayLabel = a.date ? String(a.date).slice(0, 10) : null;
    const completedToday = cov.filter((g) => g.status === 'completed').map((g) => g.group);
    cov
      .filter((g) => g.planned > 0)
      .forEach((g) => {
        const row = ensure(g.group);
        if (g.status === 'absent') {
          if (dayLabel) row.days.push(dayLabel);
          row.count += 1;
          row.idx.push(idx);
          completedToday
            .filter((c) => c !== g.group)
            .forEach((c) => row.conserved.set(c, (row.conserved.get(c) || 0) + 1));
        } else if (g.status === 'completed') {
          if (dayLabel) row.presentDays.push(dayLabel);
        } else if (g.status === 'partial') {
          if (dayLabel) row.partialDays.push(dayLabel);
        }
      });
  });

  const opportunities = callable.length;
  const rows = [...byGroup.values()]
    .filter((row) => row.count >= 1)
    .map((row) => {
      // Plus longue série d’opportunités consécutives avec omission
      let streak = 0;
      let maxStreak = 0;
      let prev = null;
      row.idx.forEach((i) => {
        streak = prev != null && i === prev + 1 ? streak + 1 : 1;
        maxStreak = Math.max(maxStreak, streak);
        prev = i;
      });
      const recurrence =
        row.count >= 3
          ? 'recurrent'
          : row.count === 2
            ? 'repeated'
            : row.presentDays.length >= 2
              ? 'exceptional'
              : 'single_observation';
      const conservedComponents = [...row.conserved.entries()]
        .sort((x, y) => y[1] - x[1] || String(x[0]).localeCompare(String(y[0])))
        .map(([group, daysCount]) => ({ group, daysCount }));
      return {
        group: row.group,
        days: row.days,
        count: row.count,
        frequency: ratio(row.count, opportunities),
        plannedOpportunities: row.count + row.presentDays.length + row.partialDays.length,
        presentDays: row.presentDays,
        partialDays: row.partialDays,
        firstOmissionDate: row.days[0] || null,
        lastOmissionDate: row.days[row.days.length - 1] || null,
        maxConsecutive: maxStreak,
        conservedComponents,
        recurrence,
        scope: familyDayKeys ? 'compare_within_documented_opportunities' : 'across_callable_days',
        interpretation:
          row.count >= 3
            ? 'omission_récurrente_documentée'
            : row.count === 2
              ? 'omission_répétée_à_confirmer'
              : recurrence === 'exceptional'
                ? 'omission_exceptionnelle'
                : 'omission_observée_une_fois'
      };
    });
  return {
    schema: 'momentum.omissionContext.v1',
    opportunities,
    opportunityDates,
    byGroup: rows,
    recurring: rows.filter((row) => row.count >= 2),
    isolated: rows.filter((row) => row.count === 1),
    limit: 'Sans preuve documentée, aucune intention (fatigue, motivation…) n’est affirmée.'
  };
}

const joinDates = (dates = [], max = 6) => {
  const list = (dates || []).filter(Boolean);
  if (!list.length) return 'dates non documentées';
  return list.length > max ? `${list.slice(0, max).join(', ')}…` : list.join(', ');
};

/**
 * Phrase descriptive de récurrence pour un groupe omis (dates + comptes + composantes conservées).
 * @param {object} row — ligne de contextualizeOmissionsAcrossDays().byGroup
 * @param {number} opportunities
 * @param {string[]} conservedNow — groupes intégralement couverts sur la séance lue
 */
export function describeOmissionRecurrence(row, opportunities, conservedNow = []) {
  if (!row) return null;
  const conservedFromRow = (row.conservedComponents || []).map((c) => c.group);
  const conserved = (conservedNow.length ? conservedNow : conservedFromRow).filter((g) => g !== row.group);
  const conservedBit = conserved.length
    ? ` Composantes conservées sur ces séances : ${conserved.slice(0, 5).join(', ')}.`
    : '';
  const missing = row.group;
  if (row.recurrence === 'recurrent') {
    return `Sur ${opportunities} séances comparables où l'omission est affirmable, ${missing} manque ${row.count} fois (${joinDates(row.days)})${
      row.maxConsecutive >= 2 ? `, dont ${row.maxConsecutive} d'affilée` : ''
    } : l'omission est récurrente, ${missing} étant la composante absente.${conservedBit}`;
  }
  if (row.recurrence === 'repeated') {
    return `${missing} a manqué ${row.count} fois sur ${opportunities} séances comparables (${joinDates(row.days)}) : répétition à confirmer, pas encore une habitude.${conservedBit}`;
  }
  if (row.recurrence === 'exceptional') {
    return `${missing} ne manque qu'une fois sur ${opportunities} séances comparables (${joinDates(row.days)}) et est réalisé les autres fois (${joinDates(row.presentDays)}) : omission exceptionnelle, non récurrente.${conservedBit}`;
  }
  return `${missing} manque sur la séance du ${joinDates(row.days)} ; les autres séances comparables ne documentent pas assez ce groupe pour parler de récurrence.${conservedBit}`;
}

/**
 * Construit vecteur + contexte depuis listes planned/performed.
 */
export function buildMultidimensionalAdherence(args) {
  const assessment = assessPlannedVsPerformed(args);
  const vector = adherenceVectorFromAssessment(assessment);
  return { assessment, vector };
}

export { PLAN_PROVENANCE };
