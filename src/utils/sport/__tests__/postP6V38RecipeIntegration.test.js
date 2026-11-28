/**
 * Recette produit v38 — branchement réel des 3 parcours visuels
 * sur les formes de discoveries publiées (pas des métriques idéalisées).
 */
import { describe, expect, it } from 'vitest';
import {
  attachVisualInsight,
  buildVisualInsightSpec,
  normalizeVisualMetrics
} from '../analysisVisualInsight';
import { composeVolumeFrequencyContentReading } from '../phenomenonComposition';
import { composeRelativeConcentrationReading } from '../phenomenonComposition';
import { polishDiscoveryProse } from '../recapEditorialPolish';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { buildExerciseTrajectory } from '../exerciseTrajectoryAnalysis';
import { buildComposedEvidenceFromTrajectory } from '../recapComposedEvidence';
import { narrateFromComposedEvidence } from '../recapComposedNarration';

function ymd(offsetFromBase, base = '2026-09-28') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offsetFromBase);
  return d.toISOString().slice(0, 10);
}

describe('Recette v38 — édition', () => {
  it('editorial = p6-sovereign-v38b', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toBe('p6-sovereign-v38b');
  });
});

describe('Recette v38 — A. volume freq/contenu (forme disc_composed_volume_decomp)', () => {
  it('4891→5730 avec +1427 / −588 se réconcilie et produit un spec', () => {
    const reading = composeVolumeFrequencyContentReading({
      repsBefore: 4891,
      repsAfter: 5730,
      daysBefore: 13,
      daysAfter: 17,
      labelBefore: 'les 30 jours d’avant',
      labelAfter: 'ces 30 jours'
    });
    expect(reading.coverage).toBe('concluded');
    const split = reading.decomposition;
    expect(split.ok).toBe(true);
    expect(Math.round(split.frequency + split.content)).toBe(Math.round(split.observed));
    // Carte telle que publiée par detectDiscoveries
    const card = {
      kind: 'disc_composed_volume_decomp',
      title: reading.title,
      body: reading.conclusion,
      metrics: {
        ...split,
        composition: reading,
        visualKind: 'volume_freq_content',
        prevReps: 4891,
        curReps: 5730,
        freqEffect: split.frequency,
        contentEffect: split.content,
        netDelta: split.observed,
        population: 'strength_positive_reps_days',
        observedValues: [
          { id: 'repsBefore', value: 4891, unit: 'reps' },
          { id: 'repsAfter', value: 5730, unit: 'reps' }
        ]
      }
    };
    const spec = buildVisualInsightSpec(card);
    expect(spec?.kind).toBe('volume_freq_content');
    expect(spec.series.find((s) => s.id === 'before').value).toBe(4891);
    expect(spec.series.find((s) => s.id === 'after').value).toBe(5730);
    const freq = spec.series.find((s) => s.id === 'freq').value;
    const content = spec.series.find((s) => s.id === 'content').value;
    const net = spec.series.find((s) => s.id === 'net').value;
    expect(freq + content).toBe(net);
    expect(spec.meta.reconciliationOk).toBe(true);
    expect(freq).toBeGreaterThan(0);
    expect(content).toBeLessThan(0);
    // Sans visualKind explicite — normalizer depuis frequency/content
    const cardRaw = {
      kind: 'disc_composed_volume_decomp',
      metrics: {
        ...split,
        composition: reading,
        observedValues: [
          { id: 'repsBefore', value: 4891, unit: 'reps' },
          { id: 'repsAfter', value: 5730, unit: 'reps' }
        ]
      }
    };
    const spec2 = buildVisualInsightSpec(cardRaw);
    expect(spec2?.kind).toBe('volume_freq_content');
    expect(spec2.series.find((s) => s.id === 'before').value).toBe(4891);
  });
});

