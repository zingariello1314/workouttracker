/**
 * Priorités, scoring, rivalités et sélection éditoriale des découvertes période.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { themeCountBeforeLocalDay } from './insightNoveltyStore';
import {
  SIGNAL_FAMILY_CAPS,
  SIGNAL_FAMILY_SOFT_OVERFLOW,
  SIGNAL_FAMILY_OVERFLOW_IV,
  TOTAL_SLEEP_BUDGET,
  signalFamilyOfKind
} from './recapInsightNature';
import { collapseByPhenomenon, buildPhenomenonRecord } from './recapPhenomenonContract';
import { applyEditorialGate } from './recapEditorialGate';
import {
  CONTENT_CLASS,
  contentClassForKind,
  resolveContentClass,
  isMethodologyLimitDiscovery,
  reliabilityNoteFromMethodologyDiscovery
} from './recapDiscoveryContentClass';
import { P32B_KINDS } from './recapMuscleP32bDiscoveries';
import { P35_KINDS, P35_RIVAL_GROUPS } from './recapP35Kinds';
import { P36_KINDS, P36_RIVAL_GROUPS } from './recapP36Kinds';
import {
  applyEditorialInformativeValue,
  editorialCanTake,
  isWeakDescriptiveCard,
  phenomenonIdentity,
  classifyPhenomenon
} from './recapEditorialSelection';
import { isMilestoneKind } from './recapMilestoneEngine';

export function memoryFactor(history, kind, now = Date.now(), discovery = null) {
  if (!history?.entries?.length) return 1;
  const n =
    themeCountBeforeLocalDay(history, `short.${kind}`, now) +
    themeCountBeforeLocalDay(history, `medium.${kind}`, now) +
    themeCountBeforeLocalDay(history, `long.${kind}`, now) +
    themeCountBeforeLocalDay(history, kind, now);
  const portrait =
    kind === 'disc_volume_shape' ||
    kind === 'disc_pending_session' ||
    kind === 'disc_pending_context' ||
    kind === 'disc_muscle_now';
  if (portrait) {
    if (n >= 2) return 0.8;
    if (n === 1) return 0.9;
    return 1;
  }
  if (kind === 'disc_ms_mix_shift' && n >= 1) return 0.15;
  if (kind === 'disc_ms_weight' && n >= 1) return 0.18;
  if (kind.startsWith('disc_ms_first') && n >= 1) return 0.12;
  if (kind.startsWith('disc_ms_') && n >= 2) return 0.22;
  // Trajectoire étayée : pénalité douce (conserve le passage du seuil 36)
  if (discovery?.metrics?.trajectoryOk) {
    if (n >= 3) return 0.72;
    if (n >= 2) return 0.8;
    if (n === 1) return 0.9;
    return 1;
  }
  if (n >= 2) return 0.42;
  if (n === 1) return 0.6;
  return 1;
}

/** Ce qui doit gagner chaque angle, selon la question de la plage. */
export const PERIOD_DISCOVERY_PRIORITY = {
  today: {
    now: ['disc_gtg_unplanned_now', 'disc_pending_session', 'disc_density', 'disc_sleep_night', 'disc_volume_shape', 'disc_vs_habit', 'disc_exercise_share'],
    trajectory: [
      'disc_gtg_unplanned_role',
      'disc_pending_context',
      'disc_sleep_combo',
      'disc_sleep_volume',
      'disc_sleep_perf',
      'disc_sleep_load',
      'disc_sleep_intensity',
      'disc_sleep_efficiency',
      'disc_sleep_family',
      'disc_composition_not_volume',
      'disc_structural_memory',
      'disc_stimulus_mix'
    ],
    journey: [
      'disc_gtg_unplanned_progress',
      'disc_sleep_zones',
      'disc_anchor',
      'disc_sleep_freq',
      'disc_sleep_j2',
      'disc_repertoire',
      'disc_exercise_progress',
      'disc_freq_continuity',
      'disc_sleep_quarter',
      'disc_sleep_delayed'
    ]
  },
  week: {
    now: ['disc_gtg_unplanned_now', 'disc_pending_session', 'disc_volume_shape', 'disc_peak_day', 'disc_density', 'disc_sleep_week', 'disc_sleep_night'],
    trajectory: [
      'disc_gtg_unplanned_role',
      'disc_pending_context',
      // E0 : disc_plan_data_insufficient retiré de la priority (methodology_limit → reliabilityNotes)
      'disc_plan_follow_rate',
      'disc_plan_recurring_skip',
      P35_KINDS.GTG_MOVEMENT_SHARE,
      P35_KINDS.GTG_COEXISTENCE,
      P35_KINDS.GTG_OUTSIDE_CLASSIC,
      P35_KINDS.GAP_NATURE,
      'disc_freq_progress_low',
      'disc_freq_high_no_progress',
      'disc_freq_progress_high',
      'disc_freq_decline_low_exposure',
      'disc_offplan_pattern',
      P35_KINDS.FEEDBACK_DIFFICULTE,
      P35_KINDS.CROSS_GTG_DIFFICULTE,
      P36_KINDS.FREQ_VS_VOLUME,
      P36_KINDS.WEEKDAY_REGULARITY,
      P36_KINDS.WEEKDAY_VOLUME,
      P36_KINDS.EXERCISE_VOLUME,
      P36_KINDS.EXERCISE_FREQ,
      P36_KINDS.HABIT_STABILITY,
      P36_KINDS.PROVEN_ADHERENCE_DOW,
      'disc_exercise_base',
      'disc_structural_memory',
      'disc_stimulus_mix',
      // Composition musculaire : plus bas — descriptive, pas forcée avant les trajectoires
      'disc_muscle_share_shift',
      'disc_push_pull',
      'disc_sleep_volume',
      'disc_sleep_perf',
      'disc_sleep_architecture',
      'disc_sleep_load',
      'disc_sleep_cardio',
      'disc_sleep_intensity',
      'disc_sleep_efficiency',
      'disc_sleep_family',
      'disc_sleep_assoc'
    ],
    journey: [
      'disc_gtg_unplanned_progress',
      P36_KINDS.HABIT_STABILITY,
      'disc_anchor',
      'disc_kcal_profile',
      'disc_repertoire',
      'disc_best_month',
      'disc_sleep_freq',
      'disc_sleep_zones',
      'disc_sleep_quarter',
      'disc_sleep_j2',
      'disc_sleep_delayed'
    ]
  },
  month: {
    now: ['disc_gtg_unplanned_now', 'disc_volume_shape', 'disc_density', 'disc_muscle_now'],
    trajectory: [
      'disc_gtg_unplanned_role',
      // E0 : disc_plan_data_insufficient retiré de la priority
      'disc_plan_follow_rate',
      'disc_plan_recurring_skip',
      P35_KINDS.GTG_MOVEMENT_SHARE,
      P35_KINDS.GTG_COEXISTENCE,
      P35_KINDS.GTG_OUTSIDE_CLASSIC,
      P35_KINDS.GAP_NATURE,
      P36_KINDS.FREQ_VS_VOLUME,
      P36_KINDS.WEEKDAY_REGULARITY,
      P36_KINDS.WEEKDAY_VOLUME,
      P36_KINDS.EXERCISE_VOLUME,
      P36_KINDS.EXERCISE_FREQ,
      P36_KINDS.HABIT_STABILITY,
      P36_KINDS.PROVEN_ADHERENCE_DOW,
      'disc_freq_progress_low',
      'disc_freq_high_no_progress',
      'disc_freq_progress_high',
      'disc_freq_decline_low_exposure',
      'disc_offplan_pattern',
      P35_KINDS.FEEDBACK_DIFFICULTE,
      P35_KINDS.CROSS_GTG_DIFFICULTE,
      'disc_family_fade',
      'disc_cardio_strength',
      'disc_stimulus_mix',
      'disc_muscle_share_shift',
      'disc_sleep_month',
      'disc_sleep_perf',
      'disc_sleep_load',
      'disc_sleep_cardio',
      'disc_sleep_intensity',
      'disc_sleep_rpe',
      'disc_sleep_efficiency',
      'disc_sleep_family',
      'disc_sleep_architecture'
    ],
    journey: [
      'disc_gtg_unplanned_progress',
      P36_KINDS.HABIT_STABILITY,
      'disc_monthly_volume_arc',
      'disc_best_month',
      'disc_exercise_progress',
      'disc_quarter_profile',
      'disc_running_gap',
      'disc_sleep_zones',
      'disc_sleep_j2'
    ]
  },
  long: {
    now: ['disc_gtg_unplanned_now', 'disc_volume_shape', 'disc_muscle_now', 'disc_density'],
    trajectory: [
      'disc_gtg_unplanned_role',
      P35_KINDS.GTG_MOVEMENT_SHARE,
      P35_KINDS.GTG_COEXISTENCE,
      P35_KINDS.GAP_NATURE,
      P36_KINDS.WEEKDAY_REGULARITY,
      P36_KINDS.EXERCISE_VOLUME,
      P36_KINDS.HABIT_STABILITY,
      'disc_sleep_volume',
      'disc_sleep_perf',
      'disc_sleep_combo',
      'disc_sleep_cardio',
      'disc_cardio_strength',
      'disc_muscle_share_shift',
      'disc_sleep_architecture',
      'disc_family_fade'
    ],
    journey: [
      'disc_gtg_unplanned_progress',
      'disc_monthly_volume_arc',
      P36_KINDS.HABIT_STABILITY,
      'disc_running_gap',
      'disc_sleep_quarter',
      'disc_best_month',
      'disc_sleep_freq',
      'disc_sleep_delayed',
      'disc_sleep_j2',
      'disc_quarter_arc'
    ]
  }
};
PERIOD_DISCOVERY_PRIORITY.year = {
  now: PERIOD_DISCOVERY_PRIORITY.long.now,
  trajectory: PERIOD_DISCOVERY_PRIORITY.long.trajectory,
  journey: [
    'disc_gtg_unplanned_progress',
    'disc_monthly_volume_arc',
    'disc_running_gap',
    'disc_sleep_quarter',
    'disc_best_month',
    'disc_exercise_progress',
    'disc_sleep_freq',
    'disc_sleep_delayed',
    'disc_quarter_arc'
  ]
};

