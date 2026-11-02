/**
 * F5 — Valeur informative éditoriale + identité de phénomène + rivalités.
 * Branche unique dans E0 (selectPeriodDiscoveriesWithTrace) — pas de 2ᵉ sélection.
 */

import { resolveVolumeDirection } from './recapComposedNarration';
import {
  IDENTITY_RELATION,
  exerciseIdentityKey,
  relateExerciseIdentities,
  sameExerciseIdentity,
  sameHistoricalEpisode,
  measuresComparableForContradiction,
  repairDisplayNameFromIdentity,
  displayNameOf
} from './recapEditorialIdentity';
import { isFallbackExerciseLabel } from './resolveStorageExerciseIdentity';

/** Kinds descriptifs souvent faibles hors contraste réel. */
export const WEAK_DESCRIPTIVE_KINDS = Object.freeze([
  'disc_density',
  'disc_calendar_rhythm',
  'disc_anchor',
  'disc_quarter_profile',
  'disc_quarter_arc',
  'disc_repertoire',
  'disc_volume_shape',
  'disc_exercise_share',
  'disc_cardio_strength'
]);

/** Kinds d’épisode exercice (retour / émergence / mémoire). */
export const EXERCISE_EPISODE_KINDS = Object.freeze([
  'disc_emergence',
  'disc_ms_return',
  'disc_ms_return_durable',
  'disc_structural_memory'
]);

/** Kinds de trajectoire volume sur un exercice. */
export const EXERCISE_TRAJECTORY_KINDS = Object.freeze([
  'disc_exercise_progress',
  'disc_freq_progress_low',
  'disc_freq_decline_low_exposure',
  'disc_vs_habit'
]);

/**
 * Classe de phénomène pour rivalité (pas seulement le kind).
 */
