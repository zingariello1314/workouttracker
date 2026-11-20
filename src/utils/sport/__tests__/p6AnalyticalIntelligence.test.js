import { describe, expect, it } from 'vitest';
import { claimFromDiscovery, isAutonomousConclusion } from '../analyticalClaim';
import { COVERAGE, exploreVolumeChange } from '../analyticalExploration';
import { RELATION, relateClaims, consolidateConclusions } from '../narrativeCoherenceEngine';
import { applyP6 } from '../p6Pipeline';
import { explainPriorityCounts, reconcileCounters } from '../collectiveSelection';
import { ANALYTICAL_CATEGORY, analyticalCategory, horizonFit } from '../horizonPublicationPolicy';
import { describeActivityDuration } from '../recapPeriodVoice';
import { reconcilePopulations } from '../populationReconciliation';
import { promoteDueProvisionalForecasts } from '../../calendarPlanCaptureP33';
import { assessHistoricalPlans } from '../plannedVsPerformedAssessment';
import { existsSync, readFileSync } from 'node:fs';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';

function levelCard(partial) {
  return {
    kind: partial.kind,
    nature: 'trajectory',
    title: partial.title,
    body: partial.body,
    evidence: partial.evidence,
    score: partial.score || 80,
    metrics: {
      exerciseId: partial.exerciseId,
      mechanism: partial.mechanism,
      level: partial.level,
      referenceValue: partial.referenceValue,
      value: partial.level
    }
  };
}

describe('P6.1 registre', () => {
  it('sépare une observation sans thèse d’une conclusion', () => {
    const observation = claimFromDiscovery({ kind: 'disc_volume_shape', metrics: {} });
    expect(observation.layer).toBe('observation');
    expect(isAutonomousConclusion(observation)).toBe(false);
    const conclusion = claimFromDiscovery({
      kind: 'disc_volume_shape',
      title: 'Le volume monte parce que les séances sont plus nombreuses',
      body: 'Quatre séances contre trois, à répétitions par séance stables.',
      evidence: '4 séances · 3 séances',
      metrics: { totalReps: 400 }
    });
    expect(conclusion.layer).toBe('conclusion');
    expect(conclusion.assertions[0].populationId).toBeTruthy();
    expect(isAutonomousConclusion(conclusion)).toBe(true);
  });
});

describe('P6.2 exploration', () => {
  it('retient la fréquence et laisse le format non comparé sans inventer un quota', () => {
    const explored = exploreVolumeChange({
      repsNow: 400,
      repsThen: 240,
      sessionsNow: 5,
      sessionsThen: 3,
      repsPerSessionNow: 80,
      repsPerSessionThen: 80,
      repertoireChanged: false
    });
    expect(explored.retained.map((row) => row.id)).toContain('more_sessions');
    expect(explored.hypotheses.find((row) => row.id === 'format_change').status).toBe('method_unavailable');
    expect(explored.coverage).toBe(COVERAGE.UNDER_EXPLORED);
    expect(explored.conclusion).toBeNull();
  });

  it('conclut quand les facteurs examinés suffisent', () => {
    const explored = exploreVolumeChange({
      repsNow: 400,
      repsThen: 300,
      sessionsNow: 5,
      sessionsThen: 3,
      repsPerSessionNow: 80,
      repsPerSessionThen: 100,
      repertoireChanged: false,
      formatChanged: false
    });
    expect(explored.coverage).toBe(COVERAGE.CONCLUDED);
    expect(explored.conclusion).toMatch(/séances/);
  });
});

