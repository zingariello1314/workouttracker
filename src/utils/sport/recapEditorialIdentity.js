/**
 * F5.1 — Identité historique vs similarité (sélection éditoriale).
 *
 * Ne fusionne jamais deux storageId distincts sur un simple homonyme.
 * Aligné sur resolveStorageExerciseIdentity : nom ≠ preuve d’identité.
 */

import { sameMovementName, movementKey, pushupFamily } from './recapExerciseIdentity';
import { resolveExerciseNameForRecap, userFacingExerciseLabel } from './recapStrengthPeriodStats';

/** Relations entre deux découvertes / exercices. */
export const IDENTITY_RELATION = Object.freeze({
  SAME_EXERCISE: 'sameExerciseIdentity',
  SAME_MOVEMENT_FAMILY: 'sameMovementFamily',
  SAME_DISPLAY_NAME: 'sameDisplayName',
  SAME_HISTORICAL_EPISODE: 'sameHistoricalEpisode',
  DISTINCT: 'distinct',
  INDETERMINATE: 'indeterminate'
});

/**
 * Alias prouvés portés par la carte (jamais déduits du seul nom).
 * Sources acceptées : metrics.identityAliases, canonicalExerciseId lié,
 * originalId + storageId pairés explicitement, provenAliasOf.
 */
export function provenIdentityIdSet(d) {
  const ids = new Set();
  const push = (v) => {
    if (v == null || v === '') return;
    ids.add(String(v));
  };
  const m = d?.metrics || {};
  push(m.exerciseId);
  push(m.storageId);
  push(m.canonicalExerciseId);
  push(m.originalId);
  push(m.provenAliasOf);
  if (Array.isArray(m.identityAliases)) {
    m.identityAliases.forEach(push);
  }
  if (Array.isArray(m.provenIdentityIds)) {
    m.provenIdentityIds.forEach(push);
  }
  // Lien explicite producteur : { aliasOf: '103', proof: '...' }
  if (m.identityLink?.aliasOf != null && m.identityLink?.proven === true) {
    push(m.identityLink.aliasOf);
  }
  return ids;
}

/** Clé d’identité pour rivalité : storage / alias prouvé — jamais le nom seul. */
export function exerciseIdentityKey(d) {
  const m = d?.metrics || {};
  const id = m.exerciseId ?? m.storageId;
  if (id != null && String(id) !== '') return `ex:${String(id)}`;
  // Sans id : indéterminé — pas de clé nom (éviter fausse fusion)
  return null;
}

export function displayNameOf(d) {
  const raw = String(
    d?.metrics?.f4Narration?.resolvedName ||
      d?.metrics?.historicalDisplayName ||
      d?.metrics?.name ||
      d?.metrics?.exerciseName ||
      ''
  ).trim();
  if (raw && !/^un mouvement$/i.test(raw)) return raw;
  return null;
}

/**
 * Relie deux cartes. Ne retourne SAME_EXERCISE que sur preuve.
 */
export function relateExerciseIdentities(a, b) {
  const idsA = provenIdentityIdSet(a);
  const idsB = provenIdentityIdSet(b);
  const idA = a?.metrics?.exerciseId != null ? String(a.metrics.exerciseId) : null;
  const idB = b?.metrics?.exerciseId != null ? String(b.metrics.exerciseId) : null;

  if (idA && idB && idA === idB) {
    return { relation: IDENTITY_RELATION.SAME_EXERCISE, proof: 'same_storage_id', idA, idB };
  }

  if (idA && idB && idA !== idB) {
    if (idsA.has(idB) || idsB.has(idA)) {
      return {
        relation: IDENTITY_RELATION.SAME_EXERCISE,
        proof: 'explicit_proven_alias',
        idA,
        idB
      };
    }
    for (const x of idsA) {
      if (x !== idA && idsB.has(x) && x !== idB) {
        return {
          relation: IDENTITY_RELATION.SAME_EXERCISE,
          proof: 'explicit_proven_alias',
          idA,
          idB,
          shared: x
        };
      }
    }
  }

  if (!idA || !idB) {
    return {
      relation: IDENTITY_RELATION.INDETERMINATE,
      proof: 'missing_storage_id',
      idA,
      idB
    };
  }

  const nameA = displayNameOf(a);
  const nameB = displayNameOf(b);
  if (nameA && nameB && nameA.toLowerCase() === nameB.toLowerCase()) {
    return {
      relation: IDENTITY_RELATION.SAME_DISPLAY_NAME,
      proof: 'display_name_only_not_identity',
      idA,
      idB,
      name: nameA
    };
  }

  // Famille biomécanique (ex. toutes pompes) ≠ identité d’exercice
  const pushA = pushupFamily(nameA);
  const pushB = pushupFamily(nameB);
  if (pushA && pushB) {
    return {
      relation: IDENTITY_RELATION.SAME_MOVEMENT_FAMILY,
      proof: `pushup_family:${pushA}|${pushB}`,
      idA,
      idB
    };
  }
  if (nameA && nameB && sameMovementName(nameA, nameB)) {
    return {
      relation: IDENTITY_RELATION.SAME_MOVEMENT_FAMILY,
      proof: `movement_key:${movementKey(nameA) || 'exact'}`,
      idA,
      idB
    };
  }

  return {
    relation: IDENTITY_RELATION.DISTINCT,
    proof: 'different_storage_ids',
    idA,
    idB
  };
}

