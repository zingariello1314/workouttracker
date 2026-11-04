/**
 * Spec #24 Lot A — validation dure (rejet = masqué).
 * Filtre les candidats / discoveries existants sans nouveau rendu.
 */

import { logRecapReject } from './recapRejectLog';

const RAW_ID_RE = /\bExercice\s+\d{2,}\b|\b#\d{6,}\b|\b\d{9,}\b/;
const OBJECT_OBJECT_RE = /\[object\s+Object\]/i;
const INTERNAL_CHIP_RE = /\b(rhythm|repertoire|concentration|composition|continuity|pushPull|series)\b/i;
const PACE_RE =
  /(\d+(?:[.,]\d+)?)\s*(?:→|->|à|a)\s*(\d+(?:[.,]\d+)?)\s*min\/\s*km|de\s+(\d+(?:[.,]\d+)?)\s*à\s+(\d+(?:[.,]\d+)?)\s*min\/\s*km|(\d+(?:[.,]\d+)?)\s*min\/\s*km/i;
const PLUS_DAYS_TITLE_RE = /plus de jours actifs|comptent plus de jours/i;
const LEFT_WINDOW_RE = /a quitt[ée] cette fenêtre|dispara[iî]t du journal/i;

/**
 * Texte utilisateur uniquement — metrics / ids techniques hors prose ne doivent
 * jamais déclencher raw_exercise_id (une découverte valide peut porter exerciseId en metrics).
 */
function asText(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.map(asText).filter(Boolean).join(' · ');
  if (typeof value === 'object') return '[object Object]';
  return String(value);
}

function blob(card) {
  if (!card) return '';
  if (typeof card === 'string') return card;
  return [card.title, card.body, card.text, card.evidence, card.context?.title, card.context?.body]
    .map(asText)
    .filter(Boolean)
    .join('\n');
}

