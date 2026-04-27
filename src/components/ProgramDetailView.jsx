import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Clock, 
  Dumbbell, 
  Sunrise, 
  Sun, 
  Sunset,
  Plus,
  Trash2,
  Search
} from 'lucide-react';
import { typography } from '../styles/typography';
import {
  PROGRAM_CATEGORIES,
  CARDIO_KINDS,
  RUNNING_SUBTYPES,
  JUMP_ROPE_MODES,
  MUSCU_PATTERNS,
  getCategoryLabel,
  createDefaultExercise,
  normalizeExerciseMeta
} from '../utils/programExerciseTypes';
import { purgeSoftRemovedExercisesFromProgram } from '../utils/programPersistenceUtils';
import { useTranslation } from '../utils/translations';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGES } from '../utils/translations/constants';
import { exerciseDatabase } from '../data/exerciseDatabase';

const PROGRAM_WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const REPS_SCOPES = {
  TOTAL: 'total',
  PER_HAND: 'per_hand',
  PER_SIDE: 'per_side'
};
const PICKER_TARGET_VARIANTS = {
  MAIN: 'main',
  SALLE: 'salle',
  ALL: 'all'
};
const PICKER_TARGET_WEEKS = {
  A: 'semaineA',
  B: 'semaineB',
  ALL: 'all'
};

const MUSCLE_QUERY_SYNONYMS = {
  jambes: ['quadriceps', 'ischio', 'ischios', 'mollets', 'fessiers', 'adducteurs', 'jambes'],
  jambe: ['quadriceps', 'ischio', 'ischios', 'mollets', 'fessiers', 'adducteurs', 'jambes'],
  bras: ['biceps', 'triceps', 'avant-bras', 'deltoides', 'épaules', 'epaule'],
  dos: ['dorsaux', 'grand dorsal', 'trapèzes', 'trapezes', 'rhomboides', 'rhomboïdes'],
  pecs: ['pectoraux', 'poitrine'],
  pectoraux: ['pecs', 'poitrine', 'pectoraux'],
  poitrine: ['pectoraux', 'pecs'],
  abdos: ['abdominaux', 'core', 'gainage', 'obliques'],
  epaules: ['épaules', 'deltoides', 'deltoïdes', 'trapèzes', 'trapezes'],
  épaules: ['epaules', 'deltoides', 'deltoïdes', 'trapèzes', 'trapezes'],
  fessier: ['fessiers', 'glutes', 'jambes'],
  fessiers: ['fessier', 'glutes', 'jambes']
};

/** Identifiant DOM stable pour défiler jusqu'à un exo (piste principale ou variante salle). */
const getProgramExerciseAnchorId = (dayKey, variantKey, exerciseId) => {
  const slot = variantKey == null ? 'main' : variantKey;
  return `program-exercise-${dayKey}-${slot}-${exerciseId}`;
};
const PROGRAM_DAY_LABELS = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

