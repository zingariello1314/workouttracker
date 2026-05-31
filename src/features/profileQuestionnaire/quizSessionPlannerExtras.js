/**
 * Compléments planificateur : min cardio, espacement stress nerveux.
 */

import {
  buildCompatContext,
  compatBlocks,
  inferBlocksFromProfile
} from './quizBlockCompat';

/**
 * Garantit au moins `minCardioDays` jours cardio dédiés.
 */
export function ensureMinDedicatedCardioDays(activeDayKeys, weekProfiles, deformers) {
  const min = deformers?.minCardioDays;
  if (!min || min < 1 || !activeDayKeys?.length) return weekProfiles;

  let cardioCount = activeDayKeys.filter((k) => weekProfiles[k]?.modality === 'cardio').length;
  if (cardioCount >= min) return weekProfiles;

  const profiles = { ...weekProfiles };
  const candidates = activeDayKeys
    .map((k, i) => ({ k, i }))
    .filter(({ k }) => profiles[k]?.modality === 'strength' && !profiles[k]?.cardioAddon);

  let idx = 0;
  while (cardioCount < min && idx < candidates.length) {
    const { k } = candidates[idx];
    profiles[k] = {
      ...profiles[k],
      modality: 'cardio',
      groups: ['cardio'],
      siteFamily: 'cardio',
      cardioAddon: false,
      title: profiles[k].title?.replace(/^Force|^Street|^Maison|^Musculation/, 'Cardio') || 'Cardio',
      focus: 'Séance cardio dédiée (ajustée pour ton objectif endurance)'
    };
    cardioCount += 1;
    idx += 1;
  }

  return profiles;
}

/**
 * Réduit fractionné si interférence J-1 élevée (score compat v6 ou heuristique v5).
 * @param {object} [compatOpts] — `{ answers, budgets }` pour scoring blocs
 */
export function applyNervousSpacingHints(weekProfiles, activeDayKeys, deformers, compatOpts = null) {
  const ctx =
    compatOpts?.answers && compatOpts?.budgets
      ? buildCompatContext(compatOpts.answers, compatOpts.budgets, deformers)
      : null;
  if (!ctx && !deformers?.allowFractionné) {
    return { weekProfiles, suppressFractionnéOnDays: [] };
  }

  const profiles = { ...weekProfiles };
  const suppress = [];

  activeDayKeys.forEach((dayKey, i) => {
    if (i === 0) return;
    const prevKey = activeDayKeys[i - 1];
    const prev = profiles[prevKey];
    const cur = profiles[dayKey];
    if (!prev || !cur) return;

    let shouldMitigate = false;
    let reasonFr = 'fractionné allégé : récupération jambes';
    let compatScore = 1;
    let worstPenalty = 0;

    if (ctx) {
      const prevBlocks = inferBlocksFromProfile(prev, deformers);
      const curBlocks = inferBlocksFromProfile(cur, deformers);
      let worst = { penalty: 0, compat: 1, reasonFr: '', hardBlock: false };
      prevBlocks.forEach((ba) => {
        curBlocks.forEach((bb) => {
          const r = compatBlocks(ba, bb, ctx, 'adjacent');
          if (r.penalty > worst.penalty) worst = r;
        });
      });
      worstPenalty = worst.penalty;
      compatScore = worst.compat;
      reasonFr = worst.reasonFr;
      shouldMitigate =
        worst.hardBlock || (worst.penalty >= 0.35 && worst.compat < 0.55);
    } else {
      const prevHeavyLegs =
        prev.modality === 'strength' &&
        Array.isArray(prev.groups) &&
        prev.groups.includes('lower');
      const prevCardioNervous = prev.modality === 'cardio';
      shouldMitigate =
        (prevHeavyLegs || prevCardioNervous) &&
        (cur.modality === 'cardio' || cur.blocks?.includes('run_interval'));
    }

    const curHasInterval =
      cur.blocks?.includes('run_interval') ||
      (cur.modality === 'cardio' && deformers?.allowFractionné !== false);

    if (shouldMitigate && curHasInterval) {
      suppress.push(dayKey);
      const blocks = (cur.blocks || ['run_interval']).map((b) =>
        b === 'run_interval' ? 'run_easy' : b
      );
      profiles[dayKey] = {
        ...cur,
        blocks: cur.blocks ? blocks : cur.blocks,
        primaryBlock: blocks[0],
        compatMitigated: true,
        compatScore,
        compatPenalty: worstPenalty,
        focus: `${cur.focus || ''} (${reasonFr})`.trim()
      };
    }
  });

  return { weekProfiles: profiles, suppressFractionnéOnDays: suppress };
}
