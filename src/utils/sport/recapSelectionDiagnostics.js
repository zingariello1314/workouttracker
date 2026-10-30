/**
 * Diagnostic de sélection finale par famille (plan R4).
 * Distingue génération, insuffisance de données, dédup, classement, affichage.
 */

import { kindFromNarrativeCandidate } from './recapNarrativeClaims';
import { isMilestoneKind } from './recapMilestoneEngine';

/**
 * Familles grossières pour sélection / console.
 * Ordre = priorité (premier match gagne).
 */
const FAMILY_FROM_KIND = [
  [/sleep|sommeil/, 'sleep'],
  [/gtg/, 'gtg'],
  [/stretch|mobility|souplesse/, 'mobility'],
  [/kcal|cardio|run|steps|no_running/, 'cardio'],
  [/ms_return|return|absence|abandoned|exercise_specific|level_establish/, 'exercise'],
  [/ms_cumul|ms_sessions|volume|density|peak|decomp|best_month|anchor|period_weight/, 'volume'],
  [/adherence|completion|program|pending|continuity/, 'adherence'],
  [/body|weight|imc|impedance/, 'body'],
  [/muscle|push|pull|mix|composition|stimulus|emergence|repertoire|reorient/, 'mix'],
  [/ms_|progress|pr_|plateau|goal|exercise_/, 'exercise'],
  [/identity|rhythm|freq|calendar|span_session|span_/, 'rhythm'],
  [/disc_anchor|disc_best_month|disc_quarter|disc_emergence|disc_vs|vs_habit|comparable/, 'volume'],
  [/relation\.|reading\.|span_/, 'rhythm']
];

/** Alias des familles fines (discoveries) → famille console. */
export const DISCOVERY_FAMILY_TO_COARSE = {
  rest_day: 'adherence',
  pending: 'adherence',
  pending_context: 'adherence',
  calendar_rhythm: 'rhythm',
  steps: 'cardio',
  density: 'volume',
  volume_shape: 'volume',
  muscle_now: 'mix',
  peak_day: 'volume',
  no_running: 'cardio',
  muscle_shift: 'mix',
  push_pull: 'mix',
  exercise_share: 'exercise',
  exercise_structure: 'exercise',
  emergence: 'mix',
  composition: 'mix',
  period_weight: 'volume',
  repertoire: 'exercise',
  freq_span: 'rhythm',
  kcal_profile: 'cardio',
  quarter_profile: 'volume',
  vs_habit: 'volume',
  comparable: 'exercise',
  exercise_progress: 'exercise',
  sleep_night: 'sleep',
  sleep_volume: 'sleep',
  sleep_month: 'sleep',
  sleep_week: 'sleep',
  sleep_rpe: 'sleep',
  sleep_assoc: 'sleep',
  sleep_family: 'sleep',
  sleep_cardio: 'sleep',
  sleep_quarter: 'sleep',
  sleep_freq: 'sleep',
  sleep_rhythm: 'sleep',
  sleep_reg: 'sleep',
  best_month: 'volume',
  gtg: 'gtg',
  gtg_unplanned: 'gtg'
};

/** Libellés FR pour l’UI diagnostic (jamais afficher « misc » brut). */
export const ANALYSIS_FAMILY_LABELS = {
  sleep: 'Sommeil',
  gtg: 'GTG',
  mobility: 'Mobilité',
  cardio: 'Cardio / pas',
  exercise: 'Exercices',
  volume: 'Volume & charge',
  adherence: 'Assiduité',
  body: 'Corps',
  mix: 'Composition',
  rhythm: 'Rythme & séances',
  misc: 'Non classé'
};

export function analysisFamilyLabel(family) {
  const f = String(family || 'misc');
  return ANALYSIS_FAMILY_LABELS[f] || f;
}

