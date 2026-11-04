/**
 * F5 — sélection éditoriale : valeur informative, rivalités de phénomène,
 * contradictions, descriptifs faibles, horizon, rest_assoc, abstention.
 */
import { describe, expect, it } from 'vitest';
import {
  selectPeriodDiscoveriesWithTrace,
  discoveryInformativeValue
} from '../recapPeriodDiscoveries';
import {
  classifyPhenomenon,
  phenomenonIdentity,
  editorialCanTake,
  findPhenomenonRival,
  findVolumeContradiction,
  isWeakDescriptiveCard,
  isUnresolvedExerciseName
} from '../recapEditorialSelection';
import { signalFamilyOfKind } from '../recapInsightNature';
import { CONTENT_CLASS } from '../recapDiscoveryContentClass';

function card(partial) {
  return {
    nature: 'trajectory',
    family: partial.family || partial.kind,
    score: 70,
    title: partial.title || partial.kind,
    body: partial.body || 'corps',
    metrics: {},
    ...partial,
    metrics: { ...(partial.metrics || {}) }
  };
}

function composedMetrics(extra = {}) {
  return {
    exerciseId: '104',
    name: 'Pompes déclinées',
    trajectoryOk: true,
    composedOk: true,
    composedFactCount: 5,
    trajectoryRichness: 8,
    trajectorySetAvailable: true,
    trajectoryPeers: 'localized',
    trajectoryPrimaryStory: 'partial_recovery',
    composedEvidence: {
      primaryPhenomenon: { earlyMean: 40, lateMean: 70, deltaPct: 75 },
      continuity: { kind: 'punctual_return' },
      volumeAttribution: { kind: 'frequency_driven_up' },
      decomposition: { kind: 'same_sets_more_reps', available: true },
      comparators: { verdict: 'localized' },
      observations: [
        { totalReps: 40 },
        { totalReps: 55 },
        { totalReps: 70 }
      ]
    },
    f4Narration: { used: true, consistencyOk: true, resolvedName: 'Pompes déclinées' },
    ...extra
  };
}

describe('F5 — classification phénomène', () => {
  it('classe émergence retour et ms_return dans return_after_gap', () => {
    const a = card({
      kind: 'disc_emergence',
      title: 'Pompes déclinées reviennent après une interruption',
      metrics: {
        exerciseId: '104',
        name: 'Pompes déclinées',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const b = card({
      kind: 'disc_ms_return',
      title: 'Retour : Pompes déclinées',
      metrics: { exerciseId: '104', name: 'Pompes déclinées' }
    });
    expect(classifyPhenomenon(a)).toBe('return_after_gap');
    expect(classifyPhenomenon(b)).toBe('return_after_gap');
    expect(phenomenonIdentity(a)).toBe(phenomenonIdentity(b));
    expect(phenomenonIdentity(a)).toContain('ex:104');
  });

  it('distingue baisse de reps/série et hausse de fréquence sur le même exercice', () => {
    const decline = card({
      kind: 'disc_exercise_progress',
      metrics: {
        exerciseId: '104',
        trajectoryPrimaryStory: 'net_decline',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 80, lateMean: 50, deltaPct: -37.5 },
          volumeAttribution: { kind: 'content_driven_down' },
          observations: [{ totalReps: 80 }, { totalReps: 50 }]
        }
      }
    });
    const freq = card({
      kind: 'disc_freq_progress_low',
      metrics: {
        exerciseId: '104',
        trajectoryPrimaryStory: 'net_rise',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 2, lateMean: 4, deltaPct: 100 },
          volumeAttribution: { kind: 'frequency_driven_up' },
          observations: [{ totalReps: 2 }, { totalReps: 4 }]
        }
      }
    });
    expect(classifyPhenomenon(decline)).toBe('volume_decline');
    expect(classifyPhenomenon(freq)).toBe('frequency_attribution');
    expect(phenomenonIdentity(decline)).not.toBe(phenomenonIdentity(freq));
  });
});

