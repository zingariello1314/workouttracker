/**
 * Agrégation des notes journalières (holistique + musculation) pour le Récap.
 */

import {
  buildYearStrengthLoadReference,
  computeCalendarDayHolisticScore,
  computeCalendarDayStrengthScore
} from '../calendarDayTrainingScores';

function ymdAddDaysLocal(ymd, delta) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d + delta);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}

function daysBetweenInclusive(startYmd, endYmd) {
  const a = Date.UTC(
    Number(startYmd.slice(0, 4)),
    Number(startYmd.slice(5, 7)) - 1,
    Number(startYmd.slice(8, 10))
  );
  const b = Date.UTC(
    Number(endYmd.slice(0, 4)),
    Number(endYmd.slice(5, 7)) - 1,
    Number(endYmd.slice(8, 10))
  );
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 0;
  return Math.floor((b - a) / 86400000) + 1;
}

/**
 * @param {object} opts
 * @param {object} opts.snapshot
 * @param {object|null} opts.garminData
 * @param {(id: number|string) => string} [opts.getExerciseNameById]
 * @param {string} opts.startYmd
 * @param {string} opts.endYmd
 * @param {unknown[]} [opts.programs]
 * @param {Record<string, Array>|null} [opts.mealsByDate]
 */
export function buildRecapHolisticDayScoreWindow({
  snapshot,
  garminData = null,
  getExerciseNameById,
  startYmd,
  endYmd,
  programs = [],
  mealsByDate = null
}) {
  const daySpan = Math.max(1, daysBetweenInclusive(startYmd, endYmd));
  const year = Number(endYmd.slice(0, 4));
  const strengthRefs = buildYearStrengthLoadReference(snapshot, getExerciseNameById, year);

  const holisticScores = [];
  const strengthScores = [];
  let stretchDays = 0;
  let stretchSum = 0;
  let nutritionDays = 0;
  let weightDays = 0;

  let cur = startYmd;
  while (cur <= endYmd) {
    const meals = mealsByDate?.[cur] || null;
    const holistic = computeCalendarDayHolisticScore({
      dateStr: cur,
      workoutData: snapshot,
      garminData,
      getExerciseNameById,
      strengthRefs,
      programs,
      nutritionMeals: meals,
      progressEntries: snapshot?.progressEntries
    });
    const strength = computeCalendarDayStrengthScore(
      cur,
      snapshot,
      getExerciseNameById,
      strengthRefs
    );

    if (holistic.score != null) holisticScores.push(holistic.score);
    if (strength.score != null) strengthScores.push(strength.score);
    if (holistic.stretch?.score != null) {
      stretchDays += 1;
      stretchSum += holistic.stretch.score;
    }
    if (holistic.nutrition) nutritionDays += 1;
    if (holistic.weight) weightDays += 1;

    cur = ymdAddDaysLocal(cur, 1);
  }

  const avgHolistic =
    holisticScores.length > 0
      ? Math.round((holisticScores.reduce((a, b) => a + b, 0) / holisticScores.length) * 10) / 10
      : null;
  const avgStrength =
    strengthScores.length > 0
      ? Math.round((strengthScores.reduce((a, b) => a + b, 0) / strengthScores.length) * 10) / 10
      : null;

  return {
    daySpan,
    daysWithHolistic: holisticScores.length,
    daysWithStrength: strengthScores.length,
    avgHolistic,
    avgStrength,
    holisticFreq: holisticScores.length / daySpan,
    strengthFreq: strengthScores.length / daySpan,
    avgStretchScore:
      stretchDays > 0 ? Math.round((stretchSum / stretchDays) * 10) / 10 : null,
    stretchDays,
    nutritionDays,
    weightDays
  };
}

/**
 * Suggestions Récap basées sur les notes journalières (sans doublonner volume/reps).
 * @param {ReturnType<typeof buildRecapHolisticDayScoreWindow>} window
 * @param {number} activeDays28
 */
