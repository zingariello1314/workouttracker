import { describe, expect, it } from 'vitest';
import {
  mergeEntriesById,
  mergePatch,
  retainNewerDrafts
} from './threeWayMerge.mjs';

const TOMBSTONE = { deleted: true };

describe('fusion à trois versions', () => {
  it('fusionne deux clés indépendantes', () => {
    const result = mergePatch({
      baseMap: { tractions: 10, dips: 10 },
      localPatch: { tractions: 12 },
      remoteMap: { tractions: 10, dips: 15 }
    });
    expect(result.status).toBe('ok');
    expect(result.next).toEqual({ tractions: 12, dips: 15 });
  });

  it('signale un conflit sur la même clé sans écraser le canonique', () => {
    const result = mergePatch({
      baseMap: { tractions: 10 },
      localPatch: { tractions: 12 },
      remoteMap: { tractions: 15 }
    });
    expect(result.status).toBe('conflict');
    expect(result.draftKept).toBe(true);
    expect(result.next.tractions).toBe(15);
    expect(result.conflicts[0].local).toBe(12);
  });

  it('accepte deux écritures identiques sans doublon', () => {
    const result = mergePatch({
      baseMap: { tractions: 10 },
      localPatch: { tractions: 12 },
      remoteMap: { tractions: 12 }
    });
    expect(result.status).toBe('ok');
    expect(result.next).toEqual({ tractions: 12 });
  });

  it('oppose une suppression explicite à une modification', () => {
    const result = mergePatch({
      baseMap: { tractions: 10 },
      localPatch: { tractions: TOMBSTONE },
      remoteMap: { tractions: 15 }
    });
    expect(result.status).toBe('conflict');
    expect(result.next.tractions).toBe(15);
  });

  it('fait converger deux suppressions', () => {
    const result = mergePatch({
      baseMap: { tractions: 10 },
      localPatch: { tractions: TOMBSTONE },
      remoteMap: {}
    });
    expect(result.status).toBe('ok');
    expect(result.next.tractions).toBeUndefined();
  });

  it('rejette tout un groupe si une clé du groupe est en conflit', () => {
    const result = mergePatch({
      baseMap: { '2026-06-01_1': false, '2026-06-01_1_reps': '10' },
      localPatch: { '2026-06-01_1': true, '2026-06-01_1_reps': '12' },
      remoteMap: { '2026-06-01_1': false, '2026-06-01_1_reps': '15' },
      groups: (key) => key.split('_reps')[0]
    });
    expect(result.status).toBe('conflict');
    expect(result.next['2026-06-01_1']).toBe(false);
    expect(result.next['2026-06-01_1_reps']).toBe('15');
    expect(result.conflicts).toHaveLength(2);
  });

  it('applique un patch quand la ligne canonique est absente', () => {
    const result = mergePatch({
      baseMap: {},
      localPatch: { tractions: 12 },
      remoteMap: null
    });
    expect(result.status).toBe('ok');
    expect(result.next).toEqual({ tractions: 12 });
  });
});

describe('générations de brouillon', () => {
  it('ne retire pas la génération N+1 quand N est confirmée', () => {
    const kept = retainNewerDrafts(
      {
        a: { generation: 4, patch: { tractions: true } },
        b: { generation: 5, patch: { dips: true } }
      },
      4
    );
    expect(kept.a).toBeUndefined();
    expect(kept.b.patch).toEqual({ dips: true });
  });
});

describe('entrées par identifiant', () => {
  it('unit deux ajouts d’identifiants distincts', () => {
    const result = mergeEntriesById(
      [{ id: 'ah_1', reps: 5 }],
      [{ id: 'ah_2', reps: 3 }]
    );
    expect(result.status).toBe('ok');
    expect(result.entries.map((e) => e.id).sort()).toEqual(['ah_1', 'ah_2']);
  });

  it('ne duplique pas le même identifiant', () => {
    const entry = { id: 'ah_1', reps: 5 };
    const result = mergeEntriesById([entry], [{ ...entry }]);
    expect(result.status).toBe('ok');
    expect(result.entries).toHaveLength(1);
  });

  it('signale deux corps différents pour le même identifiant', () => {
    const result = mergeEntriesById(
      [{ id: 'ah_1', reps: 5 }],
      [{ id: 'ah_1', reps: 8 }]
    );
    expect(result.status).toBe('conflict');
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].reps).toBe(5);
  });
});
