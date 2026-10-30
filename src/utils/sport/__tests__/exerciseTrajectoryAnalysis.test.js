import { describe, it, expect } from 'vitest';
import {
  buildExerciseTrajectory,
  renderExerciseTrajectoryCopy,
  readTrustedSessionSets
} from '../exerciseTrajectoryAnalysis';

function ymd(offsetFromBase, base = '2026-09-01') {
  const d = new Date(`${base}T12:00:00`);
  d.setDate(d.getDate() + offsetFromBase);
  return d.toISOString().slice(0, 10);
}

/** Snapshot minimal : checked + reps + set logs structurés. */
function snapFromSessions(exerciseId, sessions) {
  const checkedExercises = {};
  const reps = {};
  const exerciseSetLogs = {};
  sessions.forEach((s) => {
    const key = `${s.date}_${exerciseId}`;
    checkedExercises[key] = true;
    reps[key] = String(s.total);
    if (s.sets) {
      exerciseSetLogs[key] = {
        sets: s.sets.map((r) => ({ reps: r }))
      };
    }
  });
  return { checkedExercises, reps, exerciseSetLogs };
}

const WINDOW = { start: '2026-09-30', end: '2026-10-29' };

describe('readTrustedSessionSets', () => {
  it('refuse la décomposition sans set logs structurés', () => {
    const snapshot = {
      checkedExercises: { '2026-10-01_1': true },
      reps: { '2026-10-01_1': '36' }
    };
    const r = readTrustedSessionSets(snapshot, '2026-10-01', '1', 36);
    expect(r.trusted).toBe(false);
    expect(r.source).toBe('absent');
  });

  it('accepte les séries structurées cohérentes avec le total', () => {
    const snapshot = snapFromSessions(1, [{ date: '2026-10-01', total: 48, sets: [12, 12, 12, 12] }]);
    const r = readTrustedSessionSets(snapshot, '2026-10-01', '1', 48);
    expect(r.trusted).toBe(true);
    expect(r.setCount).toBe(4);
    expect(r.perSet).toBe(12);
  });

  it('signale une contradiction total vs séries', () => {
    const snapshot = snapFromSessions(1, [{ date: '2026-10-01', total: 36, sets: [12, 12, 12, 12] }]);
    // total stocké 36 mais sets=48
    snapshot.reps['2026-10-01_1'] = '36';
    const r = readTrustedSessionSets(snapshot, '2026-10-01', '1', 36);
    expect(r.contradiction).toBe(true);
    expect(r.trusted).toBe(false);
  });
});

describe('buildExerciseTrajectory — mécanismes de volume', () => {
  it('3×12 → 4×12 maintenu : more_sets_same_reps', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(21), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(28), total: 48, sets: [12, 12, 12, 12] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(10, sessions),
      exerciseId: 10,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'emergence'
    });
    expect(trajectory.ok).toBe(true);
    expect(trajectory.setMechanism.available).toBe(true);
    expect(trajectory.setMechanism.kind).toBe('more_sets_same_reps');
    expect(trajectory.setMechanism.volumeDeltaPct).toBeCloseTo(33.3, 0);
    expect(trajectory.setMechanism.maintained).toBe(true);
    expect(['installing', 'installed', 'first_cluster']).toContain(trajectory.installation.kind);
  });

  it('3×12 → 3×8 : same_sets_fewer_reps', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(5), total: 36, sets: [12, 12, 12] },
      { date: ymd(10), total: 24, sets: [8, 8, 8] },
      { date: ymd(15), total: 24, sets: [8, 8, 8] },
      { date: ymd(20), total: 24, sets: [8, 8, 8] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(11, sessions),
      exerciseId: 11,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    expect(trajectory.setMechanism.kind).toBe('same_sets_fewer_reps');
  });

  it('3×12 → 2×12 : fewer_sets_same_reps', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(4), total: 36, sets: [12, 12, 12] },
      { date: ymd(8), total: 24, sets: [12, 12] },
      { date: ymd(12), total: 24, sets: [12, 12] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(12, sessions),
      exerciseId: 12,
      exerciseName: 'Dips',
      window: { start: ymd(0), end: ymd(12) },
      mode: 'progress'
    });
    expect(trajectory.setMechanism.kind).toBe('fewer_sets_same_reps');
  });

  it('sans séries : pas de décomposition inventée', () => {
    const sessions = [
      { date: ymd(0), total: 36 },
      { date: ymd(7), total: 30 },
      { date: ymd(14), total: 24 }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(13, sessions),
      exerciseId: 13,
      exerciseName: 'Squat',
      window: { start: ymd(0), end: ymd(14) },
      mode: 'progress'
    });
    expect(trajectory.setMechanism.available).toBe(false);
    expect(trajectory.findings.limits.some((l) => l.id === 'no_set_detail')).toBe(true);
  });
});

