/**
 * Résolution d’identité storage-first (réutilisable analyses / P3.2a).
 *
 * Ne fusionne jamais deux storageId distincts sur un homonyme.
 * Un nom résolu ≠ preuve anatomique (couche banque séparée).
 *
 * @module resolveStorageExerciseIdentity
 */

import { convertToStableNumericId } from '../workoutExerciseIdResolve.js';
import { exerciseDatabase, findExerciseInDatabase } from '../../data/exerciseDatabase';

export const IDENTITY_RESOLUTION_SOURCE = Object.freeze({
  DISPLAY_NAMES: 'exerciseDisplayNames',
  GETTER: 'getExerciseNameById',
  NAME_MAP_DIRECT: 'name_map_direct',
  REVERSE_STABLE_HASH: 'reverse_stable_hash',
  PROGRAM_ORIGINAL_ID: 'program_original_id',
  DB_KEY_PREFIX: 'db_key_prefix',
  DB_LOOKUP_BY_ID: 'db_lookup_by_id',
  COMPLEMENTARY_ENDURANCE_PUSHUPS: 'complementary_endurance_pushups',
  NONE: 'none'
});

export const IDENTITY_CONFIDENCE = Object.freeze({
  CERTAIN: 'certain',
  PROBABLE: 'probable',
  UNRESOLVED: 'unresolved'
});

