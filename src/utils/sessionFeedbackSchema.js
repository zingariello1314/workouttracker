/**
 * Feedback de séance — schéma v2.
 *
 * Les champs historiques (ressenti, difficulte, …) restent à la racine pour
 * Récap, le calendrier, l’XP et l’équilibrage. `answers` décrit l’état de
 * chaque réponse sans transformer un 0 hérité en « douleur absente ».
 *
 * États : answered | not_answered | absent | declined.
 * `absent` et `declined` ne sont jamais déduits d’un formulaire ancien.
 */

export const SESSION_FEEDBACK_SCHEMA_VERSION = 2;

export const SESSION_FEEDBACK_NUMERIC_FIELDS = [
  'ressenti',
  'difficulte',
  'energieDebut',
  'energieFin',
  'motivation',
  'douleur',
  'sommeil',
  'hydratation',
  'nutrition'
];

export const SESSION_FEEDBACK_TEXT_FIELDS = [
  'notes',
  'prochainObjectif',
  'tempsRepos',
  'musiquesEcoutees',
  'environnement',
  'meteo'
];

export const SESSION_FEEDBACK_LIST_FIELDS = ['tags', 'equipementUtilise'];

/** État vide du formulaire actuel. 0 et null veulent dire « pas répondu ». */
export const SESSION_FEEDBACK_FORM_DEFAULTS = {
  ressenti: 0,
  difficulte: 0,
  energieDebut: 0,
  energieFin: 0,
  motivation: 0,
  douleur: 0,
  sommeil: 0,
  hydratation: 0,
  nutrition: 0,
  tags: [],
  notes: '',
  objectifAtteint: null,
  prochainObjectif: '',
  tempsRepos: '',
  musiquesEcoutees: '',
  environnement: '',
  partenaire: false,
  meteo: '',
  equipementUtilise: []
};

const EXPLICIT_OBJECTIVE_STATES = new Set(['partial', 'unknown', 'none', 'declined']);

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function answeredNumber(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0 || n > 10) return null;
  return n;
}

