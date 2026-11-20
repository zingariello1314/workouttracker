import { describe, expect, it } from 'vitest';
import {
  COMPARISON_OUTCOME,
  chooseSessionComparison,
  collectResistanceProgressions,
  compareResistanceAtFormat,
  compareSessionWork,
  loadsAreComparable
} from '../sessionDemandComparison';
import { buildSessionWorkProfiles } from '../sessionWorkProfile';
import { resolveAnalysisFamily } from '../recapSelectionDiagnostics';
import { classifyExerciseStanding, isHistoricalOrphan, summarizeRepCoverage } from '../historicalOrphanExercises';
import { convertToStableNumericId } from '../../workoutExerciseIdResolve';
import { accessibleDiscoveryCatalog, selectPeriodDiscoveriesWithTrace } from '../recapPeriodSelection';
import { buildPipelineSummary } from '../analysisEnginePipelineModel';
import { bestCalendarMonths } from '../recapPeriodDetectDiscoveries';
import { evaluateVolumeChange } from '../recapVolumeQuestion';
import { compareDomToPack } from '../analysisEngineComparison';

function session(partial) {
  return {
    reps: 0,
    recordedSetCount: 0,
    loadCoverage: 1,
    resistanceRaises: 0,
    exercises: [],
    ...partial
  };
}

describe('comparaison de séances', () => {
  it('distingue 100 répétitions polyarticulaires de 200 répétitions localisées', () => {
    const result = compareSessionWork(
      session({
        reps: 100,
        recordedSetCount: 15,
        resistanceRaises: 2,
        exercises: [
          { movementNature: 'polyarticular', reps: 40 },
          { movementNature: 'polyarticular', reps: 30 },
          { movementNature: 'polyarticular', reps: 30 }
        ]
      }),
      session({
        reps: 200,
        recordedSetCount: 13,
        resistanceRaises: 0,
        exercises: [
          { movementNature: 'localized', reps: 80 },
          { movementNature: 'localized', reps: 70 },
          { movementNature: 'localized', reps: 50 }
        ]
      })
    );
    expect(result.outcome).toBe(COMPARISON_OUTCOME.DIFFERENT_NATURE);
    expect(result.ahead.reps).toBe('b');
    expect(result.ahead.sets).toBe('a');
    expect(result.claim).not.toMatch(/fatig|hypertroph/i);
  });

  it('laisse la comparaison non concluante quand seules les répétitions diffèrent et que les charges manquent', () => {
    const result = compareSessionWork(
      session({ reps: 100, recordedSetCount: null, loadCoverage: 0, exercises: [] }),
      session({ reps: 200, recordedSetCount: null, loadCoverage: 0, exercises: [] })
    );
    expect(result.outcome).toBe(COMPARISON_OUTCOME.INCONCLUSIVE);
  });

  it('reconnaît une hausse de charge à format constant et refuse un haltère par bras contre un total', () => {
    const raised = compareResistanceAtFormat(
      { reps: 20, setCount: 4, load: { recorded: true, value: 0, unit: 'kg', mode: 'total' } },
      { reps: 20, setCount: 4, load: { recorded: true, value: 5, unit: 'kg', mode: 'total' } }
    );
    expect(raised.change).toBe('load_up_same_format');
    expect(loadsAreComparable(
      { recorded: true, value: 10, mode: 'per_arm' },
      { recorded: true, value: 20, mode: 'total' }
    ).comparable).toBe(false);
    expect(compareResistanceAtFormat(
      { reps: 20, setCount: 4, load: { recorded: false, value: null } },
      { reps: 20, setCount: 4, load: { recorded: true, value: 5, unit: 'kg', mode: 'total' } }
    ).reason).toBe('load_unknown');
    expect(loadsAreComparable(
      { recorded: true, value: 5, mode: 'total', provenance: 'replicated' },
      { recorded: true, value: 10, mode: 'total', provenance: 'entered' }
    ).reason).toBe('reconstructed_load');
  });

  it('lit une charge saisie en texte et refuse par bras contre total', () => {
    const sets = { sets: [{ reps: 5 }, { reps: 5 }, { reps: 5 }, { reps: 5 }] };
    const snapshot = {
      exerciseDisplayNames: { '12': 'Dips', '14': 'Curl' },
      checkedExercises: {
        '2026-11-16_12': true,
        '2026-11-18_12': true,
        '2026-11-16_14': true,
        '2026-11-18_14': true
      },
      reps: {
        '2026-11-16_12': 20,
        '2026-11-18_12': 20,
        '2026-11-16_14': 20,
        '2026-11-18_14': 20
      },
      exerciseWeights: {
        '2026-11-16_12': '5',
        '2026-11-18_12': '10',
        '2026-11-16_14': '5',
        '2026-11-18_14': '10'
      },
      exerciseWeightPerArm: { '2026-11-16_14': true },
      exerciseSetLogs: {
        '2026-11-16_12': sets,
        '2026-11-18_12': sets,
        '2026-11-16_14': sets,
        '2026-11-18_14': sets
      }
    };
    const work = buildSessionWorkProfiles(snapshot, { start: '2026-11-16', end: '2026-11-18' });
    const rises = collectResistanceProgressions(work.days);
    expect(rises.map((row) => row.exerciseId)).toEqual(['12']);
    expect(rises[0].fromValue).toBe(5);
    expect(rises[0].toValue).toBe(10);
    expect(rises[0].mode).toBe('total');
    expect(resolveAnalysisFamily({ kind: 'resistance_progression', family: 'exercise_progress' })).toBe('exercise');
    expect(resolveAnalysisFamily({ kind: 'session_work_comparison', family: 'session_demand' })).toBe('volume');
  });
});