/** Même constat « où va le volume / poussée-tirage » — une seule carte. */
export const COMPOSITION_STORY_KINDS = [
  'disc_muscle_now',
  'disc_push_pull',
  'disc_ratio_structure',
  'disc_muscle_share_shift',
  'disc_muscle_reorient'
];

/** P3.2b — lectures ledger (exposition / structure / plan) : rivales de la composition 74/26. */
export const P32B_MUSCLE_STORY_KINDS = [
  P32B_KINDS.EXPOSURE_CONTRAST,
  P32B_KINDS.EXPOSURE_SHIFT,
  P32B_KINDS.MOVEMENT_STRUCTURE,
  P32B_KINDS.PLAN_VS_ACTUAL
];

const MUSCLE_STORY_RIVAL_GROUP = [...COMPOSITION_STORY_KINDS, ...P32B_MUSCLE_STORY_KINDS];

const DISCOVERY_RIVALS = [
  // Composition 74/26 vs lectures ledger : une seule « story » musculaire globale.
  [...MUSCLE_STORY_RIVAL_GROUP],
  // Contraste statique vs structure push/pull : même angle descriptif de répartition.
  [P32B_KINDS.EXPOSURE_CONTRAST, P32B_KINDS.MOVEMENT_STRUCTURE],
  // Shift (évolution) peut coexister avec contrast seulement si le builder P3.2b
  // n’a pas déjà appliqué la préférence shift→contrast ; pas de rivalité dure ici.
  ['disc_anchor', 'disc_freq_continuity'],
  // Arc mensuel explicatif > portrait « pas seulement un total » / quarter_arc flou
  ['disc_monthly_volume_arc', 'disc_volume_shape', 'disc_quarter_arc'],
  ['disc_quarter_arc', 'disc_quarter_profile'],
  ['disc_exercise_share', 'disc_repertoire'],
  ['disc_family_fade', 'disc_emergence'],
  // Une seule association sommeil×charge (volume / mois / perf / RPE / intensité…).
  [
    'disc_sleep_volume',
    'disc_sleep_assoc',
    'disc_sleep_combo',
    'disc_sleep_month',
    'disc_sleep_perf',
    'disc_sleep_week',
    'disc_sleep_intensity',
    'disc_sleep_rpe',
    'disc_sleep_load',
    'disc_sleep_cardio'
  ],
  ['disc_sleep_zones', 'disc_sleep_quarter', 'disc_sleep_freq', 'disc_sleep_j2', 'disc_sleep_delayed'],
  // Placement / horaire : une seule lecture rythme (toutes natures).
  [
    'disc_sleep_rhythm_obs',
    'disc_sleep_rhythm_habit',
    'disc_sleep_regularity',
    'disc_sleep_drift',
    'disc_sleep_weekend',
    'disc_sleep_reference',
    'disc_sleep_night',
    'disc_sleep_deep'
  ],
  // GTG hors planning : une carte « rôle/continuité » suffit (progress peut coexister).
  ['disc_gtg_unplanned_now', 'disc_gtg_unplanned_role'],
  // Adhérence : taux vs constat d’insuffisance (mutuellement exclusifs en pratique).
  ['disc_plan_follow_rate', 'disc_plan_data_insufficient'],
  // Limite plan vs limite ledger musculaire : une note de fiabilité suffit.
  ['disc_plan_data_insufficient', P32B_KINDS.LEDGER_LIMITS],
  // P3.5 : rivaux sémantiques (écarts / GTG hors classique / coexistence).
  ...P35_RIVAL_GROUPS,
  ...P36_RIVAL_GROUPS
];

