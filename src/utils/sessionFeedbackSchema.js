/**
 * Feedback de séance — schéma v2.
 *
 * Les champs historiques (ressenti, difficulte, …) restent à la racine pour
 * Récap, le calendrier, l’XP et l’équilibrage. `answers` décrit l’état de
 * chaque réponse sans transformer un 0 hérité en « douleur absente ».
 *
 * États : answered | not_answered | absent | declined.
 * `absent` et `declined` ne sont jamais déduits d’un formulaire ancien.
 *
 * Le catalogue (`sessionFeedbackCatalog.js`) et la validation
 * (`sessionFeedbackValidate.js`) alimentent `commitCatalogFeedback`.
 */

import {
  ANSWER_STATES,
  ENVIRONNEMENT_TO_PLACE,
  METEO_TO_WEATHER,
  PLACE_TO_ENVIRONNEMENT,
  REST_BAND_TO_TEMPS_REPOS,
  WEATHER_TO_METEO
} from './sessionFeedbackCatalog.js';
import {
  assessAnswerConsistency,
  hasSignificantCatalogAnswers,
  normalizeCatalogAnswers,
  suggestedClarifications
} from './sessionFeedbackValidate.js';

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

const CATALOG_ANSWER_KEYS = [
  'experience',
  'effort',
  'energy_before',
  'pain_presence',
  'pain_intensity',
  'pain_region',
  'pain_side',
  'pain_onset',
  'pain_effect',
  'pain_exercise',
  'motivation_before',
  'energy_after',
  'sleep_prev',
  'fed_enough',
  'hydrated_enough',
  'session_intent',
  'intent_attained',
  'primary_limiter',
  'session_partial_status',
  'adaptation_reason',
  'effort_demand_reason',
  'intent_blocker',
  'dissatisfaction_reason',
  'low_energy_reason',
  'place',
  'equipment_changed',
  'equipment_changed_note',
  'rest_band',
  'partner',
  'context_tags',
  'notes',
  'music',
  'weather'
];

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

  // Effort 0 explicite (catalogue) — pas miroir difficulte.
  if (prev.effort?.state === 'answered' && prev.effort.value === 0) {
    answers.effort = { state: 'answered', value: 0 };
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

  // Préserver / reporter les clés catalogue déjà structurées.
  for (const key of CATALOG_ANSWER_KEYS) {
    if (isPlainObject(prev[key]) && prev[key].state) {
      answers[key] = { ...prev[key] };
    }
  }

  return answers;
}

function catalogCell(answers, id) {
  return isPlainObject(answers?.[id]) ? answers[id] : null;
}

function isAnswered(cell) {
  return cell && cell.state === ANSWER_STATES.ANSWERED;
}

/**
 * Mappe les réponses catalogue normalisées → champs racine historiques + bloc answers.
 * Ne invente pas nutrition/hydratation 1–10 à partir des ordinaux (évite de polluer Récap).
 */