describe('exercices historiques orphelins', () => {
  it('garde les répétitions orphelines dans le total et hors des sujets identifiés', () => {
    const snapshot = { exerciseDisplayNames: { '12': 'Dips' } };
    expect(isHistoricalOrphan(snapshot, '12', () => 'Dips')).toBe(false);
    expect(isHistoricalOrphan(snapshot, '77780789', () => null)).toBe(true);
    const coverage = summarizeRepCoverage(
      { '12': 40, '77780789': 15 },
      snapshot,
      (id) => (String(id) === '12' ? 'Dips' : null)
    );
    expect(coverage.totalReps).toBe(55);
    expect(coverage.identifiedReps).toBe(40);
    expect(coverage.orphanReps).toBe(15);
  });
});

describe('décomposition publiée et capture DOM', () => {
  it('écrit la contribution en répétitions dans la carte de volume réellement produite', () => {
    const byDate = new Map([
      ['2026-11-16', { reps: 100, exercises: new Map([['dips', 100]]) }],
      ['2026-11-17', { reps: 100, exercises: new Map([['dips', 100]]) }],
      ['2026-11-18', { reps: 180, exercises: new Map([['dips', 180]]) }],
      ['2026-11-19', { reps: 180, exercises: new Map([['dips', 180]]) }]
    ]);
    const card = evaluateVolumeChange({
      win: { start: '2026-11-18', end: '2026-11-19' },
      spanDays: 2,
      dates: ['2026-11-18', '2026-11-19'],
      byDate,
      exercises: new Map([['dips', { id: 'dips', name: 'Dips' }]]),
      snapshot: { exerciseDisplayNames: { dips: 'Dips' } }
    });
    expect(card.body).toMatch(/fréquence contribue/);
    expect(card.body).toMatch(/Dips/);
  });

  it('refuse de déclarer comparable une capture dont la période rendue n’est pas celle du diagnostic', () => {
    const diff = compareDomToPack(
      { meta: { period: '30d', dataSignature: 'sig-30' }, registry: [], candidates: [] },
      {
        renderedPeriod: '7d',
        cards: [{ title: '1334 répétitions', body: 'quatre séances' }],
        dataSignature: 'sig-30',
        source: 'dom_scrape'
      }
    );
    expect(diff.comparability).toBe('non_comparable');
    expect(diff.reason).toBe('period_mismatch');
  });
});

describe('identité canonique', () => {
  it('nomme un identifiant numérique résolu et exclut un libellé libre comme un faux nom', () => {
    const snapshot = { exerciseDisplayNames: { '603': 'Face pull', '999': 'Exercice #999' } };
    expect(classifyExerciseStanding(snapshot, '603').standing).toBe('identified');
    expect(classifyExerciseStanding(snapshot, '999').standing).toBe('historical_orphan');
    expect(classifyExerciseStanding(snapshot, 'ancien_libre').standing).toBe('historical_orphan');
    expect(classifyExerciseStanding({}, 'complementary_endurance_pushups').name).toMatch(/Pompes/);
  });

  it('lit le nom sur le programme sans table de correspondance', () => {
    const snapshot = {
      activeProgram: {
        schedule: {
          lundi: {
            exercises: [
              { id: 41, name: 'Dips' },
              { id: 42, name: 'Dips' }
            ]
          }
        }
      }
    };
    const first = classifyExerciseStanding(snapshot, '41');
    const second = classifyExerciseStanding(snapshot, '42');
    expect(first.standing).toBe('identified');
    expect(first.name).toBe('Dips');
    expect(second.standing).toBe('identified');
    expect(second.storageId).not.toBe(first.storageId);
    const conflicted = {
      activeProgram: {
        schedule: {
          lundi: {
            exercises: [
              { id: 41, name: 'Dips' },
              { id: 41, name: 'Tractions' }
            ]
          }
        }
      }
    };
    expect(classifyExerciseStanding(conflicted, '41').standing).toBe('historical_orphan');
  });

  it('rattache le hash stable et l’id de stockage au nom du même objet', () => {
    const originalId = 'dup_exemple_geste';
    const hash = String(convertToStableNumericId(originalId));
    const snapshot = {
      activeProgram: {
        schedule: {
          lundi: { exercises: [{ id: originalId, name: 'Curl marteau' }] }
        }
      },
      calendarDayPlanSnapshots: {
        '2026-11-01': {
          exercises: [{ storageId: '88001', originalId: 'ligne_ancienne', name: 'Face pull' }]
        }
      }
    };
    expect(hash).not.toBe(originalId);
    expect(classifyExerciseStanding(snapshot, hash).name).toBe('Curl marteau');
    expect(classifyExerciseStanding(snapshot, '88001').name).toBe('Face pull');
  });
});

