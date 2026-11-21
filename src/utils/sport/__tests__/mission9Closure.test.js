/**
 * Mission 9 — preuves, doublons différenciés, contrôles A/B.
 */
import { describe, expect, it } from 'vitest';
import { claimFromDiscovery } from '../analyticalClaim';
import { analysisEditionKey } from '../analysisEdition';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';
import { runGameBDiscoveryQuality } from '../evaluation/gameBDiscoveryQuality';
import { structureGameBReport } from '../evaluation/structuredEvalReports';
import { exploreCollectiveReturn, COVERAGE } from '../analyticalExploration';
import { buildExerciseMuscleIndex, habitualCadenceFromDates } from '../analyticalExploration';
import { buildMultidimensionalAdherence, PLAN_PROVENANCE } from '../multidimensionalAdherence';
import { composeStructuralProgramDiscoveries } from '../structuralProgramDiscoveries';
import { selectCollectively, acknowledgeIdenticalCoverage, PRIORITY_COLUMN_BUDGET } from '../collectiveSelection';
import { buildConclusionHierarchyView, CONCLUSION_ROLE } from '../conclusionHierarchyContract';

describe('Mission 9 — clôture P6 partielle', () => {
  it('édition ≥ v8 (fondations Mission 9)', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v(?:[89]|10)/);
    expect(analysisEditionKey()).toMatch(/claim=proof-pipeline-v[23]/);
  });

  it('claim porte les preuves numériques depuis metrics.observedValues (pas depuis le texte)', () => {
    const discovery = {
      kind: 'disc_th_concentration_now',
      title: 'Le 13 novembre porte une grande part',
      body: 'Le 13 novembre concentre 400 répétitions, soit 35 % des 1140.',
      evidence: 'peak',
      metrics: {
        factId: 'peak|13 novembre|7d',
        peakReps: 400,
        sharePct: 35,
        totalReps: 1140,
        observedValues: [
          { id: 'peakReps', value: 400, unit: 'reps' },
          { id: 'sharePct', value: 35, unit: 'percent' },
          { id: 'windowReps', value: 1140, unit: 'reps' }
        ]
      }
    };
    const claim = claimFromDiscovery(discovery, { start: '2026-11-13', end: '2026-11-19' });
    expect(claim.proof.observedValues.length).toBeGreaterThanOrEqual(3);
    expect(claim.proof.observedValues.find((v) => v.id === 'peakReps')?.value).toBe(400);
    expect(claim.proof.units).toContain('reps');
  });

  it('jeu A : preuve incorrecte détectée même si claim rempli', () => {
    const card = {
      id: 'c1',
      title: 'Test',
      body: 'x',
      disposition: 'priority',
      claim: {
        id: 'c1',
        proof: { observedValues: [{ id: 'peakReps', value: 999, unit: 'reps' }], sourceEvents: [] },
        assertions: [],
        population: { id: 'recorded_activity' }
      }
    };
    const report = runGameAAccuracy({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] },
      referenceFacts: {
        expectedProofs: [{ cardId: 'c1', values: [{ id: 'peakReps', value: 400 }] }]
      }
    });
    expect(report.pass).toBe(false);
    expect(report.cases.some((c) => c.issue === 'proof_value_mismatch')).toBe(true);
  });

  it('jeu A : population différente détectée', () => {
    const card = {
      id: 'c2',
      title: 'Pop',
      body: 'y',
      disposition: 'priority',
      claim: {
        id: 'c2',
        proof: { observedValues: [{ id: 'x', value: 1, unit: 'reps' }], sourceEvents: [] },
        assertions: [{ value: 1 }],
        population: { id: 'challenge_only' }
      }
    };
    const report = runGameAAccuracy({
      insights: { shortTerm: [card], mediumTerm: [], longTerm: [], accessibleReserve: [] },
      referenceFacts: {
        expectedProofs: [{ cardId: 'c2', populationId: 'recorded_activity', values: [] }]
      }
    });
    expect(report.cases.some((c) => c.issue === 'population_mismatch')).toBe(true);
  });

  it('homonymes format : titres distincts par historique, sans mention technique', () => {
    const a = {
      kind: 'disc_format_consolidation',
      title: 'Relevés de genoux à la barre (ligne vue jusqu’au 2026-11-10) : un ancien niveau est retrouvé',
      body: 'Cette trajectoire (stockage distinct) s’appuie notamment sur les séances du 2026-10-01 au 2026-11-10. Sur ces 7 jours…'
    };
    const b = {
      kind: 'disc_format_consolidation',
      title: 'Relevés de genoux à la barre (ligne vue jusqu’au 2026-09-20) : un ancien niveau est retrouvé',
      body: 'Cette trajectoire (stockage distinct) s’appuie notamment sur les séances du 2026-08-01 au 2026-09-20. Sur ces 7 jours…'
    };
    expect(a.title).not.toEqual(b.title);
    expect(a.title + a.body).not.toMatch(/homonyme non fusionné/i);
    expect(b.title + b.body).not.toMatch(/homonyme non fusionné/i);
  });

  it('jeu B : négation « pas une preuve de force maximale » n’est pas un FAIL physiologique', () => {
    const report = runGameBDiscoveryQuality({
      insights: {
        shortTerm: [
          {
            id: 'chal',
            title: 'Même format 5x20',
            body: 'Le volume et le format restent constants : la découverte porte sur le temps enregistré, pas sur une force maximale ni une hypertrophie.',
            claim: { proof: { observedValues: [{ id: 't', value: 1, unit: 'minutes' }] } }
          }
        ],
        mediumTerm: [],
        longTerm: [],
        accessibleReserve: []
      }
    });
    expect(report.cases.some((c) => c.result === 'unsupported_physiology')).toBe(false);
  });

  it('jeu B structuré : hit_abstain et scored ne sont pas FAIL', () => {
    const structured = structureGameBReport({
      pass: true,
      referenceHits: 6,
      incorrectAttractive: 0,
      superficialOnly: 0,
      cases: [
        { id: 'collective_returns_simultaneous_unlinked', result: 'hit_abstain', referenceKind: 'synthetic' },
        { id: 'mission7_quality_dimensions', result: 'scored', dimensions: {} }
      ]
    });
    expect(structured.cases.find((c) => c.id === 'collective_returns_simultaneous_unlinked')?.status).toBe(
      'pass'
    );
    expect(structured.cases.find((c) => c.id === 'mission7_quality_dimensions')?.status).toBe('partial');
  });

  it('collectif : cadence habituelle — gap court pour mouvement hebdo ≠ retour forcé', () => {
    const weekly = exploreCollectiveReturn(
      [
        { name: 'A', date: '2026-11-10', exerciseId: 1, family: 'dos', gapDays: 16, habitualGapDays: 14 },
        { name: 'B', date: '2026-11-11', exerciseId: 2, family: 'dos', gapDays: 15, habitualGapDays: 14 },
        { name: 'C', date: '2026-11-12', exerciseId: 3, family: 'dos', gapDays: 18, habitualGapDays: 14 }
      ],
      {}
    );
    // Cadence ~14 j : une absence de 15–18 j n’est pas encore un retour collectif
    expect(weekly.coverage).toBe(COVERAGE.UNDER_EXPLORED);

    const linked = exploreCollectiveReturn(
      [
        { name: 'A', date: '2026-11-10', exerciseId: 1, family: 'dos', gapDays: 35, habitualGapDays: 14 },
        { name: 'B', date: '2026-11-11', exerciseId: 2, family: 'dos', gapDays: 40, habitualGapDays: 14 },
        { name: 'C', date: '2026-11-12', exerciseId: 3, family: 'dos', gapDays: 28, habitualGapDays: 14 }
      ],
      {}
    );
    expect(linked.coverage).toBe(COVERAGE.CONCLUDED);
  });
});

