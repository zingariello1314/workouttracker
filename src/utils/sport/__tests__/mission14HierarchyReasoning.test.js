import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import { justifyParentChildLink } from '../hierarchyLink';
import { reviewCollectively } from '../collectiveReview';
import { insightsFromP6 } from '../p6Publication';
import { composeRelativeConcentrationReading, composeLoadProgressionPhase } from '../phenomenonComposition';
import { runGameAAccuracy } from '../evaluation/gameAAccuracy';
import { stablePublicationId } from '../discoveryIdentity';

function wrap(discovery, extra = {}) {
  return {
    discovery,
    claim: { id: `claim:${discovery.kind}:${discovery.metrics?.exerciseId || discovery.title}`, proof: { observedValues: [{ id: 'x', value: 1 }] } },
    wasPriority: true,
    ...extra
  };
}

describe('Mission 14 — hiérarchie et raisonnement', () => {
  it('édition v13 hierarchy verified-deepening', () => {
    const key = analysisEditionKey();
    expect(key).toMatch(/editorial=p6-sovereign-v\d+/);
    expect(key).toMatch(/hierarchy=verified-deepening-v1/);
    expect(key).toMatch(/composition=phenomenon-compose-v\d+/);
  });

  it('refuse deepening load←format_consolidation mois plus tard / autre sujet', () => {
    const parent = {
      kind: 'disc_composed_load_phase',
      title: 'Phase collective',
      metrics: {
        namedMoves: [
          { name: 'Curl marteau', exerciseId: 10, date: '2026-08-10', loadBefore: 7, loadAfter: 8 },
          { name: 'Curl Zottman', exerciseId: 11, date: '2026-08-12', loadBefore: 5, loadAfter: 6 },
          { name: 'Oiseaux', exerciseId: 12, date: '2026-08-14', loadBefore: 3, loadAfter: 4 }
        ],
        composition: { coverage: 'concluded' }
      }
    };
    const facePullNov = {
      kind: 'disc_format_consolidation',
      title: 'Face pull : format repris',
      metrics: { exerciseId: 306, name: 'Face pull', date: '2026-11-18', dates: ['2026-11-18'] }
    };
    const link = justifyParentChildLink(parent, facePullNov);
    expect(link.ok).toBe(false);
    expect(['no_shared_subject', 'incompatible_analytical_dimension', 'incompatible_episode']).toContain(
      link.reason
    );
  });

  it('accepte deepening load←resistance_progression même exercice et épisode', () => {
    const parent = {
      kind: 'disc_composed_load_phase',
      title: 'Phase collective',
      metrics: {
        namedMoves: [
          { name: 'Curl marteau', exerciseId: 10, date: '2026-08-10' },
          { name: 'Oiseaux', exerciseId: 12, date: '2026-08-14' },
          { name: 'Zottman', exerciseId: 11, date: '2026-08-12' }
        ],
        composition: { coverage: 'concluded' }
      }
    };
    const child = {
      kind: 'resistance_progression',
      title: 'Curl marteau charge',
      metrics: {
        exerciseId: 10,
        name: 'Curl marteau',
        date: '2026-08-10',
        fromValue: 7,
        toValue: 8
      }
    };
    const link = justifyParentChildLink(parent, child);
    expect(link.ok).toBe(true);
    expect(link.reason).toBe('verified_parent_child');
  });

  it('reviewCollectively n’absorbe pas 38 consolidations dans load_phase', () => {
    const loadPhase = wrap({
      kind: 'disc_composed_load_phase',
      title: 'Phase collective d’augmentation de charge',
      nature: 'journey',
      informativeValue: 90,
      metrics: {
        namedMoves: [
          { name: 'Curl marteau', exerciseId: 10, date: '2026-08-10', loadBefore: 7, loadAfter: 8 },
          { name: 'Curl Zottman', exerciseId: 11, date: '2026-08-12', loadBefore: 5, loadAfter: 6 },
          { name: 'Oiseaux', exerciseId: 12, date: '2026-08-14', loadBefore: 3, loadAfter: 4 },
          { name: 'Curl marteau', exerciseId: 10, date: '2026-08-20', loadBefore: 8, loadAfter: 9 },
          { name: 'Développé militaire', exerciseId: 13, date: '2026-08-15', loadBefore: 10, loadAfter: 12 }
        ],
        composition: { coverage: 'concluded' }
      }
    });
    const consolidations = [
      wrap({
        kind: 'disc_format_consolidation',
        title: 'Face pull : format repris',
        informativeValue: 70,
        metrics: { exerciseId: 306, name: 'Face pull', date: '2026-11-18' }
      }),
      wrap({
        kind: 'disc_format_consolidation',
        title: 'Élévations : format repris',
        informativeValue: 70,
        metrics: { exerciseId: 304, name: 'Élévations latérales', date: '2026-11-18' }
      }),
      wrap({
        kind: 'disc_ms_return',
        title: 'Dips revient',
        informativeValue: 65,
        metrics: { exerciseId: 200, name: 'Dips', date: '2026-11-11' }
      }),
      wrap({
        kind: 'resistance_progression',
        title: 'Curl marteau charge',
        informativeValue: 75,
        metrics: { exerciseId: 10, name: 'Curl marteau', date: '2026-08-10', fromValue: 7, toValue: 8 }
      })
    ];
    const out = reviewCollectively([loadPhase, ...consolidations], { voiceKey: 'year' });
    const deepenings = out.survivors.filter((r) => r.p6Disposition === 'deepening_of_collective');
    const independent = out.survivors.filter((r) => r.p6Disposition !== 'deepening_of_collective');
    // Seul le resistance_progression curl marteau peut être deepening légitime
    expect(deepenings.length).toBeLessThanOrEqual(1);
    expect(independent.length).toBeGreaterThanOrEqual(3);
    const keptFace = independent.some((r) => /Face pull/i.test(r.discovery?.title || ''));
    expect(keptFace).toBe(true);
  });

  it('insightsFromP6 publie les deepenings au lieu de source_retained', () => {
    const parentId = 'parent-load';
    const claimOf = (id) => ({
      id: `claim:${id}`,
      proof: { observedValues: [{ id: 'v', value: 1 }] },
      assertions: [{ value: 1 }]
    });
    const p6 = {
      counters: { reconciled: true },
      priority: [
        {
          kind: 'disc_composed_load_phase',
          title: 'Phase collective',
          nature: 'journey',
          body: 'Phase de charges.',
          id: parentId,
          occurrenceId: parentId,
          claim: claimOf(parentId),
          metrics: { namedMoves: [{ name: 'Curl', exerciseId: 10, date: '2026-08-10' }] }
        }
      ],
      reserve: [
        {
          kind: 'resistance_progression',
          title: 'Curl charge',
          nature: 'trajectory',
          body: 'Curl 7→8.',
          p6Disposition: 'deepening_of_collective',
          collapsedInto: parentId,
          hierarchyLink: { ok: true, reason: 'verified_parent_child', proof: { sharedSubjects: ['10'] } },
          claim: claimOf('curl'),
          metrics: { exerciseId: 10, name: 'Curl', date: '2026-08-10' }
        },
        {
          kind: 'disc_format_consolidation',
          title: 'Face pull format',
          nature: 'trajectory',
          body: 'Face pull revient.',
          claim: claimOf('face'),
          metrics: { exerciseId: 306, name: 'Face pull', date: '2026-11-18' }
        }
      ],
      sources: [],
      blocked: []
    };
    const insights = insightsFromP6(p6, { period: '6m' });
    const accessible = [
      ...(insights.shortTerm || []),
      ...(insights.mediumTerm || []),
      ...(insights.longTerm || []),
      ...(insights.accessibleReserve || [])
    ];
    expect(accessible.some((c) => /Curl charge/i.test(c.title))).toBe(true);
    expect(accessible.some((c) => /Face pull/i.test(c.title))).toBe(true);
    const deepDisp = (insights.publicationDispositions || []).filter(
      (d) => d.disposition === 'deepening_accessible'
    );
    expect(deepDisp.length).toBeGreaterThanOrEqual(1);
    const absorbedAsSource = (insights.publicationDispositions || []).filter(
      (d) =>
        d.disposition === 'source_retained' &&
        /deepening_of_collective/i.test(String(d.reason || ''))
    );
    expect(absorbedAsSource.length).toBe(0);
  });

  it('concentration relative verbalise les bons dénominateurs', () => {
    const reading = composeRelativeConcentrationReading({
      localReps: 180,
      moveShareOfParentWindow: 180 / 360,
      globalShareOfParentWindow: 1340 / 6044,
      localRepsInParent: 360,
      globalRepsShort: 1340,
      globalRepsParent: 6044,
      moveNames: ['Élévations', 'Face pull', 'Bent-Arm'],
      periodLabel: '7 jours',
      parentPeriodLabel: '30 jours'
    });
    expect(reading.coverage).toBe('concluded');
    expect(reading.conclusion).toMatch(/volume de ces mouvements/);
    expect(reading.conclusion).not.toMatch(/50 % du volume de 7 jours/);
    expect(reading.conclusion).toMatch(/22[,.]2|22\.2/);
    expect(reading.metrics.meaning.notMeaning).toMatch(/pas la part/);
  });

  it('jeu A détecte mauvaise verbalisation des dénominateurs', () => {
    const bad = runGameAAccuracy({
      insights: {
        shortTerm: [],
        mediumTerm: [
          {
            id: 'bad-conc',
            kind: 'disc_composed_relative_concentration',
            title: 'Concentration relative',
            body: 'Ils représentent environ 50 % du volume de 7 jours, contre 22,2 % du volume de 30 jours.',
            claim: { proof: { observedValues: [{ id: 'r', value: 180 }] }, assertions: [{ value: 180 }] },
            metrics: {
              relativeConcentration: {
                moveShareOfParentWindow: 0.5,
                globalShareOfParentWindow: 0.222
              }
            }
          }
        ],
        longTerm: [],
        accessibleReserve: []
      }
    });
    expect(bad.cases.some((c) => /denominator|swapped_concentration/i.test(c.issue))).toBe(true);
  });

  it('phase de charges compte exercices distincts vs événements', () => {
    const reading = composeLoadProgressionPhase({
      events: [
        { name: 'Curl marteau', exerciseId: 10, loadBefore: 7, loadAfter: 8, date: '2026-08-10', referenceDate: '2026-07-01' },
        { name: 'Curl marteau', exerciseId: 10, loadBefore: 8, loadAfter: 9, date: '2026-08-20', referenceDate: '2026-07-01' },
        { name: 'Oiseaux', exerciseId: 12, loadBefore: 3, loadAfter: 4, date: '2026-08-14', referenceDate: '2026-07-15' }
      ]
    });
    // 3 events but need >=3 for conclude - we have 3 events, 2 exercises
    expect(reading.coverage).toBe('concluded');
    expect(reading.metrics.eventCount).toBe(3);
    expect(reading.metrics.exerciseCount).toBe(2);
    expect(reading.conclusion).toMatch(/2 exercice/);
    expect(reading.conclusion).toMatch(/référence|2026-07/);
  });
});