export function localYmdFromIso(iso) {
  if (!iso || typeof iso !== 'string') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function feedbackRevisionMs(fb) {
  if (!isPlainObject(fb)) return 0;
  const raw = fb.updatedAt || fb.timestamp || fb.createdAt || fb.answeredAt || '';
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Valeurs à remettre dans le formulaire. Ne complète pas une douleur ou un
 * partenaire « confirmé » à partir d’un défaut.
 */
export function formStateFromStored(raw) {
  const base = {
    ...SESSION_FEEDBACK_FORM_DEFAULTS,
    tags: [],
    equipementUtilise: []
  };
  if (!isPlainObject(raw)) return base;
  for (const key of Object.keys(SESSION_FEEDBACK_FORM_DEFAULTS)) {
    if (raw[key] === undefined) continue;
    if (key === 'tags' || key === 'equipementUtilise') {
      base[key] = Array.isArray(raw[key]) ? [...raw[key]] : [];
      continue;
    }
    base[key] = raw[key];
  }
  return base;
}

function deriveAnswers(record, previousAnswers) {
  const prev = isPlainObject(previousAnswers) ? previousAnswers : {};
  const answers = {};

  for (const key of SESSION_FEEDBACK_NUMERIC_FIELDS) {
    const n = answeredNumber(record?.[key]);
    if (n != null) {
      answers[key] = { state: 'answered', value: n };
      continue;
    }
    const prior = prev[key];
    if (prior && (prior.state === 'absent' || prior.state === 'declined')) {
      answers[key] = { ...prior };
      continue;
    }
    answers[key] = { state: 'not_answered', value: null };
  }

  if (prev.pain?.presence === 'no' && answers.douleur.state !== 'answered') {
    answers.pain = { ...prev.pain };
    answers.douleur = { state: 'absent', value: null, presence: 'no' };
  } else if (answers.douleur.state === 'answered') {
    answers.pain = {
      ...(isPlainObject(prev.pain) ? prev.pain : {}),
      presence: 'yes',
      intensity: answers.douleur.value,
      state: 'answered'
    };
  } else if (isPlainObject(prev.pain) && prev.pain.presence && prev.pain.presence !== 'no') {
    answers.pain = { ...prev.pain };
  }

  if (record?.objectifAtteint === true || record?.objectifAtteint === false) {
    answers.objectif = { state: 'answered', value: record.objectifAtteint };
  } else if (prev.objectif && EXPLICIT_OBJECTIVE_STATES.has(prev.objectif.state)) {
    answers.objectif = { ...prev.objectif };
  } else {
    answers.objectif = { state: 'not_answered', value: null };
  }

  if (record?.partenaire === true) {
    answers.partenaire = { state: 'answered', value: true };
  } else if (prev.partenaire?.state === 'answered' && prev.partenaire.value === false) {
    answers.partenaire = { ...prev.partenaire };
  } else {
    answers.partenaire = { state: 'not_answered', value: null };
  }

  for (const key of SESSION_FEEDBACK_TEXT_FIELDS) {
    const text = typeof record?.[key] === 'string' ? record[key].trim() : '';
    answers[key] = text
      ? { state: 'answered', value: text }
      : { state: 'not_answered', value: null };
  }

  for (const key of SESSION_FEEDBACK_LIST_FIELDS) {
    const list = Array.isArray(record?.[key]) ? record[key].filter(Boolean) : [];
    answers[key] = list.length
      ? { state: 'answered', value: [...list] }
      : { state: 'not_answered', value: [] };
  }

  return answers;
}

/**
 * Lecture non destructive. Un objet ancien n’est pas réécrit.
 * `douleur: 0`, `objectifAtteint: null` et `partenaire: false` restent non répondus.
 */
export function readSessionFeedback(raw) {
  if (!isPlainObject(raw)) {
    return {
      present: false,
      schemaVersion: null,
      legacy: false,
      sessionDate: null,
      createdAt: null,
      updatedAt: null,
      answeredAt: null,
      retrospective: null,
      answers: {},
      form: formStateFromStored(null)
    };
  }
  const schemaVersion = Number(raw.schemaVersion) >= 2 ? SESSION_FEEDBACK_SCHEMA_VERSION : null;
  return {
    present: true,
    schemaVersion,
    legacy: schemaVersion == null,
    sessionDate: raw.sessionDate || raw.date || null,
    createdAt: raw.createdAt || null,
    updatedAt: raw.updatedAt || raw.timestamp || null,
    answeredAt: raw.answeredAt || null,
    retrospective: raw.retrospective === true ? true : raw.retrospective === false ? false : null,
    answers: deriveAnswers(raw, raw.answers),
    form: formStateFromStored(raw)
  };
}

/**
 * Enregistrement utilisateur. Les clés inconnues du feedback précédent restent.
 * Les champs du formulaire envoyés remplacent les leurs, y compris une note vidée.
 * Un 0 numérique ne devient pas une absence de douleur.
 */
export function commitSessionFeedback(previous, incoming, options = {}) {
  const prev = isPlainObject(previous) ? previous : {};
  const inc = isPlainObject(incoming) ? incoming : {};
  const now = typeof options.now === 'string' && options.now ? options.now : new Date().toISOString();
  const merged = { ...prev };
  for (const [key, value] of Object.entries(inc)) {
    if (key === 'answers' || key === 'provenance' || key === 'operationId') continue;
    merged[key] = value;
  }

  const sessionDate = merged.sessionDate || merged.date || null;
  const createdAt = prev.createdAt || prev.timestamp || now;
  const answeredAt = prev.answeredAt || prev.timestamp || now;
  const answerDay = localYmdFromIso(answeredAt);

  merged.schemaVersion = SESSION_FEEDBACK_SCHEMA_VERSION;
  merged.sessionDate = sessionDate;
  if (!merged.date && sessionDate) merged.date = sessionDate;
  merged.createdAt = createdAt;
  merged.updatedAt = now;
  merged.answeredAt = answeredAt;
  merged.timestamp = now;
  merged.retrospective = Boolean(sessionDate && answerDay && answerDay !== sessionDate);
  merged.answers = deriveAnswers(merged, prev.answers);
  merged.provenance = {
    ...(isPlainObject(prev.provenance) ? prev.provenance : {}),
    writer: 'commitSessionFeedback',
    source: 'user',
    writtenAt: now
  };
  const answeredCount = Object.values(merged.answers).filter((a) => a && a.state === 'answered').length;
  merged.completionState = answeredCount > 0 ? 'recorded' : 'empty';
  return merged;
}

/** Le gagnant impose ses valeurs ; les clés présentes seulement chez l’autre sont conservées. */
function unionFeedback(winner, loser) {
  const w = isPlainObject(winner) ? winner : {};
  const l = isPlainObject(loser) ? loser : {};
  const out = { ...l, ...w };
  if (isPlainObject(l.answers) || isPlainObject(w.answers)) {
    out.answers = { ...(isPlainObject(l.answers) ? l.answers : {}), ...(isPlainObject(w.answers) ? w.answers : {}) };
  }
  return out;
}

/**
 * Deux versions du même jour. L’absence d’horloge ne donne pas la victoire
 * à la copie distante. Les clés propres au perdant restent.
 */
export function reconcileSessionFeedbackEntry(local, remote) {
  const hasL = isPlainObject(local);
  const hasR = isPlainObject(remote);
  if (!hasL && !hasR) return null;
  if (!hasR) return local;
  if (!hasL) return remote;
  const lm = feedbackRevisionMs(local);
  const rm = feedbackRevisionMs(remote);
  if (rm === 0 || rm <= lm) return unionFeedback(local, remote);
  return unionFeedback(remote, local);
}

/** Fusion date par date. Une date présente d’un seul côté est conservée. */
export function mergeSessionFeedbackMaps(localMap, remoteMap) {
  const local = isPlainObject(localMap) ? localMap : {};
  const remote = isPlainObject(remoteMap) ? remoteMap : {};
  const dates = new Set([...Object.keys(local), ...Object.keys(remote)]);
  const out = {};
  for (const date of dates) {
    const picked = reconcileSessionFeedbackEntry(local[date], remote[date]);
    if (picked) out[date] = picked;
  }
  return out;
}
