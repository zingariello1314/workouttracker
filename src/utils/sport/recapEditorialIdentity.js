/**
 * F5.1 — Identité historique vs similarité (sélection éditoriale).
 *
 * Ne fusionne jamais deux storageId distincts sur un simple homonyme.
 * Aligné sur resolveStorageExerciseIdentity : nom ≠ preuve d’identité.
 */

import { sameMovementName, movementKey, pushupFamily } from './recapExerciseIdentity';
import { resolveExerciseNameForRecap, userFacingExerciseLabel } from './recapStrengthPeriodStats';
import { resolveStorageExerciseIdentity } from './resolveStorageExerciseIdentity';

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
/** Date d’événement de reprise (séance de retour), pas le gap. */
export function returnEventYmd(d) {
  const m = d?.metrics || d || {};
  const raw =
    m.date ||
    m.eventDate ||
    m.lastSessionDate ||
    m.lastDate ||
    m.returnDate ||
    m.ymd ||
    m.composedEvidence?.continuity?.returnDate ||
    null;
  if (raw) return String(raw).slice(0, 10);
  if (Array.isArray(m.dates) && m.dates.length) return String(m.dates[0]).slice(0, 10);
  const retSession = (m.sessions || []).find(
    (s) => s?.role === 'return_session' || s?.role === 'first_in_window'
  );
  if (retSession?.date) return String(retSession.date).slice(0, 10);
  return '';
}

