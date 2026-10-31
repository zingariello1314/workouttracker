/**
 * Contrat de lecture analytique — vibe des analyses de référence.
 *
 * Les deux textes « pompes déclinées / hyperextensions » ne sont pas un
 * périmètre de kinds : c’est le **standard de formulation** pour toute carte
 * qui juge (exercice, densité, composition, rythme, sommeil×charge…).
 *
 * Structure (omettre un bloc si les données ne le portent pas) :
 * 1. Titre = thèse (constat principal), jamais une métrique seule en tête
 * 2. Constat chiffré + temporalité / volume d’observation
 * 3. Mécanisme ou décomposition (ce qui bouge vraiment)
 * 4. Portée (local vs partagé, comparaison utile déjà calculée)
 * 5. Implication étayée par une règle — sinon silence (pas de hedge générique)
 *
 * Interdits : « il faudrait vérifier », « si tes autres… », cibles chiffrées
 * inventées, précautions interchangeables, demander à l’utilisateur une
 * comparaison que le moteur peut faire.
 */

/**
 * @param {{
 *   titleThesis: string,
 *   constat: string,
 *   mechanism?: string|null,
 *   scope?: string|null,
 *   implication?: string|null,
 *   limit?: string|null
 * }} beats
 * @returns {{ title: string, body: string, beats: object }}
 */
export function composeAnalyticalReading(beats = {}) {
  const title = String(beats.titleThesis || '')
    .replace(/\.$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  const ordered = [
    beats.constat,
    beats.mechanism,
    beats.scope,
    beats.implication,
    beats.limit
  ]
    .map((s) => (s == null ? '' : String(s).trim()))
    .filter(Boolean)
    .map((s) => (/[.!?…]$/.test(s) ? s : `${s}.`));

  const body = ordered.join(' ').replace(/\s+/g, ' ').trim();
  return {
    title,
    body,
    beats: {
      titleThesis: title,
      constat: beats.constat || null,
      mechanism: beats.mechanism || null,
      scope: beats.scope || null,
      implication: beats.implication || null,
      limit: beats.limit || null
    }
  };
}

/** Titre-thèse : refuse un titre qui n’est qu’un pourcentage / libellé de forme. */
export function isMetricOnlyTitle(title) {
  const t = String(title || '').trim();
  if (!t) return true;
  if (/^\d+([.,]\d+)?\s*%/.test(t)) return true;
  if (/^(baisse puis reprise|évolution irrégulière|niveau récemment stable)$/i.test(t)) return true;
  return false;
}

/**
 * Petite implication densité — règles bornées, pas de causalité inventée.
 * @returns {string|null}
 */
export function densityImplication({ denser, lighter, vsPct, sleepHours, sleepHabitHours } = {}) {
  if (denser && vsPct != null && vsPct >= 8) {
    return 'Tu compresses plus de répétitions par heure : utile si la récupération suit, risqué si tu enchaînes ce rythme sans nuits à la hauteur';
  }
  if (lighter && vsPct != null && vsPct <= -8) {
    if (sleepHours != null && sleepHabitHours != null && sleepHours + 0.4 < sleepHabitHours) {
      return 'La densité baisse en même temps qu’une nuit plus courte que ton habitude : le volume par heure et la récupération bougent ensemble ici, sans en faire une loi';
    }
    return 'Moins de répétitions par heure sur cette fenêtre : le travail prend plus de temps pour un volume comparable, ou le volume a baissé dans le temps disponible';
  }
  return null;
}

/**
 * Implication composition poussée/tirage — constat d’exposition (parts attributives), pas de quota.
 */
export function pushPullImplication({ pushReps, pullReps } = {}) {
  if (!(pushReps > 0) || pullReps == null) return null;
  if (pushReps > pullReps * 2) {
    return 'L’exposition attribuée au haut du corps est clairement orientée poussée : le tirage ne suit pas dans les mêmes proportions sur cette fenêtre';
  }
  if (pushReps > pullReps * 1.6) {
    return 'L’exposition reste asymétrique en faveur de la poussée ; ce n’est pas un déficit à « rattraper » automatiquement, c’est la répartition attribuée observée';
  }
  return null;
}

/**
 * Implication rythme / creux calendaire.
 */
export function calendarGapImplication({ trainedDays, quietDays, spanDays } = {}) {
  if (quietDays == null || trainedDays == null) return null;
  if (spanDays != null && spanDays <= 8 && quietDays >= trainedDays && trainedDays <= 3) {
    return 'Avec autant de jours sans séance que de jours entraînés (ou plus), le volume de la fenêtre repose sur peu de journées : la régularité se joue sur les prochaines séances, pas sur un total déjà figé';
  }
  if (quietDays >= 3 && trainedDays >= 1) {
    return 'Les jours sans séance font partie du rythme observé : ce n’est pas un trou à remplir automatiquement par une séance « de rattrapage » hors schéma';
  }
  return null;
}

/**
 * Implication forme du volume (répartition jours / densification séances).
 */
export function volumeShapeImplication({ sparse, singleDay, habitBelow } = {}) {
  if (singleDay) {
    return 'Ce n’est pas une séance « trop courte » : c’est une organisation où tout le volume de la fenêtre tient en une journée';
  }
  if (sparse) {
    return 'Ce qui change, c’est le nombre de journées entraînées, pas forcément la taille de chaque séance';
  }
  if (habitBelow) {
    return 'Le rythme est en retrait de ton habitude : la lecture utile porte sur la répartition, pas sur un jugement de régularité absolue';
  }
  return null;
}

/**
 * Implication pic de journée dans une fenêtre.
 */
export function peakDayImplication({ sharePct, aboveMedian } = {}) {
  if (sharePct != null && sharePct >= 40) {
    return 'Une moyenne de période lisse ce pic : la séance dominante n’est pas la séance typique';
  }
  if (aboveMedian) {
    return 'Ce pic fausse une moyenne : il décrit un point haut, pas l’habitude de séance de la fenêtre';
  }
  return null;
}
