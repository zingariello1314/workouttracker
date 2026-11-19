import { describe, expect, it, beforeEach } from 'vitest';
import {
  mergeEnduranceWithoutSilentWipe,
  restoreEnduranceIfWiped,
  writeEnduranceLocalBackup,
  hydratePushupSessionsFromWorkoutMirrors
} from '../enduranceWipeGuard';
import { persistEnduranceData } from '../enduranceDataService';

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

  const gtgPrevious = {
    sessions: {
      pushups: [{ id: 'pu_1', reps: 20 }],
      running: [{ id: 'run_1', distance: 5 }],
      gtg: [{ id: 'list_1', reps: 4 }]
    },
    challenges: [{ id: 'c1' }],
    gtg: {
      schemaNote: 'gardé',
      days: {
        '2026-06-01': { adHoc: [{ id: 'ah_1', reps: 5 }, { id: 'ah_2', reps: 3 }] },
        '2026-06-02': { adHoc: [{ id: 'ah_3', reps: 2 }] }
      }
    },
    customField: { keep: true }
  };

  it('refuse sessions.gtg vide et gtg.days vide sans ordre dédié', () => {
    const before = JSON.stringify(gtgPrevious);
    const incoming = {
      sessions: { gtg: [], pushups: [{ id: 'pu_1', reps: 30 }] },
      gtg: { days: {} },
      challenges: []
    };
    const incomingBefore = JSON.stringify(incoming);
    const next = mergeEnduranceWithoutSilentWipe(gtgPrevious, incoming);
    expect(next.sessions.gtg).toEqual([{ id: 'list_1', reps: 4 }]);
    expect(next.gtg.days['2026-06-01'].adHoc).toHaveLength(2);
    expect(next.sessions.pushups[0].reps).toBe(30);
    expect(next.sessions.running[0].id).toBe('run_1');
    expect(next.challenges).toEqual([{ id: 'c1' }]);
    expect(next.customField).toEqual({ keep: true });
    expect(JSON.stringify(gtgPrevious)).toBe(before);
    expect(JSON.stringify(incoming)).toBe(incomingBefore);
  });

  it('conserve le GTG absent et un héritage sans days', () => {
    const legacy = { sessions: { pushups: [{ id: 'pu_1' }] }, gtg: { foo: 1 } };
    const absent = mergeEnduranceWithoutSilentWipe(legacy, { sessions: { pushups: [{ id: 'pu_1' }] } });
    expect(absent.gtg).toEqual({ foo: 1 });
    const blank = mergeEnduranceWithoutSilentWipe(legacy, { gtg: { days: {} } });
    expect(blank.gtg).toEqual({ foo: 1 });
  });

  it('garde sessions.gtg quand une écriture de pompes omet la clé', () => {
    const next = mergeEnduranceWithoutSilentWipe(gtgPrevious, {
      sessions: { pushups: [{ id: 'pu_2', reps: 40 }] }
    });
    expect(next.sessions.gtg).toEqual([{ id: 'list_1', reps: 4 }]);
    expect(next.sessions.pushups[0].id).toBe('pu_2');
    expect(next.sessions.running[0].id).toBe('run_1');
    expect(next.gtg.days['2026-06-01'].adHoc).toHaveLength(2);
  });

  it('retire un passage ou une journée quand le snapshot contient encore des jours', () => {
    const onePassage = mergeEnduranceWithoutSilentWipe(gtgPrevious, {
      gtg: {
        days: {
          '2026-06-01': { adHoc: [{ id: 'ah_2', reps: 3 }] },
          '2026-06-02': { adHoc: [{ id: 'ah_3', reps: 2 }] }
        }
      }
    });
    expect(onePassage.gtg.days['2026-06-01'].adHoc.map((p) => p.id)).toEqual(['ah_2']);
    expect(onePassage.sessions.pushups[0].id).toBe('pu_1');

    const oneDay = mergeEnduranceWithoutSilentWipe(gtgPrevious, {
      gtg: { days: { '2026-06-02': { adHoc: [{ id: 'ah_3', reps: 2 }] } } }
    });
    expect(oneDay.gtg.days['2026-06-01']).toBeUndefined();
    expect(oneDay.gtg.days['2026-06-02'].adHoc[0].id).toBe('ah_3');
  });

  it('efface tout le GTG seulement avec explicitGtgClear, pas avec sessionTypesTouched', () => {
    const touched = mergeEnduranceWithoutSilentWipe(
      gtgPrevious,
      { sessions: { gtg: [] }, gtg: { days: {} } },
      { sessionTypesTouched: ['gtg'] }
    );
    expect(touched.sessions.gtg).toHaveLength(1);
    expect(touched.gtg.days['2026-06-01']).toBeTruthy();

    const cleared = mergeEnduranceWithoutSilentWipe(
      gtgPrevious,
      { sessions: { gtg: [] }, gtg: { days: {} } },
      { explicitGtgClear: true }
    );
    expect(cleared.sessions.gtg).toEqual([]);
    expect(cleared.gtg).toEqual({ days: {} });
    expect(cleared.sessions.pushups).toHaveLength(1);
    expect(cleared.sessions.running).toHaveLength(1);
  });

  it('ne concatène pas deux listes de pompes', () => {
    const next = mergeEnduranceWithoutSilentWipe(gtgPrevious, {
      sessions: { pushups: [{ id: 'pu_1', reps: 20 }] }
    });
    expect(next.sessions.pushups).toHaveLength(1);
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

describe('persistEnduranceData et le GTG', () => {
  const current = {
    enduranceData: {
      sessions: { pushups: [{ id: 'pu_1', reps: 20 }], gtg: [{ id: 'list_1' }] },
      challenges: [],
      gtg: { days: { '2026-06-01': { adHoc: [{ id: 'ah_1', reps: 5 }] } } }
    }
  };

  it('un patch vide ne retire pas le GTG, un patch explicite oui', async () => {
    const seen = [];
    const updateData = async (next) => {
      seen.push(next);
    };
    await persistEnduranceData({
      currentData: current,
      patch: { gtg: { days: {} }, sessions: { gtg: [] } },
      updateData
    });
    expect(seen[0].enduranceData.gtg.days['2026-06-01'].adHoc[0].id).toBe('ah_1');
    expect(seen[0].enduranceData.sessions.gtg).toEqual([{ id: 'list_1' }]);
    expect(seen[0].enduranceData.sessions.pushups[0].id).toBe('pu_1');
    expect(seen[0].enduranceData.explicitGtgClear).toBeUndefined();

    await persistEnduranceData({
      currentData: current,
      patch: { gtg: { days: {} }, sessions: { gtg: [] }, explicitGtgClear: true },
      updateData
    });
    expect(seen[1].enduranceData.gtg).toEqual({ days: {} });
    expect(seen[1].enduranceData.sessions.gtg).toEqual([]);
    expect(seen[1].enduranceData.sessions.pushups[0].id).toBe('pu_1');
    expect(seen[1].enduranceData.explicitGtgClear).toBeUndefined();
  });
});