describe('buildExerciseTrajectory — formes', () => {
  it('baisse progressive sur plusieurs séances', () => {
    const sessions = [36, 32, 28, 24, 20].map((total, i) => ({
      date: ymd(i * 7),
      total,
      sets: [total / 4, total / 4, total / 4, total / 4]
    }));
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(20, sessions),
      exerciseId: 20,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'progress'
    });
    expect(['steady_decline', 'decline_phases']).toContain(trajectory.shape.kind);
  });

  it('séance atypique puis retour : outlier_driven ou rebound', () => {
    const sessions = [
      { date: ymd(0), total: 36 },
      { date: ymd(7), total: 36 },
      { date: ymd(14), total: 10 },
      { date: ymd(21), total: 36 },
      { date: ymd(28), total: 36 }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(21, sessions),
      exerciseId: 21,
      exerciseName: 'Pompes',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'progress'
    });
    expect(['rebound', 'fluctuation', 'plateau', 'outlier_driven']).toContain(
      trajectory.shape.kind === 'rebound' || trajectory.shape.withoutAtypical?.kind === 'outlier_driven'
        ? trajectory.shape.kind === 'rebound'
          ? 'rebound'
          : 'outlier_driven'
        : trajectory.shape.kind
    );
  });
});

describe('buildExerciseTrajectory — installation / historique', () => {
  it('exercice déjà connu avant la fenêtre ≠ nouvel exercice', () => {
    const sessions = [
      { date: '2026-08-01', total: 40 },
      { date: '2026-10-05', total: 40 },
      { date: '2026-10-12', total: 40 }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(30, sessions),
      exerciseId: 30,
      exerciseName: 'Face pull',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(trajectory.installation.firstEver).toBe(false);
    expect(['already_known', 'returning']).toContain(trajectory.installation.kind);
  });

  it('première apparition puis répétitions → installing/installed', () => {
    const sessions = [
      { date: '2026-10-02', total: 36, sets: [12, 12, 12] },
      { date: '2026-10-09', total: 48, sets: [12, 12, 12, 12] },
      { date: '2026-10-16', total: 48, sets: [12, 12, 12, 12] },
      { date: '2026-10-23', total: 48, sets: [12, 12, 12, 12] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(31, sessions),
      exerciseId: 31,
      exerciseName: 'Hyperextension',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(trajectory.installation.firstEver).toBe(true);
    expect(['installing', 'installed', 'installing_irregular']).toContain(trajectory.installation.kind);
    expect(trajectory.installation.sessionsInWindow).toBe(4);
  });

  it('deux séances espacées = repeated, pas installing', () => {
    const sessions = [
      { date: '2026-10-17', total: 36, sets: [12, 12, 12] },
      { date: '2026-10-24', total: 36, sets: [12, 12, 12] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(33, sessions),
      exerciseId: 33,
      exerciseName: 'Curl assis dos calé',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(trajectory.installation.kind).toBe('repeated');
    expect(trajectory.installation.stage).toBe('repetition');
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.title).not.toMatch(/s'install/i);
    expect(copy.title).toMatch(/repris|répét/i);
    expect(copy.body).toMatch(/pas encore une installation durable/i);
  });

  it('une seule séance → first_session, pas « s’installe »', () => {
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(32, [{ date: '2026-10-02', total: 96, sets: [12, 12, 12, 12, 12, 12, 12, 12] }]),
      exerciseId: 32,
      exerciseName: 'Hyperextension',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(trajectory.installation.kind).toBe('first_session');
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.title).not.toMatch(/s'install/i);
  });
});

describe('buildExerciseTrajectory — témoins', () => {
  it('baisse isolée si témoins stables', () => {
    const subject = [36, 30, 24, 18, 12].map((total, i) => ({
      date: ymd(i * 5),
      total
    }));
    const peerA = [60, 60, 58, 60, 62].map((total, i) => ({ date: ymd(i * 5), total }));
    const peerB = [36, 36, 34, 36, 38].map((total, i) => ({ date: ymd(i * 5), total }));

    const checkedExercises = {};
    const reps = {};
    const put = (id, list) => {
      list.forEach((s) => {
        const key = `${s.date}_${id}`;
        checkedExercises[key] = true;
        reps[key] = String(s.total);
      });
    };
    put(100, subject);
    put(101, peerA);
    put(102, peerB);

    const getName = (id) =>
      ({ 100: 'Pompes déclinées', 101: 'Pompes (endurance)', 102: 'Dips' }[id] || `Exercice ${id}`);

    const trajectory = buildExerciseTrajectory({
      snapshot: { checkedExercises, reps },
      exerciseId: 100,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      getExerciseNameById: getName,
      mode: 'progress'
    });

    // Famille pushup/push — selon classifyMovement
    expect(trajectory.peers.available === false || ['localized', 'mixed', 'shared', 'insufficient'].includes(trajectory.peers.verdict)).toBe(
      true
    );
  });
});

describe('renderExerciseTrajectoryCopy', () => {
  it('n’invente pas de conclusion si trajectoire insufficiente', () => {
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(40, [{ date: '2026-10-01', total: 20 }]),
      exerciseId: 40,
      exerciseName: 'Curl',
      window: WINDOW,
      mode: 'progress'
    });
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.usedTrajectory).toBe(true);
    expect(copy.body.length).toBeGreaterThan(20);
    expect(copy.body).not.toMatch(/Si tes autres exercices/i);
    expect(copy.body).not.toMatch(/Il faudrait vérifier/i);
  });

  it('chiffres du mécanisme présents dans le texte quand sets disponibles', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(7), total: 36, sets: [12, 12, 12] },
      { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
      { date: ymd(21), total: 48, sets: [12, 12, 12, 12] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(41, sessions),
      exerciseId: 41,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(21) },
      mode: 'emergence'
    });
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.body).toMatch(/12/);
    expect(copy.body).toMatch(/série/i);
  });
});