/** Rivals appliqués sur usedKind global (pas seulement la même nature). */
const CROSS_NATURE_RIVALS = [
  [...MUSCLE_STORY_RIVAL_GROUP],
  [P32B_KINDS.EXPOSURE_CONTRAST, P32B_KINDS.MOVEMENT_STRUCTURE],
  [
    'disc_sleep_rhythm_obs',
    'disc_sleep_rhythm_habit',
    'disc_sleep_regularity',
    'disc_sleep_drift',
    'disc_sleep_weekend',
    'disc_sleep_reference'
  ],
  [
    'disc_sleep_volume',
    'disc_sleep_assoc',
    'disc_sleep_combo',
    'disc_sleep_month',
    'disc_sleep_perf',
    'disc_sleep_week',
    'disc_sleep_rpe',
    'disc_sleep_intensity'
  ],
  ['disc_gtg_unplanned_now', 'disc_gtg_unplanned_role'],
  [P35_KINDS.GAP_NATURE, 'disc_plan_follow_rate', 'disc_plan_recurring_skip', 'disc_offplan_pattern'],
  // P3.5 : hors classique ≠ hors horaires — pas de rivalité cross-nature avec unplanned.
  [P35_KINDS.GTG_COEXISTENCE, P35_KINDS.GTG_OUTSIDE_CLASSIC],
  [P36_KINDS.EXERCISE_FREQ, P36_KINDS.EXERCISE_VOLUME, 'disc_exercise_share'],
  [P36_KINDS.HABIT_STABILITY, 'disc_freq_continuity', 'disc_anchor'],
  ['disc_monthly_volume_arc', 'disc_volume_shape', 'disc_quarter_arc']
];

export function rivalBlocked(kind, usedKinds) {
  return DISCOVERY_RIVALS.some(
    (group) => group.includes(kind) && group.some((k) => k !== kind && usedKinds.has(k))
  );
}

export function crossNatureRivalBlocked(kind, usedKindsGlobal) {
  return CROSS_NATURE_RIVALS.some(
    (group) => group.includes(kind) && group.some((k) => k !== kind && usedKindsGlobal.has(k))
  );
}

export function discoveryIdentity(d) {
  const exerciseId = d?.metrics?.exerciseId;
  return exerciseId ? `${d.kind}:${exerciseId}` : d.kind;
}

/**
 * Valeur informative réelle — départage doublons et portraits vs trajectoires.
 * Utilise rawScore (avant mémoire) si fourni, pour ne pas écraser une analyse riche.
 * E0 : fiabilité haute ≠ publication ; methodology_limit et composition descriptive sont pénalisées.
 * F5 : ajustements éditoriaux (preuve, horizon, explication, descriptifs faibles, noms).
 * @param {object} d
 * @param {string} [voiceKey='week']
 * @param {{ attachEditorial?: boolean }} [opts]
 */
