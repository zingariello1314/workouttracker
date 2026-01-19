/**
 * Modal de saisie de séance depuis le calendrier
 * 
 * Permet de saisir une séance rétroactivement pour une date passée :
 * - Sélection du programme
 * - Affichage des exercices du jour
 * - Saisie des répétitions
 * - Cocher/décocher les exercices
 * 
 * @module CalendarWorkoutEntryModal
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Save, X, Target, Check } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { useToast } from '../ui/Toast';
import { getDateStr, getDayName } from '../../utils/dateUtils';
import { workoutProgram } from '../../data/workoutProgram';
import { calculateAutoReps } from '../../utils/exerciseCalculations';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
import { typography } from '../../styles/typography';

/**
 * Composant CalendarWorkoutEntryModal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Contrôle l'affichage de la modal
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Date|string} props.date - Date de la séance (Date object ou string YYYY-MM-DD)
 */
const CalendarWorkoutEntryModal = ({ isOpen, onClose, date }) => {
  // ✅ Ne pas appeler les hooks si la modal n'est pas ouverte
  // Cela évite les erreurs si le contexte n'est pas encore prêt
  if (!isOpen) return null;
  
  const { 
    activeProgram,
    programs,
    getTodayWorkout,
    updateReps,
    toggleCheck,
    getDateStr: getDateStrFromContext,
    getDayName: getDayNameFromContext,
    getCurrentData
  } = useWorkout();
  
  const { currentUser, isAuthenticated } = useAuth();
  const t = useTranslation();
  const { formatDate: formatLocaleDate } = useFormatters();
  const { showSuccess, showError } = useToast();
  
  // ✅ Vérifier si l'utilisateur est admin
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314';
  
  // Normaliser la date
  const dateObj = useMemo(() => {
    if (!date) return null;
    return typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
  }, [date]);
  
  const dateStr = useMemo(() => {
    if (!dateObj) return '';
    return getDateStrFromContext(dateObj);
  }, [dateObj, getDateStrFromContext]);
  
  const dayName = useMemo(() => {
    if (!dateObj) return '';
    return getDayNameFromContext(dateObj);
  }, [dateObj, getDayNameFromContext]);
  
  const formattedDate = useMemo(() => {
    if (!dateObj) return '';
    return formatLocaleDate(dateObj, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [dateObj, formatLocaleDate]);
  
  // États locaux
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [repsData, setRepsData] = useState({});
  const [checkedExercises, setCheckedExercises] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Récupérer les données actuelles
  const currentData = useMemo(() => getCurrentData(), [getCurrentData]);
  
  // Initialiser avec le programme actif
  useEffect(() => {
    if (isOpen && activeProgram) {
      setSelectedProgramId(activeProgram.id);
    } else if (isOpen && !activeProgram && isAdmin) {
      // Si pas de programme actif mais admin, utiliser le programme par défaut
      setSelectedProgramId('default');
    }
  }, [isOpen, activeProgram, isAdmin]);
  
  // Charger le workout quand le programme ou la date change
  useEffect(() => {
    if (!isOpen || !dateObj || !selectedProgramId) {
      setWorkout(null);
      return;
    }
    
    let workoutRaw = null;
    
    if (selectedProgramId === 'default' && isAdmin && isAuthenticated) {
      // Programme par défaut (workoutProgram)
      workoutRaw = workoutProgram[dayName] || null;
    } else if (selectedProgramId && programs) {
      // Programme personnalisé
      const program = programs.find(p => p.id === selectedProgramId);
      if (program && program.schedule) {
        const daySchedule = program.schedule[dayName];
        if (daySchedule) {
          workoutRaw = {
            name: daySchedule.name || program.name,
            focus: daySchedule.focus || '',
            exercices: daySchedule.exercises || daySchedule.exercices || [],
            etirements: daySchedule.etirements || [],
            salleVariants: daySchedule.salleVariants || null
          };
        }
      }
    } else if (selectedProgramId && activeProgram && activeProgram.id === selectedProgramId) {
      // Utiliser getTodayWorkout pour le programme actif
      workoutRaw = getTodayWorkout ? getTodayWorkout(dateObj, false) : null;
    }
    
    if (workoutRaw) {
      const workoutFormatted = {
        ...workoutRaw,
        exercices: workoutRaw.exercices || workoutRaw.exercises || []
      };
      setWorkout(workoutFormatted);
      
      // Initialiser les données de reps et checkedExercises
      const initialReps = {};
      const initialChecked = {};
      
      workoutFormatted.exercices.forEach(exercise => {
        const key = `${dateStr}_${exercise.id}`;
        initialReps[exercise.id] = currentData.reps[key] || '';
        initialChecked[exercise.id] = currentData.checkedExercises[key] || false;
      });
      
      setRepsData(initialReps);
      setCheckedExercises(initialChecked);
    } else {
      setWorkout(null);
      setRepsData({});
      setCheckedExercises({});
    }
  }, [isOpen, dateObj, selectedProgramId, dayName, programs, activeProgram, getTodayWorkout, dateStr, currentData, isAdmin, isAuthenticated]);
  
  // Réinitialiser quand la modal se ferme
  useEffect(() => {
    if (!isOpen) {
      setSelectedProgramId(null);
      setWorkout(null);
      setRepsData({});
      setCheckedExercises({});
      setIsLoading(false);
    }
  }, [isOpen]);
  
  // Gestion des reps
  const handleRepsChange = useCallback((exerciseId, value) => {
    setRepsData(prev => ({
      ...prev,
      [exerciseId]: value
    }));
  }, []);
  
  // Gestion du coché/décoché
  const handleToggleCheck = useCallback((exerciseId) => {
    setCheckedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
  }, []);
  
  // Auto-remplissage au focus
  const handleInputFocus = useCallback((exerciseId, exercise) => {
    const currentValue = repsData[exerciseId] || '';
    if (!currentValue && exercise.series) {
      const autoReps = calculateAutoReps(exercise.series);
      if (autoReps) {
        handleRepsChange(exerciseId, autoReps.toString());
      }
    }
  }, [repsData, handleRepsChange]);
  
  // Sauvegarde
  const handleSave = useCallback(() => {
    if (!dateObj || !workout) {
      showError(t('calendar.workoutEntry.errors.noWorkout', 'Aucun programme sélectionné'));
      return;
    }
    
    // Validation : au moins un exercice doit être coché
    const hasCheckedExercise = Object.values(checkedExercises).some(v => v === true);
    if (!hasCheckedExercise) {
      showError(t('calendar.workoutEntry.errors.noExerciseChecked', 'Veuillez cocher au moins un exercice'));
      return;
    }
    
    setIsLoading(true);
    
    try {
      let savedCount = 0;
      let errorCount = 0;
      
      // Sauvegarder les reps
      Object.entries(repsData).forEach(([exerciseId, reps]) => {
        if (reps && reps !== '') {
          try {
            const parsedReps = parseInt(reps);
            if (parsedReps >= 0 && parsedReps <= 999) {
              updateReps(parseInt(exerciseId), reps, dateObj);
              savedCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
          }
        }
      });
      
      // Cocher les exercices
      Object.entries(checkedExercises).forEach(([exerciseId, isChecked]) => {
        if (isChecked) {
          const key = `${dateStr}_${exerciseId}`;
          // Vérifier si pas déjà coché
          const currentDataCheck = getCurrentData();
          if (!currentDataCheck.checkedExercises[key]) {
            toggleCheck(parseInt(exerciseId), dateObj);
          }
        }
      });
      
      if (errorCount === 0) {
        showSuccess(t('calendar.workoutEntry.messages.saveSuccess', 'Séance enregistrée avec succès'));
        onClose();
      } else {
        showError(t('calendar.workoutEntry.messages.savePartial', 'Séance partiellement enregistrée'));
      }
    } catch (error) {
      console.error('[CalendarWorkoutEntryModal] Erreur lors de la sauvegarde:', error);
      showError(t('calendar.workoutEntry.messages.saveError', 'Erreur lors de la sauvegarde'));
    } finally {
      setIsLoading(false);
    }
  }, [dateObj, workout, checkedExercises, repsData, dateStr, updateReps, toggleCheck, getCurrentData, showSuccess, showError, onClose, t]);
  
  // Liste des programmes disponibles
  const availablePrograms = useMemo(() => {
    const programList = [];
    
    // Programme par défaut (si admin)
    if (isAdmin && isAuthenticated) {
      programList.push({
        id: 'default',
        name: t('calendar.workoutEntry.program.default', 'Programme par défaut'),
        isDefault: true
      });
    }
    
    // Programmes personnalisés
    if (programs && programs.length > 0) {
      programs.forEach(program => {
        programList.push({
          id: program.id,
          name: program.name || t('calendar.workoutEntry.program.unnamed', 'Programme sans nom'),
          isActive: program.id === activeProgram?.id
        });
      });
    }
    
    return programList;
  }, [programs, activeProgram, isAdmin, isAuthenticated, t]);
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('calendar.workoutEntry.title', 'Saisie de séance - {{date}}', { date: formattedDate })}
      closeOnOverlayClick={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto">
        {/* Sélection du programme */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('calendar.workoutEntry.program.label', 'Programme')}
          </label>
          <select
            value={selectedProgramId || ''}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="">{t('calendar.workoutEntry.program.select', 'Sélectionner un programme')}</option>
            {availablePrograms.map(program => (
              <option key={program.id} value={program.id}>
                {program.name} {program.isActive ? `(${t('calendar.workoutEntry.program.active', 'Actif')})` : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Liste des exercices */}
        {workout && workout.exercices && workout.exercices.length > 0 ? (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className={`${typography.presets.h3} text-white flex items-center gap-2`}>
                <Target size={18} className="text-blue-400" />
                {workout.name || t('calendar.workoutEntry.exercises.title', 'Exercices')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {workout.exercices.map((exercise) => {
                const exerciseId = exercise.id;
                const currentReps = repsData[exerciseId] || '';
                const isChecked = checkedExercises[exerciseId] || false;
                
                return (
                  <div key={exerciseId} className="flex items-center gap-4 p-3 bg-slate-900/50 rounded-lg">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleCheck(exerciseId)}
                      disabled={isLoading}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                        isChecked
                          ? 'bg-emerald-500 border-emerald-500'
                          : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isChecked && <Check size={14} className="text-white" />}
                    </button>
                    
                    {/* Informations de l'exercice */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`${typography.presets.h4} text-white mb-1`}>
                        {exercise.name}
                      </h4>
                      <p className={`${typography.presets.bodySmall} text-slate-400`}>
                        {exercise.series} • {exercise.materiel || t('dataEntry.exercise.bodyWeight', 'Poids du corps')}
                      </p>
                    </div>
                    
                    {/* Champ de saisie des reps */}
                    <Input
                      type="number"
                      placeholder="0"
                      value={currentReps}
                      onChange={(e) => handleRepsChange(exerciseId, e.target.value)}
                      onFocus={() => handleInputFocus(exerciseId, exercise)}
                      disabled={isLoading}
                      className={`w-20 text-center ${
                        isChecked ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300' : 'bg-slate-800 border-slate-600 text-white'
                      }`}
                      min="0"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ) : workout ? (
          <div className="text-center py-8 text-slate-400">
            {t('calendar.workoutEntry.noExercises', 'Aucun exercice prévu pour ce jour')}
          </div>
        ) : selectedProgramId ? (
          <div className="text-center py-8 text-slate-400">
            {t('calendar.workoutEntry.loading', 'Chargement...')}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400">
            {t('calendar.workoutEntry.selectProgram', 'Veuillez sélectionner un programme')}
          </div>
        )}
        
        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4 border-t border-slate-700">
          <Button
            variant="ghost"
            size="md"
            onClick={onClose}
            disabled={isLoading}
            fullWidth
          >
            {t('common.cancel', 'Annuler')}
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            disabled={isLoading || !workout || !Object.values(checkedExercises).some(v => v === true)}
            icon={Save}
            fullWidth
            loading={isLoading}
          >
            {t('common.save', 'Sauvegarder')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalendarWorkoutEntryModal;
