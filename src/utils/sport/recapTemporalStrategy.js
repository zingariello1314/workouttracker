/**
 * Étape C — plans de comparaison temporelle multi-stratégies.
 * Choisit des découpages pertinents ; ne maximise pas un % opportuniste.
 */

import { inclusiveCalendarSpanDays, addCalendarDays } from './garminRunningPeriodStats';

export const TEMPORAL_PLAN_KIND = Object.freeze({
  PREVIOUS_EQUAL: 'previous_equal_window',
  FIRST_VS_SECOND_HALF: 'first_vs_second_half',
  FIRST_VS_LAST_MONTH: 'first_vs_last_month',
  FIRST_VS_SECOND_TRIMESTER: 'first_vs_second_trimester',
  THIRDS: 'first_vs_last_third',
  EARLY_MID_LATE: 'early_mid_late',
  BEFORE_AFTER_GAP: 'before_after_interruption',
  FIRST_VS_LAST_SESSIONS: 'first_vs_last_sessions',
  BEST_PHASE_VS_RECENT: 'best_phase_vs_recent'
});

function spanDaysOf(window) {
  if (!window?.start || !window?.end) return 0;
  return inclusiveCalendarSpanDays(window.start, window.end) || 0;
}

function splitRange(start, end, parts) {
  const span = inclusiveCalendarSpanDays(start, end);
  if (!span || span < parts) return null;
  const size = Math.floor(span / parts);
  const out = [];
  let cursor = start;
  for (let i = 0; i < parts; i += 1) {
    const isLast = i === parts - 1;
    const pieceEnd = isLast ? end : addCalendarDays(cursor, size - 1);
    out.push({ start: cursor, end: pieceEnd, index: i });
    if (!isLast) cursor = addCalendarDays(pieceEnd, 1);
  }
  return out;
}

/**
 * Propose des plans candidats selon l’horizon (période Recap).
 * @returns {object[]}
 */
export function proposeTemporalPlans({ period, window, sessionDates = [], gapBreaks = [] } = {}) {
  const plans = [];
  const span = spanDaysOf(window);
  const nSessions = (sessionDates || []).length;
  const push = (plan) => {
    if (!plan) return;
    plans.push(plan);
  };

  // Toujours disponible si fenêtre bornée
  if (window?.start && window?.end && span >= 7) {
    push({
      kind: TEMPORAL_PLAN_KIND.PREVIOUS_EQUAL,
      question: 'La période diffère-t-elle de la précédente de même durée ?',
      reason: 'baseline calendaire égale',
      population: 'all_sessions_in_windows',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: span >= 14 && nSessions >= 4 ? 'solid' : nSessions >= 2 ? 'weak' : 'insufficient',
      limits: ['mois partiels', 'changement de programme non détecté']
    });
  }

  if (span >= 20 && nSessions >= 4) {
    const halves = splitRange(window.start, window.end, 2);
    push({
      kind: TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_HALF,
      question: 'Le début et la fin de la fenêtre racontent-ils une trajectoire ?',
      reason: 'deux moitiés calendaires',
      segments: halves,
      population: 'sessions_per_half',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: nSessions >= 6 ? 'solid' : 'weak',
      limits: ['sensible au placement des bornes']
    });
  }

  if ((period === '6m' || period === '1y' || period === '2y' || period === 'all') && span >= 150) {
    const thirds = splitRange(window.start, window.end, 3);
    push({
      kind: TEMPORAL_PLAN_KIND.THIRDS,
      question: 'Le premier tiers et le dernier tiers diffèrent-ils durablement ?',
      reason: 'horizon semestriel+',
      segments: thirds ? [thirds[0], thirds[2]] : null,
      population: 'sessions_per_third',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: nSessions >= 10 ? 'solid' : 'weak',
      limits: ['tiers calendaires ≠ phases d’entraînement']
    });
    push({
      kind: TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_TRIMESTER,
      question: 'Le premier trimestre se distingue-t-il du second ?',
      reason: 'lecture semestrielle naturelle',
      segments: halvesOrTrimesters(window),
      population: 'sessions_per_trimester',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: nSessions >= 12 ? 'solid' : 'weak',
      limits: ['trimestres calendaires']
    });
    push({
      kind: TEMPORAL_PLAN_KIND.FIRST_VS_LAST_MONTH,
      question: 'Le premier mois et le dernier mois sont-ils comparables ?',
      reason: 'contraste début/fin sur long horizon',
      population: 'sessions_first_last_month',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: nSessions >= 8 ? 'ok' : 'weak',
      limits: ['mois partiel en fin de fenêtre']
    });
  }

  if (nSessions >= 6) {
    push({
      kind: TEMPORAL_PLAN_KIND.FIRST_VS_LAST_SESSIONS,
      question: 'Les premières et dernières séances de l’arc diffèrent-elles ?',
      reason: 'granularité séance > mois opportuniste',
      population: 'early_late_session_means',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: nSessions >= 8 ? 'solid' : 'ok',
      limits: ['outliers sur petites fenêtres early/late']
    });
  }

  if ((gapBreaks || []).length) {
    push({
      kind: TEMPORAL_PLAN_KIND.BEFORE_AFTER_GAP,
      question: 'Que change l’interruption détectée ?',
      reason: 'rupture mesurée dans l’historique',
      population: 'sessions_before_after_gap',
      coverage: { gaps: gapBreaks.length, sessions: nSessions },
      robustness: 'contextual',
      limits: ['dépend de la définition du gap']
    });
  }

  if (span >= 60 && nSessions >= 8) {
    push({
      kind: TEMPORAL_PLAN_KIND.BEST_PHASE_VS_RECENT,
      question: 'Le niveau récent s’éloigne-t-il de la meilleure phase ?',
      reason: 'bilan historique',
      population: 'best_block_vs_recent_block',
      coverage: { sessions: nSessions, spanDays: span },
      robustness: nSessions >= 12 ? 'ok' : 'weak',
      limits: ['meilleure phase peut être atypique']
    });
  }

  return plans;
}