const ProgramDetailView = ({ program, onBack, onUpdateProgram }) => {
  /** Édition exo : { dayKey, exerciseId, variantKey?: 'semaineA'|'semaineB' } */
  const [editingExercise, setEditingExercise] = useState(null);
  const [editingStretch, setEditingStretch] = useState(null);
  const [editedData, setEditedData] = useState({});
  /** Nom + description globaux du programme */
  const [editingProgramMeta, setEditingProgramMeta] = useState(false);
  const [programMetaDraft, setProgramMetaDraft] = useState({ name: '', description: '' });
  /** Édition titre / focus / durée affichés dans l'en-tête du jour */
  const [editingDayHeaderKey, setEditingDayHeaderKey] = useState(null);
  const [dayHeaderDraft, setDayHeaderDraft] = useState({ name: '', focus: '', duration: '' });
  const tProgram = useTranslation();
  const { language } = useLanguage();
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [flashExerciseAnchorId, setFlashExerciseAnchorId] = useState(null);
  const [showExerciseBankPicker, setShowExerciseBankPicker] = useState(false);
  const [pickerContext, setPickerContext] = useState({ dayKey: null, variantKey: null });
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerSelectedKey, setPickerSelectedKey] = useState('');
  const [pickerVolumeMode, setPickerVolumeMode] = useState('reps');
  const [pickerRepsScope, setPickerRepsScope] = useState(REPS_SCOPES.TOTAL);
  const [pickerTargetVariant, setPickerTargetVariant] = useState(PICKER_TARGET_VARIANTS.MAIN);
  const [pickerTargetWeek, setPickerTargetWeek] = useState(PICKER_TARGET_WEEKS.A);
  const [pickerSets, setPickerSets] = useState('3');
  const [pickerReps, setPickerReps] = useState('10');
  const [pickerRepsPerHand, setPickerRepsPerHand] = useState('10');
  const [pickerRepsPerSide, setPickerRepsPerSide] = useState('10');
  const [pickerSeconds, setPickerSeconds] = useState('');
  const [pickerMinutes, setPickerMinutes] = useState('');
  const [pickerWeight, setPickerWeight] = useState('');

  const programSearchFallback = useMemo(() => {
    const en = language === LANGUAGES.EN;
    return {
      mainTrack: en ? 'Main session' : 'Séance principale',
      weekA: en ? 'Gym variant — week A' : 'Variante salle — semaine A',
      weekB: en ? 'Gym variant — week B' : 'Variante salle — semaine B',
      weekAWithName: (name) =>
        en ? `Gym variant — week A (${name})` : `Variante salle — semaine A (${name})`,
      weekBWithName: (name) =>
        en ? `Gym variant — week B (${name})` : `Variante salle — semaine B (${name})`,
      title: en ? 'Search an exercise' : 'Rechercher un exercice',
      placeholder: en ? 'e.g. pull-up, push-up, curl…' : 'Ex. : traction, pompe, curl…',
      hint:
        en
          ? 'Each row is one slot in your program (day and session type). Click a result to jump there.'
          : 'Chaque ligne = une place dans le programme (jour et type de séance). Cliquez pour y accéder.',
      noResults: en ? 'No exercise matches this search.' : 'Aucun exercice ne correspond à cette recherche.'
    };
  }, [language]);

  useEffect(() => {
    if (!program) return;
    setProgramMetaDraft({
      name: program.name ?? '',
      description: program.description ?? ''
    });
  }, [program?.id, program?.name, program?.description]);

  useEffect(() => {
    if (!program?.id) return;
    const purged = purgeSoftRemovedExercisesFromProgram(program);
    if (purged !== program) {
      onUpdateProgram(purged);
    }
  }, [program, onUpdateProgram]);

  const allProgramExerciseOccurrences = useMemo(() => {
    const rows = [];
    if (!program?.schedule) return rows;
    PROGRAM_WEEK_DAYS.forEach((dayKey) => {
      const dayData = program.schedule[dayKey];
      if (!dayData) return;

      (dayData.exercises || []).forEach((exercise) => {
        rows.push({
          key: `${dayKey}-main-${exercise.id}`,
          dayKey,
          dayLabel: PROGRAM_DAY_LABELS[dayKey],
          variantKey: null,
          contextLine: tProgram('program.detailSearch.mainTrack', programSearchFallback.mainTrack),
          exercise
        });
      });

      const sv = dayData.salleVariants;
      if (sv?.semaineA?.exercises?.length) {
        sv.semaineA.exercises.forEach((exercise) => {
          const variantName = sv.semaineA.name?.trim();
          rows.push({
            key: `${dayKey}-semaineA-${exercise.id}`,
            dayKey,
            dayLabel: PROGRAM_DAY_LABELS[dayKey],
            variantKey: 'semaineA',
            contextLine: variantName
              ? tProgram(
                  'program.detailSearch.weekAWithName',
                  programSearchFallback.weekAWithName(variantName),
                  { name: variantName }
                )
              : tProgram('program.detailSearch.weekA', programSearchFallback.weekA),
            exercise
          });
        });
      }
      if (sv?.semaineB?.exercises?.length) {
        sv.semaineB.exercises.forEach((exercise) => {
          const variantName = sv.semaineB.name?.trim();
          rows.push({
            key: `${dayKey}-semaineB-${exercise.id}`,
            dayKey,
            dayLabel: PROGRAM_DAY_LABELS[dayKey],
            variantKey: 'semaineB',
            contextLine: variantName
              ? tProgram(
                  'program.detailSearch.weekBWithName',
                  programSearchFallback.weekBWithName(variantName),
                  { name: variantName }
                )
              : tProgram('program.detailSearch.weekB', programSearchFallback.weekB),
            exercise
          });
        });
      }
    });
    return rows;
  }, [program, tProgram, programSearchFallback]);

  const filteredExerciseOccurrences = useMemo(() => {
    const q = exerciseSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return allProgramExerciseOccurrences.filter((row) => {
      const ex = row.exercise;
      const hay = [ex.name, ex.notes, ex.materiel, ex.series, ex.type]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [allProgramExerciseOccurrences, exerciseSearchQuery]);

  const exerciseBankRows = useMemo(() => {
    const rows = Object.entries(exerciseDatabase).map(([key, ex]) => ({
      key,
      name: ex.name || key,
      category: ex.category || '',
      equipment: ex.equipment || '',
      primary: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [],
      secondary: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : []
    }));
    rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    return rows;
  }, []);

  const filteredExerciseBankRows = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return exerciseBankRows;
    const expandedTerms = [q, ...(MUSCLE_QUERY_SYNONYMS[q] || [])];
    return exerciseBankRows.filter((row) => {
      const hay = `${row.name} ${row.category} ${row.equipment} ${row.primary.join(' ')} ${row.secondary.join(' ')}`.toLowerCase();
      const variations = Array.isArray(exerciseDatabase[row.key]?.variations)
        ? exerciseDatabase[row.key].variations.join(' ').toLowerCase()
        : '';
      const searchable = `${hay} ${variations}`;
      return expandedTerms.some((term) => searchable.includes(term));
    });
  }, [exerciseBankRows, pickerQuery]);

  const scrollToProgramExercise = useCallback((row) => {
    const anchorId = getProgramExerciseAnchorId(row.dayKey, row.variantKey, row.exercise.id);
    const el = typeof document !== 'undefined' ? document.getElementById(anchorId) : null;
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFlashExerciseAnchorId(anchorId);
    window.setTimeout(() => {
      setFlashExerciseAnchorId((cur) => (cur === anchorId ? null : cur));
    }, 2200);
  }, []);

  const handleSaveProgramMeta = () => {
    onUpdateProgram({
      ...program,
      name: programMetaDraft.name.trim() || program.name,
      description: programMetaDraft.description.trim(),
      updatedAt: new Date().toISOString()
    });
    setEditingProgramMeta(false);
  };

  const handleCancelProgramMeta = () => {
    setProgramMetaDraft({
      name: program.name ?? '',
      description: program.description ?? ''
    });
    setEditingProgramMeta(false);
  };

  const stretchIcons = {
    matin: Sunrise,
    midi: Sun,
    soir: Sunset
  };

  const patchEditedMeta = (patch) => {
    setEditedData((prev) => ({
      ...prev,
      meta: { ...normalizeExerciseMeta(prev), ...patch }
    }));
  };

  const handleEditDayHeader = (dayKey) => {
    const day = program.schedule[dayKey];
    if (!day) return;
    setEditingDayHeaderKey(dayKey);
    setDayHeaderDraft({
      name: day.name ?? '',
      focus: day.focus ?? '',
      duration: day.duration ?? ''
    });
  };

  const handleSaveDayHeader = (dayKey) => {
    const updatedProgram = { ...program, updatedAt: new Date().toISOString(), schedule: { ...program.schedule } };
    const day = { ...updatedProgram.schedule[dayKey] };
    day.name = dayHeaderDraft.name;
    day.focus = dayHeaderDraft.focus;
    day.duration = dayHeaderDraft.duration;
    updatedProgram.schedule[dayKey] = day;
    onUpdateProgram(updatedProgram);
    setEditingDayHeaderKey(null);
  };

  const handleCancelDayHeader = () => {
    setEditingDayHeaderKey(null);
  };

  const handleEditExercise = (dayKey, exerciseId) => {
    const exercise = program.schedule[dayKey].exercises.find((ex) => ex.id === exerciseId);
    setEditingExercise({ dayKey, exerciseId });
    setEditedData({
      ...exercise,
      meta: normalizeExerciseMeta(exercise),
      programCategory: exercise.programCategory || 'muscu',
      cardioKind: exercise.cardioKind || ''
    });
  };

  const handleEditVariantExercise = (dayKey, variantKey, exerciseId) => {
    const list = program.schedule[dayKey]?.salleVariants?.[variantKey]?.exercises;
    const exercise = list?.find((ex) => ex.id === exerciseId);
    if (!exercise) return;
    setEditingExercise({ dayKey, exerciseId, variantKey });
    setEditedData({
      ...exercise,
      meta: normalizeExerciseMeta(exercise),
      programCategory: exercise.programCategory || 'muscu',
      cardioKind: exercise.cardioKind || ''
    });
  };

  const handleSaveExercise = () => {
    if (!editingExercise) return;
    const updatedProgram = { ...program, schedule: { ...program.schedule } };
    const day = { ...updatedProgram.schedule[editingExercise.dayKey] };

    if (editingExercise.variantKey) {
      const vk = editingExercise.variantKey;
      const variants = { ...day.salleVariants };
      const v = { ...variants[vk], exercises: [...(variants[vk].exercises || [])] };
      const idx = v.exercises.findIndex((ex) => ex.id === editingExercise.exerciseId);
      if (idx !== -1) {
        v.exercises[idx] = {
          ...v.exercises[idx],
          ...editedData,
          meta: normalizeExerciseMeta(editedData)
        };
        variants[vk] = v;
        day.salleVariants = variants;
      }
    } else {
      day.exercises = [...(day.exercises || [])];
      const exerciseIndex = day.exercises.findIndex((ex) => ex.id === editingExercise.exerciseId);
      if (exerciseIndex !== -1) {
        day.exercises[exerciseIndex] = {
          ...day.exercises[exerciseIndex],
          ...editedData,
          meta: normalizeExerciseMeta(editedData)
        };
      }
    }
    updatedProgram.schedule[editingExercise.dayKey] = day;
    onUpdateProgram(updatedProgram);
    setEditingExercise(null);
    setEditedData({});
  };

  const openExerciseBankPicker = (dayKey, variantKey = null) => {
    const day = program?.schedule?.[dayKey];
    const hasSalleVariants = Boolean(day?.salleVariants?.semaineA || day?.salleVariants?.semaineB);
    const defaultVariantTarget = hasSalleVariants
      ? variantKey
        ? PICKER_TARGET_VARIANTS.SALLE
        : PICKER_TARGET_VARIANTS.MAIN
      : PICKER_TARGET_VARIANTS.MAIN;
    const defaultWeekTarget =
      variantKey === 'semaineB' ? PICKER_TARGET_WEEKS.B : PICKER_TARGET_WEEKS.A;

    setPickerContext({ dayKey, variantKey });
    setPickerQuery('');
    setPickerSelectedKey('');
    setPickerVolumeMode('reps');
    setPickerRepsScope(REPS_SCOPES.TOTAL);
    setPickerTargetVariant(defaultVariantTarget);
    setPickerTargetWeek(defaultWeekTarget);
    setPickerSets('3');
    setPickerReps('10');
    setPickerRepsPerHand('10');
    setPickerRepsPerSide('10');
    setPickerSeconds('');
    setPickerMinutes('');
    setPickerWeight('');
    setShowExerciseBankPicker(true);
  };

  const buildSeriesFromPicker = () => {
    if (pickerVolumeMode === 'seconds') return `${Math.max(1, parseInt(pickerSeconds || '0', 10))} sec`;
    if (pickerVolumeMode === 'minutes') return `${Math.max(1, parseInt(pickerMinutes || '0', 10))} min`;
    const sets = Math.max(1, parseInt(pickerSets || '0', 10));
    if (pickerRepsScope === REPS_SCOPES.PER_HAND) {
      const repsPerHand = Math.max(1, parseInt(pickerRepsPerHand || '0', 10));
      return `${sets}×${repsPerHand}/main`;
    }
    if (pickerRepsScope === REPS_SCOPES.PER_SIDE) {
      const repsPerSide = Math.max(1, parseInt(pickerRepsPerSide || '0', 10));
      return `${sets}×${repsPerSide}/côté`;
    }
    const reps = Math.max(1, parseInt(pickerReps || '0', 10));
    return `${sets}×${reps}`;
  };

  const inferProgramCategoryFromDatabase = (dbEx) => {
    const txt = `${dbEx?.category || ''} ${dbEx?.equipment || ''}`.toLowerCase();
    if (txt.includes('abdo') || txt.includes('core') || txt.includes('gainage')) return 'core';
    if (txt.includes('course') || txt.includes('cardio') || txt.includes('natation') || txt.includes('boxe')) return 'cardio';
    if (txt.includes('poids du corps') || txt.includes('barre de traction') || txt.includes('parall')) return 'street_workout';
    return 'muscu';
  };

  const handleConfirmExerciseBankAdd = () => {
    if (!pickerContext.dayKey || !pickerSelectedKey) return;
    const dbEx = exerciseDatabase[pickerSelectedKey];
    if (!dbEx) return;

    const newEx = createDefaultExercise();
    const series = buildSeriesFromPicker();
    const category = inferProgramCategoryFromDatabase(dbEx);
    const meta = {
      ...normalizeExerciseMeta(newEx),
      volumeMode: pickerVolumeMode,
      targetLoadKg: pickerWeight ? String(pickerWeight) : '',
      repsScope: pickerVolumeMode === 'reps' ? pickerRepsScope : '',
      repsPerHand:
        pickerVolumeMode === 'reps' && pickerRepsScope === REPS_SCOPES.PER_HAND
          ? Math.max(1, parseInt(pickerRepsPerHand || '0', 10))
          : '',
      repsPerSide:
        pickerVolumeMode === 'reps' && pickerRepsScope === REPS_SCOPES.PER_SIDE
          ? Math.max(1, parseInt(pickerRepsPerSide || '0', 10))
          : ''
    };
    const built = {
      ...newEx,
      name: dbEx.name || pickerSelectedKey,
      series,
      rest: pickerVolumeMode === 'reps' ? 90 : 30,
      intensity: pickerVolumeMode === 'reps' ? 'moderate' : 'light',
      materiel: dbEx.equipment || '',
      notes: dbEx.description || '',
      programCategory: category,
      cardioKind: category === 'cardio' ? 'other' : '',
      meta
    };

    const updatedProgram = { ...program, schedule: { ...program.schedule } };
    const day = { ...updatedProgram.schedule[pickerContext.dayKey] };
    const hasSalleVariants = Boolean(day?.salleVariants?.semaineA || day?.salleVariants?.semaineB);

    const pushBuiltExercise = (targetList) => {
      const clone = {
        ...built,
        id: `ex_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      };
      targetList.push(clone);
      return clone;
    };

    let lastInsertedExercise = null;

    const shouldAddToMain =
      pickerTargetVariant === PICKER_TARGET_VARIANTS.MAIN ||
      pickerTargetVariant === PICKER_TARGET_VARIANTS.ALL ||
      !hasSalleVariants;

    const shouldAddToWeekA =
      hasSalleVariants &&
      (pickerTargetVariant === PICKER_TARGET_VARIANTS.SALLE ||
        pickerTargetVariant === PICKER_TARGET_VARIANTS.ALL) &&
      (pickerTargetWeek === PICKER_TARGET_WEEKS.A || pickerTargetWeek === PICKER_TARGET_WEEKS.ALL);

    const shouldAddToWeekB =
      hasSalleVariants &&
      (pickerTargetVariant === PICKER_TARGET_VARIANTS.SALLE ||
        pickerTargetVariant === PICKER_TARGET_VARIANTS.ALL) &&
      (pickerTargetWeek === PICKER_TARGET_WEEKS.B || pickerTargetWeek === PICKER_TARGET_WEEKS.ALL);

    if (shouldAddToMain) {
      day.exercises = [...(day.exercises || [])];
      lastInsertedExercise = pushBuiltExercise(day.exercises);
    }

    if (hasSalleVariants && (shouldAddToWeekA || shouldAddToWeekB)) {
      const variants = { ...day.salleVariants };
      if (shouldAddToWeekA && variants.semaineA) {
        const vA = { ...variants.semaineA, exercises: [...(variants.semaineA?.exercises || [])] };
        lastInsertedExercise = pushBuiltExercise(vA.exercises);
        variants.semaineA = vA;
      }
      if (shouldAddToWeekB && variants.semaineB) {
        const vB = { ...variants.semaineB, exercises: [...(variants.semaineB?.exercises || [])] };
        lastInsertedExercise = pushBuiltExercise(vB.exercises);
        variants.semaineB = vB;
      }
      day.salleVariants = variants;
    }

    updatedProgram.schedule[pickerContext.dayKey] = day;
    onUpdateProgram(updatedProgram);
    setShowExerciseBankPicker(false);

    if (lastInsertedExercise) {
      const editVariantKey =
        pickerTargetVariant === PICKER_TARGET_VARIANTS.SALLE &&
        pickerTargetWeek !== PICKER_TARGET_WEEKS.ALL
          ? pickerTargetWeek
          : undefined;
      setEditingExercise({
        dayKey: pickerContext.dayKey,
        exerciseId: lastInsertedExercise.id,
        ...(editVariantKey ? { variantKey: editVariantKey } : {})
      });
      setEditedData({ ...lastInsertedExercise, meta: normalizeExerciseMeta(lastInsertedExercise) });
    }
  };

  const renderExerciseEditor = () => {
    const m = normalizeExerciseMeta(editedData);
    const cat = editedData.programCategory || 'muscu';
    const cardioK = editedData.cardioKind || '';

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={editedData.name || ''}
            onChange={(e) => setEditedData({ ...editedData, name: e.target.value })}
            className="bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
            placeholder="Nom de l'exercice"
          />
          <input
            type="text"
            value={editedData.series || ''}
            onChange={(e) => setEditedData({ ...editedData, series: e.target.value })}
            className="bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
            placeholder="Séries (ex: 4×12, 30 min, etc.)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs text-slate-400">
            Catégorie
            <select
              value={cat}
              onChange={(e) =>
                setEditedData({
                  ...editedData,
                  programCategory: e.target.value,
                  cardioKind: e.target.value === 'cardio' ? editedData.cardioKind || 'running' : '',
                  programSubType: e.target.value !== 'cardio' ? editedData.programSubType : ''
                })
              }
              className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
            >
              {PROGRAM_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          {cat === 'muscu' && (
            <label className="block text-xs text-slate-400">
              Schéma / type de travail
              <select
                value={m.pattern || ''}
                onChange={(e) => patchEditedMeta({ pattern: e.target.value })}
                className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
              >
                {MUSCU_PATTERNS.map((p) => (
                  <option key={p.id || 'none'} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {cat === 'cardio' && (
          <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3 space-y-3">
            <div className="text-xs font-semibold text-cyan-200">Cardio — détail</div>
            <label className="block text-xs text-slate-400">
              Type de cardio
              <select
                value={cardioK || 'running'}
                onChange={(e) => setEditedData({ ...editedData, cardioKind: e.target.value })}
                className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
              >
                {CARDIO_KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>

            {cardioK === 'running' && (
              <>
                <label className="block text-xs text-slate-400">
                  Type de course
                  <select
                    value={editedData.programSubType || 'running_easy'}
                    onChange={(e) => setEditedData({ ...editedData, programSubType: e.target.value })}
                    className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
                  >
                    {RUNNING_SUBTYPES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="text-xs text-slate-400">
                    Distance (km)
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={m.distanceKm ?? ''}
                      onChange={(e) =>
                        patchEditedMeta({
                          distanceKm: e.target.value === '' ? '' : parseFloat(e.target.value)
                        })
                      }
                      className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Durée cible (min)
                    <input
                      type="number"
                      min="0"
                      value={m.durationMin ?? ''}
                      onChange={(e) =>
                        patchEditedMeta({
                          durationMin: e.target.value === '' ? '' : parseInt(e.target.value, 10)
                        })
                      }
                      className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Allure cible
                    <input
                      type="text"
                      value={m.targetPace || ''}
                      onChange={(e) => patchEditedMeta({ targetPace: e.target.value })}
                      className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                      placeholder="5:00/km"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    Zone FC / note
                    <input
                      type="text"
                      value={m.targetHrZone || ''}
                      onChange={(e) => patchEditedMeta({ targetHrZone: e.target.value })}
                      className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                      placeholder="Z2, 140-150…"
                    />
                  </label>
                </div>
              </>
            )}

            {cardioK === 'jump_rope' && (
              <>
                <label className="block text-xs text-slate-400">
                  Mode
                  <select
                    value={m.jumpRopeMode || 'time'}
                    onChange={(e) => patchEditedMeta({ jumpRopeMode: e.target.value })}
                    className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
                  >
                    {JUMP_ROPE_MODES.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {(m.jumpRopeMode === 'time' || !m.jumpRopeMode) && (
                    <label className="text-xs text-slate-400">
                      Durée (min)
                      <input
                        type="number"
                        min="0"
                        value={m.jumpRopeDurationMin ?? ''}
                        onChange={(e) =>
                          patchEditedMeta({
                            jumpRopeDurationMin:
                              e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          })
                        }
                        className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                      />
                    </label>
                  )}
                  {m.jumpRopeMode === 'reps' && (
                    <label className="text-xs text-slate-400">
                      Nombre de sauts
                      <input
                        type="number"
                        min="0"
                        value={m.jumpCount ?? ''}
                        onChange={(e) =>
                          patchEditedMeta({
                            jumpCount: e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          })
                        }
                        className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                      />
                    </label>
                  )}
                  {m.jumpRopeMode === 'rounds' && (
                    <>
                      <label className="text-xs text-slate-400">
                        Rounds
                        <input
                          type="number"
                          min="1"
                          value={m.rounds ?? ''}
                          onChange={(e) =>
                            patchEditedMeta({
                              rounds: e.target.value === '' ? '' : parseInt(e.target.value, 10)
                            })
                          }
                          className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                        />
                      </label>
                      <label className="text-xs text-slate-400 col-span-2">
                        Détail des rounds
                        <input
                          type="text"
                          value={m.roundDetail || ''}
                          onChange={(e) => patchEditedMeta({ roundDetail: e.target.value })}
                          className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                        />
                      </label>
                    </>
                  )}
                </div>
              </>
            )}

            {cardioK === 'other' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <label className="text-xs text-slate-400">
                  Activité (vélo, rameur…)
                  <input
                    type="text"
                    value={m.otherCardioLabel || ''}
                    onChange={(e) => patchEditedMeta({ otherCardioLabel: e.target.value })}
                    className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                  />
                </label>
                <label className="text-xs text-slate-400">
                  Durée (min)
                  <input
                    type="number"
                    min="0"
                    value={m.durationMin ?? ''}
                    onChange={(e) =>
                      patchEditedMeta({
                        durationMin: e.target.value === '' ? '' : parseInt(e.target.value, 10)
                      })
                    }
                    className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-2 py-1 text-sm"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        {(cat === 'street_workout' || cat === 'core') && (
          <label className="block text-xs text-slate-400">
            Détail (optionnel)
            <input
              type="text"
              value={m.streetOrCoreDetail || ''}
              onChange={(e) => patchEditedMeta({ streetOrCoreDetail: e.target.value })}
              className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
              placeholder="Ex: tractions, dips, planche…"
            />
          </label>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={editedData.materiel || ''}
            onChange={(e) => setEditedData({ ...editedData, materiel: e.target.value })}
            className="bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
            placeholder="Matériel"
          />
          <select
            value={editedData.intensity || 'moderate'}
            onChange={(e) => setEditedData({ ...editedData, intensity: e.target.value })}
            className="bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
          >
            <option value="light">Léger</option>
            <option value="moderate">Modéré</option>
            <option value="heavy">Lourd</option>
            <option value="max">Maximum</option>
          </select>
          <input
            type="number"
            value={editedData.rest ?? ''}
            onChange={(e) =>
              setEditedData({ ...editedData, rest: e.target.value === '' ? '' : parseInt(e.target.value, 10) })
            }
            className="bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
            placeholder="Repos (sec)"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="block text-xs text-slate-400">
            Type série (legacy : circuit, superset…)
            <input
              type="text"
              value={editedData.type || 'standard'}
              onChange={(e) => setEditedData({ ...editedData, type: e.target.value })}
              className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
              placeholder="standard"
            />
          </label>
          <label className="block text-xs text-slate-400">
            Charge cible (kg, optionnel)
            <input
              type="text"
              value={m.targetLoadKg ?? ''}
              onChange={(e) => patchEditedMeta({ targetLoadKg: e.target.value })}
              className="mt-1 w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
            />
          </label>
        </div>
        <textarea
          value={editedData.notes || ''}
          onChange={(e) => setEditedData({ ...editedData, notes: e.target.value })}
          className="w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
          rows="2"
          placeholder="Notes techniques"
        />
        <div className="flex gap-2">
          <Button onClick={handleSaveExercise} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm">
            <Save size={14} className="mr-1" />
            Sauver
          </Button>
          <Button onClick={cancelEdit} className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 text-sm">
            <X size={14} className="mr-1" />
            Annuler
          </Button>
        </div>
      </div>
    );
  };

  const handleEditStretch = (dayKey, stretchType) => {
    const stretch = program.schedule[dayKey].etirements[stretchType];
    setEditingStretch({ dayKey, stretchType });
    setEditedData(stretch);
  };

  const handleSaveStretch = () => {
    if (!editingStretch) return;
    const updatedProgram = { ...program, updatedAt: new Date().toISOString(), schedule: { ...program.schedule } };
    const day = { ...updatedProgram.schedule[editingStretch.dayKey] };
    const stretches = { ...(day.etirements || {}) };
    stretches[editingStretch.stretchType] = {
      ...stretches[editingStretch.stretchType],
      ...editedData
    };
    day.etirements = stretches;
    updatedProgram.schedule[editingStretch.dayKey] = day;
    onUpdateProgram(updatedProgram);
    
    setEditingStretch(null);
    setEditedData({});
  };

  const cancelEdit = () => {
    setEditingExercise(null);
    setEditingStretch(null);
    setEditedData({});
  };

  const DELETE_EXO_CONFIRM =
    "Supprimer définitivement cet exercice du programme ?\n\n" +
    "Les reps et séances déjà enregistrées dans le calendrier ne sont pas effacées.";

  const handleDeleteExerciseFromProgram = (dayKey, exerciseId) => {
    const updatedProgram = {
      ...program,
      updatedAt: new Date().toISOString(),
      schedule: { ...program.schedule },
    };
    const day = { ...updatedProgram.schedule[dayKey] };
    day.exercises = (day.exercises || []).filter((ex) => ex.id !== exerciseId);
    updatedProgram.schedule[dayKey] = day;
    onUpdateProgram(updatedProgram);
  };

  const handleDeleteVariantExercise = (dayKey, variantKey, exerciseId) => {
    const updatedProgram = {
      ...program,
      updatedAt: new Date().toISOString(),
      schedule: { ...program.schedule },
    };
    const day = { ...updatedProgram.schedule[dayKey] };
    const variants = { ...day.salleVariants };
    const v = { ...variants[variantKey], exercises: [...(variants[variantKey].exercises || [])] };
    v.exercises = v.exercises.filter((ex) => ex.id !== exerciseId);
    variants[variantKey] = v;
    day.salleVariants = variants;
    updatedProgram.schedule[dayKey] = day;
    onUpdateProgram(updatedProgram);
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec bouton retour */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          onClick={onBack}
          className="flex items-center gap-2 border border-[#0F4C5C]/55 bg-black text-teal-100 hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/15"
        >
          <ArrowLeft size={20} />
          Retour
        </Button>
        <div className="flex-1 min-w-0">
          {!editingProgramMeta ? (
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <h1 className={`${typography.presets.h1} mb-2 break-words`}>{program.name}</h1>
                <p className="whitespace-pre-wrap text-teal-100/85">{program.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingProgramMeta(true)}
                className="shrink-0 rounded-lg border border-[#0F4C5C]/60 bg-black p-2 text-teal-200 transition-colors hover:border-[#0F5C45]/55 hover:bg-[#0F4C5C]/15"
                title="Modifier le nom et la description"
                aria-label="Modifier le nom et la description du programme"
              >
                <Edit3 size={18} />
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nom du programme</label>
                <input
                  type="text"
                  value={programMetaDraft.name}
                  onChange={(e) => setProgramMetaDraft((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-lg font-semibold text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea
                  value={programMetaDraft.description}
                  onChange={(e) => setProgramMetaDraft((p) => ({ ...p, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-sm text-teal-100/90"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSaveProgramMeta}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600/80 text-white hover:bg-emerald-500/90 border border-emerald-500/50"
                >
                  <Save size={16} />
                  Enregistrer
                </button>
                <button
                  type="button"
                  onClick={handleCancelProgramMeta}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#0F4C5C]/55 bg-black px-4 py-2 text-teal-100 hover:border-[#0F5C45]/55 hover:bg-[#0F4C5C]/10"
                >
                  <X size={16} />
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Informations générales */}
      <Card variant="sport" className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-6 text-sm text-teal-200/80">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>Durée: {program.duration} semaines</span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell size={16} />
              <span>Objectif: {program.goal}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recherche globale d'exercices (tous les jours + variantes salle) */}
      <Card variant="sport" className="mb-6">
        <CardHeader className="border-b border-[#0F4C5C]/40 pb-2">
          <CardTitle
            className={`${typography.presets.h3} flex items-center gap-2 text-teal-100 normal-case tracking-normal`}
          >
            <Search size={20} className="shrink-0 text-teal-400" />
            {tProgram('program.detailSearch.title', programSearchFallback.title)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="search"
            value={exerciseSearchQuery}
            onChange={(e) => setExerciseSearchQuery(e.target.value)}
            placeholder={tProgram('program.detailSearch.placeholder', programSearchFallback.placeholder)}
            className="w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2.5 text-sm text-white placeholder:text-teal-800 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/40"
            autoComplete="off"
          />
          <p className="text-xs text-teal-700">{tProgram('program.detailSearch.hint', programSearchFallback.hint)}</p>
          {exerciseSearchQuery.trim() && (
            <div className="max-h-[min(24rem,50vh)] overflow-y-auto rounded-lg border border-[#0F4C5C]/45 bg-black">
              {filteredExerciseOccurrences.length === 0 ? (
                <p className="p-4 text-sm text-slate-400">
                  {tProgram('program.detailSearch.noResults', programSearchFallback.noResults)}
                </p>
              ) : (
                <ul className="divide-y divide-[#0F4C5C]/30">
                  {filteredExerciseOccurrences.map((row) => (
                    <li key={row.key}>
                      <button
                        type="button"
                        onClick={() => scrollToProgramExercise(row)}
                        className="w-full px-4 py-3 text-left hover:bg-[#0F4C5C]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0F5C45]/45"
                      >
                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                          <span className="text-sm font-semibold text-amber-200/95 shrink-0">{row.dayLabel}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-sm font-medium text-white">{row.exercise.name}</span>
                        </div>
                        <div className="mt-1 text-xs text-slate-400">{row.contextLine}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {[row.exercise.series, row.exercise.materiel].filter(Boolean).join(' · ')}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Programme détaillé par jour */}
      <div className="space-y-6">
        {PROGRAM_WEEK_DAYS.map((dayKey) => {
          const dayData = program.schedule[dayKey];
          if (!dayData) return null;

          return (
            <Card key={dayKey} variant="sport" className="overflow-hidden !p-0 md:!p-0">
              <CardHeader className="border-b border-[#0F4C5C]/55 bg-black !px-4 md:!px-6">
                <CardTitle
                  className={`${typography.presets.h2} flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between w-full`}
                >
                  {editingDayHeaderKey === dayKey ? (
                    <div className="w-full space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white shrink-0">{PROGRAM_DAY_LABELS[dayKey]}</span>
                        <span className="text-slate-500">—</span>
                        <input
                          type="text"
                          value={dayHeaderDraft.name}
                          onChange={(e) => setDayHeaderDraft((d) => ({ ...d, name: e.target.value }))}
                          className="min-w-[8rem] flex-1 rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-sm text-teal-50 placeholder:text-teal-800"
                          placeholder="Titre du jour (ex. Biceps / Pectoraux)"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center text-sm">
                        <input
                          type="text"
                          value={dayHeaderDraft.duration}
                          onChange={(e) => setDayHeaderDraft((d) => ({ ...d, duration: e.target.value }))}
                          className="rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-teal-100 sm:max-w-[10rem]"
                          placeholder="Durée (ex. 45-55 min)"
                        />
                        <span className="hidden sm:inline text-slate-500">•</span>
                        <input
                          type="text"
                          value={dayHeaderDraft.focus}
                          onChange={(e) => setDayHeaderDraft((d) => ({ ...d, focus: e.target.value }))}
                          className="flex-1 rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-teal-100"
                          placeholder="Sous-titre / zones (ex. Biceps, pecs, haut du torse)"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          onClick={() => handleSaveDayHeader(dayKey)}
                          className="inline-flex items-center gap-1.5 bg-teal-600/30 text-teal-100 border border-teal-500/40 hover:bg-teal-600/40"
                        >
                          <Save size={14} />
                          Enregistrer
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCancelDayHeader}
                          className="inline-flex items-center gap-1.5 border border-[#0F4C5C]/50 bg-black text-teal-100"
                        >
                          <X size={14} />
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="min-w-0">
                          <span className="text-white">{PROGRAM_DAY_LABELS[dayKey]}</span>
                          <span className="text-slate-300 font-normal ml-2 sm:ml-3">
                            - {dayData.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => handleEditDayHeader(dayKey)}
                          className="p-1.5 h-auto shrink-0 bg-transparent hover:bg-slate-600/40 text-teal-400/90 hover:text-teal-200 border border-teal-500/35 rounded-lg"
                          title="Modifier le titre du jour"
                        >
                          <Edit3 size={16} />
                        </Button>
                      </div>
                      <div className="text-sm font-normal text-teal-700 sm:max-w-[50%] sm:pl-4 sm:text-right">
                        {dayData.duration} • {dayData.focus}
                      </div>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Étirements */}
                {dayData.etirements && (
                  <div className="mb-8">
                    <h3 className={`${typography.presets.h3} mb-4 flex items-center gap-2`}>
                      <Sunrise size={20} className="text-orange-400" />
                      Étirements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(dayData.etirements).map(([stretchType, stretch]) => {
                        const IconComponent = stretchIcons[stretchType];
                        const isEditing = editingStretch?.dayKey === dayKey && editingStretch?.stretchType === stretchType;
                        
                        return (
                          <div
                            key={stretchType}
                            className="rounded-lg border border-[#0F4C5C]/50 bg-black p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <IconComponent size={16} className="text-orange-400" />
                                <span className="font-medium capitalize">{stretchType}</span>
                              </div>
                              {!isEditing && (
                                <Button
                                  onClick={() => handleEditStretch(dayKey, stretchType)}
                                  className="p-1 h-auto bg-transparent hover:bg-slate-600/50 text-slate-400 hover:text-slate-200"
                                >
                                  <Edit3 size={14} />
                                </Button>
                              )}
                            </div>
                            
                            {isEditing ? (
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editedData.name || ''}
                                  onChange={(e) => setEditedData({...editedData, name: e.target.value})}
                                  className="w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
                                  placeholder="Nom de l'étirement"
                                />
                                <input
                                  type="text"
                                  value={editedData.duration || ''}
                                  onChange={(e) => setEditedData({...editedData, duration: e.target.value})}
                                  className="w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
                                  placeholder="Durée"
                                />
                                <textarea
                                  value={editedData.instructions || ''}
                                  onChange={(e) => setEditedData({...editedData, instructions: e.target.value})}
                                  className="w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
                                  rows="3"
                                  placeholder="Instructions"
                                />
                                <div className="flex gap-2">
                                  <Button onClick={handleSaveStretch} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 text-sm">
                                    <Save size={14} className="mr-1" />
                                    Sauver
                                  </Button>
                                  <Button onClick={cancelEdit} className="bg-slate-600 hover:bg-slate-700 text-white px-3 py-1 text-sm">
                                    <X size={14} className="mr-1" />
                                    Annuler
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium text-slate-200 mb-1">{stretch.name}</div>
                                <div className="text-xs text-slate-400 mb-2">{stretch.duration}</div>
                                <div className="text-xs text-slate-300 leading-relaxed">{stretch.instructions}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Activités complémentaires */}
                {dayData.complementaryActivity && (
                  <div className="mb-8">
                    <h3 className={`${typography.presets.h3} mb-4 flex items-center gap-2`}>
                      <Sun size={20} className="text-green-400" />
                      Activité complémentaire
                    </h3>
                    <div className="bg-green-700/20 rounded-lg p-4 border border-green-600/30">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-slate-200">{dayData.complementaryActivity.name}</h4>
                        <span className="bg-green-500/20 text-green-200 px-2 py-1 rounded text-xs">
                          {dayData.complementaryActivity.type}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-slate-300 mb-2">
                        <div>
                          <span className="text-slate-400">Durée:</span>
                          <div className="font-medium">{dayData.complementaryActivity.duration}</div>
                        </div>
                        <div>
                          <span className="text-slate-400">Intensité:</span>
                          <div className="font-medium capitalize">{dayData.complementaryActivity.intensity}</div>
                        </div>
                        {dayData.complementaryActivity.distance && (
                          <div>
                            <span className="text-slate-400">Distance:</span>
                            <div className="font-medium">{dayData.complementaryActivity.distance}</div>
                          </div>
                        )}
                      </div>
                      {dayData.complementaryActivity.notes && (
                        <div className="text-xs text-slate-400 italic mt-2">
                          {dayData.complementaryActivity.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Exercices */}
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className={`${typography.presets.h3} flex items-center gap-2 text-teal-50`}>
                      <Dumbbell size={20} className="text-teal-400" />
                      Exercices ({(dayData.exercises || []).length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => openExerciseBankPicker(dayKey)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-1.5 text-xs font-medium text-teal-100 hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/15"
                    >
                      <Plus size={14} />
                      Ajouter un exercice
                    </button>
                  </div>
                  {(!dayData.exercises || dayData.exercises.length === 0) && (
                    <p className="text-sm text-slate-500 mb-3">Aucun exercice pour ce jour — utilisez « Ajouter un exercice ».</p>
                  )}
                  <div className="space-y-3">
                    {(dayData.exercises || []).map((exercise, index) => {
                      const isEditing =
                        editingExercise?.dayKey === dayKey &&
                        editingExercise?.exerciseId === exercise.id &&
                        !editingExercise?.variantKey;
                      const mainAnchorId = getProgramExerciseAnchorId(dayKey, null, exercise.id);

                      return (
                        <div
                          key={exercise.id}
                          id={mainAnchorId}
                          className={`rounded-lg border bg-black p-4 transition-shadow duration-300 border-[#0F4C5C]/50 ${
                            flashExerciseAnchorId === mainAnchorId
                              ? 'ring-2 ring-cyan-400/90 ring-offset-2 ring-offset-black'
                              : ''
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {isEditing ? (
                                renderExerciseEditor()
                              ) : (
                                <div>
                                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <span className="rounded bg-[#0F5C45]/20 px-2 py-1 text-xs font-medium text-teal-100 ring-1 ring-[#0F4C5C]/45">
                                      {index + 1}
                                    </span>
                                    <h4 className="font-medium text-slate-200">{exercise.name}</h4>
                                    {exercise.programCategory && (
                                      <span className="bg-slate-600/60 text-slate-200 px-2 py-0.5 rounded text-xs">
                                        {getCategoryLabel(exercise.programCategory)}
                                      </span>
                                    )}
                                    {exercise.type && exercise.type !== 'standard' && (
                                      <span className="rounded border border-[#0F4C5C]/45 bg-[#0F4C5C]/20 px-2 py-1 text-xs text-teal-100">
                                        {exercise.type}
                                      </span>
                                    )}
                                  </div>
                                  {exercise.programCategory === 'cardio' && exercise.meta && (
                                    <p className="text-xs text-cyan-300/90 mb-2">
                                      {exercise.cardioKind === 'running' &&
                                        RUNNING_SUBTYPES.find((s) => s.id === exercise.programSubType)?.label}
                                      {exercise.cardioKind === 'running' &&
                                        exercise.meta.distanceKm != null &&
                                        ` · ${exercise.meta.distanceKm} km`}
                                      {exercise.meta?.durationMin != null && ` · ${exercise.meta.durationMin} min`}
                                      {exercise.cardioKind === 'jump_rope' &&
                                        exercise.meta?.jumpRopeMode === 'reps' &&
                                        exercise.meta?.jumpCount != null &&
                                        ` · ${exercise.meta.jumpCount} sauts`}
                                      {exercise.cardioKind === 'jump_rope' &&
                                        (exercise.meta?.jumpRopeMode === 'time' || !exercise.meta?.jumpRopeMode) &&
                                        exercise.meta?.jumpRopeDurationMin != null &&
                                        ` · ${exercise.meta.jumpRopeDurationMin} min`}
                                    </p>
                                  )}

                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-2">
                                    <div>
                                      <span className="text-slate-400">Séries:</span>
                                      <div className="font-medium">{exercise.series}</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Repos:</span>
                                      <div className="font-medium">{exercise.rest}s</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Intensité:</span>
                                      <div className="font-medium capitalize">{exercise.intensity}</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Matériel:</span>
                                      <div className="font-medium">{exercise.materiel}</div>
                                    </div>
                                  </div>

                                  {exercise.notes && (
                                    <div className="text-xs text-slate-400 italic mt-2">
                                      {exercise.notes}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {!isEditing && (
                              <div className="ml-3 flex flex-col items-end gap-2 shrink-0">
                                <Button
                                  onClick={() => handleEditExercise(dayKey, exercise.id)}
                                  className="p-2 h-auto bg-transparent hover:bg-slate-600/50 text-slate-400 hover:text-slate-200"
                                >
                                  <Edit3 size={16} />
                                </Button>
                                <Button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(DELETE_EXO_CONFIRM)) {
                                      handleDeleteExerciseFromProgram(dayKey, exercise.id);
                                    }
                                  }}
                                  className="p-2 h-auto bg-transparent hover:bg-red-500/20 text-red-300 hover:text-red-100 text-xs whitespace-nowrap"
                                  title="Supprimer du programme"
                                >
                                  <Trash2 size={14} className="inline mr-1" />
                                  Supprimer
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Variantes Salle */}
                {dayData.salleVariants && (
                  <div className="mt-6">
                    <h3 className={`${typography.presets.h3} mb-4 flex items-center gap-2`}>
                      <Dumbbell size={20} className="text-teal-400" />
                      Variantes Salle
                    </h3>
                    
                    {/* Semaine A */}
                    <div className="mb-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h4 className="flex items-center gap-2 text-lg font-semibold text-teal-100">
                          <span className="rounded bg-[#0F5C45]/25 px-2 py-1 text-sm text-teal-50 ring-1 ring-[#0F4C5C]/50">
                            Semaine A
                          </span>
                          {dayData.salleVariants.semaineA.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => openExerciseBankPicker(dayKey, 'semaineA')}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-1 text-xs text-teal-100 hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/15"
                        >
                          <Plus size={12} /> Ajouter
                        </button>
                      </div>
                      <div className="space-y-3">
                        {dayData.salleVariants.semaineA.exercises.map((exercise, index) => {
                          const isEditingVar =
                            editingExercise?.dayKey === dayKey &&
                            editingExercise?.exerciseId === exercise.id &&
                            editingExercise?.variantKey === 'semaineA';
                          const varAAnchorId = getProgramExerciseAnchorId(dayKey, 'semaineA', exercise.id);
                          return (
                            <div
                              key={exercise.id}
                              id={varAAnchorId}
                              className={`rounded-lg border bg-black p-4 transition-shadow duration-300 border-[#0F4C5C]/55 ${
                                flashExerciseAnchorId === varAAnchorId
                                  ? 'ring-2 ring-cyan-400/90 ring-offset-2 ring-offset-black'
                                  : ''
                              }`}
                            >
                              {isEditingVar ? (
                                renderExerciseEditor()
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="rounded bg-[#0F5C45]/20 px-2 py-1 text-xs font-medium text-teal-100 ring-1 ring-[#0F4C5C]/45">
                                        {index + 1}
                                      </span>
                                      <h5 className="font-medium text-slate-200">{exercise.name}</h5>
                                      {exercise.programCategory && (
                                        <span className="text-xs text-slate-400">
                                          {getCategoryLabel(exercise.programCategory)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleEditVariantExercise(dayKey, 'semaineA', exercise.id)}
                                        className="p-1.5 text-slate-400 hover:text-white"
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(DELETE_EXO_CONFIRM)) {
                                            handleDeleteVariantExercise(dayKey, 'semaineA', exercise.id);
                                          }
                                        }}
                                        className="text-xs text-red-300 hover:text-red-100 flex items-center gap-1"
                                      >
                                        <Trash2 size={12} /> Supprimer
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-2">
                                    <div>
                                      <span className="text-slate-400">Séries:</span>
                                      <div className="font-medium">{exercise.series}</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Repos:</span>
                                      <div className="font-medium">{exercise.rest}s</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Intensité:</span>
                                      <div className="font-medium capitalize">{exercise.intensity}</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Matériel:</span>
                                      <div className="font-medium">{exercise.materiel}</div>
                                    </div>
                                  </div>
                                  {exercise.notes && (
                                    <div className="text-xs text-slate-400 italic mt-2">{exercise.notes}</div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Semaine B */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h4 className="flex items-center gap-2 text-lg font-semibold text-teal-100">
                          <span className="rounded bg-[#0F5C45]/25 px-2 py-1 text-sm text-teal-50 ring-1 ring-[#0F4C5C]/50">
                            Semaine B
                          </span>
                          {dayData.salleVariants.semaineB.name}
                        </h4>
                        <button
                          type="button"
                          onClick={() => openExerciseBankPicker(dayKey, 'semaineB')}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-1 text-xs text-teal-100 hover:border-[#0F5C45]/60 hover:bg-[#0F4C5C]/15"
                        >
                          <Plus size={12} /> Ajouter
                        </button>
                      </div>
                      <div className="space-y-3">
                        {dayData.salleVariants.semaineB.exercises.map((exercise, index) => {
                          const isEditingVar =
                            editingExercise?.dayKey === dayKey &&
                            editingExercise?.exerciseId === exercise.id &&
                            editingExercise?.variantKey === 'semaineB';
                          const varBAnchorId = getProgramExerciseAnchorId(dayKey, 'semaineB', exercise.id);
                          return (
                            <div
                              key={exercise.id}
                              id={varBAnchorId}
                              className={`rounded-lg border bg-black p-4 transition-shadow duration-300 border-[#0F4C5C]/55 ${
                                flashExerciseAnchorId === varBAnchorId
                                  ? 'ring-2 ring-cyan-400/90 ring-offset-2 ring-offset-black'
                                  : ''
                              }`}
                            >
                              {isEditingVar ? (
                                renderExerciseEditor()
                              ) : (
                                <>
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="flex items-center gap-3 flex-wrap">
                                      <span className="rounded bg-[#0F5C45]/20 px-2 py-1 text-xs font-medium text-teal-100 ring-1 ring-[#0F4C5C]/45">
                                        {index + 1}
                                      </span>
                                      <h5 className="font-medium text-slate-200">{exercise.name}</h5>
                                      {exercise.programCategory && (
                                        <span className="text-xs text-slate-400">
                                          {getCategoryLabel(exercise.programCategory)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleEditVariantExercise(dayKey, 'semaineB', exercise.id)}
                                        className="p-1.5 text-slate-400 hover:text-white"
                                      >
                                        <Edit3 size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (window.confirm(DELETE_EXO_CONFIRM)) {
                                            handleDeleteVariantExercise(dayKey, 'semaineB', exercise.id);
                                          }
                                        }}
                                        className="text-xs text-red-300 hover:text-red-100 flex items-center gap-1"
                                      >
                                        <Trash2 size={12} /> Supprimer
                                      </button>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-slate-300 mb-2">
                                    <div>
                                      <span className="text-slate-400">Séries:</span>
                                      <div className="font-medium">{exercise.series}</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Repos:</span>
                                      <div className="font-medium">{exercise.rest}s</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Intensité:</span>
                                      <div className="font-medium capitalize">{exercise.intensity}</div>
                                    </div>
                                    <div>
                                      <span className="text-slate-400">Matériel:</span>
                                      <div className="font-medium">{exercise.materiel}</div>
                                    </div>
                                  </div>
                                  {exercise.notes && (
                                    <div className="text-xs text-slate-400 italic mt-2">{exercise.notes}</div>
                                  )}
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes du jour */}
                {dayData.notes && (
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <h4 className="font-medium text-yellow-200 mb-2">Notes importantes</h4>
                    <p className="text-sm text-yellow-100">{dayData.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {showExerciseBankPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-lg border border-[#0F4C5C]/70 bg-[#050A12]">
            <div className="border-b border-[#0F4C5C]/55 p-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Ajouter depuis la banque d’exercices</h3>
              <button
                type="button"
                onClick={() => setShowExerciseBankPicker(false)}
                className="rounded border border-[#0F4C5C]/55 px-2 py-1 text-xs text-slate-300 hover:text-white"
              >
                Fermer
              </button>
            </div>
            <div className="p-4 space-y-3">
              <input
                type="search"
                value={pickerQuery}
                onChange={(e) => setPickerQuery(e.target.value)}
                placeholder="Rechercher un exercice (nom, catégorie, matériel...)"
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-white"
              />
              <div className="max-h-52 overflow-y-auto rounded border border-[#0F4C5C]/45">
                {filteredExerciseBankRows.slice(0, 120).map((row) => (
                  <button
                    key={row.key}
                    type="button"
                    onClick={() => setPickerSelectedKey(row.key)}
                    className={`w-full border-b border-[#0F4C5C]/20 px-3 py-2 text-left text-sm ${
                      pickerSelectedKey === row.key ? 'bg-[#0F5C45]/25 text-white' : 'text-slate-300 hover:bg-[#0F4C5C]/15'
                    }`}
                  >
                    <div className="font-medium">{row.name}</div>
                    <div className="text-xs text-slate-400">{[row.category, row.equipment].filter(Boolean).join(' · ')}</div>
                  </button>
                ))}
              </div>

              {(() => {
                const day = program?.schedule?.[pickerContext.dayKey];
                const hasSalleVariants = Boolean(day?.salleVariants?.semaineA || day?.salleVariants?.semaineB);
                if (!hasSalleVariants) return null;

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <label className="text-xs text-slate-400">
                      Variante cible
                      <select
                        value={pickerTargetVariant}
                        onChange={(e) => setPickerTargetVariant(e.target.value)}
                        className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                      >
                        <option value={PICKER_TARGET_VARIANTS.MAIN}>Séance principale (street/maison)</option>
                        <option value={PICKER_TARGET_VARIANTS.SALLE}>Variante salle</option>
                        <option value={PICKER_TARGET_VARIANTS.ALL}>Toutes les variantes + principale</option>
                      </select>
                    </label>
                    {(pickerTargetVariant === PICKER_TARGET_VARIANTS.SALLE ||
                      pickerTargetVariant === PICKER_TARGET_VARIANTS.ALL) && (
                      <label className="text-xs text-slate-400">
                        Semaine cible
                        <select
                          value={pickerTargetWeek}
                          onChange={(e) => setPickerTargetWeek(e.target.value)}
                          className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                        >
                          <option value={PICKER_TARGET_WEEKS.A}>Semaine A</option>
                          <option value={PICKER_TARGET_WEEKS.B}>Semaine B</option>
                          <option value={PICKER_TARGET_WEEKS.ALL}>Toutes les semaines</option>
                        </select>
                      </label>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="text-xs text-slate-400">
                  Mode de volume
                  <select
                    value={pickerVolumeMode}
                    onChange={(e) => {
                      const mode = e.target.value;
                      setPickerVolumeMode(mode);
                      if (mode !== 'reps') {
                        setPickerRepsScope(REPS_SCOPES.TOTAL);
                      }
                    }}
                    className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                  >
                    <option value="reps">Répétitions</option>
                    <option value="seconds">Secondes</option>
                    <option value="minutes">Minutes</option>
                  </select>
                </label>
                {pickerVolumeMode === 'reps' && (
                  <label className="text-xs text-slate-400">
                    Poids cible (kg, optionnel)
                    <input
                      type="number"
                      min="0"
                      value={pickerWeight}
                      onChange={(e) => setPickerWeight(e.target.value)}
                      className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                    />
                  </label>
                )}
              </div>

              {pickerVolumeMode === 'reps' && (
                <div className="space-y-3">
                  <label className="text-xs text-slate-400 block">
                    Type de répétitions
                    <select
                      value={pickerRepsScope}
                      onChange={(e) => setPickerRepsScope(e.target.value)}
                      className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                    >
                      <option value={REPS_SCOPES.TOTAL}>Répétitions totales</option>
                      <option value={REPS_SCOPES.PER_HAND}>Répétitions par main</option>
                      <option value={REPS_SCOPES.PER_SIDE}>Répétitions par côté</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">
                    Séries
                    <input
                      type="number"
                      min="1"
                      value={pickerSets}
                      onChange={(e) => setPickerSets(e.target.value)}
                      className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                    />
                  </label>
                  <label className="text-xs text-slate-400">
                    {pickerRepsScope === REPS_SCOPES.PER_HAND
                      ? 'Reps par main'
                      : pickerRepsScope === REPS_SCOPES.PER_SIDE
                        ? 'Reps par côté'
                        : 'Reps'}
                    {pickerRepsScope === REPS_SCOPES.TOTAL && (
                      <input
                        type="number"
                        min="1"
                        value={pickerReps}
                        onChange={(e) => setPickerReps(e.target.value)}
                        className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                      />
                    )}
                    {pickerRepsScope === REPS_SCOPES.PER_HAND && (
                      <input
                        type="number"
                        min="1"
                        value={pickerRepsPerHand}
                        onChange={(e) => setPickerRepsPerHand(e.target.value)}
                        className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                      />
                    )}
                    {pickerRepsScope === REPS_SCOPES.PER_SIDE && (
                      <input
                        type="number"
                        min="1"
                        value={pickerRepsPerSide}
                        onChange={(e) => setPickerRepsPerSide(e.target.value)}
                        className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                      />
                    )}
                  </label>
                </div>
                </div>
              )}
              {pickerVolumeMode === 'seconds' && (
                <label className="text-xs text-slate-400 block">
                  Durée (secondes)
                  <input
                    type="number"
                    min="1"
                    value={pickerSeconds}
                    onChange={(e) => setPickerSeconds(e.target.value)}
                    className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                  />
                </label>
              )}
              {pickerVolumeMode === 'minutes' && (
                <label className="text-xs text-slate-400 block">
                  Durée (minutes)
                  <input
                    type="number"
                    min="1"
                    value={pickerMinutes}
                    onChange={(e) => setPickerMinutes(e.target.value)}
                    className="mt-1 w-full rounded border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-white"
                  />
                </label>
              )}
            </div>
            <div className="border-t border-[#0F4C5C]/55 p-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowExerciseBankPicker(false)}
                className="rounded border border-[#0F4C5C]/55 bg-black px-3 py-2 text-sm text-slate-300 hover:text-white"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmExerciseBankAdd}
                disabled={!pickerSelectedKey}
                className="rounded border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                Ajouter au programme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramDetailView;