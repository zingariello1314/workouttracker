import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import {
  composeCollectiveReturnReading,
  composeVolumeFrequencyContentReading,
  composeRelativeConcentrationReading,
  composeLoadProgressionPhase
} from '../phenomenonComposition';
import { rewriteTrajectoryWithPrescriptions } from '../programVariantContext';
import {
  checkInterHorizonFactCoherence,
  extractAtomicFactsFromCards
} from '../interHorizonFactCoherence';
import { detectMonthlyVolumeArcShape } from '../monthlyVolumeArcDiscoveries';
import { polishCardProse } from '../editorialProseGuard';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';

describe('Mission 12 — composition et cohérence', () => {
  it('conserve composition + cohérence (édition ≥ v11)', () => {
    const key = analysisEditionKey();
    expect(key).toMatch(/editorial=p6-sovereign-v\d+/);
    expect(key).toMatch(/composition=phenomenon-compose-v\d+/);
    expect(key).toMatch(/coherence=inter-horizon-v\d+/);
    expect(key).toMatch(/program=structural-context-v[34]/);
  });

  it('compose un retour collectif avec formats partiels', () => {
    const reading = composeCollectiveReturnReading({
      namedMoves: [
        { name: 'Élévations latérales', prevReps: 60, currentReps: 60 },
        { name: 'Face pull', prevReps: 60, currentReps: 60 },
        { name: 'Kickbacks', prevReps: 60, currentReps: 48 },
        { name: 'Extension triceps', prevReps: 48, currentReps: 42 }
      ],
      dates: ['2026-11-18'],
      families: ['shoulders', 'triceps'],
      sessionFamilyLinked: true
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.conclusion).toMatch(/réinstalle|réorganisation/i);
    expect(reading.conclusion).toMatch(/retrait|Kickbacks|Extension/i);
    expect(reading.stats.fullRecoveryCount).toBe(2);
    expect(reading.stats.partialRecoveryCount).toBe(2);
  });

  it('compose volume : baisse totale mais contenu en hausse', () => {
    const reading = composeVolumeFrequencyContentReading({
      repsBefore: 18250,
      repsAfter: 13950,
      daysBefore: 60,
      daysAfter: 41,
      labelBefore: 'premier bloc',
      labelAfter: 'second bloc'
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.conclusion).toMatch(/fréquence|contenu/i);
    expect(reading.decomposition.ok).toBe(true);
    expect(reading.decomposition.contentPct).toBeGreaterThan(0);
    expect(reading.decomposition.volumePct).toBeLessThan(0);
  });

  it('compose concentration relative', () => {
    const reading = composeRelativeConcentrationReading({
      localReps: 180,
      localShareOfPeriod: 0.5,
      globalShareOfPeriod: 0.222,
      moveNames: ['Élévations', 'Face pull', 'Bent-Arm'],
      periodLabel: '7 jours',
      parentPeriodLabel: '30 jours'
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.ratio).toBeGreaterThan(2);
    expect(reading.conclusion).toMatch(/volume de ces mouvements/);
    expect(reading.conclusion).not.toMatch(/% du volume de 7 jours,\s*contre/);
  });

  it('compose phase de charges', () => {
    const reading = composeLoadProgressionPhase({
      events: [
        { name: 'Curl marteau', loadBefore: 7, loadAfter: 8, date: '2026-08-10', formatStable: true },
        { name: 'Curl Zottman', loadBefore: 5, loadAfter: 6, date: '2026-08-12', formatStable: true },
        { name: 'Oiseaux', loadBefore: 3, loadAfter: 4, date: '2026-08-14', formatStable: true }
      ]
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.title).toMatch(/charge/i);
  });

  it('réécrit une trajectoire avec prescriptions concrètes', () => {
    const program = {
      schedule: {
        mon: {
          name: 'A',
          exercises: [{ name: 'Pompes déclinées', series: '3x12', id: 'p1' }, { name: 'Pompes inclinées', series: '3x12' }]
        },
        fri: {
          name: "A'",
          exercises: [{ name: 'Pompes déclinées', series: '5x10', id: 'p1' }]
        }
      }
    };
    const row = rewriteTrajectoryWithPrescriptions(
      {
        title: 'Pompes déclinées −28 %',
        body: 'Le volume moyen passe de 50 à 36.',
        metrics: { exerciseName: 'Pompes déclinées', lastReps: 36 }
      },
      program
    );
    expect(row.body).toMatch(/3\s*[x×]\s*12|5\s*[x×]\s*10/i);
    expect(row.body).toMatch(/Prescriptions documentées/);
    expect(row.metrics.composition).toBe('program_prescription_compare');
  });

  it('détecte les contradictions inter-horizons', () => {
    const report = checkInterHorizonFactCoherence([
      {
        period: '30d',
        facts: [
          {
            subject: 'hyperextension',
            metricId: 'reps_30d',
            value: 192,
            unit: 'reps',
            windowStart: '2026-10-22',
            windowEnd: '2026-11-21',
            method: 'sum'
          }
        ]
      },
      {
        period: '3m',
        facts: [
          {
            subject: 'hyperextension',
            metricId: 'reps_30d',
            value: 336,
            unit: 'reps',
            windowStart: '2026-10-22',
            windowEnd: '2026-11-21',
            method: 'sum',
            label: '30 derniers jours'
          }
        ]
      }
    ]);
    expect(report.ok).toBe(false);
    expect(report.contradictionCount).toBe(1);
  });

  it('attribue le premier retournement, pas seulement le dernier mois', () => {
    const months = [
      { ym: '2026-06', reps: 6947, days: 20, repsPerDay: 347 },
      { ym: '2026-07', reps: 5827, days: 18, repsPerDay: 324 },
      { ym: '2026-08', reps: 5438, days: 17, repsPerDay: 320 },
      { ym: '2026-09', reps: 3704, days: 12, repsPerDay: 309 },
      { ym: '2026-10', reps: 4282, days: 12, repsPerDay: 357 },
      { ym: '2026-11', reps: 4673, days: 13, repsPerDay: 359 }
    ];
    const shape = detectMonthlyVolumeArcShape(months, { windowEndYmd: '2026-11-21' });
    expect(shape).toBeTruthy();
    expect(shape.firstRebound?.ym).toBe('2026-10');
    // Novembre peut rester « recent » s’il n’est pas classé incomplet ; le premier retournement doit être octobre.
    expect(['2026-10', '2026-11']).toContain(shape.recent.ym);
  });

  it('polish élimine seuil / rendement 0', () => {
    const polished = polishCardProse({
      title: 'Seuil de sommeil personnel',
      body: 'séparation reproductible et rendement 0 reps/h',
      evidence: '0 reps/h'
    });
    expect(polished.title + polished.body + polished.evidence).not.toMatch(/seuil de sommeil personnel/i);
    expect(polished.body).not.toMatch(/séparation reproductible/i);
    expect(polished.body + polished.evidence).not.toMatch(/0\s*reps\/h/);
  });

  it('jeu A détecte contradiction inter-horizons injectée', () => {
    const a = runGameAAccuracy({
      insights: { shortTerm: [], mediumTerm: [], longTerm: [], accessibleReserve: [] },
      referenceFacts: {
        periodFacts: [
          {
            period: '30d',
            facts: [
              {
                subject: 'x',
                metricId: 'reps',
                value: 100,
                windowStart: '2026-10-01',
                windowEnd: '2026-10-30',
                method: 'm'
              }
            ]
          },
          {
            period: '6m',
            facts: [
              {
                subject: 'x',
                metricId: 'reps',
                value: 200,
                windowStart: '2026-10-01',
                windowEnd: '2026-10-30',
                method: 'm'
              }
            ]
          }
        ]
      }
    });
    expect(a.pass).toBe(false);
    expect(a.cases.some((c) => c.issue === 'inter_horizon_fact_contradiction')).toBe(true);
  });

  it('extrait des faits atomiques depuis des cartes', () => {
    const { facts } = extractAtomicFactsFromCards([
      {
        id: 'c1',
        kind: 'disc_x',
        metrics: {
          totalReps: 1340,
          windowStart: '2026-10-22',
          windowEnd: '2026-11-21',
          population: 'period_window'
        },
        claim: {
          scope: { start: '2026-10-22', end: '2026-11-21' },
          proof: { observedValues: [{ id: 'reps', value: 1340, unit: 'reps' }] }
        }
      }
    ]);
    expect(facts.length).toBeGreaterThanOrEqual(1);
  });
});
