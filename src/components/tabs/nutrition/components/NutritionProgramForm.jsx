/**
 * NutritionProgramForm - Formulaire Création/Modification Programme
 * 
 * Modal pour créer ou modifier un programme nutritionnel avec :
 * - Informations de base (nom, description, objectif)
 * - Targets nutritionnels (calories, macros)
 * - Ajustement pour jours workout/repos
 * - Durée et dates
 * 
 * @module components/tabs/nutrition/components/NutritionProgramForm
 */

import React, { useState, useEffect } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { Save, Target } from 'lucide-react';
import { typography } from '../../../../styles/typography';

const NutritionProgramForm = ({ isOpen, onClose, program, onSave, nutritionData }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    goal: 'maintain',
    targetCalories: 2500,
    targetProtein: 150,
    targetCarbs: 300,
    targetFat: 80,
    adjustForWorkout: false,
    workoutDayCalories: 2700,
    restDayCalories: 2300,
    duration: 30, // jours
    startDate: new Date().toISOString().split('T')[0],
    endDate: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Objectifs disponibles
  const goals = [
    { value: 'bulk', label: 'Prise de masse', icon: '📈', description: 'Surplus calorique pour gagner du muscle' },
    { value: 'cut', label: 'Sèche', icon: '📉', description: 'Déficit calorique pour perdre du gras' },
    { value: 'maintain', label: 'Maintien', icon: '⚖️', description: 'Maintenir poids actuel' },
    { value: 'recomp', label: 'Recomposition', icon: '🔄', description: 'Perdre gras + gagner muscle simultanément' }
  ];

  // Initialiser formulaire
  useEffect(() => {
    if (program) {
      // Mode édition
      setFormData({
        name: program.name || '',
        description: program.description || '',
        goal: program.goal || 'maintain',
        targetCalories: program.targetCalories || 2500,
        targetProtein: program.targetProtein || 150,
        targetCarbs: program.targetCarbs || 300,
        targetFat: program.targetFat || 80,
        adjustForWorkout: program.adjustForWorkout || false,
        workoutDayCalories: program.workoutDayCalories || program.targetCalories + 200,
        restDayCalories: program.restDayCalories || program.targetCalories - 200,
        duration: program.duration || 30,
        startDate: program.startDate || new Date().toISOString().split('T')[0],
        endDate: program.endDate || null
      });
    } else {
      // Mode création
      setFormData({
        name: '',
        description: '',
        goal: 'maintain',
        targetCalories: 2500,
        targetProtein: 150,
        targetCarbs: 300,
        targetFat: 80,
        adjustForWorkout: false,
        workoutDayCalories: 2700,
        restDayCalories: 2300,
        duration: 30,
        startDate: new Date().toISOString().split('T')[0],
        endDate: null
      });
    }
    setErrors({});
  }, [program, isOpen]);

  // Calculer pourcentages automatiquement
  useEffect(() => {
    const proteinCal = formData.targetProtein * 4;
    const carbsCal = formData.targetCarbs * 4;
    const fatCal = formData.targetFat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;

    if (totalMacroCal > 0) {
      // Ajuster les macros pour correspondre aux calories cibles
      const ratio = formData.targetCalories / totalMacroCal;
      // Note: On ne modifie pas automatiquement, juste pour info
    }
  }, [formData.targetCalories, formData.targetProtein, formData.targetCarbs, formData.targetFat]);

  // Valider formulaire
  const validate = () => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Calculer pourcentages
  const calculatePercentages = () => {
    const proteinCal = formData.targetProtein * 4;
    const carbsCal = formData.targetCarbs * 4;
    const fatCal = formData.targetFat * 9;
    const totalMacroCal = proteinCal + carbsCal + fatCal;

    if (totalMacroCal === 0) {
      return { protein: 0, carbs: 0, fat: 0 };
    }

    return {
      protein: Math.round((proteinCal / totalMacroCal) * 100),
      carbs: Math.round((carbsCal / totalMacroCal) * 100),
      fat: Math.round((fatCal / totalMacroCal) * 100)
    };
  };

  // Sauvegarder
  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const percentages = calculatePercentages();

      const programData = {
        id: program?.id || nutritionData.generateProgramId(),
        name: formData.name.trim(),
        description: formData.description.trim() || null,
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
        endDate: formData.endDate || null,
        isActive: program?.isActive || false,
        isArchived: program?.isArchived || false
      };

      await onSave(programData);
    } catch (error) {
      console.error('[NutritionProgramForm] Erreur sauvegarde:', error);
      setErrors({ submit: 'Erreur lors de la sauvegarde' });
    } finally {
      setLoading(false);
    }
  };

  const percentages = calculatePercentages();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={program ? 'Modifier le programme' : 'Créer un programme nutritionnel'}
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Informations de base */}
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Nom du programme *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Prise de Masse Propre"
              className="bg-slate-800 border-slate-600 text-white"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre programme, vos objectifs..."
              rows={3}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Objectif *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                  <div className="text-2xl mb-1">{goal.icon}</div>
                  <div className="text-sm font-medium">{goal.label}</div>
                  <div className="text-xs opacity-75 mt-1">{goal.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Targets nutritionnels */}
        <div className="space-y-4 border-t border-slate-700 pt-4">
          <h3 className={`${typography.presets.h4} text-white mb-3`}>
            Objectifs Nutritionnels
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Calories (kcal/jour) *
              </label>
              <Input
                type="number"
                value={formData.targetCalories}
                onChange={(e) => setFormData({ ...formData, targetCalories: parseFloat(e.target.value) || 0 })}
                min="1000"
                max="10000"
                step="50"
                className="bg-slate-800 border-slate-600 text-white"
              />
              {errors.targetCalories && (
                <p className="text-red-400 text-sm mt-1">{errors.targetCalories}</p>
              )}
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Protéines (g/jour) *
              </label>
              <Input
                type="number"
                value={formData.targetProtein}
                onChange={(e) => setFormData({ ...formData, targetProtein: parseFloat(e.target.value) || 0 })}
                min="0"
                max="500"
                step="5"
                className="bg-slate-800 border-slate-600 text-white"
              />
              {errors.targetProtein && (
                <p className="text-red-400 text-sm mt-1">{errors.targetProtein}</p>
              )}
              <p className="text-slate-400 text-xs mt-1">
                {percentages.protein}% des calories
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Glucides (g/jour) *
              </label>
              <Input
                type="number"
                value={formData.targetCarbs}
                onChange={(e) => setFormData({ ...formData, targetCarbs: parseFloat(e.target.value) || 0 })}
                min="0"
                max="1000"
                step="10"
                className="bg-slate-800 border-slate-600 text-white"
              />
              {errors.targetCarbs && (
                <p className="text-red-400 text-sm mt-1">{errors.targetCarbs}</p>
              )}
              <p className="text-slate-400 text-xs mt-1">
                {percentages.carbs}% des calories
              </p>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Lipides (g/jour) *
              </label>
              <Input
                type="number"
                value={formData.targetFat}
                onChange={(e) => setFormData({ ...formData, targetFat: parseFloat(e.target.value) || 0 })}
                min="0"
                max="500"
                step="5"
                className="bg-slate-800 border-slate-600 text-white"
              />
              {errors.targetFat && (
                <p className="text-red-400 text-sm mt-1">{errors.targetFat}</p>
              )}
              <p className="text-slate-400 text-xs mt-1">
                {percentages.fat}% des calories
              </p>
            </div>
          </div>

          {/* Aperçu distribution */}
          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <div className="text-slate-300 text-sm mb-2">Distribution des macros :</div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-blue-400">Protéines</span>
                  <span className="text-white">{percentages.protein}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${percentages.protein}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-green-400">Glucides</span>
                  <span className="text-white">{percentages.carbs}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${percentages.carbs}%` }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-orange-400">Lipides</span>
                  <span className="text-white">{percentages.fat}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${percentages.fat}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ajustement workout */}
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
              Ajuster calories selon jours workout/repos
            </label>
          </div>

          {formData.adjustForWorkout && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-7">
              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Calories jour workout
                </label>
                <Input
                  type="number"
                  value={formData.workoutDayCalories}
                  onChange={(e) => setFormData({ ...formData, workoutDayCalories: parseFloat(e.target.value) || 0 })}
                  min="1000"
                  max="10000"
                  step="50"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {errors.workoutDayCalories && (
                  <p className="text-red-400 text-sm mt-1">{errors.workoutDayCalories}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-2">
                  Calories jour repos
                </label>
                <Input
                  type="number"
                  value={formData.restDayCalories}
                  onChange={(e) => setFormData({ ...formData, restDayCalories: parseFloat(e.target.value) || 0 })}
                  min="1000"
                  max="10000"
                  step="50"
                  className="bg-slate-800 border-slate-600 text-white"
                />
                {errors.restDayCalories && (
                  <p className="text-red-400 text-sm mt-1">{errors.restDayCalories}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Durée et dates */}
        <div className="space-y-4 border-t border-slate-700 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Durée (jours)
              </label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 30 })}
                min="1"
                max="365"
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Date de début
              </label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-2">
                Date de fin (optionnel)
              </label>
              <Input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Erreur générale */}
        {errors.submit && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
            {errors.submit}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-slate-300 hover:text-white"
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Save size={18} className="mr-2" />
            {loading ? 'Sauvegarde...' : program ? 'Modifier' : 'Créer'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default NutritionProgramForm;