function halvesOrTrimesters(window) {
  if (!window?.start || !window?.end) return null;
  const mid = addCalendarDays(window.start, Math.floor(spanDaysOf(window) / 2) - 1);
  return [
    { start: window.start, end: mid, index: 0 },
    { start: addCalendarDays(mid, 1), end: window.end, index: 1 }
  ];
}

/**
 * Score un plan (pertinence, pas amplitude du %).
 * @param {object} plan
 * @param {{ deltaPct?: number|null, sampleA?: number, sampleB?: number, outlierShare?: number }} evidence
 */
export function scoreTemporalPlan(plan, evidence = {}) {
  if (!plan) return { score: 0, reject: 'no_plan' };
  if (plan.robustness === 'insufficient') return { score: 0, reject: 'insufficient' };

  let score = 40;
  if (plan.robustness === 'solid') score += 25;
  else if (plan.robustness === 'ok') score += 12;
  else if (plan.robustness === 'contextual') score += 18;
  else score += 4;

  const nA = Number(evidence.sampleA || 0);
  const nB = Number(evidence.sampleB || 0);
  if (nA + nB >= 8) score += 12;
  else if (nA + nB >= 4) score += 6;
  else if (nA + nB > 0 && nA + nB < 3) score -= 20;

  const delta = Math.abs(Number(evidence.deltaPct) || 0);
  // Amplitude utile mais plafonnée — pas de course au plus gros %
  if (delta >= 12 && delta < 80) score += 10;
  else if (delta >= 80) score += 4; // suspect / opportuniste
  else if (delta > 0 && delta < 8) score -= 6;

  if ((evidence.outlierShare || 0) > 0.35) score -= 15;

  // Préférences structurelles
  if (plan.kind === TEMPORAL_PLAN_KIND.BEFORE_AFTER_GAP && (evidence.gapDays || 0) >= 14) {
    score += 16;
  }
  if (plan.kind === TEMPORAL_PLAN_KIND.FIRST_VS_LAST_SESSIONS && nA + nB >= 6) {
    score += 8;
  }

  return {
    score: Math.max(0, score),
    reject: score < 25 ? 'low_score' : null,
    planKind: plan.kind
  };
}

/**
 * Retient les meilleurs plans non redondants.
 */
export function selectTemporalPlans(plans, evidencesByKind = {}, { maxPlans = 3 } = {}) {
  const ranked = (plans || [])
    .map((p) => ({ plan: p, ...scoreTemporalPlan(p, evidencesByKind[p.kind] || {}) }))
    .filter((r) => !r.reject)
    .sort((a, b) => b.score - a.score);

  const picked = [];
  const kinds = new Set();
  for (const row of ranked) {
    if (picked.length >= maxPlans) break;
    if (kinds.has(row.plan.kind)) continue;
    // Éviter deux découpes calendaires quasi équivalentes
    if (
      kinds.has(TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_HALF) &&
      row.plan.kind === TEMPORAL_PLAN_KIND.FIRST_VS_SECOND_TRIMESTER
    ) {
      continue;
    }
    picked.push(row);
    kinds.add(row.plan.kind);
  }
  return picked;
}
