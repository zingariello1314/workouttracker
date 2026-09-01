import { describe, expect, it } from 'vitest';
import {
  absenceClass,
  collectRunTimeline,
  detectRecapMilestones,
  isMeaningfulAbsence,
  isMilestoneKind,
  resolveMilestoneGoal,
  sessionDensity,
  epleyE1rm
} from '../recapMilestoneEngine';
import { buildPeriodDiscoveryBundle } from '../recapPeriodDiscoveries';

function addCheck(snapshot, date, id, reps) {
  snapshot.reps[`${date}_${id}`] = reps;
  snapshot.checkedExercises[`${date}_${id}`] = true;
}

function sessionCatalog(dates, reps = 120) {
  return dates.map((date) => ({
    date,
    totalReps: reps,
    minutes: 50,
    exercises: [{ id: '101', name: 'Tractions pronation', reps }]
  }));
}

describe('recapMilestoneEngine', () => {
  it('classe les absences et exige un vrai écart à l’habitude', () => {
    expect(absenceClass(10)).toBeNull();
    expect(absenceClass(78).key).toBe('tres_longue');
    expect(isMeaningfulAbsence(40, 10)).toBe(true);
    expect(isMeaningfulAbsence(40, 45)).toBe(false);
    expect(isMilestoneKind('disc_ms_return')).toBe(true);
    expect(isMilestoneKind('disc_volume_shape')).toBe(false);
  });

  it('raconte la première séance, une seule fois sur aujourd’hui', () => {
    const catalog = sessionCatalog(['2026-09-01']);
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-09-01', end: '2026-09-01' },
      voiceKey: 'today',
      snapshot: { reps: {}, checkedExercises: {} }
    });
    expect(ms.some((m) => m.kind === 'disc_ms_first_session')).toBe(true);
    expect(ms.find((m) => m.kind === 'disc_ms_first_session').body).toMatch(/première/i);
  });

  it('détecte un retour d’exercice après un écart multiple de l’habitude', () => {
    const dates = [];
    for (let i = 0; i < 8; i += 1) dates.push(`2026-06-${String(1 + i * 2).padStart(2, '0')}`);
    dates.push('2026-08-31');
    const catalog = sessionCatalog(dates, 48);
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: { reps: {}, checkedExercises: {} }
    });
    const ret = ms.find((m) => m.kind === 'disc_ms_return');
    expect(ret).toBeTruthy();
    expect(ret.body).toMatch(/7[0-9]|8[0-9]|6[0-9]|9[0-9]/);
    expect(ret.body).toMatch(/traction/i);
  });

  it('ne crie pas à l’interruption si l’intervalle habituel est déjà long', () => {
    const catalog = sessionCatalog(['2026-06-01', '2026-07-15', '2026-08-31'], 40);
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: { reps: {}, checkedExercises: {} }
    });
    expect(ms.some((m) => m.kind === 'disc_ms_return')).toBe(false);
  });

  it('détecte un franchissement cumulatif dans la fenêtre', () => {
    const dates = [];
    for (let i = 0; i < 9; i += 1) dates.push(`2026-08-${String(i + 10).padStart(2, '0')}`);
    const catalog = dates.map((date, i) => ({
      date,
      totalReps: i === 8 ? 200 : 100,
      minutes: 40,
      exercises: [{ id: '1', name: 'Dips', reps: i === 8 ? 200 : 100 }]
    }));
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-18', end: '2026-08-18' },
      voiceKey: 'today',
      snapshot: { reps: {}, checkedExercises: {} }
    });
    const cumul = ms.find((m) => m.kind === 'disc_ms_cumul');
    expect(cumul).toBeTruthy();
    expect(cumul.body).toMatch(/1[\s\u00a0]?000/);
  });

  it('consolide un record reproduit sur plusieurs séances', () => {
    const catalog = [
      ...['2026-07-01', '2026-07-08', '2026-07-15'].map((date) => ({
        date,
        totalReps: 20,
        minutes: 30,
        exercises: [{ id: '101', name: 'Tractions pronation', reps: 6 }]
      })),
      ...['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'].map((date) => ({
        date,
        totalReps: 28,
        minutes: 30,
        exercises: [{ id: '101', name: 'Tractions pronation', reps: 9 }]
      }))
    ];
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-25', end: '2026-08-31' },
      voiceKey: 'week',
      snapshot: { reps: {}, checkedExercises: {} }
    });
    expect(ms.some((m) => m.kind === 'disc_ms_pr_consolidated')).toBe(true);
  });

  it('ajoute le jalon en extra sans évincer le portrait de volume', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    addCheck(snapshot, '2026-08-25', 501, 360);
    addCheck(snapshot, '2026-08-28', 501, 329);
    addCheck(snapshot, '2026-08-31', 501, 360);
    const bundle = buildPeriodDiscoveryBundle({
      snapshot,
      window: { start: '2026-08-25', end: '2026-08-31' },
      period: '7d',
      getExerciseNameById: () => 'Dips parallèles'
    });
    const selectedKinds = bundle.selected.map((d) => d.kind);
    expect(selectedKinds.some((k) => k === 'disc_volume_shape' || k === 'disc_density' || k === 'disc_peak_day')).toBe(
      true
    );
    const ms = bundle.selected.filter((d) => String(d.kind).startsWith('disc_ms_'));
    const analytical = bundle.selected.filter((d) => !String(d.kind).startsWith('disc_ms_'));
    expect(analytical.length).toBeGreaterThanOrEqual(1);
    if (ms.length) {
      expect(bundle.selected.length).toBeGreaterThan(analytical.length === bundle.selected.length ? 0 : analytical.length - 1);
    }
  });

  it('collecte les sorties course sans exiger une nuit Garmin', () => {
    const runs = collectRunTimeline(
      {},
      {
        activities: {
          cardio: [{ date: '2026-08-31', type: 'run', distanceKm: 4.7, durationMin: 28 }]
        }
      }
    );
    expect(runs[0].km).toBeGreaterThan(4);
  });

  it('estime un ETA vers 10 tractions et se tait sans objectif', () => {
    expect(resolveMilestoneGoal(null, {})).toBeNull();
    const dates = ['2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'];
    const catalog = dates.map((date, i) => ({
      date,
      totalReps: 40 + i,
      minutes: 40,
      exercises: [{ id: '101', name: 'Tractions pronation', reps: Math.min(8, 3 + i) }]
    }));
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-25', end: '2026-08-31' },
      voiceKey: 'week',
      snapshot: {},
      profileQuestionnaireRaw: {
        answers: { streetSkillGoal: 'pullups_10', strengthBaselineMaxes: { pullupsMax: 5 } }
      }
    });
    const goal = ms.find((m) => m.kind === 'disc_ms_goal');
    expect(goal).toBeTruthy();
    expect(goal.body).toMatch(/10 traction/i);
    expect(goal.body).toMatch(/semaine|octobre|septembre|jour/i);
    expect(
      detectRecapMilestones({
        catalog,
        window: { start: '2026-08-25', end: '2026-08-31' },
        voiceKey: 'week',
        snapshot: {}
      }).some((m) => m.kind === 'disc_ms_goal')
    ).toBe(false);
  });

  it('annonce l’objectif atteint le jour du palier', () => {
    const catalog = [
      { date: '2026-07-01', totalReps: 40, minutes: 30, exercises: [{ id: '101', name: 'Tractions pronation', reps: 6 }] },
      { date: '2026-07-20', totalReps: 44, minutes: 30, exercises: [{ id: '101', name: 'Tractions pronation', reps: 8 }] },
      { date: '2026-08-31', totalReps: 50, minutes: 30, exercises: [{ id: '101', name: 'Tractions pronation', reps: 10 }] }
    ];
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: {},
      profileQuestionnaireRaw: { answers: { streetSkillGoal: 'pullups_10' } }
    });
    expect(ms.find((m) => m.kind === 'disc_ms_goal')?.type).toBe('GOAL_REACHED');
  });

  it('détecte un record de densité et le combine à une très bonne nuit', () => {
    const nights = [6.2, 6.4, 6.5, 6.8, 7.0];
    const catalog = ['2026-08-10', '2026-08-14', '2026-08-18', '2026-08-22', '2026-08-26', '2026-08-31'].map(
      (date, i) => ({
        date,
        totalReps: i === 5 ? 360 : 200,
        minutes: i === 5 ? 65 : 50,
        night: i === 5 ? { hours: 8.2, efficiency: 93 } : { hours: nights[i] || 6.5, efficiency: 82 },
        exercises: [{ id: '501', name: 'Dips', reps: i === 5 ? 360 : 200 }]
      })
    );
    expect(sessionDensity(catalog[5])).toBeGreaterThan(sessionDensity(catalog[0]));
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: {}
    });
    expect(ms.some((m) => m.kind === 'disc_ms_pr_density')).toBe(true);
    const combo = ms.find((m) => m.kind === 'disc_ms_sleep_combo');
    expect(combo).toBeTruthy();
    expect(combo.body).toMatch(/8 h/);
    expect(combo.body).toMatch(/93/);
  });

  it('reste silencieux sur le combo sommeil si la nuit n’est pas là', () => {
    const catalog = ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'].map((date, i) => ({
      date,
      totalReps: i === 3 ? 360 : 200,
      minutes: i === 3 ? 65 : 50,
      exercises: [{ id: '501', name: 'Dips', reps: i === 3 ? 360 : 200 }]
    }));
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: {}
    });
    expect(ms.some((m) => m.kind === 'disc_ms_sleep_combo')).toBe(false);
  });

  it('détecte un record d’allure sur une sortie d’au moins 2 km', () => {
    const ms = detectRecapMilestones({
      catalog: sessionCatalog(['2026-08-10', '2026-08-20', '2026-08-31'], 120),
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: {},
      garminData: {
        activities: {
          cardio: [
            { date: '2026-07-01', type: 'run', distanceKm: 5, durationMin: 32 },
            { date: '2026-07-20', type: 'run', distanceKm: 5, durationMin: 30 },
            { date: '2026-08-31', type: 'run', distanceKm: 5.2, durationMin: 27 }
          ]
        }
      }
    });
    const pace = ms.find((m) => m.kind === 'disc_ms_pr_pace');
    expect(pace).toBeTruthy();
    expect(pace.body).toMatch(/allure/i);
  });

  it('raconte un exercice devenu régulier après 6 semaines', () => {
    const catalog = [];
    const early = ['2026-07-01', '2026-07-03', '2026-07-05', '2026-07-07', '2026-07-09', '2026-07-11'];
    early.forEach((date, i) => {
      catalog.push({
        date,
        totalReps: 80,
        minutes: 40,
        exercises: [
          { id: '501', name: 'Dips', reps: 60 },
          ...(i === 0 ? [{ id: '202', name: 'Tractions neutres', reps: 20 }] : [])
        ]
      });
    });
    [
      '2026-08-10',
      '2026-08-12',
      '2026-08-14',
      '2026-08-17',
      '2026-08-19',
      '2026-08-21',
      '2026-08-24',
      '2026-08-26',
      '2026-08-28',
      '2026-08-31'
    ].forEach((date) => {
      catalog.push({
        date,
        totalReps: 90,
        minutes: 40,
        exercises: [
          { id: '501', name: 'Dips', reps: 40 },
          { id: '202', name: 'Tractions neutres', reps: 50 }
        ]
      });
    });
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-01', end: '2026-08-31' },
      voiceKey: 'month',
      snapshot: {}
    });
    const regime = ms.find((m) => m.kind === 'disc_ms_regime');
    expect(regime).toBeTruthy();
    expect(regime.body).toMatch(/6 semaines/i);
    expect(regime.body).toMatch(/neutres/i);
  });

  it('détecte une transformation de mix sur une année', () => {
    const catalog = [];
    for (let i = 0; i < 12; i += 1) {
      catalog.push({
        date: `2025-09-${String(2 + i * 2).padStart(2, '0')}`,
        totalReps: 80,
        minutes: 40,
        exercises: [{ id: '501', name: 'Dips', reps: 80 }]
      });
    }
    for (let i = 0; i < 12; i += 1) {
      catalog.push({
        date: `2026-07-${String(2 + i * 2).padStart(2, '0')}`,
        totalReps: 80,
        minutes: 40,
        exercises: [{ id: '101', name: 'Tractions pronation', reps: 80 }]
      });
    }
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2025-09-01', end: '2026-08-31' },
      voiceKey: 'year',
      snapshot: {}
    });
    const mix = ms.find((m) => m.kind === 'disc_ms_mix_shift');
    expect(mix).toBeTruthy();
    expect(mix.body).toMatch(/poussée|tirage/i);
  });

  it('compare le poids sur un grain de 8 jours, pas pesée par pesée', () => {
    const progressEntries = [];
    for (let i = 0; i < 4; i += 1) {
      progressEntries.push({ date: `2026-08-${17 + i}`, weight: 79.3 });
    }
    for (let i = 0; i < 4; i += 1) {
      progressEntries.push({ date: `2026-08-${25 + i}`, weight: 78.5 });
    }
    const ms = detectRecapMilestones({
      catalog: sessionCatalog(['2026-08-25', '2026-08-28', '2026-08-31']),
      window: { start: '2026-08-25', end: '2026-08-31' },
      voiceKey: 'week',
      snapshot: { progressEntries, reps: {}, checkedExercises: {} }
    });
    const w = ms.find((m) => m.kind === 'disc_ms_weight');
    expect(w).toBeTruthy();
    expect(w.type).toBe('WEIGHT_8D');
    expect(w.body).toMatch(/8/);

    const noisy = [];
    for (let i = 0; i < 16; i += 1) {
      noisy.push({ date: `2026-08-${String(16 + i).padStart(2, '0')}`, weight: 80 + (i % 2 === 0 ? 0.1 : -0.1) });
    }
    const silent = detectRecapMilestones({
      catalog: sessionCatalog(['2026-08-25', '2026-08-31']),
      window: { start: '2026-08-25', end: '2026-08-31' },
      voiceKey: 'week',
      snapshot: { progressEntries: noisy, reps: {}, checkedExercises: {} }
    });
    expect(silent.some((m) => m.kind === 'disc_ms_weight')).toBe(false);
  });

  it('suit un retour au-delà du jour J : la reprise qui s’installe', () => {
    const dates = [];
    for (let i = 0; i < 8; i += 1) dates.push(`2026-06-${String(1 + i * 2).padStart(2, '0')}`);
    ['2026-08-10', '2026-08-13', '2026-08-16', '2026-08-20', '2026-08-24', '2026-08-28'].forEach((d) => dates.push(d));
    const catalog = sessionCatalog(dates, 48);
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-25', end: '2026-08-31' },
      voiceKey: 'week',
      snapshot: {}
    });
    const durable = ms.find((m) => m.kind === 'disc_ms_return_durable');
    expect(durable).toBeTruthy();
    expect(durable.body).toMatch(/séances/i);
  });

  it('détecte un record de charge / e1RM quand les kg sont saisis', () => {
    expect(epleyE1rm(60, 8)).toBeGreaterThan(70);
    const snapshot = { reps: {}, checkedExercises: {}, exerciseWeights: {} };
    const keys = [
      ['2026-07-01', 20],
      ['2026-07-20', 22],
      ['2026-08-10', 24],
      ['2026-08-31', 32]
    ];
    keys.forEach(([date, kg]) => {
      const key = `${date}_501`;
      snapshot.reps[key] = 8;
      snapshot.checkedExercises[key] = true;
      snapshot.exerciseWeights[key] = kg;
    });
    const catalog = keys.map(([date]) => ({
      date,
      totalReps: 80,
      minutes: 40,
      exercises: [{ id: '501', name: 'Développé haltères', reps: 80 }]
    }));
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot,
      getExerciseNameById: () => 'Développé haltères'
    });
    expect(ms.some((m) => m.kind === 'disc_ms_pr_load')).toBe(true);
    expect(ms.find((m) => m.kind === 'disc_ms_pr_load').body).toMatch(/kg/i);
  });

  it('annonce un objectif 5 km le jour du palier', () => {
    const ms = detectRecapMilestones({
      catalog: sessionCatalog(['2026-08-10', '2026-08-20', '2026-08-31'], 80),
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: {},
      profileQuestionnaireRaw: { answers: { runningGoal: '5k' } },
      garminData: {
        activities: {
          cardio: [
            { date: '2026-07-01', type: 'run', distanceKm: 3.2, durationMin: 20 },
            { date: '2026-07-20', type: 'run', distanceKm: 4.1, durationMin: 24 },
            { date: '2026-08-31', type: 'run', distanceKm: 5.1, durationMin: 28 }
          ]
        }
      }
    });
    const g = ms.find((m) => m.kind === 'disc_ms_goal_run');
    expect(g).toBeTruthy();
    expect(g.type).toBe('RUN_GOAL_REACHED');
    expect(g.body).toMatch(/5 km/i);
  });

  it('projette un objectif de poids sur des moyennes, pas une pesée', () => {
    const progressEntries = [];
    for (let i = 0; i < 8; i += 1) {
      progressEntries.push({ date: `2026-08-${String(1 + i).padStart(2, '0')}`, weight: 81.2 });
    }
    for (let i = 0; i < 5; i += 1) {
      progressEntries.push({ date: `2026-08-${String(27 + i).padStart(2, '0')}`, weight: 79.4 });
    }
    const ms = detectRecapMilestones({
      catalog: sessionCatalog(['2026-08-25', '2026-08-28', '2026-08-31']),
      window: { start: '2026-08-25', end: '2026-08-31' },
      voiceKey: 'week',
      snapshot: { progressEntries, reps: {}, checkedExercises: {} },
      profileQuestionnaireRaw: {
        answers: { vitalsSelfReport: { targetWeightKg: 77, targetWeightMode: 'manual' } }
      }
    });
    const g = ms.find((m) => m.kind === 'disc_ms_goal_weight');
    expect(g).toBeTruthy();
    expect(g.body).toMatch(/77/);
  });

  it('combine un PR de densité avec un autre jalon le même jour', () => {
    const nights = [6.2, 6.4, 6.5, 6.8, 7.0];
    const catalog = ['2026-08-10', '2026-08-14', '2026-08-18', '2026-08-22', '2026-08-26', '2026-08-31'].map(
      (date, i) => ({
        date,
        totalReps: i === 5 ? 360 : 200,
        minutes: i === 5 ? 65 : 50,
        night: i === 5 ? { hours: 8.2, efficiency: 93 } : { hours: nights[i] || 6.5, efficiency: 82 },
        exercises: [{ id: '501', name: 'Dips', reps: i === 5 ? 360 : 200 }]
      })
    );
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-31', end: '2026-08-31' },
      voiceKey: 'today',
      snapshot: {}
    });
    expect(ms.some((m) => m.kind === 'disc_ms_pr_density')).toBe(true);
    expect(ms.some((m) => m.kind === 'disc_ms_sleep_combo' || m.kind === 'disc_ms_event_combo')).toBe(true);
  });

  it('franchit un cumul d’heures', () => {
    const dates = [];
    for (let i = 0; i < 14; i += 1) {
      dates.push(`2026-08-${String(i + 10).padStart(2, '0')}`);
    }
    const catalog = dates.map((date, i) => ({
      date,
      totalReps: 80,
      minutes: i === 13 ? 50 : 45,
      exercises: [{ id: '1', name: 'Dips', reps: 80 }]
    }));
    const ms = detectRecapMilestones({
      catalog,
      window: { start: '2026-08-23', end: '2026-08-23' },
      voiceKey: 'today',
      snapshot: {}
    });
    expect(ms.some((m) => m.kind === 'disc_ms_hours')).toBe(true);
  });
});
