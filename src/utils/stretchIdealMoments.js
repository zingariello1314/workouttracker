/**
 * Moments d’usage suggérés (heuristiques) lorsque la banque n’a pas de champ dédié.
 */

/** @typedef {{ id: string, labelFr: string }} StretchMomentSuggestion */

/** @param {object} stretch — entrée stretchDatabase + key éventuelle */
export function inferStretchIdealMoments(stretch) {
  const cat = String(stretch?.category || '').toLowerCase();
  const name = String(stretch?.name || '').toLowerCase();
  /** @type {StretchMomentSuggestion[]} */
  const out = [];

  if (cat.includes('respiration')) {
    out.push({ id: 'pre_warm', labelFr: 'Avant séance / centrage' });
    out.push({ id: 'morning', labelFr: 'Matin / réveil' });
    out.push({ id: 'evening', labelFr: 'Soir / sommeil' });
    return out;
  }
  if (cat.includes('récupération') || cat.includes('recuperation') || cat.includes('décompression')) {
    out.push({ id: 'after_session', labelFr: 'Après séance' });
    out.push({ id: 'evening', labelFr: 'Soir' });
    return out;
  }
  if (cat.includes('mobilité') || cat.includes('mobilite') || cat.includes('échauffement')) {
    out.push({ id: 'pre_warm', labelFr: 'Avant séance / échauffement' });
    out.push({ id: 'morning', labelFr: 'Matin pour l’articulation' });
    return out;
  }
  if (
    cat.includes('posture') ||
    name.includes('bureau') ||
    name.includes('névralgie') ||
    name.includes('sciatique')
  ) {
    out.push({ id: 'during_day', labelFr: 'Pendant la journée (pause)' });
    out.push({ id: 'after_session', labelFr: 'Après effort ou position prolongée' });
    return out;
  }

  out.push({ id: 'after_session', labelFr: 'Souvent après séance (ou flux sanguin)' });
  out.push({ id: 'pre_optional', labelFr: 'Ou en fin d’échauffement si mobilité' });
  return out;
}
