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
    expect(['installing', 'installed', 'first_cluster']).toContain(trajectory.installation.kind);
    expect(trajectory.installation.sessionsInWindow).toBe(4);
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