describe('conclusions — baisses, reprises, outliers, sets, témoins', () => {
  it('baisse nette persistante : primaryStory net_decline, titre de constat, pas seulement « rebound »', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(5), total: 30, sets: [10, 10, 10] },
      { date: ymd(10), total: 24, sets: [8, 8, 8] },
      { date: ymd(15), total: 21, sets: [7, 7, 7] },
      { date: ymd(20), total: 18, sets: [6, 6, 6] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(50, sessions),
      exerciseId: 50,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    expect(trajectory.shape.primaryStory).toBe('net_decline');
    expect(trajectory.shape.deltaPct).toBeLessThanOrEqual(-40);
    expect(trajectory.setMechanism.kind).toBe('same_sets_fewer_reps');
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.title).toMatch(/deux fois moins|recule/i);
    expect(copy.title).not.toMatch(/^Pompes déclinées : baisse puis reprise$/i);
    expect(copy.body).toMatch(String(trajectory.shape.earlyMean).replace('.', '\\.'));
    expect(copy.body).toMatch(/19\.5|18|19/);
    expect(copy.body).toMatch(/série/i);
    expect(copy.body).toMatch(/-40|-47|%/);
  });

  it('creux puis reprise partielle : raconte le chemin sans effacer le recul net', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(4), total: 33, sets: [11, 11, 11] },
      { date: ymd(8), total: 12, sets: [4, 4, 4] },
      { date: ymd(12), total: 18, sets: [6, 6, 6] },
      { date: ymd(16), total: 21, sets: [7, 7, 7] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(51, sessions),
      exerciseId: 51,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(16) },
      mode: 'progress'
    });
    expect(['net_decline', 'partial_recovery']).toContain(trajectory.shape.primaryStory);
    expect(trajectory.shape.path).toMatch(/partial_recovery|progressive_decline|decline/);
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.body).toContain(String(trajectory.shape.earlyMean));
    expect(copy.body).toContain(String(trajectory.shape.lateMean));
    // Le niveau final reste sous le départ — pas un « retour réussi » seul
    expect(copy.title).not.toMatch(/retour au niveau de départ/i);
    expect(trajectory.shape.lateMean).toBeLessThan(trajectory.shape.earlyMean * 0.85);
    if (trajectory.shape.primaryStory === 'partial_recovery' || trajectory.shape.path === 'decline_then_partial_recovery') {
      expect(copy.body).toMatch(/creux|reprise partielle|retrait/i);
    }
  });

  it('reprise complète jusqu’au départ : primaryStory recovered', () => {
    const sessions = [
      { date: ymd(0), total: 36 },
      { date: ymd(5), total: 36 },
      { date: ymd(10), total: 10 },
      { date: ymd(15), total: 34 },
      { date: ymd(20), total: 36 }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(52, sessions),
      exerciseId: 52,
      exerciseName: 'Pompes',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    expect(['recovered', 'outlier_driven', 'plateau']).toContain(trajectory.shape.primaryStory);
    if (trajectory.shape.primaryStory === 'recovered') {
      const copy = renderExerciseTrajectoryCopy(trajectory);
      expect(copy.title).toMatch(/retour|repli|recul puis/i);
      expect(copy.body).toMatch(/creux/i);
    }
  });

  it('séance atypique : outlier_driven et stance watch', () => {
    const sessions = [
      { date: ymd(0), total: 30 },
      { date: ymd(5), total: 30 },
      { date: ymd(10), total: 90 },
      { date: ymd(15), total: 30 },
      { date: ymd(20), total: 30 }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(53, sessions),
      exerciseId: 53,
      exerciseName: 'Dips',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    const outlier =
      trajectory.shape.primaryStory === 'outlier_driven' ||
      trajectory.shape.withoutAtypical?.kind === 'outlier_driven';
    expect(outlier).toBe(true);
    expect(trajectory.findings.limits.some((l) => l.id === 'outlier')).toBe(true);
  });

  it('témoins stables + baisse locale → implication stabilize_at_recent_level', () => {
    const checkedExercises = {};
    const reps = {};
    const exerciseSetLogs = {};
    const put = (id, list) => {
      list.forEach((s) => {
        const key = `${s.date}_${id}`;
        checkedExercises[key] = true;
        reps[key] = String(s.total);
        if (s.sets) {
          exerciseSetLogs[key] = { sets: s.sets.map((r) => ({ reps: r })) };
        }
      });
    };
    put(
      60,
      [
        { date: ymd(0), total: 36, sets: [12, 12, 12] },
        { date: ymd(5), total: 30, sets: [10, 10, 10] },
        { date: ymd(10), total: 24, sets: [8, 8, 8] },
        { date: ymd(15), total: 18, sets: [6, 6, 6] },
        { date: ymd(20), total: 18, sets: [6, 6, 6] }
      ]
    );
    put(
      61,
      [60, 60, 58, 60, 62].map((total, i) => ({ date: ymd(i * 5), total }))
    );
    put(
      62,
      [36, 36, 34, 36, 38].map((total, i) => ({ date: ymd(i * 5), total }))
    );
    const getName = (id) =>
      ({ 60: 'Pompes déclinées', 61: 'Pompes (endurance)', 62: 'Dips' }[id] || `Exercice ${id}`);

    const trajectory = buildExerciseTrajectory({
      snapshot: { checkedExercises, reps, exerciseSetLogs },
      exerciseId: 60,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      getExerciseNameById: getName,
      mode: 'progress'
    });

    expect(trajectory.shape.primaryStory).toBe('net_decline');
    if (trajectory.peers.verdict === 'localized') {
      expect(trajectory.findings.implication?.ruleId).toBe('stabilize_at_recent_level_when_localized_decline');
      const copy = renderExerciseTrajectoryCopy(trajectory);
      expect(copy.body).toMatch(/stabiliser|volume récent/i);
      // Cible = niveau récent observé (~18), pas un milieu inventé ~27
      expect(copy.body).toMatch(/18|17|19/);
      expect(copy.body).not.toMatch(/autour de 27/);
    }
  });

  it('hyperextension : first_session vs installation avec séries transmises', () => {
    const firstOnly = buildExerciseTrajectory({
      snapshot: snapFromSessions(70, [{ date: ymd(0), total: 36, sets: [12, 12, 12] }]),
      exerciseId: 70,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'emergence'
    });
    expect(firstOnly.installation.kind).toBe('first_session');
    expect(firstOnly.sessions.inWindow.length).toBe(1);

    const installed = buildExerciseTrajectory({
      snapshot: snapFromSessions(71, [
        { date: ymd(0), total: 36, sets: [12, 12, 12] },
        { date: ymd(7), total: 36, sets: [12, 12, 12] },
        { date: ymd(14), total: 48, sets: [12, 12, 12, 12] },
        { date: ymd(21), total: 48, sets: [12, 12, 12, 12] },
        { date: ymd(28), total: 48, sets: [12, 12, 12, 12] }
      ]),
      exerciseId: 71,
      exerciseName: 'Hyperextension',
      window: { start: ymd(0), end: ymd(28) },
      mode: 'emergence'
    });
    expect(installed.installation.firstEver).toBe(true);
    expect(installed.setMechanism.kind).toBe('more_sets_same_reps');
    expect(installed.setMechanism.maintained).toBe(true);
    expect(installed.sessions.inWindow.length).toBe(5);
    const copy = renderExerciseTrajectoryCopy(installed);
    expect(copy.title).toMatch(/s'installe/i);
    expect(copy.body).toMatch(/3|4/);
    expect(copy.body).toMatch(/12/);
  });

  it('fenêtre 7j : contexte hors fenêtre distingué, sans présenter l’ancien comme récent', () => {
    const sessions = [
      { date: '2026-10-01', total: 36, sets: [12, 12, 12] },
      { date: '2026-10-08', total: 30, sets: [10, 10, 10] },
      { date: '2026-10-15', total: 24, sets: [8, 8, 8] },
      { date: '2026-10-22', total: 18, sets: [6, 6, 6] },
      { date: '2026-10-25', total: 18, sets: [6, 6, 6] },
      { date: '2026-10-28', total: 18, sets: [6, 6, 6] }
    ];
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(80, sessions),
      exerciseId: 80,
      exerciseName: 'Pompes déclinées',
      window: { start: '2026-10-23', end: '2026-10-29' },
      mode: 'progress'
    });
    expect(trajectory.temporalScope.interpretingWithHistory).toBe(true);
    expect(trajectory.temporalScope.contextSessionCountBeforeWindow).toBeGreaterThan(0);
    expect(trajectory.temporalScope.windowDates.every((d) => d >= '2026-10-23')).toBe(true);
    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.body).toMatch(/avant la fenêtre|dernières séances/i);
    expect(trajectory.shape.primaryStory).toBe('net_decline');
  });

  it('données insuffisantes : pas de mécanisme inventé', () => {
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(81, [{ date: ymd(0), total: 20 }]),
      exerciseId: 81,
      exerciseName: 'Curl',
      window: { start: ymd(0), end: ymd(7) },
      mode: 'progress'
    });
    expect(trajectory.setMechanism.available).toBe(false);
    expect(trajectory.findings.limits.some((l) => l.id === 'no_set_detail')).toBe(true);
  });
});