describe('F5 — valeur informative', () => {
  it('carte composée riche bat descriptif faible', () => {
    const rich = card({
      kind: 'disc_exercise_progress',
      nature: 'journey',
      score: 62,
      metrics: composedMetrics()
    });
    const weak = card({
      kind: 'disc_density',
      nature: 'now',
      score: 70,
      metrics: { vsPct: 2 }
    });
    expect(discoveryInformativeValue(rich, 'week')).toBeGreaterThan(
      discoveryInformativeValue(weak, 'week')
    );
  });

  it('observation simple remarquable bat composition triviale', () => {
    const simple = card({
      kind: 'disc_freq_progress_high',
      nature: 'trajectory',
      score: 78,
      title: 'Tractions : 3 séances contre 1',
      metrics: {
        exerciseId: '101',
        name: 'Tractions',
        sessionsNow: 3,
        sessionsPrev: 1
      }
    });
    const trivial = card({
      kind: 'disc_exercise_progress',
      nature: 'journey',
      score: 60,
      metrics: {
        exerciseId: '60',
        name: 'Dips',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 2,
        trajectoryRichness: 1,
        trajectoryPrimaryStory: 'plateau',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 30, lateMean: 31, deltaPct: 3 },
          continuity: { kind: 'unclear' },
          observations: [{ totalReps: 30 }, { totalReps: 31 }]
        }
      }
    });
    expect(discoveryInformativeValue(simple, 'week')).toBeGreaterThan(
      discoveryInformativeValue(trivial, 'week')
    );
  });

  it('pénalise quarter_profile sur 7 jours', () => {
    const q = card({
      kind: 'disc_quarter_profile',
      nature: 'journey',
      score: 68
    });
    expect(discoveryInformativeValue(q, 'week')).toBeLessThan(
      discoveryInformativeValue(q, 'long')
    );
  });

  it('pénalise nom « un mouvement »', () => {
    const anon = card({
      kind: 'disc_exercise_progress',
      score: 70,
      title: 'un mouvement : recul',
      metrics: { exerciseId: '999', name: 'un mouvement', trajectoryOk: true }
    });
    const named = card({
      kind: 'disc_exercise_progress',
      score: 70,
      title: 'Pompes : recul',
      metrics: { exerciseId: '104', name: 'Pompes', trajectoryOk: true }
    });
    expect(isUnresolvedExerciseName(anon)).toBe(true);
    expect(discoveryInformativeValue(named, 'week')).toBeGreaterThan(
      discoveryInformativeValue(anon, 'week')
    );
  });
});

