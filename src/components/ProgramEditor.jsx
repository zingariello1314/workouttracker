import React, { useState, useEffect } from 'react';
import { Plus, X, Save, Copy, Trash2, Edit3, Target, Clock, Dumbbell, Calendar, Sunrise, Sun, Sunset } from 'lucide-react';

const ProgramEditor = ({ isOpen, onClose, onSave, initialProgram = null }) => {
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [programDuration, setProgramDuration] = useState(12);
  const [programGoal, setProgramGoal] = useState('strength');
  const [selectedDay, setSelectedDay] = useState('monday');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showStretchModal, setShowStretchModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [stretchType, setStretchType] = useState('matin'); // matin, midi, soir

  const [weeklySchedule, setWeeklySchedule] = useState({
    monday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    },
    tuesday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    },
    wednesday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    },
    thursday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    },
    friday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    },
    saturday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    },
    sunday: { 
      active: false, 
      exercises: [], 
      name: '',
      focus: '',
      duration: 0,
      notes: '',
      etirements: {
        matin: [],
        midi: [],
        soir: []
      }
    }
  });

  // Exercise modal states
  const [exerciseName, setExerciseName] = useState('');
  const [exerciseSets, setExerciseSets] = useState('');
  const [exerciseReps, setExerciseReps] = useState('');
  const [exerciseRest, setExerciseRest] = useState('');
  const [exerciseMuscle, setExerciseMuscle] = useState('pectoraux');
  const [exerciseIntensity, setExerciseIntensity] = useState('moderate');
  const [exerciseNotes, setExerciseNotes] = useState('');
  const [exerciseMaterial, setExerciseMaterial] = useState('');
  const [exerciseType, setExerciseType] = useState('normal');
  const [exerciseSeries, setExerciseSeries] = useState('');

  // Stretch modal states
  const [stretchName, setStretchName] = useState('');
  const [stretchDuration, setStretchDuration] = useState('');
  const [stretchInstructions, setStretchInstructions] = useState('');

  const dayNames = {
    monday: 'Lundi',
    tuesday: 'Mardi',
    wednesday: 'Mercredi',
    thursday: 'Jeudi',
    friday: 'Vendredi',
    saturday: 'Samedi',
    sunday: 'Dimanche'
  };

  const goals = [
    { id: 'strength', label: 'Force', color: 'red' },
    { id: 'muscle', label: 'Muscle', color: 'blue' },
    { id: 'endurance', label: 'Endurance', color: 'green' },
    { id: 'weight_loss', label: 'Perte de poids', color: 'yellow' }
  ];

  const muscleGroups = [
    'pectoraux', 'dos', 'épaules', 'biceps', 'triceps', 'jambes', 
    'quadriceps', 'ischio-jambiers', 'mollets', 'abdominaux', 'fessiers'
  ];

  const exerciseTypes = [
    { id: 'normal', label: 'Normal' },
    { id: 'circuit', label: 'Circuit' },
    { id: 'superset', label: 'Superset' },
    { id: 'circuit_abdos', label: 'Circuit Abdos' },
    { id: 'finisher', label: 'Finisher' }
  ];

  const materials = [
    'Aucun', 'Haltères', 'Barre', 'Élastiques', 'Kettlebell', 'Machine', 
    'Banc', 'Tapis', 'Swiss Ball', 'TRX', 'Corde à sauter'
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

  useEffect(() => {
    if (initialProgram) {
      setProgramName(initialProgram.name || '');
      setProgramDescription(initialProgram.description || '');
      setProgramDuration(initialProgram.duration || 12);
      setProgramGoal(initialProgram.goal || 'strength');
      if (initialProgram.schedule) {
        setWeeklySchedule(initialProgram.schedule);
      }
    }
  }, [initialProgram]);

  // Reset exercise modal states
  const resetExerciseModal = () => {
    setExerciseName('');
    setExerciseSets('');
    setExerciseReps('');
    setExerciseRest('');
    setExerciseMuscle('pectoraux');
    setExerciseIntensity('moderate');
    setExerciseNotes('');
    setExerciseMaterial('');
    setExerciseType('normal');
    setExerciseSeries('');
  };

  // Reset stretch modal states
  const resetStretchModal = () => {
    setStretchName('');
    setStretchDuration('');
    setStretchInstructions('');
  };

  // Stretch Modal Component
  const StretchModal = () => {
    const handleSaveStretch = () => {
      if (!stretchName.trim()) return;

      const stretch = {
        id: Date.now() + Math.random(),
        name: stretchName,
        duration: stretchDuration,
        instructions: stretchInstructions
      };

      setWeeklySchedule(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          etirements: {
            ...prev[selectedDay].etirements,
            [stretchType]: [...prev[selectedDay].etirements[stretchType], stretch]
          }
        }
      }));

      setShowStretchModal(false);
      resetStretchModal();
    };

    const stretchIcons = {
      matin: Sunrise,
      midi: Sun,
      soir: Sunset
    };

    const StretchIcon = stretchIcons[stretchType];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-slate-800 rounded-lg p-6 w-full max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white flex items-center space-x-2">
              <StretchIcon size={24} />
              <span>Ajouter un étirement - {stretchType}</span>
            </h3>
            <button
              onClick={() => setShowStretchModal(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de l'étirement
              </label>
              <input
                type="text"
                value={stretchName}
                onChange={(e) => setStretchName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Ex: Étirement des quadriceps"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Durée
              </label>
              <input
                type="text"
                value={stretchDuration}
                onChange={(e) => setStretchDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Ex: 30 sec, 1 min"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Instructions
              </label>
              <textarea
                value={stretchInstructions}
                onChange={(e) => setStretchInstructions(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows="3"
                placeholder="Instructions détaillées pour l'étirement"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => setShowStretchModal(false)}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveStretch}
              disabled={!stretchName.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white rounded-lg"
            >
              Ajouter
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Exercise Modal Component
  const ExerciseModal = () => {
    useEffect(() => {
      if (editingExercise) {
        setExerciseName(editingExercise.name || '');
        setExerciseSets(editingExercise.sets || '');
        setExerciseReps(editingExercise.reps || '');
        setExerciseRest(editingExercise.rest || '');
        setExerciseMuscle(editingExercise.muscle || 'pectoraux');
        setExerciseIntensity(editingExercise.intensity || 'moderate');
        setExerciseNotes(editingExercise.notes || '');
        setExerciseMaterial(editingExercise.materiel || '');
        setExerciseType(editingExercise.type || 'normal');
        setExerciseSeries(editingExercise.series || '');
      } else {
        resetExerciseModal();
      }
    }, [editingExercise]);

    const handleSaveExercise = () => {
      if (!exerciseName.trim()) return;

      const exercise = {
        id: editingExercise?.id || Date.now() + Math.random(),
        name: exerciseName,
        sets: exerciseSets,
        reps: exerciseReps,
        rest: exerciseRest,
        muscle: exerciseMuscle,
        intensity: exerciseIntensity,
        notes: exerciseNotes,
        materiel: exerciseMaterial,
        type: exerciseType,
        series: exerciseSeries || `${exerciseSets}x${exerciseReps}`
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
      resetExerciseModal();
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
                resetExerciseModal();
              }}
              className="text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nom de l'exercice
              </label>
              <input
                type="text"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Ex: Développé couché"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  Type d'exercice
                </label>
                <select
                  value={exerciseType}
                  onChange={(e) => setExerciseType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {exerciseTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Format des séries (flexible)
              </label>
              <input
                type="text"
                value={exerciseSeries}
                onChange={(e) => setExerciseSeries(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                placeholder="Ex: 4x4-6, 3x8-12, 30 sec, 4x max"
              />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Matériel
                </label>
                <select
                  value={exerciseMaterial}
                  onChange={(e) => setExerciseMaterial(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                >
                  {materials.map(material => (
                    <option key={material} value={material}>{material}</option>
                  ))}
                </select>
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
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Notes techniques
              </label>
              <textarea
                value={exerciseNotes}
                onChange={(e) => setExerciseNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                rows="3"
                placeholder="Instructions spéciales, technique, conseils..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={() => {
                setShowExerciseModal(false);
                setEditingExercise(null);
                resetExerciseModal();
              }}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg"
            >
              Annuler
            </button>
            <button
              onClick={handleSaveExercise}
              disabled={!exerciseName.trim()}
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
                </div>
              </div>

              {weeklySchedule[selectedDay].active && (
                <div className="space-y-6">
                  {/* Day Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nom de la séance
                      </label>
                      <input
                        type="text"
                        value={weeklySchedule[selectedDay].name}
                        onChange={(e) => setWeeklySchedule(prev => ({
                          ...prev,
                          [selectedDay]: { ...prev[selectedDay], name: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        placeholder="Ex: Push Day"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Focus musculaire
                      </label>
                      <input
                        type="text"
                        value={weeklySchedule[selectedDay].focus}
                        onChange={(e) => setWeeklySchedule(prev => ({
                          ...prev,
                          [selectedDay]: { ...prev[selectedDay], focus: e.target.value }
                        }))}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        placeholder="Ex: Pectoraux, Épaules"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Durée estimée (min)
                      </label>
                      <input
                        type="number"
                        value={weeklySchedule[selectedDay].duration}
                        onChange={(e) => setWeeklySchedule(prev => ({
                          ...prev,
                          [selectedDay]: { ...prev[selectedDay], duration: parseInt(e.target.value) || 0 }
                        }))}
                        className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                        placeholder="60"
                      />
                    </div>
                  </div>

                  {/* Stretches Section */}
                  <div className="bg-slate-800 rounded-lg p-4">
                    <h5 className="text-lg font-semibold text-white mb-4">Étirements</h5>
                    <div className="grid grid-cols-3 gap-4">
                      {['matin', 'midi', 'soir'].map(period => {
                        const icons = { matin: Sunrise, midi: Sun, soir: Sunset };
                        const Icon = icons[period];
                        return (
                          <div key={period} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h6 className="text-white font-medium flex items-center space-x-1">
                                <Icon size={16} />
                                <span className="capitalize">{period}</span>
                              </h6>
                              <button
                                onClick={() => {
                                  setStretchType(period);
                                  setShowStretchModal(true);
                                }}
                                className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <div className="space-y-1">
                              {weeklySchedule[selectedDay].etirements[period].map(stretch => (
                                <div key={stretch.id} className="text-xs bg-slate-600 p-2 rounded">
                                  <div className="text-white font-medium">{stretch.name}</div>
                                  <div className="text-gray-300">{stretch.duration}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Exercises Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h5 className="text-lg font-semibold text-white">Exercices</h5>
                      <button
                        onClick={() => setShowExerciseModal(true)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-1"
                      >
                        <Plus size={16} />
                        <span>Exercice</span>
                      </button>
                    </div>

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
                                {exercise.type !== 'normal' && (
                                  <span className="text-xs bg-purple-600 text-white px-2 py-1 rounded">
                                    {exerciseTypes.find(t => t.id === exercise.type)?.label}
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-gray-300 space-x-4">
                                <span>{exercise.sets || `${exercise.sets} séries`}</span>
                                {exercise.reps && <span>{exercise.reps} reps</span>}
                                {exercise.rest && <span>{exercise.rest}s repos</span>}
                                <span className="capitalize">{exercise.intensity}</span>
                                {exercise.materiel && exercise.materiel !== 'Aucun' && (
                                  <span className="text-blue-300">• {exercise.materiel}</span>
                                )}
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
                  </div>
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
      {showStretchModal && <StretchModal />}
    </div>
  );
};

export default ProgramEditor;