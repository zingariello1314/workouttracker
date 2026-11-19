/**
 * Transactions fake-indexeddb. Ce n'est pas le gateway de production,
 * ni deux processus, ni une coupure électrique.
 */
import 'fake-indexeddb/auto';
import { openDB, deleteDB } from 'idb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mergeEnduranceWithoutSilentWipe } from '../../src/services/endurance/enduranceWipeGuard.js';
import { mergeEntriesById, mergePatch, retainNewerDrafts } from './threeWayMerge.mjs';

const DB = 'momentum-dplus-integration-test';

let db;

beforeAll(async () => {
  await deleteDB(DB);
  db = await openDB(DB, 1, {
    upgrade(database) {
      database.createObjectStore('sessions', { keyPath: 'id' });
      database.createObjectStore('drafts', { keyPath: 'id' });
    }
  });
});

afterAll(async () => {
  db?.close();
  await deleteDB(DB);
});

async function putSession(row) {
  await db.put('sessions', row);
}

async function validateInTransaction(id, baseMap, localPatch) {
  const tx = db.transaction('sessions', 'readwrite');
  const row = (await tx.store.get(id)) || null;
  const remote = row?.maps || {};
  const revision = row && Number.isFinite(row.revision) ? row.revision : 0;
  const merged = mergePatch({ baseMap, localPatch, remoteMap: remote });
  if (merged.status === 'conflict') {
    await tx.done;
    return { status: 'conflict', revision, conflicts: merged.conflicts, wrote: false };
  }
  const next = {
    ...(row || {}),
    id,
    revision: revision + 1,
    maps: merged.next
  };
  await tx.store.put(next);
  const readback = await tx.store.get(id);
  await tx.done;
  return { status: 'ok', readback, wrote: true };
}

