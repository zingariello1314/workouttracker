/**
 * Compléments planificateur : min cardio, espacement stress nerveux.
 */

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
 * Réduit fractionné / plyo si la veille était jambes lourdes ou cardio nerveux.
 */
export function applyNervousSpacingHints(weekProfiles, activeDayKeys, deformers) {
  if (!deformers?.allowFractionné) return { weekProfiles, suppressFractionnéOnDays: [] };

  const profiles = { ...weekProfiles };
  const suppress = [];

  activeDayKeys.forEach((dayKey, i) => {
    if (i === 0) return;
    const prev = profiles[activeDayKeys[i - 1]];
    const cur = profiles[dayKey];
    if (!prev || !cur) return;
    const prevHeavyLegs =
      prev.modality === 'strength' &&
      Array.isArray(prev.groups) &&
      prev.groups.includes('lower');
    const prevCardioNervous = prev.modality === 'cardio';
    if ((prevHeavyLegs || prevCardioNervous) && cur.modality === 'cardio') {
      suppress.push(dayKey);
      profiles[dayKey] = {
        ...cur,
        focus: `${cur.focus || ''} (fractionné allégé : récupération jambes)`.trim()
      };
    }
  });

  return { weekProfiles: profiles, suppressFractionnéOnDays: suppress };
}