export function sameExerciseIdentity(a, b) {
  return relateExerciseIdentities(a, b).relation === IDENTITY_RELATION.SAME_EXERCISE;
}

/**
 * Épisode historique commun : même identité + continuité / fenêtre compatible.
 */
export function sameHistoricalEpisode(a, b) {
  if (!sameExerciseIdentity(a, b)) return false;
  const ca = a?.metrics?.composedEvidence?.continuity?.kind;
  const cb = b?.metrics?.composedEvidence?.continuity?.kind;
  const returnLike = new Set(['punctual_return', 'confirmed_return', 'returning', 'decline_then_recovery']);
  if (ca && cb && returnLike.has(ca) && returnLike.has(cb)) return true;
  // Même primaryStory de reprise
  const sa = a?.metrics?.trajectoryPrimaryStory;
  const sb = b?.metrics?.trajectoryPrimaryStory;
  if (sa && sb && sa === sb && (sa === 'partial_recovery' || sa === 'recovered')) return true;
  // Reprises / interruptions : deux gaps (42 j vs 77 j) sur le même mouvement = un seul épisode
  // si les titres ou gapDays racontent un retour, même sans continuity taguée.
  const titleReturn = (d) =>
    /revient|réapparition|interruption|long silence|après \d+\s*jours/i.test(
      `${d?.title || ''} ${d?.body || ''}`
    );
  const kindReturn = (d) =>
    /disc_ms_return|disc_emergence|disc_structural_memory/.test(String(d?.kind || ''));
  if ((titleReturn(a) || kindReturn(a)) && (titleReturn(b) || kindReturn(b))) {
    return true;
  }
  return false;
}

/**
 * Fenêtres / sous-ensembles suffisamment comparables pour parler de contradiction.
 */
export function measuresComparableForContradiction(a, b) {
  const wa = a?.metrics?.composedEvidence?.windows || a?.metrics?.temporalScope || null;
  const wb = b?.metrics?.composedEvidence?.windows || b?.metrics?.temporalScope || null;
  if (!wa && !wb) return { ok: true, reason: 'no_window_tags' };

  const spanA = wa?.selected?.spanDays ?? wa?.windowSpanDays ?? wa?.spanDays ?? null;
  const spanB = wb?.selected?.spanDays ?? wb?.windowSpanDays ?? wb?.spanDays ?? null;
  if (spanA != null && spanB != null && Math.abs(Number(spanA) - Number(spanB)) > 14) {
    return { ok: false, reason: 'different_window_spans' };
  }

  const subsetA = wa?.subsetKey || wa?.observationSubset || a?.metrics?.observationSubset || null;
  const subsetB = wb?.subsetKey || wb?.observationSubset || b?.metrics?.observationSubset || null;
  if (subsetA && subsetB && String(subsetA) !== String(subsetB)) {
    return { ok: false, reason: 'different_subsets' };
  }

  return { ok: true, reason: 'comparable' };
}

/**
 * Tente de réparer un libellé « un mouvement » via id historique / banque —
 * sans inventer d’alias entre storage ids.
 */
function looksLikeDraftTitleNotExerciseName(label) {
  const s = String(label || '').trim();
  if (!s) return true;
  if (/^Tu reprends\b/i.test(s)) return true;
  if (/^Première apparition\b/i.test(s)) return true;
  if (/^après \d+\s*jours/i.test(s)) return true;
  if (/\brevient après\b/i.test(s) && /\bjours\b/i.test(s)) return true;
  if (/volume par séance|meilleure série|jalon sous/i.test(s)) return true;
  return false;
}

export function repairDisplayNameFromIdentity(d, getExerciseNameById = null) {
  const m = d?.metrics || {};
  const id = m.exerciseId ?? m.storageId;
  const rawCurrent = String(m.exerciseName || m.name || m.f4Narration?.resolvedName || '').trim();
  const current = looksLikeDraftTitleNotExerciseName(rawCurrent) ? '' : rawCurrent;
  if (current && !/^un mouvement$/i.test(current)) {
    return {
      name: current,
      status: 'name_present',
      identityStatus: id != null ? 'identity_present' : 'identity_missing'
    };
  }
  if (id == null || id === '') {
    return { name: null, status: 'name_missing', identityStatus: 'identity_missing' };
  }
  if (m.identityConfidence === 'ambiguous' || m.hashAmbiguous) {
    return { name: null, status: 'name_missing', identityStatus: 'identity_ambiguous' };
  }
  const resolved = resolveExerciseNameForRecap(id, getExerciseNameById);
  const facing = userFacingExerciseLabel(resolved, id);
  if (facing && facing !== 'un mouvement') {
    return {
      name: facing,
      status: 'name_repaired_from_historical_id',
      identityStatus: 'identity_present',
      storageId: String(id)
    };
  }
  // Identité présente mais hors programme actuel / map
  return {
    name: null,
    status: 'name_missing',
    identityStatus: 'identity_present_name_unresolved',
    storageId: String(id)
  };
}

export function classifyNameIdentityStatus(d) {
  const repaired = repairDisplayNameFromIdentity(d);
  return repaired;
}
