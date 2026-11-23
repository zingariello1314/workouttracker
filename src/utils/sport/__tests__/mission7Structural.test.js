import { describe, expect, it } from 'vitest';
import {
  buildProgramSessionGraph,
  relateSessionTemplates,
  extractSessionTemplates
} from '../sessionStructureGraph';
import {
  adherenceVectorFromAssessment,
  buildMultidimensionalAdherence,
  contextualizeOmissionsAcrossDays
} from '../multidimensionalAdherence';
import { PLAN_PROVENANCE } from '../plannedVsPerformedAssessment';
import { composeStructuralProgramDiscoveries } from '../structuralProgramDiscoveries';
import { substantiveEquivalence, stampDiscoveryIdentity } from '../discoveryIdentity';
import { runGameCCollective } from '../evaluation/gameCCollective';
import { claimFromDiscovery } from '../analyticalClaim';
import { analysisEditionKey } from '../analysisEdition';

function abcProgram() {
  return {
    schedule: {
      monday: {
        name: 'Séance A',
        active: true,
        exercises: [
          { id: 1, name: 'Pompes déclinées', sets: 3, reps: 12, muscleGroup: 'pectoraux' },
          { id: 2, name: 'Pompes inclinées', sets: 3, reps: 12, muscleGroup: 'pectoraux' },
          { id: 3, name: 'Squat', sets: 4, reps: 10, muscleGroup: 'jambes' }
        ]
      },
      friday: {
        name: 'Séance A′',
        active: true,
        exercises: [
          { id: 1, name: 'Pompes déclinées', sets: 5, reps: 10, muscleGroup: 'pectoraux' },
          { id: 3, name: 'Squat', sets: 4, reps: 10, muscleGroup: 'jambes' }
        ]
      },
      tuesday: {
        name: 'Séance B',
        active: true,
        exercises: [
          { id: 10, name: 'Tractions', sets: 4, reps: 8, muscleGroup: 'dos' },
          { id: 11, name: 'Row', sets: 3, reps: 10, muscleGroup: 'dos' }
        ]
      },
      saturday: {
        name: 'Séance B′',
        active: true,
        exercises: [
          { id: 10, name: 'Tractions', sets: 5, reps: 6, muscleGroup: 'dos' },
          { id: 12, name: 'Face pull', sets: 3, reps: 15, muscleGroup: 'épaules' }
        ]
      }
    }
  };
}