export function mapCatalogAnswersToHistorical(catalogAnswers) {
  const a = isPlainObject(catalogAnswers) ? catalogAnswers : {};
  const root = {};
  const answers = { ...a };

  const experience = catalogCell(a, 'experience');
  if (isAnswered(experience)) {
    root.ressenti = experience.value;
    answers.ressenti = { state: 'answered', value: experience.value };
  }

  const effort = catalogCell(a, 'effort');
  if (isAnswered(effort)) {
    answers.effort = { state: 'answered', value: effort.value };
    if (Number(effort.value) >= 1) {
      root.difficulte = effort.value;
      answers.difficulte = { state: 'answered', value: effort.value };
    }
  }

  const energyBefore = catalogCell(a, 'energy_before');
  if (isAnswered(energyBefore)) {
    root.energieDebut = energyBefore.value;
    answers.energieDebut = { state: 'answered', value: energyBefore.value };
  }

  const energyAfter = catalogCell(a, 'energy_after');
  if (isAnswered(energyAfter)) {
    root.energieFin = energyAfter.value;
    answers.energieFin = { state: 'answered', value: energyAfter.value };
  }

  const motivation = catalogCell(a, 'motivation_before');
  if (isAnswered(motivation)) {
    root.motivation = motivation.value;
    answers.motivation = { state: 'answered', value: motivation.value };
  }

  const sleep = catalogCell(a, 'sleep_prev');
  if (isAnswered(sleep)) {
    root.sommeil = sleep.value;
    answers.sommeil = { state: 'answered', value: sleep.value };
  }

  const notes = catalogCell(a, 'notes');
  if (isAnswered(notes)) {
    root.notes = notes.value;
  } else if (notes?.state === ANSWER_STATES.NOT_ANSWERED) {
    // ne pas forcer '' ici — laissé au merge commit
  }

  const music = catalogCell(a, 'music');
  if (isAnswered(music)) root.musiquesEcoutees = music.value;

  const weather = catalogCell(a, 'weather');
  if (isAnswered(weather) && WEATHER_TO_METEO[weather.value]) {
    root.meteo = WEATHER_TO_METEO[weather.value];
  }

  const place = catalogCell(a, 'place');
  if (isAnswered(place) && PLACE_TO_ENVIRONNEMENT[place.value]) {
    root.environnement = PLACE_TO_ENVIRONNEMENT[place.value];
  }

  const rest = catalogCell(a, 'rest_band');
  if (isAnswered(rest) && rest.value !== 'not_set') {
    const label = REST_BAND_TO_TEMPS_REPOS[rest.value];
    if (label) root.tempsRepos = label;
  }

  const partner = catalogCell(a, 'partner');
  if (isAnswered(partner)) {
    root.partenaire = partner.value === 'with_someone';
    answers.partenaire = { state: 'answered', value: partner.value === 'with_someone' };
  }

  const tags = catalogCell(a, 'context_tags');
  if (isAnswered(tags) && Array.isArray(tags.value)) {
    root.tags = [...tags.value];
  }

  // Douleur
  const painPresence = catalogCell(a, 'pain_presence');
  if (isAnswered(painPresence) && painPresence.value === 'no') {
    answers.pain = { state: ANSWER_STATES.ABSENT, presence: 'no', value: null };
    answers.pain_presence = { state: 'answered', value: 'no' };
    answers.douleur = { state: ANSWER_STATES.ABSENT, presence: 'no', value: null };
    // 0 historique = non lu par Récap ; efface une ancienne intensité lors d’un « non » explicite.
    root.douleur = 0;
  } else if (isAnswered(painPresence) && painPresence.value === 'declined') {
    answers.pain = { state: ANSWER_STATES.DECLINED, presence: 'declined', value: null };
    answers.pain_presence = { state: 'answered', value: 'declined' };
    answers.douleur = { state: ANSWER_STATES.DECLINED, value: null };
  } else if (isAnswered(painPresence) && painPresence.value === 'yes') {
    answers.pain_presence = { state: 'answered', value: 'yes' };
    const intensity = catalogCell(a, 'pain_intensity');
    const pain = {
      state: 'answered',
      presence: 'yes'
    };
    if (isAnswered(intensity)) {
      root.douleur = intensity.value;
      answers.douleur = { state: 'answered', value: intensity.value };
      pain.intensity = intensity.value;
    }
    for (const key of ['pain_region', 'pain_side', 'pain_onset', 'pain_effect', 'pain_exercise']) {
      const cell = catalogCell(a, key);
      if (isAnswered(cell)) {
        const short = key.replace(/^pain_/, '');
        pain[short] = cell.value;
      }
    }
    answers.pain = pain;
  }

  // Objectif : miroir historique seulement yes/no
  const intent = catalogCell(a, 'session_intent');
  const attained = catalogCell(a, 'intent_attained');
  if (isAnswered(intent)) {
    answers.session_intent = { state: 'answered', value: intent.value };
    if (intent.value === 'none') {
      answers.objectif = { state: 'none', value: null };
    }
  }
  if (isAnswered(attained)) {
    answers.intent_attained = { state: 'answered', value: attained.value };
    if (attained.value === 'yes') {
      root.objectifAtteint = true;
      answers.objectif = { state: 'answered', value: true };
    } else if (attained.value === 'no') {
      root.objectifAtteint = false;
      answers.objectif = { state: 'answered', value: false };
    } else if (attained.value === 'partial') {
      answers.objectif = { state: 'partial', value: null };
    } else if (attained.value === 'unknown') {
      answers.objectif = { state: 'unknown', value: null };
    } else if (attained.value === 'na') {
      answers.objectif = { state: 'none', value: null };
    }
  }

  return { root, answers };
}

/**
 * Recharge un dictionnaire catalogue depuis un enregistrement stocké (édition).
 */