export function analysisFamilyOfKind(kind) {
  const k = String(kind || '').toLowerCase();
  if (!k) return 'misc';
  if (isMilestoneKind(k) && /cumul|sessions|km|hour/.test(k)) return 'volume';
  if (isMilestoneKind(k) && /return|first|pr|goal/.test(k)) return 'exercise';
  for (const [re, fam] of FAMILY_FROM_KIND) {
    if (re.test(k)) return fam;
  }
  return 'misc';
}

/**
 * Résout la famille d’un candidat : préfère family découverte mappée, sinon kind.
 * @param {object|string} rowOrKind
 */
export function resolveAnalysisFamily(rowOrKind) {
  if (rowOrKind == null) return 'misc';
  if (typeof rowOrKind === 'string') return analysisFamilyOfKind(rowOrKind);
  const raw =
    rowOrKind.family ||
    rowOrKind.interpretation?.family ||
    rowOrKind.interpretation?.context?.family ||
    null;
  if (raw) {
    const key = String(raw).toLowerCase();
    if (DISCOVERY_FAMILY_TO_COARSE[key]) return DISCOVERY_FAMILY_TO_COARSE[key];
    if (ANALYSIS_FAMILY_LABELS[key]) return key;
  }
  const kind =
    rowOrKind.kind ||
    rowOrKind.interpretation?.context?.kind ||
    kindFromNarrativeCandidate(rowOrKind) ||
    '';
  return analysisFamilyOfKind(kind);
}

function emptyBucket() {
  return {
    produced: 0,
    insufficient_data: 0,
    deduped: 0,
    ranked_out: 0,
    shown: 0,
    kindsProduced: [],
    kindsShown: []
  };
}

/**
 * @param {object} opts
 * @param {object[]} [opts.produced] — candidats avant filtres (discoveries / candidates)
 * @param {object[]} [opts.insufficient] — drop data/n
 * @param {object[]} [opts.deduped]
 * @param {object[]} [opts.rankedOut]
 * @param {object[]} [opts.shown] — pack final (short+medium+long)
 */
export function buildSelectionDiagnostics(opts = {}) {
  const byFamily = {};
  const ensure = (fam) => {
    if (!byFamily[fam]) byFamily[fam] = emptyBucket();
    return byFamily[fam];
  };

  const kindOf = (row) =>
    row?.kind ||
    row?.interpretation?.context?.kind ||
    kindFromNarrativeCandidate(row) ||
    '';

  const bump = (list, field) => {
    (list || []).forEach((row) => {
      const kind = kindOf(row);
      const fam = resolveAnalysisFamily(row);
      const b = ensure(fam);
      b[field] += 1;
      if (field === 'produced') b.kindsProduced.push(kind);
      if (field === 'shown') b.kindsShown.push(kind);
    });
  };

  bump(opts.produced, 'produced');
  bump(opts.insufficient, 'insufficient_data');
  bump(opts.deduped, 'deduped');
  bump(opts.rankedOut, 'ranked_out');
  bump(opts.shown, 'shown');

  return {
    byFamily,
    totals: Object.values(byFamily).reduce(
      (acc, b) => {
        acc.produced += b.produced;
        acc.insufficient_data += b.insufficient_data;
        acc.deduped += b.deduped;
        acc.ranked_out += b.ranked_out;
        acc.shown += b.shown;
        return acc;
      },
      { produced: 0, insufficient_data: 0, deduped: 0, ranked_out: 0, shown: 0 }
    )
  };
}

/**
 * Alerte si une famille a produit des candidats solides mais 0 affichée.
 */
export function familiesStarvedDespiteProduction(diagnostics, { minProduced = 1 } = {}) {
  const out = [];
  const map = diagnostics?.byFamily || {};
  Object.entries(map).forEach(([fam, b]) => {
    if (fam === 'misc') return;
    if ((b.produced || 0) >= minProduced && (b.shown || 0) === 0) {
      out.push({
        family: fam,
        produced: b.produced,
        ranked_out: b.ranked_out,
        deduped: b.deduped,
        insufficient_data: b.insufficient_data
      });
    }
  });
  return out;
}