export function discoveryInformativeValue(d, voiceKey = 'week', opts = {}) {
  const baseScore = Number(d?.rawScore != null ? d.rawScore : d?.score) || 0;
  let v = baseScore;
  const m = d?.metrics || {};
  const cls = resolveContentClass(d);

  if (cls === CONTENT_CLASS.METHODOLOGY_LIMIT) {
    // Plancher bas : ne doit pas gagner contre un constat athlète.
    return Math.min(v, 28) - 20;
  }

  if (m.trajectoryOk) {
    v += 6 + Math.min(10, Number(m.trajectoryRichness) || 0);
    if (m.trajectorySetAvailable) v += 4;
    if (m.trajectorySetGranularity === 'partial') v += 1; // honnêteté de granularité
    if (m.trajectoryPeers && m.trajectoryPeers !== 'insufficient') v += 4;
    if (m.trajectoryImplicationRule) v += 3;
    if (m.temporalScope?.interpretingWithHistory) v += 2;
    if (
      m.trajectoryPrimaryStory === 'net_decline' ||
      m.trajectoryPrimaryStory === 'partial_recovery' ||
      m.trajectoryPrimaryStory === 'net_rise' ||
      m.trajectoryPrimaryStory === 'recovered'
    ) {
      v += 3;
    }
  }
  // Arcs historiques multi-mois / course : forte valeur informative
  if (d?.kind === 'disc_monthly_volume_arc') v += 16;
  if (d?.kind === 'disc_running_gap') v += 12;
  // Portraits « pas seulement un total » sans mécanisme → cèdent la place
  if (
    d?.kind === 'disc_volume_shape' &&
    !m.trajectoryOk &&
    /pas seulement un total/i.test(String(d?.title || ''))
  ) {
    v -= 14;
  }
  if (d?.kind === 'disc_quarter_arc' && !m.arcKind) v -= 6;
  // Portraits composition / densité : descriptifs — ne gagnent pas contre une trajectoire riche
  if (COMPOSITION_STORY_KINDS.includes(d?.kind) && !m.trajectoryOk) v -= 8;
  if (d?.kind === 'disc_density' && !m.trajectoryOk) v -= 4;
  if (cls === CONTENT_CLASS.DESCRIPTIVE && !m.trajectoryOk) v -= 3;
  // P3.2b : évolution d’exposition solide > contraste statique modéré
  if (d?.kind === P32B_KINDS.EXPOSURE_SHIFT && m.comparabilityLevel === 'solid') v += 6;
  if (d?.kind === P32B_KINDS.EXPOSURE_CONTRAST && Number(m.relativeGap) > 0 && Number(m.relativeGap) < 0.45) {
    v -= 4;
  }

  const { value, editorial } = applyEditorialInformativeValue(v, d, voiceKey);
  if (opts.attachEditorial && d && typeof d === 'object') {
    d._editorialValue = editorial;
    d._phenomenonId = editorial.phenomenonId;
    d._phenomenon = editorial.phenomenon;
  }
  return value;
}

export function findRivalInSelected(kind, selectedList) {
  const groups = [...DISCOVERY_RIVALS, ...CROSS_NATURE_RIVALS];
  for (const group of groups) {
    if (!group.includes(kind)) continue;
    const hit = selectedList.find((s) => group.includes(s.kind) && s.kind !== kind);
    if (hit) return { rival: hit, group };
  }
  return null;
}

export function inferDropReason(d, selected, famCaps, meta = {}) {
  if (meta.forcedReason) return meta.forcedReason;
  const nature = d.nature || 'trajectory';
  const sig = signalFamilyOfKind(d.kind);
  const sameAngleKinds = new Set(
    selected.filter((s) => (s.nature || 'trajectory') === nature).map((s) => s.kind)
  );
  const allKinds = new Set(selected.map((s) => s.kind));
  const minScore = isMilestoneKind(d.kind) ? 44 : 36;
  if ((d.score || 0) < minScore) return 'score';
  if (rivalBlocked(d.kind, sameAngleKinds) || crossNatureRivalBlocked(d.kind, allKinds)) {
    return COMPOSITION_STORY_KINDS.includes(d.kind) ? 'story_duplicate_composition' : 'rival';
  }
  const sameFamilyCount = selected.filter(
    (s) => s.family && s.family === d.family && (s.nature || 'trajectory') === nature
  ).length;
  if (d.family && sameFamilyCount >= 2 && (d.score || 0) < 86) return 'family';
  const filled = selected.filter(
    (s) => (s.nature || 'trajectory') === nature && signalFamilyOfKind(s.kind) === sig
  ).length;
  const cap = famCaps[nature]?.[sig] ?? 0;
  if (filled >= cap) return 'cap';
  return 'other';
}

