/**
 * Mission 36 — preuves Jeu A, physiologie Jeu B, prescriptions LIVE, calendrier.
 */
import { describe, expect, it } from 'vitest';
import { ANALYSIS_EDITION_PARTS } from '../analysisEdition';
import { claimFromDiscovery } from '../analyticalClaim';
import { validateCardClaimConsistency } from '../evaluation/claimAssertionIdentity';
import { buildLiveReplayInputPack } from '../evaluation/buildLiveReplayInputPack';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';
import { runGameBDiscoveryQuality } from '../evaluation/gameBDiscoveryQuality';
import { runGameCCollective } from '../evaluation/gameCCollective';
import { describeCalendarShape } from '../recapCalendarShape';

describe('Mission 36 — édition', () => {
  it('bumpe editorial v35 + claim v4', () => {
    expect(ANALYSIS_EDITION_PARTS.editorial).toMatch(/^p6-sovereign-v3[5-8]$/);
    expect(ANALYSIS_EDITION_PARTS.claim).toBe('assertion-population-v4');
  });
});

describe('Mission 36 — Porte A preuves numériques', () => {
  it('disc_composed_load_phase : composition.namedMoves compte comme preuve', () => {
    const card = {
      id: 'load-phase',
      kind: 'disc_composed_load_phase',
      disposition: 'priority',
      title: 'Phase collective d’augmentation de charge',
      body: '5 hausses. Ce n’est pas une affirmation de force maximale ni d’hypertrophie — seulement une phase documentée d’augmentation de charge externe.',
      metrics: {
        composition: {
          namedMoves: [
            { name: 'Curl marteau', loadBefore: 7, loadAfter: 8, date: '2026-07-28' },
            { name: 'Curl Zottman', loadBefore: 5, loadAfter: 6, date: '2026-07-28' },
            { name: 'Oiseaux', loadBefore: 3, loadAfter: 4, date: '2026-07-30' }
          ],
          metrics: { eventCount: 3, exerciseCount: 3 }
        }
      },
      claim: { proof: { observedValues: [] }, assertions: [] }
    };
    const report = runGameAAccuracy({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.issue === 'priority_without_numeric_proof')).toBe(false);
  });

  it('disc_ratio_structure : claim porte pushShare/pullShare', () => {
    const discovery = {
      kind: 'disc_ratio_structure',
      title: 'La structure se lit dans les ratios',
      body: 'Poussée/tirage 56 % / 26 %.',
      metrics: {
        pushShare: 0.562,
        pullShare: 0.26,
        lowerShare: 0.075,
        pushReps: 1000,
        pullReps: 463,
        identifiedMuscleReps: 1780,
        observedValues: [
          { id: 'pushShare', value: 0.562, unit: 'percent' },
          { id: 'pullShare', value: 0.26, unit: 'percent' }
        ]
      }
    };
    const claim = claimFromDiscovery(discovery, { period: '2y' });
    expect((claim.proof.observedValues || []).length).toBeGreaterThan(0);
    const card = { ...discovery, disposition: 'priority', claim };
    const report = runGameAAccuracy({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.issue === 'priority_without_numeric_proof')).toBe(false);
  });

  it('négatif : priorité sans aucune preuve structurée → FAIL', () => {
    const card = {
      id: 'empty-priority',
      kind: 'disc_ratio_structure',
      disposition: 'priority',
      title: 'Sans preuve',
      body: 'Texte avec 56 % inventés',
      metrics: {},
      claim: { proof: { observedValues: [] }, assertions: [] }
    };
    const report = runGameAAccuracy({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.issue === 'priority_without_numeric_proof')).toBe(true);
  });

  it('négatif : valeur volontairement fausse → divergence claim/carte', () => {
    const card = {
      kind: 'disc_quarter_profile',
      title: 'Profil',
      body: '13963',
      metrics: {
        quarterReps: 13963,
        observedValues: [{ id: 'quarterReps', value: 13963, unit: 'reps' }]
      },
      observedValues: [{ id: 'quarterReps', value: 13963, unit: 'reps' }]
    };
    const claim = {
      proof: { observedValues: [{ id: 'quarterReps', value: 99999, unit: 'reps' }] }
    };
    expect(validateCardClaimConsistency(card, claim).ok).toBe(false);
  });
});

