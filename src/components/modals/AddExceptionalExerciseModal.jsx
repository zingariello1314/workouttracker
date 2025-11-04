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

/**
 * Validation complète et intelligente d'un exercice exceptionnel
 * @param {object} exercise - Données de l'exercice à valider
 * @returns {object} { isValid, errors, warnings, suggestions }
 */
const validateExceptionalExercise = (exercise) => {
  const errors = [];
  const warnings = [];
  const suggestions = [];

  // ✅ Validation nom (2-100 chars)
  if (!exercise.name || typeof exercise.name !== 'string' || exercise.name.trim().length === 0) {
    errors.push('Le nom de l\'exercice est requis');
  } else if (exercise.name.trim().length < 2) {
    errors.push('Le nom de l\'exercice doit contenir au moins 2 caractères');
  } else if (exercise.name.trim().length > 100) {
    warnings.push('Le nom est très long (> 100 caractères)');
  }

  // ✅ Validation type (reps ou duration)
  if (!exercise.type || !['reps', 'duration'].includes(exercise.type)) {
    errors.push('Le type d\'exercice doit être "reps" ou "duration"');
  }

  // ✅ Validation selon le type
  if (exercise.type === 'reps') {
    // Validation séries (1-50)
    if (!exercise.series || typeof exercise.series !== 'number' || exercise.series < 1) {
      errors.push('Le nombre de séries doit être supérieur à 0');
    } else if (exercise.series > 50) {
      warnings.push('Un nombre très élevé de séries (> 50) peut être une erreur');
    } else if (exercise.series > 20) {
      warnings.push('Un nombre élevé de séries (> 20) peut être fatigant');
    } else if (exercise.series < 2) {
      warnings.push('Une seule série peut être peu efficace pour la progression');
    }

    // Validation repsPerSeries
    if (!exercise.repsPerSeries || !Array.isArray(exercise.repsPerSeries) || exercise.repsPerSeries.length === 0) {
      errors.push('Au moins une série doit avoir des répétitions');
    } else {
      // ✅ Validation cohérence séries vs repsPerSeries
      if (exercise.repsPerSeries.length !== exercise.series) {
        errors.push(`Le nombre de séries (${exercise.series}) ne correspond pas au nombre de valeurs de répétitions (${exercise.repsPerSeries.length})`);
      }

      // ✅ Validation valeurs de répétitions
      const invalidReps = exercise.repsPerSeries.filter(r => typeof r !== 'number' || r <= 0 || r > 1000);
      if (invalidReps.length > 0) {
        errors.push('Toutes les répétitions doivent être positives et inférieures à 1000');
      }

      // ✅ Détection patterns intelligente
      if (exercise.repsPerSeries.length > 1) {
        // Pattern : toutes identiques
        const allSame = exercise.repsPerSeries.every(r => r === exercise.repsPerSeries[0]);
        if (allSame) {
          suggestions.push(`Toutes les séries ont le même nombre de reps (${exercise.repsPerSeries[0]}) - vous pouvez simplifier`);
        }

        // Pattern : progression arithmétique
        const differences = [];
        for (let i = 1; i < exercise.repsPerSeries.length; i++) {
          differences.push(exercise.repsPerSeries[i] - exercise.repsPerSeries[i - 1]);
        }
        const allSameDiff = differences.every(d => d === differences[0]);
        if (allSameDiff && differences[0] !== 0) {
          const diff = differences[0];
          suggestions.push(`Progression détectée : ${diff > 0 ? '+' : ''}${diff} reps par série`);
        }

        // Pattern : valeurs extrêmes
        const minReps = Math.min(...exercise.repsPerSeries);
        const maxReps = Math.max(...exercise.repsPerSeries);
        if (minReps < 5) {
          warnings.push(`Certaines séries ont très peu de reps (< 5) - vérifiez`);
        }
        if (maxReps > 100) {
          warnings.push(`Certaines séries ont beaucoup de reps (> 100) - vérifiez`);
        }
      }
    }
  } else if (exercise.type === 'duration') {
    // Validation durée (> 0, < 7200s = 2h)
    if (!exercise.duration || typeof exercise.duration !== 'number' || exercise.duration <= 0) {
      errors.push('La durée doit être positive');
    } else if (exercise.duration > 7200) {
      warnings.push('Durée très longue (> 2 heures) - est-ce correct ?');
    } else if (exercise.duration < 10) {
      warnings.push('Durée très courte (< 10 secondes) - est-ce correct ?');
    } else if (exercise.duration >= 60) {
      // ✅ Suggestion conversion secondes/minutes
      const minutes = Math.floor(exercise.duration / 60);
      const seconds = exercise.duration % 60;
      if (seconds === 0) {
        suggestions.push(`Durée : ${minutes}min (vérifiez si c'est bien en secondes)`);
      } else {
        suggestions.push(`Durée : ${minutes}min ${seconds}s (vérifiez si c'est bien en secondes)`);
      }
    }
  }

  // ✅ Validation matériel (optionnel mais recommandé)
  if (exercise.materiel !== undefined && exercise.materiel.trim().length === 0) {
    suggestions.push('Le matériel n\'est pas renseigné - cela peut être utile pour plus tard');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions
  };
};

