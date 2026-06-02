/**
 * Styles d’enchaînement (quiz) — sélection multiple et impact sur le programme.
 * @module features/profileQuestionnaire/circuitTrainingStyleUtils
 */

export const CIRCUIT_TRAINING_STYLE_KEYS = [
  'prefer_straight',
  'ok_finisher',
  'like_supersets',
  'love_circuits'
];

const GUIDANCE_BY_KEY = {
  prefer_straight:
    'Privilégier les séries droites et un repos complet entre les séries lourdes (RPE maîtrisé).',
  ok_finisher:
    'En fin de séance (si la forme suit) : finisher court 2–3 mouvements, 2 tours, repos 20–30 s entre exos.',
  like_supersets:
    'Prévoir 2–3 supersets par séance (agoniste/antagoniste ou haut/bas) pour densifier sans tout passer en circuit.',
  love_circuits:
    'Bloc circuit principal (4–5 exos, repos 20–45 s entre exos, 2–3 tours) + lift prioritaire en séries droites en début de séance.'
};

/** @param {unknown} raw */
export function normalizeCircuitTrainingStyles(raw) {
  const arr = Array.isArray(raw) ? raw : raw == null || raw === '' ? [] : [raw];
  const allowed = new Set(CIRCUIT_TRAINING_STYLE_KEYS);
  return Array.from(new Set(arr.map((x) => String(x)).filter((k) => allowed.has(k))));
}

/** @param {unknown} styles @param {string} key */
export function hasCircuitTrainingStyle(styles, key) {
  return normalizeCircuitTrainingStyles(styles).includes(key);
}

/**
 * Texte de consigne séance (focus / notes programme) selon les choix cumulés.
 * @param {unknown} rawStyles
 * @returns {string}
 */
export function buildCircuitGuidanceFromStyles(rawStyles) {
  const styles = normalizeCircuitTrainingStyles(rawStyles);
  if (styles.length === 0) {
    return 'Structure en séries droites par défaut ; ajuste densité (superset / circuit) selon ta forme du jour.';
  }
  const parts = styles.map((k) => GUIDANCE_BY_KEY[k]).filter(Boolean);
  if (parts.length === 1) return parts[0];
  return `Mix quiz : ${parts.join(' · ')}`;
}

/**
 * Ajuste repos / type sur les exos du programme selon les styles cochés.
 * @param {Record<string, object>} schedule
 * @param {unknown} answers
 * @param {string[]} activeDayKeys
 */
function isStrengthLikeDay(dayKey, weekProfiles, slot) {
  const profile = weekProfiles?.[dayKey] || slot?.quizSessionProfile;
  if (!profile) return true;
  return profile.modality === 'strength' || profile.modality === 'strength_plus_cardio';
}