export function buildDayScoreRecapSuggestions(window, activeDays28 = 0) {
  const out = [];
  if (!window || window.daysWithHolistic < 2) {
    if (activeDays28 >= 4) {
      out.push({
        kind: 'day_score_sparse',
        text: 'Peu de notes globales calculées sur la période : coche les exos, étirements, repas ou pesée pour que le calendrier et le Récap reflètent mieux tes journées.'
      });
    }
    return out;
  }

  const hol = window.avgHolistic;
  const str = window.avgStrength;
  const holFreqPct = Math.round(window.holisticFreq * 100);

  if (hol != null && hol >= 72 && holFreqPct >= 45) {
    out.push({
      kind: 'day_holistic_high',
      text: `Notes globales élevées (${hol}/100 en moyenne, ${holFreqPct} % des jours) : bonne complétude des dimensions (entraînement, mobilité, suivi) — le niveau Récap en tient compte.`
    });
  } else if (hol != null && hol < 48 && window.daysWithHolistic >= 5) {
    out.push({
      kind: 'day_holistic_low',
      text: `Notes globales modestes (${hol}/100) : souvent des jours partiellement remplis — étirements, repas ou pesée peuvent faire monter la note sans forcer le volume muscu.`
    });
  }

  if (str != null && hol != null && str - hol >= 18 && window.daysWithStrength >= 4) {
    out.push({
      kind: 'day_strength_vs_holistic',
      text: `La note musculation (${str}/100) dépasse nettement la note globale (${hol}/100) : mobilité, nutrition ou récupération méritent attention pour équilibrer le profil.`
    });
  } else if (str != null && hol != null && hol - str >= 15 && window.daysWithStrength >= 3) {
    out.push({
      kind: 'day_holistic_vs_strength',
      text: `Bonne note globale (${hol}/100) malgré une musculation plus légère (${str}/100) : endurance, pas ou complétude du jour compensent — profil polyvalent.`
    });
  }

  if (window.stretchDays >= 3 && window.avgStretchScore != null && window.avgStretchScore < 45) {
    out.push({
      kind: 'day_stretch_low',
      text: `Étirements souvent incomplets (${window.avgStretchScore}/100 en moyenne sur ${window.stretchDays} j.) : viser un pourcentage plus élevé améliore la note globale sans charge supplémentaire.`
    });
  } else if (window.stretchDays >= 5 && window.avgStretchScore != null && window.avgStretchScore >= 80) {
    out.push({
      kind: 'day_stretch_high',
      text: `Excellente assiduité étirements (${window.avgStretchScore}/100) — intégrée dans tes notes globales et le niveau Récap.`
    });
  }

  if (window.nutritionDays >= 4 && window.nutritionDays / window.daySpan < 0.35) {
    out.push({
      kind: 'day_nutrition_sparse',
      text: 'Repas journalisés sur une minorité de jours : une saisie plus régulière dans Nutrition enrichit la note globale et les conseils croisés.'
    });
  } else if (window.nutritionDays >= Math.max(5, Math.floor(window.daySpan * 0.5))) {
    out.push({
      kind: 'day_nutrition_regular',
      text: `Nutrition suivie sur ${window.nutritionDays} jours de la période — prise en compte dans la note globale et le niveau estimé.`
    });
  }

  if (window.weightDays >= 3) {
    out.push({
      kind: 'day_weight_tracked',
      text: `Pesées enregistrées sur ${window.weightDays} jours : suivi corps intégré aux notes journalières (sans doubler l'analyse poids du Récap).`
    });
  }

  if (holFreqPct < 30 && activeDays28 >= 6) {
    out.push({
      kind: 'day_score_freq_low',
      text: `Notes globales sur ${holFreqPct} % des jours seulement alors que tu t'entraînes : complète étirements, repas ou ressenti pour débloquer une analyse plus fine.`
    });
  }

  return out;
}

/**
 * Normalisations 0–1 pour le blend niveau Récap.
 */
export function deriveDayScoreNorms(window) {
  if (!window || window.daysWithHolistic < 2) {
    return { holisticNorm: 0, strengthDayNorm: 0, hasHolistic: false, hasStrengthDay: false };
  }
  const holisticNorm =
    window.avgHolistic != null
      ? (window.avgHolistic / 100) * Math.min(1, window.holisticFreq * 1.35)
      : 0;
  const strengthDayNorm =
    window.daysWithStrength >= 2 && window.avgStrength != null
      ? (window.avgStrength / 100) * Math.min(1, window.strengthFreq * 1.25)
      : 0;
  return {
    holisticNorm,
    strengthDayNorm,
    hasHolistic: holisticNorm > 0,
    hasStrengthDay: strengthDayNorm > 0
  };
}
