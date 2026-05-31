import { PROFILE_QUESTION_DEFS, PROFILE_QUESTIONNAIRE_VERSION } from './constants';
import { migrateAnswersToV12 } from './quizAnswersMigration';
import { filterActiveQuestions } from './quizQuestionVisibility';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export const buildEmptyAnswers = () =>
  PROFILE_QUESTION_DEFS.reduce((acc, q) => {
    acc[q.id] = null;
    return acc;
  }, {});

export function computeCompletion(answers) {
  let completed = 0;
  const activeDefs = filterActiveQuestions(PROFILE_QUESTION_DEFS, answers || {});
  activeDefs.forEach((q) => {
    const v = answers?.[q.id];
    if (v == null) return;
    if (q.type === 'vitals') {
      if (
        typeof v === 'object' &&
        !Array.isArray(v) &&
        (
          v.sex ||
          v.age != null ||
          v.weightKg != null ||
          v.heightCm != null ||
          v.targetWeightKg != null ||
          v.targetWeightMode
        )
      ) {
        completed += 1;
      }
      return;
    }
    if (q.type === 'strengthBaselines') {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        const filled = Object.values(v).some((x) => x != null && Number(x) > 0);
        if (filled) completed += 1;
      }
      return;
    }
    if (q.type === 'existingProgram') {
      if (v?.hasProgram === 'no') {
        completed += 1;
        return;
      }
      if (v?.hasProgram === 'yes' && v?.programId) {
        completed += 1;
      }
      return;
    }
    if (Array.isArray(v)) {
      if (v.length > 0) completed += 1;
      return;
    }
    completed += 1;
  });
  const total = activeDefs.length;
  const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completedCount: completed, totalCount: total, completionPercent };
}

function sanitizeStrengthBaselines(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const fields = [
    'pushupsMax',
    'pullupsMax',
    'dipsMax',
    'australianPullupsMax',
    'squatGobletMax',
    'lungesMax',
    'plankSecMax'
  ];
  const out = {};
  let any = false;
  fields.forEach((f) => {
    const n = Math.round(Number(raw[f]));
    if (!Number.isFinite(n) || n < 1) {
      out[f] = null;
      return;
    }
    out[f] = f === 'plankSecMax' ? Math.min(300, n) : Math.min(200, n);
    any = true;
  });
  return any ? out : null;
}

function sanitizeVitalsValue(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) return null;
  const sexRaw = raw.sex != null ? String(raw.sex).toLowerCase() : '';
  const sex = ['male', 'female', 'other', 'na'].includes(sexRaw) ? sexRaw : null;
  let age = Math.round(Number(raw.age));
  if (!Number.isFinite(age) || age < 10 || age > 110) age = null;
  let weightKg = Number(String(raw.weightKg).replace(',', '.'));
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 250) weightKg = null;
  let heightCm = Math.round(Number(raw.heightCm));
  if (!Number.isFinite(heightCm) || heightCm < 120 || heightCm > 230) heightCm = null;
  let targetWeightKg = Number(String(raw.targetWeightKg).replace(',', '.'));
  if (!Number.isFinite(targetWeightKg) || targetWeightKg < 30 || targetWeightKg > 250) targetWeightKg = null;
  const modeRaw = raw.targetWeightMode != null ? String(raw.targetWeightMode).toLowerCase() : '';
  const targetWeightMode = ['none', 'manual', 'auto'].includes(modeRaw) ? modeRaw : null;
  if (!sex && age == null && weightKg == null && heightCm == null && targetWeightKg == null && !targetWeightMode) return null;
  return { sex, age, weightKg, heightCm, targetWeightKg, targetWeightMode };
}

