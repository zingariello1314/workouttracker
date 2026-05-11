/**
 * Applique / crée des entrées programme liées aux pyramides.
 * @module services/trainingPatterns/pyramidProgramUtils
 */

const WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

function defaultEtirements() {
  return {
    matin: { name: 'Matin', duration: '', instructions: '' },
    midi: { name: 'Midi', duration: '', instructions: '' },
    soir: { name: 'Soir', duration: '', instructions: '' }
  };
}

function emptyDay() {
  return {
    name: '',
    focus: '',
    duration: '',
    notes: '',
    active: false,
    exercises: [],
    etirements: defaultEtirements(),
    salleVariants: {
      semaineA: { name: 'Variante salle A', exercises: [] },
      semaineB: { name: 'Variante salle B', exercises: [] }
    }
  };
}

function emptySchedule() {
  const s = {};
  WEEK_DAYS.forEach((d) => {
    s[d] = emptyDay();
  });
  return s;
}

/**
 * @param {{ name: string, series?: string, pyramidTemplate: object }} exercisePayload
 * @returns {object} programme sans id (addProgram le fournira)
 */
export function buildMinimalProgramWithPyramidExercise(exercisePayload) {
  const exId = Math.floor(900000 + Math.random() * 80000);
  const schedule = emptySchedule();
  schedule.lundi = {
    ...emptyDay(),
    active: true,
    name: 'Séance pyramide',
    focus: 'Pyramide',
    duration: '45 min',
    exercises: [
      {
        id: exId,
        name: exercisePayload.name || 'Exercice',
        series: exercisePayload.series || '5×4',
        type: 'standard',
        materiel: 'poids du corps',
        notes: '',
        rest: 90,
        intensity: 'moderate',
        pyramidTemplate: exercisePayload.pyramidTemplate
      }
    ]
  };
  return {
    name: exercisePayload.programName || `Pyramide — ${exercisePayload.name || 'nouveau'}`,
    description: 'Créé depuis Défis > Pyramide',
    duration: 4,
    schedule
  };
}

/**
 * @param {object} program
 * @param {{ dayKey: string, exerciseId: number|string, variantKey?: string|null, pyramidTemplate: object|null }} spec
 */
export function applyPyramidTemplateToProgramExercise(program, spec) {
  if (!program?.schedule || !spec?.dayKey) return program;
  const { dayKey, exerciseId, variantKey, pyramidTemplate } = spec;
  const updated = { ...program, schedule: { ...program.schedule } };
  const day = { ...updated.schedule[dayKey] };

  if (variantKey && day.salleVariants?.[variantKey]) {
    const variants = { ...day.salleVariants };
    const v = { ...variants[variantKey], exercises: [...(variants[variantKey].exercises || [])] };
    const idx = v.exercises.findIndex((ex) => String(ex.id) === String(exerciseId));
    if (idx < 0) return program;
    const ex = { ...v.exercises[idx] };
    if (pyramidTemplate == null || !pyramidTemplate.enabled) {
      delete ex.pyramidTemplate;
    } else {
      ex.pyramidTemplate = { ...pyramidTemplate };
    }
    v.exercises[idx] = ex;
    variants[variantKey] = v;
    day.salleVariants = variants;
  } else {
    const list = [...(day.exercises || [])];
    const idx = list.findIndex((ex) => String(ex.id) === String(exerciseId));
    if (idx < 0) return program;
    const ex = { ...list[idx] };
    if (pyramidTemplate == null || !pyramidTemplate.enabled) {
      delete ex.pyramidTemplate;
    } else {
      ex.pyramidTemplate = { ...pyramidTemplate };
    }
    list[idx] = ex;
    day.exercises = list;
  }

  updated.schedule[dayKey] = day;
  return updated;
}