// ---------------------------------------------------------------------------
// Mission 9 — approfondissements (adhérence longitudinale, retours collectifs, horizons)
// ---------------------------------------------------------------------------

const planned = [
  { id: '1', plannedReps: 300, muscleGroup: 'jambes' },
  { id: '2', plannedReps: 100, muscleGroup: 'pectoraux' },
  { id: '3', plannedReps: 100, muscleGroup: 'biceps' }
];
const fullDay = [
  { id: '1', reps: 300 },
  { id: '2', reps: 100 },
  { id: '3', reps: 100 }
];
const withoutLegs = [
  { id: '2', reps: 100 },
  { id: '3', reps: 100 }
];
const assessmentOf = (date, performed) =>
  buildMultidimensionalAdherence({
    date,
    planProvenance: PLAN_PROVENANCE.HISTORICAL,
    dayStatus: 'closed',
    sessionStatus: 'finished',
    planned,
    performed
  }).assessment;

describe('Mission 9 — adhérence longitudinale : omission récurrente vs exceptionnelle', () => {
  it('omission récurrente : dates, comptes, composantes conservées et manquante', () => {
    const dates = ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22'];
    const assessments = [
      assessmentOf(dates[0], withoutLegs),
      assessmentOf(dates[1], fullDay),
      assessmentOf(dates[2], withoutLegs),
      assessmentOf(dates[3], withoutLegs)
    ];
    const { discoveries, omissionCtx } = composeStructuralProgramDiscoveries({
      voiceKey: 'month',
      assessments
    });
    const row = omissionCtx.byGroup.find((r) => r.group === 'jambes');
    expect(row.count).toBe(3);
    expect(row.recurrence).toBe('recurrent');
    expect(row.days).toEqual(['2026-10-01', '2026-10-15', '2026-10-22']);
    expect(row.maxConsecutive).toBe(2);
    expect(row.conservedComponents.map((c) => c.group).sort()).toEqual(['biceps', 'pectoraux']);

    const card = discoveries.find((d) => d.kind === 'disc_adherence_targeted_omission');
    expect(card).toBeTruthy();
    expect(card.body).toMatch(/récurrente/);
    expect(card.body).toMatch(/jambes manque 3 fois/);
    expect(card.body).toMatch(/2026-10-15/);
    expect(card.body).toMatch(/pectoraux/);
    expect(card.body).toMatch(/biceps/);
    expect(card.metrics.recurrence).toBe('recurrent');
    expect(card.metrics.missingComponent).toBe('jambes');
    expect(card.metrics.conservedComponents).toEqual(expect.arrayContaining(['pectoraux', 'biceps']));
    expect(card.metrics.omissionDates).toHaveLength(3);
    // P6 descriptif : ni physiologie ni conseil
    expect(card.body).not.toMatch(/récupération|hypertrophie|il faut|tu devrais/i);
    expect(card.body).toMatch(/aucune intention/); // la fatigue n’est citée que pour être écartée
  });

  it('omission exceptionnelle : une seule absence, réalisée les autres fois', () => {
    const assessments = [
      assessmentOf('2026-10-01', fullDay),
      assessmentOf('2026-10-08', fullDay),
      assessmentOf('2026-10-15', fullDay),
      assessmentOf('2026-10-22', withoutLegs)
    ];
    const { discoveries, omissionCtx } = composeStructuralProgramDiscoveries({
      voiceKey: 'month',
      assessments
    });
    const row = omissionCtx.byGroup.find((r) => r.group === 'jambes');
    expect(row.recurrence).toBe('exceptional');
    expect(row.presentDays).toHaveLength(3);
    const card = discoveries.find((d) => d.kind === 'disc_adherence_targeted_omission');
    expect(card.body).toMatch(/exceptionnelle/);
    expect(card.body).toMatch(/2026-10-22/);
    expect(card.body).not.toMatch(/est récurrente/);
    expect(omissionCtx.recurring).toHaveLength(0);
  });
});

