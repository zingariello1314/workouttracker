/**
 * Groupes sémantiques pour la nouveauté d'insights (éviter même idée, formulation différente).
 */

/** @type {Record<string, string[]>} */
export const SEMANTIC_INSIGHT_GROUPS = {
  adaptation: [
    'adaptation_success',
    'adaptation_under_load',
    'adaptation_with_recovery_warning'
  ],
  overreach: ['possible_overreach', 'costly_progression', 'recovery_limiting', 'pr_under_fatigue'],
  stagnation: ['effort_without_return', 'plateau_despite_volume'],
  progression: ['efficient_progression', 'successful_return', 'exposure_vs_capacity'],
  discontinuity: [
    'training_discontinuity',
    'natural_deload',
    'undertraining',
    'continuity_over_capacity'
  ],
  program_gap: [
    'program_gap_adherence',
    'program_gap_completion',
    'program_gap_mixed',
    'exercise_specific_abandonment'
  ],
  structure: ['structural_imbalance', 'push_pull_stimulus'],
  contradiction: ['contradiction_sleep_perf'],
  exposure: ['exposure_rhythm'],
  composed: ['composed'],
  reading_continuity: ['continuity'],
  reading_program: ['program'],
  reading_volume: ['volume_traj'],
  reading_performance: ['performance'],
  reading_push: ['push_share'],
  reading_absence: ['absence'],
  reading_fatigue: ['unknown_fatigue'],
  reading_specialization: ['specialization'],
  reading_redundancy: ['redundancy'],
  reading_established: ['established'],
  reading_efficiency: ['efficiency'],
  reading_goal: ['goal_gap'],
  reading_capacity: ['capacity_vs_exposure'],
  reading_identity: ['identity'],
  reading_long_cont: ['continuity_level'],
  reading_recent: ['recent_vs_identity'],
  reading_level: ['level_ref'],
  reading_vol90: ['volume_90'],
  muscle: ['muscle_coverage_shift', 'muscle_vs_quarter'],
  exercise_up: ['exercise_strengths', 'exercise_long_arc'],
  exercise_down: ['exercise_watchlist'],
  load: ['load.acute.up', 'load.deload', 'event.volume_spike'],
  sleep: ['garmin.sleep.low', 'garmin.sleep.good'],
  gtg: ['gtg.week.active', 'gtg.month.rhythm', 'gtg.streak'],
  comparison: ['cmp.personal', 'cmp.program', 'cmp.historical', 'cmp.population']
};

const themeToGroup = new Map();
Object.entries(SEMANTIC_INSIGHT_GROUPS).forEach(([group, themes]) => {
  themes.forEach((t) => themeToGroup.set(t, group));
});

/** @param {string} candidateId */
export function semanticGroupFromCandidateId(candidateId) {
  const s = String(candidateId || '');
  if (s.startsWith('cmp.')) return 'comparison';
  if (s.startsWith('relation.reading.')) {
    const kind = s.split('.')[3] || s.split('.')[2];
    if (themeToGroup.has(kind)) return themeToGroup.get(kind);
    return `reading.${kind}`;
  }
  const theme = s.replace(/^relation\./, '').split('.')[0];
  if (themeToGroup.has(theme)) return themeToGroup.get(theme);
  const base = String(candidateId || '').split('.').slice(0, 2).join('.');
  for (const [group, themes] of Object.entries(SEMANTIC_INSIGHT_GROUPS)) {
    if (themes.some((t) => candidateId.includes(t) || theme === t)) return group;
  }
  if (/garmin\.sleep|feedback\.|recovery/i.test(candidateId)) return 'sleep';
  if (/load\.|volume|pushpull/i.test(candidateId)) return 'load';
  if (/gtg/i.test(candidateId)) return 'gtg';
  if (/progression|pr_|stall/i.test(candidateId)) return 'progression';
  return base || 'misc';
}

/**
 * Pénalité si un groupe sémantique a déjà été montré récemment (autre id, même famille).
 * @param {import('./insightNoveltyStore.js').InsightHistory|null} history
 */
export function semanticGroupRecentPenalty(history, candidateId, now = Date.now(), withinMs = 10 * 86400000) {
  const group = semanticGroupFromCandidateId(candidateId);
  if (!group || group === 'misc') return 0;

  const hits = (history?.entries || []).filter((e) => {
    if (now - e.seenAt > withinMs) return false;
    return semanticGroupFromCandidateId(e.id) === group || semanticGroupFromCandidateId(e.theme) === group;
  });

  if (hits.length === 0) return 0;
  if (hits.some((h) => h.id === candidateId)) return 0;
  return hits.length >= 2 ? 20 : 12;
}
