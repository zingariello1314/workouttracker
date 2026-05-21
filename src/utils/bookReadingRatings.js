/**
 * Critères de session (1–10) et agrégation des notes lecture.
 * @module utils/bookReadingRatings
 */

export const CRITERIA_KEYS = ['immersion', 'rythme', 'richesse', 'concentration', 'plaisir'];

/** Libellés courts + échelle 1–10 (une phrase par niveau). */
export const READING_SESSION_CRITERIA = [
  {
    key: 'immersion',
    label: 'Immersion',
    intro: 'À quel point tu étais « dans » le texte, sans être tiré·e ailleurs.',
    scale: [
      '1 — interruption constante, tu relis sans t’y retrouver.',
      '2 — très fragmenté, peu de continuité mentale.',
      '3 — souvent distrait·e, la scène ne tient pas.',
      '4 — attention partielle, tu perds le fil par moments.',
      '5 — correct : lisible mais sans pic d’absorption.',
      '6 — plutôt présent·e, quelques passages te portent.',
      '7 — bonne accroche, tu reviens vite au livre si tu coupes.',
      '8 — très engagé·e, le monde autour s’estompe souvent.',
      '9 — quasi totale, tu « vois » les scènes en continu.',
      '10 — plongée maximale, expérience hypnotique de lecture.',
    ],
  },
  {
    key: 'rythme',
    label: 'Rythme de lecture',
    intro: 'Fluidité entre tes pages et le temps passé (sans juger la vitesse absolue).',
    scale: [
      '1 — chaque page est un effort, tu t’arrêtes sans cesse.',
      '2 — très haché, tu bloques sur des passages.',
      '3 — lent et laborieux, peu de momentum.',
      '4 — irrégulier, alternance fatigue / petits pics.',
      '5 — rythme moyen, ni fluide ni bloquant.',
      '6 — plutôt régulier, tu avances sans trop te battre.',
      '7 — bon flow, pauses rares et naturelles.',
      '8 — très fluide, tu enchaînes les segments.',
      '9 — quasi continue, impression de glisser sur le texte.',
      '10 — rythme optimal pour toi sur cette session.',
    ],
  },
  {
    key: 'richesse',
    label: 'Richesse perçue',
    intro: 'Idées, style, émotions ou apprentissages qui restent avec toi.',
    scale: [
      '1 — plat ou confus, rien ne retient ton attention.',
      '2 — très pauvre pour toi sur ce moment de lecture.',
      '3 — peu marquant, oubli quasi immédiat.',
      '4 — quelques bribes intéressantes seulement.',
      '5 — équilibré : du bon et du neutre.',
      '6 — plusieurs passages te marquent positivement.',
      '7 — dense à apprécier, tu prends des notes mentales.',
      '8 — très nourrissant (émotionnel ou intellectuel).',
      '9 — exceptionnel sur cette session, tu as envie d’en parler.',
      '10 — pic mémorable, tu relierais ça à une période de vie.',
    ],
  },
  {
    key: 'concentration',
    label: 'Concentration',
    intro: 'Capacité à rester focalisé·e sur la lecture pendant la session.',
    scale: [
      '1 — dispersion totale, téléphone / pensées dominent.',
      '2 — très difficile de rester sur la page.',
      '3 — nombreuses dérives, reprises difficiles.',
      '4 — concentration courte, puis fuite.',
      '5 — correcte mais fragile.',
      '6 — plutôt stable, quelques écarts.',
      '7 — bonne tenue, tu gères les interruptions.',
      '8 — forte, tu te remets vite dans le livre.',
      '9 — très focalisé·e, peu d’énergie perdue ailleurs.',
      '10 — laser : une intention, une lecture.',
    ],
  },
  {
    key: 'plaisir',
    label: 'Plaisir',
    intro: 'Envie de lire et satisfaction ressentie pendant la session.',
    scale: [
      '1 — pénible, tu as repoussé ou forcé.',
      '2 — peu agréable, soulagement d’arrêter.',
      '3 — mitigé, plus corvée que jeu.',
      '4 — correct mais sans enthousiasme.',
      '5 — neutre / fonctionnel.',
      '6 — agréable, tu ne regrettes pas le créneau.',
      '7 — bon moment, tu aurais prolongé un peu.',
      '8 — vraiment plaisant, tu anticipes la suite.',
      '9 — euphorie légère, la session te charge positivement.',
      '10 — pur kiff lecture, tu veux en remettre tout de suite.',
    ],
  },
];