describe('Mission 9 — retours collectifs : muscle du catalogue + cadence habituelle', () => {
  const base = [
    { name: 'Face pull', date: '2026-11-10', exerciseId: 1, gapDays: 30 },
    { name: 'Élévations', date: '2026-11-11', exerciseId: 2, gapDays: 28 },
    { name: 'Arnold', date: '2026-11-12', exerciseId: 3, gapDays: 35 }
  ];

  it('non lié sans muscle documenté ; lié quand le catalogue fournit le muscle', () => {
    const unlinked = exploreCollectiveReturn(base);
    expect(unlinked.coverage).toBe(COVERAGE.UNDER_EXPLORED);
    expect(unlinked.conclusion).toMatch(/simultanéité seule/);

    const index = buildExerciseMuscleIndex([
      { id: 1, name: 'Face pull', muscleGroup: 'épaules' },
      { id: 2, name: 'Élévations', muscleGroup: 'épaules' },
      { id: 3, name: 'Arnold', muscleGroup: 'épaules' }
    ]);
    const linked = exploreCollectiveReturn(base, { muscleByExercise: index });
    expect(linked.coverage).toBe(COVERAGE.CONCLUDED);
    expect(linked.namedMoves.every((m) => m.muscleGroup === 'épaules')).toBe(true);
  });

  it('la taxonomie éditoriale n’entre jamais dans la famille musculaire', () => {
    const index = buildExerciseMuscleIndex([{ id: 1, name: 'Face pull', muscleGroup: 'emergence' }]);
    expect(index.size).toBe(0);
    const taxonomy = exploreCollectiveReturn(
      base.map((r) => ({ ...r, family: 'repertoire' })),
      {}
    );
    expect(taxonomy.coverage).toBe(COVERAGE.UNDER_EXPLORED);
    expect((taxonomy.namedMoves || []).every((m) => m.muscleGroup === null && m.family === null)).toBe(true);
  });

  it('cadence habituelle longue : 30 j d’absence ne sont pas un retour', () => {
    const index = buildExerciseMuscleIndex(
      base.map((r) => ({ id: r.exerciseId, name: r.name, muscleGroup: 'épaules' }))
    );
    const monthlyHabit = exploreCollectiveReturn(
      base.map((r) => ({ ...r, habitualGapDays: 28 })),
      { muscleByExercise: index }
    );
    expect(monthlyHabit.coverage).toBe(COVERAGE.UNDER_EXPLORED);

    const weeklyHabit = exploreCollectiveReturn(
      base.map((r) => ({ ...r, habitualGapDays: 7 })),
      { muscleByExercise: index }
    );
    expect(weeklyHabit.coverage).toBe(COVERAGE.CONCLUDED);
    expect(weeklyHabit.conclusion).toMatch(/cadence/);
    expect(weeklyHabit.namedMoves[0].gapVsCadence).toBeGreaterThan(3);
  });

  it('cadence déduite de l’historique de dates (≥ 3 intervalles hors interruption)', () => {
    const dates = ['2026-08-01', '2026-08-08', '2026-08-15', '2026-08-22', '2026-10-01'];
    expect(habitualCadenceFromDates(dates, { excludeGapDays: 40 })).toBe(7);
    expect(habitualCadenceFromDates(['2026-08-01', '2026-08-08'])).toBeNull();
  });
});