describe('P0 — pompes déclinées / références / témoins / séries', () => {
  const DECLINE_SESSIONS = [
    { date: '2026-09-07', total: 36, sets: [12, 12, 12] },
    { date: '2026-09-14', total: 36, sets: [12, 12, 12] },
    { date: '2026-10-01', total: 10 },
    { date: '2026-10-03', total: 10 },
    { date: '2026-10-14', total: 10 },
    { date: '2026-10-15', total: 10 },
    { date: '2026-10-19', total: 30 },
    { date: '2026-10-26', total: 36, sets: [12, 12, 12] }
  ];
  const DECLINE_WINDOW = { start: '2026-10-01', end: '2026-10-30' };

  it('moyenne fenêtre ≠ confondue avec lastPerformance ; reprise jugée sur la dernière séance', () => {
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(104, DECLINE_SESSIONS),
      exerciseId: 104,
      exerciseName: 'Pompes déclinées',
      window: DECLINE_WINDOW,
      mode: 'progress'
    });
    expect(trajectory.volume.meanPerSession).toBeCloseTo(17.7, 1);
    expect(trajectory.volume.windowSessionCount).toBe(6);
    expect(trajectory.shape.referenceLevels.lastPerformance).toBe(36);
    expect(trajectory.shape.referenceLevels.trough).toBe(10);
    expect(trajectory.shape.primaryStory).toBe('recovered');
    expect(trajectory.temporalScope.interpretingWithHistory).toBe(true);
    expect(trajectory.temporalScope.contextSessionCountBeforeWindow).toBe(2);

    const copy = renderExerciseTrajectoryCopy(trajectory);
    expect(copy.body).toMatch(/dernière séance.*36|revenue à ≈36/i);
    expect(copy.body).toMatch(/moyenne des dernières séances/i);
    expect(copy.body).not.toMatch(/revenu vers ≈25\.3/);
  });

  it('séries : pas de chevauchement before/after ; granularité partielle signalée', () => {
    const trajectory = buildExerciseTrajectory({
      snapshot: snapFromSessions(104, DECLINE_SESSIONS),
      exerciseId: 104,
      exerciseName: 'Pompes déclinées',
      window: DECLINE_WINDOW,
      mode: 'progress'
    });
    expect(trajectory.setMechanism.granularity).toBe('partial');
    expect(trajectory.setMechanism.totalsOnlySessions).toBeGreaterThanOrEqual(4);
    const beforeDates = new Set((trajectory.setMechanism.before?.sample || []).map((s) => s.date));
    const afterDates = (trajectory.setMechanism.after?.sample || []).map((s) => s.date);
    afterDates.forEach((d) => expect(beforeDates.has(d)).toBe(false));
    expect(trajectory.findings.limits.some((l) => l.id === 'partial_set_detail')).toBe(true);
    expect(trajectory.setMechanism.detail).toMatch(/total de répétitions|structure de séries/i);
  });

  it('dédupe les témoins qui partagent le même libellé entre eux', () => {
    const checkedExercises = {};
    const reps = {};
    const put = (id, list) => {
      list.forEach((s) => {
        const key = `${s.date}_${id}`;
        checkedExercises[key] = true;
        reps[key] = String(s.total);
      });
    };
    // Sujet : pompes inclinées en baisse
    put(900, [40, 30, 20, 15, 12].map((total, i) => ({ date: ymd(i * 5), total })));
    // Deux témoins même nom « Pompes déclinées », ids distincts
    put(104, [36, 36, 36, 36, 36].map((total, i) => ({ date: ymd(i * 5), total })));
    put(202, [40, 40, 40].map((total, i) => ({ date: ymd(i * 7), total })));
    const getName = (id) =>
      ({ 900: 'Pompes inclinées', 104: 'Pompes déclinées', 202: 'Pompes déclinées' }[id] || `Exercice ${id}`);
    const trajectory = buildExerciseTrajectory({
      snapshot: { checkedExercises, reps },
      exerciseId: 900,
      exerciseName: 'Pompes inclinées',
      window: { start: ymd(0), end: ymd(20) },
      getExerciseNameById: getName,
      mode: 'progress'
    });
    const declinedPeers = (trajectory.peers.items || []).filter((p) => p.name === 'Pompes déclinées');
    expect(declinedPeers.length).toBeLessThanOrEqual(1);
    expect(trajectory.peers.skippedSameLabel?.some((p) => p.reason === 'duplicate_peer_display_name')).toBe(true);
  });

  it('exclut le témoin homonyme (même nom, autre id)', () => {
    const checkedExercises = {};
    const reps = {};
    const exerciseSetLogs = {};
    const put = (id, list) => {
      list.forEach((s) => {
        const key = `${s.date}_${id}`;
        checkedExercises[key] = true;
        reps[key] = String(s.total);
        if (s.sets) exerciseSetLogs[key] = { sets: s.sets.map((r) => ({ reps: r })) };
      });
    };
    put(104, DECLINE_SESSIONS);
    // Homonyme : même libellé, autre id — ne doit PAS servir de témoin
    put(
      202,
      [
        { date: '2026-10-05', total: 40 },
        { date: '2026-10-12', total: 40 },
        { date: '2026-10-19', total: 40 }
      ]
    );
    put(
      466,
      [
        { date: '2026-10-04', total: 48 },
        { date: '2026-10-11', total: 48 },
        { date: '2026-10-18', total: 48 }
      ]
    );
    const getName = (id) =>
      ({
        104: 'Pompes déclinées',
        202: 'Pompes déclinées',
        466: 'Développé couché incliné aux haltères'
      }[id] || `Exercice ${id}`);

    const trajectory = buildExerciseTrajectory({
      snapshot: { checkedExercises, reps, exerciseSetLogs },
      exerciseId: 104,
      exerciseName: 'Pompes déclinées',
      window: DECLINE_WINDOW,
      getExerciseNameById: getName,
      mode: 'progress'
    });

    expect(trajectory.peers.skippedSameLabel?.some((p) => String(p.exerciseId) === '202')).toBe(true);
    expect((trajectory.peers.items || []).every((p) => String(p.exerciseId) !== '202')).toBe(true);
    expect((trajectory.peers.items || []).every((p) => p.name !== 'Pompes déclinées' || String(p.exerciseId) === '104')).toBe(
      true
    );
    if (trajectory.peers.available) {
      expect(trajectory.peers.verdict).not.toBe('localized_rise');
      expect(['localized_recovery', 'localized', 'mixed', 'shared', 'insufficient']).toContain(
        trajectory.peers.verdict
      );
    }
    const copy = renderExerciseTrajectoryCopy(trajectory);
    // Ne doit plus citer « Pompes déclinées (autour de 40 » comme témoin
    expect(copy.body).not.toMatch(/Pompes déclinées \(autour de 40/);
  });
});

