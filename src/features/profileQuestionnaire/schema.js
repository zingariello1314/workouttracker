import { PROFILE_QUESTION_DEFS, PROFILE_QUESTIONNAIRE_VERSION } from './constants';

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

export const buildEmptyAnswers = () =>
  PROFILE_QUESTION_DEFS.reduce((acc, q) => {
    acc[q.id] = null;
    return acc;
  }, {});

export function computeCompletion(answers) {
  let completed = 0;
  PROFILE_QUESTION_DEFS.forEach((q) => {
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
    if (Array.isArray(v)) {
      if (v.length > 0) completed += 1;
      return;
    }
    completed += 1;
  });
  const total = PROFILE_QUESTION_DEFS.length;
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

export function sanitizeAnswersPayload(answersIn) {
  const answers = buildEmptyAnswers();
  const src = isObject(answersIn) ? answersIn : {};
  PROFILE_QUESTION_DEFS.forEach((q) => {
    answers[q.id] = sanitizeByQuestion(q, src[q.id]);
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
  const answers = buildEmptyAnswers();

  PROFILE_QUESTION_DEFS.forEach((q) => {
    answers[q.id] = sanitizeByQuestion(q, answersIn[q.id]);
  });

  const stats = computeCompletion(answers);
  const quizRoundHistory = sanitizeQuizRoundHistory(payload.quizRoundHistory);

  return {
    version: Number(payload.version) || PROFILE_QUESTIONNAIRE_VERSION,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : now,
    lastUpdatedAt: typeof payload.lastUpdatedAt === 'string' ? payload.lastUpdatedAt : now,
    onboardingSkippedAt: typeof payload.onboardingSkippedAt === 'string' ? payload.onboardingSkippedAt : null,
    onboardingWizardCompletedAt:
      typeof payload.onboardingWizardCompletedAt === 'string' ? payload.onboardingWizardCompletedAt : null,
    quizReminderSnoozeUntil:
      typeof payload.quizReminderSnoozeUntil === 'string' ? payload.quizReminderSnoozeUntil : null,
    quizRoundHistory,
    ...stats,
    answers
  };
}

