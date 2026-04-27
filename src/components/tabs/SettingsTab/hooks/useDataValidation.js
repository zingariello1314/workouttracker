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
    
    // Support format export complet { data: {...}, metadata: {...} }
    const workoutData = data.data || data;
    
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
    
    if (workoutData.enduranceData !== undefined && typeof workoutData.enduranceData !== 'object') {
      errors.push('enduranceData doit être un objet');
    }
    
    if (workoutData.dailyVariations !== undefined && typeof workoutData.dailyVariations !== 'object') {
      errors.push('dailyVariations doit être un objet');
    }
    
    if (workoutData.sessionFeedbacks !== undefined && typeof workoutData.sessionFeedbacks !== 'object') {
      errors.push('sessionFeedbacks doit être un objet');
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
    
    const stats = {
      exercises: Object.keys(workoutData.checkedExercises || {}).length,
      reps: Object.keys(workoutData.reps || {}).length,
      stretches: Object.keys(workoutData.checkedStretches || {}).length,
      photos: (workoutData.progressPhotos || []).length,
      progressEntries: (workoutData.progressEntries || []).length,
      reminders: (workoutData.bodyTrackingReminders || []).length,
      historyReps: Object.keys(workoutData.historyReps || {}).length,
      programHistory: (workoutData.programHistory || []).length,
      enduranceSessions: Object.values(workoutData.enduranceData?.sessions || {}).reduce(
        (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0
      ),
      dailyVariations: Object.keys(workoutData.dailyVariations || {}).length,
      sessionFeedbacks: Object.keys(workoutData.sessionFeedbacks || {}).length,
      exerciseWeightKeys: Object.keys(workoutData.exerciseWeights || {}).length,
      exercisePerArmKeys: Object.keys(workoutData.exerciseWeightPerArm || {}).filter(
        (k) => workoutData.exerciseWeightPerArm[k] === true
      ).length,
      exerciseSetWeightKeys: Object.keys(workoutData.exerciseSetWeights || {}).length
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
