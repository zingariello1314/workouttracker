import { describe, expect, it, beforeEach } from 'vitest';
import {
  mergeEnduranceWithoutSilentWipe,
  restoreEnduranceIfWiped,
  writeEnduranceLocalBackup,
  hydratePushupSessionsFromWorkoutMirrors
} from '../enduranceWipeGuard';

describe('mergeEnduranceWithoutSilentWipe', () => {
  const previous = {
    sessions: {
      pushups: [{ id: 'a', date: '2026-08-01', count: 50 }],
      boxing: []
    },
    challenges: [{ id: 'c1', name: 'Défi pompes', status: 'active' }],
    gtg: { foo: 1 }
  };

  it('refuse d’écraser sessions pompes par [] sans toucher explicite', () => {
    const next = mergeEnduranceWithoutSilentWipe(previous, {
      sessions: { pushups: [], boxing: [] },
      challenges: []
    });
    expect(next.sessions.pushups).toHaveLength(1);
    expect(next.challenges).toHaveLength(1);
    expect(next.gtg).toEqual({ foo: 1 });
  });

  it('autorise le vide si le type est explicitement touché', () => {
    const next = mergeEnduranceWithoutSilentWipe(
      previous,
      { sessions: { pushups: [] } },
      { sessionTypesTouched: ['pushups'] }
    );
    expect(next.sessions.pushups).toHaveLength(0);
    expect(next.challenges).toHaveLength(1);
  });
});

describe('restoreEnduranceIfWiped', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('restaure depuis le backup localStorage', () => {
    writeEnduranceLocalBackup('main', {
      sessions: { pushups: [{ id: 's1', count: 80, date: '2026-08-10' }] },
      challenges: [{ id: 'c1', status: 'active' }]
    });
    const restored = restoreEnduranceIfWiped(
      { enduranceData: { sessions: { pushups: [] }, challenges: [] } },
      'main'
    );
    expect(restored.enduranceData.sessions.pushups[0].count).toBe(80);
    expect(restored.enduranceData.challenges).toHaveLength(1);
    expect(restored.enduranceData.restoredFromBackup).toBe(true);
  });

  it('reconstruit les sessions depuis complementary_endurance_pushups', () => {
    const restored = restoreEnduranceIfWiped(
      {
        checkedExercises: { '2026-08-11_complementary_endurance_pushups': true },
        reps: { '2026-08-11_complementary_endurance_pushups': '120' },
        enduranceData: { sessions: { pushups: [] }, challenges: [] }
      },
      'empty-scope'
    );
    expect(restored.enduranceData.sessions.pushups[0].count).toBe(120);
    expect(restored.enduranceData.restoredFromWorkoutMirror).toBe(true);
  });

  it('n’écrase pas des données encore présentes', () => {
    writeEnduranceLocalBackup('main', {
      sessions: { pushups: [{ id: 'old', count: 1 }] },
      challenges: []
    });
    const current = {
      enduranceData: {
        sessions: { pushups: [{ id: 'live', count: 40, date: '2026-08-10' }] },
        challenges: [{ id: 'live-c' }]
      }
    };
    const out = restoreEnduranceIfWiped(current, 'main');
    expect(out.enduranceData.sessions.pushups[0].id).toBe('live');
  });

  it('restaure les pompes même si course/défis existent déjà', () => {
    const restored = restoreEnduranceIfWiped(
      {
        checkedExercises: { '2026-07-30_complementary_endurance_pushups': true },
        reps: { '2026-07-30_complementary_endurance_pushups': '100' },
        enduranceData: {
          sessions: {
            pushups: [],
            running: [{ id: 'r1', date: '2026-07-30' }]
          },
          challenges: [{ id: 'c1' }]
        }
      },
      'scope-with-running'
    );
    expect(restored.enduranceData.sessions.pushups[0].count).toBe(100);
    expect(restored.enduranceData.sessions.running[0].id).toBe('r1');
    expect(restored.reps['2026-07-30_complementary_endurance_pushups']).toBe('100');
  });

  it('recoller les pompes depuis les coches même si d’autres défis existent déjà', () => {
    const restored = hydratePushupSessionsFromWorkoutMirrors({
      checkedExercises: { '2026-08-12_complementary_endurance_pushups': true },
      reps: { '2026-08-12_complementary_endurance_pushups': '100' },
      enduranceData: {
        sessions: {
          pushups: [],
          running: [{ id: 'run1', date: '2026-08-12', distance: 5 }]
        },
        challenges: [{ id: 'c1', status: 'active' }]
      }
    });
    expect(restored.reps['2026-08-12_complementary_endurance_pushups']).toBe('100');
    expect(restored.checkedExercises['2026-08-12_complementary_endurance_pushups']).toBe(true);
    expect(restored.enduranceData.sessions.pushups).toHaveLength(1);
    expect(restored.enduranceData.sessions.pushups[0].count).toBe(100);
    expect(restored.enduranceData.sessions.running).toHaveLength(1);
    expect(restored.enduranceData.repWorkoutSync['2026-08-12'].pushups).toBe(100);
  });
});