const FALLBACK_RE = /^Exercice(\s|#)\d+$/i;

export function isFallbackExerciseLabel(name) {
  return FALLBACK_RE.test(String(name || '').trim());
}

/**
 * Index inverse : hash(stableNumeric(originalId)) → { originalId, name? }
 * Si collision de hash entre deux originalId distincts → entrée marquée ambiguous (non utilisée).
 *
 * @param {Iterable<string|number>|{[id:string]: string}} knownIdsOrNameMap
 */
export function buildReverseStableIdIndex(knownIdsOrNameMap) {
  /** @type {Map<string, { originalId: string, name: string|null, ambiguous?: boolean, collisionWith?: string }>} */
  const index = new Map();
  const isPlainMap =
    knownIdsOrNameMap &&
    typeof knownIdsOrNameMap === 'object' &&
    !Array.isArray(knownIdsOrNameMap) &&
    !(knownIdsOrNameMap instanceof Map) &&
    typeof knownIdsOrNameMap[Symbol.iterator] !== 'function';
  const entries = isPlainMap
    ? Object.entries(knownIdsOrNameMap)
    : knownIdsOrNameMap instanceof Map
      ? [...knownIdsOrNameMap.entries()]
      : [...(knownIdsOrNameMap || [])].map((id) => [String(id), null]);

  for (const [rawId, maybeName] of entries) {
    const originalId = String(rawId);
    if (!originalId) continue;
    // Ne pas hasher un id déjà purement numérique « programme court » comme original string
    // sauf s'il apparaît aussi comme clé string dans la map (ex. "101").
    const hash = String(convertToStableNumericId(originalId));
    const name =
      maybeName != null && String(maybeName).trim() && !isFallbackExerciseLabel(maybeName)
        ? String(maybeName).trim()
        : null;
    const prev = index.get(hash);
    if (prev && prev.originalId !== originalId) {
      index.set(hash, {
        originalId: prev.originalId,
        name: prev.name,
        ambiguous: true,
        collisionWith: originalId
      });
      continue;
    }
    if (!prev) {
      index.set(hash, { originalId, name });
    } else if (!prev.name && name) {
      index.set(hash, { originalId, name });
    }
  }
  return index;
}

function stripDbPrefix(storageId) {
  const s = String(storageId || '');
  if (s.startsWith('db_')) return s.slice(3);
  return null;
}

/**
 * @param {object} opts
 * @param {string|number} opts.storageId
 * @param {object|null} [opts.snapshot]
 * @param {Function|null} [opts.getExerciseNameById]
 * @param {Record<string,string>|null} [opts.nameById] map storageOrOriginal → name
 * @param {Map|null} [opts.reverseIndex] from buildReverseStableIdIndex
 * @param {Iterable<string>|null} [opts.knownOriginalIds] extra originals to hash
 */
export function resolveStorageExerciseIdentity({
  storageId,
  snapshot = null,
  getExerciseNameById = null,
  nameById = null,
  reverseIndex = null,
  knownOriginalIds = null
} = {}) {
  const id = String(storageId ?? '');
  const result = {
    storageId: id,
    resolvedName: null,
    originalId: null,
    exerciseBankKey: null,
    resolutionSource: IDENTITY_RESOLUTION_SOURCE.NONE,
    identityConfidence: IDENTITY_CONFIDENCE.UNRESOLVED,
    hashAmbiguous: false
  };

  if (!id) return result;

  const tryName = (name, source, extra = {}) => {
    const n = String(name || '').trim();
    if (!n || isFallbackExerciseLabel(n)) return false;
    result.resolvedName = n;
    result.resolutionSource = source;
    result.identityConfidence = IDENTITY_CONFIDENCE.CERTAIN;
    Object.assign(result, extra);
    return true;
  };

  // 1) Persisté snapshot
  const snapName = snapshot?.exerciseDisplayNames?.[id];
  if (tryName(snapName, IDENTITY_RESOLUTION_SOURCE.DISPLAY_NAMES)) {
    return finalizeBank(result);
  }

  // 2) Map directe (storage id ou clé originale) — avant getter, pour conserver originalId
  if (nameById && nameById[id] && tryName(nameById[id], IDENTITY_RESOLUTION_SOURCE.NAME_MAP_DIRECT, {
    originalId: id
  })) {
    return finalizeBank(result);
  }

  // 3) Reverse hash depuis index fourni ou construit
  let rev = reverseIndex;
  if (!rev) {
    const seed = { ...(nameById || {}) };
    if (knownOriginalIds) {
      for (const oid of knownOriginalIds) seed[String(oid)] = seed[String(oid)] || null;
    }
    rev = buildReverseStableIdIndex(seed);
  }
  const hit = rev.get(id) || rev.get(String(Number(id)));
  if (hit?.ambiguous) {
    result.hashAmbiguous = true;
    result.identityConfidence = IDENTITY_CONFIDENCE.PROBABLE;
    result.resolutionSource = IDENTITY_RESOLUTION_SOURCE.REVERSE_STABLE_HASH;
    // Ne pas attribuer de nom en cas de collision — évite fusion abusive
    return result;
  }
  if (hit?.name && tryName(hit.name, IDENTITY_RESOLUTION_SOURCE.REVERSE_STABLE_HASH, {
    originalId: hit.originalId
  })) {
    return finalizeBank(result);
  }
  if (hit?.originalId && nameById?.[hit.originalId]) {
    if (
      tryName(nameById[hit.originalId], IDENTITY_RESOLUTION_SOURCE.REVERSE_STABLE_HASH, {
        originalId: hit.originalId
      })
    ) {
      return finalizeBank(result);
    }
  }
  if (hit?.originalId && !hit.name) {
    result.originalId = hit.originalId;
    result.resolutionSource = IDENTITY_RESOLUTION_SOURCE.PROGRAM_ORIGINAL_ID;
    result.identityConfidence = IDENTITY_CONFIDENCE.PROBABLE;
  }

  // 4) db_* → clé banque (underscore / espaces / lookup flexible)
  const dbKey = stripDbPrefix(id);
  if (dbKey) {
    const candidates = [dbKey, dbKey.replace(/_/g, ' '), dbKey.replace(/_/g, '-')];
    for (const cand of candidates) {
      if (exerciseDatabase[cand]) {
        const dbName = exerciseDatabase[cand].name || cand;
        if (
          tryName(dbName, IDENTITY_RESOLUTION_SOURCE.DB_KEY_PREFIX, {
            originalId: id,
            exerciseBankKey: cand
          })
        ) {
          return finalizeBank(result);
        }
      }
    }
    try {
      const flex = findExerciseInDatabase(dbKey.replace(/_/g, ' '));
      if (flex?.name) {
        const bankKey =
          Object.keys(exerciseDatabase).find((k) => exerciseDatabase[k] === flex) || null;
        if (
          tryName(flex.name, IDENTITY_RESOLUTION_SOURCE.DB_KEY_PREFIX, {
            originalId: id,
            exerciseBankKey: bankKey
          })
        ) {
          return finalizeBank(result);
        }
      }
    } catch {
      /* ignore */
    }
    result.originalId = result.originalId || id;
    result.resolutionSource = IDENTITY_RESOLUTION_SOURCE.DB_KEY_PREFIX;
    result.identityConfidence = IDENTITY_CONFIDENCE.PROBABLE;
    return result;
  }

  // 5) Complémentaire endurance
  if (id === 'complementary_endurance_pushups') {
    tryName(
      'Pompes endurance (complémentaire)',
      IDENTITY_RESOLUTION_SOURCE.COMPLEMENTARY_ENDURANCE_PUSHUPS,
      { originalId: id, exerciseBankKey: guessPushupBankKey() }
    );
    return finalizeBank(result);
  }

  // 6) Getter runtime (souvent sans originalId — après les sources structurées)
  if (typeof getExerciseNameById === 'function') {
    const g = getExerciseNameById(id) || getExerciseNameById(Number(id));
    if (tryName(g, IDENTITY_RESOLUTION_SOURCE.GETTER)) return finalizeBank(result);
  }

  // 7) Lookup banque par id string brute
  try {
    const dbHit = findExerciseInDatabase(id);
    if (dbHit?.name && tryName(dbHit.name, IDENTITY_RESOLUTION_SOURCE.DB_LOOKUP_BY_ID)) {
      return finalizeBank(result);
    }
  } catch {
    /* ignore */
  }

  if (id && !result.resolvedName) {
    result.identityConfidence = IDENTITY_CONFIDENCE.PROBABLE;
  }
  return result;
}

function guessPushupBankKey() {
  if (exerciseDatabase.pompes) return 'pompes';
  if (exerciseDatabase.pushups) return 'pushups';
  return null;
}

function finalizeBank(result) {
  if (!result.exerciseBankKey && result.resolvedName) {
    // Lien banque optionnel via nom — confiance anatomique évaluée ailleurs
    const key = Object.keys(exerciseDatabase).find(
      (k) =>
        String(exerciseDatabase[k]?.name || '').toLowerCase().trim() ===
        String(result.resolvedName).toLowerCase().trim()
    );
    if (key) result.exerciseBankKey = key;
  }
  return result;
}

/**
 * Construit un getter compatible getExerciseNameById à partir d’une name map (+ reverse hash).
 */
export function createNameResolverFromMaps(nameById = {}, knownOriginalIds = null) {
  const reverseIndex = buildReverseStableIdIndex({
    ...nameById,
    ...Object.fromEntries([...(knownOriginalIds || [])].map((id) => [String(id), nameById[id] || null]))
  });
  return (storageId) => {
    const r = resolveStorageExerciseIdentity({
      storageId,
      nameById,
      reverseIndex
    });
    return r.resolvedName || '';
  };
}