describe('Mission 7 — structure programme et adhérence', () => {
  it('édition ≥ v7 raisonnement structurel', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v(?:[789]|[1-9]\d*)/);
    expect(analysisEditionKey()).toMatch(/program=structural-(?:reasoning|execution|context)-v\d+/);
    expect(analysisEditionKey()).toMatch(/review=collective-pass4-v\d+/);
  });

  it('détecte des familles de séances sans règle lundi=vendredi', () => {
    const graph = buildProgramSessionGraph(abcProgram());
    expect(graph.available).toBe(true);
    expect(graph.relations.some((r) => r.type === 'session_variant' || r.type === 'similar_session')).toBe(
      true
    );
    const aFamily = graph.families.find((f) => f.members.includes('monday') && f.members.includes('friday'));
    expect(aFamily).toBeTruthy();
    // Contre-exemple : B et B′ liés par mouvement commun, pas forcément même famille forcée
    const relAB = graph.relations.find(
      (r) =>
        (r.left.dayKey === 'monday' && r.right.dayKey === 'tuesday') ||
        (r.left.dayKey === 'tuesday' && r.right.dayKey === 'monday')
    );
    expect(!relAB || relAB.type !== 'similar_session').toBe(true);
  });

  it('généralise : autres jours / autres ids produisent la même logique', () => {
    const prog = {
      schedule: {
        wednesday: {
          name: 'X',
          active: true,
          exercises: [
            { id: 'a', name: 'Dips', sets: 3, reps: 10, muscleGroup: 'triceps' },
            { id: 'b', name: 'Curl', sets: 3, reps: 12, muscleGroup: 'biceps' }
          ]
        },
        sunday: {
          name: 'X′',
          active: true,
          exercises: [
            { id: 'a', name: 'Dips', sets: 4, reps: 8, muscleGroup: 'triceps' },
            { id: 'c', name: 'Kickback', sets: 3, reps: 12, muscleGroup: 'triceps' }
          ]
        }
      }
    };
    const t = extractSessionTemplates(prog);
    const rel = relateSessionTemplates(t);
    expect(rel.some((r) => r.proof.sharedMoves.some((m) => /name:dips/.test(m)))).toBe(true);
  });

  it('adhérence multidimensionnelle : 40% reps ≠ 66% groupes', () => {
    const { assessment, vector } = buildMultidimensionalAdherence({
      date: '2026-11-18',
      planProvenance: PLAN_PROVENANCE.HISTORICAL,
      dayStatus: 'closed',
      sessionStatus: 'finished',
      planned: [
        { id: '1', plannedReps: 300, muscleGroup: 'jambes', series: '3x100' },
        { id: '2', plannedReps: 100, muscleGroup: 'pectoraux', series: '4x25' },
        { id: '3', plannedReps: 100, muscleGroup: 'biceps', series: '4x25' }
      ],
      performed: [
        { id: '2', reps: 100 },
        { id: '3', reps: 100 }
      ]
    });
    expect(assessment.abstained).toBe(false);
    expect(vector.dimensions.reps.value).toBeCloseTo(0.4, 2);
    expect(vector.dimensions.muscleGroupsFullyCovered.value).toBeCloseTo(2 / 3, 2);
    expect(vector.pattern.id).toBe('targeted_omission');
    expect(vector.pattern.group).toMatch(/jambe/i);
    expect(vector.conclusion).toMatch(/ne sont pas interchangeables|concentré/i);
  });

  it('omission isolée vs récurrente', () => {
    const mk = (date, omitLegs) =>
      buildMultidimensionalAdherence({
        date,
        planProvenance: PLAN_PROVENANCE.HISTORICAL,
        dayStatus: 'closed',
        sessionStatus: 'finished',
        planned: [
          { id: '1', plannedReps: 100, muscleGroup: 'jambes' },
          { id: '2', plannedReps: 100, muscleGroup: 'pectoraux' }
        ],
        performed: omitLegs
          ? [{ id: '2', reps: 100 }]
          : [
              { id: '1', reps: 100 },
              { id: '2', reps: 100 }
            ]
      }).assessment;
    const ctx = contextualizeOmissionsAcrossDays([
      mk('2026-11-01', true),
      mk('2026-11-08', false),
      mk('2026-11-15', true),
      mk('2026-11-22', true)
    ]);
    expect(ctx.recurring.some((r) => /jambe/i.test(r.group) && r.count >= 3)).toBe(true);
  });

  it('découvertes structurelles produites', () => {
    const { discoveries } = composeStructuralProgramDiscoveries({
      activeProgram: abcProgram(),
      voiceKey: 'week'
    });
    expect(discoveries.some((d) => d.kind === 'disc_session_family_structure')).toBe(true);
    expect(discoveries[0].metrics.observedValues.length).toBeGreaterThan(0);
  });

  it('jeu C : exercices distincts ne comptent plus comme doublons sémantiques', () => {
    const a = stampDiscoveryIdentity({
      kind: 'disc_format_consolidation',
      title: 'Hyperextension: format repris',
      body: 'Hyperextension revient.',
      metrics: { exerciseId: 105, name: 'Hyperextension' }
    });
    const b = stampDiscoveryIdentity({
      kind: 'disc_format_consolidation',
      title: 'Pompes: format repris',
      body: 'Pompes revient.',
      metrics: { exerciseId: 504, name: 'Pompes' }
    });
    expect(substantiveEquivalence(a, b).equivalent).toBe(false);
    const insights = {
      shortTerm: [
        { ...a, claim: claimFromDiscovery(a) },
        { ...b, claim: claimFromDiscovery(b) }
      ],
      mediumTerm: [],
      longTerm: [],
      accessibleReserve: [],
      publicationDispositions: [
        { id: a.id, disposition: 'published' },
        { id: b.id, disposition: 'published' }
      ]
    };
    const report = runGameCCollective({
      insights,
      p6: {
        counters: { reconciled: true },
        priority: insights.shortTerm,
        reserve: []
      }
    });
    expect(report.semanticEquivalentsAccessible).toBe(0);
    expect(report.exactDuplicatesAccessible).toBe(0);
  });

  it('contre-exemple : deux séances indépendantes non fusionnées', () => {
    const prog = {
      schedule: {
        monday: {
          name: 'Push',
          active: true,
          exercises: [{ id: 1, name: 'Bench', sets: 3, reps: 8, muscleGroup: 'pectoraux' }]
        },
        wednesday: {
          name: 'Pull',
          active: true,
          exercises: [{ id: 2, name: 'Row', sets: 3, reps: 8, muscleGroup: 'dos' }]
        }
      }
    };
    const graph = buildProgramSessionGraph(prog);
    expect(graph.families.every((f) => f.size === 1)).toBe(true);
  });

  it('relie des séances au même mouvement malgré des ids distincts (dup_/ex_)', () => {
    const prog = {
      schedule: {
        lundi: {
          name: 'A',
          active: true,
          exercises: [
            { id: 101, name: 'Tractions pronation', series: '4×5' },
            { id: 'ex_1', name: 'Dips', series: '3×8' },
            { id: 'ex_2', name: 'Pompes', series: '3×12' }
          ]
        },
        vendredi: {
          name: 'A′',
          active: true,
          exercises: [
            { id: 501, name: 'Tractions pronation', series: '4×5' },
            { id: 'dup_9', name: 'Dips', series: '4×6' },
            { id: 'ex_9', name: 'Row', series: '3×10' }
          ]
        }
      }
    };
    const graph = buildProgramSessionGraph(prog);
    expect(graph.relations.some((r) => r.type === 'session_variant' || r.type === 'similar_session')).toBe(
      true
    );
    const family = graph.families.find((f) => f.members.includes('lundi') && f.members.includes('vendredi'));
    expect(family).toBeTruthy();
    expect(graph.templates.find((t) => t.dayKey === 'lundi')?.plannedReps).toBeGreaterThan(0);
  });
});