describe('Recette v38 — B. concentration relative (forme publiée imbriquée)', () => {
  it('lit relativeConcentration imbriqué + dénominateurs 124/372 et 347/5730', () => {
    const reading = composeRelativeConcentrationReading({
      localReps: 124,
      moveShareOfParentWindow: 124 / 372,
      globalShareOfParentWindow: 347 / 5730,
      moveNames: ['Développé couché incliné', 'Pompes déclinées', 'Curl assis'],
      periodLabel: '7 jours',
      parentPeriodLabel: '30 jours',
      localRepsInParent: 372,
      globalRepsShort: 347,
      globalRepsParent: 5730
    });
    // Forme HISTORIQUE (avant aplatissement) encore supportée
    const cardNested = {
      kind: 'disc_composed_relative_concentration',
      title: reading.title,
      body: reading.conclusion,
      metrics: {
        exercises: reading.metrics.moveNames,
        totalReps: 347,
        relativeConcentration: reading.metrics,
        moveShareOfMonth: 124 / 372,
        weekShareOfMonthGlobal: 347 / 5730,
        observedValues: [
          { id: 'reps:a', value: 48, unit: 'reps' },
          { id: 'monthReps:a', value: 144, unit: 'reps' },
          { id: 'reps:b', value: 40, unit: 'reps' },
          { id: 'monthReps:b', value: 120, unit: 'reps' },
          { id: 'reps:c', value: 36, unit: 'reps' },
          { id: 'monthReps:c', value: 108, unit: 'reps' }
        ]
      }
    };
    const spec = buildVisualInsightSpec(cardNested);
    expect(spec?.kind).toBe('relative_concentration');
    expect(spec.series).toHaveLength(2);
    expect(spec.series[0].value).toBe(33.3);
    expect(spec.series[1].value).toBe(6.1);
    expect(spec.series[0].population).not.toBe(spec.series[1].population);
    expect(spec.series[0].numerator).toBe(124);
    expect(spec.series[0].denominator).toBe(372);
    expect(spec.series[1].numerator).toBe(347);
    expect(spec.series[1].denominator).toBe(5730);
    expect(spec.meta.note).toMatch(/dénominateur/i);
  });
});

describe('Recette v38 — C. trajectoire Hyperextension', () => {
  it('titre, corps, preuve et spec alignés sur 7×48+24', () => {
    const totals = [48, 48, 48, 48, 48, 48, 48, 24];
    const checkedExercises = {};
    const reps = {};
    totals.forEach((total, i) => {
      const date = ymd(i * 7);
      checkedExercises[`${date}_703294235`] = true;
      reps[`${date}_703294235`] = String(total);
    });
    const traj = buildExerciseTrajectory({
      snapshot: { checkedExercises, reps },
      exerciseId: '703294235',
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(7 * 7) },
      mode: 'progress'
    });
    const composed = traj.composedEvidence || buildComposedEvidenceFromTrajectory(traj);
    const narrated = narrateFromComposedEvidence(composed, {
      metrics: { composedEvidence: composed, ...traj.metrics }
    });
    const card = {
      kind: 'disc_exercise_progress',
      title: narrated.title,
      body: narrated.body,
      evidence: narrated.evidence,
      metrics: {
        composedEvidence: composed,
        trajectoryPrimaryStory: traj.shape?.primaryStory,
        sessionTotals: totals,
        sessionDates: totals.map((_, i) => ymd(i * 7)),
        sessions: (traj.sessions?.trace || []).map((s) => ({ date: s.date, reps: s.totalReps }))
      }
    };
    const polished = polishDiscoveryProse(card);
    expect(polished.metrics?.visualInsight?.kind).toBe('trajectory_sessions');
    const spec = polished.metrics.visualInsight;
    expect(spec.series.map((s) => s.value)).toEqual(totals);
    expect(spec.meta.atypical).toBe(true);
    expect(spec.series[7].highlight).toBe('atypical');
    expect(String(polished.title || card.title)).toMatch(/atypique|pas encore une tendance/i);
    expect(String(polished.body || card.body)).toMatch(/ponctuelle|sans permettre de conclure/i);
    expect(String(polished.evidence || narrated.evidence || '')).toMatch(/24/);
  });
});

describe('Recette v38 — lecture progressive & polish', () => {
  it('attachVisualInsight via polishDiscoveryProse sur volume', () => {
    const card = {
      kind: 'disc_composed_volume_decomp',
      title: 'Plus de volume total, mais moins de reps par journée active',
      body: 'x'.repeat(500),
      metrics: {
        frequency: 1427,
        content: -588,
        observed: 839,
        prevReps: 4891,
        curReps: 5730,
        sessionsBefore: 13,
        sessionsAfter: 17,
        repsPerSessionBefore: 4891 / 13,
        repsPerSessionAfter: 5730 / 17,
        ok: true
      }
    };
    const polished = attachVisualInsight(card);
    expect(polished.metrics.visualInsight?.kind).toBe('volume_freq_content');
    expect(normalizeVisualMetrics(card).freqEffect).toBe(1427);
  });

  it('carte courte sans graphique reste consultable (spec null OK)', () => {
    const card = {
      kind: 'disc_sleep_night',
      title: 'Une nuit plus courte',
      body: '4 h 37.',
      metrics: { hours: 4.6 }
    };
    expect(buildVisualInsightSpec(card)).toBeNull();
    expect(attachVisualInsight(card)).toEqual(card);
  });
});