const CRITERIA_BY_KEY = Object.fromEntries(READING_SESSION_CRITERIA.map((c) => [c.key, c]));

export function getCriterionScaleLabel(key, value) {
  const c = CRITERIA_BY_KEY[key];
  if (!c || !Array.isArray(c.scale)) return '';
  const idx = Math.min(9, Math.max(0, Math.round(Number(value)) - 1));
  return c.scale[idx] || '';
}

export function defaultCriteriaRatings() {
  return {
    immersion: 5,
    rythme: 5,
    richesse: 5,
    concentration: 5,
    plaisir: 5,
  };
}

export function normalizeCriteriaRatings(raw) {
  const d = defaultCriteriaRatings();
  if (!raw || typeof raw !== 'object') return d;
  CRITERIA_KEYS.forEach((k) => {
    const v = Number(raw[k]);
    d[k] = Number.isFinite(v) && v >= 1 && v <= 10 ? Math.round(v) : 5;
  });
  return d;
}

export function averageCriteriaScore(ratings) {
  const n = normalizeCriteriaRatings(ratings);
  const sum = CRITERIA_KEYS.reduce((s, k) => s + n[k], 0);
  return Math.round((sum / CRITERIA_KEYS.length) * 10) / 10;
}

export function suggestedPersonalScoreFromSessions(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  if (list.length === 0) return null;
  const scores = list
    .map((s) => averageCriteriaScore(s?.criteriaRatings))
    .filter((x) => Number.isFinite(x) && x > 0);
  if (scores.length === 0) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.min(10, Math.max(1, Math.round(avg * 10) / 10));
}

/** Note livre = moyenne des notes de session (critères 1–10). */
export function computeBookScoreFromSessions(sessions) {
  return suggestedPersonalScoreFromSessions(sessions);
}

/**
 * @returns {{ value: number, source: 'sessions' | 'completion' | 'none' }}
 */
export function getBookDisplayRating(book) {
  const fromSessions = suggestedPersonalScoreFromSessions(book?.readingSessions);
  if (fromSessions != null && fromSessions > 0) {
    return { value: fromSessions, source: 'sessions' };
  }
  const completionOverall = Number(book?.completionReview?.overall);
  if (Number.isFinite(completionOverall) && completionOverall > 0) {
    return { value: Math.min(10, completionOverall), source: 'completion' };
  }
  return { value: 0, source: 'none' };
}

export function aggregateCriteriaMeansForBook(sessions) {
  const list = Array.isArray(sessions) ? sessions : [];
  if (list.length === 0) return null;
  const sums = Object.fromEntries(CRITERIA_KEYS.map((k) => [k, 0]));
  let n = 0;
  list.forEach((s) => {
    const norm = normalizeCriteriaRatings(s?.criteriaRatings);
    CRITERIA_KEYS.forEach((k) => {
      sums[k] += norm[k];
    });
    n += 1;
  });
  if (n === 0) return null;
  const means = {};
  CRITERIA_KEYS.forEach((k) => {
    means[k] = Math.round((sums[k] / n) * 10) / 10;
  });
  return { means, sessionCount: n, overall: averageCriteriaScore(means) };
}

/** Suggestion de pages pour une durée, d’après l’historique du livre (pages/min). */
export function suggestPagesFromHistory(book, durationMinutes) {
  const dm = Number(durationMinutes);
  if (!Number.isFinite(dm) || dm <= 0) return null;
  const sessions = Array.isArray(book?.readingSessions) ? book.readingSessions : [];
  const rates = sessions
    .filter((s) => Number(s.durationMinutes) > 0 && Number(s.pagesRead) > 0)
    .map((s) => Number(s.pagesRead) / Number(s.durationMinutes));
  if (rates.length === 0) return null;
  const sorted = [...rates].sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  const suggested = Math.round(mid * dm);
  if (suggested <= 0) return null;
  const cap = Number(book?.pages) || 5000;
  return Math.min(suggested, Math.max(1, cap));
}
