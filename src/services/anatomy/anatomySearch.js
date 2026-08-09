import { exerciseDatabase } from '../../data/exerciseDatabase';
import { normalizeMuscleLabel, mapFineMuscleLabelToVisualGroup } from '../../utils/anatomy/fineMuscleToVisualGroup';
import {
  ANATOMY_FAMILIES,
  ANATOMY_MUSCLES,
  getAnatomyFamily,
  getAnatomyMuscle
} from '../../data/anatomy/anatomyRegistry';
import {
  excerptAroundTokens,
  listSearchableFamilyTextChunks,
  listSearchableMuscleTextChunks,
  muscleFamilyLabel,
  muscleLabel,
  textMatchesTokens
} from './anatomySearchTextIndex';

/**
 * @typedef {{ kind: 'muscle'|'family'|'exercise', id: string, label: string, hint?: string, score: number }} AnatomySearchHit
 */

/**
 * @typedef {{ kind: 'snippet', muscleId?: string, familyId?: string, sectionTitle: string, excerpt: string, highlightFrom: number, highlightTo: number, score: number }} AnatomySnippetHit
 */

function tokenize(q) {
  return normalizeMuscleLabel(q).split(' ').filter(Boolean);
}

function scoreTokens(haystack, tokens) {
  const h = normalizeMuscleLabel(haystack);
  if (!h) return 0;
  let s = 0;
  tokens.forEach((t) => {
    if (h === t) s += 12;
    else if (h.startsWith(t)) s += 9;
    else if (h.includes(t)) s += 6;
    else if (t.length >= 4 && h.includes(t.slice(0, 4))) s += 2;
  });
  return s;
}

/** @param {string} query @param {{ limit?: number }} [opts] */
export function searchAnatomy(query, opts = {}) {
  const rich = searchAnatomyRich(query, opts);
  return rich.hits;
}

/**
 * @param {string} query
 * @param {{ limit?: number, snippetLimit?: number, muscleChipLimit?: number }} [opts]
 */
export function searchAnatomyRich(query, opts = {}) {
  const limit = opts.limit ?? 12;
  const snippetLimit = opts.snippetLimit ?? 14;
  const muscleChipLimit = opts.muscleChipLimit ?? 8;
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    return { hits: [], muscleChips: [], snippets: [] };
  }

  /** @type {AnatomySearchHit[]} */
  const hits = [];

  Object.values(ANATOMY_MUSCLES).forEach((m) => {
    const blob = [m.name, m.summary, ...(m.searchAliases || []), m.id.replace(/-/g, ' ')].join(' ');
    const score = scoreTokens(blob, tokens);
    if (score > 0) {
      hits.push({
        kind: 'muscle',
        id: m.id,
        label: m.name,
        hint: getAnatomyFamily(m.familyId)?.name,
        score
      });
    }
  });

  Object.values(ANATOMY_FAMILIES).forEach((f) => {
    const blob = [f.name, f.summary, f.intro, f.outro, ...(f.searchAliases || [])].join(' ');
    const score = scoreTokens(blob, tokens);
    if (score > 0) {
      hits.push({
        kind: 'family',
        id: f.id,
        label: f.name,
        hint: `${f.muscleIds.length} muscle(s)`,
        score: score - 1
      });
    }
  });

  Object.entries(exerciseDatabase).forEach(([key, ex]) => {
    const blob = [
      ex.name,
      ex.category,
      ...(ex.primaryMuscles || []),
      ...(ex.secondaryMuscles || []),
      ...(ex.variations || [])
    ].join(' ');
    const score = scoreTokens(blob, tokens);
    if (score >= 4) {
      hits.push({
        kind: 'exercise',
        id: key,
        label: ex.name,
        hint: ex.category,
        score: score - 2
      });
    }
  });

  hits.sort((a, b) => b.score - a.score);
  const seen = new Set();
  const out = [];
  for (const h of hits) {
    const k = `${h.kind}:${h.id}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(h);
    if (out.length >= limit) break;
  }

  const muscleChips = out
    .filter((h) => h.kind === 'muscle')
    .slice(0, muscleChipLimit)
    .map((h) => ({
      muscleId: h.id,
      label: h.label,
      familyName: getAnatomyFamily(getAnatomyMuscle(h.id)?.familyId)?.name || '',
      score: h.score
    }));

  /** @type {AnatomySnippetHit[]} */
  const snippets = [];
  const snippetSeen = new Set();

  listSearchableMuscleTextChunks().forEach((chunk) => {
    if (!textMatchesTokens(chunk.plain, tokens)) return;
    const ex = excerptAroundTokens(chunk.plain, tokens);
    if (!ex) return;
    const key = `${chunk.muscleId}:${chunk.sectionId}:${ex.excerpt.slice(0, 40)}`;
    if (snippetSeen.has(key)) return;
    snippetSeen.add(key);
    snippets.push({
      kind: 'snippet',
      muscleId: chunk.muscleId,
      sectionTitle: chunk.sectionTitle,
      excerpt: ex.excerpt,
      highlightFrom: ex.highlightFrom,
      highlightTo: ex.highlightTo,
      score: scoreTokens(chunk.plain, tokens) + 3
    });
  });

  listSearchableFamilyTextChunks().forEach((chunk) => {
    if (!textMatchesTokens(chunk.plain, tokens)) return;
    const ex = excerptAroundTokens(chunk.plain, tokens);
    if (!ex) return;
    const key = `fam:${chunk.familyId}:${ex.excerpt.slice(0, 40)}`;
    if (snippetSeen.has(key)) return;
    snippetSeen.add(key);
    snippets.push({
      kind: 'snippet',
      familyId: chunk.familyId,
      sectionTitle: chunk.sectionTitle,
      excerpt: ex.excerpt,
      highlightFrom: ex.highlightFrom,
      highlightTo: ex.highlightTo,
      score: scoreTokens(chunk.plain, tokens) + 1
    });
  });

  snippets.sort((a, b) => b.score - a.score);

  return {
    hits: out,
    muscleChips,
    snippets: snippets.slice(0, snippetLimit)
  };
}

/** Exercices Momentum liés à un muscle (heuristique labels). */
export function listExercisesForMuscle(muscleId, max = 24) {
  const muscle = getAnatomyMuscle(muscleId);
  if (!muscle) return [];
  const needles = [
    muscle.name,
    ...(muscle.searchAliases || []),
    muscle.id.replace(/-/g, ' ')
  ].map((x) => normalizeMuscleLabel(x));

  const vg = muscle.visualGroupId;

  /** @type {{ key: string, name: string, equipment: string, primary: string[] }[]} */
  const out = [];

  Object.entries(exerciseDatabase).forEach(([key, ex]) => {
    const prim = (ex.primaryMuscles || []).concat(ex.secondaryMuscles || []);
    const matchLabel = prim.some((label) => {
      const n = normalizeMuscleLabel(label);
      return needles.some((nd) => n.includes(nd) || nd.includes(n));
    });
    const matchGroup =
      vg &&
      prim.some((label) => {
        const g = mapFineMuscleLabelToVisualGroup(label);
        return g === vg;
      });
    if (matchLabel || matchGroup) {
      out.push({
        key,
        name: ex.name,
        equipment: ex.equipment || '',
        primary: ex.primaryMuscles || []
      });
    }
  });

  return out.slice(0, max);
}

export { muscleLabel, muscleFamilyLabel };
