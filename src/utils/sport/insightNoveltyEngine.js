/**
 * Score de nouveauté pour candidats d'insights Récap.
 */

import {
  findHistoryEntry,
  recentThemeCount,
  RECENT_MS
} from './insightNoveltyStore';
import {
  semanticGroupFromCandidateId,
  semanticGroupRecentPenalty
} from './insightSemanticThemes';

/** Extrait un thème stable depuis l'id candidat. */
export function themeFromCandidateId(id) {
  const s = String(id || '');
  if (s.startsWith('relation.reading.')) {
    return s.split('.').slice(2).join('.') || s;
  }
  if (s.startsWith('relation.')) return s.slice('relation.'.length).split('.')[0] || s;
  if (s.startsWith('event.')) return s.split('.').slice(1, 3).join('.') || s;
  const parts = s.split('.');
  return parts.length >= 2 ? `${parts[0]}.${parts[1]}` : s;
}

/**
 * @param {{ id: string, pillar?: string }} candidate
 * @param {import('./insightNoveltyStore.js').InsightHistory|null} history
 * @param {number} [now]
 * @returns {{ novelty: number, penalty: number, theme: string }}
 */
export function computeCandidateNovelty(candidate, history, now = Date.now()) {
  const theme = themeFromCandidateId(candidate?.id);
  let novelty = 0.82;
  let penalty = 0;

  const entry = findHistoryEntry(history, candidate?.id);
  if (entry) {
    const age = now - entry.seenAt;
    if (age <= RECENT_MS) {
      penalty += 28;
      novelty -= 0.28;
    }
    if (entry.count >= 5) {
      penalty += 22;
      novelty -= 0.22;
    } else if (entry.count >= 3) {
      penalty += 12;
      novelty -= 0.12;
    }
  }

  const themeRecent = recentThemeCount(history, theme, now, 7 * 86400000);
  if (themeRecent >= 1) {
    penalty += 14;
    novelty -= 0.14;
  }

  const semanticPenalty = semanticGroupRecentPenalty(history, candidate?.id, now);
  if (semanticPenalty > 0) {
    penalty += semanticPenalty;
    novelty -= semanticPenalty / 100;
  }

  if (candidate?.pillar === 'interpretation') {
    novelty += 0.06;
  }

  if (!entry) {
    novelty += 0.12;
  }

  return {
    novelty: Math.max(0.15, Math.min(1, novelty)),
    penalty,
    theme,
    semanticGroup: semanticGroupFromCandidateId(candidate?.id)
  };
}

/**
 * Ajuste le poids des candidats selon l'historique (sans filtrer).
 * @param {Array<{ id: string, weight: number, pillar?: string }>} candidates
 */
export function applyNoveltyWeights(candidates, history, now = Date.now()) {
  if (!Array.isArray(candidates)) return [];
  return candidates.map((c) => {
    const { novelty, penalty, theme } = computeCandidateNovelty(c, history, now);
    return {
      ...c,
      weight: Math.max(20, (c.weight || 0) - penalty),
      novelty,
      noveltyTheme: theme
    };
  });
}
