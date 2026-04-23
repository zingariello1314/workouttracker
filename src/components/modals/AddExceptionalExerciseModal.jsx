/**
 * 🏋️ MODAL ADD EXCEPTIONAL EXERCISE
 * 
 * Modal pour ajouter un exercice exceptionnel avec validation stricte,
 * détection de patterns intelligente et suggestions contextuelles.
 * 
 * @module AddExceptionalExerciseModal
 */

import React, { useState, useCallback, useMemo } from 'react';
import { AlertCircle, Info, CheckCircle, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { Input, TextArea, Select } from '../ui/Input';
import { useToast } from '../ui/Toast';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';

/**
 * Validation complète et intelligente d'un exercice exceptionnel
 * @param {object} exercise - Données de l'exercice à valider
 * @param {Function} t - Fonction de traduction
 * @returns {object} { isValid, errors, warnings, suggestions }
 */
const validateExceptionalExercise = (exercise, t) => {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  // ✅ Validation nom (2-100 chars)
  if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim().length === 0) {
    errors.push(t('exercises.exceptional.validation.nameRequired'));
  } else if (exercise.name.trim().length < 2) {
    errors.push(t('exercises.exceptional.validation.nameMinLength'));
  } else if (exercise.name.trim().length > 100) {
    warnings.push(t('exercises.exceptional.validation.nameMaxLength'));
  }

  // ✅ Validation type (reps ou duration)
  if (!exercise.type || !['reps', 'duration'].includes(exercise.type)) {
    errors.push(t('exercises.exceptional.validation.typeRequired'));
  }

  // ✅ Validation selon le type
  if (exercise.type === 'reps') {
    // Validation séries (1-50)
    if (!exercise.series || typeof exercise.series !== 'number' || exercise.series < 1) {
      errors.push(t('exercises.exceptional.validation.seriesRequired'));
    } else if (exercise.series > 50) {
      warnings.push(t('exercises.exceptional.validation.seriesTooHigh'));
    } else if (exercise.series > 20) {
      warnings.push(t('exercises.exceptional.validation.seriesHigh'));
    } else if (exercise.series < 2) {
      warnings.push(t('exercises.exceptional.validation.seriesLow'));
    }

    // Validation repsPerSeries
    if (!exercise.repsPerSeries || !Array.isArray(exercise.repsPerSeries) || exercise.repsPerSeries.length === 0) {
      errors.push(t('exercises.exceptional.validation.repsRequired'));
    } else {
      // ✅ Validation cohérence séries vs repsPerSeries
      if (exercise.repsPerSeries.length !== exercise.series) {
        errors.push(t('exercises.exceptional.validation.repsMismatch', 'Le nombre de séries ({{series}}) ne correspond pas au nombre de valeurs de répétitions ({{repsCount}})', { 
          series: exercise.series, 
          repsCount: exercise.repsPerSeries.length 
        }));
      }

      // ✅ Validation valeurs de répétitions
      const invalidReps = exercise.repsPerSeries.filter(r => typeof r !== 'number' || r <= 0 || r > 1000);
      if (invalidReps.length > 0) {
        errors.push(t('exercises.exceptional.validation.repsInvalid'));
      }

      // ✅ Détection patterns intelligente
      if (exercise.repsPerSeries.length > 1) {
        // Pattern : toutes identiques
        const allSame = exercise.repsPerSeries.every(r => r === exercise.repsPerSeries[0]);
        if (allSame) {
          suggestions.push(t('exercises.exceptional.suggestions.allSameReps', 'Toutes les séries ont le même nombre de reps ({{reps}}) - vous pouvez simplifier', { 
            reps: exercise.repsPerSeries[0] 
          }));
        }

        // Pattern : progression arithmétique
        const differences = [];
        for (let i = 1; i < exercise.repsPerSeries.length; i++) {
          differences.push(exercise.repsPerSeries[i] - exercise.repsPerSeries[i - 1]);
        }
        const allSameDiff = differences.every(d => d === differences[0]);
        if (allSameDiff && differences[0] !== 0) {
          const diff = differences[0];
          suggestions.push(t('exercises.exceptional.suggestions.progressionDetected', 'Progression détectée : {{diff}} reps par série', { 
            diff: diff > 0 ? `+${diff}` : String(diff) 
          }));
        }

        // Pattern : valeurs extrêmes
        const minReps = Math.min(...exercise.repsPerSeries);
        const maxReps = Math.max(...exercise.repsPerSeries);
        if (minReps < 5) {
          warnings.push(t('exercises.exceptional.validation.repsLow'));
        }
        if (maxReps > 100) {
          warnings.push(t('exercises.exceptional.validation.repsHigh'));
        }
      }
    }
  } else if (exercise.type === 'duration') {
    // Validation durée (> 0, < 7200s = 2h)
    if (!exercise.duration || typeof exercise.duration !== 'number' || exercise.duration <= 0) {
      errors.push(t('exercises.exceptional.validation.durationRequired'));
    } else if (exercise.duration > 7200) {
      warnings.push(t('exercises.exceptional.validation.durationTooLong'));
    } else if (exercise.duration < 10) {
      warnings.push(t('exercises.exceptional.validation.durationTooShort'));
    } else if (exercise.duration >= 60) {
      // ✅ Suggestion conversion secondes/minutes
      const minutes = Math.floor(exercise.duration / 60);
      const seconds = exercise.duration % 60;
      if (seconds === 0) {
        suggestions.push(t('exercises.exceptional.suggestions.durationMinutes', 'Durée : {{minutes}}min (vérifiez si c\'est bien en secondes)', { 
          minutes 
        }));
      } else {
        suggestions.push(t('exercises.exceptional.suggestions.durationMinutes', 'Durée : {{minutes}}min {{seconds}}s (vérifiez si c\'est bien en secondes)', { 
          minutes, 
          seconds 
        }));
      }
    }
  }

  // ✅ Validation matériel (optionnel mais recommandé)
  // Note: Cette suggestion n'est pas critique, on peut la garder en français pour l'instant
  // ou l'ajouter aux fichiers de traduction si nécessaire

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

const AddExceptionalExerciseModal = ({ isOpen, onClose, targetDate = null }) => {
  const { addExceptionalExercise } = useWorkout();
  const { showSuccess, showError } = useToast();
  const t = useTranslation();

  // ✅ État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    type: 'reps',
    series: 3,
    repsPerSeries: [10, 10, 10],
    duration: 60,
    materiel: '',
    notes: '',
    reason: ''
  });

  // ✅ État de validation en temps réel
  const [validation, setValidation] = useState({
    isValid: false,
    errors: [],
    warnings: [],
    suggestions: []
  });

  // ✅ État des erreurs par champ (pour affichage individuel)
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ Validation en temps réel (mémorisée pour performance)
  const currentValidation = useMemo(() => {
    return validateExceptionalExercise(formData, t);
  }, [formData, t]);

  // ✅ Mettre à jour la validation à chaque changement
  React.useEffect(() => {
    setValidation(currentValidation);
    
    // ✅ Extraire erreurs par champ pour affichage individuel
    const errorsByField = {};
    currentValidation.errors.forEach(error => {
      if (error.includes('nom')) errorsByField.name = error;
      else if (error.includes('séries')) errorsByField.series = error;
      else if (error.includes('répétitions')) errorsByField.repsPerSeries = error;
      else if (error.includes('durée')) errorsByField.duration = error;
    });
    setFieldErrors(errorsByField);
  }, [currentValidation]);

  // ✅ Handlers pour les champs
  const handleNameChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, name: value }));
  }, []);

  const handleTypeChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      type: value,
      // Réinitialiser les champs selon le type
      series: value === 'reps' ? 3 : undefined,
      repsPerSeries: value === 'reps' ? [10, 10, 10] : undefined,
      duration: value === 'duration' ? 60 : undefined
    }));
  }, []);

  const handleSeriesChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 1;
    const clampedValue = Math.max(1, Math.min(50, value));
    
    // ✅ Ajuster repsPerSeries selon le nombre de séries
    setFormData(prev => {
      const currentReps = prev.repsPerSeries || [];
      const newReps = [];
      for (let i = 0; i < clampedValue; i++) {
        newReps.push(currentReps[i] || (currentReps[0] || 10));
      }
      return {
        ...prev,
        series: clampedValue,
        repsPerSeries: newReps
      };
    });
  }, []);

  const handleRepsChange = useCallback((index, value) => {
    const numValue = parseInt(value) || 0;
    const clampedValue = Math.max(0, Math.min(1000, numValue));
    
    setFormData(prev => {
      const newReps = [...(prev.repsPerSeries || [])];
      newReps[index] = clampedValue;
      return { ...prev, repsPerSeries: newReps };
    });
  }, []);

  const handleDurationChange = useCallback((e) => {
    const value = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(0, Math.min(7200, value));
    setFormData(prev => ({ ...prev, duration: clampedValue }));
  }, []);

  const handleMaterielChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, materiel: e.target.value }));
  }, []);

  const handleNotesChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, notes: e.target.value }));
  }, []);

  const handleReasonChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, reason: e.target.value }));
  }, []);

  // ✅ Handler pour soumettre le formulaire
  const handleSubmit = useCallback(async () => {
    const validation = validateExceptionalExercise(formData, t);

    // ✅ Vérifier erreurs bloquantes
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        showError(error, {
          title: t('exercises.exceptional.messages.validationError'),
          message: error
        });
      });
      return;
    }

    // ✅ Afficher warnings non-bloquants avec confirmation
    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join('\n');
      const proceed = window.confirm(
        `${t('exercises.exceptional.messages.warnings')}\n\n${warningMessage}\n\n${t('exercises.exceptional.messages.warningsContinue')}`
      );
      
      if (!proceed) {
        return;
      }
    }

    try {
      // ✅ Préparer les données selon le type
      const exerciseData = {
        name: formData.name.trim(),
        type: formData.type,
        materiel: formData.materiel.trim() || undefined,
        notes: formData.notes.trim() || undefined
      };

      if (formData.type === 'reps') {
        exerciseData.series = formData.series;
        exerciseData.repsPerSeries = formData.repsPerSeries;
      } else {
        exerciseData.duration = formData.duration;
      }

      // ✅ Ajouter l'exercice exceptionnel
      await addExceptionalExercise(
        exerciseData,
        formData.reason.trim() || undefined,
        targetDate || undefined
      );
      
      showSuccess(t('exercises.exceptional.messages.success'));
      
      // ✅ Réinitialiser le formulaire
      setFormData({
        name: '',
        type: 'reps',
        series: 3,
        repsPerSeries: [10, 10, 10],
        duration: 60,
        materiel: '',
        notes: '',
        reason: ''
      });
      
      // ✅ Fermer la modal
      onClose();
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout de l\'exercice exceptionnel:', error);
      showError(t('exercises.exceptional.messages.addError'), {
        title: t('exercises.exceptional.messages.addFailed'),
        message: error.message || t('exercises.exceptional.messages.addErrorMessage'),
        suggestions: [
          t('exercises.exceptional.messages.suggestions.checkFields'),
          t('exercises.exceptional.messages.suggestions.tryAgain')
        ]
      });
    }
  }, [formData, addExceptionalExercise, showSuccess, showError, onClose, targetDate]);

  // ✅ Réinitialiser le formulaire quand la modal se ferme
  React.useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: '',
        type: 'reps',
        series: 3,
        repsPerSeries: [10, 10, 10],
        duration: 60,
        materiel: '',
        notes: '',
        reason: ''
      });
      setValidation({
        isValid: false,
        errors: [],
        warnings: [],
        suggestions: []
      });
      setFieldErrors({});
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('exercises.exceptional.title')}
      size="md"
      variant="glass"
    >
      <div className="p-6 space-y-6">
        {/* ✅ Nom de l'exercice */}
        <Input
          label={`${t('exercises.exceptional.name.label')} ${t('exercises.exceptional.name.required')}`}
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder={t('exercises.exceptional.name.placeholder')}
          required
          error={fieldErrors.name}
          help={formData.name.trim().length > 0 && formData.name.trim().length < 2 ? t('exercises.exceptional.name.help') : undefined}
          className="w-full"
        />

        {/* ✅ Type d'exercice */}
        <Select
          label={`${t('exercises.exceptional.type.label')} ${t('exercises.exceptional.type.required')}`}
          value={formData.type}
          onChange={handleTypeChange}
          required
          className="w-full"
        >
          <option value="reps">{t('exercises.exceptional.type.reps')}</option>
          <option value="duration">{t('exercises.exceptional.type.duration')}</option>
        </Select>

        {/* ✅ Champs selon le type */}
        {formData.type === 'reps' ? (
          <>
            {/* Nombre de séries */}
            <Input
              label={`${t('exercises.exceptional.series.label')} ${t('exercises.exceptional.series.required')}`}
              type="number"
              value={formData.series}
              onChange={handleSeriesChange}
              min="1"
              max="50"
              required
              error={fieldErrors.series}
              help={t('exercises.exceptional.series.help')}
              className="w-full"
            />

            {/* Répétitions par série */}
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                {t('exercises.exceptional.repsPerSeries.label')} {t('exercises.exceptional.repsPerSeries.required')} ({formData.series} {formData.series > 1 ? t('exercises.exceptional.repsPerSeries.seriesPlural') : t('exercises.exceptional.repsPerSeries.series')})
              </label>
              <div className="space-y-2">
                {Array.from({ length: formData.series }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-8">{t('exercises.exceptional.repsPerSeries.series')} {index + 1}:</span>
                    <Input
                      type="number"
                      value={formData.repsPerSeries[index] || ''}
                      onChange={(e) => handleRepsChange(index, e.target.value)}
                      placeholder={t('exercises.exceptional.repsPerSeries.label', 'Reps')}
                      min="1"
                      max="1000"
                      error={fieldErrors.repsPerSeries && index === 0 ? fieldErrors.repsPerSeries : undefined}
                      className="flex-1"
                    />
                  </div>
                ))}
              </div>
              {validation.suggestions.some(s => s.includes('même nombre de reps')) && (
                <div className="mt-2 text-xs text-blue-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {validation.suggestions.find(s => s.includes('même nombre de reps'))}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Durée */}
            <Input
              label={`${t('exercises.exceptional.duration.label')} (${t('exercises.exceptional.duration.unit')}) ${t('exercises.exceptional.duration.required')}`}
              type="number"
              value={formData.duration}
              onChange={handleDurationChange}
              placeholder={t('exercises.exceptional.duration.help', 'Ex: 180 pour 3 minutes')}
              min="1"
              max="7200"
              required
              error={fieldErrors.duration}
              help={formData.duration >= 60 ? `${t('exercises.exceptional.duration.label')}: ${Math.floor(formData.duration / 60)}min ${formData.duration % 60}s` : undefined}
              className="w-full"
            />
            {validation.suggestions.some(s => s.includes(t('exercises.exceptional.suggestions.durationMinutes', 'Durée :').split(':')[0])) && (
              <div className="text-xs text-blue-400 flex items-center gap-1 -mt-2">
                <Info className="w-3 h-3" />
                {validation.suggestions.find(s => s.includes(t('exercises.exceptional.suggestions.durationMinutes', 'Durée :').split(':')[0]))}
              </div>
            )}
          </>
        )}

        {/* ✅ Matériel (optionnel) */}
        <Input
          label={t('exercises.exceptional.materiel.label')}
          type="text"
          value={formData.materiel}
          onChange={handleMaterielChange}
          placeholder={t('exercises.exceptional.materiel.placeholder')}
          optional
          className="w-full"
        />

        {/* ✅ Notes (optionnel) */}
        <TextArea
          label={t('exercises.exceptional.notes.label')}
          value={formData.notes}
          onChange={handleNotesChange}
          placeholder={t('exercises.exceptional.notes.placeholder')}
          rows={3}
          optional
          className="w-full"
        />

        {/* ✅ Raison (optionnel) */}
        <Input
          label={t('exercises.exceptional.reason.label')}
          type="text"
          value={formData.reason}
          onChange={handleReasonChange}
          placeholder={t('exercises.exceptional.reason.placeholder')}
          optional
          className="w-full"
        />

        {/* ✅ Affichage des erreurs, warnings et suggestions */}
        {validation.errors.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              Erreurs à corriger :
            </div>
            <ul className="list-disc list-inside text-sm text-red-300 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-yellow-400 font-medium">
              <AlertCircle className="w-4 h-4" />
              {t('exercises.exceptional.messages.warningsTitle')} :
            </div>
            <ul className="list-disc list-inside text-sm text-yellow-300 space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.suggestions.length > 0 && validation.errors.length === 0 && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-400 font-medium">
              <Info className="w-4 h-4" />
              {t('exercises.exceptional.messages.suggestionsTitle')} :
            </div>
            <ul className="list-disc list-inside text-sm text-blue-300 space-y-1">
              {validation.suggestions.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ✅ Boutons d'action */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700/50">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-slate-600 text-slate-300 hover:bg-slate-700/50"
          >
            {t('exercises.exceptional.buttons.cancel')}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!validation.isValid}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            icon={CheckCircle}
          >
            {t('exercises.exceptional.buttons.save')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddExceptionalExerciseModal;

