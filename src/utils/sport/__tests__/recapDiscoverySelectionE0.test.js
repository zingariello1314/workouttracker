/**
 * E0 — pertinence & sélection : classes de contenu, demote methodology_limit,
 * composition descriptive, non-régression multi-horizons.
 */
import { describe, expect, it } from 'vitest';
import DateHelper from '../../dateHelper';
import {
  buildPeriodDiscoveryBundle,
  selectPeriodDiscoveriesWithTrace,
  discoveryInformativeValue,
  PERIOD_DISCOVERY_PRIORITY
} from '../recapPeriodDiscoveries';
import {
  CONTENT_CLASS,
  contentClassForKind,
  resolveContentClass,
  isMethodologyLimitDiscovery,
  methodologyLimitMayPublish,
  reliabilityNoteFromMethodologyDiscovery
} from '../recapDiscoveryContentClass';
import { composeProgramAdherenceDiscoveries } from '../recapProgramAdherenceDiscoveries';

function seedReps(snapshot, date, exId, reps) {
  snapshot.reps[`${date}_${exId}`] = reps;
  snapshot.checkedExercises[`${date}_${exId}`] = true;
}

/** 7j sans snapshots + historique de performances antérieur. */
function fixtureWeekNoPlanSnapshots() {
  const snapshot = {
    reps: {},
    checkedExercises: {},
    calendarDayPlanSnapshots: {}
  };
  const end = '2026-10-28';
  // Fenêtre 7j
  for (const d of ['2026-10-22', '2026-10-25', '2026-10-28']) {
    seedReps(snapshot, d, 101, 40 + Number(d.slice(-2)));
    seedReps(snapshot, d, 104, 80);
  }
  // Historique antérieur (hors fenêtre)
  for (let i = 0; i < 10; i += 1) {
    const d = DateHelper.addDays('2026-10-20', -(i * 3));
    seedReps(snapshot, d, 101, 20 + i * 2);
    seedReps(snapshot, d, 104, 50 + i);
  }
  return {
    snapshot,
    window: { start: '2026-10-22', end },
    getName: (id) => (String(id) === '101' ? 'Tractions' : String(id) === '104' ? 'Pompes' : `Ex ${id}`)
  };
}

function card(partial) {
  return {
    nature: 'trajectory',
    family: partial.family || partial.kind,
    score: 70,
    title: partial.title || partial.kind,
    body: partial.body || 'corps',
    metrics: {},
    ...partial
  };
}

describe('recapDiscoveryContentClass', () => {
  it('classe disc_plan_data_insufficient comme methodology_limit', () => {
    expect(contentClassForKind('disc_plan_data_insufficient')).toBe(CONTENT_CLASS.METHODOLOGY_LIMIT);
    expect(isMethodologyLimitDiscovery({ kind: 'disc_plan_data_insufficient' })).toBe(true);
  });

  it('classe les parts musculaires comme descriptive', () => {
    expect(contentClassForKind('disc_muscle_now')).toBe(CONTENT_CLASS.DESCRIPTIVE);
    expect(contentClassForKind('disc_push_pull')).toBe(CONTENT_CLASS.DESCRIPTIVE);
  });

  it('refuse la publication principale des methodology_limit', () => {
    expect(methodologyLimitMayPublish([], { kind: 'disc_plan_data_insufficient' })).toBe(false);
  });

  it('produit une reliabilityNote structurée', () => {
    const note = reliabilityNoteFromMethodologyDiscovery({
      kind: 'disc_plan_data_insufficient',
      title: 'Suivi de plan',
      body: 'Aucun snapshot',
      evidence: 'snapshots=0',
      metrics: { snapshotDayCount: 0, reconstructDayCount: 3, minRequired: 3 }
    });
    expect(note.contentClass).toBe(CONTENT_CLASS.METHODOLOGY_LIMIT);
    expect(note.metrics.snapshotDayCount).toBe(0);
  });
});