function num(n) {
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

function parsePaceToken(raw) {
  if (raw == null) return null;
  const n = Number(String(raw).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/** Allure loisir plausible (min/km). */
export function isPlausibleRunningPaceMinPerKm(pace) {
  const n = num(pace);
  if (n == null) return false;
  return n >= 2 && n <= 15;
}

/**
 * @param {object} card
 * @param {{ voiceKey?: string, period?: string, windowSpanDays?: number }} [ctx]
 * @returns {string} rule id si rejet, sinon ''
 */
export function insightRejectReason(card, ctx = {}) {
  if (!card) return 'empty';
  const text = blob(card);
  const title = String(card.title || card.context?.title || '');
  const evidence = String(card.evidence || card.context?.evidenceLine || '');
  const kind = String(card.kind || card.context?.kind || '');
  const voice = ctx.voiceKey || card.voice || '';
  const metrics = card.metrics || {};

  if (!title && !text.trim()) return 'empty';

  if (OBJECT_OBJECT_RE.test(text) || typeof card.evidence === 'object') {
    return 'non_textual_evidence';
  }

  // Sujet / grammaire cassés — tous chemins de publication (disc_* et span_*)
  if (/\bun mouvement\b/i.test(text) || /\bun mouvement\b/i.test(title)) {
    return 'anonymous_exercise_label';
  }
  if (/\bcet exercice\b/i.test(title) || /^La reprise de cet exercice\b/i.test(title)) {
    return 'anonymous_exercise_label';
  }
  // Prose générique « cet exercice » dans le corps publié (identité non résolue / placeholder).
  if (/\bcet exercice\b/i.test(text) && !/\b(pompes|dips|tractions|relevés|développé|élévations)\b/i.test(text)) {
    return 'anonymous_exercise_label';
  }
  if (/\bUNCLEAR\b/.test(evidence) || /\bUNCLEAR\b/.test(text)) {
    return 'internal_chip';
  }
  if (/pèse encore/i.test(title) && /sommeil|nuit|avant-hier/i.test(title)) {
    return 'forbidden_sleep_causality';
  }
  // Titre = identifiant technique snake_case (ex. program_gap_mixed)
  if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/i.test(title.trim())) {
    return 'internal_kind_as_title';
  }
  if (/Première apparition\s*:?\s*$/i.test(title.trim())) return 'incomplete_exercise_subject';
  if (/Tu reprends\s+après\b/i.test(title)) return 'incomplete_exercise_subject';
  if (/^après \d+\s*jours d'absence\b/i.test(title.trim())) return 'incomplete_exercise_subject';
  if (/depuis \d+\s*jours sur\s*[.]/i.test(text)) return 'incomplete_exercise_subject';
  if (/apparition de\s+dans ton historique/i.test(text)) return 'incomplete_exercise_subject';
  if (/Tes séances de\s+se situent/i.test(text)) return 'incomplete_exercise_subject';
  if (/Elle mêle\s+\d+(\s*,\s*\d+)+\s*[.]?/i.test(text)) return 'numbers_without_context';
  if (/coïncide avec tu reprends/i.test(text)) return 'broken_sleep_combo_prose';
  if (/\bde le (coucher|lever)\b/i.test(text)) return 'broken_french_article';
  if (/\bCes \d+ jours (répartit|représente|devient|porte)\b/i.test(text)) {
    return 'broken_french_agreement';
  }

  if (RAW_ID_RE.test(text) || RAW_ID_RE.test(title)) return 'raw_exercise_id';

  if (INTERNAL_CHIP_RE.test(evidence.trim()) && evidence.trim().split(/\s+/).length <= 3) {
    return 'internal_chip';
  }

  // B6 — titre positif alors que delta ≤ 0
  const delta = num(
    metrics.delta ??
      (metrics.highDays != null && metrics.lowDays != null
        ? metrics.highDays - metrics.lowDays
        : null)
  );
  if (
    (kind === 'disc_sleep_freq' || PLUS_DAYS_TITLE_RE.test(title)) &&
    delta != null &&
    delta <= 0
  ) {
    return 'title_sign_mismatch';
  }

  // B15 — disparition sur fenêtre 1 jour
  if (
    (voice === 'today' || ctx.period === 'today' || ctx.windowSpanDays === 1) &&
    (LEFT_WINDOW_RE.test(text) || kind.includes('repertoire') || kind.includes('exit'))
  ) {
    return 'disappearance_on_today';
  }

  // C1 — comparaison durée inégale
  const winSpan = num(metrics.windowSpanDays ?? ctx.windowSpanDays);
  const baseSpan = num(metrics.baselineSpanDays ?? metrics.baselineDays);
  if (
    winSpan != null &&
    baseSpan != null &&
    Math.abs(winSpan - baseSpan) >= 3 &&
    metrics.baselineSameLength === false
  ) {
    return 'baseline_length_mismatch';
  }
  if (
    winSpan != null &&
    winSpan > 35 &&
    /30 jours d'avant|mois précédent/i.test(text) &&
    /%\s*(?:vs|contre)|contre .+ reps|volume global/i.test(text) &&
    metrics.baselineSameLength !== true
  ) {
    return 'baseline_length_mismatch';
  }

  // B14 — allures absurdes dans le texte
  const paceMatch = text.match(PACE_RE);
  if (paceMatch) {
    const candidates = [paceMatch[1], paceMatch[2], paceMatch[3], paceMatch[4], paceMatch[5]]
      .map(parsePaceToken)
      .filter((n) => n != null);
    if (candidates.some((p) => !isPlausibleRunningPaceMinPerKm(p))) return 'implausible_pace';
  }
  if (metrics.paceMinPerKm != null && !isPlausibleRunningPaceMinPerKm(metrics.paceMinPerKm)) {
    return 'implausible_pace';
  }
  if (metrics.lowPace != null && !isPlausibleRunningPaceMinPerKm(metrics.lowPace)) {
    return 'implausible_pace';
  }
  if (metrics.highPace != null && !isPlausibleRunningPaceMinPerKm(metrics.highPace)) {
    return 'implausible_pace';
  }

  // B2 — plusieurs parts pile à 50 %
  if (metrics.suspiciousHalfShares === true) return 'suspicious_half_shares';

  // B17 — demi-périodes survendues
  if (
    kind.includes('blocks') ||
    /n'ont pas le même volume|pas le même volume/i.test(title)
  ) {
    const a = num(metrics.blockAReps ?? metrics.aReps);
    const b = num(metrics.blockBReps ?? metrics.bReps);
    if (a != null && b != null && Math.max(a, b) > 0) {
      const pct = (Math.abs(a - b) / Math.max(a, b)) * 100;
      if (pct < 15) return 'half_split_oversold';
    }
  }

  // F4 — conclusions interdites encore présentes dans la prose (après polish/narration)
  const forbidden = metrics.composedEvidence?.forbiddenConclusions || [];
  if (
    forbidden.includes('adaptation_physiologique') &&
    /adaptation physiologique|gain de force généralis/i.test(text)
  ) {
    return 'forbidden_physiological_claim';
  }
  if (
    forbidden.includes('causalite_sommeil_performance') &&
    /parce que.*(nuit|sommeil)|(nuit|sommeil).*a causé/i.test(text)
  ) {
    return 'forbidden_sleep_causality';
  }
  // ISO restant dans title/body utilisateur (pas evidence technique)
  if (/\b20\d{2}-\d{2}-\d{2}\b/.test(title) || /\b20\d{2}-\d{2}-\d{2}\b/.test(String(card.body || ''))) {
    return 'iso_date_in_user_prose';
  }

  return '';
}

/**
 * Filtre une liste de cartes / candidats. Rejets → log only.
 * @template T
 * @param {T[]} cards
 * @param {{ voiceKey?: string, period?: string, windowSpanDays?: number }} [ctx]
 * @returns {T[]}
 */
export function filterValidInsights(cards, ctx = {}) {
  const kept = [];
  (cards || []).forEach((card) => {
    const rule = insightRejectReason(card, ctx);
    if (rule) {
      logRecapReject({ card, rule, values: { voiceKey: ctx.voiceKey, period: ctx.period } });
      return;
    }
    kept.push(card);
  });
  return kept;
}

/**
 * Assertions mesure (log only) — Lot A.
 * @param {object} measure
 * @param {{ label?: string }} [opts]
 */
export function assertWindowMeasureConsistency(measure, opts = {}) {
  if (!measure) return;
  const label = opts.label || 'window';
  const strength = Number(measure.strengthReps) || 0;
  const total = Number(measure.totalReps) || 0;
  const identified = Number(measure.identifiedMuscleReps) || 0;
  const strengthDays = Number(measure.strengthDays) || 0;
  // trainingDays (calendar_training_union) ≠ strengthDays (positive_reps) — F2.

  if (identified > total + 2 && total > 0) {
    logRecapReject({
      id: `${label}:muscle_sum`,
      rule: 'muscle_identified_gt_total',
      values: { identified, total, strength }
    });
  }
  if (strengthDays > 0 && strength > 0) {
    const mean = strength / strengthDays;
    const reported = Number(measure.repsPerSession);
    if (reported != null && Number.isFinite(reported) && Math.abs(reported - mean) > Math.max(8, mean * 0.12)) {
      // repsPerSession may use totalReps (banner) — log only
      logRecapReject({
        id: `${label}:reps_per_session`,
        rule: 'reps_per_session_vs_strength_mean',
        values: { reported, meanFromStrength: Math.round(mean), strengthDays }
      });
    }
  }
}
