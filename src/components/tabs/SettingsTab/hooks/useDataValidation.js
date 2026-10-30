/**
 * Hook useDataValidation - Validation des données d'import
 * 
 * ✅ PHASE 4 : Extraction de la logique de validation des données d'import
 * 
 * Valide les données importées pour Body Tracking et toutes les données d'entraînement
 * 
 * @module components/tabs/SettingsTab/hooks/useDataValidation
 */

import { useCallback } from 'react';
import { validateBodyTrackingData } from '../../../BodyTracking/utils/exportImport';
import { buildSportExportMetadata, extractSportProgramContextFromImport } from '../utils/sportExportBundle';

function countGarminActivities(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const acts = payload.activities && typeof payload.activities === 'object' ? payload.activities : {};
  const swimming = Array.isArray(acts.swimming) ? acts.swimming.length : 0;
  const jumpRope = Array.isArray(acts.jumpRope) ? acts.jumpRope.length : 0;
  const cardio = Array.isArray(acts.cardio) ? acts.cardio.length : 0;
  const dailyMetrics = payload.dailyMetrics && typeof payload.dailyMetrics === 'object' ? payload.dailyMetrics : {};
  return {
    totalActivities: swimming + jumpRope + cardio,
    dailyMetricsDays: Object.keys(dailyMetrics).length,
    activityTypes: {}
  };
}

/**
 * Hook pour valider les données d'import
 * 
 * @returns {Object} { validateAllWorkoutData, validateImportData }
 */