export function catalogAnswersFromStored(raw) {
  const empty = {};
  for (const key of CATALOG_ANSWER_KEYS) {
    empty[key] = { state: ANSWER_STATES.NOT_ANSWERED, value: null };
  }
  if (!isPlainObject(raw)) return empty;

  const prev = isPlainObject(raw.answers) ? raw.answers : {};

  // Préférer les cellules catalogue déjà présentes.
  for (const key of CATALOG_ANSWER_KEYS) {
    if (isPlainObject(prev[key]) && prev[key].state) {
      empty[key] = { state: prev[key].state, value: prev[key].value ?? null };
    }
  }

  // Hydrater depuis les champs historiques si le catalogue est vide.
  if (empty.experience.state === ANSWER_STATES.NOT_ANSWERED && answeredNumber(raw.ressenti) != null) {
    empty.experience = { state: 'answered', value: answeredNumber(raw.ressenti) };
  }
  if (empty.effort.state === ANSWER_STATES.NOT_ANSWERED) {
    if (prev.effort?.state === 'answered' && prev.effort.value === 0) {
      empty.effort = { state: 'answered', value: 0 };
    } else if (answeredNumber(raw.difficulte) != null) {
      empty.effort = { state: 'answered', value: answeredNumber(raw.difficulte) };
    }
  }
  if (empty.energy_before.state === ANSWER_STATES.NOT_ANSWERED && answeredNumber(raw.energieDebut) != null) {
    empty.energy_before = { state: 'answered', value: answeredNumber(raw.energieDebut) };
  }
  if (empty.energy_after.state === ANSWER_STATES.NOT_ANSWERED && answeredNumber(raw.energieFin) != null) {
    empty.energy_after = { state: 'answered', value: answeredNumber(raw.energieFin) };
  }
  if (
    empty.motivation_before.state === ANSWER_STATES.NOT_ANSWERED &&
    answeredNumber(raw.motivation) != null
  ) {
    empty.motivation_before = { state: 'answered', value: answeredNumber(raw.motivation) };
  }
  if (empty.sleep_prev.state === ANSWER_STATES.NOT_ANSWERED && answeredNumber(raw.sommeil) != null) {
    empty.sleep_prev = { state: 'answered', value: answeredNumber(raw.sommeil) };
  }
  if (empty.notes.state === ANSWER_STATES.NOT_ANSWERED && typeof raw.notes === 'string' && raw.notes.trim()) {
    empty.notes = { state: 'answered', value: raw.notes.trim() };
  }
  if (
    empty.music.state === ANSWER_STATES.NOT_ANSWERED &&
    typeof raw.musiquesEcoutees === 'string' &&
    raw.musiquesEcoutees.trim()
  ) {
    empty.music = { state: 'answered', value: raw.musiquesEcoutees.trim() };
  }
  if (empty.place.state === ANSWER_STATES.NOT_ANSWERED && raw.environnement) {
    const place = ENVIRONNEMENT_TO_PLACE[raw.environnement];
    if (place) empty.place = { state: 'answered', value: place };
  }
  if (empty.weather.state === ANSWER_STATES.NOT_ANSWERED && raw.meteo && METEO_TO_WEATHER[raw.meteo]) {
    empty.weather = { state: 'answered', value: METEO_TO_WEATHER[raw.meteo] };
  }
  if (empty.partner.state === ANSWER_STATES.NOT_ANSWERED && prev.partenaire?.state === 'answered') {
    empty.partner = {
      state: 'answered',
      value: prev.partenaire.value === true ? 'with_someone' : 'alone'
    };
  }

  if (empty.pain_presence.state === ANSWER_STATES.NOT_ANSWERED) {
    if (prev.pain?.presence === 'no' || prev.douleur?.state === 'absent') {
      empty.pain_presence = { state: 'answered', value: 'no' };
    } else if (prev.pain?.presence === 'declined' || prev.douleur?.state === 'declined') {
      empty.pain_presence = { state: 'answered', value: 'declined' };
    } else if (prev.pain?.presence === 'yes' || answeredNumber(raw.douleur) != null) {
      empty.pain_presence = { state: 'answered', value: 'yes' };
      if (answeredNumber(raw.douleur) != null) {
        empty.pain_intensity = { state: 'answered', value: answeredNumber(raw.douleur) };
      }
    }
  }

  return empty;
}

const CATALOG_CLEAR_ROOT = Object.freeze({
  experience: { ressenti: 0 },
  effort: { difficulte: 0 },
  energy_before: { energieDebut: 0 },
  energy_after: { energieFin: 0 },
  motivation_before: { motivation: 0 },
  sleep_prev: { sommeil: 0 },
  pain_intensity: { douleur: 0 },
  notes: { notes: '' },
  music: { musiquesEcoutees: '' },
  weather: { meteo: '' },
  place: { environnement: '' },
  rest_band: { tempsRepos: '' },
  context_tags: { tags: [] },
  partner: { partenaire: false },
  intent_attained: { objectifAtteint: null }
});