describe('Mission 36 — Porte B physiologie', () => {
  it('négation explicite force maximale / hypertrophie → pas unsupported_physiology', () => {
    const card = {
      id: 'load-ok',
      kind: 'disc_composed_load_phase',
      title: 'Phase collective d’augmentation de charge',
      body: '5 hausses de charge. Ce n’est pas une affirmation de force maximale ni d’hypertrophie — seulement une phase documentée d’augmentation de charge externe.',
      claim: { proof: { observedValues: [{ id: 'loadRaiseCount', value: 5 }] } },
      metrics: { observedValues: [{ id: 'loadRaiseCount', value: 5 }] }
    };
    const report = runGameBDiscoveryQuality({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.result === 'unsupported_physiology')).toBe(false);
  });

  it('affirmation hypertrophie sans preuve → rejet', () => {
    const card = {
      id: 'bad-physio',
      kind: 'disc_composed_load_phase',
      title: 'Hypertrophie',
      body: 'Ces charges ont provoqué une hypertrophie démontrée sur le trimestre.',
      claim: { proof: { observedValues: [{ id: 'x', value: 1 }] } }
    };
    const report = runGameBDiscoveryQuality({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.result === 'unsupported_physiology')).toBe(true);
  });

  it('charge externe documentée admissible', () => {
    const card = {
      id: 'load-external',
      kind: 'disc_composed_load_phase',
      title: 'Charge',
      body: 'La charge externe enregistrée augmente de 7 à 8 kg sur Curl marteau.',
      claim: { proof: { observedValues: [{ id: 'loadAfter:Curl', value: 8 }] } }
    };
    const report = runGameBDiscoveryQuality({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] }
    });
    expect(report.cases.some((c) => c.result === 'unsupported_physiology')).toBe(false);
  });
});

describe('Mission 36 — Porte C prescriptions series', () => {
  it('exporte series source et dérive sets/reps sans inventer depuis les totaux', () => {
    const pack = buildLiveReplayInputPack({
      snapshot: { reps: { '2026-11-24_101': 40 }, checkedExercises: { '2026-11-24_101': true } },
      activeProgram: {
        id: 'p1',
        name: 'Cycle',
        schedule: {
          lundi: {
            label: 'Street',
            exercises: [
              { id: 101, name: 'Tractions pronation', series: '4×8' },
              { id: 103, name: 'Dips', series: '3×12' }
            ]
          }
        }
      },
      garminData: { dailyMetrics: {} }
    });
    const ex = pack.program.schedule.lundi.exercises;
    expect(ex[0].series).toBe('4×8');
    expect(ex[0].sets).toBe(4);
    expect(ex[0].reps).toBe(8);
    expect(ex[0].plannedReps).toBe(32);
    expect(pack.reproducibility.programStructure).toBe('schedule_with_prescriptions');
  });
});

describe('Mission 36 — Porte D calendrier non causal', () => {
  it('ne prétend plus que les jours de repos « rendent le bloc possible »', () => {
    const shape = describeCalendarShape({
      thisPeriod: 'ces 7 jours',
      start: '2026-11-21',
      end: '2026-11-27',
      repsByDate: {
        '2026-11-24': 296,
        '2026-11-26': 51
      }
    });
    expect(shape).toBeTruthy();
    expect(shape.body || '').not.toMatch(/rendent le bloc possible/);
    expect(shape.body || '').toMatch(/sans preuve|coexistence|rythme calendaire/i);
  });
});

describe('Mission 36 — Porte E Jeu C homonymes 8h smoke', () => {
  it('conserve deux émergences homonymes', () => {
    const a = {
      id: 'disc_emergence|ex:106',
      kind: 'disc_emergence',
      title: 'Relevés: volume stable',
      body: '21 séances',
      metrics: { exerciseId: 106 }
    };
    const b = {
      id: 'disc_emergence|ex:505',
      kind: 'disc_emergence',
      title: 'Relevés: volume stable',
      body: '16 séances',
      metrics: { exerciseId: 505 }
    };
    const report = runGameCCollective({
      periodPacks: [
        {
          period: '1y',
          insights: { shortTerm: [a], mediumTerm: [], longTerm: [], accessibleReserve: [b] }
        },
        {
          period: '2y',
          insights: { shortTerm: [a], mediumTerm: [], longTerm: [], accessibleReserve: [b] }
        }
      ]
    });
    expect(report.textualDuplicatesAccessible).toBe(0);
  });
});