describe('comparaison utile', () => {
  it('laisse de côté un écart de deux répétitions et retient une différence de nature', () => {
    const days = [
      session({ date: '2026-11-11', reps: 426, recordedSetCount: 12, exercises: [{ movementNature: 'other', reps: 200 }] }),
      session({ date: '2026-11-08', reps: 424, recordedSetCount: 12, exercises: [{ movementNature: 'other', reps: 200 }] }),
      session({
        date: '2026-11-02',
        reps: 100,
        recordedSetCount: 15,
        resistanceRaises: 2,
        exercises: [
          { movementNature: 'polyarticular', reps: 40 },
          { movementNature: 'polyarticular', reps: 30 },
          { movementNature: 'polyarticular', reps: 30 }
        ]
      }),
      session({
        date: '2026-11-03',
        reps: 200,
        recordedSetCount: 13,
        exercises: [
          { movementNature: 'localized', reps: 80 },
          { movementNature: 'localized', reps: 70 },
          { movementNature: 'localized', reps: 50 }
        ]
      })
    ];
    const choice = chooseSessionComparison(days);
    expect(choice.chosen.comparison.outcome).toBe(COMPARISON_OUTCOME.DIFFERENT_NATURE);
    expect([choice.chosen.a.date, choice.chosen.b.date].sort()).toEqual(['2026-11-02', '2026-11-03']);
    expect(choice.skippedNearTies).toBeGreaterThan(0);
  });

  it('fait arbitrer un objectif de résistance documenté', () => {
    const result = compareSessionWork(
      session({ reps: 80, recordedSetCount: 12, resistanceRaises: 2, exercises: [] }),
      session({ reps: 140, recordedSetCount: 12, resistanceRaises: 0, exercises: [] }),
      { goal: { dimension: 'resistance', label: 'charges' } }
    );
    expect(result.outcome).toBe(COMPARISON_OUTCOME.GOAL_CONDITIONED);
    expect(result.claim).toMatch(/résistance/);
    expect(result.claim).not.toMatch(/fatig|hypertroph/i);
  });
});

describe('abondance sans plafond d’admission', () => {
  function distinctCard(index) {
    return {
      kind: 'disc_exercise_progress',
      nature: 'trajectory',
      family: `exercise_${index}`,
      score: 80,
      title: `Progression distincte ${index}`,
      body: `Le mouvement ${index} change de format sur son propre historique.`,
      metrics: { exerciseId: `exo-${index}`, exerciseName: `Mouvement ${index}` }
    };
  }

  it('rend accessibles 50 conclusions distinctes même si la priorité est plafonnée', () => {
    const pack = Array.from({ length: 50 }, (_, index) => distinctCard(index + 1));
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    const catalog = accessibleDiscoveryCatalog(traced);
    expect(catalog.accessible.length).toBe(50);
    expect(catalog.priority.length).toBeLessThan(50);
  });

  it('réduit 48 formulations d’une même thèse à une conclusion accessible', () => {
    const pack = Array.from({ length: 48 }, (_, index) => ({
      kind: index % 2 === 0 ? 'disc_volume_shape' : 'disc_density',
      nature: 'now',
      family: 'volume_shape',
      score: 70,
      title: `Même constat ${index}`,
      body: 'Le volume de la fenêtre est décrit une fois.',
      metrics: { exerciseId: 'same-subject', exerciseName: 'Dips' }
    }));
    const catalog = accessibleDiscoveryCatalog(selectPeriodDiscoveriesWithTrace(pack, null, 'week'));
    const subjects = new Set(catalog.accessible.map((row) => row.metrics?.exerciseId || row.kind));
    expect(subjects.size).toBeLessThanOrEqual(8);
    expect(catalog.accessible.length).toBeLessThanOrEqual(8);
  });
});

describe('pipeline et mois complets', () => {
  it('n’additionne pas la durée du parent et de ses enfants', () => {
    const summary = buildPipelineSummary([
      { id: 'adaptive', ms: 3000, inCount: 19, outCount: 11 },
      { id: 'validate', ms: 400, inCount: 26, outCount: 24 },
      { id: 'select', ms: 200, inCount: 24, outCount: 13 }
    ]);
    expect(summary.totalMs).toBe(3000);
    expect(summary.inclusiveMs).toBe(3600);
    expect(summary.totalDropped).toBe(8);
  });

  it('ne marque pas juin comme une portion lorsque le mois est entier dans la fenêtre', () => {
    const months = bestCalendarMonths(
      { '2026-06-02': 100, '2026-06-18': 80 },
      { start: '2026-05-19', end: '2026-11-19' }
    );
    expect(months.find((row) => row.ym === '2026-06').partial).toBe(false);
    const clipped = bestCalendarMonths(
      { '2026-05-20': 40 },
      { start: '2026-05-19', end: '2026-11-19' }
    );
    expect(clipped.find((row) => row.ym === '2026-05').partial).toBe(true);
  });
});