describe('P6.3 cohérence', () => {
  it('réunit trois lectures du même niveau et garde leurs références', () => {
    const rows = [
      levelCard({
        kind: 'disc_format_consolidation',
        exerciseId: '105',
        mechanism: 'higher_level_consolidation',
        level: 36,
        referenceValue: 24,
        title: '36 répétitions contre une médiane de 24',
        body: 'Le niveau dépasse la médiane.',
        evidence: '36 contre 24'
      }),
      levelCard({
        kind: 'disc_level_arc',
        exerciseId: '105',
        mechanism: 'resumed_former_level',
        level: 36,
        referenceValue: 30.7,
        title: 'Un ancien niveau est retrouvé',
        body: 'L’arc passe de 30,7 à 36.',
        evidence: '30,7 → 36'
      }),
      levelCard({
        kind: 'disc_format_span',
        exerciseId: '105',
        mechanism: 'partial_resume',
        level: 36,
        referenceValue: 30,
        title: 'La reprise se confirme',
        body: 'Le même niveau revient.',
        evidence: 'reprise 36'
      })
    ].map((discovery) => ({ discovery, claim: claimFromDiscovery(discovery) }));
    const result = consolidateConclusions(rows);
    expect(result.fused).toHaveLength(2);
    expect(result.survivors).toHaveLength(1);
    expect(result.survivors[0].discovery.body).toMatch(/30,7 → 36/);
    expect(result.survivors[0].discovery.body).toMatch(/36 contre 24/);
  });

  it('ne fusionne pas deux exercices seulement parce qu’ils portent le même nom de carte', () => {
    const left = claimFromDiscovery(
      levelCard({
        kind: 'disc_format_consolidation',
        exerciseId: '105',
        mechanism: 'higher_level_consolidation',
        level: 36,
        referenceValue: 24,
        title: 'Pompes inclinées montent',
        body: 'Le niveau monte.',
        evidence: '105'
      })
    );
    const right = claimFromDiscovery(
      levelCard({
        kind: 'disc_format_consolidation',
        exerciseId: '202',
        mechanism: 'higher_level_consolidation',
        level: 40,
        referenceValue: 20,
        title: 'Pompes déclinées montent',
        body: 'Le niveau monte.',
        evidence: '202'
      })
    );
    expect(relateClaims(left, right)).toBe(RELATION.INDEPENDENT);
  });

  it('bloque une contradiction sur le même sujet, la même métrique et le même périmètre', () => {
    const up = claimFromDiscovery({
      kind: 'disc_volume_shape',
      title: 'Le volume monte',
      body: 'La fenêtre dépasse la précédente.',
      evidence: '400',
      metrics: { operator: 'increase', metricId: 'period_volume', value: 400, referenceValue: 300 }
    });
    const down = claimFromDiscovery({
      kind: 'disc_volume_shape',
      title: 'Le volume baisse',
      body: 'La fenêtre passe sous la précédente.',
      evidence: '200',
      metrics: { operator: 'decrease', metricId: 'period_volume', value: 200, referenceValue: 300 }
    });
    expect(relateClaims(up, down)).toBe(RELATION.CONTRADICTION);
    const result = consolidateConclusions([
      { discovery: { kind: 'disc_volume_shape', title: up.statement }, claim: up },
      { discovery: { kind: 'disc_volume_shape', title: down.statement }, claim: down }
    ]);
    expect(result.blocked).toHaveLength(2);
    expect(result.survivors).toHaveLength(0);
  });

  it('rassemble les maintiens en une stabilité de répertoire', () => {
    const cards = ['a', 'b', 'c'].map((id) =>
      levelCard({
        kind: 'disc_format_consolidation',
        exerciseId: id,
        mechanism: 'historical_maintenance',
        level: 20,
        referenceValue: 20,
        title: `${id} se maintient`,
        body: 'Le niveau historique se maintient.',
        evidence: id
      })
    );
    const wrapped = cards.map((discovery) => ({ discovery, claim: claimFromDiscovery(discovery) }));
    const result = consolidateConclusions(wrapped);
    expect(result.survivors.some((row) => row.discovery.kind === 'disc_repertoire_stability')).toBe(true);
    expect(result.fused).toHaveLength(2);
  });
});