export function injectCircuitStylesIntoSchedule(schedule, answers, activeDayKeys, weekProfiles) {
  if (!schedule || !activeDayKeys?.length) return;

  const styles = normalizeCircuitTrainingStyles(answers?.circuitTrainingStyle);
  if (styles.length === 0) return;

  const strengthDays = activeDayKeys.filter((day) =>
    isStrengthLikeDay(day, weekProfiles, schedule[day])
  );
  if (!strengthDays.length) return;

  const onlyStraight =
    styles.length === 1 && styles[0] === 'prefer_straight';

  if (hasCircuitTrainingStyle(styles, 'like_supersets') && !onlyStraight) {
    strengthDays.slice(0, 4).forEach((day) => {
      const slot = schedule[day];
      const exs = Array.isArray(slot?.exercises) ? slot.exercises : [];
      if (exs.length < 4) return;
      for (let i = 2; i < Math.min(6, exs.length - 1); i += 2) {
        const a = exs[i];
        const b = exs[i + 1];
        if (!a || !b) continue;
        a.type = a.type && a.type !== 'standard' ? a.type : 'superset';
        b.type = b.type && b.type !== 'standard' ? b.type : 'superset';
        a.rest = Math.min(Number(a.rest) || 90, 45);
        b.rest = Math.min(Number(b.rest) || 90, 45);
        const tag = 'Enchaînement superset (quiz).';
        a.notes = [a.notes, tag].filter(Boolean).join(' ');
        b.notes = [b.notes, tag].filter(Boolean).join(' ');
      }
    });
  }

  if (
    (hasCircuitTrainingStyle(styles, 'ok_finisher') ||
      hasCircuitTrainingStyle(styles, 'like_supersets')) &&
    !onlyStraight
  ) {
    const finisherDays = activeDayKeys.filter((_, idx) => idx % 2 === 0).slice(0, 3);
    finisherDays.forEach((day, idx) => {
      const slot = schedule[day];
      if (!slot) return;
      const current = Array.isArray(slot.exercises) ? slot.exercises : [];
      const block = [
        {
          id: `quiz_finisher_mc_${day}_${idx}`,
          name: 'Mountain climbers (finisher)',
          series: '2×30 sec',
          reps: '',
          rest: 20,
          intensity: 'moderate',
          notes: 'Finisher quiz : enchaîner avec le gainage suivant, 2 tours si possible.',
          materiel: 'Poids du corps',
          type: 'finisher',
          programCategory: 'cardio'
        },
        {
          id: `quiz_finisher_plank_${day}_${idx}`,
          name: 'Gainage (finisher)',
          series: '2×40 sec',
          reps: '',
          rest: 20,
          intensity: 'moderate',
          notes: 'Finisher quiz : fin de séance, respiration contrôlée.',
          materiel: 'Poids du corps',
          type: 'finisher',
          programCategory: 'core'
        }
      ];
      slot.exercises = [...current, ...block];
    });
  }

  if (hasCircuitTrainingStyle(styles, 'love_circuits') && !onlyStraight) {
    const circuitDays = [strengthDays[0], strengthDays[Math.min(1, strengthDays.length - 1)]].filter(
      Boolean
    );
    const uniqueDays = Array.from(new Set(circuitDays));
    uniqueDays.forEach((day, idx) => {
      const slot = schedule[day];
      if (!slot) return;
      if (Array.isArray(slot.circuitIds) && slot.circuitIds.length > 0) return;
      const current = Array.isArray(slot.exercises) ? slot.exercises : [];
      const block = [
        {
          id: `quiz_circuit_mc_${day}_${idx}`,
          name: 'Mountain climbers',
          series: '30 sec',
          reps: '',
          rest: 30,
          intensity: 'moderate',
          notes: 'Circuit quiz (3 tours) : enchaîner les 4 exos, repos 30 s entre exos, 60 s entre tours.',
          materiel: 'Poids du corps',
          type: 'circuit',
          programCategory: 'cardio'
        },
        {
          id: `quiz_circuit_squat_${day}_${idx}`,
          name: 'Squat au poids du corps',
          series: '12',
          reps: '',
          rest: 30,
          intensity: 'moderate',
          notes: 'Circuit quiz.',
          materiel: 'Poids du corps',
          type: 'circuit',
          programCategory: 'street_workout'
        },
        {
          id: `quiz_circuit_push_${day}_${idx}`,
          name: 'Pompes',
          series: '10',
          reps: '',
          rest: 30,
          intensity: 'moderate',
          notes: 'Circuit quiz.',
          materiel: 'Poids du corps',
          type: 'circuit',
          programCategory: 'street_workout'
        },
        {
          id: `quiz_circuit_plank_${day}_${idx}`,
          name: 'Gainage',
          series: '40 sec',
          reps: '',
          rest: 30,
          intensity: 'moderate',
          notes: 'Circuit quiz — dernier exo du tour.',
          materiel: 'Poids du corps',
          type: 'circuit',
          programCategory: 'core'
        }
      ];
      slot.exercises = [...current, ...block];
      const noteLine =
        'Bloc circuit métabolique (quiz) : 3 tours, repos court. Commence par ton lift prioritaire en séries droites si prévu.';
      slot.notes = [slot.notes, noteLine].filter(Boolean).join('\n\n');
    });
  }

  if (onlyStraight) {
    strengthDays.forEach((day) => {
      const slot = schedule[day];
      if (!slot?.exercises) return;
      slot.exercises = slot.exercises.map((ex) => ({
        ...ex,
        rest: Math.max(Number(ex.rest) || 0, 75),
        type: ex.type === 'circuit' || ex.type === 'finisher' ? ex.type : 'standard'
      }));
    });
  }
}
