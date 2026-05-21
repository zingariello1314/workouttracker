/**
 * Triple ressenti séance (Aujourd’hui) : difficulté, ressenti, plaisir → note globale 1–5.
 * Stocké par clé `YYYY-MM-DD_exerciseId` dans `exerciseSessionPerceived`.
 * La note globale est aussi écrite dans `exerciseSessionEffortStars` pour l’analyse / historique.
 */

export const SESSION_PERCEIVED_WEIGHTS = {
  difficulty: 0.42,
  feeling: 0.38,
  pleasure: 0.2
};

export const SESSION_PERCEIVED_HINTS = {
  difficulty:
    'Effort physique perçu (1 = facile, 5 = très dur). Plus cette note monte, plus la note globale augmente.',
  feeling:
    'Intensité ressentie pendant l’exo (1 = léger, 5 = à fond). Plus tu te sens « en effort », plus la note globale monte.',
  pleasure:
    'Plaisir / envie de refaire (1 = pénible, 5 = top). Un plaisir élevé rehausse aussi la note globale de la séance.'
};

export function emptySessionPerceivedDraft() {
  return { difficulty: 0, feeling: 0, pleasure: 0 };
}

function clamp15(v) {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(5, n);
}

/**
 * Note globale 1–5 à partir des curseurs renseignés (>0 uniquement).
 */
export function computeOverallSessionStars(draft) {
  const d = emptySessionPerceivedDraft();
  Object.assign(d, draft || {});
  let sumW = 0;
  let sum = 0;
  for (const [key, w] of Object.entries(SESSION_PERCEIVED_WEIGHTS)) {
    const v = clamp15(d[key]);
    if (v <= 0) continue;
    sumW += w;
    sum += w * v;
  }
  if (sumW <= 0) return null;
  return Math.max(1, Math.min(5, Math.round(sum / sumW)));
}

export function normalizeSessionPerceivedStored(raw) {
  if (!raw || typeof raw !== 'object') return emptySessionPerceivedDraft();
  return {
    difficulty: clamp15(raw.difficulty),
    feeling: clamp15(raw.feeling),
    pleasure: clamp15(raw.pleasure)
  };
}

export function sessionPerceivedToPayload(draft) {
  const d = normalizeSessionPerceivedStored(draft);
  if (d.difficulty <= 0 && d.feeling <= 0 && d.pleasure <= 0) return null;
  return { schemaVersion: 1, ...d };
}

export function pickStoredSessionPerceived(currentData, keys, primaryKey) {
  const map = currentData?.exerciseSessionPerceived || {};
  for (const key of keys) {
    const row = map[key];
    if (row && typeof row === 'object') {
      return normalizeSessionPerceivedStored(row);
    }
  }
  const p = map[primaryKey];
  if (p && typeof p === 'object') return normalizeSessionPerceivedStored(p);

  const legacy = currentData?.exerciseSessionEffortStars || {};
  for (const key of keys) {
    const s = Number(legacy[key]);
    if (Number.isFinite(s) && s >= 1 && s <= 5) {
      return { difficulty: 0, feeling: Math.round(s), pleasure: 0 };
    }
  }
  return emptySessionPerceivedDraft();
}