/** Nom normalisé pour collapse d’épisode de reprise (pas une preuve d’identité). */
export function normalizeReturnExerciseName(d) {
  const raw = String(
    d?.metrics?.name ||
      d?.metrics?.exerciseName ||
      d?.metrics?.historicalDisplayName ||
      d?.title ||
      d?.name ||
      ''
  )
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s+(revient|reviennent|après|réapparition|suite à|reprend).*$/i, '')
    .replace(/^(les|des|le|la|l['’])\s+/i, '')
    .trim();
  return raw;
}

/**
 * Clé de collapse pour un épisode de reprise.
 * Priorité : (nom + date de retour) pour dual storage ids du même retour ;
 * sinon id seul ; sinon nom sans id.
 * Deux ids distincts + même nom + dates absentes ou différentes → clés distinctes
 * (pas de fusion homonyme inventée).
 */
export function returnEpisodeCollapseKey(d) {
  const name = normalizeReturnExerciseName(d);
  const eid = d?.metrics?.exerciseId != null ? String(d.metrics.exerciseId) : '';
  const ymd = returnEventYmd(d);
  if (name && ymd) return `ep:${name}|${ymd}`;
  if (eid) return `id:${eid}`;
  if (name && !eid) return `name:${name}`;
  return '';
}

function isReturnKind(d) {
  return /disc_ms_return|disc_emergence|disc_structural_memory/.test(String(d?.kind || ''));
}

function kindsAreComplementaryReturns(a, b) {
  const ka = String(a?.kind || '');
  const kb = String(b?.kind || '');
  const milestone = (k) => /disc_ms_return/.test(k);
  const emergence = (k) => /disc_emergence|disc_structural_memory/.test(k);
  return (milestone(ka) && emergence(kb)) || (milestone(kb) && emergence(ka));
}

/**
 * Décide si deux cartes de reprise racontent le même épisode.
 * Préfère l’absence de fusion face à une ambiguïté d’identité réelle.
 * Autorise la fusion complémentaire (jalon + émergence) si nom aligné et
 * dates compatibles (égales, ou une seule renseignée — producteur incomplet).
 */
export function shouldCollapseReturnEpisodes(a, b) {
  if (!a || !b || a === b) return false;
  if (sameHistoricalEpisode(a, b)) return true;
  if (!isReturnKind(a) || !isReturnKind(b)) return false;

  const nameA = normalizeReturnExerciseName(a);
  const nameB = normalizeReturnExerciseName(b);
  if (!nameA || nameA !== nameB) return false;

  const rel = relateExerciseIdentities(a, b);
  if (rel.relation === IDENTITY_RELATION.DISTINCT) return false;
  if (rel.relation === IDENTITY_RELATION.SAME_EXERCISE) return true;

  // Homonyme / famille : seulement si producteurs complémentaires
  if (!kindsAreComplementaryReturns(a, b)) return false;
  if (
    rel.relation !== IDENTITY_RELATION.SAME_DISPLAY_NAME &&
    rel.relation !== IDENTITY_RELATION.SAME_MOVEMENT_FAMILY &&
    rel.relation !== IDENTITY_RELATION.INDETERMINATE
  ) {
    return false;
  }

  const ymdA = returnEventYmd(a);
  const ymdB = returnEventYmd(b);
  if (ymdA && ymdB) return ymdA === ymdB;
  // Une date manquante : on fusionne le doublon producteur, pas deux épisodes datés distincts
  return true;
}

export function sameHistoricalEpisode(a, b) {
  const rel = relateExerciseIdentities(a, b);
  const titleReturn = (d) =>
    /revient|réapparition|interruption|long silence|après \d+\s*jours/i.test(
      `${d?.title || ''} ${d?.body || ''}`
    );
  const kindReturn = (d) =>
    /disc_ms_return|disc_emergence|disc_structural_memory/.test(String(d?.kind || ''));
  const bothReturn =
    (titleReturn(a) || kindReturn(a) || Number(a?.metrics?.gapDays) >= 21) &&
    (titleReturn(b) || kindReturn(b) || Number(b?.metrics?.gapDays) >= 21);

  const ymdA = returnEventYmd(a);
  const ymdB = returnEventYmd(b);
  const sameReturnDay = Boolean(ymdA && ymdB && ymdA === ymdB);

  // 1) Même exercice prouvé (id / alias)
  if (rel.relation === IDENTITY_RELATION.SAME_EXERCISE) {
    // ok — suite
  } else if (
    bothReturn &&
    sameReturnDay &&
    (rel.relation === IDENTITY_RELATION.SAME_MOVEMENT_FAMILY ||
      rel.relation === IDENTITY_RELATION.SAME_DISPLAY_NAME ||
      rel.relation === IDENTITY_RELATION.INDETERMINATE)
  ) {
    // 2) Même jour + même libellé : dual id OK seulement si producteurs complémentaires
    //    ou un id manquant — pas deux jalons homonymes (deux exercices distincts).
    const idA = a?.metrics?.exerciseId != null ? String(a.metrics.exerciseId) : '';
    const idB = b?.metrics?.exerciseId != null ? String(b.metrics.exerciseId) : '';
    const nameOnlyRelation =
      rel.relation === IDENTITY_RELATION.SAME_DISPLAY_NAME ||
      rel.relation === IDENTITY_RELATION.SAME_MOVEMENT_FAMILY;
    if (nameOnlyRelation && idA && idB && idA !== idB) {
      // Homonymes / famille nominale avec ids distincts : fusion seulement si
      // producteurs complémentaires (jalon + émergence), jamais deux mêmes kinds.
      if (String(a?.kind || '') === String(b?.kind || '') || !kindsAreComplementaryReturns(a, b)) {
        return false;
      }
    }
  } else if (
    bothReturn &&
    rel.relation === IDENTITY_RELATION.INDETERMINATE &&
    normalizeReturnExerciseName(a) &&
    normalizeReturnExerciseName(a) === normalizeReturnExerciseName(b)
  ) {
    // 3) Id manquant des deux côtés, même nom
  } else {
    // Homonyme avec deux storage ids distincts sans date de retour partagée → ne pas fusionner
    return false;
  }

  const ca = a?.metrics?.composedEvidence?.continuity?.kind;
  const cb = b?.metrics?.composedEvidence?.continuity?.kind;
  const returnLike = new Set(['punctual_return', 'confirmed_return', 'returning', 'decline_then_recovery']);
  if (ca && cb && returnLike.has(ca) && returnLike.has(cb)) return true;
  const sa = a?.metrics?.trajectoryPrimaryStory;
  const sb = b?.metrics?.trajectoryPrimaryStory;
  if (sa && sb && sa === sb && (sa === 'partial_recovery' || sa === 'recovered')) return true;
  if (bothReturn && (sameReturnDay || rel.relation === IDENTITY_RELATION.SAME_EXERCISE)) return true;
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

/**
 * @param {object} d
 * @param {Function|null} getExerciseNameById
 * @param {{ snapshot?: object|null }} [opts]
 */
export function repairDisplayNameFromIdentity(d, getExerciseNameById = null, opts = {}) {
  const m = d?.metrics || {};
  const id = m.exerciseId ?? m.storageId;
  const idStr = id != null ? String(id) : '';
  const rawCurrent = String(m.exerciseName || m.name || m.f4Narration?.resolvedName || '').trim();
  const current = looksLikeDraftTitleNotExerciseName(rawCurrent) ? '' : rawCurrent;
  if (current && !/^un mouvement$/i.test(current)) {
    return {
      name: current,
      status: 'name_present',
      identityStatus: id != null ? 'identity_present' : 'identity_missing',
      resolutionSource: 'metrics'
    };
  }
  if (id == null || id === '') {
    return { name: null, status: 'name_missing', identityStatus: 'identity_missing' };
  }
  if (m.identityConfidence === 'ambiguous' || m.hashAmbiguous) {
    return { name: null, status: 'name_missing', identityStatus: 'identity_ambiguous' };
  }

  // Snapshot persisté (souvent disponible alors que le getter programme échoue)
  const snapNames = opts.snapshot?.exerciseDisplayNames || m.snapshotDisplayNames || null;
  const snapName = snapNames?.[idStr] || snapNames?.[id] || null;
  if (snapName && String(snapName).trim() && !/^un mouvement$/i.test(snapName)) {
    const facingSnap = userFacingExerciseLabel(String(snapName).trim(), id);
    if (facingSnap && facingSnap !== 'un mouvement') {
      return {
        name: facingSnap,
        status: 'name_repaired_from_historical_id',
        identityStatus: 'identity_present',
        storageId: idStr,
        resolutionSource: 'snapshot_display_names'
      };
    }
  }

  // Chaîne canonique complète (displayNames → reverse hash → db_* → getter)
  const identity = resolveStorageExerciseIdentity({
    storageId: id,
    snapshot: opts.snapshot || null,
    getExerciseNameById,
    nameById: opts.nameById || snapNames || null
  });
  if (identity.hashAmbiguous) {
    return {
      name: null,
      status: 'name_missing',
      identityStatus: 'identity_ambiguous',
      storageId: idStr,
      resolutionSource: identity.resolutionSource || 'ambiguous_hash',
      originalId: identity.originalId || null
    };
  }
  if (identity.resolvedName) {
    const facingId = userFacingExerciseLabel(String(identity.resolvedName).trim(), id);
    if (facingId && facingId !== 'un mouvement') {
      return {
        name: facingId,
        status: 'name_repaired_from_historical_id',
        identityStatus: 'identity_present',
        storageId: idStr,
        resolutionSource: identity.resolutionSource || 'resolve_storage_identity',
        originalId: identity.originalId || null,
        exerciseBankKey: identity.exerciseBankKey || null
      };
    }
  }

  const resolved = resolveExerciseNameForRecap(id, getExerciseNameById);
  const facing = userFacingExerciseLabel(resolved, id);
  if (facing && facing !== 'un mouvement') {
    return {
      name: facing,
      status: 'name_repaired_from_historical_id',
      identityStatus: 'identity_present',
      storageId: idStr,
      resolutionSource: 'getter_or_db'
    };
  }
  return {
    name: null,
    status: 'name_missing',
    identityStatus: 'identity_present_name_unresolved',
    storageId: idStr,
    resolutionSource: 'none',
    diagnosticHint:
      'ID présent mais aucun nom dans exerciseDisplayNames, reverse-hash, banque db_* ni getter — corriger la persistance des noms au stockage.'
  };
}

export function classifyNameIdentityStatus(d) {
  const repaired = repairDisplayNameFromIdentity(d);
  return repaired;
}