const V6_OPTIONAL_ANSWER_KEYS = {
  primaryMission: [
    'hypertrophy',
    'hypertrophy_street',
    'strength_max',
    'recomposition',
    'general_health',
    'run_5k_10k',
    'run_half',
    'run_marathon',
    'run_health',
    'hybrid_run_strength',
    'triathlon',
    'triathlon_sprint',
    'triathlon_olympic',
    'triathlon_half_iron',
    'triathlon_iron',
    'sport_collective',
    'combat_sport',
    'military_prep'
  ],
  triathlonDistance: ['sprint', 'olympic', 'half_iron', 'iron'],
  triathlonWeakLeg: ['swim', 'bike', 'run'],
  sportConditioningFocus: ['balanced', 'conditioning_heavy', 'strength_heavy'],
  runningGoal: [
    'health',
    '5k',
    '10k',
    'half_marathon',
    'marathon',
    'ultra_short',
    'ultra_long',
    'sprint',
    'vo2max',
    'return_to_run',
    'trail_short',
    'trail_long'
  ],
  runningWeeklyKmCurrent: [
    'km_0',
    'km_1_10',
    'km_10_20',
    'km_20_40',
    'km_40_60',
    'km_60_80',
    'km_80_plus'
  ],
  runStrengthPriority: ['run_first', 'balanced', 'muscle_first', 'maintenance_only'],
  conflictSacrificePriority: [
    'keep_strength',
    'keep_cardio',
    'keep_legs',
    'keep_upper',
    'keep_mobility',
    'sacrifice_nothing'
  ],
  neuralFatigueTolerance: ['low', 'moderate', 'high'],
  volumeTolerance: ['low', 'moderate', 'high'],
  preferredWeeklyStructure: [
    'full_body',
    'upper_lower',
    'push_pull_legs',
    'running_focus',
    'hybrid_alternating',
    'bro_split'
  ],
  runningLongRunPossible: ['yes_flexible', 'yes_weekend', 'yes_weekday', 'no'],
  programDurationWeeks: ['auto', '4', '6', '8', '10', '12'],
  streetSkillGoal: [
    'first_pullup',
    'pullups_10',
    'pullups_20',
    'muscle_up',
    'front_lever',
    'back_lever',
    'planche',
    'handstand',
    'street_hypertrophy',
    'street_general'
  ]
};

const V6_OPTIONAL_ARRAY_KEYS = {
  weeklyConstraints: ['no_interval_after_legs', 'travel_week', 'limited_equipment']
};

function sanitizeV6OptionalKey(key, raw) {
  const allowed = V6_OPTIONAL_ANSWER_KEYS[key];
  if (!allowed) return null;
  const s = String(raw);
  return allowed.includes(s) ? s : null;
}

export function sanitizeAnswersPayload(answersIn) {
  const answers = buildEmptyAnswers();
  const src = isObject(answersIn) ? answersIn : {};
  PROFILE_QUESTION_DEFS.forEach((q) => {
    answers[q.id] = sanitizeByQuestion(q, src[q.id]);
  });
  Object.keys(V6_OPTIONAL_ANSWER_KEYS).forEach((key) => {
    if (src[key] != null) answers[key] = sanitizeV6OptionalKey(key, src[key]);
  });
  Object.keys(V6_OPTIONAL_ARRAY_KEYS).forEach((key) => {
    if (!Array.isArray(src[key])) return;
    const allowed = new Set(V6_OPTIONAL_ARRAY_KEYS[key]);
    answers[key] = src[key].filter((v) => allowed.has(String(v)));
  });
  return answers;
}

function sanitizeQuizRoundHistory(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const row of raw) {
    if (!isObject(row)) continue;
    const completedAt = typeof row.completedAt === 'string' ? row.completedAt : null;
    if (!completedAt) continue;
    out.push({
      completedAt,
      version: Number(row.version) || PROFILE_QUESTIONNAIRE_VERSION,
      answers: sanitizeAnswersPayload(row.answers),
      completionSnapshot: isObject(row.completionSnapshot) ? row.completionSnapshot : null
    });
  }
  return out.slice(-12);
}

