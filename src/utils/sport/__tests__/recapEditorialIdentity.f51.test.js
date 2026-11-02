/**
 * F5.1 — Identité historique vs similarité ; rivalités sans fusion par nom.
 */
import { describe, expect, it } from 'vitest';
import {
  IDENTITY_RELATION,
  relateExerciseIdentities,
  sameExerciseIdentity,
  measuresComparableForContradiction,
  repairDisplayNameFromIdentity,
  exerciseIdentityKey
} from '../recapEditorialIdentity';
import {
  findPhenomenonRival,
  findVolumeContradiction,
  findDisplayNameHomonyms,
  editorialCanTake,
  phenomenonIdentity
} from '../recapEditorialSelection';
import { selectPeriodDiscoveriesWithTrace } from '../recapPeriodDiscoveries';

function card(partial) {
  return {
    nature: 'trajectory',
    family: partial.family || partial.kind,
    score: 70,
    title: partial.title || partial.kind,
    body: partial.body || 'corps',
    ...partial,
    metrics: { ...(partial.metrics || {}) }
  };
}

describe('F5.1 — relations d’identité', () => {
  it('1. même nom, ids distincts, sans alias → SAME_DISPLAY_NAME (pas fusion)', () => {
    const a = card({
      kind: 'disc_emergence',
      metrics: { exerciseId: '103', name: 'Dips' }
    });
    const b = card({
      kind: 'disc_emergence',
      metrics: { exerciseId: '503', name: 'Dips' }
    });
    const rel = relateExerciseIdentities(a, b);
    expect(rel.relation).toBe(IDENTITY_RELATION.SAME_DISPLAY_NAME);
    expect(sameExerciseIdentity(a, b)).toBe(false);
    expect(exerciseIdentityKey(a)).toBe('ex:103');
    expect(exerciseIdentityKey(b)).toBe('ex:503');
  });

  it('2. alias historique explicitement prouvé → SAME_EXERCISE', () => {
    const a = card({
      kind: 'disc_emergence',
      metrics: { exerciseId: '103', name: 'Dips', identityAliases: ['503'] }
    });
    const b = card({
      kind: 'disc_emergence',
      metrics: { exerciseId: '503', name: 'Dips' }
    });
    expect(sameExerciseIdentity(a, b)).toBe(true);
    expect(relateExerciseIdentities(a, b).proof).toBe('explicit_proven_alias');
  });

  it('3. même famille musculaire, exercices différents → SAME_MOVEMENT_FAMILY', () => {
    const a = card({
      metrics: { exerciseId: '104', name: 'Pompes déclinées' }
    });
    const b = card({
      metrics: { exerciseId: '105', name: 'Pompes serrées' }
    });
    expect(relateExerciseIdentities(a, b).relation).toBe(IDENTITY_RELATION.SAME_MOVEMENT_FAMILY);
    expect(sameExerciseIdentity(a, b)).toBe(false);
  });

  it('4. même exercice + même épisode (deux producteurs) → rivalité', () => {
    const emergence = card({
      kind: 'disc_emergence',
      score: 80,
      title: 'Pompes déclinées reviennent',
      metrics: {
        exerciseId: '104',
        name: 'Pompes déclinées',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      },
      informativeValue: 90
    });
    const ms = card({
      kind: 'disc_ms_return',
      score: 75,
      title: 'Retour pompes',
      metrics: {
        exerciseId: '104',
        name: 'Pompes déclinées',
        composedEvidence: { continuity: { kind: 'confirmed_return' } }
      },
      informativeValue: 80
    });
    const rival = findPhenomenonRival(ms, [emergence]);
    expect(rival).not.toBeNull();
    expect(rival.identityProof).toBe('same_storage_id');
  });

  it('5. même exercice, phénomènes complémentaires → pas de contradiction volume', () => {
    const decline = card({
      kind: 'disc_exercise_progress',
      metrics: {
        exerciseId: '104',
        name: 'Pompes',
        trajectoryPrimaryStory: 'net_decline',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 90, lateMean: 50, deltaPct: -44 },
          volumeAttribution: { kind: 'content_driven_down' },
          observations: [{ totalReps: 90 }, { totalReps: 50 }]
        }
      }
    });
    const freq = card({
      kind: 'disc_freq_progress_low',
      metrics: {
        exerciseId: '104',
        name: 'Pompes',
        trajectoryPrimaryStory: 'net_rise',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 1, lateMean: 3, deltaPct: 200 },
          volumeAttribution: { kind: 'frequency_driven_up' },
          observations: [{ totalReps: 1 }, { totalReps: 3 }]
        }
      }
    });
    expect(findVolumeContradiction(freq, [decline])).toBeNull();
  });

  it('6. même exercice, sous-périodes différentes → pas de contradiction auto', () => {
    const early = card({
      kind: 'disc_exercise_progress',
      metrics: {
        exerciseId: '103',
        name: 'Dips',
        observationSubset: 'first_half',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 40, lateMean: 30, deltaPct: -25 },
          windows: { subsetKey: 'first_half' },
          observations: [{ totalReps: 40 }, { totalReps: 30 }]
        }
      }
    });
    const late = card({
      kind: 'disc_emergence',
      metrics: {
        exerciseId: '103',
        name: 'Dips',
        observationSubset: 'last_half',
        composedEvidence: {
          continuity: { kind: 'stable_plateau' },
          primaryPhenomenon: { earlyMean: 30, lateMean: 30, deltaPct: 0 },
          windows: { subsetKey: 'last_half' },
          observations: [{ totalReps: 30 }, { totalReps: 30 }]
        }
      }
    });
    expect(measuresComparableForContradiction(early, late).ok).toBe(false);
    expect(findVolumeContradiction(late, [early])).toBeNull();
  });

  it('7. nom absent mais identité historique → réparation possible', () => {
    const d = card({
      title: 'un mouvement : hausse',
      metrics: { exerciseId: '103', name: 'un mouvement' }
    });
    const r = repairDisplayNameFromIdentity(d, (id) => (String(id) === '103' ? 'Dips' : ''));
    expect(r.identityStatus).toMatch(/identity_present/);
    expect(r.name).toBe('Dips');
    expect(r.status).toBe('name_repaired_from_historical_id');
  });

  it('8. exercice hors programme actuel mais id + getter historique', () => {
    const d = card({
      title: 'un mouvement s’installe',
      metrics: { exerciseId: '99901', name: 'un mouvement' }
    });
    const r = repairDisplayNameFromIdentity(d, (id) =>
      String(id) === '99901' ? 'Tractions archivées' : ''
    );
    expect(r.name).toBe('Tractions archivées');
  });

  it('9. identité indéterminée (pas d’id)', () => {
    const a = card({ metrics: { name: 'Dips' } });
    const b = card({ metrics: { exerciseId: '103', name: 'Dips' } });
    expect(relateExerciseIdentities(a, b).relation).toBe(IDENTITY_RELATION.INDETERMINATE);
  });

  it('10. homonyme 103×503 ne crée pas de volume_contradiction', () => {
    const decline = card({
      kind: 'disc_emergence',
      nature: 'trajectory',
      score: 90,
      title: 'Dips : recul confirmé',
      metrics: {
        exerciseId: '103',
        name: 'Dips',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 4,
        trajectoryRichness: 6,
        composedEvidence: {
          continuity: { kind: 'directional_change' },
          primaryPhenomenon: { earlyMean: 42, lateMean: 34, deltaPct: -19 },
          observations: [{ totalReps: 42 }, { totalReps: 34 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Dips' }
      }
    });
    const stable = card({
      kind: 'disc_emergence',
      nature: 'trajectory',
      score: 88,
      title: 'Dips : volume par séance stable',
      metrics: {
        exerciseId: '503',
        name: 'Dips',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 3,
        trajectoryRichness: 5,
        composedEvidence: {
          continuity: { kind: 'stable_plateau' },
          primaryPhenomenon: { earlyMean: 48, lateMean: 48, deltaPct: 0 },
          observations: [{ totalReps: 48 }, { totalReps: 48 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Dips' }
      }
    });
    expect(findVolumeContradiction(stable, [decline])).toBeNull();
    expect(findDisplayNameHomonyms(stable, [decline]).length).toBe(1);
    const traced = selectPeriodDiscoveriesWithTrace([decline, stable], null, 'long');
    expect(
      traced.dropped.filter((d) => d.reason === 'volume_contradiction').length
    ).toBe(0);
  });

  it('11. équivalence prouvée : pas de double sélection du même épisode', () => {
    const a = card({
      kind: 'disc_emergence',
      nature: 'journey',
      score: 85,
      title: 'Dips reviennent',
      metrics: {
        exerciseId: '103',
        name: 'Dips',
        identityAliases: ['503'],
        composedEvidence: { continuity: { kind: 'punctual_return' } },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Dips' }
      },
      informativeValue: 100
    });
    const b = card({
      kind: 'disc_ms_return',
      nature: 'journey',
      score: 80,
      title: 'Retour Dips',
      metrics: {
        exerciseId: '503',
        name: 'Dips',
        composedEvidence: { continuity: { kind: 'confirmed_return' } }
      },
      informativeValue: 90
    });
    const decision = editorialCanTake(b, [a], 'long');
    expect(decision.ok).toBe(false);
    expect(decision.reason).toBe('phenomenon_rival');
  });

  it('12. ids distincts : séries/reps ne sont pas mélangées par la rivalité', () => {
    const a = card({
      metrics: {
        exerciseId: '104',
        name: 'Pompes déclinées',
        composedEvidence: {
          observations: [{ totalReps: 60 }, { totalReps: 20 }]
        }
      }
    });
    const b = card({
      metrics: {
        exerciseId: '504',
        name: 'Pompes déclinées',
        composedEvidence: {
          observations: [{ totalReps: 40 }, { totalReps: 40 }]
        }
      }
    });
    expect(sameExerciseIdentity(a, b)).toBe(false);
    expect(a.metrics.composedEvidence.observations[0].totalReps).toBe(60);
    expect(b.metrics.composedEvidence.observations[0].totalReps).toBe(40);
    expect(findVolumeContradiction(b, [a])).toBeNull();
    expect(phenomenonIdentity(a)).not.toBe(phenomenonIdentity(b));
  });
});