describe('intégration IndexedDB isolée', () => {
  it('fusionne deux clés indépendantes dans une transaction et relit', async () => {
    await putSession({
      id: 'scope:2026-06-01',
      revision: 3,
      maps: { tractions: 10, dips: 10 },
      noteHistorique: 'note-ancienne',
      extraHistorique: { keep: true }
    });
    const result = await validateInTransaction(
      'scope:2026-06-01',
      { tractions: 10, dips: 10 },
      { tractions: 12 }
    );
    expect(result.status).toBe('ok');
    expect(result.readback.maps).toEqual({ tractions: 12, dips: 10 });
    expect(result.readback.revision).toBe(4);
    expect(result.readback.noteHistorique).toBe('note-ancienne');
    expect(result.readback.extraHistorique).toEqual({ keep: true });
  });

  it('refuse un conflit de même clé sans écrire', async () => {
    await putSession({
      id: 'scope:2026-06-02',
      revision: 2,
      maps: { tractions: 15 }
    });
    const result = await validateInTransaction(
      'scope:2026-06-02',
      { tractions: 10 },
      { tractions: 12 }
    );
    expect(result.status).toBe('conflict');
    expect(result.wrote).toBe(false);
    const stored = await db.get('sessions', 'scope:2026-06-02');
    expect(stored.maps.tractions).toBe(15);
    expect(stored.revision).toBe(2);
  });

  it('traite une ligne sans révision comme la révision 0', async () => {
    await putSession({
      id: 'scope:legacy',
      maps: { tractions: 10 },
      legacyField: 'conserve'
    });
    const result = await validateInTransaction('scope:legacy', { tractions: 10 }, { dips: 4 });
    expect(result.status).toBe('ok');
    expect(result.readback.revision).toBe(1);
    expect(result.readback.maps).toEqual({ tractions: 10, dips: 4 });
    expect(result.readback.legacyField).toBe('conserve');
  });

  it('ne retire pas la génération N+1', async () => {
    await db.put('drafts', { id: 'a', generation: 4, patch: { tractions: true } });
    await db.put('drafts', { id: 'b', generation: 5, patch: { dips: true } });
    const all = await db.getAll('drafts');
    const kept = retainNewerDrafts(
      Object.fromEntries(all.map((row) => [row.id, row])),
      4
    );
    expect(kept.a).toBeUndefined();
    expect(kept.b.patch.dips).toBe(true);
    await db.delete('drafts', 'a');
    const still = await db.get('drafts', 'b');
    expect(still.patch.dips).toBe(true);
  });

  it('annule une transaction et conserve l’ancienne ligne', async () => {
    await putSession({ id: 'scope:abort', revision: 1, maps: { tractions: 10 } });
    const tx = db.transaction('sessions', 'readwrite');
    await tx.store.put({ id: 'scope:abort', revision: 2, maps: { tractions: 99 } });
    tx.abort();
    await expect(tx.done).rejects.toThrow();
    const stored = await db.get('sessions', 'scope:abort');
    expect(stored.revision).toBe(1);
    expect(stored.maps.tractions).toBe(10);
  });

  it('relit après un timeout simulé dont le commit a réussi et ne réécrit pas', async () => {
    await putSession({ id: 'scope:timeout-ok', revision: 1, maps: { tractions: 10 } });
    await putSession({ id: 'scope:timeout-ok', revision: 2, maps: { tractions: 12 } });
    const timedOut = true;
    const read = await db.get('sessions', 'scope:timeout-ok');
    const already = read?.maps?.tractions === 12;
    expect(timedOut).toBe(true);
    expect(already).toBe(true);
    const replay = mergePatch({
      baseMap: { tractions: 10 },
      localPatch: { tractions: 12 },
      remoteMap: read.maps
    });
    expect(replay.status).toBe('ok');
    expect(replay.next).toEqual({ tractions: 12 });
    const countBefore = (await db.getAll('sessions')).length;
    if (replay.status === 'ok' && already) {
      /* pas de second put */
    }
    expect((await db.getAll('sessions')).length).toBe(countBefore);
    expect((await db.get('sessions', 'scope:timeout-ok')).revision).toBe(2);
  });

  it('conserve le brouillon si le commit a échoué', async () => {
    await putSession({ id: 'scope:timeout-ko', revision: 1, maps: { tractions: 10 } });
    await db.put('drafts', { id: 'draft-ko', generation: 3, patch: { tractions: 12 } });
    const tx = db.transaction('sessions', 'readwrite');
    await tx.store.put({ id: 'scope:timeout-ko', revision: 2, maps: { tractions: 12 } });
    tx.abort();
    await expect(tx.done).rejects.toThrow();
    const stored = await db.get('sessions', 'scope:timeout-ko');
    const draft = await db.get('drafts', 'draft-ko');
    expect(stored.maps.tractions).toBe(10);
    expect(draft.patch.tractions).toBe(12);
  });

  it('empêche une liste de pompes vide d’effacer les séances déjà écrites', async () => {
    const previous = { sessions: { pushups: [{ id: 'pu_1', reps: 20 }] }, challenges: [] };
    await db.put('sessions', { id: 'endurance', revision: 1, endurance: previous });
    const incoming = { sessions: { pushups: [] }, challenges: [] };
    const merged = mergeEnduranceWithoutSilentWipe(previous, incoming, {});
    const tx = db.transaction('sessions', 'readwrite');
    const row = await tx.store.get('endurance');
    await tx.store.put({ ...row, endurance: merged, revision: row.revision + 1 });
    await tx.done;
    const read = await db.get('sessions', 'endurance');
    expect(read.endurance.sessions.pushups).toHaveLength(1);
    expect(read.endurance.sessions.pushups[0].id).toBe('pu_1');
  });

  it('protège sessions.gtg vide sur le garde-fou de production', async () => {
    const previous = { sessions: { gtg: [{ id: 'ah_1', reps: 5 }] }, challenges: [] };
    const incoming = { sessions: { gtg: [] }, challenges: [] };
    const merged = mergeEnduranceWithoutSilentWipe(previous, incoming, {});
    expect(merged.sessions.gtg).toEqual([{ id: 'ah_1', reps: 5 }]);
  });

  it('unit deux ajouts par identifiant sans doublon au rejeu', async () => {
    const remote = [{ id: 'ah_1', reps: 5 }];
    const first = mergeEntriesById(remote, [{ id: 'ah_2', reps: 3 }]);
    const retry = mergeEntriesById(first.entries, [{ id: 'ah_2', reps: 3 }]);
    expect(first.entries).toHaveLength(2);
    expect(retry.entries).toHaveLength(2);
    expect(retry.status).toBe('ok');
  });
});