function draftHasMeaningfulChange(catalogDraft, normalized) {
  const draft = isPlainObject(catalogDraft) ? catalogDraft : {};
  for (const key of Object.keys(draft)) {
    const cell = normalized[key];
    if (!cell) continue;
    if (
      cell.state === ANSWER_STATES.ANSWERED ||
      cell.state === ANSWER_STATES.ABSENT ||
      cell.state === ANSWER_STATES.DECLINED
    ) {
      return true;
    }
    // Effacement explicite présent dans le patch
    if (
      cell.state === ANSWER_STATES.NOT_ANSWERED ||
      cell.state === ANSWER_STATES.NOT_ASKED
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Commit depuis le catalogue (UI / Mobile).
 * Patch sparse : clés absentes du draft = inchangées.
 * @returns {{ stored: object|null, ok: boolean, errors: array, consistency: object, clarifications: array, reason?: string }}
 */
export function commitCatalogFeedback(previous, catalogDraft, options = {}) {
  const context = options.context || {};
  const draft = isPlainObject(catalogDraft) ? catalogDraft : {};
  const { answers: normalized, errors } = normalizeCatalogAnswers(draft, context);
  const draftKeyList = Object.keys(draft);

  const patchSlice = {};
  for (const key of draftKeyList) {
    patchSlice[key] = normalized[key];
  }

  const significantPatch = hasSignificantCatalogAnswers(patchSlice);
  const explicitChange = draftHasMeaningfulChange(draft, normalized);
  const prevAnswers = isPlainObject(previous?.answers) ? previous.answers : {};
  const previousHadContent =
    Boolean(previous) &&
    (previous.completionState === 'recorded' ||
      hasSignificantCatalogAnswers(prevAnswers) ||
      SESSION_FEEDBACK_NUMERIC_FIELDS.some((k) => Number(previous?.[k]) > 0) ||
      (typeof previous?.notes === 'string' && previous.notes.trim().length > 0));

  if (!significantPatch && !(explicitChange && previousHadContent && draftKeyList.length > 0)) {
    return {
      ok: false,
      reason: 'no_significant_answer',
      errors,
      consistency: assessAnswerConsistency(normalized),
      clarifications: [],
      stored: null
    };
  }

  const consistency = assessAnswerConsistency({ ...prevAnswers, ...patchSlice });
  const clarifications = suggestedClarifications(consistency);
  const { root, answers } = mapCatalogAnswersToHistorical(normalized);

  const incoming = {
    ...root,
    date: options.date || previous?.date || previous?.sessionDate || null,
    sessionDate: options.sessionDate || options.date || previous?.sessionDate || previous?.date || null,
    answers,
    catalogVersion: 1
  };

  // Effacements explicites → miroirs historiques remis à « non répondu »
  for (const key of draftKeyList) {
    const cell = normalized[key];
    if (
      !cell ||
      (cell.state !== ANSWER_STATES.NOT_ANSWERED && cell.state !== ANSWER_STATES.NOT_ASKED)
    ) {
      continue;
    }
    const clearMap = CATALOG_CLEAR_ROOT[key];
    if (clearMap) Object.assign(incoming, clearMap);
    if (key === 'pain_presence') {
      incoming.douleur = 0;
    }
  }

  const stored = commitSessionFeedback(previous, incoming, {
    now: options.now,
    writer: 'commitCatalogFeedback'
  });

  // Réinjecter answers : brouillon sparse ne doit pas écraser les clés catalogue absentes du draft.
  const draftKeys = new Set(draftKeyList);
  const catalogKeySet = new Set(CATALOG_ANSWER_KEYS);
  const mergedAnswers = { ...(isPlainObject(stored.answers) ? stored.answers : {}) };
  for (const [key, cell] of Object.entries(answers)) {
    if (catalogKeySet.has(key) && draftKeys.size > 0 && !draftKeys.has(key)) {
      continue;
    }
    mergedAnswers[key] = cell;
  }
  // Effacement explicite des cellules catalogue
  for (const key of draftKeyList) {
    const cell = normalized[key];
    if (
      cell &&
      (cell.state === ANSWER_STATES.NOT_ANSWERED || cell.state === ANSWER_STATES.NOT_ASKED)
    ) {
      mergedAnswers[key] = { state: cell.state, value: null };
      if (key === 'pain_presence') {
        delete mergedAnswers.pain;
        mergedAnswers.douleur = { state: ANSWER_STATES.NOT_ANSWERED, value: null };
      }
    }
  }
  stored.answers = mergedAnswers;

  const answeredCount = Object.values(stored.answers).filter(
    (cell) => cell && (cell.state === 'answered' || cell.state === 'absent' || cell.state === 'declined')
  ).length;
  stored.completionState = answeredCount > 0 ? 'recorded' : 'empty';
  stored.consistencyIssues = consistency.issues.filter((i) => i.severity === 'contradiction');

  return {
    ok: true,
    stored,
    errors,
    consistency,
    clarifications
  };
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
    writer: options.writer || 'commitSessionFeedback',
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
