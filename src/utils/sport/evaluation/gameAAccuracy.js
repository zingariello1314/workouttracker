import { emptyGameAReport } from './evaluationTypes';
import { classifyStimulus } from '../recapStimulusCatalog';

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
        assertions.some((a) => a?.value != null || a?.referenceValue != null);
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
    if (card?.p6Disposition === 'source_retained' || card?.collapsedInto) {
      report.fusedSourcesRepublished += 1;
      report.cases.push({ id: card?.id || card?.title, issue: 'fused_source_accessible' });
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

  report.pass =
    report.factualConflicts === 0 &&
    report.identityMerges === 0 &&
    report.inventedCauses === 0 &&
    report.unpairedDensities === 0 &&
    report.missingClaims === 0 &&
    report.fusedSourcesRepublished === 0;
  return report;
}
