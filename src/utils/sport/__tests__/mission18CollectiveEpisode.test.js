/**
 * Mission 18 — cluster d’épisode : ne pas diluer 9 reprises le même jour
 * parmi des retours isolés d’autres mois.
 */
import { describe, expect, it } from 'vitest';
import {
  COVERAGE,
  clusterReturnEventsByEpisodeDate,
  exploreCollectiveReturn
} from '../analyticalExploration';
import { ANALYSIS_EDITION_PARTS, analysisMissionLabel } from '../analysisEdition';
import { reviewCollectively } from '../collectiveReview';
import { normalizePeakDayKey, semanticPhenomenonKey, substantiveEquivalence } from '../discoveryIdentity';
import { applyComposedNarrationToDiscovery } from '../recapComposedNarration';
import { rewriteTrajectoryWithPrescriptions } from '../programVariantContext';

function mkReturn(partial) {
  return {
    gapProvenByConsolidation: true,
    mechanism: 'resumed_former_level',
    gapDays: 28,
    ...partial
  };
}

const nov11Cluster = [
  mkReturn({
    name: 'Face pull',
    exerciseId: '306',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'shoulders',
    muscleGroup: 'shoulders',
    prevReps: 45,
    currentReps: 60
  }),
  mkReturn({
    name: 'Élévations latérales',
    exerciseId: '304',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'shoulders',
    muscleGroup: 'shoulders',
    prevReps: 45,
    currentReps: 60
  }),
  mkReturn({
    name: 'Pompes pseudo-planche',
    exerciseId: '302',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'chest',
    muscleGroup: 'chest',
    prevReps: 30,
    currentReps: 36
  }),
  mkReturn({
    name: 'Kickbacks triceps',
    exerciseId: '308',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    mechanism: 'partial_resume',
    family: 'triceps',
    muscleGroup: 'triceps',
    prevReps: 60,
    currentReps: 48
  }),
  mkReturn({
    name: 'Extension triceps debout',
    exerciseId: '307',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    mechanism: 'partial_resume',
    family: 'triceps',
    muscleGroup: 'triceps',
    prevReps: 48,
    currentReps: 42
  }),
  mkReturn({
    name: 'Développé Arnold',
    exerciseId: '1599606959',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'shoulders',
    muscleGroup: 'shoulders',
    prevReps: null,
    currentReps: 40
  }),
  mkReturn({
    name: 'Bent-Arm Lateral Raise',
    exerciseId: '1735485569',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'shoulders',
    muscleGroup: 'shoulders'
  }),
  mkReturn({
    name: 'Lying Triceps Extension',
    exerciseId: '369862756',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'triceps',
    muscleGroup: 'triceps'
  }),
  mkReturn({
    name: 'Side-Lying Triceps Extension',
    exerciseId: '1250363242',
    date: '2026-11-11',
    returnDate: '2026-11-11',
    confirmationDates: ['2026-11-18'],
    family: 'triceps',
    muscleGroup: 'triceps'
  })
];

const diluters = [
  mkReturn({
    name: 'Pompes inclinées',
    exerciseId: '105',
    date: '2026-10-19',
    returnDate: '2026-10-19',
    gapDays: 42,
    family: 'chest',
    muscleGroup: 'chest'
  }),
  mkReturn({
    name: 'Ancien mouvement mai',
    exerciseId: '999',
    date: '2026-05-25',
    returnDate: '2026-05-25',
    gapDays: 60,
    family: 'legs',
    muscleGroup: 'legs'
  })
];

