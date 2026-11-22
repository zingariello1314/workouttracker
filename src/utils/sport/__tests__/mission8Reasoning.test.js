import { describe, expect, it } from 'vitest';
import { relateClaims, RELATION } from '../narrativeCoherenceEngine';
import { substantiveEquivalence, stampDiscoveryIdentity } from '../discoveryIdentity';
import { reviewCollectively } from '../collectiveReview';
import { selectCollectively, PRIORITY_COLUMN_BUDGET } from '../collectiveSelection';
import {
  compareSessionPairComposition,
  extractSessionTemplates,
  buildProgramSessionGraph
} from '../sessionStructureGraph';
import {
  reasonAboutSessionFamily,
  composeStructuralProgramDiscoveries
} from '../structuralProgramDiscoveries';
import { exploreCollectiveReturn, COVERAGE } from '../analyticalExploration';
import { buildMultidimensionalAdherence, PLAN_PROVENANCE } from '../multidimensionalAdherence';
import { reconcilePublicationIds } from '../p6Publication';
import { analysisEditionKey } from '../analysisEdition';
import { claimFromDiscovery } from '../analyticalClaim';

describe('Mission 8 — raisonnement et filiation', () => {
  it('édition ≥ v7 (Mission 8 fondations toujours actives)', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v(?:[789]|1[0-9])/);
    expect(analysisEditionKey()).toMatch(/program=structural-(?:reasoning|execution|context)-v\d+/);
  });

  it('ne fusionne pas deux exercices distincts malgré un texte identique', () => {
    const left = {
      statement: 'format repris',
      assertions: [{ subjectId: 'ex:505', metricId: 'format', operator: 'stable', value: 1 }],
      proof: { observedValues: [{ id: 'a', value: 1 }] }
    };
    const right = {
      statement: 'format repris',
      assertions: [{ subjectId: 'ex:106', metricId: 'format', operator: 'stable', value: 1 }],
      proof: { observedValues: [{ id: 'a', value: 1 }] }
    };
    expect(relateClaims(left, right)).toBe(RELATION.INDEPENDENT);

    const a = stampDiscoveryIdentity({
      kind: 'disc_format_consolidation',
      title: 'Pompes: format repris',
      body: 'format repris',
      metrics: { exerciseId: 505, name: 'Pompes A' }
    });
    const b = stampDiscoveryIdentity({
      kind: 'disc_format_consolidation',
      title: 'Pompes: format repris',
      body: 'format repris',
      metrics: { exerciseId: 106, name: 'Pompes B' }
    });
    expect(substantiveEquivalence(a, b).equivalent).toBe(false);

    const reviewed = reviewCollectively([
      { discovery: a, claim: claimFromDiscovery(a) },
      { discovery: b, claim: claimFromDiscovery(b) }
    ]);
    expect(reviewed.fused.length).toBe(0);
    expect(reviewed.survivors.length).toBe(2);
  });

  it('famille de séances : raisonnement avec redistribution (généralisation)', () => {
    const prog = {
      schedule: {
        wednesday: {
          name: 'Push A',
          active: true,
          exercises: [
            { id: 1, name: 'Pompes déclinées', series: '3×12' },
            { id: 2, name: 'Pompes inclinées', series: '3×12' },
            { id: 3, name: 'Dips', series: '3×8' }
          ]
        },
        sunday: {
          name: 'Push A′',
          active: true,
          exercises: [
            { id: 9, name: 'Pompes déclinées', series: '5×10' },
            { id: 3, name: 'Dips', series: '4×6' }
          ]
        }
      }
    };
    const graph = buildProgramSessionGraph(prog);
    expect(graph.families.some((f) => f.size >= 2)).toBe(true);
    const t = extractSessionTemplates(prog);
    const composition = compareSessionPairComposition(t[0], t[1]);
    expect(composition.sharedMoves.some((k) => /pompes declinees/.test(k))).toBe(true);
    expect(composition.left.plannedReps).toBe(36 + 36 + 24); // 3×12 + 3×12 + 3×8
    expect(composition.right.plannedReps).toBe(50 + 24); // 5×10 + 4×6
    const rel = graph.relations[0];
    const reasoned = reasonAboutSessionFamily(composition, rel, { voiceKey: 'week' });
    expect(reasoned.body).toMatch(/redistribu|socle commun|apparent/i);
    expect(reasoned.body).not.toMatch(/similar_session|confiance high/i);

    const { discoveries } = composeStructuralProgramDiscoveries({
      activeProgram: prog,
      voiceKey: 'week'
    });
    expect(discoveries.some((d) => /session_family/.test(d.kind))).toBe(true);
    expect(discoveries[0].body.length).toBeGreaterThan(180);
  });

  it('adhérence : 40% ≠ 66% + contextualisation', () => {
    const days = ['2026-10-01', '2026-10-08', '2026-10-15', '2026-10-22'].map((date, i) =>
      buildMultidimensionalAdherence({
        date,
        planProvenance: PLAN_PROVENANCE.HISTORICAL,
        dayStatus: 'closed',
        sessionStatus: 'finished',
        planned: [
          { id: '1', plannedReps: 300, muscleGroup: 'jambes' },
          { id: '2', plannedReps: 100, muscleGroup: 'pectoraux' },
          { id: '3', plannedReps: 100, muscleGroup: 'biceps' }
        ],
        performed:
          i === 1
            ? [
                { id: '1', reps: 300 },
                { id: '2', reps: 100 },
                { id: '3', reps: 100 }
              ]
            : [
                { id: '2', reps: 100 },
                { id: '3', reps: 100 }
              ]
      })
    );
    const { discoveries } = composeStructuralProgramDiscoveries({
      voiceKey: 'month',
      assessments: days.map((d) => d.assessment)
    });
    const card = discoveries.find((d) => /adherence/.test(d.kind));
    expect(card).toBeTruthy();
    expect(card.body).toMatch(/jambes|récurrent|concentre/i);
    expect(card.body).toMatch(/ne sont pas interchangeables|couverture/i);
  });

  it('retour collectif : simultanéité seule ≠ transformation liée', () => {
    const shallow = exploreCollectiveReturn([
      { name: 'A', date: '2026-11-10', exerciseId: 1, gapDays: 21 },
      { name: 'B', date: '2026-11-11', exerciseId: 2, gapDays: 28 },
      { name: 'C', date: '2026-11-12', exerciseId: 3, gapDays: 30 }
    ]);
    expect(shallow.coverage).toBe(COVERAGE.UNDER_EXPLORED);
    expect(shallow.conclusion).toMatch(/simultanéité seule|pas encore démontré/i);

    const taxonomyOnly = exploreCollectiveReturn([
      { name: 'A', date: '2026-11-10', exerciseId: 1, family: 'emergence', gapDays: 21 },
      { name: 'B', date: '2026-11-11', exerciseId: 2, family: 'emergence', gapDays: 28 },
      { name: 'C', date: '2026-11-12', exerciseId: 3, family: 'emergence', gapDays: 30 }
    ]);
    expect(taxonomyOnly.coverage).toBe(COVERAGE.UNDER_EXPLORED);

    const linked = exploreCollectiveReturn([
      { name: 'Face pull', date: '2026-11-10', exerciseId: 1, family: 'épaules', gapDays: 28 },
      { name: 'Élévations', date: '2026-11-11', exerciseId: 2, family: 'épaules', gapDays: 30 },
      { name: 'Arnold', date: '2026-11-12', exerciseId: 3, family: 'épaules', gapDays: 21 }
    ]);
    expect(linked.coverage).toBe(COVERAGE.CONCLUDED);
    expect(linked.conclusion).toMatch(/Face pull|Élévations|Arnold/i);
    expect(linked.namedMoves.length).toBe(3);
  });

  it('réconciliation : fact: embarqué explique un id registre court', () => {
    const recon = reconcilePublicationIds({
      registryIds: ['rhythm|streak|5'],
      publishedIds: ['disc_rhythm_streak|period:global|fact:rhythm|streak|5|aspect:default'],
      dispositions: [
        {
          disposition: 'published',
          id: 'disc_rhythm_streak|period:global|fact:rhythm|streak|5|aspect:default',
          occurrenceId: 'disc_rhythm_streak|period:global|fact:rhythm|streak|5|aspect:default',
          phenomenonId: 'period:global|rhythm_streak|text:une série'
        }
      ]
    });
    expect(recon.lostSilent).toEqual([]);
  });

  it('sélection : ne remplit pas jusqu’à 11 par cosmétique', () => {
    const weak = Array.from({ length: 20 }, (_, i) => ({
      discovery: {
        kind: 'disc_misc',
        title: `Faible ${i}`,
        body: 'petit constat',
        informativeValue: 3,
        weights: { importance: 0.2 }
      },
      claim: { id: `c${i}`, assertions: [{ subjectId: `ex:${i}`, metricId: 'x', operator: 'stable' }] },
      wasPriority: false
    }));
    const major = {
      discovery: {
        kind: 'disc_session_family_structure',
        title: 'Familles',
        body: 'structure',
        informativeValue: 40,
        weights: { importance: 0.9 }
      },
      claim: { id: 'major', assertions: [{ subjectId: 'period:program', metricId: 'structure', operator: 'present' }] },
      wasPriority: false
    };
    const selected = selectCollectively([major, ...weak], { voiceKey: 'week' });
    expect(selected.priority.length).toBeLessThan(PRIORITY_COLUMN_BUDGET);
    expect(selected.priority.some((r) => r.discovery.kind === 'disc_session_family_structure')).toBe(true);
    expect(selected.reserve.length).toBeGreaterThan(10);
  });

  it('réconciliation multi-alias : disposition occurrence explique phénomène texte', () => {
    const recon = reconcilePublicationIds({
      registryIds: ['ex:1|emergence|text:face pull format'],
      publishedIds: ['disc_format_consolidation|ex:1|ep:na'],
      dispositions: [
        {
          id: 'disc_emergence|ex:1|ep:na',
          occurrenceId: 'disc_emergence|ex:1|ep:na|aspect',
          disposition: 'source_retained',
          reason: 'fused',
          fusionLineage: {
            sources: [{ occurrenceId: 'ex:1|emergence|text:face pull format', publicationId: 'ex:1|emergence|text:face pull format' }]
          }
        }
      ]
    });
    expect(recon.lostSilent).toEqual([]);
  });
});
