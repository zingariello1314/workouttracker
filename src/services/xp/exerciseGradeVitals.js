/**
 * Poids, taille, âge pour les grades exercices (impédance + questionnaire + saisie locale).
 */

import { extractProfileFromProgressEntries } from '../../utils/nutritionProgramEstimate';
import { buildWeightByDateMap } from '../../utils/sport/recapAssessmentSeries';

const LS_KEY = 'sport.exerciseGradeVitals.v1';

const REF = { weightKg: 75, heightCm: 175, age: 30 };

export function readExerciseGradeVitalsOverride() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p !== 'object') return null;
    return {
      weightKg: numOrNull(p.weightKg),
      heightCm: numOrNull(p.heightCm),
      age: numOrNull(p.age),
      sex: p.sex || null,
      source: 'manual'
    };
  } catch {
    return null;
  }
}

export function writeExerciseGradeVitalsOverride(vitals) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        weightKg: numOrNull(vitals?.weightKg),
        heightCm: numOrNull(vitals?.heightCm),
        age: numOrNull(vitals?.age),
        sex: vitals?.sex || null,
        updatedAt: new Date().toISOString()
      })
    );
  } catch {
    /* ignore */
  }
}

function numOrNull(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * @param {{ progressEntries?: object[], profileQuestionnaireRaw?: object }} ctx
 */
export function resolveExerciseGradeVitals(ctx = {}) {
  const manual = readExerciseGradeVitalsOverride();
  const impedance = extractProfileFromProgressEntries(ctx.progressEntries || []);
  const quiz = ctx.profileQuestionnaireRaw?.answers?.vitalsSelfReport || {};

  let weightKg = manual?.weightKg ?? impedance?.weightKg ?? numOrNull(quiz.weightKg);
  if (weightKg == null) {
    const map = buildWeightByDateMap(ctx.progressEntries);
    let latestYmd = null;
    map.forEach((w, d) => {
      if (!latestYmd || d > latestYmd) {
        latestYmd = d;
        weightKg = w;
      }
    });
  }

  const heightCm = manual?.heightCm ?? impedance?.heightCm ?? numOrNull(quiz.heightCm);
  const age = manual?.age ?? impedance?.age ?? numOrNull(quiz.age);
  const sex = manual?.sex ?? quiz.sex ?? impedance?.sex ?? null;

  let source = 'default';
  if (manual?.weightKg || manual?.heightCm || manual?.age || manual?.sex) source = 'manual';
  else if (impedance?.weightKg || impedance?.heightCm) source = 'impedance';
  else if (quiz.weightKg || quiz.heightCm || quiz.sex) source = 'questionnaire';
  else if (weightKg) source = 'body_tracking';

  return {
    weightKg: weightKg ?? REF.weightKg,
    heightCm: heightCm ?? REF.heightCm,
    age: age ?? REF.age,
    sex,
    source,
    isComplete: Boolean(weightKg && heightCm && age),
    usedDefaults: !(weightKg && heightCm && age)
  };
}

export { REF as EXERCISE_GRADE_VITALS_REF };
