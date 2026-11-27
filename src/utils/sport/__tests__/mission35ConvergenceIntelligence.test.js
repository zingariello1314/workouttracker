/**
 * Mission 35 — identité métrique homonymes, DOM titres, Jeu A prose, reprise collective.
 */
import { describe, expect, it } from 'vitest';
import {
  claimFromDiscovery,
  disambiguateExerciseLabel,
  exerciseScopedMetricId
} from '../analyticalClaim';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { normalizeTitleForCompare } from '../evaluation/domEightPeriodVerify';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';
import { runGameCCollective } from '../evaluation/gameCCollective';
import { composeCollectiveReturnReading } from '../phenomenonComposition';
import { buildLiveReplayInputPack } from '../evaluation/buildLiveReplayInputPack';

describe('Mission 35 — édition', () => {
  it('bumpe editorial v34+ + claim population v3+', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v3[45]$/);
    expect(ANALYSIS_EDITION_PARTS.claim).toMatch(/^assertion-population-v[34]$/); // v3 M35 / v4 M36
  });
});

describe('Mission 35 — Porte A identité métrique homonymes', () => {
  it('clés distinctes pour deux Dips (103 vs 503)', () => {
    const a = { id: 103, name: 'Dips', reps: 480, monthReps: 192 };
    const b = { id: 503, name: 'Dips', reps: 480, monthReps: 144 };
    expect(exerciseScopedMetricId('monthReps', a)).toBe('monthReps:ex:103');
    expect(exerciseScopedMetricId('monthReps', b)).toBe('monthReps:ex:503');
    expect(exerciseScopedMetricId('monthReps', a)).not.toBe(exerciseScopedMetricId('monthReps', b));
    expect(disambiguateExerciseLabel(a, [a, b])).toContain('103');
    expect(disambiguateExerciseLabel(b, [a, b])).toContain('503');
  });

  it('carte disc_repertoire + claim : zéro contradiction sur homonymes', () => {
    const discovery = {
      kind: 'disc_repertoire',
      title: 'Tes mouvements de référence commencent à disposer d’un historique assez fourni',
      body: 'Dips (créneau 103) : 480 maintenant sur 192 en 30 jours. Dips (créneau 503) : 480 maintenant sur 144 en 30 jours.',
      evidence: 'Dips (créneau 103) · Dips (créneau 503)',
      metrics: {
        totalReps: 5000,
        observedValues: [
          { id: exerciseScopedMetricId('repsNow', { id: 103, name: 'Dips' }), value: 480, unit: 'reps' },
          { id: exerciseScopedMetricId('monthReps', { id: 103, name: 'Dips' }), value: 192, unit: 'reps' },
          { id: exerciseScopedMetricId('repsNow', { id: 503, name: 'Dips' }), value: 480, unit: 'reps' },
          { id: exerciseScopedMetricId('monthReps', { id: 503, name: 'Dips' }), value: 144, unit: 'reps' }
        ]
      }
    };
    const claim = claimFromDiscovery(discovery, { period: '3m' });
    const card = { ...discovery, claim, observedValues: discovery.metrics.observedValues };
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(true);
    const monthKeys = (claim.proof?.observedValues || [])
      .map((v) => v.id)
      .filter((id) => String(id).startsWith('monthReps:'));
    expect(monthKeys).toContain('monthReps:ex:103');
    expect(monthKeys).toContain('monthReps:ex:503');
    expect(monthKeys).not.toContain('monthReps:Dips');
  });

  it('négatif : collision name-only détectée comme divergence', () => {
    const card = {
      kind: 'disc_repertoire',
      title: 'Répertoire',
      body: 'Dips',
      metrics: {
        observedValues: [
          { id: 'monthReps:Dips', value: 192, unit: 'reps' },
          { id: 'monthReps:Dips', value: 144, unit: 'reps' }
        ]
      }
    };
    const claim = {
      proof: {
        observedValues: [
          { id: 'monthReps:Dips', value: 192, unit: 'reps' },
          { id: 'monthReps:Dips', value: 144, unit: 'reps' }
        ]
      }
    };
    const check = validateCardClaimConsistency(card, claim);
    expect(check.ok).toBe(false);
  });
});

describe('Mission 35 — Porte B DOM titres + homonymes UI', () => {
  it('normalise espace final sans masquer une différence de mot', () => {
    const a = 'Repère général: ce placement est très tardif ou ';
    const b = 'Repère général: ce placement est très tardif ou';
    expect(normalizeTitleForCompare(a)).toBe(normalizeTitleForCompare(b));
    expect(normalizeTitleForCompare(a)).not.toBe(normalizeTitleForCompare(`${b} nuit`));
  });
});

