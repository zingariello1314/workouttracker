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
  progression: ['efficient_progression', 'successful_return', 'natural_deload'],
  contradiction: ['contradiction_sleep_perf'],
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
