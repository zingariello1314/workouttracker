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

function sanitizeByQuestion(question, rawValue) {
  if (rawValue == null) return null;
  if (question.type === 'single') {
    const key = String(rawValue);
    const allowed = new Set((question.options || []).map((o) => String(o.key)));
    return allowed.has(key) ? key : null;
  }
  if (question.type === 'multi' || question.type === 'days') {
    const arr = Array.isArray(rawValue) ? rawValue : [];
    const max = Number(question.max) > 0 ? Number(question.max) : 999;
    if (question.type === 'days') {
      const valid = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
      const set = Array.from(new Set(arr.map((x) => String(x)).filter((x) => valid.includes(x))));
      return set.slice(0, 7);
    }
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

  return {
    version: Number(payload.version) || PROFILE_QUESTIONNAIRE_VERSION,
    createdAt: typeof payload.createdAt === 'string' ? payload.createdAt : now,
    lastUpdatedAt: typeof payload.lastUpdatedAt === 'string' ? payload.lastUpdatedAt : now,
    onboardingSkippedAt: typeof payload.onboardingSkippedAt === 'string' ? payload.onboardingSkippedAt : null,
    ...stats,
    answers
  };
}