export function selectPeriodDiscoveriesWithTrace(discoveries, insightHistory = null, voiceKey = 'week') {
  const displaceLog = [];
  const editorialDecisions = [];
  const poolSize = (discoveries || []).length;
  const scored = (discoveries || []).map((d) => {
    const rawScore = Number(d.score) || 0;
    const base = Math.round(rawScore * memoryFactor(insightHistory, d.kind, Date.now(), d));
    const contentClass = resolveContentClass(d);
    const withBase = { ...d, rawScore, score: base, contentClass };
    const info = discoveryInformativeValue(withBase, voiceKey, { attachEditorial: true });
    const phenRec = buildPhenomenonRecord({ ...withBase, informativeValue: info });
    return {
      ...withBase,
      informativeValue: info,
      score: base,
      _editorialValue: withBase._editorialValue,
      _phenomenonRecord: phenRec,
      _phenomenonId: phenRec.id,
      _phenomenon: phenRec.class
    };
  });
  // 1) Collapse technique (même identity kind+sujet)
  const byIdentity = new Map();
  scored.forEach((d) => {
    if (!d?.kind) return;
    const key = discoveryIdentity(d);
    const prev = byIdentity.get(key);
    if (!prev || (d.informativeValue || 0) > (prev.informativeValue || 0)) byIdentity.set(key, d);
  });
  // 2) Collapse sémantique par phénomène (kind différent, même événement)
  const phenCollapse = collapseByPhenomenon([...byIdentity.values()]);
  let unique = phenCollapse.unique;
  const phenomenonCollapsed = phenCollapse.collapsed;
  // Un seul épisode de reprise par exercice (milestone 42 j + emergence 77 j, etc.).
  // Clé : id de stockage, sinon nom normalisé (si deux ids hashés pour le même mouvement).
  const returnEpisodeKey = (d) => {
    const eid = d?.metrics?.exerciseId != null ? String(d.metrics.exerciseId) : '';
    if (eid) return `id:${eid}`;
    const name = String(d?.metrics?.name || d?.metrics?.exerciseName || d?.title || '')
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\s+(revient|reviennent|après).*$/i, '')
      .trim();
    return name ? `name:${name}` : '';
  };
  const looksReturnEpisode = (d) =>
    /disc_ms_return|disc_emergence|disc_structural_memory/.test(String(d.kind || '')) &&
    (/revient|réapparition|interruption|long silence|après \d+\s*jours/i.test(
      `${d.title || ''} ${d.body || ''}`
    ) ||
      Number(d.metrics?.gapDays) >= 21 ||
      d.metrics?.trajectoryInstallation === 'returning' ||
      d.metrics?.composedEvidence?.continuity?.kind === 'returning' ||
      d.metrics?.composedEvidence?.continuity?.kind === 'punctual_return' ||
      d.metrics?.composedEvidence?.continuity?.kind === 'confirmed_return');
  const bestReturnByKey = new Map();
  unique.forEach((d) => {
    if (!looksReturnEpisode(d)) return;
    const key = returnEpisodeKey(d);
    if (!key) return;
    // Fusionner aussi name:… avec id:… quand le nom d’affichage coincide.
    const nameKey = (() => {
      const name = String(d?.metrics?.name || d?.metrics?.exerciseName || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      return name ? `name:${name}` : '';
    })();
    const prev = bestReturnByKey.get(key);
    if (!prev || (d.informativeValue || 0) > (prev.informativeValue || 0)) {
      bestReturnByKey.set(key, d);
      if (nameKey && nameKey !== key) {
        const prevName = bestReturnByKey.get(nameKey);
        if (!prevName || (d.informativeValue || 0) > (prevName.informativeValue || 0)) {
          bestReturnByKey.set(nameKey, d);
        }
      }
    }
  });
  if (bestReturnByKey.size) {
    unique = unique.filter((d) => {
      if (!looksReturnEpisode(d)) return true;
      const key = returnEpisodeKey(d);
      const name = String(d?.metrics?.name || d?.metrics?.exerciseName || '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
      const nameKey = name ? `name:${name}` : '';
      // Priorité au vainqueur par nom : deux storage ids pour le même mouvement = un épisode.
      const winner =
        (nameKey ? bestReturnByKey.get(nameKey) : null) || bestReturnByKey.get(key) || null;
      if (!winner) return true;
      return winner === d;
    });
  }
  // Tri : valeur informative d’abord, puis score (priority ne force plus les methodology_limit)
  const sorted = unique.sort(
    (a, b) => (b.informativeValue || 0) - (a.informativeValue || 0) || (b.score || 0) - (a.score || 0)
  );
  const byAngle = { now: [], trajectory: [], journey: [] };
  const usedKind = new Set();
  const usedIdentity = new Set();
  const usedKindByNature = { now: new Set(), trajectory: new Set(), journey: new Set() };
  const usedFamilyByNature = { now: new Map(), trajectory: new Map(), journey: new Map() };
  const familyCount = {
    now: { sport: 0, sleep: 0, milestone: 0 },
    trajectory: { sport: 0, sleep: 0, milestone: 0 },
    journey: { sport: 0, sleep: 0, milestone: 0 }
  };
  const priority = PERIOD_DISCOVERY_PRIORITY[voiceKey] || PERIOD_DISCOVERY_PRIORITY.week;
  const famCaps = SIGNAL_FAMILY_CAPS[voiceKey] || SIGNAL_FAMILY_CAPS.week;
  const softOverflow = SIGNAL_FAMILY_SOFT_OVERFLOW[voiceKey] ?? 6;
  const overflowIv = SIGNAL_FAMILY_OVERFLOW_IV[voiceKey] ?? 70;
  const sleepBudget = TOTAL_SLEEP_BUDGET[voiceKey] ?? TOTAL_SLEEP_BUDGET.week;
  let sleepTaken = 0;
  /** @type {object[]} */
  const reliabilityNotes = [];
  const usedPhenomenonIds = new Set();

  const flatSelected = () => [...byAngle.now, ...byAngle.trajectory, ...byAngle.journey];

  const removeFromSelection = (victim) => {
    const nature = victim.nature || 'trajectory';
    const sig = signalFamilyOfKind(victim.kind);
    byAngle[nature] = byAngle[nature].filter((x) => discoveryIdentity(x) !== discoveryIdentity(victim));
    usedKind.delete(victim.kind);
    usedIdentity.delete(discoveryIdentity(victim));
    usedKindByNature[nature].delete(victim.kind);
    const vPhen = victim._phenomenonId || phenomenonIdentity(victim);
    if (vPhen) usedPhenomenonIds.delete(vPhen);
    if (victim.family) {
      const n = (usedFamilyByNature[nature].get(victim.family) || 1) - 1;
      if (n <= 0) usedFamilyByNature[nature].delete(victim.family);
      else usedFamilyByNature[nature].set(victim.family, n);
    }
    if (familyCount[nature]?.[sig] != null) {
      familyCount[nature][sig] = Math.max(0, familyCount[nature][sig] - 1);
    }
    if (sig === 'sleep') sleepTaken = Math.max(0, sleepTaken - 1);
  };

  const canTake = (d) => {
    const nature = d.nature || 'trajectory';
    const info = d.informativeValue || 0;

    // E0 : limites méthodologiques → notes de fiabilité (jamais slot principal)
    if (isMethodologyLimitDiscovery(d)) {
      return { ok: false, reason: 'methodology_demoted' };
    }

    // Seuil score : une trajectoire riche (valeur informative élevée) ne doit pas
    // être éliminée uniquement par la mémoire de kind qui écrase le score affiché.
    const scoreOk =
      (d.score || 0) >= 36 ||
      (Boolean(d.metrics?.trajectoryOk) && info >= 85) ||
      ((Number(d.rawScore) || 0) >= 55 && info >= 90);
    if (!scoreOk) return { ok: false, reason: 'score' };
    if (usedIdentity.has(discoveryIdentity(d))) return { ok: false, reason: 'identity' };
    if (!d.metrics?.exerciseId && usedKind.has(d.kind)) return { ok: false, reason: 'kind' };

    const rivalHit = findRivalInSelected(d.kind, flatSelected());
    if (rivalHit) {
      const { rival } = rivalHit;
      const gain = info - (rival.informativeValue || 0);
      // Remplacer seulement si clairement plus informatif (évite flip-flop)
      if (gain >= 5) {
        return { ok: true, displace: rival, reason: 'outranked_by_richer' };
      }
      return {
        ok: false,
        reason: COMPOSITION_STORY_KINDS.includes(d.kind) ? 'story_duplicate_composition' : 'rival',
        blockedBy: rival.kind
      };
    }

    // F5 — rivalité de phénomène / contradiction pack / caps épisode / noms
    const editorial = editorialCanTake(d, flatSelected(), voiceKey);
    if (!editorial.ok) {
      return {
        ok: false,
        reason: editorial.reason,
        blockedBy: editorial.blockedBy || null,
        phenomenonId: editorial.phenomenonId || d._phenomenonId
      };
    }
    if (editorial.displace) {
      return {
        ok: true,
        displace: editorial.displace,
        reason: editorial.reason || 'phenomenon_outranked'
      };
    }

    const seenFamily = usedFamilyByNature[nature].get(d.family) || 0;
    // Famille déjà peuplée : laisser passer davantage d’exercices / phénomènes riches
    const familySoftCap = voiceKey === 'today' ? 3 : voiceKey === 'week' ? 5 : voiceKey === 'month' ? 7 : 8;
    if (d.family && seenFamily >= familySoftCap && (d.score || 0) < 78 && info < 85) {
      return { ok: false, reason: 'family' };
    }
    return { ok: true };
  };

  const take = (d) => {
    if (isMilestoneKind(d.kind)) return false;
    if (isMethodologyLimitDiscovery(d)) {
      d._dropHint = 'methodology_demoted';
      const note = reliabilityNoteFromMethodologyDiscovery(d);
      if (note && !reliabilityNotes.some((n) => n.kind === note.kind)) reliabilityNotes.push(note);
      return false;
    }
    const nature = d.nature || 'trajectory';
    const sig = signalFamilyOfKind(d.kind);
    const cap = famCaps[nature]?.[sig] ?? 0;
    const used = familyCount[nature]?.[sig] || 0;
    const phenId = d._phenomenonId || phenomenonIdentity(d);
    // Cap souple : au-delà du plafond, accepter si IV élevée + phénomène pas déjà pris.
    if (used >= cap) {
      const allowOverflow =
        sig === 'sport' &&
        used < cap + softOverflow &&
        (d.informativeValue || 0) >= overflowIv &&
        !usedPhenomenonIds.has(phenId) &&
        (Boolean(d.metrics?.trajectoryOk) ||
          Boolean(d.metrics?.composedOk) ||
          (d.informativeValue || 0) >= overflowIv + 8);
      if (!allowOverflow) {
        d._dropHint = 'cap';
        return false;
      }
      d._capOverflow = true;
    }
    if (sig === 'sleep' && sleepTaken >= sleepBudget) {
      d._dropHint = 'sleep_budget';
      return false;
    }
    const decision = canTake(d);
    if (!decision.ok) {
      d._dropHint = decision.reason;
      d._blockedBy = decision.blockedBy || null;
      editorialDecisions.push({
        action: 'reject',
        identity: discoveryIdentity(d),
        kind: d.kind,
        reason: decision.reason,
        blockedBy: decision.blockedBy || null,
        phenomenonId: decision.phenomenonId || d._phenomenonId || null,
        informativeValue: d.informativeValue,
        editorialFactors: d._editorialValue?.factors || []
      });
      return false;
    }
    if (decision.displace) {
      displaceLog.push({
        kept: discoveryIdentity(d),
        dropped: discoveryIdentity(decision.displace),
        reason: decision.reason,
        keptValue: d.informativeValue,
        droppedValue: decision.displace.informativeValue,
        phenomenonId: d._phenomenonId || null
      });
      editorialDecisions.push({
        action: 'displace',
        kept: discoveryIdentity(d),
        dropped: discoveryIdentity(decision.displace),
        reason: decision.reason,
        keptValue: d.informativeValue,
        droppedValue: decision.displace.informativeValue
      });
      removeFromSelection(decision.displace);
      decision.displace._dropHint = decision.reason || 'outranked_by_richer';
      decision.displace._blockedBy = d.kind;
    }
    byAngle[nature].push(d);
    usedKind.add(d.kind);
    usedIdentity.add(discoveryIdentity(d));
    usedKindByNature[nature].add(d.kind);
    if (phenId) usedPhenomenonIds.add(phenId);
    if (d.family) {
      usedFamilyByNature[nature].set(d.family, (usedFamilyByNature[nature].get(d.family) || 0) + 1);
    }
    familyCount[nature][sig] += 1;
    if (sig === 'sleep') sleepTaken += 1;
    editorialDecisions.push({
      action: 'select',
      identity: discoveryIdentity(d),
      kind: d.kind,
      informativeValue: d.informativeValue,
      phenomenonId: d._phenomenonId || null,
      phenomenon: d._phenomenon || null,
      capOverflow: Boolean(d._capOverflow),
      editorialFactors: d._editorialValue?.factors || []
    });
    return true;
  };

  // Priority : couverture thématique, mais jamais les methodology_limit
  ['now', 'trajectory', 'journey'].forEach((angle) => {
    (priority[angle] || []).forEach((kind) => {
      if (contentClassForKind(kind) === CONTENT_CLASS.METHODOLOGY_LIMIT) return;
      const hit = unique.find((d) => d.kind === kind && (d.nature || 'trajectory') === angle);
      if (hit) take(hit);
    });
  });

  sorted.forEach((d) => take(d));

  ['now', 'trajectory', 'journey'].forEach((angle) => {
    const cap = famCaps[angle]?.milestone ?? 1;
    sorted.forEach((d) => {
      if (!isMilestoneKind(d.kind)) return;
      if ((d.nature || 'trajectory') !== angle) return;
      if ((familyCount[angle].milestone || 0) >= cap) return;
      if (usedKind.has(d.kind)) return;
      if (usedIdentity.has(discoveryIdentity(d))) return;
      if ((d.score || 0) < 44) return;
      // F5 : jalons (ex. disc_ms_return) soumis aux rivalités de phénomène
      const editorial = editorialCanTake(d, flatSelected(), voiceKey);
      if (!editorial.ok) {
        d._dropHint = editorial.reason;
        d._blockedBy = editorial.blockedBy || null;
        editorialDecisions.push({
          action: 'reject_milestone',
          identity: discoveryIdentity(d),
          kind: d.kind,
          reason: editorial.reason,
          blockedBy: editorial.blockedBy || null,
          phenomenonId: editorial.phenomenonId || d._phenomenonId || null,
          informativeValue: d.informativeValue
        });
        return;
      }
      if (editorial.displace) {
        displaceLog.push({
          kept: discoveryIdentity(d),
          dropped: discoveryIdentity(editorial.displace),
          reason: editorial.reason,
          keptValue: d.informativeValue,
          droppedValue: editorial.displace.informativeValue,
          phenomenonId: d._phenomenonId || null
        });
        removeFromSelection(editorial.displace);
        editorial.displace._dropHint = editorial.reason || 'phenomenon_outranked';
        editorial.displace._blockedBy = d.kind;
      }
      byAngle[angle].push(d);
      usedKind.add(d.kind);
      usedIdentity.add(discoveryIdentity(d));
      usedKindByNature[angle].add(d.kind);
      if (d.family) {
        usedFamilyByNature[angle].set(
          d.family,
          (usedFamilyByNature[angle].get(d.family) || 0) + 1
        );
      }
      familyCount[angle].milestone += 1;
      editorialDecisions.push({
        action: 'select_milestone',
        identity: discoveryIdentity(d),
        kind: d.kind,
        informativeValue: d.informativeValue,
        phenomenonId: d._phenomenonId || null,
        phenomenon: d._phenomenon || null
      });
    });
  });

  // F5 — abstention : ne pas saturer avec des descriptifs faibles s’il existe déjà
  // des cartes analytiques. Si le pack n’a que des observations simples, on les
  // conserve (utilité > page vide), sauf sous un plancher absolu.
  const ABSTAIN_IV = { today: 42, week: 48, month: 50, long: 52, year: 52 };
  const HARD_FLOOR = 32;
  const minPublish = ABSTAIN_IV[voiceKey] ?? 48;
  const current = flatSelected();
  const hasStrong = current.some(
    (d) =>
      !isWeakDescriptiveCard(d) ||
      Boolean(d.metrics?.trajectoryOk) ||
      Boolean(d.metrics?.composedOk) ||
      (d.informativeValue || 0) >= minPublish + 12
  );
  if (hasStrong) {
    current.forEach((d) => {
      if (!isWeakDescriptiveCard(d)) return;
      if ((d.informativeValue || 0) >= minPublish) return;
      if (d.metrics?.trajectoryOk || d.metrics?.composedOk) return;
      removeFromSelection(d);
      d._dropHint = 'abstain_low_value';
      editorialDecisions.push({
        action: 'abstain',
        identity: discoveryIdentity(d),
        kind: d.kind,
        reason: 'abstain_low_value',
        informativeValue: d.informativeValue
      });
    });
  } else {
    // Pack uniquement faible : garder au plus 2 cartes au-dessus du plancher.
    const keepIds = new Set(
      [...current]
        .filter((d) => (d.informativeValue || 0) >= HARD_FLOOR)
        .sort((a, b) => (b.informativeValue || 0) - (a.informativeValue || 0))
        .slice(0, 2)
        .map((d) => discoveryIdentity(d))
    );
    current.forEach((d) => {
      if (keepIds.has(discoveryIdentity(d))) return;
      removeFromSelection(d);
      d._dropHint = 'abstain_low_value';
      editorialDecisions.push({
        action: 'abstain',
        identity: discoveryIdentity(d),
        kind: d.kind,
        reason: 'abstain_empty_pack',
        informativeValue: d.informativeValue
      });
    });
  }

  // Collecter les notes pour les limites non prises via take()
  unique.forEach((d) => {
    if (!isMethodologyLimitDiscovery(d)) return;
    const note = reliabilityNoteFromMethodologyDiscovery(d);
    if (note && !reliabilityNotes.some((n) => n.kind === note.kind)) reliabilityNotes.push(note);
  });

  const selected = [...byAngle.now, ...byAngle.trajectory, ...byAngle.journey];
  const droppedFromUnique = unique
    .filter((d) => !usedIdentity.has(discoveryIdentity(d)))
    .map((d) => ({
      ...d,
      nature: d.nature || 'trajectory',
      signalFamily: signalFamilyOfKind(d.kind),
      contentClass: resolveContentClass(d),
      reason: inferDropReason(d, selected, famCaps, {
        forcedReason: d._dropHint || (isMethodologyLimitDiscovery(d) ? 'methodology_demoted' : null)
      }),
      blockedBy: d._blockedBy || null,
      informativeValue: d.informativeValue,
      phenomenonId: d._phenomenonId || null,
      phenomenon: d._phenomenon || null
    }));
  const droppedCollapsed = (phenomenonCollapsed || []).map((d) => ({
    ...d,
    nature: d.nature || 'trajectory',
    signalFamily: signalFamilyOfKind(d.kind),
    contentClass: resolveContentClass(d),
    reason: 'phenomenon_collapse',
    informativeValue: d.informativeValue,
    phenomenonId: d._phenomenonId || d._collapsedInto || null,
    phenomenon: d._phenomenon || null
  }));
  const dropped = [...droppedFromUnique, ...droppedCollapsed];

  const rejectedByReason = dropped.reduce((acc, d) => {
    acc[d.reason] = (acc[d.reason] || 0) + 1;
    return acc;
  }, {});

  return {
    selected,
    dropped,
    displaceLog,
    compositionStoryKinds: COMPOSITION_STORY_KINDS,
    reliabilityNotes,
    /** F5 — comptages disjoints (pas de double addition multi-étapes). */
    counts: {
      pool: poolSize,
      eligible: unique.length,
      selected: selected.length,
      rejected: droppedFromUnique.length,
      phenomenonCollapsed: (phenomenonCollapsed || []).length,
      identityCollapsed: Math.max(0, poolSize - byIdentity.size),
      softOverflowUsed: selected.filter((d) => d._capOverflow).length
    },
    rejectedByReason,
    editorialDecisions,
    voiceKey
  };
}

export function selectPeriodDiscoveries(discoveries, insightHistory = null, voiceKey = 'week') {
  return selectPeriodDiscoveriesWithTrace(discoveries, insightHistory, voiceKey).selected;
}

/**
 * @returns {{
 *   comparisons: object,
 *   all: object[],
 *   selected: object[],
 *   question: string,
 *   preferPeriodNow: boolean
 * }}
 */
export function refillAfterGate(selected, pool, voiceKey) {
  const kept = [...(selected || [])];
  const seen = new Set(kept.map((card) => discoveryIdentity(card)));
  const famCaps = SIGNAL_FAMILY_CAPS[voiceKey] || SIGNAL_FAMILY_CAPS.week;
  const counts = {
    now: { sport: 0, sleep: 0, milestone: 0 },
    trajectory: { sport: 0, sleep: 0, milestone: 0 },
    journey: { sport: 0, sleep: 0, milestone: 0 }
  };
  const familyCount = { now: new Map(), trajectory: new Map(), journey: new Map() };
  kept.forEach((card) => {
    const nature = card.nature || 'trajectory';
    counts[nature][signalFamilyOfKind(card.kind)] += 1;
    if (card.family) {
      familyCount[nature].set(card.family, (familyCount[nature].get(card.family) || 0) + 1);
    }
  });
  [...(pool || [])]
    .filter((card) => card.reason === 'cap' && !isMethodologyLimitDiscovery(card))
    .sort((a, b) => (b.informativeValue || b.score || 0) - (a.informativeValue || a.score || 0))
    .forEach((card) => {
      const identity = discoveryIdentity(card);
      if (seen.has(identity)) return;
      const nature = card.nature || 'trajectory';
      const sig = signalFamilyOfKind(card.kind);
      if ((counts[nature][sig] || 0) >= (famCaps[nature]?.[sig] ?? 0)) return;
      const seenFamily = familyCount[nature].get(card.family) || 0;
      if (card.family && seenFamily >= 2 && (card.score || 0) < 86) return;
      // F5 : le refill ne doit pas réintroduire un rival / contradiction / anonyme
      const editorial = editorialCanTake(card, kept, voiceKey);
      if (!editorial.ok) return;
      if (editorial.displace) {
        const victimId = discoveryIdentity(editorial.displace);
        const idx = kept.findIndex((c) => discoveryIdentity(c) === victimId);
        if (idx >= 0) {
          const victim = kept[idx];
          kept.splice(idx, 1);
          seen.delete(victimId);
          const vNature = victim.nature || 'trajectory';
          const vSig = signalFamilyOfKind(victim.kind);
          counts[vNature][vSig] = Math.max(0, (counts[vNature][vSig] || 1) - 1);
          if (victim.family) {
            const n = (familyCount[vNature].get(victim.family) || 1) - 1;
            if (n <= 0) familyCount[vNature].delete(victim.family);
            else familyCount[vNature].set(victim.family, n);
          }
        }
      }
      const gated = applyEditorialGate([card], { voiceKey });
      if (!gated.length) return;
      kept.push(gated[0]);
      seen.add(identity);
      counts[nature][sig] += 1;
      if (card.family) familyCount[nature].set(card.family, seenFamily + 1);
    });
  return kept;
}