export function classifyPhenomenon(d) {
  const kind = String(d?.kind || '');
  const m = d?.metrics || {};
  const ce = m.composedEvidence || null;
  const cont = ce?.continuity?.kind || m.trajectoryInstallation || null;
  const story = m.trajectoryPrimaryStory || ce?.primaryPhenomenon?.primaryStory || null;
  const attrib = ce?.volumeAttribution?.kind || null;
  const dir = ce ? resolveVolumeDirection(ce).direction : null;

  if (EXERCISE_EPISODE_KINDS.includes(kind)) {
    if (cont === 'punctual_return' || cont === 'confirmed_return' || cont === 'returning') {
      return 'return_after_gap';
    }
    if (kind === 'disc_ms_return' || kind === 'disc_ms_return_durable') {
      return 'return_after_gap';
    }
    if (cont === 'stable_plateau' || (dir === 'flat' && cont !== 'directional_change')) {
      return 'volume_stable';
    }
    if (cont === 'directional_change' || dir === 'down' || dir === 'up') {
      if (dir === 'down' || /recul|baisse|moins de/i.test(String(d.title || ''))) {
        return 'volume_decline';
      }
      if (dir === 'up' || /hausse|progression|plus de/i.test(String(d.title || ''))) {
        return 'volume_rise';
      }
    }
    if (
      cont === 'consolidated_format' ||
      m.trajectoryInstallation === 'installed' ||
      m.trajectoryInstallation === 'installing' ||
      /s['’]installe|format plus|se maintient/i.test(String(d.title || ''))
    ) {
      return 'format_or_install';
    }
    if (/revient|réapparition|interruption/i.test(String(d.title || ''))) {
      return 'return_after_gap';
    }
    return 'emergence_generic';
  }

  if (EXERCISE_TRAJECTORY_KINDS.includes(kind)) {
    if (attrib?.startsWith('frequency_driven')) return 'frequency_attribution';
    // Arc creux→reprise avant le simple « down » (sinon partial_recovery devient volume_decline)
    if (story === 'recovered' || story === 'partial_recovery') return 'decline_then_recovery';
    if (dir === 'down' || story === 'net_decline' || kind === 'disc_freq_decline_low_exposure') {
      return 'volume_decline';
    }
    if (dir === 'up' || story === 'net_rise' || kind === 'disc_freq_progress_low') {
      return 'volume_rise';
    }
    if (story === 'plateau' || cont === 'stable_plateau') return 'volume_stable';
    return 'volume_trajectory';
  }

  if (WEAK_DESCRIPTIVE_KINDS.includes(kind)) return 'descriptive_weak';
  if (kind === 'disc_rest_assoc') return 'rest_sleep_assoc';
  if (String(kind).startsWith('disc_sleep_')) return 'sleep';
  if (String(kind).startsWith('disc_p35_') || String(kind).startsWith('disc_gtg_')) return 'gtg_channel';
  if (String(kind).startsWith('disc_p36_')) return 'habit_p36';
  return 'other';
}

function extractExerciseNameFromLabel(label) {
  const title = String(label || '').trim();
  if (!title || /^un mouvement\b/i.test(title)) return null;
  const clean = (s) =>
    String(s || '')
      .replace(/[:\s]+$/g, '')
      .trim();
  const reprise = title.match(/reprise de\s+(.+?)(?:\s+est\b|\s*$)/i);
  if (reprise?.[1]) return clean(reprise[1]);
  const revient = title.match(/^(.+?)\s+revien/i);
  if (revient?.[1] && revient[1].length < 80) {
    const n = clean(revient[1]);
    if (n) return n;
  }
  // Phrase entière stockée comme « name » (jalons) → inutile comme clé
  if (/^(la|le|les|ces|cette)\b/i.test(title) || title.length > 60) {
    const colonIn = title.match(/^(.+?)\s*:\s+/);
    if (colonIn?.[1] && !/^(la|le|ces|cette)\b/i.test(colonIn[1])) return clean(colonIn[1]);
    return null;
  }
  const colon = title.match(/^(.+?)\s*:\s+/);
  if (colon?.[1] && colon[1].length < 80 && !/^(la|le|ces|cette)\b/i.test(colon[1])) {
    return clean(colon[1]);
  }
  // Nom court plausible
  if (title.length <= 60 && !/\s+est\s+/i.test(title)) return title;
  return null;
}

export function resolvedExerciseName(d) {
  const raw = String(
    d?.metrics?.f4Narration?.resolvedName ||
      d?.metrics?.name ||
      d?.metrics?.exerciseName ||
      ''
  ).trim();
  if (raw && !/^un mouvement$/i.test(raw)) {
    // Si metrics.name est déjà une phrase de jalon, extraire le mouvement
    const extracted = extractExerciseNameFromLabel(raw);
    if (extracted) return extracted;
    if (raw.length <= 60 && !/^(la|le|les)\b/i.test(raw)) return raw;
  }
  return extractExerciseNameFromLabel(d?.title || '');
}

/**
 * Clé d’exercice pour rivalité F5.1 : identité de stockage / alias prouvé.
 * Le nom affiché seul ne fusionne plus les historiques (103≠503, 104≠504).
 */
export function exerciseKeyOf(d) {
  return exerciseIdentityKey(d);
}

/** @deprecated F5.1 — préférer relateExerciseIdentities ; exposé pour diagnostics. */
export function displayNameKeyOf(d) {
  const name = resolvedExerciseName(d) || displayNameOf(d);
  if (name) return `name:${name.toLowerCase()}`;
  return null;
}

/**
 * Identité de phénomène pour déduplication éditoriale.
 * kind:exerciseId reste l’identité technique E0 ; celle-ci sert aux rivalités F5.
 */
export function phenomenonIdentity(d) {
  const ex = exerciseKeyOf(d) || 'global';
  const phen = classifyPhenomenon(d);
  return `${ex}|${phen}`;
}

export function isUnresolvedExerciseName(d) {
  const repaired = repairDisplayNameFromIdentity(d);
  if (repaired.status === 'name_repaired_from_historical_id' || repaired.status === 'name_present') {
    return false;
  }
  const blob = `${d?.title || ''} ${d?.body || ''} ${d?.metrics?.name || ''} ${d?.metrics?.f4Narration?.resolvedName || ''}`;
  if (/\bun mouvement\b/i.test(blob)) return true;
  if (/\bExercice\s+\d{2,}\b/i.test(blob)) return true;
  if (/\bExercice inconnu\b/i.test(blob)) return true;
  if (isFallbackExerciseLabel(d?.metrics?.name) || isFallbackExerciseLabel(d?.metrics?.exerciseName)) {
    return true;
  }
  return false;
}

/** Applique une réparation de nom sur une copie metrics (sans inventer d’alias). */
export function withRepairedDisplayName(d, getExerciseNameById = null) {
  const repaired = repairDisplayNameFromIdentity(d, getExerciseNameById);
  if (repaired.status !== 'name_repaired_from_historical_id' || !repaired.name) return d;
  return {
    ...d,
    title: String(d.title || '').replace(/\bun mouvement\b/gi, repaired.name),
    metrics: {
      ...(d.metrics || {}),
      name: repaired.name,
      historicalDisplayName: repaired.name,
      nameRepair: repaired
    }
  };
}

export function isWeakDescriptiveCard(d) {
  const kind = d?.kind;
  if (!WEAK_DESCRIPTIVE_KINDS.includes(kind)) return false;
  const m = d?.metrics || {};
  // Contraste réel possible → pas « faible »
  if (kind === 'disc_volume_shape' && (m.sparse || m.singleDay || Number(m.vsHabitPct) >= 20)) {
    return false;
  }
  if (kind === 'disc_density' && Math.abs(Number(m.vsPct) || 0) >= 15) return false;
  if (kind === 'disc_calendar_rhythm' && Number(m.quietDays) >= 3 && Number(m.trainedDays) >= 2) {
    return false;
  }
  if (kind === 'disc_cardio_strength' && m.contrastOnly) return false;
  return true;
}

/**
 * Solidité / explication / remarquable — bonus bornés (pas un 2ᵉ score magique).
 */
export function editorialValueAdjustments(d, voiceKey = 'week') {
  const m = d?.metrics || {};
  const ce = m.composedEvidence;
  const phen = classifyPhenomenon(d);
  const kind = d?.kind;
  let delta = 0;
  const factors = [];

  // A — solidité
  if (m.trajectoryOk && m.composedOk) {
    delta += 8;
    factors.push({ id: 'composed_ok', delta: 8 });
  }
  if (m.trajectorySetAvailable && m.trajectorySetGranularity !== 'totals_only') {
    delta += 5;
    factors.push({ id: 'trusted_sets', delta: 5 });
  }
  if (m.f4Narration?.consistencyOk === false) {
    delta -= 12;
    factors.push({ id: 'inconsistent_narration', delta: -12 });
  }
  if (m.f4Narration?.used && m.f4Narration?.consistencyOk !== false) {
    delta += 4;
    factors.push({ id: 'coherent_narration', delta: 4 });
  }
  if (isUnresolvedExerciseName(d)) {
    delta -= 22;
    factors.push({ id: 'unresolved_name', delta: -22 });
  }

  // B — pertinence temporelle
  if (voiceKey === 'week' || voiceKey === 'today') {
    if (kind === 'disc_quarter_profile' || kind === 'disc_quarter_arc') {
      delta -= 28;
      factors.push({ id: 'quarter_on_short_window', delta: -28 });
    }
    if (kind === 'disc_anchor' && isWeakDescriptiveCard(d)) {
      delta -= 16;
      factors.push({ id: 'weak_anchor_short', delta: -16 });
    }
    if (m.temporalScope?.interpretingWithHistory && !m.composedOk) {
      delta -= 4;
      factors.push({ id: 'history_without_composition', delta: -4 });
    }
  }
  if (voiceKey === 'long' || voiceKey === 'year') {
    if (phen === 'format_or_install' || phen === 'return_after_gap' || phen === 'decline_then_recovery') {
      delta += 4;
      factors.push({ id: 'long_horizon_episode', delta: 4 });
    }
  }

  // C — pouvoir explicatif
  const attrib = ce?.volumeAttribution?.kind;
  if (attrib) {
    delta += 7;
    factors.push({ id: 'volume_attribution', delta: 7 });
  }
  if (ce?.decomposition?.kind && ce.decomposition.available !== false) {
    if (String(ce.decomposition.kind).startsWith('same_sets_') || String(ce.decomposition.kind).startsWith('more_sets_')) {
      delta += 6;
      factors.push({ id: 'set_mechanism', delta: 6 });
    }
  }
  if (ce?.comparators?.verdict && ce.comparators.verdict !== 'insufficient' && ce.comparators.verdict !== 'mixed') {
    delta += 5;
    factors.push({ id: 'peer_scope', delta: 5 });
  }
  if (ce?.continuity?.kind && !['unclear', 'insufficient', 'directional_change'].includes(ce.continuity.kind)) {
    delta += 4;
    factors.push({ id: 'continuity', delta: 4 });
  }

  // D — remarquable (direction nette, pas % seuls)
  const dir = ce ? resolveVolumeDirection(ce) : null;
  if (dir && (dir.direction === 'up' || dir.direction === 'down') && Math.abs(dir.deltaPct || 0) >= 20) {
    delta += 3;
    factors.push({ id: 'sizable_delta', delta: 3 });
  }

  // E — descriptif faible
  if (isWeakDescriptiveCard(d)) {
    const pen = voiceKey === 'week' || voiceKey === 'today' ? -14 : -8;
    delta += pen;
    factors.push({ id: 'weak_descriptive', delta: pen });
  }

  // F — rest_assoc ne doit pas se faire passer pour du sommeil fort
  if (kind === 'disc_rest_assoc') {
    delta -= 6;
    factors.push({ id: 'rest_assoc_demote', delta: -6 });
  }

  // Composition triviale : composedOk mais factCount bas et pas de mécanisme
  if (m.composedOk && Number(m.composedFactCount || 0) <= 2 && !attrib && !m.trajectorySetAvailable) {
    delta -= 5;
    factors.push({ id: 'shallow_composition', delta: -5 });
  }

  return { delta, factors, phenomenon: phen, phenomenonId: phenomenonIdentity(d) };
}

/**
 * Enrichit la valeur informative E0 existante (appelée depuis discoveryInformativeValue).
 */
export function applyEditorialInformativeValue(baseValue, d, voiceKey = 'week') {
  const adj = editorialValueAdjustments(d, voiceKey);
  const v = Number(baseValue) + adj.delta;
  return {
    value: v,
    editorial: adj
  };
}

/**
 * Rivalité de phénomène : même identité d’exercice prouvée + même classe → une carte.
 * Homonyme (même nom, ids distincts) ≠ rivalité.
 */
export function findPhenomenonRival(d, selectedList = []) {
  const id = phenomenonIdentity(d);
  if (!id || id.startsWith('global|')) return null;
  const phen = classifyPhenomenon(d);
  if (phen === 'descriptive_weak' || phen === 'other') return null;

  const hit = (selectedList || []).find((s) => {
    if (s === d) return false;
    if (!sameExerciseIdentity(d, s) && !sameHistoricalEpisode(d, s)) return false;
    return classifyPhenomenon(s) === phen;
  });
  if (!hit) return null;

  const rel = relateExerciseIdentities(d, hit);
  return {
    rival: hit,
    phenomenonId: id,
    phenomenon: phen,
    identityRelation: rel.relation,
    identityProof: rel.proof
  };
}

/** Paires de phénomènes incompatibles sur le même exercice (pack illisible). */
const INCOMPATIBLE_PHENOMENA = Object.freeze({
  volume_decline: ['volume_stable', 'volume_rise', 'decline_then_recovery'],
  volume_stable: ['volume_decline', 'volume_rise'],
  volume_rise: ['volume_decline', 'volume_stable'],
  decline_then_recovery: ['volume_decline', 'return_after_gap'],
  return_after_gap: ['decline_then_recovery']
});

/**
 * Contradiction pack : uniquement si identité prouvée + mesures comparables.
 * Même nom affiché (103 vs 503) ne déclenche pas de suppression.
 */
export function findVolumeContradiction(d, selectedList = []) {
  if (!exerciseKeyOf(d)) return null;
  const phen = classifyPhenomenon(d);
  const ce = d?.metrics?.composedEvidence;
  const attrib = ce?.volumeAttribution?.kind || null;

  const candidates = (selectedList || []).filter((s) => s !== d && sameExerciseIdentity(d, s));

  const bad = INCOMPATIBLE_PHENOMENA[phen];
  if (bad) {
    const storyHit = candidates.find((s) => {
      if (!bad.includes(classifyPhenomenon(s))) return false;
      return measuresComparableForContradiction(d, s).ok;
    });
    if (storyHit) {
      const rel = relateExerciseIdentities(d, storyHit);
      return {
        rival: storyHit,
        direction: phen,
        opposite: classifyPhenomenon(storyHit),
        kind: 'story',
        identityRelation: rel.relation,
        identityProof: rel.proof
      };
    }
  }

  if (!ce) return null;
  const dir = resolveVolumeDirection(ce).direction;
  if (dir !== 'up' && dir !== 'down') return null;
  const opposite = dir === 'up' ? 'down' : 'up';
  const hit = candidates.find((s) => {
    const sce = s?.metrics?.composedEvidence;
    if (!sce) return false;
    if (!measuresComparableForContradiction(d, s).ok) return false;
    if (resolveVolumeDirection(sce).direction !== opposite) return false;
    const sAttrib = sce?.volumeAttribution?.kind || null;
    if (attrib && sAttrib && attrib !== sAttrib) return false;
    const sPhen = classifyPhenomenon(s);
    if (
      (phen === 'frequency_attribution' || sPhen === 'frequency_attribution') &&
      phen !== sPhen &&
      (attrib || sAttrib)
    ) {
      return false;
    }
    return true;
  });
  if (!hit) return null;
  const rel = relateExerciseIdentities(d, hit);
  return {
    rival: hit,
    direction: dir,
    opposite,
    kind: 'volume',
    identityRelation: rel.relation,
    identityProof: rel.proof
  };
}

/** Diagnostic pack : homonymes sans identité (ne pas fusionner). */
export function findDisplayNameHomonyms(d, selectedList = []) {
  return (selectedList || [])
    .filter((s) => s !== d)
    .map((s) => ({ s, rel: relateExerciseIdentities(d, s) }))
    .filter(({ rel }) => rel.relation === IDENTITY_RELATION.SAME_DISPLAY_NAME);
}

/** Cap souple : trop d’émergences / retours dans le pack (y compris jalons retour). */
export function countEpisodeCards(selectedList = []) {
  return (selectedList || []).filter(
    (d) =>
      EXERCISE_EPISODE_KINDS.includes(d.kind) ||
      String(d.kind || '').startsWith('disc_ms_return')
  ).length;
}

export function episodeCapForVoice(voiceKey) {
  if (voiceKey === 'today') return 1;
  if (voiceKey === 'week') return 2;
  if (voiceKey === 'month') return 3;
  return 3; // long / year
}

/**
 * Décide si d peut entrer compte tenu des rivaux phénomène / contradictions / caps épisode.
 * @returns {{ ok: boolean, reason?: string, displace?: object, blockedBy?: string }}
 */
export function editorialCanTake(d, selectedList, voiceKey = 'week') {
  const phenRival = findPhenomenonRival(d, selectedList);
  if (phenRival) {
    const gain = (d.informativeValue || 0) - (phenRival.rival.informativeValue || 0);
    if (gain >= 4) {
      return { ok: true, displace: phenRival.rival, reason: 'phenomenon_outranked' };
    }
    return {
      ok: false,
      reason: 'phenomenon_rival',
      blockedBy: phenRival.rival.kind,
      phenomenonId: phenRival.phenomenonId
    };
  }

  const contra = findVolumeContradiction(d, selectedList);
  if (contra) {
    const gain = (d.informativeValue || 0) - (contra.rival.informativeValue || 0);
    if (gain >= 6) {
      return { ok: true, displace: contra.rival, reason: 'contradiction_outranked' };
    }
    // Garder la plus informative ; refuser la nouvelle si pas clairement meilleure
    return {
      ok: false,
      reason: 'volume_contradiction',
      blockedBy: contra.rival.kind
    };
  }

  if (EXERCISE_EPISODE_KINDS.includes(d.kind) || String(d.kind || '').startsWith('disc_ms_return')) {
    const n = countEpisodeCards(selectedList);
    const cap = episodeCapForVoice(voiceKey);
    if (n >= cap) {
      // Exception souple : une 4ᵉ carte seulement si clairement plus informative
      if (n >= cap + 1 || (d.informativeValue || 0) < 110) {
        return { ok: false, reason: 'episode_cap' };
      }
    }
  }

  // Nom anonyme : ne jamais promouvoir (pas de découverte majeure sans identité)
  if (isUnresolvedExerciseName(d)) {
    return { ok: false, reason: 'unresolved_exercise_name' };
  }

  // Descriptifs faibles : pas de rejet dur ici — pénalité IV + abstention pack
  // (une observation simple reste publiable si le pack n’a rien de plus fort).

  return { ok: true };
}
