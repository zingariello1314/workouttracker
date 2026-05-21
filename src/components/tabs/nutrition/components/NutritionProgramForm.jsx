/**
 * NutritionProgramForm - Création / modification programme
 * Profil (impédancemètre), estimation TDEE/macros, préférences banque, exercices.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { Save, Activity, Dumbbell, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { typography } from '../../../../styles/typography';
import { DateHelper } from '../../../../utils/dateHelper';
import logger from '../../../../utils/logger';
import { useWorkout } from '../../../../context/WorkoutContext';
import {
  extractProfileFromProgressEntries,
  estimateProgramTargets,
  suggestedBankSelectionQuota
} from '../../../../utils/nutritionProgramEstimate';
import {
  NUTRITION_FOOD_BANK_ITEMS,
  findBankFoodByIdWithOverrides,
  mergeFoodBankWithOverrides
} from '../../../../data/nutritionFoodBank';
import { exerciseDatabase } from '../../../../data/exerciseDatabase';
import { generateMealPlanOutline } from '../../../../utils/nutritionMealPlanGenerator';
import ImpedanceQuickCapture from './ImpedanceQuickCapture';
import { mapQuizGoalToNutritionGoal } from '../../../../features/profileQuestionnaire/quizInfluence';

const log = logger.component('NutritionProgramForm');

const PENDING_PROGRESS_SECTION_KEY = 'momentum.pendingProgressSection';

function normalizeStoredGoal(goal) {
  const map = {
    bulk: 'bulking',
    cut: 'cutting',
    maintain: 'maintenance',
    stabilization: 'maintenance',
    stagnation: 'maintenance'
  };
  return map[goal] || goal || 'maintenance';
}

function mapQuizActivityToFactor(activityOutsideTraining) {
  const map = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725
  };
  return map[activityOutsideTraining] || 1.55;
}

function emptyPlanProfile() {
  return {
    heightCm: '',
    sex: 'male',
    age: '',
    baselineWeightKg: '',
    targetWeightKg: '',
    targetWeightDeltaKg: '',
    bodyFatPercent: '',
    activityFactor: 1.55,
    impedanceSourceDate: null,
    estimatedBmr: null,
    estimatedTdee: null,
    estimateNote: ''
  };
}

function emptyMealPlanPreferences() {
  return {
    lovedFoodIds: [],
    avoidedFoodIds: [],
    openFoodIds: [],
    selectedBankFoodIds: [],
    maxWeeklyFoodVariety: 28,
    selectedExerciseKeys: [],
    selectedSportProgramId: '',
    snacksPerDay: 2,
    generatedMealPlan: null
  };
}

function computeExpectedEndDate(startDate, duration) {
  if (!startDate || !duration || Number(duration) <= 0) return null;
  const d = new Date(startDate);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() + Number(duration) - 1);
  return d.toISOString().slice(0, 10);
}

function collectProgramExercisesForNutrition(programLike) {
  if (!programLike?.schedule || typeof programLike.schedule !== 'object') return [];
  const out = [];
  const seen = new Set();
  Object.values(programLike.schedule).forEach((dayBlock) => {
    const list = dayBlock?.exercices || dayBlock?.exercises || [];
    if (!Array.isArray(list)) return;
    list.forEach((ex) => {
      if (!ex) return;
      const name = typeof ex === 'string' ? ex : ex.name;
      if (!name || typeof name !== 'string') return;
      const key = typeof ex === 'object' && ex.id != null ? String(ex.id) : name.toLowerCase().replace(/\s+/g, '_');
      if (seen.has(key)) return;
      seen.add(key);
      out.push({
        key,
        name,
        category: (typeof ex === 'object' && ex.category) ? ex.category : (dayBlock?.focus || '')
      });
    });
  });
  return out.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function validateGeneratedProfileGate(pp, progressEntries, extractFn) {
  const snap = extractFn(progressEntries);
  const hasImpedanceLink = Boolean(pp.impedanceSourceDate);
  const hasWeight = Number.isFinite(Number(pp.baselineWeightKg));
  const hasHeight = Number.isFinite(Number(pp.heightCm));
  const hasAge = Number.isFinite(Number(pp.age));

  if (!hasImpedanceLink && (!snap || snap.weightKg == null)) {
    return 'Ajoute ou importe au moins une mesure impédancemètre (poids) pour ce type de programme.';
  }
  const h = Number(pp.heightCm);
  const a = Number(pp.age);
  const w = Number(pp.baselineWeightKg);
  if (!hasHeight || !hasAge || !hasWeight || !Number.isFinite(h) || !Number.isFinite(a) || !Number.isFinite(w)) {
    return 'Taille, âge réel et poids de référence sont obligatoires.';
  }
  if (!hasImpedanceLink) {
    return 'Lie les données à une mesure : « Importer dernière impédance » ou enregistre via la saisie rapide ci-dessous.';
  }
  return null;
}

function buildPlanProfileForSave(pp) {
  const o = {};
  const h = pp.heightCm === '' || pp.heightCm == null ? null : Number(pp.heightCm);
  if (h) o.heightCm = h;
  if (pp.sex) o.sex = pp.sex;
  const age = pp.age === '' || pp.age == null ? null : Number(pp.age);
  if (age) o.age = Math.round(age);
  const w = pp.baselineWeightKg === '' || pp.baselineWeightKg == null ? null : Number(pp.baselineWeightKg);
  if (w) o.baselineWeightKg = w;
  const targetW = pp.targetWeightKg === '' || pp.targetWeightKg == null ? null : Number(pp.targetWeightKg);
  if (targetW) o.targetWeightKg = targetW;
  const d = pp.targetWeightDeltaKg === '' || pp.targetWeightDeltaKg == null ? null : Number(pp.targetWeightDeltaKg);
  if (d != null && !Number.isNaN(d)) o.targetWeightDeltaKg = d;
  if (pp.bodyFatPercent !== '' && pp.bodyFatPercent != null && !Number.isNaN(Number(pp.bodyFatPercent))) {
    o.bodyFatPercent = Number(pp.bodyFatPercent);
  } else {
    o.bodyFatPercent = null;
  }
  const af = Number(pp.activityFactor);
  if (af >= 1 && af <= 2.6) o.activityFactor = af;
  if (pp.impedanceSourceDate) o.impedanceSourceDate = pp.impedanceSourceDate;
  if (pp.estimatedBmr != null) o.estimatedBmr = pp.estimatedBmr;
  if (pp.estimatedTdee != null) o.estimatedTdee = pp.estimatedTdee;
  if (pp.estimateNote) o.estimateNote = pp.estimateNote;
  return Object.keys(o).length ? o : undefined;
}

const WIZARD_LABELS = ['Mode', 'Base', 'Profil impédance', 'Repas & synthèse'];
const TOTAL_STEPS = 4;

const NutritionProgramForm = ({
  isOpen,
  onClose,
  program,
  onSave,
  nutritionData,
  progressEntries = [],
  initialQuizPrefill = null
}) => {
  const {
    setActiveTab,
    addProgressEntry,
    data,
    programs: trainingPrograms = [],
    activeProgram: activeTrainingProgram = null
  } = useWorkout();
  const [wizardStep, setWizardStep] = useState(1);
  const [formData, setFormData] = useState(() => ({
    name: '',
    description: '',
    creationMode: 'manual',
    goal: 'maintenance',
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    adjustForWorkout: false,
    workoutDayCalories: 2700,
    restDayCalories: 2300,
    duration: 30,
    startDate: DateHelper.getTodayLocal(),
    endDate: null,
    planProfile: emptyPlanProfile(),
    mealPlanPreferences: emptyMealPlanPreferences()
  }));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [foodSearch, setFoodSearch] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('');
  const [foodMacroSort, setFoodMacroSort] = useState('none');
  const [exerciseSearch, setExerciseSearch] = useState('');

  const goals = [
    {
      value: 'lean_bulk',
      label: 'Masse sèche',
      icon: '💪',
      description: '↑ masse modeste (~0,1–0,25 kg/sem.), protéines élevées, ajuster avec le poids / impédances'
    },
    { value: 'bulking', label: 'Prise de masse', icon: '📈', description: 'Surplus pour progresser charge / volume' },
    { value: 'cutting', label: 'Sèche', icon: '📉', description: 'Déficit pour perdre du gras en préservant le muscle' },
    {
      value: 'maintenance',
      label: 'Stabilisation',
      icon: '⚖️',
      description: '~0 kg/sem., performances stables ; recaler sur la courbe Suivi corporel'
    },
    { value: 'recomp', label: 'Recomposition', icon: '🔄', description: 'Perte de gras et maintien muscle' },
    { value: 'custom', label: 'Personnalisé', icon: '✏️', description: 'Cibles calories/macros ajustées manuellement' }
  ];

  const defaultExerciseOptions = useMemo(() => {
    return Object.entries(exerciseDatabase)
      .map(([key, ex]) => ({ key, name: ex.name, category: ex.category || '' }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, []);

  const selectedSportProgram = useMemo(() => {
    const id = formData.mealPlanPreferences.selectedSportProgramId;
    if (!id) return activeTrainingProgram;
    return (trainingPrograms || []).find((p) => String(p?.id) === String(id)) || activeTrainingProgram;
  }, [formData.mealPlanPreferences.selectedSportProgramId, trainingPrograms, activeTrainingProgram]);

  const sportProgramOptions = useMemo(() => {
    const all = Array.isArray(trainingPrograms) ? trainingPrograms : [];
    return all
      .filter((p) => p && p.id && p.name)
      .map((p) => ({ id: String(p.id), name: p.name }));
  }, [trainingPrograms]);

  const exerciseOptions = useMemo(() => {
    const fromSportProgram = collectProgramExercisesForNutrition(selectedSportProgram);
    return fromSportProgram.length > 0 ? fromSportProgram : defaultExerciseOptions;
  }, [selectedSportProgram, defaultExerciseOptions]);

  const loadExercisesFromSportProgram = useCallback((programLike) => {
    const fromProgram = collectProgramExercisesForNutrition(programLike);
    if (!fromProgram.length) return;
    setFormData((f) => ({
      ...f,
      mealPlanPreferences: {
        ...f.mealPlanPreferences,
        selectedExerciseKeys: fromProgram.map((x) => x.key)
      }
    }));
  }, []);

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.trim().toLowerCase();
    if (!q) return exerciseOptions.slice(0, 120);
    return exerciseOptions
      .filter((e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      .slice(0, 160);
  }, [exerciseOptions, exerciseSearch]);

  const bankQuotaHint = useMemo(
    () => suggestedBankSelectionQuota(formData.goal, formData.targetCalories),
    [formData.goal, formData.targetCalories]
  );

  const userFoodBank = useMemo(
    () => mergeFoodBankWithOverrides(NUTRITION_FOOD_BANK_ITEMS, data?.nutritionFoodOverrides),
    [data?.nutritionFoodOverrides]
  );

  const filteredFoods = useMemo(() => {
    const q = foodSearch.trim().toLowerCase();
    let arr = userFoodBank.filter((f) => {
      if (foodCategoryFilter && f.category !== foodCategoryFilter) return false;
      if (!q) return true;
      return f.name.toLowerCase().includes(q) || f.category.toLowerCase().includes(q);
    });
    if (foodMacroSort === 'protein') {
      arr = [...arr].sort((a, b) => (b.per100?.protein || 0) - (a.per100?.protein || 0));
    } else if (foodMacroSort === 'carbs') {
      arr = [...arr].sort((a, b) => (b.per100?.carbs || 0) - (a.per100?.carbs || 0));
    } else if (foodMacroSort === 'fat') {
      arr = [...arr].sort((a, b) => (b.per100?.fat || 0) - (a.per100?.fat || 0));
    } else if (foodMacroSort === 'kcal') {
      arr = [...arr].sort((a, b) => (b.per100?.kcal || 0) - (a.per100?.kcal || 0));
    }
    return arr.slice(0, 240);
  }, [foodSearch, foodCategoryFilter, foodMacroSort, userFoodBank]);

  useEffect(() => {
    const baseMeal = program?.mealPlanPreferences || {};
    const nextMealPrefs = {
      ...emptyMealPlanPreferences(),
      lovedFoodIds: baseMeal.lovedFoodIds || [],
      avoidedFoodIds: baseMeal.avoidedFoodIds || [],
      openFoodIds: baseMeal.openFoodIds || [],
      selectedBankFoodIds: baseMeal.selectedBankFoodIds || [],
      maxWeeklyFoodVariety: baseMeal.maxWeeklyFoodVariety ?? suggestedBankSelectionQuota(program?.goal, program?.targetCalories),
      selectedExerciseKeys: baseMeal.selectedExerciseKeys || [],
      selectedSportProgramId: baseMeal.selectedSportProgramId || '',
      snacksPerDay: baseMeal.snacksPerDay === 1 ? 1 : 2,
      generatedMealPlan: baseMeal.generatedMealPlan ?? null
    };

    const basePlan = program?.planProfile || {};
    const nextPlan = {
      ...emptyPlanProfile(),
      ...basePlan,
      heightCm: basePlan.heightCm ?? '',
      age: basePlan.age ?? '',
      baselineWeightKg: basePlan.baselineWeightKg ?? '',
      targetWeightKg: basePlan.targetWeightKg ?? '',
      targetWeightDeltaKg: basePlan.targetWeightDeltaKg ?? '',
      bodyFatPercent: basePlan.bodyFatPercent ?? '',
      activityFactor: basePlan.activityFactor ?? 1.55,
      sex: basePlan.sex || 'male',
      impedanceSourceDate: basePlan.impedanceSourceDate ?? null,
      estimatedBmr: basePlan.estimatedBmr ?? null,
      estimatedTdee: basePlan.estimatedTdee ?? null,
      estimateNote: basePlan.estimateNote || ''
    };

    if (program) {
      setFormData({
        name: program.name || '',
        description: program.description || '',
        creationMode: program.creationMode === 'generated' ? 'generated' : 'manual',
        goal: normalizeStoredGoal(program.goal),
        targetCalories: program.targetCalories || 2500,
        targetProtein: program.targetProtein || 150,
        targetCarbs: program.targetCarbs || 300,
        targetFat: program.targetFat || 80,
        adjustForWorkout: program.adjustForWorkout || false,
        workoutDayCalories: program.workoutDayCalories || program.targetCalories + 200,
        restDayCalories: program.restDayCalories || program.targetCalories - 200,
        duration: program.duration || 30,
        startDate: program.startDate || DateHelper.getTodayLocal(),
        endDate: program.endDate || null,
        planProfile: nextPlan,
        mealPlanPreferences: nextMealPrefs
      });
    } else {
      const hint = suggestedBankSelectionQuota('maintenance', 2500);
      const quizAnswers = initialQuizPrefill?.answers || {};
      const suggestedGoal = mapQuizGoalToNutritionGoal(
        quizAnswers.goalPhysique,
        quizAnswers.currentPhysique || null
      );
      const quizBodyFat = initialQuizPrefill?.nutrition?.bodyFatPercent;
      const quizActivityFactor = mapQuizActivityToFactor(initialQuizPrefill?.nutrition?.activityOutsideTraining);
      setFormData({
        name: '',
        description: '',
        creationMode: 'manual',
        goal: suggestedGoal,
        targetCalories: 2500,
        targetProtein: 150,
        targetCarbs: 300,
        targetFat: 80,
        adjustForWorkout: false,
        workoutDayCalories: 2700,
        restDayCalories: 2300,
        duration: 30,
        startDate: DateHelper.getTodayLocal(),
        endDate: null,
        planProfile: {
          ...emptyPlanProfile(),
          ...(quizAnswers.vitalsSelfReport?.sex === 'female' || quizAnswers.vitalsSelfReport?.sex === 'male'
            ? { sex: quizAnswers.vitalsSelfReport.sex === 'female' ? 'female' : 'male' }
            : {}),
          ...(quizAnswers.vitalsSelfReport?.age != null
            ? { age: String(quizAnswers.vitalsSelfReport.age) }
            : {}),
          ...(quizAnswers.vitalsSelfReport?.heightCm != null
            ? { heightCm: String(quizAnswers.vitalsSelfReport.heightCm) }
            : {}),
          ...(quizAnswers.vitalsSelfReport?.weightKg != null
            ? { baselineWeightKg: String(quizAnswers.vitalsSelfReport.weightKg) }
            : {}),
          bodyFatPercent:
            quizBodyFat !== null && quizBodyFat !== undefined && quizBodyFat !== ''
              ? String(quizBodyFat)
              : '',
          activityFactor: quizActivityFactor
        },
        mealPlanPreferences: {
          ...emptyMealPlanPreferences(),
          maxWeeklyFoodVariety: hint,
          selectedSportProgramId: activeTrainingProgram?.id ? String(activeTrainingProgram.id) : ''
        }
      });
    }
    setErrors({});
    setFoodSearch('');
    setFoodCategoryFilter('');
    setFoodMacroSort('none');
    setExerciseSearch('');
    setWizardStep(1);
  }, [program, isOpen, activeTrainingProgram, initialQuizPrefill]);

  useEffect(() => {
    if (!isOpen || program) return;
    if (!activeTrainingProgram) return;
    if ((formData.mealPlanPreferences.selectedExerciseKeys || []).length > 0) return;
    loadExercisesFromSportProgram(activeTrainingProgram);
  }, [isOpen, program, activeTrainingProgram, formData.mealPlanPreferences.selectedExerciseKeys, loadExercisesFromSportProgram]);

  const validate = useCallback(() => {
    const newErrors = {};

    if (!formData.name || formData.name.trim() === '') {
      newErrors.name = 'Le nom est obligatoire';
    }

    if (formData.targetCalories < 1000 || formData.targetCalories > 10000) {
      newErrors.targetCalories = 'Les calories doivent être entre 1000 et 10000 kcal';
    }

    if (formData.targetProtein < 0 || formData.targetProtein > 500) {
      newErrors.targetProtein = 'Les protéines doivent être entre 0 et 500 g';
    }

    if (formData.targetCarbs < 0 || formData.targetCarbs > 1000) {
      newErrors.targetCarbs = 'Les glucides doivent être entre 0 et 1000 g';
    }

    if (formData.targetFat < 0 || formData.targetFat > 500) {
      newErrors.targetFat = 'Les lipides doivent être entre 0 et 500 g';
    }

    if (formData.adjustForWorkout) {
      if (formData.workoutDayCalories < 1000 || formData.workoutDayCalories > 10000) {
        newErrors.workoutDayCalories = 'Calories jour workout invalides';
      }
      if (formData.restDayCalories < 1000 || formData.restDayCalories > 10000) {
        newErrors.restDayCalories = 'Calories jour repos invalides';
      }
    }

    const m = formData.mealPlanPreferences.maxWeeklyFoodVariety;
    if (m != null && (m < 5 || m > 100)) {
      newErrors.maxWeeklyFoodVariety = 'Variété hebdo : entre 5 et 100';
    }

    if (formData.creationMode === 'generated') {
      const gate = validateGeneratedProfileGate(
        formData.planProfile,
        progressEntries,
        extractProfileFromProgressEntries
      );
      if (gate) newErrors.impedance = gate;
      const gmp = formData.mealPlanPreferences.generatedMealPlan;
      if (!Array.isArray(gmp) || gmp.length === 0) {
        newErrors.generatedMealPlan =
          'Tu dois générer un plan jour (3 repas + collations) avec le bouton dédié avant d’enregistrer.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, progressEntries]);

  const percentages = useMemo(() => {
    const targetKcal = Math.max(1, Number(formData.targetCalories) || 1);
    const proteinCal = formData.targetProtein * 4;
    const carbsCal = formData.targetCarbs * 4;
    const fatCal = formData.targetFat * 9;
    const used = proteinCal + carbsCal + fatCal;

    return {
      protein: Math.round((proteinCal / targetKcal) * 100),
      carbs: Math.round((carbsCal / targetKcal) * 100),
      fat: Math.round((fatCal / targetKcal) * 100),
      remaining: Math.max(0, Math.round(((targetKcal - used) / targetKcal) * 100))
    };
  }, [formData.targetProtein, formData.targetCarbs, formData.targetFat, formData.targetCalories]);

  const suggestedTargets = useMemo(() => {
    const pp = formData.planProfile;
    const snap = extractProfileFromProgressEntries(progressEntries);
    try {
      const inferredWeeklyDelta =
        pp.targetWeightDeltaKg === '' &&
        pp.targetWeightKg !== '' &&
        (pp.baselineWeightKg !== '' || snap?.weightKg != null) &&
        Number(formData.duration) > 0
          ? (Number(pp.targetWeightKg) - Number(pp.baselineWeightKg || snap?.weightKg || 0)) /
            (Number(formData.duration) / 7)
          : undefined;
      return estimateProgramTargets({
        baselineWeightKg:
          pp.baselineWeightKg === '' ? (snap?.weightKg != null ? Number(snap.weightKg) : undefined) : Number(pp.baselineWeightKg),
        heightCm:
          pp.heightCm === '' ? (snap?.heightCm != null ? Number(snap.heightCm) : undefined) : Number(pp.heightCm),
        age: pp.age === '' ? (snap?.age != null ? Number(snap.age) : undefined) : Number(pp.age),
        sex: pp.sex,
        bodyFatPercent:
          pp.bodyFatPercent === ''
            ? (snap?.bodyFatPercent != null ? Number(snap.bodyFatPercent) : null)
            : Number(pp.bodyFatPercent),
        activityFactor: Number(pp.activityFactor) || 1.55,
        goal: formData.goal,
        weeklyWeightDeltaKg:
          pp.targetWeightDeltaKg === '' ? inferredWeeklyDelta : Number(pp.targetWeightDeltaKg),
        targetWeightDeltaKg: pp.targetWeightDeltaKg === '' ? undefined : Number(pp.targetWeightDeltaKg)
      });
    } catch {
      return null;
    }
  }, [formData.planProfile, formData.goal, formData.duration, progressEntries]);

  const applySuggestedTargets = useCallback(() => {
    if (!suggestedTargets) return;
    setFormData((f) => ({
      ...f,
      targetCalories: suggestedTargets.targetCalories,
      targetProtein: suggestedTargets.targetProtein,
      targetCarbs: suggestedTargets.targetCarbs,
      targetFat: suggestedTargets.targetFat,
      planProfile: {
        ...f.planProfile,
        estimatedBmr: suggestedTargets.bmr,
        estimatedTdee: suggestedTargets.tdee,
        estimateNote: suggestedTargets.note
      },
      mealPlanPreferences: {
        ...f.mealPlanPreferences,
        maxWeeklyFoodVariety: suggestedBankSelectionQuota(f.goal, suggestedTargets.targetCalories)
      }
    }));
  }, [suggestedTargets]);

  const applyImpedanceSnapshot = useCallback(() => {
    const snap = extractProfileFromProgressEntries(progressEntries);
    if (!snap) {
      setErrors((e) => ({ ...e, impedance: 'Aucune mesure impédancemètre enregistrée.' }));
      return;
    }
    setErrors((e) => {
      const { impedance: _i, ...rest } = e;
      return rest;
    });
    setFormData((f) => ({
      ...f,
      planProfile: {
        ...f.planProfile,
        baselineWeightKg: snap.weightKg != null ? String(snap.weightKg) : f.planProfile.baselineWeightKg,
        heightCm: snap.heightCm != null ? String(snap.heightCm) : f.planProfile.heightCm,
        age:
          snap.age != null ? String(Math.round(snap.age)) : f.planProfile.age,
        bodyFatPercent:
          snap.bodyFatPercent != null ? String(snap.bodyFatPercent) : f.planProfile.bodyFatPercent,
        impedanceSourceDate: snap.date || f.planProfile.impedanceSourceDate
      }
    }));
  }, [progressEntries]);

  const openProgressImpedance = useCallback(() => {
    try {
      sessionStorage.setItem(PENDING_PROGRESS_SECTION_KEY, 'impedance');
    } catch {
      /* ignore */
    }
    setActiveTab('progress');
  }, [setActiveTab]);

  const fillProfileFromQuickImpedance = useCallback((entry) => {
    const d =
      typeof entry.date === 'string'
        ? entry.date.slice(0, 10)
        : entry.date != null
          ? new Date(entry.date).toISOString().slice(0, 10)
          : null;
    setFormData((f) => ({
      ...f,
      planProfile: {
        ...f.planProfile,
        baselineWeightKg: entry.weight != null ? String(entry.weight) : f.planProfile.baselineWeightKg,
        heightCm: entry.heightCm != null ? String(entry.heightCm) : f.planProfile.heightCm,
        age: entry.chronologicalAge != null ? String(entry.chronologicalAge) : f.planProfile.age,
        bodyFatPercent:
          entry.bodyFatPercentage !== '' && entry.bodyFatPercentage != null && entry.bodyFatPercentage !== undefined
            ? String(entry.bodyFatPercentage)
            : f.planProfile.bodyFatPercent,
        impedanceSourceDate: d || f.planProfile.impedanceSourceDate
      }
    }));
  }, []);

  const composeDayPlan = useCallback(() => {
    const prefs = formData.mealPlanPreferences;
    const outline = generateMealPlanOutline({
      foodBankItems: userFoodBank,
      targetCalories: formData.targetCalories,
      targetProtein: formData.targetProtein,
      targetCarbs: formData.targetCarbs,
      targetFat: formData.targetFat,
      lovedFoodIds: prefs.lovedFoodIds,
      avoidedFoodIds: prefs.avoidedFoodIds,
      openFoodIds: prefs.openFoodIds,
      selectedBankFoodIds: prefs.selectedBankFoodIds,
      snacksPerDay: prefs.snacksPerDay === 1 ? 1 : 2
    });
    setFormData((f) => ({
      ...f,
      mealPlanPreferences: { ...f.mealPlanPreferences, generatedMealPlan: outline }
    }));
    setErrors((e) => {
      const { generatedMealPlan: _g, ...rest } = e;
      return rest;
    });
  }, [formData.mealPlanPreferences, formData.targetCalories, formData.targetProtein, formData.targetCarbs, formData.targetFat, userFoodBank]);

  const goWizardNext = useCallback(() => {
    setErrors((e) => {
      const { wizard: _w, ...rest } = e;
      return rest;
    });
    if (wizardStep === 2 && (!formData.name || !formData.name.trim())) {
      setErrors({ name: 'Le nom est obligatoire pour continuer.' });
      return;
    }
    if (wizardStep === 3 && formData.creationMode === 'generated') {
      const gate = validateGeneratedProfileGate(
        formData.planProfile,
        progressEntries,
        extractProfileFromProgressEntries
      );
      if (gate) {
        setErrors({ wizard: gate });
        return;
      }
    }
    setWizardStep((s) => Math.min(TOTAL_STEPS, s + 1));
  }, [wizardStep, formData.name, formData.creationMode, formData.planProfile, progressEntries]);

  const goWizardPrev = useCallback(() => {
    setWizardStep((s) => Math.max(1, s - 1));
    setErrors((e) => {
      const { wizard: _w, ...rest } = e;
      return rest;
    });
  }, []);

  const runEstimate = useCallback(() => {
    const pp = formData.planProfile;
    setErrors((e) => {
      const { estimate: _est, ...rest } = e;
      return rest;
    });
    try {
      const inferredWeeklyDelta =
        pp.targetWeightDeltaKg === '' &&
        pp.targetWeightKg !== '' &&
        pp.baselineWeightKg !== '' &&
        Number(formData.duration) > 0
          ? (Number(pp.targetWeightKg) - Number(pp.baselineWeightKg)) / (Number(formData.duration) / 7)
          : undefined;
      const est = estimateProgramTargets({
        baselineWeightKg: pp.baselineWeightKg === '' ? undefined : Number(pp.baselineWeightKg),
        heightCm: pp.heightCm === '' ? undefined : Number(pp.heightCm),
        age: pp.age === '' ? undefined : Number(pp.age),
        sex: pp.sex,
        bodyFatPercent: pp.bodyFatPercent === '' ? null : Number(pp.bodyFatPercent),
        activityFactor: Number(pp.activityFactor) || 1.55,
        goal: formData.goal,
        weeklyWeightDeltaKg:
          pp.targetWeightDeltaKg === '' ? inferredWeeklyDelta : Number(pp.targetWeightDeltaKg),
        targetWeightDeltaKg: pp.targetWeightDeltaKg === '' ? undefined : Number(pp.targetWeightDeltaKg)
      });
      setFormData((f) => ({
        ...f,
        targetCalories: est.targetCalories,
        targetProtein: est.targetProtein,
        targetCarbs: est.targetCarbs,
        targetFat: est.targetFat,
        planProfile: {
          ...f.planProfile,
          estimatedBmr: est.bmr,
          estimatedTdee: est.tdee,
          estimateNote: est.note
        },
        mealPlanPreferences: {
          ...f.mealPlanPreferences,
          maxWeeklyFoodVariety: suggestedBankSelectionQuota(f.goal, est.targetCalories)
        }
      }));
    } catch (err) {
      log.error('estimateProgramTargets', err);
      setErrors((e) => ({ ...e, estimate: 'Impossible de calculer les cibles.' }));
    }
  }, [formData.planProfile, formData.goal]);

  const setFoodPreference = useCallback((id, bucket) => {
    setFormData((f) => {
      const m = { ...f.mealPlanPreferences };
      let loved = m.lovedFoodIds.filter((x) => x !== id);
      let avoided = m.avoidedFoodIds.filter((x) => x !== id);
      let open = m.openFoodIds.filter((x) => x !== id);
      let selected = [...m.selectedBankFoodIds];
      if (bucket === 'loved') loved = [...loved, id];
      else if (bucket === 'avoided') {
        avoided = [...avoided, id];
        selected = selected.filter((x) => x !== id);
      } else if (bucket === 'open') open = [...open, id];
      else if (bucket === 'clear') {
        /* noop lists already stripped */
      }
      return {
        ...f,
        mealPlanPreferences: {
          ...m,
          lovedFoodIds: loved,
          avoidedFoodIds: avoided,
          openFoodIds: open,
          selectedBankFoodIds: selected
        }
      };
    });
  }, []);

  const toggleProgramFood = useCallback((id) => {
    setFormData((f) => {
      const m = f.mealPlanPreferences;
      if (m.avoidedFoodIds.includes(id)) return f;
      const has = m.selectedBankFoodIds.includes(id);
      const selectedBankFoodIds = has
        ? m.selectedBankFoodIds.filter((x) => x !== id)
        : [...m.selectedBankFoodIds, id];
      return { ...f, mealPlanPreferences: { ...m, selectedBankFoodIds } };
    });
  }, []);

  const toggleExercise = useCallback((key) => {
    setFormData((f) => {
      const m = f.mealPlanPreferences;
      const has = m.selectedExerciseKeys.includes(key);
      const selectedExerciseKeys = has
        ? m.selectedExerciseKeys.filter((k) => k !== key)
        : [...m.selectedExerciseKeys, key];
      return { ...f, mealPlanPreferences: { ...m, selectedExerciseKeys } };
    });
  }, []);

  const expectedEndDate = useMemo(
    () => computeExpectedEndDate(formData.startDate, formData.duration),
    [formData.startDate, formData.duration]
  );

  const handleSave = useCallback(async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const ppSave = buildPlanProfileForSave(formData.planProfile);
      const prefsSave = formData.mealPlanPreferences;
      const programData = {
        id: program?.id || nutritionData.generateProgramId(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        creationMode: formData.creationMode === 'generated' ? 'generated' : 'manual',
        goal: formData.goal,
        targetCalories: Math.round(formData.targetCalories),
        targetProtein: Math.round(formData.targetProtein * 10) / 10,
        targetCarbs: Math.round(formData.targetCarbs * 10) / 10,
        targetFat: Math.round(formData.targetFat * 10) / 10,
        targetProteinPercent: percentages.protein,
        targetCarbsPercent: percentages.carbs,
        targetFatPercent: percentages.fat,
        adjustForWorkout: formData.adjustForWorkout,
        workoutDayCalories: formData.adjustForWorkout ? Math.round(formData.workoutDayCalories) : null,
        restDayCalories: formData.adjustForWorkout ? Math.round(formData.restDayCalories) : null,
        duration: formData.duration,
        startDate: formData.startDate,
        endDate: formData.endDate || expectedEndDate || null,
        isActive: program?.isActive || false,
        isArchived: program?.isArchived || false,
        ...(ppSave ? { planProfile: ppSave } : {}),
        mealPlanPreferences: {
          lovedFoodIds: prefsSave.lovedFoodIds,
          avoidedFoodIds: prefsSave.avoidedFoodIds,
          openFoodIds: prefsSave.openFoodIds,
          selectedBankFoodIds: prefsSave.selectedBankFoodIds,
          maxWeeklyFoodVariety: prefsSave.maxWeeklyFoodVariety,
          selectedExerciseKeys: prefsSave.selectedExerciseKeys,
          selectedSportProgramId: prefsSave.selectedSportProgramId || '',
          snacksPerDay: prefsSave.snacksPerDay === 1 ? 1 : 2,
          ...(Array.isArray(prefsSave.generatedMealPlan) && prefsSave.generatedMealPlan.length > 0
            ? { generatedMealPlan: prefsSave.generatedMealPlan }
            : {})
        }
      };

      const saved = await onSave(programData);
      if (!saved) {
        setErrors((prev) => ({
          ...prev,
          submit: 'Enregistrement impossible. Vérifie les champs et réessaie.'
        }));
      }
    } catch (error) {
      log.error('Erreur sauvegarde', error);
      setErrors({ submit: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  }, [formData, percentages, program, nutritionData, validate, onSave, expectedEndDate]);

  const pp = formData.planProfile;
  const prefs = formData.mealPlanPreferences;
  const overVariety =
    prefs.selectedBankFoodIds.length > (prefs.maxWeeklyFoodVariety || bankQuotaHint);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={program ? 'Modifier le programme' : 'Créer un programme nutritionnel'} size="xl">
      <div className="p-6">
        <div className="max-h-[min(72vh,640px)] overflow-y-auto space-y-6 pr-2">
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            {WIZARD_LABELS.map((label, i) => (
              <span
                key={label}
                className={`rounded-full px-2 py-0.5 border ${
                  wizardStep === i + 1
                    ? 'border-sky-500 text-sky-200 bg-sky-950/50'
                    : 'border-slate-700 text-slate-500'
                }`}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
          {errors.wizard && <p className="text-amber-400 text-xs">{errors.wizard}</p>}

          {wizardStep === 1 && (
            <div className="space-y-4 rounded-xl border border-slate-700 bg-slate-900/40 p-4">
              <h3 className={`${typography.presets.h4} text-white flex items-center gap-2`}>
                <Sparkles className="h-5 w-5 text-amber-300" />
                Type de programme
              </h3>
              <p className="text-slate-400 text-sm">
                Manuel : tu gardes la main sur tout. Assisté : la structure 3 repas + collations et les aliments choisis
                orientent un plan type ; les données impédancemètre sont obligatoires et saisissables ici.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      creationMode: 'manual'
                    }))
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    formData.creationMode === 'manual'
                      ? 'border-emerald-500 bg-emerald-950/40 text-white'
                      : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">Manuel</div>
                  <p className="text-[12px] opacity-90">
                    Macros et banque sans blocage impédance. Idéal si tu préfères tout ajuster toi-même.
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      creationMode: 'generated'
                    }))
                  }
                  className={`rounded-xl border p-4 text-left transition ${
                    formData.creationMode === 'generated'
                      ? 'border-sky-500 bg-sky-950/40 text-white'
                      : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <div className="text-lg font-semibold mb-1">Assisté (généré)</div>
                  <p className="text-[12px] opacity-90">
                    Étapes guidées, composition de journée type, impédance reliée à une vraie mesure (import ou saisie rapide).
                  </p>
                </button>
              </div>
            </div>
          )}

          {wizardStep === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-300 font-medium mb-2">Nom du programme *</label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Masse sèche hiver"
                className="bg-slate-800 border-slate-600 text-white"
              />
              {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Contexte, période, contraintes…"
                rows={2}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">Objectif *</label>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                {goals.map((goal) => (
                  <button
                    key={goal.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, goal: goal.value })}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      formData.goal === goal.value
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <div className="text-xl mb-1">{goal.icon}</div>
                    <div className="text-sm font-medium">{goal.label}</div>
                    <div className="text-[11px] opacity-80 mt-0.5">{goal.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-700 pt-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Durée (jours)</label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 30 })}
                  min={1}
                  max={365}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {expectedEndDate && !formData.endDate && (
                  <p className="text-[11px] text-teal-300 mt-1">
                    Fin prévue automatique : <span className="text-white font-medium">{expectedEndDate}</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Début</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Fin (optionnel)</label>
                <Input
                  type="date"
                  value={formData.endDate || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {!formData.endDate && expectedEndDate && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Si vide, la date de fin sera enregistrée automatiquement ({expectedEndDate}).
                  </p>
                )}
              </div>
            </div>
          </div>
          )}

          {wizardStep === 3 && (
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <h3 className={`${typography.presets.h4} text-white flex items-center gap-2`}>
              <Activity size={18} className="text-emerald-400" />
              Profil & impédancemètre
            </h3>
            <p className="text-slate-400 text-xs">
              {formData.creationMode === 'generated' ? (
                <>
                  <strong className="text-amber-200">Obligatoire pour ce mode :</strong> une mesure reliée (import ou
                  saisie rapide), puis taille, âge et poids pour estimer et générer le plan.
                </>
              ) : (
                <>
                  Optionnel mais utile : taille, âge, poids — pour estimer le métabolisme. Tu peux tout saisir sans
                  passer par l’impédancemètre.
                </>
              )}
            </p>

            {formData.creationMode === 'generated' && (
              <div className="space-y-3">
                <ImpedanceQuickCapture addProgressEntry={addProgressEntry} onSuccess={fillProfileFromQuickImpedance} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="text-xs" onClick={openProgressImpedance}>
                    Ouvrir Suivi corporel → Impédance (saisie complète)
                  </Button>
                </div>
              </div>
            )}

            {(pp.heightCm === '' ||
              pp.heightCm == null ||
              pp.age === '' ||
              pp.age == null ||
              pp.baselineWeightKg === '' ||
              pp.baselineWeightKg == null) && (
              <div className="rounded-lg border border-amber-600/45 bg-amber-950/35 px-3 py-2 text-xs text-amber-100">
                <p className="mb-2">
                  Données incomplètes pour estimer le métabolisme ou relier nutrition et suivi corporel. Enregistre une
                  mesure (poids, taille cm, âge réel) dans <strong>Suivi corporel</strong> ou utilise la saisie rapide
                  {formData.creationMode === 'generated' ? ' ci-dessus' : ''}.
                </p>
                <Button type="button" variant="secondary" className="text-xs" onClick={openProgressImpedance}>
                  Ouvrir Suivi corporel → Impédance
                </Button>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                className="text-sm"
                onClick={applyImpedanceSnapshot}
                disabled={!progressEntries?.length}
              >
                Importer dernière impédancemètre
              </Button>
              <Button type="button" className="text-sm bg-emerald-600 hover:bg-emerald-700" onClick={runEstimate}>
                Calculer calories & macros
              </Button>
            </div>
            {errors.impedance && <p className="text-amber-400 text-xs">{errors.impedance}</p>}
            {errors.estimate && <p className="text-red-400 text-xs">{errors.estimate}</p>}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Taille (cm)</label>
                <Input
                  type="number"
                  value={pp.heightCm}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, planProfile: { ...f.planProfile, heightCm: e.target.value } }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  min="120"
                  max="230"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Âge</label>
                <Input
                  type="number"
                  value={pp.age}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, planProfile: { ...f.planProfile, age: e.target.value } }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  min="14"
                  max="100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Sexe</label>
                <select
                  value={pp.sex}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, planProfile: { ...f.planProfile, sex: e.target.value } }))
                  }
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                >
                  <option value="male">Homme</option>
                  <option value="female">Femme</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Poids de référence (kg)</label>
                <Input
                  type="number"
                  value={pp.baselineWeightKg}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      planProfile: { ...f.planProfile, baselineWeightKg: e.target.value }
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Objectif poids (kg)</label>
                <Input
                  type="number"
                  value={pp.targetWeightKg}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      planProfile: { ...f.planProfile, targetWeightKg: e.target.value }
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder="Ex: 78"
                />
                {pp.targetWeightKg !== '' && (
                  <p className="text-[11px] text-teal-300 mt-1">
                    Objectif : <span className="font-semibold text-white">{pp.targetWeightKg} kg</span>
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-400">% masse grasse</label>
                <Input
                  type="number"
                  step="0.1"
                  value={pp.bodyFatPercent}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      planProfile: { ...f.planProfile, bodyFatPercent: e.target.value }
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Δ poids souhaité (kg / semaine)</label>
                <Input
                  type="number"
                  step="0.1"
                  value={pp.targetWeightDeltaKg}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      planProfile: { ...f.planProfile, targetWeightDeltaKg: e.target.value }
                    }))
                  }
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                  placeholder="-0.3 ou 0.2"
                />
              </div>
            </div>

            {(pp.estimatedBmr != null || pp.estimateNote) && (
              <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-3 text-xs text-slate-300">
                {pp.estimatedBmr != null && (
                  <div>
                    Dernière estimation : BMR ~{pp.estimatedBmr} kcal · TDEE ~{pp.estimatedTdee} kcal
                  </div>
                )}
                {pp.impedanceSourceDate && (
                  <div className="text-slate-500 mt-1">Mesure impédance (date) : {pp.impedanceSourceDate}</div>
                )}
                {pp.estimateNote && <p className="text-slate-400 mt-2">{pp.estimateNote}</p>}
              </div>
            )}
          </div>
          )}

          {wizardStep === 4 && (
          <>
          <div className="space-y-3 border-t border-slate-700 pt-4">
            <h3 className={`${typography.presets.h4} text-white`}>Collations</h3>
            <p className="text-slate-400 text-xs">Le plan généré utilise 3 repas + le nombre de collations choisi.</p>
            <div className="flex flex-wrap gap-3">
              {[
                { n: 1, label: '1 collation' },
                { n: 2, label: '2 collations' }
              ].map(({ n, label }) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    setFormData((f) => ({
                      ...f,
                      mealPlanPreferences: { ...f.mealPlanPreferences, snacksPerDay: n }
                    }))
                  }
                  className={`rounded-lg border px-4 py-2 text-sm ${
                    (prefs.snacksPerDay ?? 2) === n
                      ? 'border-sky-500 bg-sky-950/50 text-white'
                      : 'border-slate-600 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-700 pt-4">
            <h3 className={`${typography.presets.h4} text-white`}>Objectifs nutritionnels</h3>
            {suggestedTargets && (
              <div className="rounded-lg border border-emerald-700/50 bg-emerald-950/25 p-3 text-xs text-emerald-100">
                <div>
                  Suggestion personnalisée (profil + objectif) : {suggestedTargets.targetCalories} kcal · P {suggestedTargets.targetProtein} g · G {suggestedTargets.targetCarbs} g · L {suggestedTargets.targetFat} g
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" className="text-xs" onClick={applySuggestedTargets}>
                    Appliquer la suggestion
                  </Button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 font-medium mb-2">Calories (kcal/jour) *</label>
                <Input
                  type="number"
                  value={formData.targetCalories}
                  onChange={(e) => setFormData({ ...formData, targetCalories: parseFloat(e.target.value) || 0 })}
                  min="1000"
                  max="10000"
                  step="50"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {errors.targetCalories && <p className="text-red-400 text-sm mt-1">{errors.targetCalories}</p>}
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Protéines (g/jour) *</label>
                <Input
                  type="number"
                  value={formData.targetProtein}
                  onChange={(e) => setFormData({ ...formData, targetProtein: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-slate-400 text-xs mt-1">{percentages.protein}% des calories cibles</p>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Glucides (g/jour) *</label>
                <Input
                  type="number"
                  value={formData.targetCarbs}
                  onChange={(e) => setFormData({ ...formData, targetCarbs: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-slate-400 text-xs mt-1">{percentages.carbs}% des calories cibles</p>
              </div>
              <div>
                <label className="block text-slate-300 font-medium mb-2">Lipides (g/jour) *</label>
                <Input
                  type="number"
                  value={formData.targetFat}
                  onChange={(e) => setFormData({ ...formData, targetFat: parseFloat(e.target.value) || 0 })}
                  className="bg-slate-800 border-slate-600 text-white"
                />
                <p className="text-slate-400 text-xs mt-1">{percentages.fat}% des calories cibles</p>
              </div>
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="text-slate-300 text-sm mb-2">Répartition estimée des macros (sur calories cibles)</div>
              <div className="flex items-center gap-2">
                {[
                  ['Protéines', percentages.protein, 'bg-blue-500'],
                  ['Glucides', percentages.carbs, 'bg-green-500'],
                  ['Lipides', percentages.fat, 'bg-orange-500'],
                  ['Reste', percentages.remaining, 'bg-slate-500']
                ].map(([label, pct, klass]) => (
                  <div key={label} className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300">{label}</span>
                      <span className="text-white">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div className={`${klass} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-700 pt-4">
              <h3 className={`${typography.presets.h4} text-white`}>Plan jour type (génération)</h3>
              <p className="text-slate-400 text-xs">
                Indicatif à partir des calories, macros et de ta sélection (♥ / ○ / coches programme).{' '}
                {formData.creationMode === 'generated'
                  ? 'Requis avant enregistrement pour un programme assisté.'
                  : 'Optionnel en mode manuel (pratique comme modèle).'}
                Régénère après avoir ajusté banque ou macros.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" className="text-sm bg-indigo-600 hover:bg-indigo-700" onClick={composeDayPlan}>
                  Générer / régénérer le plan jour
                </Button>
              </div>
              {errors.generatedMealPlan && <p className="text-amber-400 text-xs">{errors.generatedMealPlan}</p>}
              {Array.isArray(prefs.generatedMealPlan) && prefs.generatedMealPlan.length > 0 && (
                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 space-y-3 text-xs max-h-52 overflow-y-auto">
                  {prefs.generatedMealPlan.map((slot) => (
                    <div key={slot.slot}>
                      <div className="font-semibold text-sky-200">{slot.label}</div>
                      <ul className="mt-1 space-y-1 text-slate-300 list-disc list-inside">
                        {slot.foods.map((it) => (
                          <li key={`${slot.slot}-${it.foodId}`}>
                            {it.name}
                            {it.approximateGrams ? ` — ~${it.approximateGrams} g` : ''}
                            {it.kcalRounded != null ? ` (~${it.kcalRounded} kcal)` : ''}
                            {it.notes ? ` (${it.notes})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

          <div className="space-y-3 border-t border-slate-700 pt-4">
            <h3 className={`${typography.presets.h4} text-white`}>Banque aliments — préférences & rotation</h3>
            <p className="text-slate-400 text-xs">
              Classe les ingrédients de la banque Nutrition : aimés / refus / neutre (ouvert). Coche ceux qui entrent dans
              la rotation du programme. Quota conseillé ~{bankQuotaHint} (selon objectif et calories) — ajuste la variété
              max ci-dessous.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Variété max (semaine)</label>
                <Input
                  type="number"
                  value={prefs.maxWeeklyFoodVariety}
                  onChange={(e) =>
                    setFormData((f) => ({
                      ...f,
                      mealPlanPreferences: {
                        ...f.mealPlanPreferences,
                        maxWeeklyFoodVariety: parseInt(e.target.value, 10) || 5
                      }
                    }))
                  }
                  min={5}
                  max={100}
                  className="bg-slate-800 border-slate-600 text-white mt-1"
                />
                {errors.maxWeeklyFoodVariety && (
                  <p className="text-red-400 text-xs mt-1">{errors.maxWeeklyFoodVariety}</p>
                )}
              </div>
              <div className="md:col-span-2 text-sm text-slate-300 pt-6">
                Sélection programme :{' '}
                <span className="text-white font-semibold">{prefs.selectedBankFoodIds.length}</span> / quota indicatif{' '}
                ~{prefs.maxWeeklyFoodVariety ?? bankQuotaHint}
                {overVariety ? (
                  <span className="text-amber-400 ml-2">(supérieur à la variété max — toléré si tu veux plus d’options)</span>
                ) : null}
              </div>
            </div>

            <Input
              type="search"
              value={foodSearch}
              onChange={(e) => setFoodSearch(e.target.value)}
              placeholder="Filtrer la banque (ex : riz, yaourt…)…"
              className="bg-slate-800 border-slate-600 text-white"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <select
                value={foodCategoryFilter}
                onChange={(e) => setFoodCategoryFilter(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
              >
                <option value="">Toutes catégories</option>
                {[...new Set(userFoodBank.map((x) => x.category))]
                  .sort((a, b) => a.localeCompare(b, 'fr'))
                  .map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
              </select>
              <select
                value={foodMacroSort}
                onChange={(e) => setFoodMacroSort(e.target.value)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
              >
                <option value="none">Tri macro (aucun)</option>
                <option value="protein">Plus de protéines</option>
                <option value="carbs">Plus de glucides</option>
                <option value="fat">Plus de lipides</option>
                <option value="kcal">Plus de calories</option>
              </select>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-700 p-2">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                {filteredFoods.map((f) => (
                  <div key={f.id} className="rounded-lg border border-slate-700 bg-slate-900/60 p-2">
                    <div className="text-[12px] font-semibold text-white line-clamp-2">{f.name}</div>
                    <div className="text-[10px] text-slate-500">{f.category}</div>
                    <div className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                      {f.per100.kcal} kcal · Protéines {f.per100.protein} g · Glucides {f.per100.carbs} g · Lipides {f.per100.fat} g
                    </div>
                    {f.description ? (
                      <div className="mt-1 text-[10px] text-slate-400 line-clamp-2">{f.description}</div>
                    ) : null}
                    <div className="flex flex-wrap gap-1 mt-2">
                      <MiniBtn active={prefs.lovedFoodIds.includes(f.id)} onClick={() => setFoodPreference(f.id, 'loved')} label="♥" title="J’aime" />
                      <MiniBtn active={prefs.avoidedFoodIds.includes(f.id)} onClick={() => setFoodPreference(f.id, 'avoided')} label="✕" title="Éviter" />
                      <MiniBtn active={prefs.openFoodIds.includes(f.id)} onClick={() => setFoodPreference(f.id, 'open')} label="○" title="Ouvert / neutre" />
                    </div>
                    <label className="mt-2 flex items-center gap-1 text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={prefs.selectedBankFoodIds.includes(f.id)}
                        disabled={prefs.avoidedFoodIds.includes(f.id)}
                        onChange={() => toggleProgramFood(f.id)}
                        className="rounded border-slate-500"
                      />
                      Programme
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {prefs.selectedBankFoodIds.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prefs.selectedBankFoodIds.map((id) => {
                  const ff = findBankFoodByIdWithOverrides(id, data?.nutritionFoodOverrides);
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-900/40 border border-emerald-700/40 px-2 py-0.5 text-[11px] text-emerald-100"
                    >
                      {ff?.name || id}
                      <button type="button" className="text-emerald-300 hover:text-white" onClick={() => toggleProgramFood(id)}>
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-700 pt-4">
            <h3 className={`${typography.presets.h4} text-white flex items-center gap-2`}>
              <Dumbbell size={18} className="text-violet-400" />
              Exercices suivis avec ce programme
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-2 items-end">
              <div>
                <label className="text-xs text-slate-400">Programme sport source</label>
                <select
                  value={prefs.selectedSportProgramId || ''}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    const nextProgram = (trainingPrograms || []).find((p) => String(p?.id) === String(nextId)) || null;
                    setFormData((f) => ({
                      ...f,
                      mealPlanPreferences: {
                        ...f.mealPlanPreferences,
                        selectedSportProgramId: nextId
                      }
                    }));
                    if (nextProgram) loadExercisesFromSportProgram(nextProgram);
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-800 px-2 py-2 text-sm text-white"
                >
                  {activeTrainingProgram?.id && (
                    <option value={String(activeTrainingProgram.id)}>
                      Actuel : {activeTrainingProgram.name}
                    </option>
                  )}
                  {sportProgramOptions
                    .filter((o) => String(o.id) !== String(activeTrainingProgram?.id || ''))
                    .map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  {!sportProgramOptions.length && <option value="">Aucun programme sport détecté</option>}
                </select>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="text-xs h-[38px]"
                onClick={() => loadExercisesFromSportProgram(selectedSportProgram)}
              >
                Recharger les exos du programme
              </Button>
            </div>
            {selectedSportProgram?.name && (
              <p className="text-[11px] text-slate-400">
                Source active : <span className="text-slate-200">{selectedSportProgram.name}</span>
              </p>
            )}
            <Input
              type="search"
              value={exerciseSearch}
              onChange={(e) => setExerciseSearch(e.target.value)}
              placeholder="Rechercher un exercice (nom ou catégorie)…"
              className="bg-slate-800 border-slate-600 text-white"
            />
            <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 p-2 space-y-1">
              {filteredExercises.map((ex) => (
                <label
                  key={ex.key}
                  className="flex items-center gap-2 text-xs text-slate-300 hover:bg-slate-800/60 rounded px-2 py-1 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={prefs.selectedExerciseKeys.includes(ex.key)}
                    onChange={() => toggleExercise(ex.key)}
                    className="rounded border-slate-500"
                  />
                  <span className="text-white">{ex.name}</span>
                  <span className="text-slate-500">{ex.category}</span>
                </label>
              ))}
            </div>
            <p className="text-slate-500 text-[11px]">{prefs.selectedExerciseKeys.length} exercice(s) cochés</p>
          </div>

          <div className="space-y-4 border-t border-slate-700 pt-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="adjustForWorkout"
                checked={formData.adjustForWorkout}
                onChange={(e) => setFormData({ ...formData, adjustForWorkout: e.target.checked })}
                className="w-4 h-4 text-blue-600 bg-slate-800 border-slate-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="adjustForWorkout" className="text-slate-300 font-medium">
                Ajuster les calories (jours entraînement / repos)
              </label>
            </div>

            {formData.adjustForWorkout && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
                <div>
                  <label className="block text-slate-300 font-medium mb-2">Calories jour entraînement</label>
                  <Input
                    type="number"
                    value={formData.workoutDayCalories}
                    onChange={(e) => setFormData({ ...formData, workoutDayCalories: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  {errors.workoutDayCalories && (
                    <p className="text-red-400 text-sm mt-1">{errors.workoutDayCalories}</p>
                  )}
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-2">Calories jour repos</label>
                  <Input
                    type="number"
                    value={formData.restDayCalories}
                    onChange={(e) => setFormData({ ...formData, restDayCalories: parseFloat(e.target.value) || 0 })}
                    className="bg-slate-800 border-slate-600 text-white"
                  />
                  {errors.restDayCalories && <p className="text-red-400 text-sm mt-1">{errors.restDayCalories}</p>}
                </div>
              </div>
            )}
          </div>
          </>
          )}

          {errors.submit && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{errors.submit}</div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 mt-4 border-t border-slate-700 sticky bottom-0 bg-slate-800/95">
          <div className="flex gap-2">
            {wizardStep > 1 && (
              <Button type="button" variant="secondary" onClick={goWizardPrev} className="text-slate-200">
                <ChevronLeft size={16} className="mr-1" />
                Étape précédente
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} className="text-slate-300 hover:text-white">
              Annuler
            </Button>
            {wizardStep < TOTAL_STEPS ? (
              <Button type="button" onClick={goWizardNext} className="bg-slate-600 hover:bg-slate-500 text-white">
                Suivant
                <ChevronRight size={16} className="ml-1" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                <Save size={18} className="mr-2" />
                {loading ? 'Sauvegarde…' : program ? 'Modifier' : 'Créer'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

function MiniBtn({ label, active, onClick, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`min-w-[1.75rem] rounded px-1.5 py-0.5 border text-[11px] ${
        active ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );
}

export default NutritionProgramForm;
