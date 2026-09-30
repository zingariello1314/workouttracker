/**
 * Étiquette narrative d'un candidat déjà produit.
 * Ne détecte rien et n'écrit aucun texte.
 *
 * topic  — le sujet (mix.dos, volume.forme, …). null = pas de déduplication.
 * sense  — fact | relation | transformation.
 * stateKey — état grossier. Même bande = même état.
 */

import { natureForKind } from './recapInsightNature';

export const NARRATIVE_SENSE = {
  FACT: 'fact',
  RELATION: 'relation',
  TRANSFORMATION: 'transformation'
};

const SENSE_RANK = {
  fact: 0,
  relation: 1,
  transformation: 2
};

const GROUP_ALIAS = {
  back: 'dos',
  dos: 'dos',
  chest: 'pectoraux',
  pectoraux: 'pectoraux',
  shoulders: 'epaules',
  epaules: 'epaules',
  biceps: 'biceps',
  triceps: 'triceps',
  quadriceps: 'quadriceps',
  quads: 'quadriceps',
  calves: 'mollets',
  mollets: 'mollets',
  hamstrings: 'ischio-jambiers',
  poussee: 'poussee',
  push: 'poussee',
  pull: 'tirage',
  tirage: 'tirage'
};

/** Sens fixé par la table. Les autres kinds suivent KIND_NATURE. */
const CLAIM_TABLE = {
  disc_muscle_now: { topic: 'mix', sense: 'fact', subject: 'group' },
  disc_muscle_reorient: { topic: 'mix', sense: 'relation', subject: 'group' },
  disc_push_pull: { topic: 'mix', sense: 'relation', subject: 'family', fallback: 'poussee' },
  disc_ratio_structure: { topic: 'mix', sense: 'relation', subject: 'family', fallback: 'poussee' },
  disc_muscle_share_shift: { topic: 'mix', sense: 'relation', subject: 'group' },
  push_pull_stimulus: { topic: 'mix', sense: 'relation', subject: 'family', fallback: 'poussee' },
  disc_structural_memory: { topic: 'mix', sense: 'transformation', subject: 'family' },
  disc_family_fade: { topic: 'mix', sense: 'transformation', subject: 'family' },
  disc_stimulus_mix: { topic: 'mix', sense: 'transformation', subject: 'family' },
  disc_anchor: { topic: 'mix', sense: 'transformation', subject: 'family' },
  disc_quarter_arc: { topic: 'mix', sense: 'transformation', subject: 'family' },
  disc_exercise_share: { topic: 'exercice', sense: 'fact', subject: 'exercise' },
  span_new_variant: { topic: 'exercice', sense: 'fact', subject: 'exercise' },
  disc_emergence: { topic: 'exercice', sense: 'relation', subject: 'exercise' },
  disc_exercise_base: { topic: 'exercice', sense: 'relation', subject: 'exercise' },
  span_exercise_return: { topic: 'exercice', sense: 'relation', subject: 'exercise' },
  disc_exercise_progress: { topic: 'exercice', sense: 'transformation', subject: 'exercise' },
  journey_progress: { topic: 'exercice', sense: 'transformation', subject: 'exercise' },
  journey_pr_vs_level: { topic: 'exercice', sense: 'transformation', subject: 'exercise' },
  disc_ms_pr_consolidated: { topic: 'exercice', sense: 'transformation', subject: 'exercise' },
  disc_ms_pr: { topic: 'exercice', sense: 'fact', subject: 'exercise' },
  disc_volume_shape: { topic: 'volume.forme', sense: 'fact' },
  disc_density: { topic: 'volume.forme', sense: 'fact' },
  disc_peak_day: { topic: 'volume.forme', sense: 'fact' },
  volume_traj: { topic: 'volume.exposition', sense: 'relation' },
  exposure_vs_capacity: { topic: 'volume.exposition', sense: 'relation' },
  span_volume_vs_frequency: { topic: 'volume.exposition', sense: 'relation' },
  session_cost: { topic: 'cout.seance', sense: 'cost' },
  span_session_cost: { topic: 'cout.seance', sense: 'cost' },
  disc_pending_session: { topic: 'seance.attente', sense: 'fact' },
  disc_pending_context: { topic: 'seance.attente', sense: 'relation' },
  disc_sleep_rhythm_obs: { topic: 'sommeil.rythme', sense: 'fact' },
  disc_sleep_rhythm_habit: { topic: 'sommeil.rythme', sense: 'fact' },
  disc_sleep_regularity: { topic: 'sommeil.regularite', sense: 'fact' },
  disc_sleep_reference: { topic: 'sommeil.repere', sense: 'relation' },
  disc_sleep_weekend: { topic: 'sommeil.weekend', sense: 'relation' },
  disc_sleep_tolerance: { topic: 'sommeil.tolerance', sense: 'relation' },
  disc_sleep_drift: { topic: 'sommeil.rythme', sense: 'transformation' },
  disc_th_concentration_now: { topic: 'volume.concentration', sense: 'fact' },
  disc_th_concentration_trajectory: { topic: 'volume.concentration', sense: 'relation' },
  disc_th_concentration_journey: { topic: 'volume.concentration', sense: 'transformation' },
  disc_th_rhythm_now: { topic: 'volume.rythme', sense: 'fact' },
  disc_th_rhythm_trajectory: { topic: 'volume.rythme', sense: 'relation' },
  disc_th_rhythm_journey: { topic: 'volume.rythme', sense: 'transformation' },
  disc_th_composition_now: { topic: 'mix.composition', sense: 'fact' },
  disc_th_composition_trajectory: { topic: 'mix.composition', sense: 'relation' },
  disc_th_composition_journey: { topic: 'mix.composition', sense: 'transformation' },
  disc_th_repertoire_now: { topic: 'repertoire', sense: 'fact' },
  disc_th_repertoire_trajectory: { topic: 'repertoire', sense: 'relation' },
  disc_th_repertoire_journey: { topic: 'repertoire', sense: 'transformation' },
  disc_th_pushPull_now: { topic: 'mix.poussee', sense: 'fact' },
  disc_th_pushPull_trajectory: { topic: 'mix.poussee', sense: 'relation' },
  disc_th_pushPull_journey: { topic: 'mix.poussee', sense: 'transformation' },
  disc_th_series_now: { topic: 'exercice.serie', sense: 'fact' },
  disc_th_series_trajectory: { topic: 'exercice.serie', sense: 'relation' },
  disc_th_series_journey: { topic: 'exercice.serie', sense: 'transformation' },
  disc_th_continuity_now: { topic: 'fenetre.continuite', sense: 'fact' },
  disc_th_continuity_trajectory: { topic: 'fenetre.continuite', sense: 'relation' },
  disc_th_continuity_journey: { topic: 'fenetre.continuite', sense: 'transformation' }
};

const SLEEP_DOSE = new Set([
  'disc_sleep_volume',
  'disc_sleep_assoc',
  'disc_sleep_combo',
  'disc_sleep_month',
  'disc_sleep_perf'
]);

const COMPARISON_KEYS = [
  'ofMonthPct',
  'ofMonth',
  'vsInitialPct',
  'vsHabitPct',
  'vs30',
  'vs7',
  'volPct',
  'deltaPct',
  'volumeDeltaPct',
  'freqDeltaPct',
  'pctFromReliable',
  'beforeReps',
  'driftMin',
  'weekendGapMin',
  'volumeDelta'
];

export function kindFromNarrativeCandidate(candidate) {
  const ctxKind = candidate?.interpretation?.context?.kind;
  if (ctxKind) return String(ctxKind);
  const id = String(candidate?.id || '');
  if (id.startsWith('relation.reading.')) {
    return id.split('.').slice(3).join('.');
  }
  if (id.startsWith('relation.')) return id.slice('relation.'.length);
  return '';
}

function metricsOf(candidate) {
  return (
    candidate?.metrics ||
    candidate?.interpretation?.metrics ||
    candidate?.interpretation?.context?.metrics ||
    {}
  );
}

function slug(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  if (!s) return '';
  if (GROUP_ALIAS[s]) return GROUP_ALIAS[s];
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function subjectSlug(metrics, mode, fallback) {
  let raw = null;
  if (mode === 'group') {
    raw = metrics.leadGroup || metrics.group || metrics.topGroup || metrics.muscle || metrics.family;
  }
  else if (mode === 'family') raw = metrics.family || metrics.leadGroup || metrics.group || fallback;
  else if (mode === 'exercise') raw = metrics.exerciseId || metrics.id || metrics.name;
  if (raw == null || raw === '') raw = fallback || null;
  if (raw == null || raw === '') return null;
  return slug(raw);
}

function senseFromNature(kind) {
  const nature = natureForKind(kind);
  if (nature === 'now') return NARRATIVE_SENSE.FACT;
  if (nature === 'journey') return NARRATIVE_SENSE.TRANSFORMATION;
  return NARRATIVE_SENSE.RELATION;
}

function costSense(candidate) {
  const horizon = candidate?.horizon || candidate?.interpretation?.horizon;
  const nature =
    candidate?.nature ||
    candidate?.interpretation?.nature ||
    candidate?.interpretation?.context?.nature;
  if (horizon === 'short' || nature === 'now') return NARRATIVE_SENSE.FACT;
  return NARRATIVE_SENSE.RELATION;
}

const IDENTITY_KEYS = new Set([
  'exerciseId',
  'id',
  'name',
  'family',
  'group',
  'leadGroup',
  'topGroup',
  'muscle',
  'kind',
  'date',
  'sleepClockBand',
  'pattern',
  'axis',
  'n',
  'level',
  'spanDays'
]);

function filledMetrics(metrics) {
  if (!metrics || typeof metrics !== 'object') return false;
  return Object.keys(metrics).some((k) => metrics[k] != null && metrics[k] !== '');
}

/** Chiffres bruts, sans avant/après : la carte est un fait déguisé. */
function snapshotWithoutComparison(metrics) {
  if (!filledMetrics(metrics) || hasComparison(metrics)) return false;
  return Object.keys(metrics).some(
    (k) => metrics[k] != null && metrics[k] !== '' && !IDENTITY_KEYS.has(k)
  );
}

function hasComparison(metrics) {
  if (!filledMetrics(metrics)) return false;
  if (metrics.consolidated === true) return true;
  if (metrics.historicalMean != null && metrics.currentMean != null) return true;
  if (metrics.thenShare != null && metrics.nowShare != null) return true;
  if (
    Object.keys(metrics).some(
      (k) => /^(then|before|prev|prior)/i.test(k) && metrics[k] != null && metrics[k] !== ''
    )
  ) {
    return true;
  }
  return COMPARISON_KEYS.some((k) => metrics[k] != null && metrics[k] !== false);
}

function firstNum(metrics, keys) {
  for (const k of keys) {
    const n = Number(metrics?.[k]);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/**
 * Bande de 10 points pour une part. ±8 pour un delta (même coupure que la tendance de charge).
 * @returns {string}
 */
export function stateKeyFromMetrics(topic, metrics) {
  const m = metrics || {};
  const topicStr = String(topic || '');
  if (m.consolidated === true && topicStr.startsWith('exercice.')) return 'consolide';
  if (topicStr.startsWith('sommeil.') && m.sleepClockBand != null) {
    return `horloge-${m.sleepClockBand}`;
  }

  const share = firstNum(m, ['sharePct', 'ofMonthPct', 'topShare', 'pushPct', 'pct', 'ofMonth']);
  const delta = firstNum(m, [
    'volPct',
    'deltaPct',
    'vsInitialPct',
    'volumeDeltaPct',
    'vs30',
    'vs7',
    'freqDeltaPct'
  ]);

  if (topicStr.startsWith('mix.') && share != null) {
    return `part-${Math.floor(Math.abs(share) / 10) * 10}`;
  }
  if (topicStr.startsWith('volume.') && delta != null) {
    if (delta <= -8) return 'baisse';
    if (delta >= 8) return 'hausse';
    return 'stable';
  }
  if (share != null) return `part-${Math.floor(Math.abs(share) / 10) * 10}`;
  if (delta != null) {
    if (delta <= -8) return 'baisse';
    if (delta >= 8) return 'hausse';
    return 'stable';
  }
  return 'present';
}

/**
 * @returns {{ topic: string|null, sense: string, stateKey: string }}
 */
export function claimFromCandidate(candidate) {
  const kind = kindFromNarrativeCandidate(candidate);
  const metrics = metricsOf(candidate);
  const row = CLAIM_TABLE[kind];
  let topic = null;
  let sense = senseFromNature(kind);
  let explicit = false;

  if (SLEEP_DOSE.has(kind)) {
    topic = 'sommeil.dose';
    sense = senseFromNature(kind);
    explicit = true;
  } else if (row) {
    explicit = true;
    sense = row.sense === 'cost' ? costSense(candidate) : row.sense;
    if (row.topic === 'mix') {
      const sub = subjectSlug(metrics, row.subject, row.fallback);
      topic = sub ? `mix.${sub}` : null;
    } else if (row.topic === 'exercice') {
      const sub = subjectSlug(metrics, 'exercise');
      topic = sub ? `exercice.${sub}` : null;
    } else {
      topic = row.topic;
    }
  }

  if (sense !== NARRATIVE_SENSE.FACT && row?.sense !== 'cost' && snapshotWithoutComparison(metrics)) {
    sense = NARRATIVE_SENSE.FACT;
  }

  return {
    topic,
    sense,
    stateKey: stateKeyFromMetrics(topic, metrics)
  };
}

export function senseIsDeeper(next, prev) {
  return (SENSE_RANK[next] || 0) > (SENSE_RANK[prev] || 0);
}

export function sameClaimState(a, b) {
  if (!a?.topic || !b?.topic) return false;
  return a.topic === b.topic && a.sense === b.sense && a.stateKey === b.stateKey;
}
