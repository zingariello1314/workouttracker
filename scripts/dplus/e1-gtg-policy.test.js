import { describe, expect, it } from 'vitest';
import { mergeEnduranceWithoutSilentWipe } from '../../src/services/endurance/enduranceWipeGuard.js';
import {
  mergeEndurancePreservingGtg,
  mergePassageLists,
  removeGtgPassage
} from './gtgPreservePolicy.mjs';

const passage = { id: 'ah_1', reps: 5 };
const previous = {
  sessions: {
    pushups: [{ id: 'pu_1', reps: 20 }],
    gtg: [passage]
  },
  challenges: [{ id: 'c1' }],
  gtg: {
    days: {
      '2026-06-01': { adHoc: [passage, { id: 'ah_2', reps: 3 }] }
    }
  }
};

describe('GTG — reproduction du garde-fou de production', () => {
  it('une liste sessions.gtg vide ne remplace plus l’existante', () => {
    const merged = mergeEnduranceWithoutSilentWipe(previous, {
      sessions: { gtg: [] },
      challenges: previous.challenges
    });
    expect(merged.sessions.gtg).toEqual([passage]);
  });

  it('un objet gtg vide ne remplace plus les jours existants', () => {
    const merged = mergeEnduranceWithoutSilentWipe(previous, { gtg: { days: {} } });
    expect(merged.gtg.days['2026-06-01'].adHoc).toHaveLength(2);
  });

  it('une liste pushups vide ne remplace pas les pompes', () => {
    const merged = mergeEnduranceWithoutSilentWipe(previous, { sessions: { pushups: [] } });
    expect(merged.sessions.pushups).toHaveLength(1);
  });
});

describe('GTG — politique expérimentale', () => {
  it('C1 C2 absence ou liste vide sans ordre explicite ne supprime rien', () => {
    const absent = mergeEndurancePreservingGtg(previous, { sessions: { pushups: [{ id: 'pu_2', reps: 1 }] } });
    expect(absent.sessions.gtg).toEqual([passage]);
    expect(absent.gtg.days['2026-06-01'].adHoc).toHaveLength(2);

    const emptyList = mergeEndurancePreservingGtg(previous, { sessions: { gtg: [] } });
    expect(emptyList.sessions.gtg).toEqual([passage]);

    const emptyObject = mergeEndurancePreservingGtg(previous, { gtg: { days: {} } });
    expect(emptyObject.gtg.days['2026-06-01'].adHoc).toHaveLength(2);
  });

  it('C3 une suppression explicite retire une entrée et garde l’autre', () => {
    const nextGtg = removeGtgPassage(previous.gtg, '2026-06-01', 'ah_1');
    expect(nextGtg.days['2026-06-01'].adHoc.map((item) => item.id)).toEqual(['ah_2']);
    const merged = mergeEndurancePreservingGtg(previous, { gtg: nextGtg });
    expect(merged.gtg.days['2026-06-01'].adHoc.map((item) => item.id)).toEqual(['ah_2']);
  });

  it('C4 l’effacement total exige le drapeau explicite', () => {
    const blocked = mergeEndurancePreservingGtg(previous, { gtg: { days: {} }, sessions: { gtg: [] } });
    expect(blocked.gtg.days['2026-06-01'].adHoc).toHaveLength(2);
    expect(blocked.sessions.gtg).toEqual([passage]);

    const allowed = mergeEndurancePreservingGtg(
      previous,
      { gtg: { days: {} }, sessions: { gtg: [] } },
      { explicitGtgClear: true }
    );
    expect(allowed.gtg.days).toEqual({});
    expect(allowed.sessions.gtg).toEqual([]);
  });

  it('C5 C6 C7 pompes et GTG ne s’effacent pas l’un l’autre', () => {
    const pushups = mergeEndurancePreservingGtg(previous, {
      sessions: { pushups: [{ id: 'pu_1', reps: 30 }] }
    });
    expect(pushups.sessions.pushups[0].reps).toBe(30);
    expect(pushups.sessions.gtg).toEqual([passage]);
    expect(pushups.gtg.days['2026-06-01'].adHoc).toHaveLength(2);

    const gtgEdit = mergeEndurancePreservingGtg(previous, {
      gtg: { days: { '2026-06-01': { adHoc: [passage] } } }
    });
    expect(gtgEdit.sessions.pushups[0].id).toBe('pu_1');
    expect(gtgEdit.gtg.days['2026-06-01'].adHoc).toHaveLength(1);
  });

  it('C8 un import vide ne remplace pas l’historique', () => {
    const imported = mergeEndurancePreservingGtg(previous, {
      sessions: { pushups: [], gtg: [] },
      gtg: { days: {} },
      challenges: []
    });
    expect(imported.sessions.pushups).toHaveLength(1);
    expect(imported.sessions.gtg).toEqual([passage]);
    expect(imported.gtg.days['2026-06-01'].adHoc).toHaveLength(2);
    expect(imported.challenges).toEqual([{ id: 'c1' }]);
  });

  it('C9 C10 C11 ajouts par id, réessai, données sans id', () => {
    const two = mergePassageLists([{ id: 'ah_1', reps: 5 }], [{ id: 'ah_2', reps: 3 }]);
    expect(two.entries.map((entry) => entry.id).sort()).toEqual(['ah_1', 'ah_2']);
    const retry = mergePassageLists(two.entries, [{ id: 'ah_2', reps: 3 }]);
    expect(retry.entries).toHaveLength(2);

    const legacy = mergePassageLists([{ reps: 5 }], [{ id: 'ah_2', reps: 3 }]);
    expect(legacy.status).toBe('refused');
    expect(legacy.entries).toEqual([{ reps: 5 }]);
  });
});
