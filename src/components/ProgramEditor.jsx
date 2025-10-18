import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Copy, Trash2, Edit3, Target, Clock, Dumbbell, Calendar } from 'lucide-react';

const ProgramEditor = ({ isOpen, onClose, onSave, initialProgram = null }) => {
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programDuration, setProgramDuration] = useState(4); // semaines
  const [programGoal, setProgramGoal] = useState('strength');
  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { active: true, exercises: [] },
    tuesday: { active: false, exercises: [] },
    wednesday: { active: true, exercises: [] },
    thursday: { active: false, exercises: [] },
    friday: { active: true, exercises: [] },
    saturday: { active: false, exercises: [] },
    sunday: { active: false, exercises: [] }
  });

  const [selectedDay, setSelectedDay] = useState('monday');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);

  const goals = [
    { id: 'strength', label: 'Force', color: 'red' },
    { id: 'hypertrophy', label: 'Hypertrophie', color: 'blue' },
    { id: 'endurance', label: 'Endurance', color: 'green' },
    { id: 'powerlifting', label: 'Powerlifting', color: 'purple' },
    { id: 'general', label: 'Général', color: 'gray' }
  ];

  const muscleGroups = [
    'Pectoraux', 'Dos', 'Épaules', 'Biceps', 'Triceps', 'Quadriceps', 
    'Ischio-jambiers', 'Mollets', 'Abdominaux', 'Fessiers'
  ];

  const exerciseTemplates = {
    'Pectoraux': ['Développé couché', 'Développé incliné', 'Écarté haltères', 'Pompes', 'Dips'],
    'Dos': ['Tractions', 'Rowing barre', 'Tirage vertical', 'Rowing haltère', 'Soulevé de terre'],
    'Épaules': ['Développé militaire', 'Élévations latérales', 'Élévations arrière', 'Shrugs'],
    'Biceps': ['Curl barre', 'Curl haltères', 'Curl marteau', 'Tractions supination'],
    'Triceps': ['Dips', 'Extension nuque', 'Barre au front', 'Extension poulie'],
    'Quadriceps': ['Squat', 'Presse à cuisses', 'Fentes', 'Extension quadriceps'],
    'Ischio-jambiers': ['Soulevé de terre roumain', 'Curl ischio', 'Good morning'],
    'Mollets': ['Mollets debout', 'Mollets assis', 'Presse mollets'],
    'Abdominaux': ['Crunch', 'Planche', 'Russian twist', 'Mountain climbers'],
    'Fessiers': ['Hip thrust', 'Fentes bulgares', 'Squat sumo', 'Pont fessier']
  };

  const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  useEffect(() => {
    if (initialProgram) {
      setProgramName(initialProgram.name || '');
      setProgramDescription(initialProgram.description || '');
      setProgramDuration(initialProgram.duration || 4);
      setProgramGoal(initialProgram.goal || 'strength');
      setWeeklySchedule(initialProgram.schedule || weeklySchedule);
    }
  }, [initialProgram]);

  const ExerciseModal = () => {
    const [exerciseName, setExerciseName] = useState('');
    const [exerciseSets, setExerciseSets] = useState('3');
    const [exerciseReps, setExerciseReps] = useState('8-12');
    const [exerciseRest, setExerciseRest] = useState('90');
    const [exerciseMuscle, setExerciseMuscle] = useState('Pectoraux');
    const [exerciseNotes, setExerciseNotes] = useState('');
    const [exerciseIntensity, setExerciseIntensity] = useState('moderate');

    useEffect(() => {
      if (editingExercise) {
        setExerciseName(editingExercise.name || '');
        setExerciseSets(editingExercise.sets || '3');
        setExerciseReps(editingExercise.reps || '8-12');
        setExerciseRest(editingExercise.rest || '90');
        setExerciseMuscle(editingExercise.muscle || 'Pectoraux');
        setExerciseNotes(editingExercise.notes || '');
        setExerciseIntensity(editingExercise.intensity || 'moderate');
      }
    }, [editingExercise]);

    const handleSaveExercise = () => {
      const exercise = {
        id: editingExercise?.id || Date.now(),
        name: exerciseName,
        sets: exerciseSets,
        reps: exerciseReps,
        rest: exerciseRest,
        muscle: exerciseMuscle,
        notes: exerciseNotes,
        intensity: exerciseIntensity
      };

      setWeeklySchedule(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          exercises: editingExercise 
            ? prev[selectedDay].exercises.map(ex => ex.id === editingExercise.id ? exercise : ex)
            : [...prev[selectedDay].exercises, exercise]
        }
      }));

      setShowExerciseModal(false);
      setEditingExercise(null);
    };

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">
              {editingExercise ? 'Modifier l\'exercice' : 'Ajouter un exercice'}
            </h3>
            <button
              onClick={() => {
                setShowExerciseModal(false);
                setEditingExercise(null);
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Groupe musculaire
              </label>
              <select
                value={exerciseMuscle}
                onChange={(e) => setExerciseMuscle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                {muscleGroups.map(muscle => (
                  <option key={muscle} value={muscle}>{muscle}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Exercice
              </label>
              <div className="flex space-x-2">
                <select
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Choisir un exercice</option>
                  {exerciseTemplates[exerciseMuscle]?.map(exercise => (
                    <option key={exercise} value={exercise}>{exercise}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Ou saisir un exercice personnalisé"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Séries
                </label>
                <input
                  type="text"
                  value={exerciseSets}
                  onChange={(e) => setExerciseSets(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Répétitions
                </label>
                <input
                  type="text"
                  value={exerciseReps}
                  onChange={(e) => setExerciseReps(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="8-12"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Repos (sec)
                </label>
                <input
                  type="text"
                  value={exerciseRest}
                  onChange={(e) => setExerciseRest(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="90"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Intensité
              </label>
              <select
                value={exerciseIntensity}
                onChange={(e) => setExerciseIntensity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
              >
                <option value="light">Légère (60-70%)</option>
                <option value="moderate">Modérée (70-80%)</option>
                <option value="heavy">Lourde (80-90%)</option>
                <option value="max">Maximale (90%+)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={exerciseNotes}
                onChange={(e) => setExerciseNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows="3"
                placeholder="Instructions spéciales, technique, etc."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowExerciseModal(false);
                setEditingExercise(null);
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveExercise}
              disabled={!exerciseName}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg"
            >
              {editingExercise ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleSaveProgram = () => {
    const program = {
      id: initialProgram?.id || Date.now(),
      name: programName,
      description: programDescription,
      duration: programDuration,
      goal: programGoal,
      schedule: weeklySchedule,
      createdAt: initialProgram?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(program);
    onClose();
  };

  const duplicateDay = (fromDay, toDay) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [toDay]: {
        ...prev[toDay],
        exercises: [...prev[fromDay].exercises.map(ex => ({ ...ex, id: Date.now() + Math.random() }))]
      }
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-slate-800 rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">
            {initialProgram ? 'Modifier le programme' : 'Créer un nouveau programme'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Program Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nom du programme
                </label>
                <input
                  type="text"
                  value={programName}
                  onChange={(e) => setProgramName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  placeholder="Mon programme personnalisé"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={programDescription}
                  onChange={(e) => setProgramDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  rows="3"
                  placeholder="Description du programme, objectifs, etc."
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Durée (semaines)
                </label>
                <input
                  type="number"
                  value={programDuration}
                  onChange={(e) => setProgramDuration(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                  min="1"
                  max="52"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Objectif principal
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {goals.map(goal => (
                    <button
                      key={goal.id}
                      onClick={() => setProgramGoal(goal.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        programGoal === goal.id
                          ? `bg-${goal.color}-600 border-${goal.color}-500 text-white`
                          : 'bg-slate-700 border-slate-600 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Schedule */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <Calendar size={24} />
              <span>Planning hebdomadaire</span>
            </h3>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {Object.entries(dayNames).map(([day, label]) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`p-3 rounded-lg text-center transition-all ${
                    selectedDay === day
                      ? 'bg-purple-600 text-white'
                      : weeklySchedule[day].active
                      ? 'bg-slate-700 text-white hover:bg-slate-600'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-xs mt-1">
                    {weeklySchedule[day].exercises.length} ex.
                  </div>
                </button>
              ))}
            </div>

            {/* Day Details */}
            <div className="bg-slate-700 rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-white">
                  {dayNames[selectedDay]}
                </h4>
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={weeklySchedule[selectedDay].active}
                      onChange={(e) => setWeeklySchedule(prev => ({
                        ...prev,
                        [selectedDay]: { ...prev[selectedDay], active: e.target.checked }
                      }))}
                      className="w-4 h-4 text-purple-600 bg-slate-600 border-slate-500 rounded"
                    />
                    <span className="text-white">Jour d'entraînement</span>
                  </label>
                  <button
                    onClick={() => setShowExerciseModal(true)}
                    disabled={!weeklySchedule[selectedDay].active}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg flex items-center space-x-1"
                  >
                    <Plus size={16} />
                    <span>Exercice</span>
                  </button>
                </div>
              </div>

              {weeklySchedule[selectedDay].active && (
                <div className="space-y-3">
                  {weeklySchedule[selectedDay].exercises.map((exercise, index) => (
                    <div key={exercise.id} className="bg-slate-800 p-4 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-white font-medium">{exercise.name}</span>
                            <span className="text-xs bg-slate-600 text-gray-300 px-2 py-1 rounded">
                              {exercise.muscle}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300 space-x-4">
                            <span>{exercise.sets} séries</span>
                            <span>{exercise.reps} reps</span>
                            <span>{exercise.rest}s repos</span>
                            <span className="capitalize">{exercise.intensity}</span>
                          </div>
                          {exercise.notes && (
                            <div className="text-xs text-gray-400 mt-1">{exercise.notes}</div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingExercise(exercise);
                              setShowExerciseModal(true);
                            }}
                            className="p-2 bg-slate-600 hover:bg-slate-500 text-white rounded"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => setWeeklySchedule(prev => ({
                              ...prev,
                              [selectedDay]: {
                                ...prev[selectedDay],
                                exercises: prev[selectedDay].exercises.filter(ex => ex.id !== exercise.id)
                              }
                            }))}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {weeklySchedule[selectedDay].exercises.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      Aucun exercice ajouté pour ce jour
                    </div>
                  )}
                </div>
              )}

              {!weeklySchedule[selectedDay].active && (
                <div className="text-center py-8 text-gray-400">
                  Jour de repos
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-slate-700">
          <div className="text-sm text-gray-400">
            {Object.values(weeklySchedule).filter(day => day.active).length} jours d'entraînement par semaine
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveProgram}
              disabled={!programName.trim()}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-600 text-white rounded-lg flex items-center space-x-2"
            >
              <Save size={16} />
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
      </div>

      {showExerciseModal && <ExerciseModal />}
    </div>
  );
};

export default ProgramEditor;