const FAMILY_OF = analysisFamilyOfKind;

function candidateFamily(row) {
  const kind =
    row?.kind ||
    row?.interpretation?.context?.kind ||
    kindFromNarrativeCandidate(row) ||
    '';
  return FAMILY_OF(kind);
}

/**
 * Soft-boost des familles complémentaires sous-représentées avant classement (R4).
 * Ne crée pas de candidats : ne fait que relever le poids des familles cibles
 * lorsqu’elles existent déjà dans le pool.
 */
export function boostUnderrepresentedFamilies(candidates, { prefer = ['adherence', 'body', 'gtg', 'volume'] } = {}) {
  const list = candidates || [];
  const counts = {};
  list.forEach((c) => {
    const fam = candidateFamily(c);
    counts[fam] = (counts[fam] || 0) + 1;
  });
  const total = Math.max(1, list.length);
  return list.map((c) => {
    const fam = candidateFamily(c);
    if (!prefer.includes(fam)) return c;
    const n = counts[fam] || 0;
    // Famille rare dans le pool (< 25 %) ou peu de copies → boost fixe.
    const rare = n / total < 0.25 || n <= 2;
    if (!rare) return c;
    const bump = 8 + Math.max(0, 2 - n) * 3;
    return { ...c, weight: (c.weight || 0) + bump, _familyBoost: bump };
  });
}

/**
 * Après sélection : si une famille a produit mais 0 shown, injecte 1 candidat
 * valide dans l’horizon le moins rempli (sans dépasser le cap).
 * @returns {{ short: object[], medium: object[], long: object[], rescued: object[] }}
 */
export function rescueStarvedFamilySlots(pickedColumns, validCandidates, caps, diagnostics) {
  const short = [...(pickedColumns?.short || [])];
  const medium = [...(pickedColumns?.medium || [])];
  const long = [...(pickedColumns?.long || [])];
  const rescued = [];
  const starved = familiesStarvedDespiteProduction(diagnostics);
  if (!starved.length) return { short, medium, long, rescued };

  const shownIds = new Set([...short, ...medium, ...long].map((c) => c.id));
  const byHorizon = { short, medium, long };

  starved.forEach((row) => {
    const pool = (validCandidates || []).filter(
      (c) => !shownIds.has(c.id) && candidateFamily(c) === row.family
    );
    if (!pool.length) return;
    pool.sort((a, b) => (b.weight || 0) - (a.weight || 0));
    const pick = pool[0];
    const horizon = pick.horizon || 'medium';
    const bucket = byHorizon[horizon] || medium;
    const limit = caps?.[horizon] ?? bucket.length + 1;
    if (bucket.length < limit) {
      bucket.push(pick);
    } else if (bucket.length > 0) {
      // Remplace le plus faible poids si le rescapé est nettement meilleur / famille prioritaire.
      const weakestIdx = bucket.reduce(
        (wi, c, i, arr) => ((c.weight || 0) < (arr[wi].weight || 0) ? i : wi),
        0
      );
      const weak = bucket[weakestIdx];
      const weakFam = candidateFamily(weak);
      if (
        (pick.weight || 0) + 5 >= (weak.weight || 0) ||
        ['adherence', 'body', 'gtg'].includes(row.family)
      ) {
        // Ne pas écraser une autre famille pilote déjà rare.
        if (['adherence', 'body', 'gtg', 'volume'].includes(weakFam) && weakFam !== row.family) {
          return;
        }
        bucket[weakestIdx] = pick;
        shownIds.delete(weak.id);
      } else {
        return;
      }
    } else {
      return;
    }
    shownIds.add(pick.id);
    rescued.push({ family: row.family, id: pick.id, horizon });
  });

  return { short, medium, long, rescued };
}