const AddExceptionalExerciseModal = ({ isOpen, onClose }) => {
  const { addExceptionalExercise } = useWorkout();
  const { showSuccess, showError } = useToast();

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
    return validateExceptionalExercise(formData);
  }, [formData]);

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
    const validation = validateExceptionalExercise(formData);

    // ✅ Vérifier erreurs bloquantes
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        showError(error, {
          title: 'Erreur de validation',
          message: error
        });
      });
      return;
    }

    // ✅ Afficher warnings non-bloquants avec confirmation
    if (validation.warnings.length > 0) {
      const warningMessage = validation.warnings.join('\n');
      const proceed = window.confirm(
        `⚠️ Avertissements :\n\n${warningMessage}\n\nSouhaitez-vous continuer quand même ?`
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
      await addExceptionalExercise(exerciseData, formData.reason.trim() || undefined);
      
      showSuccess('Exercice exceptionnel ajouté avec succès !');
      
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
      showError('Erreur lors de l\'ajout', {
        title: 'Échec de l\'ajout',
        message: error.message || 'Une erreur est survenue lors de l\'ajout de l\'exercice.',
        suggestions: [
          'Vérifiez que tous les champs sont correctement remplis',
          'Réessayez dans quelques instants'
        ]
      });
    }
  }, [formData, addExceptionalExercise, showSuccess, showError, onClose]);

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
      title="Ajouter un exercice exceptionnel"
      size="md"
      variant="glass"
    >
      <div className="p-6 space-y-6">
        {/* ✅ Nom de l'exercice */}
        <Input
          label="Nom de l'exercice *"
          type="text"
          value={formData.name}
          onChange={handleNameChange}
          placeholder="Ex: Développé couché avec haltères"
          required
          error={fieldErrors.name}
          help={formData.name.trim().length > 0 && formData.name.trim().length < 2 ? 'Le nom doit contenir au moins 2 caractères' : undefined}
          className="w-full"
        />

        {/* ✅ Type d'exercice */}
        <Select
          label="Type d'exercice *"
          value={formData.type}
          onChange={handleTypeChange}
          required
          className="w-full"
        >
          <option value="reps">Par répétitions (séries × reps)</option>
          <option value="duration">Par durée (secondes/minutes)</option>
        </Select>

        {/* ✅ Champs selon le type */}
        {formData.type === 'reps' ? (
          <>
            {/* Nombre de séries */}
            <Input
              label="Nombre de séries *"
              type="number"
              value={formData.series}
              onChange={handleSeriesChange}
              min="1"
              max="50"
              required
              error={fieldErrors.series}
              help="Entre 1 et 50 séries"
              className="w-full"
            />

            {/* Répétitions par série */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Répétitions par série * ({formData.series} série{formData.series > 1 ? 's' : ''})
              </label>
              <div className="space-y-2">
                {Array.from({ length: formData.series }).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-sm text-gray-400 w-8">Série {index + 1}:</span>
                    <Input
                      type="number"
                      value={formData.repsPerSeries[index] || ''}
                      onChange={(e) => handleRepsChange(index, e.target.value)}
                      placeholder="Reps"
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
              label="Durée (en secondes) *"
              type="number"
              value={formData.duration}
              onChange={handleDurationChange}
              placeholder="Ex: 180 pour 3 minutes"
              min="1"
              max="7200"
              required
              error={fieldErrors.duration}
              help={formData.duration >= 60 ? `Durée : ${Math.floor(formData.duration / 60)}min ${formData.duration % 60}s` : undefined}
              className="w-full"
            />
            {validation.suggestions.some(s => s.includes('Durée :')) && (
              <div className="text-xs text-blue-400 flex items-center gap-1 -mt-2">
                <Info className="w-3 h-3" />
                {validation.suggestions.find(s => s.includes('Durée :'))}
              </div>
            )}
          </>
        )}

        {/* ✅ Matériel (optionnel) */}
        <Input
          label="Matériel"
          type="text"
          value={formData.materiel}
          onChange={handleMaterielChange}
          placeholder="Ex: Haltères, barre, élastique..."
          optional
          className="w-full"
        />

        {/* ✅ Notes (optionnel) */}
        <TextArea
          label="Notes"
          value={formData.notes}
          onChange={handleNotesChange}
          placeholder="Notes personnelles sur cet exercice..."
          rows={3}
          optional
          className="w-full"
        />

        {/* ✅ Raison (optionnel) */}
        <Input
          label="Raison de l'ajout"
          type="text"
          value={formData.reason}
          onChange={handleReasonChange}
          placeholder="Ex: Blessure, remplacement temporaire..."
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
              Avertissements :
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
              Suggestions :
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
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!validation.isValid}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
            icon={CheckCircle}
          >
            Ajouter l'exercice
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AddExceptionalExerciseModal;