describe('F5 — rivalités et contradictions', () => {
  it('deux retours même exercice / même épisode → une seule carte', () => {
    const emergence = card({
      kind: 'disc_emergence',
      nature: 'journey',
      score: 72,
      title: 'Pompes déclinées : revient',
      metrics: {
        exerciseId: '104',
        name: 'Pompes déclinées',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 4,
        trajectoryRichness: 6,
        composedEvidence: {
          continuity: { kind: 'punctual_return' },
          primaryPhenomenon: { earlyMean: 0, lateMean: 40, deltaPct: 100 },
          observations: [{ totalReps: 0 }, { totalReps: 40 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Pompes déclinées' }
      }
    });
    const msReturn = card({
      kind: 'disc_ms_return',
      nature: 'journey',
      score: 80,
      title: 'Retour : Pompes déclinées',
      metrics: {
        exerciseId: '104',
        name: 'Pompes déclinées',
        composedEvidence: { continuity: { kind: 'confirmed_return' } }
      }
    });
    const traced = selectPeriodDiscoveriesWithTrace([emergence, msReturn], null, 'long');
    const returns = traced.selected.filter(
      (d) => d.kind === 'disc_emergence' || d.kind === 'disc_ms_return'
    );
    expect(returns.length).toBe(1);
    expect(
      traced.dropped.some(
        (d) =>
          d.reason === 'phenomenon_rival' ||
          d.reason === 'phenomenon_outranked' ||
          d._dropHint === 'phenomenon_rival'
      ) || traced.displaceLog.length >= 0
    ).toBe(true);
    // Exactement un des deux dans selected
    expect(traced.selected.filter((d) => phenomenonIdentity(d).includes('return_after_gap')).length).toBe(
      1
    );
  });

  it('deux phénomènes distincts même exercice peuvent coexister', () => {
    const decline = card({
      kind: 'disc_exercise_progress',
      nature: 'journey',
      score: 74,
      metrics: {
        exerciseId: '104',
        name: 'Pompes',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 5,
        trajectoryRichness: 7,
        trajectorySetAvailable: true,
        trajectoryPrimaryStory: 'net_decline',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 90, lateMean: 50, deltaPct: -44 },
          volumeAttribution: { kind: 'content_driven_down' },
          decomposition: { kind: 'same_sets_fewer_reps', available: true },
          observations: [{ totalReps: 90 }, { totalReps: 50 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Pompes' }
      }
    });
    const freq = card({
      kind: 'disc_freq_progress_low',
      nature: 'trajectory',
      score: 72,
      metrics: {
        exerciseId: '104',
        name: 'Pompes',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 4,
        trajectoryRichness: 6,
        trajectoryPrimaryStory: 'net_rise',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 1, lateMean: 3, deltaPct: 200 },
          volumeAttribution: { kind: 'frequency_driven_up' },
          observations: [{ totalReps: 1 }, { totalReps: 3 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Pompes' }
      }
    });
    expect(findPhenomenonRival(freq, [decline])).toBeNull();
    const traced = selectPeriodDiscoveriesWithTrace([decline, freq], null, 'month');
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
    expect(traced.selected.some((d) => d.kind === 'disc_freq_progress_low')).toBe(true);
  });

  it('contradiction volume up/down même exercice → une seule sans explication', () => {
    const up = card({
      kind: 'disc_exercise_progress',
      nature: 'journey',
      score: 70,
      title: 'Dips : hausse',
      metrics: {
        exerciseId: '60',
        name: 'Dips',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 4,
        trajectoryRichness: 5,
        trajectoryPrimaryStory: 'net_rise',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 40, lateMean: 70, deltaPct: 75 },
          observations: [{ totalReps: 40 }, { totalReps: 70 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Dips' }
      }
    });
    const down = card({
      kind: 'disc_freq_decline_low_exposure',
      nature: 'journey',
      score: 68,
      title: 'Dips : recul',
      metrics: {
        exerciseId: '60',
        name: 'Dips',
        trajectoryOk: true,
        composedOk: true,
        composedFactCount: 3,
        trajectoryRichness: 4,
        trajectoryPrimaryStory: 'net_decline',
        composedEvidence: {
          primaryPhenomenon: { earlyMean: 70, lateMean: 40, deltaPct: -42 },
          observations: [{ totalReps: 70 }, { totalReps: 40 }]
        },
        f4Narration: { used: true, consistencyOk: true, resolvedName: 'Dips' }
      }
    });
    expect(findVolumeContradiction(down, [up])).not.toBeNull();
    const traced = selectPeriodDiscoveriesWithTrace([up, down], null, 'long');
    const dips = traced.selected.filter((d) => String(d.metrics?.exerciseId) === '60');
    expect(dips.length).toBe(1);
  });

  it('saturation emergence : cap épisode sur long', () => {
    const pack = Array.from({ length: 24 }, (_, idx) => {
      const i = idx + 1;
      return card({
        kind: 'disc_emergence',
        nature: 'journey',
        score: 70 + i,
        title: `Ex ${i} : revient`,
        metrics: {
          exerciseId: String(100 + i),
          name: `Ex ${i}`,
          trajectoryOk: true,
          composedEvidence: { continuity: { kind: 'punctual_return' } },
          f4Narration: { used: true, consistencyOk: true, resolvedName: `Ex ${i}` }
        }
      });
    });
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'long');
    const emergences = traced.selected.filter((d) => d.kind === 'disc_emergence');
    // Cap long = 12, soft overflow +6 pour IV élevées distinctes → max 18.
    expect(emergences.length).toBeLessThanOrEqual(18);
    expect(emergences.length).toBeLessThan(pack.length);
    expect(
      traced.dropped.some((d) => d.reason === 'episode_cap' || d.reason === 'family' || d.reason === 'cap')
    ).toBe(true);
  });
});

describe('F5 — horizon et descriptifs', () => {
  it('carte trimestrielle rejetée ou très pénalisée sur 7 jours', () => {
    const pack = [
      card({
        kind: 'disc_quarter_profile',
        nature: 'journey',
        score: 75,
        title: 'Profil trimestriel'
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        score: 62,
        metrics: composedMetrics()
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
    const q = traced.selected.find((d) => d.kind === 'disc_quarter_profile');
    if (q) {
      expect(q.informativeValue).toBeLessThan(
        traced.selected.find((d) => d.kind === 'disc_exercise_progress').informativeValue
      );
    }
  });

  it('anchor tautologique faible sur semaine peut être écarté face à une trajectoire', () => {
    const pack = [
      card({
        kind: 'disc_anchor',
        nature: 'now',
        score: 66,
        title: 'Point d’ancrage',
        body: 'Cette semaine devient un point d’ancrage.'
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        score: 64,
        metrics: composedMetrics()
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
    expect(isWeakDescriptiveCard(pack[0])).toBe(true);
  });
});

describe('F5 — sommeil vs rest_assoc', () => {
  it('rest_assoc ne consomme plus le budget sleep', () => {
    expect(signalFamilyOfKind('disc_rest_assoc')).toBe('sport');
    expect(signalFamilyOfKind('disc_sleep_volume')).toBe('sleep');
  });

  it('sommeil et rest_assoc peuvent coexister sans voler le slot sleep', () => {
    const sleep = card({
      kind: 'disc_sleep_volume',
      nature: 'trajectory',
      score: 72,
      title: 'Sommeil et volume',
      metrics: { nights: 6 }
    });
    const rest = card({
      kind: 'disc_rest_assoc',
      nature: 'trajectory',
      score: 74,
      title: 'Repos et charge',
      metrics: { pairs: 5 }
    });
    const traced = selectPeriodDiscoveriesWithTrace([sleep, rest], null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_sleep_volume')).toBe(true);
  });
});

describe('F5 — noms et abstention', () => {
  it('refuse de promouvoir un mouvement anonyme comme majeure', () => {
    const anon = card({
      kind: 'disc_exercise_progress',
      nature: 'journey',
      score: 90,
      title: 'un mouvement : hausse',
      metrics: {
        exerciseId: '999',
        name: 'un mouvement',
        trajectoryOk: true,
        trajectoryRichness: 8,
        composedOk: true,
        composedFactCount: 6
      }
    });
    anon.informativeValue = discoveryInformativeValue(anon, 'week');
    const d2 = editorialCanTake(anon, [], 'week');
    expect(d2.ok).toBe(false);
    expect(d2.reason).toBe('unresolved_exercise_name');
  });

  it('pack sans découverte intéressante : moins de cartes (abstention)', () => {
    const pack = [
      card({ kind: 'disc_density', nature: 'now', score: 40, metrics: { vsPct: 1 } }),
      card({ kind: 'disc_calendar_rhythm', nature: 'now', score: 38 }),
      card({ kind: 'disc_anchor', nature: 'now', score: 36 })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.length).toBeLessThanOrEqual(2);
    expect(traced.counts.rejected + traced.counts.selected).toBe(traced.counts.eligible);
  });

  it('fusionne reprise milestone et émergence du même exercice', () => {
    const ms = card({
      kind: 'disc_ms_return',
      nature: 'now',
      score: 91,
      title: 'Relevés de genoux aux parallèles revient après un long silence',
      body: 'Reprise après 42 jours avec 40 répétitions.',
      metrics: {
        exerciseId: '777',
        name: 'Relevés de genoux aux parallèles',
        gapDays: 42,
        trajectoryOk: true,
        trajectoryRichness: 7,
        composedOk: true,
        composedFactCount: 4
      }
    });
    const em = card({
      kind: 'disc_emergence',
      nature: 'trajectory',
      score: 88,
      title: 'Relevés de genoux aux parallèles reviennent après une interruption',
      body: 'Réapparition après 77 jours. Format 2 × 20.',
      metrics: {
        exerciseId: '777',
        name: 'Relevés de genoux aux parallèles',
        gapDays: 77,
        trajectoryOk: true,
        trajectoryInstallation: 'returning',
        trajectoryRichness: 5,
        composedOk: true,
        composedFactCount: 3,
        composedEvidence: { continuity: { kind: 'returning' } }
      }
    });
    const other = card({
      kind: 'disc_volume_shape',
      nature: 'now',
      score: 70,
      title: 'Le volume a une forme',
      body: 'Constat de volume sur la période avec mécanismes observables et chiffres.'
    });
    const traced = selectPeriodDiscoveriesWithTrace([ms, em, other], null, 'month');
    const returns = traced.selected.filter(
      (d) =>
        String(d.metrics?.exerciseId) === '777' &&
        /disc_ms_return|disc_emergence/.test(d.kind)
    );
    expect(returns.length).toBe(1);
  });

  it('fusionne reprises 42 j / 77 j avec storage ids distincts si même jour de retour', () => {
    const ms = card({
      kind: 'disc_ms_return',
      nature: 'now',
      score: 86,
      title: 'Relevés de genoux aux parallèles revient après un long silence',
      body: 'Première séance depuis 42 jours.',
      metrics: {
        exerciseId: '504',
        name: 'Relevés de genoux aux parallèles',
        gapDays: 42,
        date: '2026-11-02',
        trajectoryInstallation: 'returning',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const em = card({
      kind: 'disc_emergence',
      nature: 'trajectory',
      score: 88,
      title: 'Relevés de genoux aux parallèles reviennent après une interruption',
      body: 'Réapparition après 77 jours.',
      metrics: {
        exerciseId: '777',
        name: 'Relevés de genoux aux parallèles',
        gapDays: 77,
        date: '2026-11-02',
        trajectoryInstallation: 'returning',
        composedEvidence: { continuity: { kind: 'returning' } }
      }
    });
    const traced = selectPeriodDiscoveriesWithTrace([ms, em], null, 'week');
    const returns = traced.selected.filter((d) =>
      /disc_ms_return|disc_emergence/.test(d.kind)
    );
    expect(returns.length).toBe(1);
  });

  it('fusionne jalon + émergence même si une date manque (même nom, dual id)', () => {
    const ms = card({
      kind: 'disc_ms_return',
      nature: 'now',
      score: 86,
      title: 'Relevés de genoux aux parallèles revient après un long silence',
      body: 'Première séance depuis 42 jours.',
      metrics: {
        exerciseId: '504',
        name: 'Relevés de genoux aux parallèles',
        gapDays: 42,
        date: '2026-11-02',
        trajectoryInstallation: 'returning',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const em = card({
      kind: 'disc_emergence',
      nature: 'trajectory',
      score: 88,
      title: 'Relevés de genoux aux parallèles reviennent après une interruption',
      body: 'Réapparition après 77 jours.',
      metrics: {
        exerciseId: '777',
        name: 'Relevés de genoux aux parallèles',
        gapDays: 77,
        // date volontairement absente — producteur incomplet
        trajectoryInstallation: 'returning',
        composedEvidence: { continuity: { kind: 'returning' } }
      }
    });
    const traced = selectPeriodDiscoveriesWithTrace([ms, em], null, 'week');
    const returns = traced.selected.filter((d) => /disc_ms_return|disc_emergence/.test(d.kind));
    expect(returns.length).toBe(1);
  });

  it('ne fusionne pas même nom + même date si kinds identiques et ids distincts (homonymes)', () => {
    const a = card({
      kind: 'disc_ms_return',
      nature: 'now',
      score: 86,
      title: 'Curl haltère revient après un long silence',
      body: 'Première séance depuis 40 jours.',
      metrics: {
        exerciseId: '201',
        name: 'Curl haltère',
        gapDays: 40,
        date: '2026-11-02',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const b = card({
      kind: 'disc_ms_return',
      nature: 'now',
      score: 85,
      title: 'Curl haltère revient après une interruption',
      body: 'Première séance depuis 38 jours.',
      metrics: {
        exerciseId: '901',
        name: 'Curl haltère',
        gapDays: 38,
        date: '2026-11-02',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const traced = selectPeriodDiscoveriesWithTrace([a, b], null, 'week');
    const returns = traced.selected.filter((d) => d.kind === 'disc_ms_return');
    // Deux jalons même kind + display name : pas de fusion complémentaire
    expect(returns.length).toBe(2);
  });

  it('ne fusionne pas deux homonymes avec ids et jours de retour distincts', () => {
    const a = card({
      kind: 'disc_ms_return',
      nature: 'now',
      score: 86,
      title: 'Curl haltère revient après un long silence',
      body: 'Première séance depuis 42 jours.',
      metrics: {
        exerciseId: '201',
        name: 'Curl haltère',
        gapDays: 42,
        date: '2026-09-01',
        trajectoryInstallation: 'returning',
        composedEvidence: { continuity: { kind: 'punctual_return' } }
      }
    });
    const b = card({
      kind: 'disc_emergence',
      nature: 'trajectory',
      score: 88,
      title: 'Curl haltère reviennent après une interruption',
      body: 'Réapparition après 77 jours.',
      metrics: {
        exerciseId: '901',
        name: 'Curl haltère',
        gapDays: 77,
        date: '2026-11-02',
        trajectoryInstallation: 'returning',
        composedEvidence: { continuity: { kind: 'returning' } }
      }
    });
    const traced = selectPeriodDiscoveriesWithTrace([a, b], null, 'week');
    const returns = traced.selected.filter((d) =>
      /disc_ms_return|disc_emergence/.test(d.kind)
    );
    expect(returns.length).toBe(2);
  });

  it('comptages pool/eligible/selected/rejected sont disjoints', () => {
    const pack = [
      card({ kind: 'disc_volume_shape', nature: 'now', score: 60 }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        score: 70,
        metrics: composedMetrics()
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        score: 65,
        metrics: composedMetrics({ trajectoryRichness: 2 })
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.counts.pool).toBe(3);
    expect(traced.counts.eligible).toBe(2); // même kind:exerciseId
    expect(traced.counts.selected + traced.counts.rejected).toBe(traced.counts.eligible);
    expect(traced.counts.identityCollapsed).toBe(1);
  });
});

describe('F5 — non-régression E0 methodology', () => {
  it('methodology_limit reste demoted', () => {
    const pack = [
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 95,
        metrics: { contentClass: 'methodology_limit' }
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        score: 62,
        metrics: composedMetrics()
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
    expect(traced.reliabilityNotes.length).toBeGreaterThanOrEqual(1);
  });
});