export const useDataValidation = () => {
  /**
   * Valide les données d'import COMPLET (toutes les données d'entraînement)
   * 
   * @param {Object} data - Données à valider
   * @returns {Object} { isValid, errors, warnings, stats, data }
   */
  const validateAllWorkoutData = useCallback((data) => {
    const errors = [];
    const warnings = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Format de données invalide');
      return { isValid: false, errors, warnings, stats: null };
    }
    
    // Support format export complet { data: {...}, metadata: {...}, sportExport: {...} }
    const workoutData = {
      checkedExercises: {},
      reps: {},
      checkedStretches: {},
      ...(data.data || data)
    };
    
    // Vérifier les champs obligatoires (mais permettre qu'ils soient vides pour compatibilité)
    const requiredFields = ['checkedExercises', 'reps', 'checkedStretches'];
    requiredFields.forEach(field => {
      if (field in workoutData && typeof workoutData[field] !== 'object') {
        errors.push(`${field} doit être un objet`);
      }
    });
    
    // Vérifier les types optionnels
    if (workoutData.progressPhotos !== undefined && !Array.isArray(workoutData.progressPhotos)) {
      errors.push('progressPhotos doit être un tableau');
    }
    
    if (workoutData.progressEntries !== undefined && !Array.isArray(workoutData.progressEntries)) {
      errors.push('progressEntries doit être un tableau');
    }
    
    if (workoutData.bodyTrackingReminders !== undefined && !Array.isArray(workoutData.bodyTrackingReminders)) {
      errors.push('bodyTrackingReminders doit être un tableau');
    }
    
    if (workoutData.historyReps !== undefined && typeof workoutData.historyReps !== 'object') {
      errors.push('historyReps doit être un objet');
    }
    
    if (workoutData.programHistory !== undefined && !Array.isArray(workoutData.programHistory)) {
      errors.push('programHistory doit être un tableau');
    }

    if (workoutData.programs !== undefined && !Array.isArray(workoutData.programs)) {
      errors.push('programs doit être un tableau');
    }

    if (workoutData.profileQuestionnaire !== undefined && typeof workoutData.profileQuestionnaire !== 'object') {
      errors.push('profileQuestionnaire doit être un objet');
    }
    
    if (workoutData.enduranceData !== undefined && typeof workoutData.enduranceData !== 'object') {
      errors.push('enduranceData doit être un objet');
    }
    
    if (workoutData.dailyVariations !== undefined && typeof workoutData.dailyVariations !== 'object') {
      errors.push('dailyVariations doit être un objet');
    }
    
    if (workoutData.sessionFeedbacks !== undefined && typeof workoutData.sessionFeedbacks !== 'object') {
      errors.push('sessionFeedbacks doit être un objet');
    }

    if (workoutData.dayJustifications !== undefined && typeof workoutData.dayJustifications !== 'object') {
      errors.push('dayJustifications doit être un objet');
    }

    if (workoutData.circuitDefinitions !== undefined && typeof workoutData.circuitDefinitions !== 'object') {
      errors.push('circuitDefinitions doit être un objet');
    }

    if (workoutData.circuitProgress !== undefined && typeof workoutData.circuitProgress !== 'object') {
      errors.push('circuitProgress doit être un objet');
    }

    if (workoutData.exerciseSessionPerceived !== undefined && typeof workoutData.exerciseSessionPerceived !== 'object') {
      errors.push('exerciseSessionPerceived doit être un objet');
    }

    if (workoutData.exerciseMaxRecords !== undefined && !Array.isArray(workoutData.exerciseMaxRecords)) {
      errors.push('exerciseMaxRecords doit être un tableau');
    }

    if (workoutData.exerciseMaxHistory !== undefined && !Array.isArray(workoutData.exerciseMaxHistory)) {
      errors.push('exerciseMaxHistory doit être un tableau');
    }

    if (data.sportExport !== undefined && typeof data.sportExport !== 'object') {
      errors.push('sportExport doit être un objet');
    }

    if (workoutData.garminData !== undefined && typeof workoutData.garminData !== 'object') {
      errors.push('garminData doit être un objet');
    }
    if (workoutData.exerciseWeights !== undefined && typeof workoutData.exerciseWeights !== 'object') {
      errors.push('exerciseWeights doit être un objet');
    }
    if (workoutData.exerciseWeightPerArm !== undefined && typeof workoutData.exerciseWeightPerArm !== 'object') {
      errors.push('exerciseWeightPerArm doit être un objet');
    }
    if (workoutData.exerciseSetWeights !== undefined && typeof workoutData.exerciseSetWeights !== 'object') {
      errors.push('exerciseSetWeights doit être un objet');
    }
    
    if (workoutData.weekVariant !== undefined && typeof workoutData.weekVariant !== 'string') {
      errors.push('weekVariant doit être une chaîne de caractères');
    }
    
    // Format v2.0 Sport Complete
    if (data.version && String(data.version).startsWith('2') && data.exportType === 'Sport Complete') {
      // Pas d'exigence supplémentaire — sportExport.dailyJournal est informatif
    }
    // Warnings pour données manquantes (pas bloquant)
    if (!workoutData.checkedExercises || Object.keys(workoutData.checkedExercises || {}).length === 0) {
      warnings.push('Aucun exercice trouvé dans les données');
    }
    
    if (!workoutData.reps || Object.keys(workoutData.reps || {}).length === 0) {
      warnings.push('Aucune répétition trouvée dans les données');
    }
    
    if (!workoutData.enduranceData || !workoutData.enduranceData.sessions) {
      warnings.push('Aucune donnée d\'endurance trouvée');
    }

    const meta = data.metadata && typeof data.metadata === 'object' ? data.metadata : null;
    const sportMeta = typeof meta?.totalExercises === 'number' ? meta : null;
    let enriched = null;
    if (!sportMeta) {
      const programCtx = extractSportProgramContextFromImport(workoutData) || {};
      enriched = buildSportExportMetadata(
        workoutData,
        programCtx,
        { profileQuestionnaire: workoutData.profileQuestionnaire }
      );
    }

    const journalFromExport = data.sportExport?.dailyJournal;
    const journalDays = sportMeta?.dailyJournal?.days
      ?? (journalFromExport ? Object.keys(journalFromExport).length : enriched?.dailyJournal?.days ?? 0);
    const journalExerciseEntries = sportMeta?.dailyJournal?.exerciseEntries
      ?? (journalFromExport
        ? Object.values(journalFromExport).reduce((n, d) => n + (d.exercises?.length || 0), 0)
        : enriched?.dailyJournal?.exerciseEntries ?? 0);
    const journalStretchEntries = sportMeta?.dailyJournal?.stretchEntries
      ?? (journalFromExport
        ? Object.values(journalFromExport).reduce((n, d) => n + (d.stretches?.length || 0), 0)
        : enriched?.dailyJournal?.stretchEntries ?? 0);

    const liftFromMeta = sportMeta?.liftVolume;
    const liftFromExport = data.sportExport?.dailyLiftVolume;
    const liftVolumeTotalKg = liftFromMeta?.totalKg
      ?? (liftFromExport
        ? liftFromExport.reduce((s, d) => s + (d.totalKg || 0), 0)
        : enriched?.liftVolume?.totalKg ?? 0);
    const liftVolumeDays = liftFromMeta?.daysWithVolume
      ?? liftFromExport?.length
      ?? enriched?.liftVolume?.daysWithVolume
      ?? 0;

    const garminPayload = workoutData.garminData || null;
    const garminMeta = meta?.garminSummary || (garminPayload ? countGarminActivities(garminPayload) : null);
    
    const stats = {
      exercises: sportMeta?.totalExercises ?? enriched?.totalExercises ?? 0,
      reps: sportMeta?.totalReps ?? enriched?.totalReps ?? 0,
      repsWithValue: sportMeta?.repsWithValue ?? enriched?.repsWithValue ?? 0,
      stretches: sportMeta?.totalStretches ?? enriched?.totalStretches ?? 0,
      photos: (workoutData.progressPhotos || []).length,
      progressEntries: (workoutData.progressEntries || []).length,
      reminders: (workoutData.bodyTrackingReminders || []).length,
      historyReps: sportMeta?.historyReps ?? enriched?.historyReps ?? 0,
      programHistory: sportMeta?.programHistory ?? enriched?.programHistory ?? 0,
      programs: sportMeta?.programs ?? enriched?.programs ?? 0,
      activeProgramName: sportMeta?.activeProgram ?? enriched?.activeProgram ?? null,
      profileQuestionnaire: (sportMeta?.profileQuestionnairePresent ?? enriched?.profileQuestionnairePresent) ? 1 : 0,
      exerciseSessionPerceived: sportMeta?.exerciseSessionPerceived ?? enriched?.exerciseSessionPerceived ?? 0,
      circuitDefinitions: sportMeta?.circuitDefinitions ?? enriched?.circuitDefinitions ?? 0,
      circuitProgressDays: sportMeta?.circuitProgressDays ?? enriched?.circuitProgressDays ?? 0,
      dailyJournalDays: journalDays,
      dailyJournalExerciseEntries: journalExerciseEntries,
      dailyJournalStretchEntries: journalStretchEntries,
      enduranceSessions: Object.values(workoutData.enduranceData?.sessions || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      ),
      dailyVariations: sportMeta?.dailyVariations ?? enriched?.dailyVariations ?? 0,
      sessionFeedbacks: sportMeta?.sessionFeedbacks ?? enriched?.sessionFeedbacks ?? 0,
      dayJustifications: sportMeta?.dayJustifications ?? enriched?.dayJustifications ?? 0,
      exerciseWeightKeys: sportMeta?.loadTracking?.exerciseWeightKeys ?? enriched?.loadTracking?.exerciseWeightKeys ?? 0,
      exercisePerArmKeys: sportMeta?.loadTracking?.exercisePerArmKeys ?? enriched?.loadTracking?.exercisePerArmKeys ?? 0,
      exerciseSetWeightKeys: sportMeta?.loadTracking?.exerciseSetWeightKeys ?? enriched?.loadTracking?.exerciseSetWeightKeys ?? 0,
      exerciseMaxRecords: sportMeta?.exerciseMaxRecords ?? enriched?.exerciseMaxRecords ?? 0,
      liftVolumeTotalKg: Math.round(liftVolumeTotalKg * 10) / 10,
      liftVolumeDays,
      garminPresent: Boolean(garminPayload),
      garminActivities: garminMeta?.totalActivities ?? 0,
      garminMetricsDays: garminMeta?.dailyMetricsDays ?? 0,
      garminActivityTypes: garminMeta?.activityTypes ?? {},
      nutritionPresent: Boolean(workoutData.nutritionData),
      nutritionMeals: workoutData.nutritionData?.metadata?.totalMeals
        ?? workoutData.nutritionData?.meals?.length
        ?? data.metadata?.nutritionSummary?.totalMeals
        ?? 0,
      exportVersion: data.version || null,
      exportType: data.exportType || null
    };
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats,
      data: workoutData
    };
  }, []);

  /**
   * Valide les données importées (Body Tracking uniquement - ancienne fonction)
   * 
   * @param {Object} data - Données à valider
   * @returns {Object} { isValid, errors, stats }
   */
  const validateImportData = useCallback((data) => {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Format de données invalide');
      return { isValid: false, errors };
    }

    // Vérifier la structure de base
    const requiredFields = ['checkedExercises', 'reps', 'checkedStretches'];
    requiredFields.forEach(field => {
      if (!(field in data) || typeof data[field] !== 'object') {
        errors.push(`Champ manquant ou invalide: ${field}`);
      }
    });

    // Vérifier les types
    if (data.progressPhotos && !Array.isArray(data.progressPhotos)) {
      errors.push('progressPhotos doit être un tableau');
    }

    // Validation des entrées de progression (nouveau)
    if (data.progressEntries && !Array.isArray(data.progressEntries)) {
      errors.push('progressEntries doit être un tableau');
    }

    // Validation des rappels de suivi corporel (nouveau)
    if (data.bodyTrackingReminders && !Array.isArray(data.bodyTrackingReminders)) {
      errors.push('bodyTrackingReminders doit être un tableau');
    }

    // Validation de l'historique des répétitions (nouveau)
    if (data.historyReps && typeof data.historyReps !== 'object') {
      errors.push('historyReps doit être un objet');
    }

    // Validation de l'historique des programmes (nouveau)
    if (data.programHistory && !Array.isArray(data.programHistory)) {
      errors.push('programHistory doit être un tableau');
    }

    if (data.weekVariant && typeof data.weekVariant !== 'string') {
      errors.push('weekVariant doit être une chaîne de caractères');
    }

    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        exercises: Object.keys(data.checkedExercises || {}).length,
        reps: Object.keys(data.reps || {}).length,
        stretches: Object.keys(data.checkedStretches || {}).length,
        photos: (data.progressPhotos || []).length,
        progressEntries: (data.progressEntries || []).length,
        reminders: (data.bodyTrackingReminders || []).length,
        historyReps: Object.keys(data.historyReps || {}).length,
        programHistory: (data.programHistory || []).length
      }
    };
  }, []);

  return {
    validateAllWorkoutData,
    validateImportData,
    validateBodyTrackingData, // Importé depuis exportImport
  };
};

export default useDataValidation;
