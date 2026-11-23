import { emptyGameAReport } from './evaluationTypes';
import { classifyStimulus } from '../recapStimulusCatalog';
import { checkInterHorizonFactCoherence } from '../interHorizonFactCoherence';

/**
 * Jeu A — exactitude (reconstitué).
 * Contrôle des affirmations accessibles contre des invariants indépendants.
 */

export function runGameAAccuracy({ insights = null, measure = null, referenceFacts = null } = {}) {
  const report = emptyGameAReport();
  const priority = [
    ...(insights?.shortTerm || []),
    ...(insights?.mediumTerm || []),
    ...(insights?.longTerm || [])
  ];
  const reserve = insights?.accessibleReserve || [];
  const accessible = [...priority, ...reserve];
  const facts = referenceFacts || {};

  accessible.forEach((card) => {
    if (!card?.claim) {
      report.missingClaims += 1;
      report.cases.push({ id: card?.id || card?.title, issue: 'missing_claim' });
    } else {
      const proof = card.claim.proof || {};
      const assertions = card.claim.assertions || [];
      const hasProof =
        (proof.observedValues || []).length > 0 ||
        (proof.sourceEvents || []).length > 0 ||
        proof.documentary === true ||
        (card.claim.limitations || []).includes('non_numeric_documentary_proof') ||
        assertions.some((a) => a?.value != null || a?.referenceValue != null || (a?.observedValues || []).length > 0);
      if (!hasProof && card.disposition === 'priority') {
        report.cases.push({ id: card.id, issue: 'priority_without_numeric_proof' });
        report.factualConflicts += 1;
      }
      if ((card.claim.allowedStatements || []).includes('association_only') === false) {
        const body = `${card.title || ''} ${card.body || ''}`;
        if (/sommeil/i.test(body) && /cause|provoque|prouve que/i.test(body)) {
          report.inventedCauses += 1;
          report.cases.push({ id: card.id, issue: 'unauthorized_physiology_or_causality' });
        }
      }
    }
    const isDeepeningCard =
      card?.disposition === 'deepening_of_collective' ||
      card?.p6Disposition === 'deepening_of_collective' ||
      card?.disposition === 'deepening_accessible';
    if (
      card?.p6Disposition === 'source_retained' ||
      (card?.collapsedInto && !isDeepeningCard && card?.disposition !== 'demoted_priority')
    ) {
      report.fusedSourcesRepublished += 1;
      report.cases.push({ id: card?.id || card?.title, issue: 'fused_source_accessible' });
    }

    // Mission 14 : calcul juste mais interprétation verbale fausse (dénominateurs)
    const body = `${card.title || ''} ${card.body || ''}`;
    const rel = card.metrics?.relativeConcentration || card.metrics;
    if (
      rel?.moveShareOfParentWindow != null &&
      rel?.globalShareOfParentWindow != null &&
      /représentent environ .+% du volume de (?:7 jours|aujourd)/i.test(body) &&
      !/volume de ces mouvements/i.test(body)
    ) {
      report.factualConflicts += 1;
      report.cases.push({
        id: card.id,
        issue: 'correct_ratio_wrong_denominator_verbalization',
        note: 'Part des mouvements dans leur volume parent verbalisée comme part du volume de la fenêtre courte'
      });
    }
    if (
      card.kind === 'disc_composed_relative_concentration' &&
      /% du volume de 7 jours,\s*contre\s*.+% du volume de 30/i.test(body)
    ) {
      report.factualConflicts += 1;
      report.cases.push({
        id: card.id,
        issue: 'swapped_concentration_denominators',
        note: '50% ≠ part du volume hebdo ; 22% ≠ part de ces mouvements dans le mois'
      });
    }
    if (facts.forbiddenTitles?.some((t) => t && card.title === t)) {
      report.factualConflicts += 1;
      report.cases.push({ id: card.id, issue: 'forbidden_title_published' });
    }
  });

  if (measure?.durationContract?.minutesMostlyChallenge && measure?.repsPerHour != null) {
    report.unpairedDensities += 1;
    report.cases.push({ issue: 'unpaired_density_published' });
  }

  if (Number.isFinite(Number(facts.totalReps)) && Number.isFinite(Number(measure?.totalReps))) {
    if (Number(facts.totalReps) !== Number(measure.totalReps)) {
      report.factualConflicts += 1;
      report.cases.push({
        issue: 'measure_total_reps_mismatch',
        expected: facts.totalReps,
        obtained: measure.totalReps
      });
    }
  }

  if (facts.windowEnd && accessible.some((card) => {
    const end = card?.claim?.scope?.end;
    return end && end > facts.windowEnd;
  })) {
    report.factualConflicts += 1;
    report.cases.push({ issue: 'claim_outside_window' });
  }

  // Journée en cours sans reps : interdire les conclusions de séance réalisée
  if (facts.todayEmpty === true) {
    accessible.forEach((card) => {
      const body = `${card.title || ''} ${card.body || ''}`;
      if (/tu as réalisé|séance terminée|volume du jour/i.test(body) && !/en attente|pas encore/i.test(body)) {
        report.factualConflicts += 1;
        report.cases.push({ id: card.id, issue: 'today_empty_but_completed_claimed' });
      }
    });
  }

  const challengeClass = classifyStimulus('Pompes endurance', {
    id: 'complementary_endurance_pushups'
  });
  if (challengeClass.endurance) {
    report.inventedCauses += 1;
    report.cases.push({ issue: 'challenge_labeled_endurance' });
  }

  // Identités : deux cartes même phenomenonId en priorité = conflit
  const phen = new Map();
  priority.forEach((card) => {
    const id = card.phenomenonId;
    if (!id) return;
    if (phen.has(id)) {
      report.identityMerges += 1;
      report.cases.push({ id, issue: 'duplicate_phenomenon_in_priority' });
    }
    phen.set(id, card.id);
  });

  // Mission 30 — totaux / effectifs / moyennes sur la même population déclarée
  (facts.expectedMetricTriples || []).forEach((exp) => {
    const card = accessible.find((c) => c.id === exp.cardId || c.title === exp.title);
    const body = `${card?.title || ''} ${card?.body || ''}`;
    const gotSessions = (() => {
      if (exp.subjectKey && Array.isArray(card?.metrics?.trajectories)) {
        const t = card.metrics.trajectories.find((x) => x.subject === exp.subjectKey);
        return t?.sessions ?? null;
      }
      const m = body.match(new RegExp(exp.prosePattern || 'sur\\s+(\\d+)\\s+séances?', 'i'));
      return m ? Number(m[1]) : card?.metrics?.sessionCount ?? null;
    })();
    const gotTotal =
      exp.subjectKey && Array.isArray(card?.metrics?.trajectories)
        ? card.metrics.trajectories.find((x) => x.subject === exp.subjectKey)?.recentReps
        : card?.metrics?.recentReps ?? card?.metrics?.windowTotalReps;
    if (exp.sessionCount != null && Number(gotSessions) !== Number(exp.sessionCount)) {
      report.factualConflicts += 1;
      report.cases.push({
        id: card?.id || exp.cardId,
        issue: 'independent_session_count_mismatch',
        expected: exp.sessionCount,
        obtained: gotSessions,
        failureFamily: 'wrong_population_or_denominator'
      });
    }
    if (exp.total != null && Number(gotTotal) !== Number(exp.total)) {
      report.factualConflicts += 1;
      report.cases.push({
        id: card?.id || exp.cardId,
        issue: 'independent_total_mismatch',
        expected: exp.total,
        obtained: gotTotal,
        failureFamily: 'wrong_aggregation'
      });
    }
    if (
      exp.total != null &&
      exp.mean != null &&
      exp.sessionCount != null &&
      Math.abs(Number(exp.total) - Number(exp.mean) * Number(exp.sessionCount)) > 0.51
    ) {
      report.factualConflicts += 1;
      report.cases.push({
        id: 'oracle',
        issue: 'independent_oracle_inconsistent',
        expected: exp,
        failureFamily: 'oracle_definition_error'
      });
    }
  });

  // Contrôle indépendant : preuve présente mais incorrecte / population / fenêtre
  (facts.expectedProofs || []).forEach((exp) => {
    const card = accessible.find((c) => c.id === exp.cardId || c.title === exp.title);
    if (!card) return;
    const values = card?.claim?.proof?.observedValues || [];
    (exp.values || []).forEach((want) => {
      const got = values.find((v) => v.id === want.id);
      if (!got) {
        report.factualConflicts += 1;
        report.cases.push({
          id: card.id,
          issue: 'proof_missing_expected_metric',
          expected: want,
          obtained: null
        });
        return;
      }
      if (Number(got.value) !== Number(want.value)) {
        report.factualConflicts += 1;
        report.cases.push({
          id: card.id,
          issue: 'proof_value_mismatch',
          expected: want,
          obtained: got
        });
      }
    });
    if (exp.populationId && card?.claim?.population?.id && card.claim.population.id !== exp.populationId) {
      report.factualConflicts += 1;
      report.cases.push({
        id: card.id,
        issue: 'population_mismatch',
        expected: exp.populationId,
        obtained: card.claim.population.id
      });
    }
  });

  if (facts.wrongDenominatorExample === true) {
    // Contre-exemple structurel : le harnais peut injecter une preuve avec mauvais dénominateur
    const injected = facts.injectedWrongProof;
    if (injected && Number(injected.numerator) / Number(injected.statedDenominator) !== Number(injected.claimedPct)) {
      report.factualConflicts += 1;
      report.cases.push({
        issue: 'incorrect_denominator_detected',
        expected: injected,
        obtained: 'caught'
      });
    }
  }

  // Mission 12 — cohérence inter-horizons + formulations interdites
  if (Array.isArray(facts.periodFacts) && facts.periodFacts.length >= 2) {
    const coherence = checkInterHorizonFactCoherence(facts.periodFacts);
    report.interHorizon = coherence;
    if (!coherence.ok) {
      report.factualConflicts += coherence.contradictionCount + coherence.labelMismatchCount;
      coherence.contradictions.forEach((c) => {
        report.cases.push({
          issue: 'inter_horizon_fact_contradiction',
          subject: c.subject,
          metric: c.metric,
          values: c.values
        });
      });
      coherence.labelMismatches.forEach((c) => {
        report.cases.push({
          issue: 'temporal_label_window_mismatch',
          ...c
        });
      });
    }
  }

  accessible.forEach((card) => {
    const text = `${card.title || ''} ${card.body || ''} ${card.evidence || ''}`;
    if (/rendement\s+0\s*reps\/h|densité\s+0\s*reps\/h/i.test(text)) {
      report.factualConflicts += 1;
      report.cases.push({ id: card.id, issue: 'unknown_density_presented_as_zero' });
    }
    if (/seuil de sommeil personnel|séparation reproductible/i.test(text)) {
      report.factualConflicts += 1;
      report.cases.push({ id: card.id, issue: 'sleep_overclaim_language' });
    }
    if (/s['']efface|dispara[iî]t/i.test(text) && /\d+\s*%|\d+\s*reps/i.test(text) && !/part|proportion|relative/i.test(text)) {
      report.cases.push({
        id: card.id,
        issue: 'share_drop_labeled_as_disappearance',
        note: 'heuristique — vérifier populations'
      });
    }
    if (/association_not_causation|snapshots=\d|primary\/secondary|socle_commun_avec_variantes/i.test(text)) {
      report.factualConflicts += 1;
      report.cases.push({ id: card.id, issue: 'technical_code_in_user_prose' });
    }
  });

  report.pass =
    report.factualConflicts === 0 &&
    report.identityMerges === 0 &&
    report.inventedCauses === 0 &&
    report.unpairedDensities === 0 &&
    report.missingClaims === 0 &&
    report.fusedSourcesRepublished === 0;
  return report;
}