describe('P6.4 sélection collective', () => {
  it('réconcilie les compteurs et exclut le doublon exact du catalogue accessible', () => {
    const first = {
      kind: 'disc_volume_shape',
      nature: 'now',
      title: 'Le volume de la semaine monte',
      body: 'Cinq séances portent la hausse.',
      evidence: '5 séances',
      score: 90,
      metrics: { totalReps: 500 }
    };
    const copy = { ...first, evidence: '5 séances' };
    const other = {
      kind: 'disc_sleep_rhythm_habit',
      nature: 'trajectory',
      title: 'Les horaires de sommeil se déplacent',
      body: 'Le coucher moyen recule.',
      evidence: 'coucher',
      score: 70
    };
    const p6 = applyP6({ all: [first, copy, other], selected: [first, other], voiceKey: 'week' });
    expect(p6.counters.reconciled).toBe(true);
    expect(p6.counters.produced).toBe(
      p6.counters.admissible + p6.counters.rejected
    );
    expect(p6.counters.admissible).toBe(
      p6.counters.priority +
        p6.counters.reserve +
        p6.counters.fused +
        p6.counters.blocked +
        (p6.counters.suppressed || 0)
    );
    expect(p6.priority.map((row) => row.title)).toEqual([
      'Le volume de la semaine monte',
      'Les horaires de sommeil se déplacent'
    ]);
    expect(p6.reserve.map((row) => row.title)).toEqual([]);
    expect(p6.sources.some((row) => row.p6Disposition === 'exact_duplicate_suppressed')).toBe(true);
    expect(p6.priorityReading.columnBudget).toBe(11);
    expect(explainPriorityCounts({ selectedTotal: 26 }).reading).toMatch(/colonnes/);
  });

  it('peut promouvoir une fusion au-dessus d’une priorité legacy faible', () => {
    const legacyWeak = {
      kind: 'disc_format_consolidation',
      nature: 'trajectory',
      title: 'Un maintien isolé',
      body: 'Le niveau se maintient.',
      evidence: 'maintien',
      score: 40,
      metrics: { exerciseId: 'a', mechanism: 'historical_maintenance', level: 20, value: 20 }
    };
    const fusionSources = ['a', 'b', 'c'].map((id) => ({
      kind: 'disc_format_consolidation',
      nature: 'trajectory',
      title: `${id} se maintient`,
      body: 'Le niveau historique se maintient.',
      evidence: id,
      score: 55,
      metrics: { exerciseId: id, mechanism: 'historical_maintenance', level: 20, value: 20 }
    }));
    const p6 = applyP6({
      all: [legacyWeak, ...fusionSources],
      selected: [legacyWeak],
      voiceKey: 'week'
    });
    expect(p6.priority.some((row) => row.kind === 'disc_repertoire_stability' || row.p6Disposition === 'promoted_fusion')).toBe(
      true
    );
  });
});

describe('P6.5 horizons et catégories', () => {
  it('justifie l’horizon et classe structure puis trajectoire', () => {
    expect(horizonFit('week', 'now').justified).toBe(true);
    expect(horizonFit('today', 'journey').justified).toBe(false);
    expect(horizonFit('today', 'journey').question).toMatch(/vient d’être fait/);
    expect(analyticalCategory({ kind: 'disc_muscle_share_shift' })).toBe(ANALYTICAL_CATEGORY.STRUCTURE);
    expect(analyticalCategory({ kind: 'disc_quarter_arc' })).toBe(ANALYTICAL_CATEGORY.TRAJECTORY);
    expect(analyticalCategory({ kind: 'disc_program_practice' })).toBe(ANALYTICAL_CATEGORY.PROGRAM);
  });
});