describe('Mission 18 — cluster collectif', () => {
  it('édition courante dérivée sans hardcode figé', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v\d+$/);
    expect(ANALYSIS_EDITION_PARTS.collectiveReturn).toMatch(/episode|ledger/);
    expect(analysisMissionLabel()).toMatch(/^Mission \d+$/);
  });

  it('contre-exemple dilution flat : multi-dates → non conclu', () => {
    const flat = exploreCollectiveReturn([...nov11Cluster, ...diluters], { flat: true });
    expect(flat.coverage).not.toBe(COVERAGE.CONCLUDED);
  });

  it('cluster journalier isole l’épisode du 11 nov malgré les diluteurs', () => {
    const explored = exploreCollectiveReturn([...nov11Cluster, ...diluters], {
      window: { start: '2026-10-21', end: '2026-11-19' }
    });
    expect(explored.coverage).toBe(COVERAGE.CONCLUDED);
    expect(explored.episodeClusterDate).toBe('2026-11-11');
    expect(explored.dates).toEqual(['2026-11-11']);
    expect(explored.namedMoves.length).toBe(9);
    expect(explored.confirmationDates).toContain('2026-11-18');
  });

  it('préfère l’épisode dans la fenêtre à un collectif historique plus ancien', () => {
    const mayCluster = [
      mkReturn({
        name: 'Relevés barre',
        exerciseId: 'a',
        date: '2026-05-25',
        returnDate: '2026-05-25',
        confirmationDates: ['2026-11-16'],
        gapDays: 126,
        family: 'core',
        muscleGroup: 'core'
      }),
      mkReturn({
        name: 'Relevés parallèles',
        exerciseId: 'b',
        date: '2026-05-25',
        returnDate: '2026-05-25',
        confirmationDates: ['2026-11-16'],
        gapDays: 126,
        family: 'core',
        muscleGroup: 'core'
      })
    ];
    const explored = exploreCollectiveReturn([...mayCluster, ...nov11Cluster], {
      window: { start: '2026-10-21', end: '2026-11-19' }
    });
    expect(explored.coverage).toBe(COVERAGE.CONCLUDED);
    expect(explored.episodeClusterDate).toBe('2026-11-11');
  });

  it('clusterReturnEventsByEpisodeDate trie par densité', () => {
    const clusters = clusterReturnEventsByEpisodeDate([...nov11Cluster, ...diluters]);
    expect(clusters[0].date).toBe('2026-11-11');
    expect(clusters[0].size).toBe(9);
  });

  it('reviewCollectively propage gapDays / mechanism pour le filet structurel', () => {
    const peers = nov11Cluster.map((e, i) => ({
      discovery: {
        kind: 'disc_format_consolidation',
        title: `${e.name} : reprise`,
        body: 'reprise documentée',
        metrics: {
          exerciseId: e.exerciseId,
          exerciseName: e.name,
          name: e.name,
          date: e.date,
          returnDate: e.returnDate,
          dates: e.confirmationDates,
          gapDays: e.gapDays,
          mechanism: e.mechanism,
          prevReps: e.prevReps,
          currentReps: e.currentReps
        }
      },
      exploration: { coverage: 'under_explored' },
      claim: { id: `c${i}`, layer: 'conclusion', status: 'supported', allowedStatements: ['x'] }
    }));
    const reviewed = reviewCollectively(peers, { voiceKey: 'week' });
    const structural = reviewed.decisions.filter((d) => d.reason === 'individual_returns_without_collective');
    expect(structural.length).toBeGreaterThan(0);
    const withCollectiveExploration = reviewed.survivors.find(
      (r) => r.exploration?.coverage === COVERAGE.CONCLUDED && r.exploration?.namedMoves?.length >= 2
    );
    expect(withCollectiveExploration).toBeTruthy();
  });
});

describe('Mission 18 — thèses / pic', () => {
  it('normalise le pic 18 novembre FR et ISO vers la même clé', () => {
    expect(normalizePeakDayKey('2026-11-18')).toBe('2026-11-18');
    expect(normalizePeakDayKey('18 novembre 2026')).toBe('2026-11-18');
    const a = {
      kind: 'disc_th_concentration_now',
      title: 'Le 18 novembre 2026 porte une grande part de ces 7 jours',
      metrics: { peakDate: '2026-11-18' }
    };
    const b = {
      kind: 'disc_peak_day',
      title: 'La séance du 18 novembre 2026 concentre une part importante de ces 7 jours',
      metrics: {}
    };
    expect(semanticPhenomenonKey(a)).toBe(semanticPhenomenonKey(b));
    expect(substantiveEquivalence(a, b).equivalent).toBe(true);
    expect(substantiveEquivalence(a, b).reason).toBe('same_peak_concentration_day');
  });

  it('F4 n’écrase pas une thèse variant_mix_shift déjà rédigée', () => {
    const program = {
      schedule: {
        mon: { name: 'A', exercises: [{ name: 'Pompes déclinées', series: '3x12', id: 'd' }] },
        fri: { name: 'B', exercises: [{ name: 'Pompes déclinées', series: '5x10', id: 'd' }] }
      }
    };
    // Mission 20 — appariement indépendant du volume (dayKey / sessionName),
    // pas seulement proximité 36↔3x12 / 50↔5x10 (circularité).
    const sessions = [
      { date: '2026-10-01', totalReps: 36, dayKey: 'mon', sessionName: 'A' },
      { date: '2026-10-08', totalReps: 36, dayKey: 'mon', sessionName: 'A' },
      { date: '2026-11-05', totalReps: 50, dayKey: 'fri', sessionName: 'B' },
      { date: '2026-11-12', totalReps: 50, dayKey: 'fri', sessionName: 'B' }
    ];
    const before = {
      kind: 'disc_exercise_progress',
      title: 'Pompes déclinées: recul confirmé sur plusieurs séances',
      body: 'Sur plusieurs séances, le volume moyen baisse.',
      metrics: { exerciseName: 'Pompes déclinées', trajectoryOk: true, name: 'Pompes déclinées' }
    };
    const rewritten = rewriteTrajectoryWithPrescriptions(before, program, {
      sessions,
      splitDate: '2026-11-01'
    });
    expect(rewritten.metrics?.thesis).toBe('variant_mix_shift');
    expect(rewritten.title).toMatch(/mélange de variantes/i);
    const afterF4 = applyComposedNarrationToDiscovery({
      ...rewritten,
      metrics: {
        ...rewritten.metrics,
        composedEvidence: { composed: true, factCount: 2 }
      }
    });
    expect(afterF4.title).toBe(rewritten.title);
    expect(afterF4.body).toBe(rewritten.body);
    expect(afterF4.metrics?.f4Narration?.abstained).toBe(true);
  });
});