describe('E0 sélection — scénarios représentatifs', () => {
  it('1. 7j sans snapshot + progression historique : limite demoted, progress retenue', () => {
    const pack = [
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 88,
        weights: { importance: 0.35, reliability: 0.95, novelty: 0.25, fit: 0.55 },
        metrics: { snapshotDayCount: 0, reconstructDayCount: 3, contentClass: 'methodology_limit' }
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        score: 62,
        metrics: {
          exerciseId: '104',
          trajectoryOk: true,
          trajectoryRichness: 8,
          trajectorySetAvailable: true,
          trajectoryPeers: 'localized',
          trajectoryPrimaryStory: 'net_rise',
          temporalScope: { interpretingWithHistory: true }
        }
      }),
      card({ kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 65 })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
    expect(traced.reliabilityNotes.some((n) => n.kind === 'disc_plan_data_insufficient')).toBe(true);
    const dropped = traced.dropped.find((d) => d.kind === 'disc_plan_data_insufficient');
    expect(dropped?.reason).toBe('methodology_demoted');
  });

  it('2. 7j observations banales : volume descriptif OK, pas de faux plan', () => {
    const pack = [
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 80,
        metrics: { contentClass: 'methodology_limit' }
      }),
      card({ kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 60 }),
      card({ kind: 'disc_density', nature: 'now', family: 'density', score: 55 })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_volume_shape')).toBe(true);
    expect(traced.selected.some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
    expect(traced.reliabilityNotes.length).toBeGreaterThanOrEqual(1);
  });

  it('3. progression notable + limite concurrente : progress gagne', () => {
    const pack = [
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 95,
        metrics: { contentClass: 'methodology_limit' }
      }),
      card({
        kind: 'disc_freq_progress_high',
        nature: 'trajectory',
        family: 'program_freq_progress',
        score: 74,
        metrics: {
          exerciseId: '101',
          trajectoryOk: true,
          trajectoryRichness: 7,
          trajectoryPrimaryStory: 'net_rise'
        }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.map((d) => d.kind)).toContain('disc_freq_progress_high');
    expect(traced.selected.map((d) => d.kind)).not.toContain('disc_plan_data_insufficient');
    expect(
      discoveryInformativeValue(pack[1])
    ).toBeGreaterThan(discoveryInformativeValue({ ...pack[0], rawScore: pack[0].score }));
  });

  it('4. 30j plusieurs familles : diversité sans methodology principale', () => {
    const pack = [
      card({ kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 70 }),
      card({
        kind: 'disc_muscle_now',
        nature: 'now',
        family: 'muscle_now',
        score: 66,
        contentClass: CONTENT_CLASS.DESCRIPTIVE
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        score: 72,
        metrics: {
          exerciseId: '60',
          trajectoryOk: true,
          trajectoryRichness: 6,
          trajectoryPrimaryStory: 'recovered'
        }
      }),
      card({
        kind: 'disc_gtg_unplanned_role',
        nature: 'trajectory',
        family: 'gtg_unplanned',
        score: 80
      }),
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 90,
        metrics: { contentClass: 'methodology_limit' }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'month');
    const kinds = new Set(traced.selected.map((d) => d.kind));
    expect(kinds.has('disc_plan_data_insufficient')).toBe(false);
    expect(kinds.has('disc_exercise_progress')).toBe(true);
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });

  it('5. composition musculaire concurrente : une seule carte composition', () => {
    const pack = [
      card({ kind: 'disc_muscle_now', nature: 'now', family: 'muscle_now', score: 70 }),
      card({ kind: 'disc_push_pull', nature: 'trajectory', family: 'push_pull', score: 68 }),
      card({ kind: 'disc_muscle_share_shift', nature: 'trajectory', family: 'muscle_shift', score: 67 }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        score: 75,
        metrics: {
          exerciseId: '104',
          trajectoryOk: true,
          trajectoryRichness: 8,
          trajectorySetAvailable: true,
          trajectoryPeers: 'localized',
          trajectoryPrimaryStory: 'net_decline'
        }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'month');
    const composition = traced.selected.filter((d) =>
      ['disc_muscle_now', 'disc_push_pull', 'disc_muscle_share_shift', 'disc_muscle_reorient'].includes(
        d.kind
      )
    );
    expect(composition.length).toBeLessThanOrEqual(1);
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
  });

  it('6. 3m historique riche : trajectoire journey prioritaire vs kcal générique', () => {
    const pack = [
      card({ kind: 'disc_kcal_profile', nature: 'journey', family: 'kcal_profile', score: 92 }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        score: 58,
        metrics: {
          exerciseId: '60',
          trajectoryOk: true,
          trajectoryRichness: 9,
          trajectorySetAvailable: true,
          trajectoryPeers: 'localized',
          trajectoryImplicationRule: 'stabilize',
          trajectoryPrimaryStory: 'partial_recovery',
          temporalScope: { interpretingWithHistory: true }
        }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'long');
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
  });

  it('7. vue longue événements distinctifs : deux progress d’exos coexistent', () => {
    const pack = [
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        score: 70,
        metrics: {
          exerciseId: 'a',
          trajectoryOk: true,
          trajectoryRichness: 7,
          trajectoryPrimaryStory: 'recovered'
        }
      }),
      card({
        kind: 'disc_exercise_progress',
        nature: 'journey',
        family: 'exercise_progress',
        score: 68,
        metrics: {
          exerciseId: 'b',
          trajectoryOk: true,
          trajectoryRichness: 6,
          trajectoryPrimaryStory: 'net_rise'
        }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'year');
    expect(traced.selected.filter((d) => d.kind === 'disc_exercise_progress')).toHaveLength(2);
  });

  it('8. historique vide / presque vide : sélection peut rester mince', () => {
    const pack = [
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 40,
        metrics: { contentClass: 'methodology_limit' }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected).toHaveLength(0);
    expect(traced.reliabilityNotes).toHaveLength(1);
  });

  it('9. candidats redondants composition : un seul retenu', () => {
    const pack = [
      card({ kind: 'disc_muscle_now', nature: 'now', family: 'muscle_now', score: 80 }),
      card({ kind: 'disc_push_pull', nature: 'trajectory', family: 'push_pull', score: 79 }),
      card({ kind: 'disc_muscle_reorient', nature: 'trajectory', family: 'muscle_shift', score: 78 })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'month');
    const comp = traced.selected.filter((d) =>
      ['disc_muscle_now', 'disc_push_pull', 'disc_muscle_reorient'].includes(d.kind)
    );
    expect(comp).toHaveLength(1);
  });

  it('10. familles différentes pertinentes : coexistence', () => {
    const pack = [
      card({ kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 70 }),
      card({
        kind: 'disc_gtg_unplanned_role',
        nature: 'trajectory',
        family: 'gtg_unplanned',
        score: 82
      }),
      card({
        kind: 'disc_sleep_reference',
        nature: 'journey',
        family: 'sleep_ref',
        score: 70
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'week');
    expect(traced.selected.length).toBeGreaterThanOrEqual(2);
    expect(new Set(traced.selected.map((d) => d.family)).size).toBeGreaterThanOrEqual(2);
  });

  it('11. fiabilité haute ne bat pas informativeValue trajectoire', () => {
    const limit = card({
      kind: 'disc_plan_data_insufficient',
      contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
      score: 99,
      metrics: { contentClass: 'methodology_limit' }
    });
    const traj = card({
      kind: 'disc_exercise_progress',
      nature: 'journey',
      family: 'exercise_progress',
      score: 55,
      metrics: {
        exerciseId: 'x',
        trajectoryOk: true,
        trajectoryRichness: 8,
        trajectorySetAvailable: true,
        trajectoryPeers: 'localized',
        trajectoryPrimaryStory: 'net_rise',
        temporalScope: { interpretingWithHistory: true }
      }
    });
    expect(discoveryInformativeValue({ ...traj, rawScore: 55 })).toBeGreaterThan(
      discoveryInformativeValue({ ...limit, rawScore: 99 })
    );
    const traced = selectPeriodDiscoveriesWithTrace([limit, traj], null, 'week');
    expect(traced.selected.some((d) => d.kind === 'disc_exercise_progress')).toBe(true);
    expect(traced.selected.some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
  });

  it('12. aucun candidat digne : pack principal vide, note de fiabilité seule', () => {
    const pack = [
      card({
        kind: 'disc_plan_data_insufficient',
        contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
        score: 50,
        metrics: { contentClass: 'methodology_limit' }
      })
    ];
    const traced = selectPeriodDiscoveriesWithTrace(pack, null, 'today');
    expect(traced.selected).toEqual([]);
    expect(traced.reliabilityNotes[0]?.kind).toBe('disc_plan_data_insufficient');
  });
});

describe('E0 priority lists & horizons non-régression', () => {
  it('PERIOD_DISCOVERY_PRIORITY n’impose plus disc_plan_data_insufficient', () => {
    for (const voice of ['today', 'week', 'month', 'long', 'year']) {
      const p = PERIOD_DISCOVERY_PRIORITY[voice];
      const flat = [...(p.now || []), ...(p.trajectory || []), ...(p.journey || [])];
      expect(flat).not.toContain('disc_plan_data_insufficient');
    }
  });

  it.each(['today', 'week', 'month', 'long', 'year'])(
    'horizon %s : methodology demoted même en tête de score',
    (voice) => {
      const pack = [
        card({
          kind: 'disc_plan_data_insufficient',
          contentClass: CONTENT_CLASS.METHODOLOGY_LIMIT,
          score: 99,
          metrics: { contentClass: 'methodology_limit' }
        }),
        card({ kind: 'disc_volume_shape', nature: 'now', family: 'volume_shape', score: 50 })
      ];
      const traced = selectPeriodDiscoveriesWithTrace(pack, null, voice);
      expect(traced.selected.some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
    }
  );
});

describe('E0 compose plan insufficient', () => {
  it('texte réel avant/après contrat : contentClass + poids bas', () => {
    const cards = composeProgramAdherenceDiscoveries(
      {
        findings: [
          {
            kind: 'plan_data_insufficient',
            metrics: { snapshotDayCount: 0, reconstructDayCount: 3, minRequired: 3 }
          }
        ]
      },
      { findings: [] }
    );
    expect(cards[0].kind).toBe('disc_plan_data_insufficient');
    expect(cards[0].title).toMatch(/preuve historique|indisponible|suivi de plan/i);
    expect(cards[0].body).toMatch(/snapshot/i);
    expect(cards[0].body).not.toMatch(/Les expositions réelles et les trajectoires restent exploitables séparément/);
    expect(resolveContentClass(cards[0])).toBe(CONTENT_CLASS.METHODOLOGY_LIMIT);
  });
});

describe('E0 pipeline bundle — comportement final', () => {
  it('7j sans snapshot : candidat présent, demoted ; pack sans carte plan', () => {
    const { snapshot, window, getName } = fixtureWeekNoPlanSnapshots();
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window,
      period: '7d',
      getExerciseNameById: getName
    });
    const insuf = (bundle.all || []).find((d) => d.kind === 'disc_plan_data_insufficient');
    expect(insuf).toBeTruthy();
    expect(resolveContentClass(insuf)).toBe(CONTENT_CLASS.METHODOLOGY_LIMIT);
    expect((bundle.selected || []).some((d) => d.kind === 'disc_plan_data_insufficient')).toBe(false);
    expect((bundle.reliabilityNotes || []).some((n) => n.kind === 'disc_plan_data_insufficient')).toBe(
      true
    );
    const drop = (bundle.dropped || []).find((d) => d.kind === 'disc_plan_data_insufficient');
    expect(drop?.reason).toBe('methodology_demoted');
    // Pas de remplissage forcé : sélection peut être non vide (volume/muscle) sans inventer du plan
    expect((bundle.selected || []).every((d) => d.kind !== 'disc_plan_follow_rate')).toBe(true);
  });

  it('30j : composition musculaire descriptive + pas de reorient tautologique', () => {
    const snapshot = { reps: {}, checkedExercises: {}, calendarDayPlanSnapshots: {} };
    const end = '2026-10-30';
    for (let i = 0; i < 28; i += 1) {
      const d = DateHelper.addDays(end, -i);
      if (i % 2 === 0) {
        seedReps(snapshot, d, 104, 90);
        seedReps(snapshot, d, 101, 30);
      }
    }
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: DateHelper.addDays(end, -29), end },
      period: '30d',
      getExerciseNameById: (id) => (String(id) === '101' ? 'Tractions' : 'Pompes')
    });
    expect((bundle.all || []).some((d) => d.kind === 'disc_muscle_reorient')).toBe(false);
    const muscle = (bundle.all || []).find((d) => d.kind === 'disc_muscle_now');
    if (muscle) {
      expect(muscle.contentClass || muscle.metrics?.attributionMode).toBeTruthy();
      expect(String(muscle.body)).toMatch(/indicatif|conventionnell/i);
      expect(String(muscle.body)).not.toMatch(/mesure anatomique exacte(?!.*pas)/i);
    }
    const selectedComp = (bundle.selected || []).filter((d) =>
      ['disc_muscle_now', 'disc_push_pull', 'disc_muscle_share_shift', 'disc_muscle_reorient'].includes(
        d.kind
      )
    );
    expect(selectedComp.length).toBeLessThanOrEqual(1);
  });

  it('horizons aujourd’hui→toujours : methodology jamais en selected', () => {
    const { snapshot, getName } = fixtureWeekNoPlanSnapshots();
    const cases = [
      { period: 'today', window: { start: '2026-10-28', end: '2026-10-28' } },
      { period: '7d', window: { start: '2026-10-22', end: '2026-10-28' } },
      { period: '30d', window: { start: '2026-09-29', end: '2026-10-28' } },
      { period: '3m', window: { start: '2026-07-30', end: '2026-10-28' } },
      { period: '6m', window: { start: '2026-04-28', end: '2026-10-28' } },
      { period: '1y', window: { start: '2025-10-28', end: '2026-10-28' } },
      { period: '2y', window: { start: '2024-10-28', end: '2026-10-28' } },
      { period: 'all', window: { start: '2024-01-01', end: '2026-10-28' } }
    ];
    for (const c of cases) {
      const bundle = buildPeriodDiscoveryBundle({
        snapshot,
        window: c.window,
        period: c.period,
        getExerciseNameById: getName
      });
      expect(
        (bundle.selected || []).some((d) => d.kind === 'disc_plan_data_insufficient'),
        `${c.period} selected plan_insufficient`
      ).toBe(false);
    }
  });
});