describe('Mission 35 — Porte C Jeu A prose visible', () => {
  it('primary/secondary dans le corps → FAIL ; preuve structurée seule OK si evidence propre', () => {
    const bad = {
      id: 'muscle-bad',
      kind: 'disc_muscle_now',
      disposition: 'priority',
      title: 'Les pectoraux portent le volume',
      body: 'Répartition indicative (parts conventionnelles primary/secondary).',
      evidence: '4 groupes',
      claim: {
        proof: { observedValues: [{ id: 'topShare', value: 36.1 }], documentary: true },
        assertions: [{ value: 36.1 }]
      }
    };
    const good = {
      id: 'muscle-good',
      kind: 'disc_muscle_now',
      disposition: 'priority',
      title: 'Les pectoraux portent le volume',
      body: 'Répartition indicative (parts musculaires principales et secondaires).',
      evidence: '4 groupes · 286 reps attribuées',
      claim: {
        proof: { observedValues: [{ id: 'topShare', value: 36.1 }], documentary: true },
        assertions: [{ value: 36.1 }]
      }
    };
    const badReport = runGameAAccuracy({
      insights: { shortTerm: [bad], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    const goodReport = runGameAAccuracy({
      insights: { shortTerm: [good], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(badReport.cases.some((c) => c.issue === 'technical_code_in_user_prose')).toBe(true);
    expect(goodReport.cases.some((c) => c.issue === 'technical_code_in_user_prose')).toBe(false);
  });
});

describe('Mission 35 — Porte E reprise collective ancrée', () => {
  it('cite la confirmation de la fenêtre, pas la première historique', () => {
    const reading = composeCollectiveReturnReading({
      namedMoves: [
        { name: 'Curl', exerciseId: 1, prevReps: 40, currentReps: 42, gapDays: 14 },
        { name: 'Pompes', exerciseId: 2, prevReps: 50, currentReps: 48, gapDays: 14 },
        { name: 'Squat', exerciseId: 3, prevReps: 30, currentReps: 30, gapDays: 14 }
      ],
      dates: ['2026-10-13'],
      confirmationDates: ['2026-10-20', '2026-11-17', '2026-11-24'],
      readingMode: 'confirmation',
      sessionFamilyLinked: true,
      windowStart: '2026-11-21',
      windowEnd: '2026-11-27'
    });
    expect(reading.conclusion).toMatch(/2026-11-24/);
    expect(reading.conclusion).toMatch(/déjà été confirmée|se poursuit/);
    expect(reading.conclusion).not.toMatch(/se confirme le 2026-10-20/);
  });
});

describe('Mission 35 — Porte D LIVE schedule squelette', () => {
  it('exporte le squelette de séances quand le programme est hydraté', () => {
    const pack = buildLiveReplayInputPack({
      snapshot: {
        reps: { '2026-11-24_1': 40 },
        checkedExercises: { '2026-11-24_1': true }
      },
      activeProgram: {
        id: 'default-program',
        name: 'Cycle',
        schedule: {
          mon: {
            label: 'Push',
            exercises: [
              { id: 103, name: 'Dips', series: '3×12' },
              { id: 503, name: 'Dips', series: '2×10' }
            ]
          }
        }
      },
      garminData: { dailyMetrics: {} }
    });
    expect(pack.ok).toBe(true);
    expect(pack.program.schedule.mon.exercises).toHaveLength(2);
    expect(pack.program.schedule.mon.exercises.map((e) => e.id).sort()).toEqual([103, 503]);
    expect(pack.program.schedule.mon.exercises[0].series).toMatch(/3/);
    expect(pack.program.schedule.mon.exercises[0].sets).toBe(3);
    expect(pack.reproducibility.programStructure).toBe('schedule_with_prescriptions');
  });
});

describe('Mission 35 — Porte F Jeu C homonymes non fusionnés', () => {
  it('deux titres identiques avec ids distincts restent accessibles', () => {
    const a = {
      id: 'disc_emergence|ex:106|fact:emergence|106|stable_format',
      kind: 'disc_emergence',
      title: 'Relevés de genoux à la barre: volume par séance stable',
      body: '21 séances documentées sur 315 jours.',
      metrics: { exerciseId: 106 },
      disposition: 'priority'
    };
    const b = {
      id: 'disc_emergence|ex:505|fact:emergence|505|stable_format',
      kind: 'disc_emergence',
      title: 'Relevés de genoux à la barre: volume par séance stable',
      body: '16 séances documentées — historique distinct.',
      metrics: { exerciseId: 505 },
      disposition: 'demoted_priority'
    };
    const report = runGameCCollective({
      insights: {
        shortTerm: [a],
        mediumTerm: [],
        longTerm: [],
        accessibleReserve: [b]
      },
      periodPacks: [
        {
          period: '1y',
          insights: {
            shortTerm: [a],
            mediumTerm: [],
            longTerm: [],
            accessibleReserve: [b]
          }
        }
      ]
    });
    expect(report.textualDuplicatesAccessible).toBe(0);
    const texts = [a, b].map((c) => `${c.title}\n${c.body}`);
    expect(texts[0]).not.toBe(texts[1]);
  });
});