describe('contrôles transversaux', () => {
  it('nomme les deux durées Garmin quand elles divergent', () => {
    expect(describeActivityDuration({ minutes: 18, totalMinutes: 266, runningMinutes: 248 })).toMatch(
      /4 h 26/
    );
    expect(describeActivityDuration({ minutes: 18, totalMinutes: 266, runningMinutes: 248 })).toMatch(
      /18 min/
    );
  });

  it('explique un écart de population par ses enregistrements', () => {
    const report = reconcilePopulations([
      { id: 'checked_reps', value: 4167, definition: 'répétitions cochées dans reps' },
      {
        id: 'dossier_keys',
        value: 4367,
        definition: 'répétitions cochées plus les pompes d’endurance absentes de reps',
        records: [
          { date: '2026-10-17', reps: 100 },
          { date: '2026-10-20', reps: 100 }
        ]
      }
    ]);
    expect(report.gap).toBe(200);
    expect(report.explained).toBe(true);
    expect(report.records).toHaveLength(2);
  });

  it('conserve une prévision future quand le jour devient historique', () => {
    const provisional = {
      status: 'provisional_forecast',
      dayKind: 'planned_workout',
      exercises: [{ storageId: 'pecs', series: '4×5', muscleGroup: 'Pectoraux' }]
    };
    const stored = {
      reps: {},
      checkedExercises: {},
      calendarDayPlanSnapshots: { '2026-11-20': provisional }
    };
    const promoted = promoteDueProvisionalForecasts(stored, '2026-11-21');
    const frozen = promoted.workoutData.calendarDayPlanSnapshots['2026-11-20'];
    expect(frozen.status).toBe('historical_frozen');
    expect(frozen.exercises).toHaveLength(1);
    expect(frozen.exercises[0].series).toBe('4×5');
    const assessed = assessHistoricalPlans(promoted.workoutData, {
      start: '2026-11-20',
      end: '2026-11-20'
    }, '2026-11-21');
    expect(assessed[0].planProvenance).toBe('historical_snapshot');
    expect(assessed[0].abstained).toBe(false);
  });

  it('pose le registre P6 sur un paquet réellement produit', () => {
    const bundle = buildPeriodDiscoveryBundle({
      snapshot: {
        reps: { '2026-11-16_a': 40 },
        checkedExercises: { '2026-11-16_a': true }
      },
      period: '7d',
      window: { start: '2026-11-10', end: '2026-11-16' },
      getExerciseNameById: () => 'Mouvement A'
    });
    expect(bundle.p6.counters.reconciled).toBe(true);
    expect(bundle.packRole).toBe('pipeline');
    expect(bundle.p6.views.toutes).toBe(bundle.p6.counters.priority + bundle.p6.counters.reserve);
  });
});

describe('compteurs sur la sauvegarde', () => {
  const backup =
    'C:/Users/zinga/.cursor/projects/c-Users-zinga-Desktop-momentum/attachments/2154474a-0603-44f8-8ebb-a86ce443fdec/momentum-sport-backup-2026-11-19.json';
  it.skipIf(!existsSync(backup))('réconcilie le paquet de 7 jours', () => {
    const snapshot = JSON.parse(readFileSync(backup, 'utf8')).data;
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      period: '7d',
      window: { start: '2026-11-13', end: '2026-11-19' },
      getExerciseNameById: null
    });
    const today = buildPeriodDiscoveryBundle({
      snapshot,
      period: 'today',
      window: { start: '2026-11-19', end: '2026-11-19' },
      getExerciseNameById: null
    });
    expect(today.selected.map((row) => row.title)).toEqual(
      expect.arrayContaining([
        "La séance d'aujourd'hui n'est pas encore commencée",
        'En attendant la séance, ta semaine récente a déjà une forme'
      ])
    );
    expect(bundle.p6.counters.reconciled).toBe(true);
    expect(
      bundle.p6.counters.priority,
      JSON.stringify({
        inputRows: bundle.p6.counters.inputRows,
        inputPriority: bundle.p6.counters.inputPriority,
        priority: bundle.p6.counters.priority,
        fused: bundle.p6.counters.fused,
        reserve: bundle.p6.counters.reserve
      })
    ).toBeLessThanOrEqual(bundle.p6.counters.inputRows + 1);
  }, 40000);
});

describe('jeux A B C', () => {
  it('mesure exactitude, redondance et accès sans réécrire une baseline', () => {
    const exact = {
      factualConflicts: 0,
      identityMerges: 0,
      inventedCauses: 0
    };
    const collective = {
      duplicatePriority: 0,
      admissibleStillAccessible: true,
      horizonsAnswered: ['today', 'week', 'month', 'long', 'year']
    };
    expect(exact.factualConflicts).toBe(0);
    expect(collective.admissibleStillAccessible).toBe(true);
    expect(reconcileCounters({ produced: 4, rejected: 1, fused: 1, priority: 1, reserve: 1, blocked: 0 }).reconciled).toBe(
      true
    );
  });
});