describe('Mission 9 — horizons : structure majeure et plafond souple', () => {
  const horizonFit = { justified: true, voiceKey: 'year', angle: 'primary' };
  const mk = (kind, i, value, extra = {}) => ({
    discovery: {
      kind,
      title: `${kind} ${i}`,
      body: 'x',
      informativeValue: value,
      weights: { importance: 0.5 },
      horizonFit,
      ...extra
    },
    claim: { id: `${kind}-${i}`, assertions: [{ subjectId: `ex:${kind}:${i}`, metricId: 'm', operator: 'stable' }] },
    wasPriority: false
  });

  it('année : arc mensuel / structure devant les émergences individuelles', () => {
    const rows = [
      ...Array.from({ length: 8 }, (_, i) => mk('disc_emergence', i, 58)),
      mk('disc_monthly_volume_arc', 0, 45),
      mk('disc_session_family_structure', 0, 44),
      mk('disc_adherence_recurring_omission', 0, 42)
    ];
    const out = selectCollectively(rows, { voiceKey: 'year' });
    const kinds = out.priority.map((r) => r.discovery.kind);
    expect(kinds).toEqual(
      expect.arrayContaining([
        'disc_monthly_volume_arc',
        'disc_session_family_structure',
        'disc_adherence_recurring_omission'
      ])
    );
    expect(out.priority.length).toBeLessThan(PRIORITY_COLUMN_BUDGET);
    expect(kinds.filter((k) => k === 'disc_emergence').length).toBeLessThanOrEqual(1);
    const secondary = out.reserve.filter((r) => r.discovery.kind === 'disc_emergence');
    expect(secondary.length).toBeGreaterThanOrEqual(7);
    expect(secondary.every((r) => /secondary_to_structure|family_cap_reserve/.test(r.p6Disposition))).toBe(true);
  });

  it('soft-cap : une structure majeure dans le pool gouverne même si l’émergence passe en premier', () => {
    const rows = [mk('disc_emergence', 0, 90), mk('disc_monthly_volume_arc', 0, 20)];
    const out = selectCollectively(rows, { voiceKey: 'all' });
    expect(out.priority.some((r) => r.discovery.kind === 'disc_monthly_volume_arc')).toBe(true);
  });

  it('2y/all : reconnaît une couverture identique à 1y sans fausse nouveauté', () => {
    const ack = acknowledgeIdenticalCoverage({
      period: '2y',
      referencePeriod: '1y',
      coverageStart: '2025-12-01',
      referenceCoverageStart: '2025-12-01',
      coverageEnd: '2026-11-21',
      referenceCoverageEnd: '2026-11-21'
    });
    expect(ack.identical).toBe(true);
    expect(ack.noveltyAllowed).toBe(false);
    expect(ack.reading).toMatch(/mêmes données/);
    const out = selectCollectively([mk('disc_monthly_volume_arc', 0, 45)], { voiceKey: 'year', coverage: ack });
    expect(out.horizonDifferentiation).toBe('identical_coverage_no_novelty');

    const distinct = acknowledgeIdenticalCoverage({
      period: '2y',
      referencePeriod: '1y',
      coverageStart: '2024-12-01',
      referenceCoverageStart: '2025-12-01',
      coverageEnd: '2026-11-21',
      referenceCoverageEnd: '2026-11-21'
    });
    expect(distinct.identical).toBe(false);
    expect(distinct.reading).toBeNull();
  });

  it('hiérarchie : deepening_of_collective et secondary restent hors priorité', () => {
    const rows = [
      { ...mk('disc_collective_return', 0, 60), p6Disposition: 'consolidated' },
      { ...mk('disc_ms_return', 1, 80), p6Disposition: 'deepening_of_collective' },
      { ...mk('disc_ms_return', 2, 80), p6Disposition: 'secondary_autonomous' }
    ];
    const out = selectCollectively(rows, { voiceKey: 'month' });
    expect(out.priority.map((r) => r.p6Disposition)).not.toContain('deepening_of_collective');
    expect(out.priority.some((r) => /^secondary/.test(r.p6Disposition))).toBe(false);
    expect(out.reserve.some((r) => r.p6Disposition === 'deepening_of_collective')).toBe(true);

    // Garde-fou même si une ligne mal classée arrive dans `priority`
    const view = buildConclusionHierarchyView({
      priority: [
        rows[0],
        { ...rows[1], discovery: { ...rows[1].discovery, id: 'leak-d' } },
        { ...rows[2], discovery: { ...rows[2].discovery, id: 'leak-s' } }
      ],
      reserve: []
    });
    expect(view.principals).toHaveLength(1);
    expect(view.deepenings.some((r) => r.id === 'leak-d')).toBe(true);
    expect(view.complementary.find((r) => r.id === 'leak-s')?.role).toBe(CONCLUSION_ROLE.COMPLEMENTARY);
  });
});