function sanitizeByQuestion(question, rawValue) {
  if (rawValue == null) return null;
  if (question.type === 'vitals') {
    return sanitizeVitalsValue(rawValue);
  }
  if (question.type === 'strengthBaselines') {
    return sanitizeStrengthBaselines(rawValue);
  }
  if (question.type === 'existingProgram') {
    if (!isObject(rawValue)) return null;
    const has = rawValue.hasProgram === 'yes' ? 'yes' : rawValue.hasProgram === 'no' ? 'no' : null;
    if (!has) return null;
    const programId =
      has === 'yes' && rawValue.programId != null ? String(rawValue.programId).trim() : null;
    const programName =
      has === 'yes' && rawValue.programName != null ? String(rawValue.programName).slice(0, 120) : null;
    return {
      hasProgram: has,
      programId: programId || null,
      programName: programName || null
    };
  }
  if (question.type === 'single') {
    const key = String(rawValue);
    const allowed = new Set((question.options || []).map((o) => String(o.key)));
    return allowed.has(key) ? key : null;
  }
  if (question.type === 'multi' || question.type === 'days') {
    const arrRaw = Array.isArray(rawValue) ? rawValue : rawValue == null ? [] : [rawValue];
    const max = Number(question.max) > 0 ? Number(question.max) : 999;
    if (question.type === 'days') {
      const valid = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      const set = Array.from(new Set(arrRaw.map((x) => String(x)).filter((x) => valid.includes(x))));
      return set.slice(0, 7);
    }
    const arr = arrRaw.map((x) => {
      const s = String(x);
      if (question.id === 'availableEquipment' && s === 'bodyweight_only') return 'bodyweight';
      return s;
    });
    const allowed = new Set((question.options || []).map((o) => String(o.key)));
    const set = Array.from(new Set(arr.map((x) => String(x)).filter((x) => allowed.has(x))));
    return set.slice(0, max);
  }
  if (question.type === 'slider') {
    const n = Number(rawValue);
    if (!Number.isFinite(n)) return null;
    const min = Number(question.min ?? 0);
    const max = Number(question.max ?? 100);
    const step = Number(question.step ?? 1);
    const clamped = Math.max(min, Math.min(max, n));
    return Math.round(clamped / step) * step;
  }
  return null;
}

export function normalizeProfileQuestionnaire(raw) {
  const now = new Date().toISOString();
  const payload = isObject(raw) ? raw : {};
  const answersIn = isObject(payload.answers) ? payload.answers : {};
  const storedVersion = Number(payload.version) || 0;

  let answers = sanitizeAnswersPayload(answersIn);
  if (storedVersion < PROFILE_QUESTIONNAIRE_VERSION) {
    answers = migrateAnswersToV12(answers);
  }

  const stats = computeCompletion(answers);
  const quizRoundHistory = sanitizeQuizRoundHistory(payload.quizRoundHistory);
  const lastCompletionRecap = sanitizeLastCompletionRecap(payload.lastCompletionRecap);

  return {
    version: Math.max(storedVersion, PROFILE_QUESTIONNAIRE_VERSION),
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : now,
    lastUpdatedAt: typeof payload.lastUpdatedAt === 'string' ? payload.lastUpdatedAt : now,
    onboardingSkippedAt: typeof payload.onboardingSkippedAt === 'string' ? payload.onboardingSkippedAt : null,
    onboardingWizardCompletedAt:
      typeof payload.onboardingWizardCompletedAt === 'string' ? payload.onboardingWizardCompletedAt : null,
    quizReminderSnoozeUntil:
      typeof payload.quizReminderSnoozeUntil === 'string' ? payload.quizReminderSnoozeUntil : null,
    quizRoundHistory,
    lastCompletionRecap,
    ...stats,
    answers
  };
}

/** Résumé léger du dernier récap quiz (affichage Réglages). */
export function sanitizeLastCompletionRecap(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw.placement;
  if (!p || typeof p !== 'object') return null;
  const score = Math.round(Number(p.score0to100));
  if (!Number.isFinite(score)) return null;
  return {
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt.slice(0, 30) : new Date().toISOString(),
    placement: {
      score0to100: Math.max(0, Math.min(100, score)),
      bandId: String(p.bandId || '').slice(0, 40),
      bandLabel: String(p.bandLabel || '').slice(0, 80),
      bandDescription: String(p.bandDescription || '').slice(0, 240),
      experienceLabel: String(p.experienceLabel || '').slice(0, 80),
      goalLabel: String(p.goalLabel || '').slice(0, 80),
      dataTrust: String(p.dataTrust || '').slice(0, 160)
    },
    hasActivityLogs: Boolean(raw.hasActivityLogs)
  };
}

