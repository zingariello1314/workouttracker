/**
 * Contrat de phénomène sportif (distinct du kind technique).
 * Identifiant stable, testable — pas de clé construite depuis le titre libre.
 */

import { classifyPhenomenon, exerciseKeyOf } from './recapEditorialSelection';
import { sameExerciseIdentity } from './recapEditorialIdentity';

export const PHENOMENON_SCHEMA_VERSION = 'phenomenon-v1';

/** Classes complémentaires (peuvent coexister sur le même exercice). */
export const COMPLEMENTARY_PHENOMENA = Object.freeze({
  return_after_gap: new Set(['frequency_attribution', 'format_or_install', 'decline_then_recovery']),
  format_or_install: new Set(['return_after_gap', 'frequency_attribution', 'volume_rise']),
  frequency_attribution: new Set(['return_after_gap', 'format_or_install', 'volume_rise', 'volume_decline']),
  decline_then_recovery: new Set(['return_after_gap', 'format_or_install']),
  volume_rise: new Set(['frequency_attribution', 'format_or_install']),
  volume_decline: new Set(['frequency_attribution'])
});

function mechanismKey(d) {
  const m = d?.metrics || {};
  const ce = m.composedEvidence || {};
  const parts = [
    m.trajectorySetMechanism || ce?.decomposition?.kind || null,
    ce?.volumeAttribution?.kind || null,
    m.trajectoryPrimaryStory || ce?.primaryPhenomenon?.primaryStory || null,
    ce?.continuity?.kind || m.trajectoryInstallation || null
  ]
    .filter(Boolean)
    .map((x) => String(x));
  return parts.length ? parts.join('+') : 'none';
}

function timeKey(d) {
  const m = d?.metrics || {};
  if (m.gapDays != null && Number.isFinite(Number(m.gapDays))) {
    // Buckets de gap : 42 j et 77 j = même épisode de reprise (pas gap:med vs gap:long)
    const g = Number(m.gapDays);
    if (g >= 21) return 'gap:return';
    if (g >= 7) return 'gap:short';
  }
  const date = m.date || m.eventDate || m.ymd || null;
  if (date) return `d:${String(date).slice(0, 10)}`;
  const win = m.windowEnd || m.temporalScope?.windowDates?.slice?.(-1)?.[0];
  if (win) return `w:${String(win).slice(0, 10)}`;
  return 't:na';
}

/**
 * Construit l’identité de phénomène structurée.
 * @returns {{
 *   id: string,
 *   schemaVersion: string,
 *   subjectKey: string,
 *   class: string,
 *   mechanism: string,
 *   time: string,
 *   kind: string,
 *   confidence: 'high'|'medium'|'low'
 * }}
 */
export function buildPhenomenonRecord(d) {
  const cls = classifyPhenomenon(d);
  const subject = exerciseKeyOf(d) || (d?.family ? `fam:${d.family}` : 'global');
  const mechanism = mechanismKey(d);
  const time = timeKey(d);
  const kind = String(d?.kind || '');
  const hasId = Boolean(d?.metrics?.exerciseId ?? d?.metrics?.storageId);
  const confidence = hasId ? (cls === 'other' || cls === 'descriptive_weak' ? 'medium' : 'high') : 'low';
  // id stable : sujet|classe|mécanisme (sans kind — deux kinds peuvent être le même phénomène)
  // time bucket pour les retours ; sinon mécanisme suffit
  const idCore =
    cls === 'return_after_gap' || cls === 'emergence_generic'
      ? `${subject}|${cls}|${time}`
      : `${subject}|${cls}|${mechanism}`;
  return {
    id: idCore,
    schemaVersion: PHENOMENON_SCHEMA_VERSION,
    subjectKey: subject,
    class: cls,
    mechanism,
    time,
    kind,
    confidence
  };
}

/** Identifiant string pour rivalité / dédup. */
export function phenomenonContractId(d) {
  return buildPhenomenonRecord(d).id;
}

/**
 * Deux découvertes racontent-elles le même phénomène ?
 */
export function samePhenomenon(a, b) {
  if (!a || !b) return false;
  const pa = a._phenomenonRecord || buildPhenomenonRecord(a);
  const pb = b._phenomenonRecord || buildPhenomenonRecord(b);
  if (pa.id === pb.id) return true;
  // Même sujet + même classe + mécanismes absents/identiques
  if (pa.subjectKey === pb.subjectKey && pa.class === pb.class) {
    if (pa.mechanism === pb.mechanism) return true;
    if (pa.mechanism === 'none' || pb.mechanism === 'none') {
      // Sans mécanisme : fusionner seulement si kinds proches ou même story
      if (pa.kind === pb.kind) return true;
    }
  }
  return false;
}

/**
 * Complémentaires (peuvent coexister) vs redondants.
 */
export function phenomenaAreComplementary(a, b) {
  if (!a || !b) return false;
  if (!sameExerciseIdentity(a, b) && exerciseKeyOf(a) && exerciseKeyOf(b)) return false;
  const ca = classifyPhenomenon(a);
  const cb = classifyPhenomenon(b);
  if (ca === cb) return false;
  return Boolean(COMPLEMENTARY_PHENOMENA[ca]?.has(cb));
}

/**
 * Déduplique un pool par phénomène : garde la meilleure IV.
 * @returns {{ unique: object[], collapsed: object[] }}
 */
export function collapseByPhenomenon(discoveries) {
  const best = new Map();
  const collapsed = [];
  (discoveries || []).forEach((d) => {
    const rec = buildPhenomenonRecord(d);
    const enriched = {
      ...d,
      _phenomenonRecord: rec,
      _phenomenonId: rec.id,
      _phenomenon: rec.class
    };
    const prev = best.get(rec.id);
    if (!prev) {
      best.set(rec.id, enriched);
      return;
    }
    const iv = Number(enriched.informativeValue) || 0;
    const piv = Number(prev.informativeValue) || 0;
    if (iv > piv || (iv === piv && (enriched.score || 0) > (prev.score || 0))) {
      collapsed.push({ ...prev, _collapsedInto: rec.id, _dropHint: 'phenomenon_collapse' });
      best.set(rec.id, enriched);
    } else {
      collapsed.push({ ...enriched, _collapsedInto: rec.id, _dropHint: 'phenomenon_collapse' });
    }
  });
  return { unique: [...best.values()], collapsed };
}

/**
 * Appariement pour comparaison A/B (console).
 * @returns {'exact'|'probable'|'none'}
 */
export function matchConfidence(a, b) {
  if (!a || !b) return 'none';
  const pa = a._phenomenonRecord || buildPhenomenonRecord(a);
  const pb = b._phenomenonRecord || buildPhenomenonRecord(b);
  if (pa.id === pb.id) return 'exact';
  if (pa.subjectKey === pb.subjectKey && pa.class === pb.class) return 'probable';
  if (pa.kind && pa.kind === pb.kind && pa.subjectKey === pb.subjectKey) return 'probable';
  return 'none';
}