describe('cas limites — installation / séries / reprise isolée', () => {
  it('une seule séance → first_session', () => {
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(201, [{ date: '2026-10-10', total: 30, sets: [10, 10, 10] }]),
      exerciseId: 201,
      exerciseName: 'Curl',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(t.installation.kind).toBe('first_session');
    expect(t.installation.stage == null || t.installation.stage === 'appearance' || !t.installation.stage).toBeTruthy();
  });

  it('deux séances espacées de moins de 7 jours → first_cluster (pas repeated)', () => {
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(202, [
        { date: '2026-10-10', total: 36, sets: [12, 12, 12] },
        { date: '2026-10-14', total: 36, sets: [12, 12, 12] }
      ]),
      exerciseId: 202,
      exerciseName: 'Curl',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(t.installation.kind).toBe('first_cluster');
    expect(t.installation.kind).not.toBe('repeated');
    expect(t.installation.kind).not.toBe('installing');
  });

  it('deux séances espacées ≥7 jours → repeated uniquement', () => {
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(203, [
        { date: '2026-10-10', total: 36, sets: [12, 12, 12] },
        { date: '2026-10-17', total: 36, sets: [12, 12, 12] }
      ]),
      exerciseId: 203,
      exerciseName: 'Curl',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(t.installation.kind).toBe('repeated');
    expect(['installing', 'installed']).not.toContain(t.installation.kind);
  });

  it('trois séances sur fenêtre courte (≥7j, <14j) → installing', () => {
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(204, [
        { date: '2026-10-10', total: 36, sets: [12, 12, 12] },
        { date: '2026-10-14', total: 36, sets: [12, 12, 12] },
        { date: '2026-10-18', total: 36, sets: [12, 12, 12] }
      ]),
      exerciseId: 204,
      exerciseName: 'Curl',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(t.installation.kind).toBe('installing');
    expect(t.installation.kind).not.toBe('repeated');
    expect(t.installation.kind).not.toBe('installed');
  });

  it('trois séances sur ≥14 jours → installed (volume stable)', () => {
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(205, [
        { date: '2026-10-02', total: 36, sets: [12, 12, 12] },
        { date: '2026-10-12', total: 36, sets: [12, 12, 12] },
        { date: '2026-10-22', total: 36, sets: [12, 12, 12] }
      ]),
      exerciseId: 205,
      exerciseName: 'Curl',
      window: WINDOW,
      mode: 'emergence'
    });
    expect(t.installation.kind).toBe('installed');
  });

  it('historique incomplet : pas de séries → granularity totals_only', () => {
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(206, [
        { date: ymd(0), total: 36 },
        { date: ymd(7), total: 30 },
        { date: ymd(14), total: 24 },
        { date: ymd(21), total: 20 }
      ]),
      exerciseId: 206,
      exerciseName: 'Pompes',
      window: { start: ymd(0), end: ymd(21) },
      mode: 'progress'
    });
    expect(t.setMechanism.available).toBe(false);
    expect(t.setMechanism.granularity).toBe('totals_only');
  });

  it('séries seulement avant le creux : pas d’affirmation de stabilité sur toute la trajectoire', () => {
    const sessions = [
      { date: ymd(0), total: 36, sets: [12, 12, 12] },
      { date: ymd(5), total: 36, sets: [12, 12, 12] },
      { date: ymd(10), total: 10 },
      { date: ymd(15), total: 10 },
      { date: ymd(20), total: 34 }
    ];
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(207, sessions),
      exerciseId: 207,
      exerciseName: 'Pompes déclinées',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    // Pas de séries après le creux → comparaison before/after creux impossible ou partielle
    if (t.setMechanism.available) {
      expect(['partial', 'full']).toContain(t.setMechanism.granularity);
    } else {
      expect(t.setMechanism.granularity).toMatch(/partial|totals_only/);
    }
    const copy = renderExerciseTrajectoryCopy(t);
    expect(copy.body).not.toMatch(/format de séries reste du même ordre(?!.*total)/i);
  });

  it('dernière perf isolée haute : recovered n’efface pas le fait que lateMean mélange le creux', () => {
    const sessions = [
      { date: ymd(0), total: 36 },
      { date: ymd(5), total: 36 },
      { date: ymd(10), total: 10 },
      { date: ymd(15), total: 10 },
      { date: ymd(20), total: 36 }
    ];
    const t = buildExerciseTrajectory({
      snapshot: snapFromSessions(208, sessions),
      exerciseId: 208,
      exerciseName: 'Pompes',
      window: { start: ymd(0), end: ymd(20) },
      mode: 'progress'
    });
    if (t.shape.primaryStory === 'recovered') {
      expect(t.shape.lastPerformance).toBe(36);
      expect(t.shape.lateMean).toBeLessThan(t.shape.lastPerformance);
      const copy = renderExerciseTrajectoryCopy(t);
      expect(copy.body).toMatch(/dernière séance|revenue à/i);
      expect(copy.body).toMatch(/n’est pas le niveau final|pas le niveau final/i);
    }
  });

  it('repeated / installing / installed sont mutuellement exclusifs sur les fixtures', () => {
    const kinds = ['repeated', 'installing', 'installed', 'first_session', 'first_cluster'];
    const samples = [
      buildExerciseTrajectory({
        snapshot: snapFromSessions(210, [{ date: '2026-10-10', total: 20 }]),
        exerciseId: 210,
        exerciseName: 'A',
        window: WINDOW,
        mode: 'emergence'
      }),
      buildExerciseTrajectory({
        snapshot: snapFromSessions(211, [
          { date: '2026-10-10', total: 20 },
          { date: '2026-10-12', total: 20 }
        ]),
        exerciseId: 211,
        exerciseName: 'B',
        window: WINDOW,
        mode: 'emergence'
      }),
      buildExerciseTrajectory({
        snapshot: snapFromSessions(212, [
          { date: '2026-10-10', total: 20 },
          { date: '2026-10-17', total: 20 }
        ]),
        exerciseId: 212,
        exerciseName: 'C',
        window: WINDOW,
        mode: 'emergence'
      }),
      buildExerciseTrajectory({
        snapshot: snapFromSessions(213, [
          { date: '2026-10-10', total: 20 },
          { date: '2026-10-14', total: 20 },
          { date: '2026-10-18', total: 20 }
        ]),
        exerciseId: 213,
        exerciseName: 'D',
        window: WINDOW,
        mode: 'emergence'
      }),
      buildExerciseTrajectory({
        snapshot: snapFromSessions(214, [
          { date: '2026-10-02', total: 20 },
          { date: '2026-10-12', total: 20 },
          { date: '2026-10-22', total: 20 }
        ]),
        exerciseId: 214,
        exerciseName: 'E',
        window: WINDOW,
        mode: 'emergence'
      })
    ];
    const got = samples.map((t) => t.installation.kind);
    expect(got).toEqual(['first_session', 'first_cluster', 'repeated', 'installing', 'installed']);
    // aucun chevauchement : chaque kind une seule fois
    expect(new Set(got).size).toBe(got.length);
    got.forEach((k) => expect(kinds).toContain(k));
  });
});
